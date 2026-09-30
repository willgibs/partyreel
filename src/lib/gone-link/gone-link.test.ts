import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE 404 STATUS FOR A LINK THAT NAMES NOTHING (stale-link). The proxy sets it before the page renders, because
 * Next 16 gives a page no way to set its own and a thrown `notFound()` is served as the white error shell. Pinned:
 * which requests are asked about (the page's own path, a browser's load, never the router's own fetches or the
 * demo), that the question is the page's own RPC asked by nobody with the page's own normalisation, and that
 * anything short of a clear "nothing" (a row of any kind, an error, a throw, a slow answer) leaves the status alone,
 * so a live album or handle can never be sent on as a 404.
 */

type RpcResult = { data: unknown; error: unknown };

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  answer: (async () => ({ data: [], error: null })) as (
    signal: AbortSignal,
  ) => Promise<RpcResult>,
  signals: [] as AbortSignal[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/demo", () => ({
  isDemoToken: (token: string) => token === "demo-token",
}));
vi.mock("@/lib/supabase/anon", () => ({
  createAnonClient: () => ({
    rpc: (name: string, args: unknown) => {
      mocks.rpc(name, args);
      return {
        abortSignal: (signal: AbortSignal) => {
          mocks.signals.push(signal);
          return mocks.answer(signal);
        },
      };
    },
  }),
}));

const { goneLinkLookup, goneLinkStatus, isDocumentRequest, TIMEOUT_MS } =
  await import("./index");

function request(
  path: string,
  { method = "GET", headers = {} as Record<string, string> } = {},
) {
  return {
    method,
    headers: new Headers(headers),
    nextUrl: { pathname: path },
  };
}

beforeEach(() => {
  mocks.rpc.mockClear();
  mocks.signals.length = 0;
  mocks.answer = async () => ({ data: [], error: null });
});

describe("the paths the database decides", () => {
  it("is the guest link and the profile, one segment and nothing under it", () => {
    expect(goneLinkLookup("/e/abc123")).toEqual({
      kind: "guest-link",
      token: "abc123",
    });
    expect(goneLinkLookup("/e/maya-wedding/")).toEqual({
      kind: "guest-link",
      token: "maya-wedding",
    });
    expect(goneLinkLookup("/u/willg")).toEqual({
      kind: "profile",
      slug: "willg",
    });
    // The card route answers for itself; the bare prefixes are other routes, or none.
    for (const path of [
      "/e/abc123/card",
      "/e/",
      "/e",
      "/u/",
      "/help/nope",
      "/dashboard/abc",
      "/ee/abc",
      "/",
    ]) {
      expect(goneLinkLookup(path), path).toBeNull();
    }
  });

  it("decodes the segment as Next decodes the page's param, and gives up on one that does not decode", () => {
    expect(goneLinkLookup("/e/a%20b")).toEqual({
      kind: "guest-link",
      token: "a b",
    });
    expect(goneLinkLookup("/u/%E0%A4%A")).toBeNull();
  });
});

describe("which requests are asked about", () => {
  it("is a page load: a GET or a HEAD whose destination is a document, or that names none", () => {
    const load = (method: string, dest?: string) =>
      isDocumentRequest(
        request("/e/x", {
          method,
          headers: dest ? { "sec-fetch-dest": dest } : {},
        }),
      );
    expect(load("GET", "document")).toBe(true);
    expect(load("GET", "iframe")).toBe(true);
    // An unfurler, a crawler or a link checker sends no Fetch Metadata, and reads the status.
    expect(load("GET")).toBe(true);
    expect(load("HEAD")).toBe(true);
    expect(load("POST", "document")).toBe(false);
  });

  it("is never the router's own fetch, which the proxy sees only as a fetch()", () => {
    // Next strips RSC, Next-Router-State-Tree and Next-Router-Prefetch before a proxy reads the request, so a client
    // navigation or a prefetch is told apart by the browser's own destination for a fetch().
    for (const dest of ["empty", "image", "script"]) {
      expect(
        isDocumentRequest(
          request("/e/x", { headers: { "sec-fetch-dest": dest } }),
        ),
        dest,
      ).toBe(false);
    }
  });
});

describe("the status a link that names nothing is sent on with", () => {
  it("is 404 when the page's own read finds no event, asked by nobody with the page's token", async () => {
    expect(await goneLinkStatus(request("/e/gone-token"))).toBe(404);
    expect(mocks.rpc).toHaveBeenCalledWith("get_event_by_qr_token", {
      p_qr_token: "gone-token",
    });
  });

  it("is left alone for any event the read answers, a private or blocked album included (a row is a row)", async () => {
    mocks.answer = async () => ({
      data: [{ id: "e1", visibility: "private", name: null }],
      error: null,
    });
    expect(await goneLinkStatus(request("/e/live-token"))).toBeUndefined();
  });

  it("is 404 for a handle nobody holds, asked with the page's own normalisation", async () => {
    mocks.answer = async () => ({ data: null, error: null });
    expect(await goneLinkStatus(request("/u/%20Nobody%20"))).toBe(404);
    expect(mocks.rpc).toHaveBeenCalledWith("get_public_profile", {
      p_slug: "nobody",
    });
  });

  it("is left alone for a held handle", async () => {
    mocks.answer = async () => ({
      data: { id: "p1", slug: "willg" },
      error: null,
    });
    expect(await goneLinkStatus(request("/u/willg"))).toBeUndefined();
  });

  it("is left alone on any doubt: an error, a throw, or an answer that is not a clear nothing", async () => {
    const doubts: (() => Promise<RpcResult>)[] = [
      async () => ({ data: null, error: { message: "boom" } }),
      async () => ({ data: [], error: { message: "boom" } }),
      async () => {
        throw new Error("network");
      },
      async () => ({ data: null, error: null }),
      async () => ({ data: "surprise", error: null }),
    ];
    for (const doubt of doubts) {
      mocks.answer = doubt;
      expect(await goneLinkStatus(request("/e/some-token"))).toBeUndefined();
    }
  });

  it("gives the database a deadline and leaves the status alone when it passes", async () => {
    mocks.answer = (signal) =>
      new Promise((resolve) =>
        signal.addEventListener("abort", () =>
          resolve({ data: null, error: { name: "AbortError" } }),
        ),
      );
    const started = Date.now();
    expect(await goneLinkStatus(request("/e/slow-token"))).toBeUndefined();
    expect(mocks.signals).toHaveLength(1);
    expect(Date.now() - started).toBeGreaterThanOrEqual(TIMEOUT_MS - 50);
    expect(Date.now() - started).toBeLessThan(TIMEOUT_MS + 1000);
  });

  it("asks nothing for the router's own fetches, the demo, a POST, or any other path", async () => {
    for (const r of [
      request("/e/gone-token", { headers: { "sec-fetch-dest": "empty" } }),
      request("/u/nobody", { headers: { "sec-fetch-dest": "empty" } }),
      request("/e/gone-token", { method: "POST" }),
      request("/e/demo-token"),
      request("/e/gone-token/card"),
      request("/help/nope"),
    ]) {
      expect(await goneLinkStatus(r)).toBeUndefined();
    }
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
