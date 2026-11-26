import { ComingSoon, ScreenTitle } from "./common";

export function RewardsScreen() {
  return (
    <div className="ui-stack">
      <ScreenTitle eyebrow="Treats" title="Rewards" />
      <ComingSoon title="Rewards and offers" icon="gift" phase="Phases 3 and 4">
        Rewards you can redeem and offers picked for you will appear here once Mr. Cow's program is configured.
      </ComingSoon>
    </div>
  );
}
