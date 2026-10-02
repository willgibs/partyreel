import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  type FetchHost,
  installPrefetchGuard,
  isKeylessGatePrefetch,
} from "./prefetch-guard";

/**
 * THE LAB NEVER ASKS THE GATE WITHOUT THE KEY (lab-prefetch, from build 38's red-team LOW).
 *
 * Next prefetches a route's tree again without the query for every prefetched URL that has one
 * (scheduler `pingRoute`), and every lab URL has `?key=`, so a link nobody can switch off from the
 * outside (a production `<Link href="#">` a board draws, a Library specimen) sent a keyless request
 * the proxy 404s: a console error each, on a production build only. These pin what the guard refuses
 * (exactly what the proxy would) and, as much, what it never touches.
 */
const ORIGIN = "https://lab.test";

/** The headers Next's own prefetch sends, as `createFetch` hands them to `fetch`. */
const PREFETCH = {
  rsc: "1",
  "next-router-prefetch": "1",
  "next-router-segment-prefetch": "/_tree",
};

const asks = (url: string | URL | Request, headers?: HeadersInit) =>
  isKeylessGatePrefetch(url, headers ? { headers } : undefined, ORIGIN);

describe("what counts as a keyless prefetch of the gate", () => {
  it("★ is Next's prefetch of a /design URL with no key", () => {
    expect(
      asks(new URL(`${ORIGIN}/design/lab/event-ready?_rsc=abc`), PREFETCH),
    ).toBe(true);
    expect(asks(`${ORIGIN}/design/lab?_rsc=abc`, PREFETCH)).toBe(true);
    expect(asks(`${ORIGIN}/design/library/logo?_rsc=abc`, PREFETCH)).toBe(true);
  });

  it("reads the header in any case, from any shape headers come in", () => {
    const url = `${ORIGIN}/design/lab?_rsc=abc`;
    expect(asks(url, { "Next-Router-Prefetch": "1" })).toBe(true);
    expect(asks(url, new Headers({ "Next-Router-Prefetch": "1" }))).toBe(true);
    expect(asks(url, [["next-router-prefetch", "1"]])).toBe(true);
  });

  it("answers for the bare /design and a trailing slash, and for a relative href", () => {
    expect(asks(`${ORIGIN}/design?_rsc=abc`, PREFETCH)).toBe(true);
    expect(asks(`${ORIGIN}/design/?_rsc=abc`, PREFETCH)).toBe(true);
    expect(asks("/design/lab?_rsc=abc", PREFETCH)).toBe(true);
  });

  it("★ lets a keyed prefetch through: the key is the whole of what the gate asks", () => {
    expect(asks(`${ORIGIN}/design/lab?key=fiesta&_rsc=abc`, PREFETCH)).toBe(
      false,
    );
    expect(asks(`${ORIGIN}/design/lab?_rsc=abc&key=fiesta`, PREFETCH)).toBe(
      false,
    );
  });

  it("counts an empty key as none, as the proxy does", () => {
    expect(asks(`${ORIGIN}/design/lab?key=&_rsc=abc`, PREFETCH)).toBe(true);
  });

  it("★ is only a prefetch: a navigation, or a fetch with no headers at all, is the page's own", () => {
    const url = `${ORIGIN}/design/lab?_rsc=abc`;
    expect(asks(url, { rsc: "1" })).toBe(false);
    expect(asks(url)).toBe(false);
  });

  it("is only the gate: another path, a lookalike prefix and another origin are not its business", () => {
    expect(asks(`${ORIGIN}/pricing?_rsc=abc`, PREFETCH)).toBe(false);
    expect(asks(`${ORIGIN}/dashboard/abc?room=settings`, PREFETCH)).toBe(false);
    expect(asks(`${ORIGIN}/designer?_rsc=abc`, PREFETCH)).toBe(false);
    expect(asks(`${ORIGIN}/api/design-gate?_rsc=abc`, PREFETCH)).toBe(false);
    expect(asks("https://partyreel.com/design/lab?_rsc=abc", PREFETCH)).toBe(
      false,
    );
  });

  it("takes a Request's own headers, and an init's replace them as fetch does", () => {
    const url = `${ORIGIN}/design/lab?_rsc=abc`;
    const request = new Request(url, { headers: PREFETCH });
    expect(isKeylessGatePrefetch(request, undefined, ORIGIN)).toBe(true);
    expect(
      isKeylessGatePrefetch(request, { headers: { rsc: "1" } }, ORIGIN),
    ).toBe(false);
  });

  it("never throws on an href it cannot read", () => {
    expect(asks("http://", PREFETCH)).toBe(false);
  });

  it("★ holds to the proxy's own test of a /design request", () => {
    const proxy = readFileSync(join(process.cwd(), "src/proxy.ts"), "utf8");
    expect(
      proxy,
      "src/proxy.ts gates a different set of paths: move the guard's test of `/design` with it",
    ).toContain('pathname === "/design" || pathname.startsWith("/design/")');
  });
});

/** A window stand-in whose fetch records how it was called and answers 200. */
function host() {
  const real = vi.fn(async () => new Response("real", { status: 200 }));
  const win: FetchHost = {
    fetch: real as unknown as typeof fetch,
    location: { origin: ORIGIN },
  };
  return { win, real };
}

describe("the guard on a window's fetch", () => {
  it("★ answers a keyless prefetch with the gate's 404 and sends nothing", async () => {
    const { win, real } = host();
    installPrefetchGuard(win);
    const response = await win.fetch(
      new URL(`${ORIGIN}/design/lab/event-ready?_rsc=abc`),
      { headers: PREFETCH },
    );
    expect(response.status).toBe(404);
    expect(response.ok).toBe(false);
    expect(real).not.toHaveBeenCalled();
  });

  it("★ hands everything else on untouched, with the window as `this`", async () => {
    const { win, real } = host();
    installPrefetchGuard(win);
    const keyed = new URL(`${ORIGIN}/design/lab?key=fiesta&_rsc=abc`);
    const init = { headers: PREFETCH };
    expect((await win.fetch(keyed, init)).status).toBe(200);
    expect(real).toHaveBeenLastCalledWith(keyed, init);
    // A navigation to the gate, a prefetch of a site route, a plain request.
    await win.fetch(`${ORIGIN}/design/lab?_rsc=abc`, { headers: { rsc: "1" } });
    await win.fetch(`${ORIGIN}/pricing?_rsc=abc`, { headers: PREFETCH });
    await win.fetch(`${ORIGIN}/api/anything`);
    expect(real).toHaveBeenCalledTimes(4);
    expect(real.mock.contexts.every((c) => c === win)).toBe(true);
  });

  it("gives the original back when it unmounts", async () => {
    const { win, real } = host();
    const original = win.fetch;
    const uninstall = installPrefetchGuard(win);
    expect(win.fetch).not.toBe(original);
    uninstall();
    expect(win.fetch).toBe(original);
    await win.fetch(`${ORIGIN}/design/lab?_rsc=abc`, { headers: PREFETCH });
    expect(real).toHaveBeenCalledTimes(1);
  });

  it("★ stays out of the way of a wrapper added after it, and goes quiet", async () => {
    const { win, real } = host();
    const uninstall = installPrefetchGuard(win);
    // Something that instruments fetch later (an error reporter) wraps the guard.
    const guarded = win.fetch;
    const later = vi.fn((...args: Parameters<typeof fetch>) =>
      guarded(...args),
    ) as unknown as typeof fetch;
    win.fetch = later;
    uninstall();
    // Nobody's wrapper is torn out ...
    expect(win.fetch).toBe(later);
    // ... and the guard no longer answers for the lab.
    const response = await win.fetch(`${ORIGIN}/design/lab?_rsc=abc`, {
      headers: PREFETCH,
    });
    expect(response.status).toBe(200);
    expect(real).toHaveBeenCalledTimes(1);
  });
});
