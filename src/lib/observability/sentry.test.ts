/**
 * DEFECT 3 (the alias red-team, 2026-09-21): a server capture now schedules a
 * flush, a client one never does. `@sentry/nextjs` is mocked wholesale — this
 * pins the SCHEDULING decision (does `Sentry.flush` get called at all), never
 * the SDK's own transport, which is Sentry's contract, not ours.
 *
 * The two worlds are literal here rather than simulated: this file runs in
 * the `unit` vitest project (node env, no DOM), so "no window" is simply the
 * default — no stub needed, matching how a Vercel server function actually
 * runs. "Client" is `vi.stubGlobal("window", {})`, the same technique
 * `src/lib/analytics/web.test.ts` already uses for an identical
 * environment-dependent branch. `next/server`'s own `after()` throws
 * synchronously outside a request scope (verified against the real installed
 * package), which this process always is, so the server case exercises the
 * catch-and-flush-directly fallback — still a call to `Sentry.flush`, which is
 * the one thing being pinned: THAT it is scheduled, not which of the two
 * internal paths got there.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Both vi.mock AND vi.hoisted run before this file's own `import`s resolve
// (plain top-level statements, including a plain `process.env` assignment,
// do NOT — imports are evaluated first regardless of source order), so
// setting env.ts's eagerly-validated public vars has to happen INSIDE a
// hoisted block too, same reason vitest.setup.ts sets them for the component
// project: sentry.ts imports env, and importing sentry.ts below is what
// triggers env.ts's own eager parse.
const { captureException, captureMessage, flush } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= "test-publishable-key";
  return {
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    flush: vi.fn().mockResolvedValue(true),
  };
});
vi.mock("@sentry/nextjs", () => ({ captureException, captureMessage, flush }));

import { captureError, captureWarning } from "./sentry";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
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

  it("still tags the area and carries extra, unchanged by the flush", () => {
    captureError("webhook", new Error("bad signature"), { eventId: "evt_1" });
    expect(captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { area: "webhook" },
      extra: { eventId: "evt_1" },
    });
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
