import { useCallback, useEffect, useState } from "react";
import { useSession } from "@mrcow/auth";
import type { LocationSummary } from "@mrcow/shared-types";
import { Button, EmptyState, ErrorState, LoadingState, PageHeader, StatusPill, Table, type StatusTone } from "@mrcow/ui";

const tone: Record<LocationSummary["status"], StatusTone> = { active: "success", pending: "warning", inactive: "neutral", closed: "danger" };

/** Live list of the organization's locations from TOGIVA Core (paged). */
export function LocationsScreen({ organizationId }: { organizationId: string }) {
  const { api } = useSession();
  const [rows, setRows] = useState<LocationSummary[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<(Error & { requestId?: string }) | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (after: string | null) => {
      setBusy(true);
      setError(null);
      try {
        const page = await api.listLocations(organizationId, { limit: 50, ...(after ? { cursor: after } : {}) });
        setRows((prev) => [...(after ? (prev ?? []) : []), ...page.items]);
        setCursor(page.nextCursor);
      } catch (e) {
        setError(e as Error);
      } finally {
        setBusy(false);
      }
    },
    [api, organizationId],
  );

  useEffect(() => {
    void load(null);
  }, [load]);

  return (
    <>
      <PageHeader title="Locations" description="Every store in the network, as recorded in TOGIVA." />
      {error ? <ErrorState message={error.message} requestId={error.requestId} onRetry={() => void load(null)} /> : null}
      {!rows && !error ? <LoadingState label="Loading locations" /> : null}
      {rows ? (
        <Table
          rows={rows}
          rowKey={(r) => r.id}
          empty={<EmptyState title="No locations yet">Locations appear here once they are added during onboarding.</EmptyState>}
          columns={[
            { key: "code", header: "Store", render: (r) => r.storeCode },
            { key: "name", header: "Name", render: (r) => r.name },
            { key: "city", header: "City", render: (r) => [r.address.city, r.address.regionCode].filter(Boolean).join(", ") || "—" },
            { key: "status", header: "Status", render: (r) => <StatusPill tone={tone[r.status]}>{r.status}</StatusPill> },
            { key: "loyalty", header: "Loyalty", render: (r) => (r.loyaltyParticipating ? "On" : "Off") },
          ]}
        />
      ) : null}
      {cursor ? <div style={{ marginTop: 16 }}><Button variant="secondary" loading={busy} onClick={() => void load(cursor)}>Load more</Button></div> : null}
    </>
  );
}
