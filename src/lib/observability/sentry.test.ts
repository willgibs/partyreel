/**
 * DEFECT 3 (the alias red-team, 2026-09-21): a server capture now schedules a
 * flush, a client one never does. `@sentry/nextjs` is mocked wholesale — this
 * pins the SCHEDULING decision (does `Sentry.flush` get called, and is the
 * request held until it is done), never the SDK's own transport, which is
 * Sentry's contract, not ours.
 *
 * The two worlds are literal here rather than simulated: this file runs in
 * the `unit` vitest project (node env, no DOM), so "no window" is simply the
 * default — no stub needed, matching how a Vercel server function actually
 * runs. "Client" is `vi.stubGlobal("window", {})`, the same technique
 * `src/lib/analytics/web.test.ts` already uses for an identical
 * environment-dependent branch. `next/server`'s `after()` is mocked, so the
 * pins can read what the request is handed to hold (crumbs-40: the flush's own
 * promise, where a callback that merely started one held nothing); a case
 * that makes it throw, as it does outside a request scope, reads Vercel's own
 * request context instead.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Both vi.mock AND vi.hoisted run before this file's own `import`s resolve
// (plain top-level statements, including a plain `process.env` assignment,
// do NOT — imports are evaluated first regardless of source order), so
// setting env.ts's eagerly-validated public vars has to happen INSIDE a
// hoisted block too, same reason vitest.setup.ts sets them for the component
// project: sentry.ts imports env, and importing sentry.ts below is what
// triggers env.ts's own eager parse.
const {
  captureException,
  captureMessage,
  captureRequestErrorSdk,
  flush,
  after,
} = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= "test-publishable-key";
  return {
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    captureRequestErrorSdk: vi.fn(),
    // A fresh promise a call, so a pin can tell WHICH flush the request holds.
    flush: vi.fn(() => Promise.resolve(true)),
    after: vi.fn(),
  };
});
vi.mock("@sentry/nextjs", () => ({
  captureException,
  captureMessage,
  captureRequestError: captureRequestErrorSdk,
  flush,
}));
vi.mock("next/server", () => ({ after }));

import { captureError, captureRequestError, captureWarning } from "./sentry";

beforeEach(() => {
  vi.clearAllMocks();
});

const VERCEL_CONTEXT = Symbol.for("@vercel/request-context");

afterEach(() => {
  vi.unstubAllGlobals();
  delete (globalThis as Record<symbol, unknown>)[VERCEL_CONTEXT];
});

describe("captureError / captureWarning: the scheduled flush", () => {
  it("a server capture (no window) flushes — captureError", async () => {
    captureError("upload", new Error("boom"));
    expect(captureException).toHaveBeenCalledTimes(1);
    // scheduleServerFlush's own import()/after() chain resolves on a later
    // microtask than the synchronous capture call.
    await vi.waitFor(() => expect(flush).toHaveBeenCalledTimes(1));
  });

  it("a server capture (no window) flushes — captureWarning", async () => {
    captureWarning("security", "abuse_limiter_unavailable_fail_open");
    expect(captureMessage).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(flush).toHaveBeenCalledTimes(1));
  });

  it("a client capture never flushes — captureError", async () => {
    vi.stubGlobal("window", {});
    captureError("render:app", new Error("boom"));
    expect(captureException).toHaveBeenCalledTimes(1);
    // Give the (never-scheduled) microtask chain a turn to prove the negative.
    await new Promise((r) => setTimeout(r, 0));
    expect(flush).not.toHaveBeenCalled();
  });

  it("a client capture never flushes — captureWarning", async () => {
    vi.stubGlobal("window", {});
    captureWarning("upload", "some warning");
    expect(captureMessage).toHaveBeenCalledTimes(1);
    await new Promise((r) => setTimeout(r, 0));
    expect(flush).not.toHaveBeenCalled();
  });

  // ★ THE REQUEST HOLDS THE FLUSH ITSELF (crumbs-40). The helpers handed `after()` a callback that started a flush
  // and returned at once, so the request was let go before the envelope was out; Vercel's waitUntil now holds the
  // flush's own promise, up to its two seconds.
  it("★ hands the request the flush's own promise to hold", async () => {
    captureError("upload", new Error("boom"));
    await vi.waitFor(() => expect(after).toHaveBeenCalledTimes(1));
    expect(after.mock.calls[0][0]).toBe(flush.mock.results[0].value);
  });

  it("still tags the area and carries extra, unchanged by the flush", () => {
    captureError("webhook", new Error("bad signature"), { eventId: "evt_1" });
    expect(captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { area: "webhook" },
      extra: { eventId: "evt_1" },
    });
  });
});

/**
 * ★ A SERVER CRASH'S EVENT OUTLIVES THE RESPONSE (crumbs-40, build 35's red-team: one of three server crash events
 * lost, the first hit after a quiet spell). `onRequestError` was Sentry's own `captureRequestError`, which hands its
 * flush to `@sentry/core`'s `vercelWaitUntil`, and that returns at once unless `EdgeRuntime` is defined
 * (getsentry/sentry-javascript#23087): on Vercel's Node.js runtime nothing held the function, so a cold one froze
 * with the envelope still in flight. Ours is Sentry's capture, with the flush held by the request.
 */
describe("captureRequestError: the instrumentation's onRequestError", () => {
  const request = {
    path: "/design/lab/tools/boom",
    method: "GET",
    headers: {},
  };
  const context = {
    routerKind: "App Router" as const,
    routePath: "/design/lab/tools/boom",
    routeType: "render" as const,
  };

  it("★ is Sentry's own capture, with its flush held by the request", async () => {
    const error = new Error("design-lab boundary probe");
    captureRequestError(error, request, context);
    expect(captureRequestErrorSdk).toHaveBeenCalledWith(
      error,
      request,
      context,
    );
    await vi.waitFor(() => expect(after).toHaveBeenCalledTimes(1));
    expect(after.mock.calls[0][0]).toBe(flush.mock.results[0].value);
  });

  it("outside Next's request scope, Vercel's own request context holds it", async () => {
    after.mockImplementationOnce(() => {
      throw new Error("`after` was called outside a request scope.");
    });
    const waitUntil = vi.fn();
    (globalThis as Record<symbol, unknown>)[VERCEL_CONTEXT] = {
      get: () => ({ waitUntil }),
    };
    captureRequestError(new Error("boom"), request, context);
    await vi.waitFor(() => expect(waitUntil).toHaveBeenCalledTimes(1));
    expect(waitUntil.mock.calls[0][0]).toBe(flush.mock.results[0].value);
  });

  it("with neither, the flush still runs on its own", async () => {
    after.mockImplementationOnce(() => {
      throw new Error("`after` was called outside a request scope.");
    });
    captureRequestError(new Error("boom"), request, context);
    expect(flush).toHaveBeenCalledTimes(1);
  });
});

/**
 * ONLY A VERCEL DEPLOYMENT REPORTS (crumbs-34). `.env.local` holds the production project's DSN, and
 * `enabled: Boolean(dsn)` sent every localhost run into it as `environment=development`. The gate is
 * read at import, so each case imports a fresh copy of the module under its own environment: the
 * DSN, the server's `VERCEL_ENV` and the browser's `NEXT_PUBLIC_VERCEL_ENV`.
 */
describe("commonInit.enabled: a DSN reports only from a Vercel deployment", () => {
  const DSN = "https://public@o0.ingest.sentry.io/1";

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function enabledUnder(vars: {
    dsn?: string;
    serverEnv?: string;
    browserEnv?: string;
  }): Promise<boolean> {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", vars.dsn);
    vi.stubEnv("VERCEL_ENV", vars.serverEnv);
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", vars.browserEnv);
    const { commonInit } = await import("./sentry");
    return commonInit.enabled;
  }

  it("a localhost run stays quiet with the DSN in .env.local (the report that began this)", async () => {
    expect(await enabledUnder({ dsn: DSN })).toBe(false);
  });

  it("an .env.local pulled from Vercel (VERCEL_ENV=development) is a localhost run too", async () => {
    expect(await enabledUnder({ dsn: DSN, serverEnv: "development" })).toBe(
      false,
    );
    expect(await enabledUnder({ dsn: DSN, browserEnv: "development" })).toBe(
      false,
    );
  });

  it("production and preview both report: the alias and its red-teams keep their errors", async () => {
    expect(await enabledUnder({ dsn: DSN, serverEnv: "production" })).toBe(
      true,
    );
    expect(await enabledUnder({ dsn: DSN, serverEnv: "preview" })).toBe(true);
  });

  it("the browser reads Vercel's exposed copy of the same marker", async () => {
    expect(await enabledUnder({ dsn: DSN, browserEnv: "preview" })).toBe(true);
    expect(await enabledUnder({ dsn: DSN, browserEnv: "production" })).toBe(
      true,
    );
  });

  it("a deployment with no DSN stays a no-op: an unconfigured build is green, never an error", async () => {
    expect(await enabledUnder({ serverEnv: "production" })).toBe(false);
  });
});

describe("isVercelDeployment", () => {
  it("is Vercel's own production and preview, and nothing local", async () => {
    const { isVercelDeployment } = await import("./sentry");
    expect(isVercelDeployment("production")).toBe(true);
    expect(isVercelDeployment("preview")).toBe(true);
    expect(isVercelDeployment("development")).toBe(false);
    expect(isVercelDeployment("")).toBe(false);
    expect(isVercelDeployment(undefined)).toBe(false);
  });
});
