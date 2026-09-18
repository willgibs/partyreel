/**
 * THE PURGE CRON'S SUB-SWEEPS, promoted to jobs of their own (the admin-jobs round).
 *
 * The daily purge runs eleven sweeps inside one invocation. Until now the whole thing was ONE
 * heartbeat row: eleven tallies squeezed into its `counts`, one shared `ok`/`error`, one kill
 * switch. That made the console honest about the RUN and blind about the WORK — an operator could
 * not see that the over-capacity sweep had failed for a week while the run stayed green on the other
 * ten, and could not stop the inactivity sweep for one night without giving up storage reclamation.
 *
 * So the four heaviest sweeps (the ones that loop over ACCOUNTS and either email somebody or delete
 * bytes) now open and close a `job_runs` row of their own, with their own `ops_flags` switch and
 * their own card on /admin/jobs. The other seven are unchanged and still ride the parent row.
 *
 * WHERE THIS LIVES, and why not in the route: `src/app/api/cron/purge/route.ts` belongs to another
 * lane this round, and the sweep bodies are 800 lines of lifecycle logic with no business moving. So
 * the route keeps its sweeps and hands each to the runner below; its `runSweep` closure becomes two
 * lines. For a sweep with no catalog entry the behaviour is byte-identical to the route's original
 * inline try/catch, so nothing changes for the other seven.
 *
 * POSTURE ON AN UNREADABLE SWITCH: fail CLOSED, matching the parent cron. All four promoted sweeps
 * delete or soft-delete something; one skipped night costs nothing (the next run sees the same rows)
 * while ignoring a pause an operator set could cost data.
 */
import "server-only";

import type { JobId } from "@/app/admin/jobs/catalog";
import {
  finishJobRun,
  getJobFlags,
  recordSkippedRun,
  startJobRun,
  type JobTrigger,
} from "@/lib/db/queries/jobs";
import {
  readRowsNote,
  sanitizeCounts,
  subSweepJobFor,
  tallyReportsFailedRows,
} from "@/lib/jobs/sweep-tally";
import { captureError, captureWarning } from "@/lib/observability/sentry";

export type SweepRunner = {
  /**
   * Run one sweep and return exactly what the route stores in `sweeps[name]`: the sweep's own tally,
   * `{ error }` on a throw (the shape the route's `isSweepError` already looks for), or
   * `{ skipped }` when the sub-sweep's own switch is off.
   */
  run: (name: string, fn: () => Promise<unknown>) => Promise<unknown>;
};

/**
 * Build the runner for ONE cron invocation. The flags are read once and memoised for the run: four
 * sub-sweeps each asking `isJobEnabled` would be four full reads of the same small table, and a
 * switch flipped mid-run taking effect halfway down the list is not a behaviour worth having.
 */
export function createSweepRunner(triggeredBy: JobTrigger): SweepRunner {
  let flagsPromise: Promise<Record<JobId, boolean>> | null = null;
  const flags = () => (flagsPromise ??= getJobFlags());

  async function runTracked(
    job: JobId,
    name: string,
    fn: () => Promise<unknown>,
  ): Promise<unknown> {
    let enabled: boolean;
    try {
      enabled = (await flags())[job];
    } catch (e) {
      // Fail CLOSED, like the parent cron: every promoted sweep deletes or soft-deletes something,
      // and "we could not read whether you paused this" must never resolve to "do it anyway".
      captureError("cron", e, { sweep: name, job, phase: "flag_read" });
      const skip = await recordSkippedRun(
        job,
        triggeredBy,
        "Kill switch unreadable, skipped to fail closed.",
      );
      reportHeartbeat(job, skip.heartbeatError, "skip");
      return { skipped: "flag_unavailable" };
    }

    if (!enabled) {
      // A paused sub-sweep still REPORTS IN, exactly like a paused job: the skipped row keeps its
      // heartbeat fresh, so pausing never masquerades as a dead sweep on /admin/jobs.
      const skip = await recordSkippedRun(
        job,
        triggeredBy,
        "Paused from /admin/jobs.",
      );
      reportHeartbeat(job, skip.heartbeatError, "skip");
      return { skipped: "paused" };
    }

    const run = await startJobRun(job, triggeredBy);
    reportHeartbeat(job, run.heartbeatError, "start");

    try {
      const result = await fn();
      const lostRows = tallyReportsFailedRows(result);
      const done = await finishJobRun(run, {
        status: lostRows ? "error" : "ok",
        counts: sanitizeCounts(result) ?? undefined,
        note: lostRows
          ? (readRowsNote(result) ?? "Some rows failed and were skipped.")
          : undefined,
      });
      reportHeartbeat(job, done.heartbeatError, "finish");
      return result;
    } catch (e) {
      captureError("cron", e, { sweep: name, job });
      const done = await finishJobRun(run, {
        status: "error",
        note: String(e).slice(0, 300),
      });
      reportHeartbeat(job, done.heartbeatError, "finish");
      // The route's own shape, unchanged, so `isSweepError` still sees it and the PARENT run closes
      // as an error too: a failed sub-sweep is red on both cards rather than hidden behind its own.
      return { error: String(e) };
    }
  }

  return {
    async run(name, fn) {
      const job = subSweepJobFor(name);
      if (job) return runTracked(job, name, fn);
      // Not promoted: byte-identical to the route's original inline try/catch.
      try {
        return await fn();
      } catch (e) {
        captureError("cron", e, { sweep: name });
        return { error: String(e) };
      }
    },
  };
}

/**
 * A heartbeat write that did not land. Never fatal (the sweep matters, its bookkeeping does not) but
 * never silent either: a sweep whose heartbeat stopped writing would read as MISSED on /admin/jobs
 * while running perfectly, which is the worst of both worlds. Mirrors the route's own reporter, and
 * lives here rather than in the store because Sentry never enters `src/lib/db/*`.
 */
function reportHeartbeat(
  job: JobId,
  error: string | null,
  phase: string,
): void {
  if (!error) return;
  captureWarning("cron", "job_heartbeat_write_failed", { job, phase, error });
}
