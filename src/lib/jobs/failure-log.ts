/**
 * THE FAILURE LOG for the jobs that have no schedule — the `signal` entries in the catalog
 * (transactional email, the abuse limiter, the unlock limiter).
 *
 * WHY IT EXISTS: all three are paths that are SUPPOSED to be silent. The limiters fail OPEN on
 * purpose (the capability token is the real gate), and `sendOnce` releases its claim and lets the
 * next nightly run try again. Both are right, and both mean a permanently broken dependency looks
 * exactly like a quiet night: nothing throws to a user, nothing shows on any console. ROADMAP QA #19
 * named the limiter half of this; the email half is the same shape.
 *
 * TWO SIGNALS, one call:
 *
 *   Sentry  — every time, unthrottled. It is the page, it groups and dedupes on its own side, and it
 *             carries the stack. Nothing here decides an operator should not hear about a failure.
 *   job_runs — a closed `error` row, THROTTLED per process. The row is only there so /admin/jobs can
 *             answer "did anything fail in the last 24 hours?" without a trip to Sentry, and one row
 *             is enough to answer it. Unthrottled, a database outage would turn one failed read per
 *             REQUEST into a write storm against the very table the health console reads.
 *
 * The throttle is a module-level map, so it is per serverless instance and resets on a cold start.
 * That is deliberate: it bounds a stampede without ever hiding the FIRST failure on any instance,
 * which is the one the signal needs. It means the 24h count is a floor, not a census — read it as
 * "something failed", never as "exactly N things failed", and the card says so.
 *
 * Never throws. Every caller is already handling a failure and must not be handed a second one.
 */
import "server-only";

import type { JobId } from "@/app/admin/jobs/catalog";
import { recordJobFailure } from "@/lib/db/queries/jobs";
import { Throttle } from "@/lib/jobs/throttle";
import { captureError, type SentryArea } from "@/lib/observability/sentry";

/** One recorded row per job per window, per instance. Fifteen minutes: four an hour, at most. */
export const FAILURE_LOG_WINDOW_MS = 15 * 60 * 1000;

const throttle = new Throttle<JobId>(FAILURE_LOG_WINDOW_MS);

/** Test seam only — the throttle is process state, so a test has to be able to clear it. */
export function resetFailureLogThrottle(): void {
  throttle.reset();
}

export type SignalFailure = {
  /** The catalog entry this failure belongs to. */
  job: JobId;
  /** The Sentry area tag, so the event lands with the rest of its neighbourhood. */
  area: SentryArea;
  /** What was being attempted, in the operator's words: "resend send (over_cap_reminder)". */
  operation: string;
  error: unknown;
  /** Extra Sentry context. Never anything that could carry an address or a token. */
  extra?: Record<string, unknown>;
};

/**
 * Record a failure in a signal job. Fire-and-forget friendly: the promise resolves even when both
 * halves fail, so a caller inside a catch block can `await` it without a second try/catch.
 */
export async function recordSignalFailure(
  failure: SignalFailure,
): Promise<void> {
  const { job, area, operation, error, extra } = failure;
  try {
    captureError(area, error, { ...extra, job, operation });
  } catch {
    // Sentry is best-effort by construction; a capture that throws must not cost us the row.
  }

  if (!throttle.claim(job, Date.now())) return;
  try {
    // The NOTE carries the operation, never the error text: a failed send's message can quote the
    // recipient address, and this row is read on a page, not in a scrubbed Sentry event.
    await recordJobFailure(job, operation);
  } catch {
    // The failure log failing is not worth failing over. Sentry already has the original.
  }
}
