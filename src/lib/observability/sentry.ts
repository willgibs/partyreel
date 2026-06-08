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
export type SentryArea =
  | "upload"
  | "webhook"
  | "billing"
  | "cron"
  | "admin"
  | "media"
  | "account"
  | "security"
  | "other";

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

/** Record a handled/swallowed error with a consistent `area` tag. Best-effort (Sentry no-ops if off). */
export function captureError(
  area: SentryArea,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  Sentry.captureException(error, { tags: { area }, extra });
}

/** Record a noteworthy non-exception condition (level=warning) with an `area` tag. */
export function captureWarning(
  area: SentryArea,
  message: string,
  extra?: Record<string, unknown>,
): void {
  Sentry.captureMessage(message, { level: "warning", tags: { area }, extra });
}
