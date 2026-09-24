/**
 * Single source for Sentry wiring (R2 of the admin portal — see docs/ROADMAP "Admin portal").
 *
 * - `commonInit` is spread by sentry.server.config / sentry.edge.config /
 *   instrumentation-client so all three runtimes share one config (DSN, sampling, PII scrub).
 * - It is **DSN-gated**: with `NEXT_PUBLIC_SENTRY_DSN` unset (local dev / unconfigured), `enabled:
 *   false` makes init a no-op — nothing is sent and the build/gate stay green (mirrors assert*Env).
 * - `captureError` / `captureWarning` are the ONLY way the app records a SWALLOWED error (unhandled
 *   throws are auto-captured by `onRequestError` in instrumentation.ts). They tag a coarse `area`
 *   so issues filter cleanly. Keep Sentry OUT of src/lib/db/* — capture at route/action entry points.
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
  enabled: Boolean(dsn),
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend: scrubEvent,
};

/**
 * VERCEL FREEZES THE FUNCTION THE INSTANT ITS RESPONSE IS SENT (DEFECT 3, the
 * alias red-team, 2026-09-21). A bare `captureException`/`captureMessage` only
 * ENQUEUES an envelope; the SDK's own network write can lose the race against
 * the serverless runtime being frozen mid-flight. `onRequestError`'s crash path
 * already awaits `Sentry.flush` (instrumentation.ts), which is exactly why
 * crashes arrive and thirteen swallowed-error callers' warnings did not (three
 * presign 403s on the alias, zero `upload_refused_unverified` events; 30 days,
 * zero warning-level events from `vercel-preview`/`production` at all).
 *
 * `after()` (`next/server`) ties the flush to the REQUEST's own lifetime via
 * Vercel's `waitUntil`, which is the fix. ★ NEVER ON THE CLIENT: four "use
 * client" boundaries (app/error.tsx -> route-error.tsx, app/global-error.tsx,
 * marketing-route-error.tsx) import this module for `captureError` alone, so
 * `next/server` is reached only behind `typeof window` AND a DYNAMIC import —
 * a static one would hand a browser bundle a module it has no business
 * resolving. (Verified against the installed `next` package: `after()`'s own
 * chain — work-async-storage.external -> async-local-storage.js — never hard-
 * `require`s `async_hooks`; it reads `globalThis.AsyncLocalStorage` with a
 * fallback, which is why Next allows it on the edge runtime too and why this
 * dynamic import is safe to bundle, even though it never executes, into the
 * client files above.) A capture with no request scope behind it (a script, a
 * test) meets `after()`'s own synchronous throw and flushes directly rather
 * than losing the event for want of one.
 */
function scheduleServerFlush(): void {
  if (typeof window !== "undefined") return;
  void import("next/server")
    .then(({ after }) => {
      try {
        after(() => {
          void Sentry.flush(2000);
        });
      } catch {
        void Sentry.flush(2000);
      }
    })
    .catch(() => {
      void Sentry.flush(2000);
    });
}

/** Record a handled/swallowed error with a consistent `area` tag. Best-effort (Sentry no-ops if off). */
export function captureError(
  area: SentryArea,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  Sentry.captureException(error, { tags: { area }, extra });
  scheduleServerFlush();
}

/** Record a noteworthy non-exception condition (level=warning) with an `area` tag. */
export function captureWarning(
  area: SentryArea,
  message: string,
  extra?: Record<string, unknown>,
): void {
  Sentry.captureMessage(message, { level: "warning", tags: { area }, extra });
  scheduleServerFlush();
}
