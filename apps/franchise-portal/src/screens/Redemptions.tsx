import { useState, type FormEvent } from "react";
import { TogivaApiError } from "@mrcow/api-client";
import { useSession } from "@mrcow/auth";
import type { RedemptionVerification } from "@mrcow/shared-types";
import { Button, Card, Field, PageHeader, StatusPill } from "@mrcow/ui";

function friendly(e: TogivaApiError): string {
  switch (e.code) {
    case "redemption_invalid": return "That code isn't a valid reward. Check it with the customer.";
    case "redemption_expired": return "This reward code has expired. The customer's points go back automatically; they can redeem again.";
    case "redemption_already_completed": return "This reward has already been used.";
    case "redemption_wrong_location": return "This reward was issued for a different store.";
    case "forbidden": return "Your role at this store can't verify rewards.";
    default: return e.message;
  }
}

/**
 * Cashier flow: check the customer's reward code, apply the discount in the
 * POS, then mark it used. TOGIVA completes a reward exactly once.
 */
export function RedemptionsScreen({ organizationId, locationId }: { organizationId: string; locationId: string }) {
  const { api } = useSession();
  const [token, setToken] = useState("");
  const [checked, setChecked] = useState<RedemptionVerification | null>(null);
  const [done, setDone] = useState<RedemptionVerification | null>(null);
  const [error, setError] = useState<TogivaApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof TogivaApiError ? e : new TogivaApiError(0, "client_error", String(e)));
    } finally {
      setBusy(false);
    }
  };
  const verify = (e: FormEvent) => {
    e.preventDefault();
    setDone(null);
    void run(async () => setChecked(await api.redemptions.verify(organizationId, locationId, { token })));
  };
  const complete = () => void run(async () => {
    const r = await api.redemptions.complete(organizationId, locationId, { token });
    setDone(r);
    setChecked(null);
    setToken("");
  });
  const reset = () => { setChecked(null); setDone(null); setError(null); setToken(""); };

  return (
    <>
      <PageHeader title="Verify rewards" description="Enter the reward code from the customer's app." />
      <div className="ui-grid">
        <Card>
          <form className="ui-stack" onSubmit={verify}>
            <Field label="Reward code" placeholder="XXXX-XXXX-XXXX-XXXX" autoComplete="off" autoCapitalize="characters" spellCheck={false}
              value={token} onChange={(e) => { setToken(e.target.value); setChecked(null); }} error={error ? friendly(error) : undefined} />
            <Button type="submit" loading={busy && !checked} disabled={token.replace(/[^0-9a-z]/gi, "").length < 8}>Check code</Button>
          </form>
        </Card>
        {checked ? (
          <Card tone="accent" role="status">
            <h2 className="card-title">{checked.reward.name}</h2>
            <p>For {checked.customer.firstName ?? "the member"} · member ending {checked.customer.membershipLast4}</p>
            {checked.reward.posDiscountRef ? <p className="ui-muted small">POS discount: {checked.reward.posDiscountRef}</p> : null}
            <p className="ui-muted small">Valid until {new Date(checked.expiresAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
            <div className="ui-row">
              <Button loading={busy} onClick={complete}>Mark as used</Button>
              <Button variant="ghost" disabled={busy} onClick={reset}>Cancel</Button>
            </div>
          </Card>
        ) : null}
        {done ? (
          <Card role="status">
            <StatusPill tone="success">Used</StatusPill>
            <h2 className="card-title">{done.reward.name} redeemed</h2>
            <p className="ui-muted small">Member ending {done.customer.membershipLast4} · {new Date(done.completedAt!).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
            <Button variant="secondary" onClick={reset}>Next customer</Button>
          </Card>
        ) : null}
      </div>
    </>
  );
}
