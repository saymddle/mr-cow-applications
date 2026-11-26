import { useEffect, useState } from "react";
import { useSession } from "@mrcow/auth";
import type { LocationSummary, StaffMembership } from "@mrcow/shared-types";
import { Card, ErrorState, LoadingState, PageHeader, StatusPill } from "@mrcow/ui";

/** Store overview from live TOGIVA data: the store record and the user's roles. */
export function TodayScreen({ membership, organizationId, locationId }: { membership: StaffMembership; organizationId: string; locationId: string }) {
  const { api } = useSession();
  const [state, setState] = useState<{ location?: LocationSummary; error?: Error & { requestId?: string } }>({});

  useEffect(() => {
    let live = true;
    setState({});
    api.getLocation(organizationId, locationId).then(
      (location) => { if (live) setState({ location }); },
      (error: Error) => { if (live) setState({ error }); },
    );
    return () => { live = false; };
  }, [api, organizationId, locationId]);

  const roles = membership.roles.filter((r) => r.scope !== "location" || r.scopeId === locationId);
  const perms = membership.locations.find((l) => l.locationId === locationId)?.permissions ?? [];
  if (state.error) return <ErrorState message={state.error.message} requestId={state.error.requestId} />;
  if (!state.location) return <LoadingState label="Loading store" />;
  const l = state.location;
  const address = [l.address.line1, l.address.line2, [l.address.city, l.address.regionCode].filter(Boolean).join(", "), l.address.postalCode].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader eyebrow={`Store ${l.storeCode}`} title={l.name} description={address || undefined} />
      <div className="ui-grid">
        <Card>
          <h2 className="card-title">Store status</h2>
          <div className="ui-row">
            <StatusPill tone={l.status === "active" ? "success" : "warning"}>{l.status}</StatusPill>
            <StatusPill tone={l.loyaltyParticipating ? "success" : "neutral"}>{l.loyaltyParticipating ? "Loyalty on" : "Loyalty off"}</StatusPill>
          </div>
          <p className="ui-muted small">Time zone {l.timezone}{l.phone ? ` · ${l.phone}` : ""}</p>
        </Card>
        <Card>
          <h2 className="card-title">Your access</h2>
          <ul className="plain-list">
            {roles.map((r) => <li key={`${r.roleKey}-${r.scopeId}`}>{r.roleName} <span className="ui-muted">({r.scope})</span></li>)}
          </ul>
          <p className="ui-muted small">{perms.length} permissions at this store</p>
        </Card>
      </div>
    </>
  );
}
