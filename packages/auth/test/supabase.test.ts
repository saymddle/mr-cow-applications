import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAuth, describeAuthError } from "../src/supabase.js";

function fakeClient(over: Record<string, unknown> = {}) {
  const session = { access_token: "at", user: { id: "u1", email: "a@example.test", email_confirmed_at: "2026-01-01" } };
  const auth = {
    getSession: vi.fn(async () => ({ data: { session } })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signInWithPassword: vi.fn(async () => ({ error: null })),
    signUp: vi.fn(async () => ({ data: { session: null }, error: null })),
    resetPasswordForEmail: vi.fn(async () => ({ error: null })),
    signOut: vi.fn(async () => ({ error: null })),
    ...over,
  };
  return { client: { auth } as unknown as SupabaseClient, auth };
}

describe("Supabase adapter", () => {
  it("maps the Supabase session to an AuthSession", async () => {
    const { client } = fakeClient();
    const a = createSupabaseAuth({ url: "x", anonKey: "y", client });
    expect(await a.getSession()).toEqual({ accessToken: "at", userId: "u1", email: "a@example.test", emailVerified: true });
    expect(await a.getAccessToken()).toBe("at");
  });

  it("reports when sign-up needs email confirmation", async () => {
    const { client, auth } = fakeClient();
    const a = createSupabaseAuth({ url: "x", anonKey: "y", client });
    expect(await a.signUp("a@example.test", "password1", { emailRedirectTo: "https://app" })).toEqual({ ok: true, needsEmailConfirmation: true });
    expect(auth.signUp).toHaveBeenCalledWith({ email: "a@example.test", password: "password1", options: { emailRedirectTo: "https://app" } });
  });

  it("turns provider errors into friendly messages", async () => {
    const { client } = fakeClient({ signInWithPassword: vi.fn(async () => ({ error: { message: "Invalid login credentials" } })) });
    const a = createSupabaseAuth({ url: "x", anonKey: "y", client });
    expect(await a.signInWithPassword("a@example.test", "nope")).toEqual({ ok: false, message: describeAuthError("Invalid login credentials") });
    expect(describeAuthError("Invalid login credentials")).toMatch(/don't match/);
  });
});
