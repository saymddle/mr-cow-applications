import type { AuthAdapter } from "./adapter.js";
import { createDevTokenAuth } from "./dev-token.js";
import { createSupabaseAuth } from "./supabase.js";

export interface AuthEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_DEV_TOKEN_SIGN_IN?: string;
  DEV?: boolean;
  PROD?: boolean;
}

/**
 * Picks the identity provider from Vite env. Supabase when configured; the
 * development token sign-in only in dev builds that opt in. Returns null when
 * nothing is configured so the app can show a setup message instead of a
 * broken sign-in form.
 */
export function authFromEnv(env: AuthEnv): AuthAdapter | null {
  if (env.DEV && !env.PROD && env.VITE_DEV_TOKEN_SIGN_IN === "true") return createDevTokenAuth();
  if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) return createSupabaseAuth({ url: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY });
  return null;
}
