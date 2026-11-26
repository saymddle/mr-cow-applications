import { Link } from "react-router";
import { useSession } from "@mrcow/auth";
import type { StaffMembership } from "@mrcow/shared-types";
import { Card, PageHeader, PlannedFeature, Icon } from "@mrcow/ui";

export function OverviewScreen({ membership }: { membership: StaffMembership }) {
  const { session } = useSession();
  const name = session.status === "signed_in" ? session.me.user.firstName : null;
  const orgRoles = membership.roles.filter((r) => r.scope === "organization" || r.scope === "region");
  return (
    <>
      <PageHeader eyebrow={membership.organization.name} title={name ? `Welcome back, ${name}` : "Overview"} description="Network performance, members and operations across every location." />
      <div className="ui-grid">
        <Card>
          <h2 className="card-title">Your role</h2>
          <ul className="plain-list">{orgRoles.map((r) => <li key={`${r.roleKey}-${r.scopeId}`}>{r.roleName}</li>)}</ul>
          <p className="ui-muted small">{membership.organizationPermissions.length} organization permissions</p>
        </Card>
        <Card>
          <h2 className="card-title">Organization</h2>
          <p className="small" style={{ marginTop: 0 }}>Currency {membership.organization.defaultCurrency} · {membership.organization.defaultTimezone}</p>
          {membership.organizationPermissions.includes("location.read") ? <p className="small"><Link to="/locations">View all locations</Link></p> : null}
        </Card>
      </div>
      <div style={{ marginTop: 16 }}>
        <PlannedFeature title="Network dashboard" icon={<Icon name="chart" size={40} />} phase="Phase 6">
          Sales, member growth, visit frequency and reward activity by region and location, from TOGIVA's daily aggregates.
        </PlannedFeature>
      </div>
    </>
  );
}
