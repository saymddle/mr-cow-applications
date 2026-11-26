import type { CustomerMembership, Me, Permission, StaffMembership } from "@mrcow/shared-types";

/**
 * Client-side access helpers. They only decide what to SHOW (navigation,
 * buttons). TOGIVA Core authorizes every request on the server regardless.
 */

export function staffMembershipFor(me: Me, organizationId: string): StaffMembership | undefined {
  return me.staffMemberships.find((m) => m.organization.id === organizationId);
}

export function customerMembershipFor(me: Me, organizationId: string): CustomerMembership | undefined {
  return me.customerMemberships.find((m) => m.organization.id === organizationId);
}

export function hasOrganizationPermission(m: StaffMembership | undefined, p: Permission): boolean {
  return Boolean(m?.organizationPermissions.includes(p));
}

export function hasLocationPermission(m: StaffMembership | undefined, locationId: string | null | undefined, p: Permission): boolean {
  if (!m || !locationId) return false;
  return Boolean(m.locations.find((l) => l.locationId === locationId)?.permissions.includes(p));
}

/** Locations where the user holds `p` (all staff locations when `p` is omitted). */
export function locationsWith(m: StaffMembership | undefined, p?: Permission) {
  return (m?.locations ?? []).filter((l) => !p || l.permissions.includes(p));
}

/** Franchise portal: anyone with staff access to at least one location. */
export function canUseFranchisePortal(m: StaffMembership | undefined): boolean {
  return locationsWith(m).length > 0;
}

/** Corporate console: anyone with organization-level permissions (corporate roles). */
export function canUseCorporateConsole(m: StaffMembership | undefined): boolean {
  return (m?.organizationPermissions.length ?? 0) > 0;
}

export interface NavItem {
  to: string;
  label: string;
  /** Optional icon key understood by the app's icon set. */
  icon?: string;
  /** Show when the user holds ANY of these. Omit for always-visible items. */
  anyOf?: Permission[];
  /** Where `anyOf` is evaluated: org-level permissions, or the active location's. */
  scope?: "organization" | "location";
}

export interface NavContext {
  membership: StaffMembership | undefined;
  activeLocationId?: string | null;
}

export function isNavItemVisible(item: NavItem, ctx: NavContext): boolean {
  if (!item.anyOf?.length) return true;
  return item.anyOf.some((p) =>
    item.scope === "location" ? hasLocationPermission(ctx.membership, ctx.activeLocationId, p) : hasOrganizationPermission(ctx.membership, p),
  );
}

export function visibleNav<T extends NavItem>(items: readonly T[], ctx: NavContext): T[] {
  return items.filter((i) => isNavItemVisible(i, ctx));
}
