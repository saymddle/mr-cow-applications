import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { TogivaClient } from "@mrcow/api-client";
import type { AuthAdapter } from "@mrcow/auth";
import type { Permission } from "@mrcow/shared-types";
import { App } from "../src/App";
import { readConfig } from "../src/config";

const ORG = { id: "00000000-0000-4000-8000-000000000001", slug: "mr-cow", name: "Org Name", status: "active" as const, defaultCurrency: "USD", defaultTimezone: "UTC" };
const config = readConfig({ VITE_TOGIVA_API_URL: "https://api.example.test", VITE_TOGIVA_ORGANIZATION_SLUG: "mr-cow" });
const auth: AuthAdapter = {
  kind: "supabase", getSession: async () => ({ accessToken: "t", userId: "u1", email: "lee@example.test", emailVerified: true }), getAccessToken: async () => "t",
  onChange: () => () => {}, signInWithPassword: async () => ({ ok: true }), signUp: async () => ({ ok: true }), sendPasswordReset: async () => ({ ok: true }), signOut: async () => {},
};
const loc = (n: number) => ({
  id: `00000000-0000-4000-8000-00000000000${n}`, organizationId: ORG.id, storeCode: `S-0${n}`, name: `Store ${n}`, status: "active", loyaltyParticipating: true, timezone: "UTC",
  address: { line1: null, line2: null, city: "Town", regionCode: "ST", postalCode: null, countryCode: "US" }, latitude: null, longitude: null, phone: null,
});

function api(orgPerms: Permission[], listLocations = vi.fn(async () => ({ items: [loc(1)], nextCursor: null }))) {
  return {
    organizationBySlug: async () => ORG,
    listLocations,
    me: async () => ({
      user: { id: "u1", email: "lee@example.test", emailVerified: true, firstName: "Lee", lastName: null },
      isPlatformAdmin: false, customerMemberships: [],
      staffMemberships: [{ organization: ORG, organizationPermissions: orgPerms, roles: [{ roleKey: "corporate_analyst", roleName: "Corporate analyst", scope: "organization", scopeId: ORG.id }], locations: [] }],
    }),
  } as unknown as TogivaClient;
}
const renderAt = (path: string, c: TogivaClient) => render(<MemoryRouter initialEntries={[path]}><App config={config} auth={auth} api={c} /></MemoryRouter>);
const navLabels = () => within(screen.getByRole("navigation", { name: "Main" })).getAllByRole("link").map((a) => a.textContent);

describe("corporate console", () => {
  it("shows an analyst only the sections their permissions cover", async () => {
    renderAt("/", api(["organization.read", "location.read", "analytics.network.read", "campaigns.read"]));
    await waitFor(() => expect(screen.getByText("Welcome back, Lee")).toBeTruthy());
    expect(navLabels()).toEqual(["Overview", "Locations", "Reporting", "Campaigns"]);
  });

  it("lists locations from the API and pages with the cursor", async () => {
    const list = vi.fn()
      .mockResolvedValueOnce({ items: [loc(1)], nextCursor: "c1" })
      .mockResolvedValueOnce({ items: [loc(2)], nextCursor: null });
    renderAt("/locations", api(["location.read"], list));
    await waitFor(() => expect(screen.getByRole("cell", { name: "Store 1" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(screen.getByRole("cell", { name: "Store 2" })).toBeTruthy());
    expect(list).toHaveBeenLastCalledWith(ORG.id, { limit: 50, cursor: "c1" });
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("blocks direct links outside the role", async () => {
    renderAt("/audit", api(["organization.read"]));
    await waitFor(() => expect(screen.getByText("Not part of your role")).toBeTruthy());
  });

  it("sends store-only staff to the franchise portal", async () => {
    renderAt("/", api([]));
    await waitFor(() => expect(screen.getByText("Corporate access required")).toBeTruthy());
  });
});
