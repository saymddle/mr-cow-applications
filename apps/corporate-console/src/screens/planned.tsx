import { Icon, PageHeader, PlannedFeature } from "@mrcow/ui";

const planned = (path: string, title: string, icon: string, phase: string, body: string) => ({
  path,
  element: (
    <>
      <PageHeader title={title} />
      <PlannedFeature title={title} icon={<Icon name={icon} size={40} />} phase={phase}>{body}</PlannedFeature>
    </>
  ),
});

/** Screens whose features arrive in later phases. Navigation and permissions are already enforced. */
export const plannedScreens = [
  planned("/regions", "Regions", "map", "Phase 6", "Group locations into regions and assign regional managers."),
  planned("/franchisees", "Franchisees", "users", "Phase 6", "Franchise owners, their entities and the stores they operate."),
  planned("/analytics", "Reporting", "chart", "Phase 6", "Network, regional and store comparisons from TOGIVA's daily aggregates."),
  planned("/customers", "Customers", "user", "Phase 6", "Member lookup with privacy controls and support tools."),
  planned("/loyalty", "Loyalty program", "wallet", "Phase 4", "Earning rules, tiers and program versions. Mr. Cow's earning rates and tiers are still to be provided."),
  planned("/rewards", "Rewards", "gift", "Phase 4", "The reward catalog, store eligibility and inventory."),
  planned("/campaigns", "Campaigns", "megaphone", "Phase 6", "Network, regional and store campaigns and member offers."),
  planned("/pos", "POS integrations", "plug", "Phase 7", "Clover connections, webhook health and reconciliation across stores."),
  planned("/support", "Support cases", "support", "Phase 6", "Cases raised by franchise teams: disputes, POS issues and account problems."),
  planned("/staff", "Staff and roles", "users", "Phase 6", "Corporate and store staff, role assignments and invitations."),
  planned("/audit", "Audit log", "shield", "Phase 6", "Who changed what, when, across the organization."),
];
