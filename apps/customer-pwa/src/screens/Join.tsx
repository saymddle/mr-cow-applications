import { useState, type FormEvent } from "react";
import { TogivaApiError } from "@mrcow/api-client";
import { useSession } from "@mrcow/auth";
import { Button, Card, Field } from "@mrcow/ui";
import { useMyStore, useStores } from "../data";

/**
 * Joins the signed-in user to the membership program (TOGIVA enrollment).
 * Marketing consents are not collected yet: they need Mr. Cow's approved
 * policy text and versions, and are added to this form when those arrive.
 */
export function JoinCard({ organizationId, defaultFirstName }: { organizationId: string; defaultFirstName?: string | null }) {
  const { api, refresh } = useSession();
  const [stores] = useStores(organizationId);
  const [myStore, setMyStore] = useMyStore(null);
  const [firstName, setFirstName] = useState(defaultFirstName ?? "");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) return setError("Tell us your first name.");
    setBusy(true);
    setError(null);
    try {
      await api.enroll(organizationId, {
        firstName: firstName.trim(),
        ...(lastName.trim() ? { lastName: lastName.trim() } : {}),
        ...(myStore ? { preferredLocationId: myStore } : {}),
        consents: [],
      });
      await refresh();
    } catch (err) {
      setError(err instanceof TogivaApiError ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const list = stores.status === "ready" ? stores.data : [];
  return (
    <Card tone="accent" className="join-card">
      <h2 className="ui-display join-card__title">Join the membership</h2>
      <p className="join-card__lede">Get a member number and use your code at the counter.</p>
      <form className="ui-form" onSubmit={submit} noValidate>
        <Field label="First name" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required maxLength={80} />
        <Field label="Last name (optional)" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={80} />
        {list.length > 0 ? (
          <label className="code-start__store">
            <span>Your usual store (optional)</span>
            <select value={myStore ?? ""} onChange={(e) => setMyStore(e.target.value)}>
              <option value="">No preference</option>
              {list.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        ) : null}
        {error ? <p className="ui-field__error" role="alert">{error}</p> : null}
        <Button type="submit" size="lg" block loading={busy}>Join now</Button>
      </form>
    </Card>
  );
}
