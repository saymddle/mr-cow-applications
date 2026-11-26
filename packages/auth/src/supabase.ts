import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { AuthAdapter, AuthResult, AuthSession } from "./adapter.js";

const toSession = (s: Session | null): AuthSession | null =>
  s
    ? { accessToken: s.access_token, userId: s.user.id, email: s.user.email ?? null, emailVerified: Boolean(s.user.email_confirmed_at) }
    : null;

/** Friendly messages for the Supabase Auth errors customers actually hit. */
export function describeAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match. Try again or reset your password.";
  if (m.includes("email not confirmed")) return "Confirm your email first. We sent you a link when you signed up.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with this email already exists. Sign in instead.";
  if (m.includes("password") && (m.includes("at least") || m.includes("weak"))) return "Choose a stronger password (at least 8 characters).";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute and try again.";
  return "Something went wrong. Please try again.";
}

const fail = (message: string): AuthResult => ({ ok: false, message: describeAuthError(message) });

export function createSupabaseAuth(config: { url: string; anonKey: string; client?: SupabaseClient }): AuthAdapter {
  // supabase-js is loaded on first use so it stays out of the initial bundle.
  let pending: Promise<SupabaseClient> | null = config.client ? Promise.resolve(config.client) : null;
  const client = () =>
    (pending ??= import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }),
    ));
  return {
    kind: "supabase",
    async getSession() {
      const { data } = await (await client()).auth.getSession();
      return toSession(data.session);
    },
    async getAccessToken() {
      const { data } = await (await client()).auth.getSession();
      return data.session?.access_token ?? null;
    },
    onChange(listener) {
      let unsubscribe: (() => void) | null = null;
      let cancelled = false;
      void client().then((c) => {
        if (cancelled) return;
        const { data } = c.auth.onAuthStateChange((_event, session) => listener(toSession(session)));
        unsubscribe = () => data.subscription.unsubscribe();
      });
      return () => {
        cancelled = true;
        unsubscribe?.();
      };
    },
    async signInWithPassword(email, password) {
      const { error } = await (await client()).auth.signInWithPassword({ email, password });
      return error ? fail(error.message) : { ok: true };
    },
    async signUp(email, password, options) {
      const { data, error } = await (await client()).auth.signUp({ email, password, options: { emailRedirectTo: options?.emailRedirectTo } });
      if (error) return fail(error.message);
      return { ok: true, needsEmailConfirmation: !data.session };
    },
    async sendPasswordReset(email, options) {
      const { error } = await (await client()).auth.resetPasswordForEmail(email, { redirectTo: options?.redirectTo });
      return error ? fail(error.message) : { ok: true };
    },
    async signOut() {
      await (await client()).auth.signOut();
    },
  };
}
