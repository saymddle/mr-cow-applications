import { useCallback } from "react";
import { Link } from "react-router";
import { useSession } from "@mrcow/auth";
import type { Wallet } from "@mrcow/shared-types";
import { Card, ErrorState, Icon, LoadingState, StatusPill } from "@mrcow/ui";
import { formatProgress, useLoyalty, type LoyaltyLoad } from "../data";
import { ComingSoon, ScreenTitle, useMembership } from "./common";
import { JoinCard } from "./Join";

export function HomeScreen() {
  const { api } = useSession();
  const { me, organization, membership } = useMembership();
  const first = me?.user.firstName;
  const fetchWallet = useCallback((orgId: string) => api.loyalty.wallet(orgId), [api]);
  const [wallet, reload] = useLoyalty(organization?.id, Boolean(membership), fetchWallet);
  return (
    <div className="ui-stack">
      <ScreenTitle eyebrow={organization?.name} title={first ? `Hey, ${first}!` : "Hey there!"} />
      {!membership && organization ? <JoinCard organizationId={organization.id} defaultFirstName={me?.user.firstName} /> : null}
      {membership ? (
        <Card tone="inverse" className="member-card">
          <div className="member-card__row">
            <span className="member-card__label">Membership</span>
            <StatusPill tone="success">{membership.status === "active" ? "Active" : membership.status}</StatusPill>
          </div>
          <p className="member-card__number"><span className="sr-only">Member number </span>{membership.membershipNumber}</p>
        </Card>
      ) : null}
      <div className="quick-actions">
        <Link to="/code" className="quick-action quick-action--primary"><Icon name="code" /><span>Show my code</span></Link>
        <Link to="/rewards" className="quick-action"><Icon name="gift" /><span>Rewards</span></Link>
        <Link to="/stores" className="quick-action"><Icon name="pin" /><span>Find a store</span></Link>
      </div>
      {membership ? <PointsCard wallet={wallet} currency={organization?.defaultCurrency ?? "USD"} onRetry={() => void reload()} /> : null}
    </div>
  );
}

export function ProgramNotLive() {
  return (
    <ComingSoon title="Rewards are almost here" icon="wallet" phase="The rewards program hasn't launched yet">
      Points, levels and rewards will show here as soon as the program goes live.
    </ComingSoon>
  );
}

function PointsCard({ wallet, currency, onRetry }: { wallet: LoyaltyLoad<Wallet>; currency: string; onRetry: () => void }) {
  if (wallet.status === "loading") return <Card><LoadingState label="Loading your points" /></Card>;
  if (wallet.status === "unavailable") return <ProgramNotLive />;
  if (wallet.status === "error") return <ErrorState title="Couldn't load your points" message={wallet.error.message} requestId={wallet.error.requestId} onRetry={onRetry} />;
  const w = wallet.data;
  const q = w.qualification;
  const pct = q.nextThreshold ? Math.min(100, Math.round((q.progress / q.nextThreshold) * 100)) : 100;
  return (
    <Card className="points-card">
      <div className="points-card__balance">
        <p className="points-card__label">Points</p>
        <p className="points-card__value">{w.availablePoints.toLocaleString("en-US")}</p>
        {w.pendingPoints > 0 ? <p className="ui-muted small-print">+{w.pendingPoints.toLocaleString("en-US")} pending</p> : null}
      </div>
      {w.currentTier || w.nextTier ? (
        <div className="points-card__tier">
          <p className="points-card__label">{w.currentTier ? w.currentTier.name : "Level"}</p>
          {w.nextTier ? (
            <>
              <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`Progress to ${w.nextTier.name}`}>
                <span style={{ width: `${pct}%` }} />
              </div>
              <p className="small-print">
                {formatProgress(q.metric, q.progress, currency)} of {formatProgress(q.metric, w.nextTier.qualificationThreshold, currency)} to {w.nextTier.name}
              </p>
            </>
          ) : (
            <p className="small-print">You're at the top level.</p>
          )}
        </div>
      ) : null}
      {w.nextReward ? (
        <p className="points-card__next">
          <Icon name="gift" size={20} /> {w.nextReward.pointsNeeded.toLocaleString("en-US")} more points for {w.nextReward.name}
        </p>
      ) : null}
      {w.dataStatus === "pending_updates" ? <p className="ui-muted small-print">A recent purchase is still being added.</p> : null}
      <Link to="/activity" className="points-card__link">See activity</Link>
    </Card>
  );
}
