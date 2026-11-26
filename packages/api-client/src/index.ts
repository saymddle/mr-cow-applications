import createClient from "openapi-fetch";
import type { ApiErrorBody, EnrollmentRequest, paths, RequestBodyOf } from "@mrcow/shared-types";

/** Error raised for any non-2xx response or network failure. `code` is TOGIVA's stable error code. */
export class TogivaApiError extends Error {
  override readonly name = "TogivaApiError";
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
    readonly retryAfterSeconds?: number,
    readonly details?: unknown,
  ) {
    super(message);
  }
  /** True when signing in again could fix it. */
  get isAuthError() {
    return this.status === 401;
  }
}

export interface TogivaClientOptions {
  /** TOGIVA Core base URL, without a trailing slash and without /v1. */
  baseUrl: string;
  /** Returns the current access token, or null for anonymous calls. Called per request so refreshed tokens are used. */
  getAccessToken: () => Promise<string | null> | string | null;
  /** Called when the API answers 401, so the app can end the session. */
  onUnauthenticated?: () => void;
  fetch?: typeof fetch;
}

type Result<T> = { data?: T; error?: unknown; response: Response };

export function createTogivaClient(options: TogivaClientOptions) {
  const raw = createClient<paths>({
    baseUrl: options.baseUrl.replace(/\/+$/, ""),
    // Resolve fetch lazily so tests and polyfills that replace globalThis.fetch work.
    fetch: (input: Request) => (options.fetch ?? globalThis.fetch)(input),
  });

  raw.use({
    async onRequest({ request }) {
      const token = await options.getAccessToken();
      if (token) request.headers.set("Authorization", `Bearer ${token}`);
      return request;
    },
  });

  async function call<T>(promise: Promise<Result<T>>): Promise<T> {
    let result: Result<T>;
    try {
      result = await promise;
    } catch (err) {
      throw new TogivaApiError(0, "network_error", "Could not reach TOGIVA. Check your connection and try again.", undefined, undefined, String(err));
    }
    const { data, error, response } = result;
    if (response.ok) return data as T;
    const body = (error ?? {}) as Partial<ApiErrorBody>;
    const e = body.error;
    if (response.status === 401) options.onUnauthenticated?.();
    const retryHeader = Number(response.headers.get("retry-after"));
    throw new TogivaApiError(
      response.status,
      e?.code ?? (response.status >= 500 ? "internal_error" : "http_error"),
      e?.message ?? `Request failed (${response.status})`,
      e?.requestId,
      e?.retryAfterSeconds ?? (Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : undefined),
      e?.details,
    );
  }

  const org = (organizationId: string) => ({ params: { path: { organizationId } } });

  return {
    /** The underlying typed openapi-fetch client, for routes without a helper below. */
    raw,
    health: () => call(raw.GET("/v1/health")),
    me: () => call(raw.GET("/v1/me")),
    organizationBySlug: (slug: string) => call(raw.GET("/v1/organizations/by-slug/{slug}", { params: { path: { slug } } })),
    enroll: (organizationId: string, body: EnrollmentRequest) =>
      call(raw.POST("/v1/me/organizations/{organizationId}/enrollment", { ...org(organizationId), body })),
    listLocations: (organizationId: string, page: { cursor?: string; limit?: number } = {}) =>
      call(raw.GET("/v1/organizations/{organizationId}/locations", { params: { path: { organizationId }, query: page } })),
    getLocation: (organizationId: string, locationId: string) =>
      call(raw.GET("/v1/organizations/{organizationId}/locations/{locationId}", { params: { path: { organizationId, locationId } } })),
    connectionCodes: {
      issue: (organizationId: string, body: RequestBodyOf<"issueConnectionCode">) =>
        call(raw.POST("/v1/me/organizations/{organizationId}/connection-codes", { ...org(organizationId), body })),
      current: (organizationId: string) => call(raw.GET("/v1/me/organizations/{organizationId}/connection-codes/current", org(organizationId))),
      cancel: (organizationId: string) => call(raw.DELETE("/v1/me/organizations/{organizationId}/connection-codes/current", org(organizationId))),
    },
  };
}

export type TogivaClient = ReturnType<typeof createTogivaClient>;
