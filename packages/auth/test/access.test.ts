import { describe, expect, it } from "vitest";
import {
  canUseCorporateConsole, canUseFranchisePortal, customerMembershipFor, hasLocationPermission, hasOrganizationPermission,
  locationsWith, staffMembershipFor, visibleNav, type NavItem,
} from "../src/access.js";
import { L1, L2, me, ORG, staff } from "./fixtures.js";

const gm = staff([], { [L1]: ["location.read", "staff.read", "staff.manage", "customer.identify", "connection.associate"] });
const employee = staff([], { [L1]: ["location.read", "customer.identify", "connection.associate"], [L2]: ["location.read"] });
const analyst = staff(["organization.read", "analytics.network.read"], {});

describe("permission helpers", () => {
  it("finds memberships by organization", () => {
    const m = me({ staffMemberships: [gm] });
    expect(staffMembershipFor(m, ORG.id)).toBe(gm);
    expect(staffMembershipFor(m, "other")).toBeUndefined();
    expect(customerMembershipFor(m, ORG.id)).toBeUndefined();
  });

  it("evaluates location permissions only for that location", () => {
    expect(hasLocationPermission(employee, L1, "customer.identify")).toBe(true);
    expect(hasLocationPermission(employee, L2, "customer.identify")).toBe(false);
    expect(hasLocationPermission(employee, null, "location.read")).toBe(false);
    expect(hasLocationPermission(undefined, L1, "location.read")).toBe(false);
  });

  it("keeps organization and location permissions separate", () => {
    expect(hasOrganizationPermission(gm, "staff.manage")).toBe(false);
    expect(hasOrganizationPermission(analyst, "analytics.network.read")).toBe(true);
  });

  it("lists locations holding a permission", () => {
    expect(locationsWith(employee, "customer.identify").map((l) => l.locationId)).toEqual([L1]);
    expect(locationsWith(employee).map((l) => l.locationId)).toEqual([L1, L2]);
  });

  it("decides which staff app a user may open", () => {
    expect(canUseFranchisePortal(gm)).toBe(true);
    expect(canUseFranchisePortal(analyst)).toBe(false);
    expect(canUseCorporateConsole(analyst)).toBe(true);
    expect(canUseCorporateConsole(gm)).toBe(false);
    expect(canUseFranchisePortal(undefined)).toBe(false);
  });
});

describe("role-based navigation", () => {
  const nav: NavItem[] = [
    { to: "/", label: "Today" },
    { to: "/identify", label: "Identify customer", anyOf: ["customer.identify"], scope: "location" },
    { to: "/team", label: "Team", anyOf: ["staff.read", "staff.manage"], scope: "location" },
    { to: "/network", label: "Network", anyOf: ["analytics.network.read"], scope: "organization" },
  ];
  const labels = (items: NavItem[]) => items.map((i) => i.label);

  it("shows a general manager their store tools", () => {
    expect(labels(visibleNav(nav, { membership: gm, activeLocationId: L1 }))).toEqual(["Today", "Identify customer", "Team"]);
  });
  it("changes with the active location", () => {
    expect(labels(visibleNav(nav, { membership: employee, activeLocationId: L1 }))).toEqual(["Today", "Identify customer"]);
    expect(labels(visibleNav(nav, { membership: employee, activeLocationId: L2 }))).toEqual(["Today"]);
  });
  it("shows organization items only for organization permissions", () => {
    expect(labels(visibleNav(nav, { membership: analyst }))).toEqual(["Today", "Network"]);
    expect(labels(visibleNav(nav, { membership: undefined }))).toEqual(["Today"]);
  });
});
