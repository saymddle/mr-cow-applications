import { useCallback, useEffect, useState } from "react";
import { TogivaApiError } from "@mrcow/api-client";
import { useSession } from "@mrcow/auth";
import type { ActivityItem } from "@mrcow/shared-types";
import { Button, Card, EmptyState, ErrorState, Icon, LoadingState } from "@mrcow/ui";
import { ScreenTitle, useMembership } from "./common";
import { ProgramNotLive } from "./Home";

const money = (m: { amountMinor: number; currency: string }) => {
  const digits = new Intl.NumberFormat("en-US", { style: "currency", currency: m.currency }).resolvedOptions().maximumFractionDigits ?? 2;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: m.currency }).format(m.amountMinor / 10 ** digits);
};
const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const ICON: Record<ActivityItem["kind"], string> = {
  purchase_pending: "receipt", purchase_earned: "receipt", bonus: "gift", redemption: "gift", reversal: "receipt", adjustment: "wallet", expiration: "wallet",
};

/** Points history from TOGIVA's ledger, newest first. */
export function ActivityScreen() {
  const { api } = useSession();
  const { organization, membership } = useMembership();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable" | TogivaApiError>("loading");
  const orgId = organization?.id;

  const load = useCallback(async (after?: string) => {
    if (!orgId) return;
    try {
      const page = await api.loyalty.activity(orgId, { limit: 25, ...(after ? { cursor: after } : {}) });
      setItems((prev) => (after ? [...prev, ...page.items] : page.items));
      setCursor(page.nextCursor);
      setState("ready");
    } catch (e) {
      const err = e instanceof TogivaApiError ? e : new TogivaApiError(0, "client_error", String(e));
      setState(err.code === "loyalty_program_unavailable" ? "unavailable" : err);
    }
  }, [api, orgId]);
  useEffect(() => {
    if (membership) void load();
  }, [membership, load]);

  return (
    <div className="ui-stack">
      <ScreenTitle eyebrow="Your points" title="Activity" />
      {state === "loading" ? <LoadingState /> : null}
      {state === "unavailable" ? <ProgramNotLive /> : null}
      {state instanceof TogivaApiError ? <ErrorState title="Couldn't load activity" message={state.message} requestId={state.requestId} onRetry={() => void load()} /> : null}
      {state === "ready" && items.length === 0 ? (
        <Card><EmptyState icon={<Icon name="receipt" size={40} />} title="Nothing yet">Show your code at the counter and your purchases will appear here.</EmptyState></Card>
      ) : null}
      {items.length > 0 ? (
        <Card as="section" className="activity">
          <ul className="activity__list">
            {items.map((i) => {
              const total = i.points + i.bonusPoints;
              return (
                <li key={i.id} className="activity__item">
                  <Icon name={ICON[i.kind]} size={24} />
                  <div className="activity__body">
                    <p className="activity__title">{i.description}{i.location ? ` · ${i.location.name}` : ""}</p>
                    <p className="ui-muted small-print">
                      {when(i.occurredAt)}
                      {i.eligibleAmount ? ` · ${money(i.eligibleAmount)}` : ""}
                      {i.kind === "purchase_pending" && total > 0 ? " · pending" : ""}
                    </p>
                  </div>
                  <p className={`activity__points ${total < 0 ? "activity__points--neg" : ""}`}>
                    {total === 0 ? "" : `${total > 0 ? "+" : ""}${total.toLocaleString("en-US")}`}
                    {i.bonusPoints > 0 ? <span className="small-print"> incl. {i.bonusPoints} bonus</span> : null}
                  </p>
                </li>
              );
            })}
          </ul>
          {cursor ? <Button variant="secondary" onClick={() => void load(cursor)}>Load more</Button> : null}
        </Card>
      ) : null}
    </div>
  );
}
