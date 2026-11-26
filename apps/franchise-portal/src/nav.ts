import type { NavItem } from "@mrcow/auth";

export interface Section { label: string; items: (NavItem & { icon: string })[] }

/**
 * Franchise portal navigation. Every item except "Today" requires a
 * permission at the ACTIVE location; switching stores re-evaluates it.
 * Permissions are TOGIVA's codes (see TOGIVA Core docs/SECURITY_AND_TENANCY.md).
 */
export const franchiseNav: Section[] = [
  {
    label: "Store",
    items: [
      { to: "/", label: "Today", icon: "store" },
      { to: "/identify", label: "Identify customer", icon: "code", anyOf: ["customer.identify", "connection.associate"], scope: "location" },
      { to: "/redemptions", label: "Verify rewards", icon: "gift", anyOf: ["rewards.redeem.verify"], scope: "location" },
      { to: "/transactions", label: "Transactions", icon: "receipt", anyOf: ["transactions.read"], scope: "location" },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/performance", label: "Store performance", icon: "chart", anyOf: ["analytics.location.read"], scope: "location" },
      { to: "/loyalty", label: "Loyalty activity", icon: "wallet", anyOf: ["loyalty.read"], scope: "location" },
    ],
  },
  {
    label: "Manage",
    items: [
      { to: "/team", label: "Team", icon: "users", anyOf: ["staff.read", "staff.manage"], scope: "location" },
      { to: "/pos", label: "POS connection", icon: "plug", anyOf: ["pos.read", "pos.manage"], scope: "location" },
      { to: "/support", label: "Support", icon: "support", anyOf: ["support.submit"], scope: "location" },
    ],
  },
];

export const allFranchiseItems = franchiseNav.flatMap((s) => s.items);
