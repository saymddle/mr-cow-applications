import { ComingSoon, ScreenTitle } from "./common";

export function CodeScreen() {
  return (
    <div className="ui-stack">
      <ScreenTitle eyebrow="At the counter" title="My code">
        Show a four-digit code to the cashier so your visit is added to your membership.
      </ScreenTitle>
      <ComingSoon title="Your four-digit code" icon="code" phase="Customer app, Phase 3">
        The code service is live in TOGIVA Core; this screen connects to it next.
      </ComingSoon>
    </div>
  );
}
