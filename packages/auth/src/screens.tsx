import { useState, type FormEvent, type ReactNode } from "react";
import { Button, Card, ErrorState, Field, LoadingState } from "@mrcow/ui";
import type { AuthAdapter } from "./adapter.js";
import { useSession } from "./session.js";

type Mode = "sign-in" | "sign-up" | "reset";

export interface SignInFormProps {
  /** Allow creating an account (customer app). Staff accounts come from invitations. */
  allowSignUp?: boolean;
  /** Where Supabase email links return to (defaults to the current origin). */
  redirectTo?: string;
  heading?: ReactNode;
}

/** Email + password sign-in, sign-up and password reset over the configured AuthAdapter. */
export function SignInForm({ allowSignUp = false, redirectTo, heading }: SignInFormProps) {
  const { auth } = useSession();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const devToken = auth.kind === "dev-token";
  const back = typeof window !== "undefined" ? (redirectTo ?? window.location.origin) : redirectTo;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const r = await run(auth, mode, email.trim(), password, back);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    if (mode === "reset") setNotice("If an account exists for that email, a reset link is on its way.");
    else if (mode === "sign-up" && r.needsEmailConfirmation) setNotice("Check your email to confirm your account, then sign in.");
  }

  const title = mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create your account" : "Reset your password";
  return (
    <Card className="auth-card">
      {heading}
      <h2 className="ui-display auth-card__title">{title}</h2>
      <form className="ui-form" onSubmit={submit} noValidate>
        {devToken ? (
          <Field label="Development token" name="token" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} hint="Paste a bearer token minted for your local TOGIVA Core." required />
        ) : (
          <>
            <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {mode !== "reset" ? (
              <Field
                label="Password" name="password" type="password" minLength={8}
                autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                hint={mode === "sign-up" ? "At least 8 characters." : undefined}
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            ) : null}
          </>
        )}
        {error ? <p className="ui-field__error" role="alert">{error}</p> : null}
        {notice ? <p className="auth-card__notice" role="status">{notice}</p> : null}
        <Button type="submit" block size="lg" loading={busy}>
          {mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : "Send reset link"}
        </Button>
      </form>
      {!devToken ? (
        <div className="auth-card__links">
          {mode !== "sign-in" ? <button type="button" className="auth-link" onClick={() => setMode("sign-in")}>I already have an account</button> : null}
          {mode === "sign-in" && allowSignUp ? <button type="button" className="auth-link" onClick={() => setMode("sign-up")}>Create an account</button> : null}
          {mode === "sign-in" ? <button type="button" className="auth-link" onClick={() => setMode("reset")}>Forgot your password?</button> : null}
        </div>
      ) : null}
    </Card>
  );
}

function run(auth: AuthAdapter, mode: Mode, email: string, password: string, redirectTo?: string) {
  if (auth.kind !== "dev-token" && !/^\S+@\S+\.\S+$/.test(email)) return Promise.resolve({ ok: false as const, message: "Enter a valid email address." });
  if (mode === "reset") return auth.sendPasswordReset(email, { redirectTo });
  if (mode === "sign-up") {
    if (password.length < 8) return Promise.resolve({ ok: false as const, message: "Choose a password with at least 8 characters." });
    return auth.signUp(email, password, { emailRedirectTo: redirectTo });
  }
  return auth.signInWithPassword(email, password);
}

/**
 * Renders children only for a signed-in user whose identity loaded, and the
 * right screen for every other state. `signedOut` is usually a SignInForm.
 */
export function SessionGate({ signedOut, children }: { signedOut: ReactNode; children: ReactNode }) {
  const { session, refresh } = useSession();
  if (session.status === "loading") return <LoadingState label="Signing you in" />;
  if (session.status === "signed_out") return <>{signedOut}</>;
  if (session.status === "error")
    return <ErrorState title="We couldn't load your account" message={session.error.message} requestId={session.error.requestId} onRetry={() => void refresh()} />;
  return <>{children}</>;
}

/** Shown when the app is built without an identity provider configured. */
export function AuthNotConfigured({ appName }: { appName: string }) {
  return (
    <ErrorState
      title="Sign-in is not set up"
      message={`${appName} needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at build time (see .env.example). For local development you can set VITE_DEV_TOKEN_SIGN_IN=true instead.`}
    />
  );
}
