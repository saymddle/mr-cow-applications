import type { Me, Permission, StaffMembership } from "@mrcow/shared-types";

export const ORG = { id: "00000000-0000-4000-8000-000000000001", slug: "test-org", name: "Test Org", status: "active" as const, defaultCurrency: "USD", defaultTimezone: "UTC" };
export const L1 = "00000000-0000-4000-8000-0000000000a1";
export const L2 = "00000000-0000-4000-8000-0000000000a2";

export function staff(orgPerms: Permission[], locations: Record<string, Permission[]>): StaffMembership {
  return {
    organization: ORG,
    roles: [],
    organizationPermissions: orgPerms,
    locations: Object.entries(locations).map(([locationId, permissions]) => ({ locationId, name: locationId, permissions })),
  };
}

export function me(over: Partial<Me> = {}): Me {
  return {
    user: { id: "00000000-0000-4000-8000-0000000000u1", email: "pat@example.test", emailVerified: true, firstName: "Pat", lastName: null },
    isPlatformAdmin: false,
    staffMemberships: [],
    customerMemberships: [],
    ...over,
  };
}
