import type { NavItem } from "@mrcow/auth";

export interface Section { label: string; items: (NavItem & { icon: string })[] }

/** Corporate console navigation; every item is gated by an organization-level permission. */
export const corporateNav: Section[] = [
  {
    label: "Network",
    items: [
      { to: "/", label: "Overview", icon: "chart" },
      { to: "/locations", label: "Locations", icon: "store", anyOf: ["location.read"], scope: "organization" },
      { to: "/regions", label: "Regions", icon: "map", anyOf: ["region.read"], scope: "organization" },
      { to: "/franchisees", label: "Franchisees", icon: "users", anyOf: ["franchise.read"], scope: "organization" },
      { to: "/analytics", label: "Reporting", icon: "chart", anyOf: ["analytics.network.read"], scope: "organization" },
    ],
  },
  {
    label: "Members",
    items: [
      { to: "/customers", label: "Customers", icon: "user", anyOf: ["customer.read_membership"], scope: "organization" },
      { to: "/loyalty", label: "Loyalty program", icon: "wallet", anyOf: ["loyalty.read", "loyalty.configure"], scope: "organization" },
      { to: "/rewards", label: "Rewards", icon: "gift", anyOf: ["rewards.read", "rewards.manage"], scope: "organization" },
      { to: "/campaigns", label: "Campaigns", icon: "megaphone", anyOf: ["campaigns.read", "campaigns.manage"], scope: "organization" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/pos", label: "POS integrations", icon: "plug", anyOf: ["pos.read", "pos.manage"], scope: "organization" },
      { to: "/support", label: "Support cases", icon: "support", anyOf: ["support.resolve"], scope: "organization" },
      { to: "/staff", label: "Staff and roles", icon: "users", anyOf: ["staff.read", "staff.manage"], scope: "organization" },
      { to: "/audit", label: "Audit log", icon: "shield", anyOf: ["audit.read"], scope: "organization" },
    ],
  },
];

export const allCorporateItems = corporateNav.flatMap((s) => s.items);
