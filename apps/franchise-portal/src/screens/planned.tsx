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
  planned("/identify", "Identify customer", "code", "Phase 5", "Enter a customer's four-digit code, confirm the member and attach the POS order. The TOGIVA Core endpoints for this are live; the screen comes next."),
  planned("/transactions", "Transactions", "receipt", "Phase 7", "Orders received from the POS and their loyalty status."),
  planned("/performance", "Store performance", "chart", "Phase 5", "Sales, member visits and reward activity for this store."),
  planned("/loyalty", "Loyalty activity", "wallet", "Phase 4", "Points earned and redeemed at this store, and adjustment requests."),
  planned("/team", "Team", "users", "Phase 5", "Invite staff, assign roles and remove access for this store."),
  planned("/pos", "POS connection", "plug", "Phase 7", "Clover connection status, sync health and reconciliation."),
  planned("/support", "Support", "support", "Phase 5", "Open and follow support cases with Mr. Cow corporate."),
];
