import { describe, expect, it, vi } from "vitest";

import {
  ALBUM_EDGE_WINDOW_MS,
  ALBUM_VERSION_PATH,
  albumVersionUrl,
  edgeWindowOf,
} from "@/lib/album/edge-version";

import {
  keepVersionAsksTrue,
  trueWindowUrl,
} from "../../scripts/compute-model/true-clock.mjs";

/**
 * THE COMPUTE HARNESS'S TRUE-CLOCK ASKS (`scripts/compute-model/true-clock.mjs`, crumbs-94): what `pnpm compute:model`
 * guarantees about the cheap "has anything changed?" ask of a phone whose `Date` the shim runs K times fast. A real phone's
 * clock is true, so its ask names the window the SERVER is in; the shim's page named its own racing clock's, was answered
 * `clock`, and fell back to a full sync a few ms later (milestone 40's hour scenarios: 43 calls against 26, 127 against
 * 74). The model rewrites `w` on the wire, with the product's own `edgeWindowOf`, and changes nothing in the product.
 * Held here because `run.mjs` measures the moment it is loaded and so cannot be imported.
 */

const KEY = "AbCdEfGhIjKlMnOpQrStUv";
/** A window of a clock running 20 times fast: nowhere near the server's. */
const shimmed = (base = "http://localhost:3131") =>
  `${base}${albumVersionUrl(KEY, 5_000_000_000)}`;

describe("trueWindowUrl", () => {
  it("★ names the window the server is in, through the product's own arithmetic, and leaves the album's key as it was", () => {
    const now = 1_760_000_000_000 + 1_234;
    const out = new URL(trueWindowUrl(shimmed(), now));
    expect(out.pathname).toBe(ALBUM_VERSION_PATH);
    expect(out.searchParams.get("w")).toBe(String(edgeWindowOf(now)));
    expect(out.searchParams.get("k")).toBe(KEY);
    // The ask's whole shape is its key and its window: nothing is added to it.
    expect([...out.searchParams.keys()].sort()).toEqual(["k", "w"]);
    expect(out.origin).toBe("http://localhost:3131");
  });

  it("moves with the server's clock, a window at a time", () => {
    const t0 = 1_760_000_000_000;
    const w = (now: number) =>
      new URL(trueWindowUrl(shimmed(), now)).searchParams.get("w");
    expect(w(t0)).toBe(w(t0 + 1));
    expect(Number(w(t0 + ALBUM_EDGE_WINDOW_MS))).toBe(Number(w(t0)) + 1);
  });

  it("leaves any other URL as it came: only the version ask is the model's to correct", () => {
    for (const href of [
      "http://localhost:3131/api/album/guest/sync",
      "http://localhost:3131/api/album/guest/media?w=7",
      "http://localhost:3131/e/abcd?w=7",
    ]) {
      expect(trueWindowUrl(href, 1_760_000_000_000)).toBe(href);
    }
  });
});

describe("keepVersionAsksTrue", () => {
  /** A DevTools connection and a session on it, recording what the model sent and letting the test raise events. */
  function device(sessionId = "session-1") {
    const listeners = new Set<(msg: unknown) => void>();
    const sent: { method: string; params: Record<string, unknown> }[] = [];
    const send = vi.fn(
      async (method: string, params: Record<string, unknown>) => {
        sent.push({ method, params });
        return {};
      },
    );
    const browser = {
      on(fn: (msg: unknown) => void) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
    };
    const raise = (msg: unknown) => listeners.forEach((fn) => fn(msg));
    const paused = (url: string, over: Record<string, unknown> = {}) =>
      raise({
        sessionId,
        method: "Fetch.requestPaused",
        params: { requestId: "r1", request: { url } },
        ...over,
      });
    return { browser, send, sent, raise, paused, sessionId, listeners };
  }

  it("★ pauses version asks, and no other request, on its own session", async () => {
    const d = device();
    await keepVersionAsksTrue({
      browser: d.browser,
      send: d.send,
      sessionId: d.sessionId,
    });
    expect(d.sent).toHaveLength(1);
    expect(d.sent[0].method).toBe("Fetch.enable");
    expect(d.sent[0].params).toEqual({
      patterns: [
        { urlPattern: `*${ALBUM_VERSION_PATH}*`, requestStage: "Request" },
      ],
    });
  });

  it("★ sends each paused ask on with the server's window, never the page's", async () => {
    const d = device();
    const now = 1_760_000_000_000 + 4_999;
    await keepVersionAsksTrue({
      browser: d.browser,
      send: d.send,
      sessionId: d.sessionId,
      now: () => now,
    });
    d.paused(shimmed());
    const resumed = d.sent.find((c) => c.method === "Fetch.continueRequest")!;
    expect(resumed.params.requestId).toBe("r1");
    const url = new URL(String(resumed.params.url));
    expect(url.searchParams.get("w")).toBe(String(edgeWindowOf(now)));
    expect(url.searchParams.get("k")).toBe(KEY);
  });

  it("answers each ask at the time it is paused: the window follows the server's clock through the run", async () => {
    const d = device();
    let now = 1_760_000_000_000;
    await keepVersionAsksTrue({
      browser: d.browser,
      send: d.send,
      sessionId: d.sessionId,
      now: () => now,
    });
    d.paused(shimmed());
    now += 15_000;
    d.paused(shimmed(), {
      params: { requestId: "r2", request: { url: shimmed() } },
    });
    const windows = d.sent
      .filter((c) => c.method === "Fetch.continueRequest")
      .map((c) => Number(new URL(String(c.params.url)).searchParams.get("w")));
    expect(windows).toEqual([
      edgeWindowOf(1_760_000_000_000),
      edgeWindowOf(1_760_000_015_000),
    ]);
    expect(windows[1] - windows[0]).toBe(3);
  });

  it("hears nothing from another device's session, nor any other event of its own", async () => {
    const d = device();
    await keepVersionAsksTrue({
      browser: d.browser,
      send: d.send,
      sessionId: d.sessionId,
    });
    // Another phone's ask is that phone's to correct (or not).
    d.paused(shimmed(), { sessionId: "session-2" });
    d.raise({
      sessionId: d.sessionId,
      method: "Network.requestWillBeSent",
      params: {},
    });
    expect(d.sent.filter((c) => c.method === "Fetch.continueRequest")).toEqual(
      [],
    );
  });

  it("never leaves a request paused: one whose address cannot be read goes on as it was", async () => {
    const d = device();
    await keepVersionAsksTrue({
      browser: d.browser,
      send: d.send,
      sessionId: d.sessionId,
    });
    d.paused("not a url at all");
    const resumed = d.sent.filter((c) => c.method === "Fetch.continueRequest");
    expect(resumed).toHaveLength(1);
    expect(resumed[0].params).toEqual({ requestId: "r1" });
  });

  it("a page that went away with its ask in the air is no failure of the model's", async () => {
    const d = device();
    await keepVersionAsksTrue({
      browser: d.browser,
      send: vi.fn(async (method: string) => {
        if (method === "Fetch.continueRequest")
          throw new Error("No such request");
        return {};
      }),
      sessionId: d.sessionId,
    });
    expect(() => d.paused(shimmed())).not.toThrow();
  });

  it("hands back the way to stop listening", async () => {
    const d = device();
    const off = await keepVersionAsksTrue({
      browser: d.browser,
      send: d.send,
      sessionId: d.sessionId,
    });
    expect(d.listeners.size).toBe(1);
    off();
    expect(d.listeners.size).toBe(0);
  });
});
