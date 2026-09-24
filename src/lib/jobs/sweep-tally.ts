/**
 * The PURE half of the purge cron's sub-sweep promotion (the admin-jobs round): which sweep is a job
 * of its own, what of a sweep's tally is safe to store on its run row, when a tally that returned
 * normally still has to close as a failure, and (the 1,000-row round) when it stopped early and
 * where it left off.
 *
 * Separate from `purge-sweeps.ts` because that module is `server-only` (it writes heartbeats), and
 * these are exactly the decisions worth unit-testing. Same split as `abuse-rate-limit.ts` next to
 * its store, and for the same reason.
 */
import {
  STOPPED_EARLY_KEY,
  countsStoppedEarly,
  jobById,
  subSweepJobs,
  type JobId,
} from "@/app/admin/jobs/catalog";
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
 * The key a sweep that stopped early uses for its own line, when the generic one would not be true
 * (the orphan sweep starts again from the top rather than carrying on). `rows_note`'s twin: it goes
 * to the run's note, never into `counts`.
 */
export const STOPPED_NOTE_KEY = "stopped_note";

/**
 * THE RESUME CURSOR (the 1,000-row round). A sweep that DRAINS (it deletes what it handles) resumes
 * by itself: its next run starts at the oldest row still standing. A sweep that EXAMINES accounts
 * and changes nothing about most of them (over-capacity, inactivity, the pass recompute, renewal
 * nudges) would re-read the same head of its list every night and never reach the tail, so when its
 * budget stops it, it stores the id it stopped after under this key on its run row, and its next run
 * reads it back (`readSweepCursor` in `src/lib/db/queries/jobs.ts`) and starts after it. A uuid, so
 * it survives `sanitizeCounts` on a sub-sweep's own row; on the parent row it rides the sweep's
 * nested tally. The console never prints it.
 */
export const RESUME_KEY = "resume_after";

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
    if (key === "error" || key === ROWS_NOTE_KEY || key === STOPPED_NOTE_KEY)
      continue;
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

/** True when a sweep's tally says its time budget stopped it with work left (the catalog's flag). */
export function sweepStoppedEarly(value: unknown): boolean {
  return countsStoppedEarly(value);
}

/** The `remaining` count a stopped sweep took, or null when it could not count what it left. */
export function readRemaining(value: unknown): number | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const remaining = (value as Record<string, unknown>).remaining;
  return typeof remaining === "number" && Number.isFinite(remaining)
    ? remaining
    : null;
}

/** The run note for a sweep that stopped early: its own line, or the generic one with its count. */
export function stoppedEarlyNote(value: unknown): string | undefined {
  if (!sweepStoppedEarly(value)) return undefined;
  const own = (value as Record<string, unknown>)[STOPPED_NOTE_KEY];
  if (typeof own === "string" && own.length > 0) return own.slice(0, 300);
  const remaining = readRemaining(value);
  return remaining === null
    ? "Stopped at its time budget with work left; the next run carries on."
    : `Stopped at its time budget with ${remaining.toLocaleString("en-US")} left; the next run carries on.`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The resume cursor a run's `counts` carry: a sub-sweep's own (top level), or, with `sweep`, the one
 * nested under that sweep's name on the parent run. Only a uuid is a cursor: anything else reads as
 * "start from the beginning", which re-examines rows but can never skip one.
 */
export function cursorFrom(counts: unknown, sweep?: string): string | null {
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    return null;
  }
  const holder = sweep
    ? (counts as Record<string, unknown>)[sweep]
    : (counts as Record<string, unknown>);
  if (!holder || typeof holder !== "object" || Array.isArray(holder)) {
    return null;
  }
  const cursor = (holder as Record<string, unknown>)[RESUME_KEY];
  return typeof cursor === "string" && UUID.test(cursor)
    ? cursor.toLowerCase()
    : null;
}

/**
 * THE PARENT RUN'S VERDICT over every sweep's result. A sweep that THREW fails the run (as before);
 * so does one whose isolated rows failed, which is new: `renewal_nudges` and `expired_passes` ride
 * the parent row, whose card prints no nested tally, so without this their failed accounts were
 * visible only in Sentry. A sweep that stopped early leaves the run `ok` but sets the catalog's flag
 * (the card reads `attention`) and names itself, with what it left, in the note.
 */
export function purgeRunVerdict(sweeps: Record<string, unknown>): {
  status: "ok" | "error";
  note: string | undefined;
  flags: Record<string, Json>;
} {
  const failed: string[] = [];
  const lostRows: string[] = [];
  const stopped: string[] = [];
  for (const [name, value] of Object.entries(sweeps)) {
    if (value && typeof value === "object" && "error" in value) {
      failed.push(name);
      continue;
    }
    if (tallyReportsFailedRows(value)) lostRows.push(name);
    if (sweepStoppedEarly(value)) {
      const remaining = readRemaining(value);
      stopped.push(
        remaining === null
          ? name
          : `${name} (${remaining.toLocaleString("en-US")} left)`,
      );
    }
  }
  const lines: string[] = [];
  if (failed.length) lines.push(`Sweeps failed: ${failed.join(", ")}.`);
  if (lostRows.length) lines.push(`Rows failed in: ${lostRows.join(", ")}.`);
  if (stopped.length) {
    lines.push(
      `Stopped early, the next run carries on: ${stopped.join(", ")}.`,
    );
  }
  return {
    status: failed.length || lostRows.length ? "error" : "ok",
    note: lines.length ? lines.join(" ") : undefined,
    flags: stopped.length
      ? { [STOPPED_EARLY_KEY]: true, sweeps_stopped_early: stopped.length }
      : {},
  };
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
