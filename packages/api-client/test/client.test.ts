import { describe, expect, it, vi } from "vitest";
import { createTogivaClient, TogivaApiError } from "../src/index.js";

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

function setup(respond: (req: Request) => Response | Promise<Response>, token: string | null = "tok-1") {
  const requests: Request[] = [];
  const onUnauthenticated = vi.fn();
  const client = createTogivaClient({
    baseUrl: "https://api.example.test/",
    getAccessToken: () => token,
    onUnauthenticated,
    fetch: async (input) => {
      const req = input as Request;
      requests.push(req.clone());
      return respond(req);
    },
  });
  return { client, requests, onUnauthenticated };
}

describe("TOGIVA API client", () => {
  it("sends the bearer token and returns typed data", async () => {
    const me = { user: { id: "u1" }, isPlatformAdmin: false, staffMemberships: [], customerMemberships: [] };
    const { client, requests } = setup(() => json(200, me));
    await expect(client.me()).resolves.toEqual(me);
    expect(requests[0]!.url).toBe("https://api.example.test/v1/me");
    expect(requests[0]!.headers.get("authorization")).toBe("Bearer tok-1");
  });

  it("omits Authorization for anonymous calls and encodes path parameters", async () => {
    const { client, requests } = setup(() => json(200, { id: "o1", slug: "mr-cow" }), null);
    await client.organizationBySlug("mr-cow");
    expect(requests[0]!.url).toBe("https://api.example.test/v1/organizations/by-slug/mr-cow");
    expect(requests[0]!.headers.get("authorization")).toBeNull();
  });

  it("passes query parameters for paged lists", async () => {
    const { client, requests } = setup(() => json(200, { items: [], nextCursor: null }));
    await client.listLocations("11111111-1111-4111-8111-111111111111", { limit: 20, cursor: "abc" });
    const url = new URL(requests[0]!.url);
    expect(url.pathname).toBe("/v1/organizations/11111111-1111-4111-8111-111111111111/locations");
    expect(url.searchParams.get("limit")).toBe("20");
    expect(url.searchParams.get("cursor")).toBe("abc");
  });

  it("turns TOGIVA error envelopes into TogivaApiError", async () => {
    const { client } = setup(() =>
      json(429, { error: { code: "rate_limited", message: "Slow down", requestId: "req-9", retryAfterSeconds: 30 } }, { "retry-after": "30" }),
    );
    const err = await client.connectionCodes.issue("11111111-1111-4111-8111-111111111111", { locationId: "22222222-2222-4222-8222-222222222222" }).catch((e) => e);
    expect(err).toBeInstanceOf(TogivaApiError);
    expect(err).toMatchObject({ status: 429, code: "rate_limited", message: "Slow down", requestId: "req-9", retryAfterSeconds: 30 });
  });

  it("reports 401 so the app can end the session", async () => {
    const { client, onUnauthenticated } = setup(() => json(401, { error: { code: "unauthenticated", message: "Invalid or expired token" } }));
    const err = await client.me().catch((e) => e);
    expect(err.isAuthError).toBe(true);
    expect(onUnauthenticated).toHaveBeenCalledOnce();
  });

  it("maps network failures to a network_error", async () => {
    const { client } = setup(() => {
      throw new TypeError("Failed to fetch");
    });
    await expect(client.health()).rejects.toMatchObject({ status: 0, code: "network_error" });
  });

  it("handles 204 responses", async () => {
    const { client, requests } = setup(() => new Response(null, { status: 204 }));
    await expect(client.connectionCodes.cancel("11111111-1111-4111-8111-111111111111")).resolves.toBeUndefined();
    expect(requests[0]!.method).toBe("DELETE");
  });
});
