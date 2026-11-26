import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import type { TogivaClient } from "@mrcow/api-client";
import type { AuthAdapter, AuthSession } from "@mrcow/auth";
import { App } from "../src/App";
import { readConfig } from "../src/config";

const ORG = { id: "00000000-0000-4000-8000-000000000001", slug: "mr-cow", name: "Org Name", status: "active" as const, defaultCurrency: "USD", defaultTimezone: "UTC" };
const config = readConfig({ VITE_TOGIVA_API_URL: "https://api.example.test", VITE_TOGIVA_ORGANIZATION_SLUG: "mr-cow" });

function auth(session: AuthSession | null): AuthAdapter {
  return {
    kind: "supabase", getSession: async () => session, getAccessToken: async () => session?.accessToken ?? null, onChange: () => () => {},
    signInWithPassword: async () => ({ ok: true }), signUp: async () => ({ ok: true }), sendPasswordReset: async () => ({ ok: true }), signOut: async () => {},
  };
}
const api = (membership: boolean) => ({
  organizationBySlug: async () => ORG,
  me: async () => ({
    user: { id: "u1", email: "sam@example.test", emailVerified: true, firstName: "Sam", lastName: null },
    isPlatformAdmin: false, staffMemberships: [],
    customerMemberships: membership ? [{ organization: ORG, organizationCustomerId: "c1", membershipNumber: "4821930057", status: "active", joinedAt: "2026-11-01T00:00:00Z", preferredLocationId: null }] : [],
  }),
}) as unknown as TogivaClient;

const session = { accessToken: "t", userId: "u1", email: "sam@example.test", emailVerified: true };
const renderAt = (path: string, a: AuthAdapter | null, c = api(true)) =>
  render(<MemoryRouter initialEntries={[path]}><App config={config} auth={a} api={c} /></MemoryRouter>);

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

  it("tells a signed-in non-member they have not joined", async () => {
    renderAt("/", auth(session), api(false));
    await waitFor(() => expect(screen.getByText("Not joined yet")).toBeTruthy());
  });

  it("routes to account details", async () => {
    renderAt("/account", auth(session));
    await waitFor(() => expect(screen.getByText("sam@example.test")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });
});
