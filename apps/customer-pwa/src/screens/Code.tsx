import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { TogivaApiError } from "@mrcow/api-client";
import { useSession } from "@mrcow/auth";
import type { ConnectionCodeState, IssuedConnectionCode } from "@mrcow/shared-types";
import { Button, Card, EmptyState, ErrorState, Icon, LoadingState, StatusPill } from "@mrcow/ui";
import { useMyStore, useStores } from "../data";
import { ScreenTitle, useMembership } from "./common";

const POLL_MS = 4000;

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function friendly(e: TogivaApiError): string {
  switch (e.code) {
    case "rate_limited":
      return `You've asked for a lot of codes. Try again in ${e.retryAfterSeconds ? `${Math.ceil(e.retryAfterSeconds / 60)} min` : "a few minutes"}.`;
    case "location_not_participating":
      return "This store isn't taking membership codes right now. Choose another store.";
    case "membership_required":
      return "Join the membership program first.";
    default:
      return e.message;
  }
}

/**
 * The four-digit connection code, from TOGIVA Core's live service. The code
 * is shown only right after it is issued (TOGIVA never stores it in readable
 * form); after that the screen follows its status until the visit is recorded.
 */
export function CodeScreen() {
  const { api } = useSession();
  const { organization, membership } = useMembership();
  const [stores] = useStores(organization?.id);
  const [myStore, setMyStore] = useMyStore(membership?.preferredLocationId);
  const [issued, setIssued] = useState<IssuedConnectionCode | null>(null);
  const [current, setCurrent] = useState<ConnectionCodeState | null | "loading">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TogivaApiError | null>(null);
  const orgId = organization?.id;

  const refresh = useCallback(async () => {
    if (!orgId) return;
    try {
      setCurrent(await api.connectionCodes.current(orgId));
    } catch (e) {
      if (e instanceof TogivaApiError && e.status === 404) setCurrent(null);
      else if (e instanceof TogivaApiError) setError(e);
    }
  }, [api, orgId]);

  useEffect(() => {
    if (membership) void refresh();
  }, [membership, refresh]);

  // Follow the code while it is live, so the screen updates when the cashier enters it.
  const live = current !== "loading" && current !== null && (current.status === "active" || current.status === "reserved" || (current.status === "consumed" && current.association?.status === "pending_pos_confirmation"));
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [live, refresh]);

  const now = useNow(Boolean(issued) || live);

  if (!membership)
    return (
      <div className="ui-stack">
        <ScreenTitle eyebrow="At the counter" title="My code" />
        <Card><EmptyState icon={<Icon name="code" size={40} />} title="Join first" action={<Link className="ui-btn ui-btn--primary" to="/">Join on the home screen</Link>}>Codes are for members. Joining takes a few seconds.</EmptyState></Card>
      </div>
    );

  async function issue() {
    if (!orgId || !myStore) return;
    setBusy(true);
    setError(null);
    try {
      const code = await api.connectionCodes.issue(orgId, { locationId: myStore });
      setIssued(code);
      await refresh();
    } catch (e) {
      setError(e instanceof TogivaApiError ? e : new TogivaApiError(0, "client_error", String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!orgId) return;
    setBusy(true);
    try {
      await api.connectionCodes.cancel(orgId);
      setIssued(null);
      await refresh();
    } catch (e) {
      if (e instanceof TogivaApiError) setError(e);
    } finally {
      setBusy(false);
    }
  }

  const state = current === "loading" ? null : current;
  const showDigits = issued && state?.id === issued.id && state.status === "active" && new Date(issued.expiresAt).getTime() > now;
  const storeList = stores.status === "ready" ? stores.data : [];

  return (
    <div className="ui-stack">
      <ScreenTitle eyebrow="At the counter" title="My code">
        Show this code to the cashier so your visit is added to your membership.
      </ScreenTitle>

      {error ? <ErrorState title="That didn't work" message={friendly(error)} requestId={error.requestId} /> : null}
      {current === "loading" ? <LoadingState /> : null}

      {showDigits ? (
        <Card tone="inverse" className="code-card">
          <p className="code-card__label">Your code for {issued.location.name}</p>
          <p className="code-card__digits" aria-label={`Code ${issued.code.split("").join(" ")}`}>
            {issued.code.split("").map((d, i) => <span key={i} aria-hidden="true">{d}</span>)}
          </p>
          <p className="code-card__timer" aria-live="off">Expires in {mmss(new Date(issued.expiresAt).getTime() - now)}</p>
          <Button variant="secondary" loading={busy} onClick={() => void cancel()}>Cancel code</Button>
        </Card>
      ) : state && state.status !== "expired" && state.status !== "revoked" ? (
        <StatusCard state={state} now={now} busy={busy} onNew={() => void issue()} onCancel={() => void cancel()} />
      ) : current !== "loading" ? (
        <Card className="code-start">
          {stores.status === "loading" ? <LoadingState label="Loading stores" /> : null}
          {stores.status === "ready" && storeList.length === 0 ? <p>No participating stores yet.</p> : null}
          {storeList.length > 0 ? (
            <>
              <label className="code-start__store">
                <span>Store you're at</span>
                <select value={myStore ?? ""} onChange={(e) => setMyStore(e.target.value)}>
                  {!myStore ? <option value="" disabled>Choose a store</option> : null}
                  {storeList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <Button size="lg" block loading={busy} disabled={!myStore} onClick={() => void issue()}>
                Get my code
              </Button>
              <p className="ui-muted small-print">Codes work once, at the store you choose, for a few minutes.</p>
            </>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

function StatusCard({ state, now, busy, onNew, onCancel }: { state: ConnectionCodeState; now: number; busy: boolean; onNew: () => void; onCancel: () => void }) {
  const a = state.association;
  if (state.status === "reserved")
    return (
      <Card tone="accent" className="code-status" role="status">
        <StatusPill tone="info">In progress</StatusPill>
        <h2 className="ui-display code-status__title">The cashier has your code</h2>
        <p>Hang tight while they finish your order at {state.location.name}.</p>
      </Card>
    );
  if (state.status === "consumed")
    return (
      <Card className="code-status" role="status">
        <StatusPill tone={a?.status === "confirmed" ? "success" : a?.status === "rejected" || a?.status === "cancelled" ? "danger" : "warning"}>
          {a?.status === "confirmed" ? "Visit recorded" : a?.status === "needs_review" ? "Being checked" : a?.status === "rejected" || a?.status === "cancelled" ? "Not recorded" : "Purchase pending"}
        </StatusPill>
        <h2 className="ui-display code-status__title">
          {a?.status === "confirmed" ? "You're all set" : a?.status === "rejected" || a?.status === "cancelled" ? "This order wasn't added" : "Thanks for visiting!"}
        </h2>
        <p>
          {a?.status === "confirmed"
            ? `Your visit to ${state.location.name} is on your membership.`
            : a?.status === "needs_review"
              ? "We're checking this order with the store. It can take a day."
              : a?.status === "rejected" || a?.status === "cancelled"
                ? "The store's register voided or cancelled the order."
                : "Your order is linked. It's added once the store's register confirms the sale."}
        </p>
        <Button variant="secondary" loading={busy} onClick={onNew}>Get a new code</Button>
      </Card>
    );
  // Active, but the digits were shown on an earlier screen and can't be shown again.
  return (
    <Card className="code-status">
      <StatusPill tone="info">Active</StatusPill>
      <h2 className="ui-display code-status__title">Code active at {state.location.name}</h2>
      <p>For your security, a code is shown only once. Get a fresh one if you need it again (it replaces this one). Expires in {mmss(new Date(state.expiresAt).getTime() - now)}.</p>
      <div className="ui-row">
        <Button loading={busy} onClick={onNew}>Show a new code</Button>
        <Button variant="ghost" disabled={busy} onClick={onCancel}>Cancel code</Button>
      </div>
    </Card>
  );
}
