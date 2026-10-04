/**
 * ★ A ROUTE HANDLER REFRESHES ITS OWN SESSION (compute-levers). The proxy runs only before the pages that render a
 * session (`src/proxy.ts`), so an API route, or a Server Function posted to a page off that list, meets an expired
 * access token itself. Held here with the real `@supabase/ssr` and `supabase-js` (only the network is a stand-in)
 * over Next's own cookie stores:
 *   - a Route Handler's (mutable): `getUser()` spends the old refresh token and the new session reaches the response's
 *     Set-Cookie, written exactly as Next appends a handler's cookie writes (`appendMutableCookies`);
 *   - a Server Component's (sealed): the write throws and `server.ts` swallows it, so the refresh is SPENT AND LOST.
 *     That is why every page that renders a session keeps the proxy before it, its prefetch included.
 */
import { AsyncLocalStorage } from "node:async_hooks";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const jar = vi.hoisted(() => ({ store: null as unknown }));

vi.mock("next/headers", () => ({ cookies: async () => jar.store }));
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
  },
}));
// The tripwire wraps PostgREST's reads; with none, the clients fall back to the global fetch stubbed below.
vi.mock("@/lib/supabase/row-cap-tripwire", () => ({
  withRowCapTripwire: () => undefined,
}));

// Next's cookie adapters reach its work store, which expects the runtime's AsyncLocalStorage global.
(globalThis as { AsyncLocalStorage?: unknown }).AsyncLocalStorage ??=
  AsyncLocalStorage;
const { RequestCookies } =
  await import("next/dist/compiled/@edge-runtime/cookies");
const {
  MutableRequestCookiesAdapter,
  RequestCookiesAdapter,
  appendMutableCookies,
} =
  await import("next/dist/server/web/spec-extension/adapters/request-cookies");
const { createClient } = await import("./server");

const COOKIE = "sb-test-auth-token";
const USER = {
  id: "5e1f0c3a-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "host@example.test",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-10-01T00:00:00Z",
};
const nowS = () => Math.floor(Date.now() / 1000);
function session(access: string, refresh: string, expiresAt: number) {
  return {
    access_token: access,
    refresh_token: refresh,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: expiresAt,
    user: USER,
  };
}
/** The auth cookie as `@supabase/ssr` writes it (base64url, prefixed). */
const encode = (s: object) =>
  `base64-${Buffer.from(JSON.stringify(s)).toString("base64url")}`;
const decode = (v: string) =>
  JSON.parse(Buffer.from(v.slice("base64-".length), "base64url").toString());

/** The request's cookies, as Next hands them to a handler (mutable) or to a render (sealed). */
function cookiesOf(value: string, kind: "route handler" | "server component") {
  const request = new RequestCookies(
    new Headers({ cookie: `${COOKIE}=${value}` }),
  );
  return kind === "route handler"
    ? MutableRequestCookiesAdapter.wrap(request)
    : RequestCookiesAdapter.seal(request);
}

/** Supabase Auth, as far as a refresh and a `getUser()` reach it. */
const auth = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  const asked = `${init?.method ?? "GET"} ${url.pathname}${url.search}`;
  if (asked === "POST /auth/v1/token?grant_type=refresh_token")
    return Response.json(session("new-access", "new-refresh", nowS() + 3600));
  if (asked === "GET /auth/v1/user") return Response.json(USER);
  return new Response(`not stood in for: ${asked}`, { status: 500 });
});
const asked = () =>
  auth.mock.calls.map(([input, init]) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    return `${init?.method ?? "GET"} ${url.pathname}`;
  });

beforeEach(() => {
  auth.mockClear();
  vi.stubGlobal("fetch", auth);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("★ an expired access token, met where the proxy no longer runs", () => {
  it("a route handler refreshes it, and the new session reaches its response", async () => {
    const store = cookiesOf(
      encode(session("old-access", "old-refresh", nowS() - 60)),
      "route handler",
    );
    jar.store = store;

    const { data, error } = await (await createClient()).auth.getUser();
    expect(error).toBeNull();

    expect(data.user?.id).toBe(USER.id);
    expect(asked()).toStrictEqual(["POST /auth/v1/token", "GET /auth/v1/user"]);
    // What Next puts on the handler's response.
    const headers = new Headers();
    expect(appendMutableCookies(headers, store)).toBe(true);
    const written = headers
      .getSetCookie()
      .find((c) => c.startsWith(`${COOKIE}=`));
    expect(written, "the refreshed session's Set-Cookie").toBeTruthy();
    const value = written!.slice(`${COOKIE}=`.length).split(";")[0];
    expect(decode(decodeURIComponent(value))).toMatchObject({
      access_token: "new-access",
      refresh_token: "new-refresh",
    });
  });

  it("★ a Server Component's render spends it and loses it: the reason a session page keeps the proxy before it", async () => {
    const value = encode(session("old-access", "old-refresh", nowS() - 60));
    jar.store = cookiesOf(value, "server component");

    const { data, error } = await (await createClient()).auth.getUser();
    expect(error).toBeNull();

    // The render still answers, and the old refresh token is spent, but nothing can carry the new one back.
    expect(data.user?.id).toBe(USER.id);
    expect(asked()).toContain("POST /auth/v1/token");
    expect(
      (jar.store as InstanceType<typeof RequestCookies>).get(COOKIE)?.value,
    ).toBe(value);
  });

  it("a live access token costs no refresh and writes nothing", async () => {
    const store = cookiesOf(
      encode(session("live-access", "live-refresh", nowS() + 1800)),
      "route handler",
    );
    jar.store = store;

    const { data, error } = await (await createClient()).auth.getUser();
    expect(error).toBeNull();

    expect(data.user?.id).toBe(USER.id);
    expect(asked()).toStrictEqual(["GET /auth/v1/user"]);
    expect(appendMutableCookies(new Headers(), store)).toBe(false);
  });
});
