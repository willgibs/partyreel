"use client";

import { useLayoutEffect } from "react";

/**
 * THE LAB NEVER ASKS THE GATE WITHOUT THE KEY (lab-prefetch, 2026-10-02).
 *
 * ★ NEXT PREFETCHES A ROUTE WITHOUT THE QUERY THAT OPENS IT. For every
 * prefetched URL that has a query string, Next's scheduler (`pingRoute`) also
 * fetches the same path's route tree with the query stripped, as a base for
 * optimistic routing. Every lab URL carries `?key=`, so every prefetching link
 * that resolves into `/design` sends a request the proxy refuses
 * (`designGateOpen`) and Chrome logs as a console error: the step's "Open the
 * whole board", a doc's link, the Library's own links (a Library page logs
 * dozens) and every production `<Link href="#">` a board draws, since `#`
 * resolves to the page the board is on, key and all.
 *
 * ★ A FRAME CANNOT SWITCH IT OFF FROM INSIDE. `next/link` reads one context
 * (the router) and schedules its prefetch through a module of its own
 * (`links.js`, which never consults the router it is handed), so no provider
 * reaches a link a board draws, and a null router would take `useRouter()` out
 * of every production component drawn beside it. The lab's own links say
 * `prefetch={false}` (`LabLink`, the step, the doc reader; `prefetch-policy
 * .test.ts` holds them). This is the net for everything else, one place for
 * every board today and tomorrow, and for the Library's specimens.
 *
 * It answers a keyless Next prefetch of a `/design` URL in the tab, with the
 * 404 the gate would have sent, before any request exists: Next reads a
 * non-2xx prefetch as a miss and asks again in ten seconds, exactly as it did,
 * and the server is spared the round trip. A navigation, a keyed prefetch and
 * a request to anywhere else pass through untouched, and the gate is still the
 * gate: a keyless request from any other client gets the same indistinguishable
 * 404. Mounted once by the shell, as `LabKeys` binds the window once.
 */

/** Next's own marker on a prefetch (`NEXT_ROUTER_PREFETCH_HEADER`), compared in lower case. */
const NEXT_PREFETCH_HEADER = "next-router-prefetch";

/** What the guard needs of a window, so a test can hand it a stand-in. */
export type FetchHost = {
  fetch: typeof fetch;
  location: { origin: string };
};

/**
 * Whether a fetch is a Next prefetch of a `/design` URL with no key: the one
 * request the proxy is certain to refuse. The gate's own test of "a /design
 * request" is `src/proxy.ts`'s, which `prefetch-guard.test.ts` holds this to.
 */
export function isKeylessGatePrefetch(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  origin: string,
): boolean {
  // `fetch(request, init)`: an init's headers replace the request's own.
  const headers =
    init?.headers ??
    (typeof input === "object" && "headers" in input
      ? input.headers
      : undefined);
  if (!headers || !new Headers(headers).has(NEXT_PREFETCH_HEADER)) return false;
  const href =
    typeof input === "string" ? input : "url" in input ? input.url : input.href;
  let url: URL;
  try {
    url = new URL(href, origin);
  } catch {
    return false;
  }
  if (url.origin !== origin) return false;
  const gated =
    url.pathname === "/design" || url.pathname.startsWith("/design/");
  return gated && !url.searchParams.get("key");
}

/** The answer the gate would have given, without the trip. */
const refusal = () =>
  new Response(null, { status: 404, statusText: "Not Found" });

/**
 * Wraps `host.fetch` and returns the way to unwrap it. Where something else has
 * wrapped it since, the guard stays in that chain and only goes quiet.
 */
export function installPrefetchGuard(host: FetchHost): () => void {
  const original = host.fetch;
  let on = true;
  const guarded: typeof fetch = (input, init) =>
    on && isKeylessGatePrefetch(input, init, host.location.origin)
      ? Promise.resolve(refusal())
      : original.call(host, input, init);
  host.fetch = guarded;
  return () => {
    on = false;
    if (host.fetch === guarded) host.fetch = original;
  };
}

/**
 * ★ A LAYOUT EFFECT, NOT A PASSIVE ONE: a link's first prefetch follows its
 * mount by tens of milliseconds (measured), and a passive effect has no promise
 * to land before it. A layout effect runs in the very commit that mounts the
 * links, before their observer has reported anything.
 */
export function PrefetchGuard(): null {
  useLayoutEffect(() => installPrefetchGuard(window), []);
  return null;
}
