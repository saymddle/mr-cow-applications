import { describe, expect, it } from "vitest";
import { createDevTokenAuth } from "../src/dev-token.js";
import { authFromEnv } from "../src/from-env.js";

const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const jwt = (claims: object) => `${b64({ alg: "HS256" })}.${b64(claims)}.sig`;

describe("development token sign-in", () => {
  it("accepts an unexpired token and exposes it as the access token", async () => {
    const auth = createDevTokenAuth(sessionStorage);
    const seen: unknown[] = [];
    auth.onChange((s) => seen.push(s?.userId ?? null));
    const token = jwt({ sub: "u-1", email: "a@example.test", exp: Math.floor(Date.now() / 1000) + 600, user_metadata: { email_verified: true } });
    expect(await auth.signInWithPassword("", token)).toEqual({ ok: true });
    expect(await auth.getAccessToken()).toBe(token);
    expect(await auth.getSession()).toMatchObject({ userId: "u-1", email: "a@example.test", emailVerified: true });
    await auth.signOut();
    expect(await auth.getSession()).toBeNull();
    expect(seen).toEqual(["u-1", null]);
  });

  it("rejects expired and malformed tokens", async () => {
    const auth = createDevTokenAuth(sessionStorage);
    expect((await auth.signInWithPassword("", jwt({ sub: "u", exp: 1 }))).ok).toBe(false);
    expect((await auth.signInWithPassword("", "nope")).ok).toBe(false);
  });
});

describe("authFromEnv", () => {
  it("never enables development tokens in production builds", () => {
    expect(authFromEnv({ DEV: false, PROD: true, VITE_DEV_TOKEN_SIGN_IN: "true" })).toBeNull();
    expect(authFromEnv({ DEV: true, PROD: false, VITE_DEV_TOKEN_SIGN_IN: "true" })?.kind).toBe("dev-token");
  });
  it("uses Supabase when configured, and nothing when not", () => {
    expect(authFromEnv({ PROD: true, VITE_SUPABASE_URL: "https://x.supabase.co", VITE_SUPABASE_ANON_KEY: "anon" })?.kind).toBe("supabase");
    expect(authFromEnv({ PROD: true })).toBeNull();
  });
});
