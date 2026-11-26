import { Link } from "react-router";
import { Card, Icon, StatusPill } from "@mrcow/ui";
import { ComingSoon, ScreenTitle, useMembership } from "./common";

export function HomeScreen() {
  const { me, organization, membership } = useMembership();
  const first = me?.user.firstName;
  return (
    <div className="ui-stack">
      <ScreenTitle eyebrow={organization?.name} title={first ? `Hey, ${first}!` : "Hey there!"} />
      <Card tone="inverse" className="member-card">
        <div className="member-card__row">
          <span className="member-card__label">Membership</span>
          {membership ? <StatusPill tone="success">{membership.status === "active" ? "Active" : membership.status}</StatusPill> : <StatusPill tone="info">Not joined yet</StatusPill>}
        </div>
        {membership ? (
          <p className="member-card__number"><span className="sr-only">Member number </span>{membership.membershipNumber}</p>
        ) : (
          <p className="member-card__hint">Joining the membership program arrives with registration.</p>
        )}
      </Card>
      <div className="quick-actions">
        <Link to="/code" className="quick-action quick-action--primary"><Icon name="code" /><span>Show my code</span></Link>
        <Link to="/rewards" className="quick-action"><Icon name="gift" /><span>Rewards</span></Link>
        <Link to="/stores" className="quick-action"><Icon name="pin" /><span>Find a store</span></Link>
      </div>
      <ComingSoon title="Points and progress" icon="wallet" phase="Arrives with the loyalty engine (Phase 4)">
        Your points balance, membership level and next reward will show here.
      </ComingSoon>
    </div>
  );
}
