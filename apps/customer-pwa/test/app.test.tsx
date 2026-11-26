import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TogivaApiError, type TogivaClient } from "@mrcow/api-client";
import type { AuthAdapter, AuthSession } from "@mrcow/auth";
import { App } from "../src/App";
import { readConfig } from "../src/config";

const ORG = { id: "00000000-0000-4000-8000-000000000001", slug: "mr-cow", name: "Org Name", status: "active" as const, defaultCurrency: "USD", defaultTimezone: "UTC" };
const S1 = "00000000-0000-4000-8000-000000000101";
const S2 = "00000000-0000-4000-8000-000000000102";
const config = readConfig({ VITE_TOGIVA_API_URL: "https://api.example.test", VITE_TOGIVA_ORGANIZATION_SLUG: "mr-cow" });
const session: AuthSession = { accessToken: "t", userId: "u1", email: "sam@example.test", emailVerified: true };

function auth(s: AuthSession | null): AuthAdapter {
  return {
    kind: "supabase", getSession: async () => s, getAccessToken: async () => s?.accessToken ?? null, onChange: () => () => {},
    signInWithPassword: async () => ({ ok: true }), signUp: async () => ({ ok: true }), sendPasswordReset: async () => ({ ok: true }), signOut: async () => {},
  };
}
const store = (id: string, name: string, extra: object = {}) => ({
  id, organizationId: ORG.id, storeCode: name.slice(0, 3), name, status: "active", loyaltyParticipating: true, timezone: "UTC",
  address: { line1: "1 Main St", line2: null, city: "Honolulu", regionCode: "HI", postalCode: "96813", countryCode: "US" }, latitude: null, longitude: null, phone: "808-555-0100", ...extra,
});
const membershipRow = { organization: ORG, organizationCustomerId: "c1", membershipNumber: "4821930057", status: "active", joinedAt: "2026-11-01T00:00:00Z", preferredLocationId: S1 };

function makeApi(opts: { member?: boolean } = {}) {
  let member = opts.member ?? true;
  let current: unknown = null;
  const api = {
    organizationBySlug: vi.fn(async () => ORG),
    me: vi.fn(async () => ({
      user: { id: "u1", email: "sam@example.test", emailVerified: true, firstName: "Sam", lastName: null },
      isPlatformAdmin: false, staffMemberships: [], customerMemberships: member ? [membershipRow] : [],
    })),
    listLocations: vi.fn(async () => ({ items: [store(S1, "Kaimuki"), store(S2, "Pearl City"), store("x", "Closed One", { status: "closed" })], nextCursor: null })),
    enroll: vi.fn(async () => { member = true; return membershipRow; }),
    connectionCodes: {
      current: vi.fn(async () => { if (!current) throw new TogivaApiError(404, "not_found", "none"); return current; }),
      issue: vi.fn(async (_o: string, body: { locationId: string }) => {
        const exp = new Date(Date.now() + 300_000).toISOString();
        current = { id: "code-1", status: "active", location: { id: body.locationId, name: "Kaimuki" }, expiresAt: exp, association: null };
        return { id: "code-1", code: "0871", status: "active", location: { id: body.locationId, name: "Kaimuki" }, issuedAt: new Date().toISOString(), expiresAt: exp, ttlSeconds: 300 };
      }),
      cancel: vi.fn(async () => { current = null; }),
    },
    setCurrent: (c: unknown) => { current = c; },
  };
  return api;
}

const renderAt = (path: string, a: AuthAdapter | null, api = makeApi()) =>
  render(<MemoryRouter initialEntries={[path]}><App config={config} auth={a} api={api as unknown as TogivaClient} /></MemoryRouter>);

beforeEach(() => localStorage.clear());

describe("customer PWA shell", () => {
  it("explains missing configuration instead of failing silently", () => {
    render(<MemoryRouter><App config={readConfig({})} auth={auth(null)} /></MemoryRouter>);
    expect(screen.getByText(/VITE_TOGIVA_API_URL, VITE_TOGIVA_ORGANIZATION_SLUG/)).toBeTruthy();
    render(<MemoryRouter><App config={config} auth={null} /></MemoryRouter>);
    expect(screen.getByText("Sign-in is not set up")).toBeTruthy();
  });

  it("shows sign-in with account creation when signed out", async () => {
    renderAt("/", auth(null));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Sign in" })).toBeTruthy());
    expect(screen.getByRole("button", { name: "Create an account" })).toBeTruthy();
  });

  it("greets a member with their member number and the five tabs", async () => {
    renderAt("/", auth(session));
    await waitFor(() => expect(screen.getByText("Hey, Sam!")).toBeTruthy());
    expect(screen.getByText("4821930057")).toBeTruthy();
    for (const tab of ["Home", "My code", "Rewards", "Stores", "Account"]) expect(screen.getAllByRole("link", { name: new RegExp(tab) }).length).toBeGreaterThan(0);
  });

  it("routes to account details", async () => {
    renderAt("/account", auth(session));
    await waitFor(() => expect(screen.getByText("sam@example.test")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });
});

describe("joining", () => {
  it("enrolls a signed-in non-member through TOGIVA and then shows their card", async () => {
    const api = makeApi({ member: false });
    renderAt("/", auth(session), api);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Join the membership" })).toBeTruthy());
    expect((screen.getByLabelText("First name") as HTMLInputElement).value).toBe("Sam");
    await waitFor(() => screen.getByRole("option", { name: "Pearl City" }));
    fireEvent.change(screen.getByLabelText("Your usual store (optional)"), { target: { value: S2 } });
    fireEvent.click(screen.getByRole("button", { name: "Join now" }));
    await waitFor(() => expect(screen.getByText("4821930057")).toBeTruthy());
    expect(api.enroll).toHaveBeenCalledWith(ORG.id, { firstName: "Sam", preferredLocationId: S2, consents: [] });
  });

  it("asks non-members to join before getting a code", async () => {
    renderAt("/code", auth(session), makeApi({ member: false }));
    await waitFor(() => expect(screen.getByText("Join first")).toBeTruthy());
  });
});

describe("store finder", () => {
  it("lists participating stores with directions and lets the customer pick theirs", async () => {
    renderAt("/stores", auth(session));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Kaimuki" })).toBeTruthy());
    expect(screen.queryByText("Closed One")).toBeNull();
    expect(screen.getAllByText("My store")).toHaveLength(1); // preferred store from enrollment
    const dir = screen.getAllByRole("link", { name: "Directions" })[0] as HTMLAnchorElement;
    expect(dir.href).toContain("google.com/maps/search");
    fireEvent.click(screen.getByRole("button", { name: "Make my store" }));
    expect(localStorage.getItem("mrcow.customer.my-store")).toBe(S2);
  });
});

describe("four-digit code", () => {
  it("issues a code for the chosen store, shows the digits with a countdown, and cancels", async () => {
    const api = makeApi();
    renderAt("/code", auth(session), api);
    await waitFor(() => screen.getByRole("button", { name: "Get my code" }));
    await waitFor(() => screen.getByRole("option", { name: "Kaimuki" }));
    fireEvent.click(screen.getByRole("button", { name: "Get my code" }));
    await waitFor(() => expect(screen.getByLabelText("Code 0 8 7 1")).toBeTruthy());
    expect(api.connectionCodes.issue).toHaveBeenCalledWith(ORG.id, { locationId: S1 });
    expect(screen.getByText(/Expires in [45]:\d\d/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel code" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Get my code" })).toBeTruthy());
    expect(api.connectionCodes.cancel).toHaveBeenCalled();
  });

  it("never shows digits it no longer has, and follows the purchase to confirmation", async () => {
    const api = makeApi();
    api.setCurrent({ id: "old", status: "active", location: { id: S1, name: "Kaimuki" }, expiresAt: new Date(Date.now() + 120_000).toISOString(), association: null });
    renderAt("/code", auth(session), api);
    await waitFor(() => expect(screen.getByText("Code active at Kaimuki")).toBeTruthy());
    expect(screen.queryByLabelText(/^Code \d/)).toBeNull();
    api.setCurrent({ id: "old", status: "consumed", location: { id: S1, name: "Kaimuki" }, expiresAt: new Date().toISOString(), association: { id: "a1", status: "confirmed", createdAt: new Date().toISOString(), confirmedAt: new Date().toISOString() } });
    await act(async () => { await new Promise((r) => setTimeout(r, 4200)); });
    await waitFor(() => expect(screen.getByText("Visit recorded")).toBeTruthy());
  }, 10000);

  it("explains rate limits in plain words", async () => {
    const api = makeApi();
    api.connectionCodes.issue.mockRejectedValueOnce(new TogivaApiError(429, "rate_limited", "Too many", "req-1", 600));
    renderAt("/code", auth(session), api);
    await waitFor(() => screen.getByRole("option", { name: "Kaimuki" }));
    fireEvent.click(screen.getByRole("button", { name: "Get my code" }));
    await waitFor(() => expect(screen.getByText(/Try again in 10 min/)).toBeTruthy());
  });
});
