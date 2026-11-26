import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TogivaApiError, type TogivaClient } from "@mrcow/api-client";
import type { AuthAdapter, AuthSession } from "../src/adapter.js";
import { SessionProvider, useSession } from "../src/session.js";
import { me, ORG } from "./fixtures.js";

function fakeAuth(initial: AuthSession | null) {
  let current = initial;
  const listeners = new Set<(s: AuthSession | null) => void>();
  const adapter: AuthAdapter = {
    kind: "dev-token",
    getSession: async () => current,
    getAccessToken: async () => current?.accessToken ?? null,
    onChange: (l) => (listeners.add(l), () => listeners.delete(l)),
    signInWithPassword: async () => ({ ok: true }),
    signUp: async () => ({ ok: true }),
    sendPasswordReset: async () => ({ ok: true }),
    signOut: async () => set(null),
  };
  function set(s: AuthSession | null) {
    current = s;
    listeners.forEach((l) => l(s));
  }
  return { adapter, set };
}

const session: AuthSession = { accessToken: "t", userId: "u1", email: "pat@example.test", emailVerified: true };

function fakeApi(meImpl: () => Promise<unknown>): TogivaClient {
  return { me: meImpl, organizationBySlug: async () => ORG } as unknown as TogivaClient;
}

function Probe() {
  const { session, organization } = useSession();
  return (
    <p>
      {session.status}
      {session.status === "signed_in" ? `:${session.me.user.firstName}` : ""}
      {session.status === "error" ? `:${session.error.code}` : ""}|{organization.status === "ready" ? organization.organization.slug : organization.status}
    </p>
  );
}

const renderWith = (auth: AuthAdapter, api: TogivaClient) =>
  render(
    <SessionProvider auth={auth} apiBaseUrl="https://api.example.test" organizationSlug="test-org" api={api}>
      <Probe />
    </SessionProvider>,
  );

describe("SessionProvider", () => {
  it("is signed out without an identity-provider session, and still resolves the organization", async () => {
    renderWith(fakeAuth(null).adapter, fakeApi(async () => me()));
    await waitFor(() => expect(screen.getByText("signed_out|test-org")).toBeTruthy());
  });

  it("loads /v1/me after sign-in and clears it on sign-out", async () => {
    const auth = fakeAuth(null);
    renderWith(auth.adapter, fakeApi(async () => me()));
    await waitFor(() => screen.getByText("signed_out|test-org"));
    await act(async () => auth.set(session));
    await waitFor(() => expect(screen.getByText("signed_in:Pat|test-org")).toBeTruthy());
    await act(async () => auth.set(null));
    await waitFor(() => expect(screen.getByText("signed_out|test-org")).toBeTruthy());
  });

  it("treats a rejected token as signed out", async () => {
    renderWith(fakeAuth(session).adapter, fakeApi(async () => { throw new TogivaApiError(401, "unauthenticated", "x"); }));
    await waitFor(() => expect(screen.getByText("signed_out|test-org")).toBeTruthy());
  });

  it("surfaces API outages as an error state instead of signing out", async () => {
    renderWith(fakeAuth(session).adapter, fakeApi(async () => { throw new TogivaApiError(0, "network_error", "down"); }));
    await waitFor(() => expect(screen.getByText("error:network_error|test-org")).toBeTruthy());
  });
});
