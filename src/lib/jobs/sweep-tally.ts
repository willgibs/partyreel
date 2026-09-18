/**
 * The PURE half of the purge cron's sub-sweep promotion (the admin-jobs round): which sweep is a job
 * of its own, what of a sweep's tally is safe to store on its run row, and when a tally that
 * returned normally still has to close as a failure.
 *
 * Separate from `purge-sweeps.ts` because that module is `server-only` (it writes heartbeats), and
 * these are exactly the decisions worth unit-testing. Same split as `abuse-rate-limit.ts` next to
 * its store, and for the same reason.
 */
import { jobById, subSweepJobs, type JobId } from "@/app/admin/jobs/catalog";
import type { Json } from "@/lib/db/types";

/**
 * The route's sweep NAME (its key in the run's `counts`) to its catalog job. Only these four are
 * promoted; every other sweep runs exactly as before and rides the parent run's row. The names are
 * the purge route's own strings, so this map is the one place the two vocabularies meet.
 */
export const SUB_SWEEP_JOB_BY_NAME: Record<string, JobId> = {
  orphans: "purge_orphans",
  deleted_accounts: "purge_deleted_accounts",
  inactive_free_events: "purge_inactivity",
  over_capacity: "purge_over_capacity",
};

/** The catalog job for a sweep name, or null when the sweep rides the parent run. */
export function subSweepJobFor(name: string): JobId | null {
  return SUB_SWEEP_JOB_BY_NAME[name] ?? null;
}

/**
 * Count keys a sweep sets to say "I isolated some rows and they failed". A sweep reporting either
 * closes as an ERROR even though it returned normally: per-row isolation exists so the rows behind a
 * bad one still get their turn, NOT so a broken night can close green.
 */
export const FAILED_ROW_KEYS = ["rows_failed", "rows_not_attempted"] as const;

/** The key a sweep uses to hand the runner its own operator-readable line. */
export const ROWS_NOTE_KEY = "rows_note";

/**
 * What a sweep returns, reduced to something safe to store on a run row.
 *
 * Numbers and booleans pass. Strings pass only when short, because a sweep's tally legitimately
 * carries a cutoff timestamp but must never carry an error message: a failed send's text can quote a
 * recipient address, and `counts` is rendered on a page rather than through Sentry's scrubber. The
 * `error` key is dropped for the same reason (the route already replaces it with a boolean on the
 * parent row). Nested objects are dropped: a run row is a tally, not a log.
 */
export function sanitizeCounts(value: unknown): Json | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: Record<string, Json> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (key === "error" || key === ROWS_NOTE_KEY) continue;
    if (typeof raw === "number" && Number.isFinite(raw)) out[key] = raw;
    else if (typeof raw === "boolean") out[key] = raw;
    else if (typeof raw === "string" && raw.length <= 64) out[key] = raw;
  }
  return Object.keys(out).length ? out : null;
}

/** True when a sweep's own tally says rows were lost, so its run must not close as ok. */
export function tallyReportsFailedRows(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return FAILED_ROW_KEYS.some((key) => {
    const count = record[key];
    return typeof count === "number" && count > 0;
  });
}

/** A sweep may hand up its own operator-readable line (the isolation helper's `tallyNote`). */
export function readRowsNote(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const note = (value as Record<string, unknown>)[ROWS_NOTE_KEY];
  return typeof note === "string" && note.length > 0
    ? note.slice(0, 300)
    : undefined;
}

/**
 * Every promoted sub-sweep has a catalog entry, and every catalogued sub-sweep is actually run.
 * Exported so the unit test asserts it instead of two lists being trusted to stay in step by hand:
 * a catalogued sweep nobody runs shows as a permanently missed job, which is a false alarm, and a
 * promoted sweep with no entry writes rows no card ever reads, which is a silent failure.
 */
export function subSweepParityGap(): string[] {
  const mapped = new Set(Object.values(SUB_SWEEP_JOB_BY_NAME));
  const catalogued = new Set(subSweepJobs().map((j) => j.id));
  const gaps: string[] = [];
  for (const id of mapped) {
    if (!jobById(id)) gaps.push(`mapped but unknown: ${id}`);
    else if (!catalogued.has(id)) gaps.push(`mapped but not catalogued: ${id}`);
  }
  for (const id of catalogued) {
    if (!mapped.has(id)) gaps.push(`catalogued but never run: ${id}`);
  }
  return gaps;
}
