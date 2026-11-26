import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createTogivaClient, TogivaApiError, type TogivaClient } from "@mrcow/api-client";
import type { Me, OrganizationSummary } from "@mrcow/shared-types";
import type { AuthAdapter, AuthSession } from "./adapter.js";

export type SessionState =
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "signed_in"; auth: AuthSession; me: Me }
  | { status: "error"; auth: AuthSession | null; error: TogivaApiError };

export type OrganizationState =
  | { status: "loading" }
  | { status: "ready"; organization: OrganizationSummary }
  | { status: "error"; error: TogivaApiError };

interface SessionContextValue {
  session: SessionState;
  organization: OrganizationState;
  auth: AuthAdapter;
  api: TogivaClient;
  /** Re-read /v1/me (after enrollment, role changes, etc). */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export interface SessionProviderProps {
  auth: AuthAdapter;
  apiBaseUrl: string;
  /** Organization slug this app serves (from brand/app config). */
  organizationSlug: string;
  /** Override for tests. */
  api?: TogivaClient;
  children: ReactNode;
}

const asApiError = (e: unknown) =>
  e instanceof TogivaApiError ? e : new TogivaApiError(0, "client_error", e instanceof Error ? e.message : String(e));

/**
 * Owns sign-in state and the caller's TOGIVA identity. Flow: identity provider
 * session -> GET /v1/me (TOGIVA provisions the profile on first call) ->
 * screens decide what to show from `me`.
 */
export function SessionProvider({ auth, apiBaseUrl, organizationSlug, api: apiOverride, children }: SessionProviderProps) {
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [organization, setOrganization] = useState<OrganizationState>({ status: "loading" });
  const generation = useRef(0);

  const api = useMemo(
    () =>
      apiOverride ??
      createTogivaClient({
        baseUrl: apiBaseUrl,
        getAccessToken: () => auth.getAccessToken(),
        onUnauthenticated: () => void auth.signOut(),
      }),
    [apiOverride, apiBaseUrl, auth],
  );

  const load = useCallback(
    async (authSession: AuthSession | null) => {
      const gen = ++generation.current;
      if (!authSession) {
        setSession({ status: "signed_out" });
        return;
      }
      try {
        const me = await api.me();
        if (gen === generation.current) setSession({ status: "signed_in", auth: authSession, me });
      } catch (e) {
        if (gen !== generation.current) return;
        const error = asApiError(e);
        setSession(error.isAuthError ? { status: "signed_out" } : { status: "error", auth: authSession, error });
      }
    },
    [api],
  );

  useEffect(() => {
    let active = true;
    auth.getSession().then(
      (s) => {
        if (active) void load(s);
      },
      () => {
        if (active) setSession({ status: "signed_out" });
      },
    );
    const unsubscribe = auth.onChange((s) => {
      if (active) void load(s);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth, load]);

  useEffect(() => {
    let active = true;
    setOrganization({ status: "loading" });
    api.organizationBySlug(organizationSlug).then(
      (o) => {
        if (active) setOrganization({ status: "ready", organization: o });
      },
      (e) => {
        if (active) setOrganization({ status: "error", error: asApiError(e) });
      },
    );
    return () => {
      active = false;
    };
  }, [api, organizationSlug]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      organization,
      auth,
      api,
      refresh: async () => load(await auth.getSession()),
      signOut: async () => {
        await auth.signOut();
        await load(null);
      },
    }),
    [session, organization, auth, api, load],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
