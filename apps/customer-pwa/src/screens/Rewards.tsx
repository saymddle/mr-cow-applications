import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { TogivaApiError } from "@mrcow/api-client";
import { useSession } from "@mrcow/auth";
import type { CustomerRedemption, IssuedRedemption, RewardIneligibleReason, RewardSummary } from "@mrcow/shared-types";
import { Button, Card, EmptyState, ErrorState, Icon, LoadingState, Modal, StatusPill, useToast } from "@mrcow/ui";
import { useMyStore, useStores } from "../data";
import { ScreenTitle, useMembership } from "./common";
import { ProgramNotLive } from "./Home";

const REASON: Record<RewardIneligibleReason, string> = {
  insufficient_points: "Not enough points yet",
  tier_required: "For a higher membership level",
  not_available_at_location: "Not offered at this store",
  limit_reached: "You've used this one already",
  out_of_stock: "Out of stock",
  not_yet_available: "Coming soon",
  expired: "No longer available",
};

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function friendly(e: TogivaApiError): string {
  switch (e.code) {
    case "insufficient_points": return "You don't have enough points for this one yet.";
    case "reward_unavailable": return "This reward isn't available to you right now.";
    case "location_not_participating": return "That store isn't taking rewards right now. Choose another store.";
    case "redemption_expired": return "That reward code expired. Your points are on their way back.";
    default: return e.message;
  }
}

type Data = { available: number; rewards: RewardSummary[]; active: CustomerRedemption[] };

/** Reward catalog and redemption, all evaluated by TOGIVA Core for this member. */
export function RewardsScreen() {
  const { api } = useSession();
  const toast = useToast();
  const { organization, membership } = useMembership();
  const [stores] = useStores(organization?.id);
  const [myStore, setMyStore] = useMyStore(membership?.preferredLocationId);
  const [state, setState] = useState<{ status: "loading" } | { status: "unavailable" } | { status: "error"; error: TogivaApiError } | { status: "ready"; data: Data }>({ status: "loading" });
  const [confirm, setConfirm] = useState<{ reward: RewardSummary; key: string } | null>(null);
  const [showing, setShowing] = useState<IssuedRedemption | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<TogivaApiError | null>(null);
  const orgId = organization?.id;

  const load = useCallback(async () => {
    if (!orgId) return;
    try {
      const [wallet, rewards, active] = await Promise.all([
        api.loyalty.wallet(orgId),
        api.loyalty.rewards(orgId, { limit: 100, ...(myStore ? { locationId: myStore } : {}) }),
        api.redemptions.list(orgId, { status: "issued", limit: 20 }),
      ]);
      setState({ status: "ready", data: { available: wallet.availablePoints, rewards: rewards.items, active: active.items } });
    } catch (e) {
      const err = e instanceof TogivaApiError ? e : new TogivaApiError(0, "client_error", String(e));
      setState(err.code === "loyalty_program_unavailable" ? { status: "unavailable" } : { status: "error", error: err });
    }
  }, [api, orgId, myStore]);
  useEffect(() => {
    if (membership) void load();
  }, [membership, load]);

  if (!membership)
    return (
      <div className="ui-stack">
        <ScreenTitle eyebrow="Treats" title="Rewards" />
        <Card><EmptyState icon={<Icon name="gift" size={40} />} title="Join first" action={<Link className="ui-btn ui-btn--primary" to="/">Join on the home screen</Link>}>Rewards are for members.</EmptyState></Card>
      </div>
    );

  async function redeem() {
    if (!orgId || !confirm || !myStore) return;
    setBusy(true);
    setActionError(null);
    try {
      const r = await api.redemptions.issue(orgId, { rewardId: confirm.reward.id, locationId: myStore, idempotencyKey: confirm.key });
      setConfirm(null);
      setShowing(r);
      void load();
    } catch (e) {
      setActionError(e instanceof TogivaApiError ? e : new TogivaApiError(0, "client_error", String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function reveal(id: string) {
    if (!orgId) return;
    try {
      setShowing(await api.redemptions.get(orgId, id));
    } catch (e) {
      if (e instanceof TogivaApiError) toast(friendly(e), "danger");
      void load();
    }
  }

  async function cancel(id: string) {
    if (!orgId) return;
    setBusy(true);
    try {
      await api.redemptions.cancel(orgId, id);
      setShowing(null);
      toast("Reward cancelled. Your points are back.", "success");
      void load();
    } catch (e) {
      if (e instanceof TogivaApiError) toast(friendly(e), "danger");
    } finally {
      setBusy(false);
    }
  }

  const storeList = stores.status === "ready" ? stores.data : [];
  const storeName = (id: string) => storeList.find((s) => s.id === id)?.name ?? "the store";

  return (
    <div className="ui-stack">
      <ScreenTitle eyebrow="Treats" title="Rewards" />
      {state.status === "loading" ? <LoadingState /> : null}
      {state.status === "unavailable" ? <ProgramNotLive /> : null}
      {state.status === "error" ? <ErrorState title="Couldn't load rewards" message={state.error.message} requestId={state.error.requestId} onRetry={() => void load()} /> : null}
      {state.status === "ready" ? (
        <>
          <Card tone="inverse" className="rewards-balance">
            <span className="member-card__label">Your points</span>
            <span className="points-card__value">{state.data.available.toLocaleString("en-US")}</span>
          </Card>

          {state.data.active.length > 0 ? (
            <section className="ui-stack" aria-label="Ready to use">
              <h2 className="section-title">Ready to use</h2>
              {state.data.active.map((r) => (
                <Card key={r.id} tone="accent" className="reward-row">
                  <div>
                    <p className="reward-row__name">{r.rewardName}</p>
                    <p className="small-print">At {storeName(r.locationId)} · expires {new Date(r.expiresAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                  <Button onClick={() => void reveal(r.id)}>Show code</Button>
                </Card>
              ))}
            </section>
          ) : null}

          {storeList.length > 0 ? (
            <label className="code-start__store">
              <span>Redeem at</span>
              <select value={myStore ?? ""} onChange={(e) => setMyStore(e.target.value)}>
                {!myStore ? <option value="" disabled>Choose a store</option> : null}
                {storeList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
          ) : null}

          {state.data.rewards.length === 0 ? (
            <Card><EmptyState icon={<Icon name="gift" size={40} />} title="No rewards yet">Rewards will appear here when they're added.</EmptyState></Card>
          ) : (
            <ul className="reward-list">
              {state.data.rewards.map((r) => {
                const reasons = r.eligibility?.reasons ?? [];
                const ok = r.eligibility?.eligible ?? false;
                return (
                  <li key={r.id}>
                    <Card className="reward-row">
                      <div>
                        <p className="reward-row__name">{r.name}</p>
                        {r.description ? <p className="small-print">{r.description}</p> : null}
                        <p className="reward-row__cost">{r.pointsCost.toLocaleString("en-US")} pts</p>
                        {!ok && reasons[0] ? <StatusPill tone="neutral">{REASON[reasons[0]]}</StatusPill> : null}
                      </div>
                      <Button disabled={!ok || !myStore} onClick={() => { setActionError(null); setConfirm({ reward: r, key: crypto.randomUUID() }); }}>Redeem</Button>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : null}

      <Modal
        open={Boolean(confirm)}
        title={confirm ? `Redeem ${confirm.reward.name}?` : ""}
        onClose={() => setConfirm(null)}
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Not now</Button><Button loading={busy} onClick={() => void redeem()}>Use {confirm?.reward.pointsCost.toLocaleString("en-US")} points</Button></>}
      >
        <p>You'll get a code to show the cashier at {myStore ? storeName(myStore) : "your store"}. Redeem when you're at the counter: the code is only good for a short time, and unused points come back automatically.</p>
        {actionError ? <p role="alert" className="ui-field__error">{friendly(actionError)}</p> : null}
      </Modal>

      <RedemptionModal redemption={showing} storeName={showing ? storeName(showing.locationId) : ""} busy={busy} onClose={() => setShowing(null)} onCancel={(id) => void cancel(id)} />
    </div>
  );
}

function RedemptionModal({ redemption, storeName, busy, onClose, onCancel }: { redemption: IssuedRedemption | null; storeName: string; busy: boolean; onClose: () => void; onCancel: (id: string) => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!redemption) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [redemption]);
  if (!redemption) return null;
  const left = new Date(redemption.expiresAt).getTime() - now;
  return (
    <Modal open title="Show this to the cashier" onClose={onClose}
      footer={<><Button variant="ghost" loading={busy} onClick={() => onCancel(redemption.id)}>Cancel and return points</Button><Button onClick={onClose}>Done</Button></>}>
      <div className="redeem-token">
        <p className="code-card__label">Reward code for {storeName}</p>
        <p className="redeem-token__value" aria-label={`Reward code ${redemption.token.split("").join(" ")}`}>
          {/* Two halves that each stay on one line, so the code never breaks mid-group on a phone. */}
          <span aria-hidden="true">{redemption.token.slice(0, 10)}</span><span aria-hidden="true">{redemption.token.slice(10)}</span>
        </p>
        <p className="code-card__timer">{left > 0 ? `Expires in ${mmss(left)}` : "Expired. Your points are on their way back."}</p>
      </div>
    </Modal>
  );
}
