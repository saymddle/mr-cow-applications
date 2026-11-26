import { useState } from "react";
import { Button, Card, EmptyState, ErrorState, Field, Icon, LoadingState, StatusPill } from "@mrcow/ui";
import { directionsUrl, formatAddress, useMyStore, useStores } from "../data";
import { ScreenTitle, useMembership } from "./common";

export function StoresScreen() {
  const { organization, membership } = useMembership();
  const [stores, reload] = useStores(organization?.id);
  const [myStore, setMyStore] = useMyStore(membership?.preferredLocationId);
  const [query, setQuery] = useState("");

  return (
    <div className="ui-stack">
      <ScreenTitle eyebrow="Near you" title="Stores" />
      {stores.status === "loading" ? <LoadingState label="Finding stores" /> : null}
      {stores.status === "error" ? <ErrorState message={stores.error.message} requestId={stores.error.requestId} onRetry={() => void reload()} /> : null}
      {stores.status === "ready" ? (
        stores.data.length === 0 ? (
          <Card><EmptyState icon={<Icon name="pin" size={40} />} title="No stores yet">Participating stores will be listed here.</EmptyState></Card>
        ) : (
          <>
            {stores.data.length > 6 ? (
              <Field label="Search stores" type="search" placeholder="City, state or store name" value={query} onChange={(e) => setQuery(e.target.value)} />
            ) : null}
            <ul className="store-list">
              {stores.data
                .filter((s) => !query.trim() || `${s.name} ${formatAddress(s)}`.toLowerCase().includes(query.trim().toLowerCase()))
                .map((s) => {
                  const dir = directionsUrl(s);
                  const mine = s.id === myStore;
                  return (
                    <li key={s.id}>
                      <Card as="article" className={mine ? "store store--mine" : "store"}>
                        <div className="store__head">
                          <h2 className="store__name">{s.name}</h2>
                          {mine ? <StatusPill tone="info">My store</StatusPill> : null}
                        </div>
                        {formatAddress(s) ? <p className="store__addr">{formatAddress(s)}</p> : null}
                        <div className="store__actions">
                          {dir ? <a className="ui-btn ui-btn--secondary ui-btn--sm" href={dir} target="_blank" rel="noreferrer">Directions</a> : null}
                          {s.phone ? <a className="ui-btn ui-btn--secondary ui-btn--sm" href={`tel:${s.phone}`}>Call</a> : null}
                          {!mine ? <Button size="sm" variant="accent" onClick={() => setMyStore(s.id)}>Make my store</Button> : null}
                        </div>
                      </Card>
                    </li>
                  );
                })}
            </ul>
          </>
        )
      ) : null}
    </div>
  );
}
