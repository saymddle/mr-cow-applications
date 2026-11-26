import type { AuthAdapter, AuthSession } from "./adapter.js";

const KEY = "togiva.dev-token";

function decode(token: string): AuthSession | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const claims = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>;
    if (typeof claims.sub !== "string") return null;
    if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) return null;
    const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
    return {
      accessToken: token,
      userId: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
      emailVerified: claims.email_verified === true || meta.email_verified === true,
    };
  } catch {
    return null;
  }
}

/**
 * Development-only sign-in: paste a bearer token minted for a local TOGIVA
 * Core (the "password" field carries the token). The token is not verified
 * here; TOGIVA Core verifies every request. Never enabled in production builds.
 */
export function createDevTokenAuth(storage: Storage = sessionStorage): AuthAdapter {
  const listeners = new Set<(s: AuthSession | null) => void>();
  const read = () => {
    const raw = storage.getItem(KEY);
    const session = raw ? decode(raw) : null;
    if (raw && !session) storage.removeItem(KEY);
    return session;
  };
  const emit = () => listeners.forEach((l) => l(read()));
  return {
    kind: "dev-token",
    getSession: async () => read(),
    getAccessToken: async () => read()?.accessToken ?? null,
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async signInWithPassword(_email, token) {
      if (!decode(token.trim())) return { ok: false, message: "That is not a valid, unexpired token." };
      storage.setItem(KEY, token.trim());
      emit();
      return { ok: true };
    },
    signUp: async () => ({ ok: false, message: "Sign-up is not available with development tokens." }),
    sendPasswordReset: async () => ({ ok: false, message: "Password reset is not available with development tokens." }),
    async signOut() {
      storage.removeItem(KEY);
      emit();
    },
  };
}
