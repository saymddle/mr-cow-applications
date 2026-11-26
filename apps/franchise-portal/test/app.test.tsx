import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { TogivaApiError, type TogivaClient } from "@mrcow/api-client";
import type { AuthAdapter } from "@mrcow/auth";
import type { Permission } from "@mrcow/shared-types";
import { App } from "../src/App";
import { readConfig } from "../src/config";

const ORG = { id: "00000000-0000-4000-8000-000000000001", slug: "mr-cow", name: "Org Name", status: "active" as const, defaultCurrency: "USD", defaultTimezone: "UTC" };
const A = "00000000-0000-4000-8000-0000000000a1";
const B = "00000000-0000-4000-8000-0000000000b2";
const config = readConfig({ VITE_TOGIVA_API_URL: "https://api.example.test", VITE_TOGIVA_ORGANIZATION_SLUG: "mr-cow" });
const session = { accessToken: "t", userId: "u1", email: "kim@example.test", emailVerified: true };
const auth: AuthAdapter = {
  kind: "supabase", getSession: async () => session, getAccessToken: async () => "t", onChange: () => () => {},
  signInWithPassword: async () => ({ ok: true }), signUp: async () => ({ ok: true }), sendPasswordReset: async () => ({ ok: true }), signOut: async () => {},
};

const verification = { id: "red-1", status: "issued", reward: { id: "r1", name: "Small Treat", posDiscountRef: null }, customer: { firstName: "Sam", membershipLast4: "0057" }, locationId: A, expiresAt: "2026-11-26T20:00:00Z", completedAt: null };
const redemptions = {
  verify: async (_o: string, _l: string, body: { token: string }) => {
    if (body.token !== "AB12-CD34-EF56-GH78") throw new TogivaApiError(404, "redemption_invalid", "bad");
    return verification;
  },
  complete: async () => ({ ...verification, status: "completed", completedAt: "2026-11-26T19:00:00Z" }),
};

function api(locations: Record<string, Permission[]>, orgPerms: Permission[] = []) {
  return {
    redemptions,
    organizationBySlug: async () => ORG,
    getLocation: async (_o: string, id: string) => ({
      id, organizationId: ORG.id, storeCode: id === A ? "A-01" : "B-02", name: id === A ? "Alpha Store" : "Beta Store", status: "active", loyaltyParticipating: true,
      timezone: "UTC", address: { line1: null, line2: null, city: null, regionCode: null, postalCode: null, countryCode: null }, latitude: null, longitude: null, phone: null,
    }),
    me: async () => ({
      user: { id: "u1", email: "kim@example.test", emailVerified: true, firstName: "Kim", lastName: null },
      isPlatformAdmin: false, customerMemberships: [],
      staffMemberships: Object.keys(locations).length || orgPerms.length ? [{
        organization: ORG, organizationPermissions: orgPerms,
        roles: [{ roleKey: "general_manager", roleName: "General manager", scope: "location", scopeId: A }],
        locations: Object.entries(locations).map(([locationId, permissions]) => ({ locationId, name: locationId === A ? "Alpha Store" : "Beta Store", permissions })),
      }] : [],
    }),
  } as unknown as TogivaClient;
}

const renderAt = (path: string, c: TogivaClient) => render(<MemoryRouter initialEntries={[path]}><App config={config} auth={auth} api={c} /></MemoryRouter>);
const navLabels = () => within(screen.getAllByRole("navigation", { name: "Main" })[0]!).getAllByRole("link").map((a) => a.textContent);

beforeEach(() => localStorage.clear());

describe("franchise portal", () => {
  it("shows a general manager the store tools their role allows, with live store data", async () => {
    renderAt("/", api({ [A]: ["location.read", "customer.identify", "connection.associate", "staff.read", "staff.manage", "analytics.location.read", "support.submit"] }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Alpha Store" })).toBeTruthy());
    expect(navLabels()).toEqual(["Today", "Identify customer", "Store performance", "Team", "Support"]);
    expect(screen.getByText("General manager")).toBeTruthy();
  });

  it("re-evaluates navigation when switching stores", async () => {
    renderAt("/", api({ [A]: ["location.read", "customer.identify"], [B]: ["location.read"] }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Alpha Store" })).toBeTruthy());
    expect(navLabels()).toEqual(["Today", "Identify customer"]);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: B } });
    await waitFor(() => expect(screen.getByRole("heading", { name: "Beta Store" })).toBeTruthy());
    expect(navLabels()).toEqual(["Today"]);
  });

  it("explains a direct link to a screen the role doesn't allow", async () => {
    renderAt("/team", api({ [A]: ["location.read"] }));
    await waitFor(() => expect(screen.getByText("Not available at this store")).toBeTruthy());
  });

  it("turns away users with no store access", async () => {
    renderAt("/", api({}, ["analytics.network.read"]));
    await waitFor(() => expect(screen.getByText("No store access yet")).toBeTruthy());
  });

  it("offers sign-in without self sign-up", async () => {
    const signedOut = { ...auth, getSession: async () => null };
    render(<MemoryRouter><App config={config} auth={signedOut} api={api({})} /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Sign in" })).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Create an account" })).toBeNull();
  });

  it("lets a cashier check a reward code and mark it used", async () => {
    renderAt("/redemptions", api({ [A]: ["location.read", "rewards.redeem.verify"] }));
    const input = await screen.findByLabelText("Reward code");
    fireEvent.change(input, { target: { value: "ZZZZ-ZZZZ" } });
    fireEvent.click(screen.getByRole("button", { name: "Check code" }));
    await waitFor(() => expect(screen.getByText(/isn't a valid reward/)).toBeTruthy());
    fireEvent.change(input, { target: { value: "AB12-CD34-EF56-GH78" } });
    fireEvent.click(screen.getByRole("button", { name: "Check code" }));
    await waitFor(() => expect(screen.getByText("For Sam · member ending 0057")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Mark as used" }));
    await waitFor(() => expect(screen.getByText("Small Treat redeemed")).toBeTruthy());
  });
});
