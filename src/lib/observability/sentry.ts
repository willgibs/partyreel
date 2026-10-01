/**
 * Single source for Sentry wiring (R2 of the admin portal — see docs/ROADMAP "Admin portal").
 *
 * - `commonInit` is spread by sentry.server.config / sentry.edge.config /
 *   instrumentation-client so all three runtimes share one config (DSN, sampling, PII scrub).
 * - It is **DSN-gated and Vercel-only**: with `NEXT_PUBLIC_SENTRY_DSN` unset (unconfigured), or on
 *   anything but a Vercel production or preview deployment (`next dev`, a local `next start`, a
 *   test), `enabled: false` makes init a no-op — nothing is sent and the build/gate stay green
 *   (mirrors assert*Env). See `isVercelDeployment` for why a DSN alone is not enough.
 * - `captureError` / `captureWarning` are the ONLY way the app records a SWALLOWED error (unhandled
 *   throws are auto-captured by `onRequestError` in instrumentation.ts, which is `captureRequestError`
 *   below). They tag a coarse `area` so issues filter cleanly. Keep Sentry OUT of src/lib/db/* —
 *   capture at route/action entry points.
 */
import * as Sentry from "@sentry/nextjs";

import { env } from "@/lib/env";

// Coarse source area for filtering issues. Extend as new capture sites land.
// The render:* areas are the route-group error boundaries (error.tsx /
// global-error.tsx) so render crashes filter separately from handled flows.
export type SentryArea =
  | "upload"
  | "webhook"
  | "billing"
  | "cron"
  | "admin"
  | "media"
  | "account"
  | "security"
  | "export"
  | "reel"
  // The row-cap tripwire (lib/supabase/row-cap-tripwire.ts): a read that came back clipped at 1,000.
  | "db"
  | "other"
  | "render:app"
  | "render:guest"
  | "render:marketing"
  | "render:admin"
  | "render:auth"
  | "render:global";

const dsn = env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * ★ ONLY A VERCEL DEPLOYMENT REPORTS, AND A DSN ALONE IS NOT ONE. `.env.local` holds the production
 * project's DSN (the source-map upload's creds sit beside it), so `Boolean(dsn)` sent every
 * localhost run, `next dev` and a local `next start` alike, into that project as
 * `environment=development` or `production`, which buried the real deployments' errors under a
 * developer's own, in the project the red-teams read.
 *
 * The marker is the one Vercel stamps on the build, read the way the SDK reads it to name its own
 * `environment` (`VERCEL_ENV` on the server and the edge, `NEXT_PUBLIC_VERCEL_ENV` in the browser,
 * where Vercel exposes it to client bundles). `production` and `preview` both report, so the
 * launch-prep alias and its red-teams keep their errors. `development` is `vercel dev`, or an
 * `.env.local` pulled from Vercel, so it stays quiet like unset, which is every local run.
 *
 * ★ A Vercel project must expose its system environment variables, or its BROWSER goes quiet
 * (the server and the edge read the runtime variable). Check a project's setting by its first
 * browser error: it must read `vercel-production` or `vercel-preview`, never `production`.
 */
export function isVercelDeployment(vercelEnv: string | undefined): boolean {
  return Boolean(vercelEnv) && vercelEnv !== "development";
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

function redactEmails(s: string): string {
  return s.replace(EMAIL_RE, "[redacted-email]");
}

/**
 * Last-line PII scrub before an event leaves the process. `sendDefaultPii: false` already drops
 * IP / cookies / headers; this additionally strips query strings from any captured request URL
 * (R2 presigns carry signatures + tokens) and redacts email-looking text from the message +
 * exception values. Conservative on purpose — over-redacting telemetry is the safe failure.
 */
function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.request?.url) {
    event.request.url = event.request.url.split("?")[0];
  }
  if (event.message) {
    event.message = redactEmails(event.message);
  }
  for (const ex of event.exception?.values ?? []) {
    if (ex.value) ex.value = redactEmails(ex.value);
  }
  return event;
}

/**
 * Shared init options. `tracesSampleRate: 0.1` samples a little performance tracing (P95 latency /
 * DB timing, errors link to their trace; tune at launch). Session Replay is client-only and added
 * in instrumentation-client.ts (on-error, media-blocked).
 */
export const commonInit = {
  dsn,
  enabled:
    Boolean(dsn) &&
    isVercelDeployment(
      process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV,
    ),
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend: scrubEvent,
};

/**
 * VERCEL FREEZES THE FUNCTION THE INSTANT ITS RESPONSE IS SENT (DEFECT 3, the
 * alias red-team, 2026-09-21). A bare `captureException`/`captureMessage` only
 * ENQUEUES an envelope; the SDK's own network write can lose the race against
 * the serverless runtime being frozen mid-flight, so swallowed-error warnings
 * never arrived (three presign 403s on the alias, zero
 * `upload_refused_unverified` events; 30 days, zero warning-level events from
 * `vercel-preview`/`production` at all).
 *
 * ★ THE REQUEST HOLDS THE FLUSH ITSELF (crumbs-40). The flush starts at the
 * capture, and its own promise goes to `after()` (`next/server`), which hands a
 * promise straight to the request's `waitUntil`, so the function lives until
 * the envelope is out (at most two seconds). It used to hand `after()` a
 * callback that STARTED a flush and returned at once, which let the request go
 * as soon as the callback ran. Outside Next's request scope `after()` throws,
 * and Vercel's own request context (the one `@vercel/functions`' `waitUntil`
 * reads, on both runtimes) holds it instead; with neither (a script, a test,
 * a local server, none of which freeze) the flush simply runs.
 *
 * ★ NEVER ON THE CLIENT: four "use client" boundaries (app/error.tsx ->
 * route-error.tsx, app/global-error.tsx, marketing-route-error.tsx) import this
 * module for `captureError` alone, so `next/server` is reached only behind
 * `typeof window` AND a DYNAMIC import — a static one would hand a browser
 * bundle a module it has no business resolving. (Verified against the
 * installed `next` package: `after()`'s own chain — work-async-storage.external
 * -> async-local-storage.js — never hard-`require`s `async_hooks`; it reads
 * `globalThis.AsyncLocalStorage` with a fallback, which is why Next allows it
 * on the edge runtime too and why this dynamic import is safe to bundle, even
 * though it never executes, into the client files above.)
 */
function holdServerFlush(): void {
  if (typeof window !== "undefined") return;
  const flushed = Sentry.flush(2000);
  void import("next/server")
    .then(({ after }) => {
      try {
        after(flushed);
      } catch {
        holdWithVercel(flushed);
      }
    })
    .catch(() => holdWithVercel(flushed));
}

type VercelRequestContext = {
  get?: () => { waitUntil?: (task: Promise<unknown>) => void } | undefined;
};

/** Vercel's own request context, as `@vercel/functions`' `waitUntil` reads it; nothing where there is none. */
function holdWithVercel(task: Promise<unknown>): void {
  const context = (globalThis as Record<symbol, unknown>)[
    Symbol.for("@vercel/request-context")
  ] as VercelRequestContext | undefined;
  context?.get?.()?.waitUntil?.(task);
}

/**
 * THE INSTRUMENTATION'S `onRequestError` (`instrumentation.ts`): Sentry's own capture of an unhandled throw (a route
 * handler, a Server Component, the proxy), its flush held by the request. ★ Sentry's own hands its flush to
 * `@sentry/core`'s `vercelWaitUntil`, which returns at once unless `EdgeRuntime` is defined
 * (getsentry/sentry-javascript#23087, open at 10.55), so on Vercel's Node.js runtime nothing held the function and
 * a crash's envelope raced the freeze: build 35's red-team lost one server crash event in three, the first hit after
 * a quiet spell, a cold function frozen with the envelope in flight.
 */
export function captureRequestError(
  ...args: Parameters<typeof Sentry.captureRequestError>
): void {
  Sentry.captureRequestError(...args);
  holdServerFlush();
}

/** Record a handled/swallowed error with a consistent `area` tag. Best-effort (Sentry no-ops if off). */
export function captureError(
  area: SentryArea,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  Sentry.captureException(error, { tags: { area }, extra });
  holdServerFlush();
}

/** Record a noteworthy non-exception condition (level=warning) with an `area` tag. */
export function captureWarning(
  area: SentryArea,
  message: string,
  extra?: Record<string, unknown>,
): void {
  Sentry.captureMessage(message, { level: "warning", tags: { area }, extra });
  holdServerFlush();
}
