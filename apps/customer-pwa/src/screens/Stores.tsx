import { ComingSoon, ScreenTitle } from "./common";

export function StoresScreen() {
  return (
    <div className="ui-stack">
      <ScreenTitle eyebrow="Near you" title="Stores" />
      <ComingSoon title="Store finder" icon="pin" phase="Customer app, Phase 3">
        Participating Mr. Cow stores, with hours and directions, will be listed here.
      </ComingSoon>
    </div>
  );
}
