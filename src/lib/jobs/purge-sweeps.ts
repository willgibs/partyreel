/**
 * THE PURGE CRON'S SUB-SWEEPS, promoted to jobs of their own (the admin-jobs round).
 *
 * The daily purge runs twelve sweeps inside one invocation. Until the admin-jobs round the whole
 * thing was ONE heartbeat row: every tally squeezed into its `counts`, one shared `ok`/`error`, one
 * kill switch. That made the console honest about the RUN and blind about the WORK: an operator could
 * not see that the over-capacity sweep had failed for a week while the run stayed green on the rest,
 * and could not stop the inactivity sweep for one night without giving up storage reclamation.
 *
 * So the four heaviest sweeps (the ones that loop over ACCOUNTS and either email somebody or delete
 * bytes) open and close a `job_runs` row of their own, with their own `ops_flags` switch and their
 * own card on /admin/jobs. The other eight still ride the parent row.
 *
 * WHERE THIS LIVES: the route (`src/app/api/cron/purge/route.ts`) hands every sweep to the runner
 * below through its `runSweep`; the sweep bodies are in `src/lib/lifecycle/sweeps/`. For a sweep with
 * no catalog entry the runner is the route's original inline try/catch. For every sweep it also
 * raises ONE `sweep_stopped_early` warning when the sweep's time budget stopped it with work left
 * (the 1,000-row round), and a promoted sweep's own row says so in its note.
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
  readRemaining,
  readRowsNote,
  sanitizeCounts,
  stoppedEarlyNote,
  subSweepJobFor,
  sweepStoppedEarly,
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
      // Both lines when both are true: rows that failed AND a budget that ran out are two facts.
      const note = [
        lostRows
          ? (readRowsNote(result) ?? "Some rows failed and were skipped.")
          : undefined,
        stoppedEarlyNote(result),
      ]
        .filter((line): line is string => Boolean(line))
        .join(" ");
      const done = await finishJobRun(run, {
        status: lostRows ? "error" : "ok",
        counts: sanitizeCounts(result) ?? undefined,
        note: note || undefined,
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
      const result = job
        ? await runTracked(job, name, fn)
        : await runUntracked(name, fn);
      reportStoppedEarly(name, result);
      return result;
    },
  };
}

/** A sweep that rides the parent run: the route's original inline try/catch, unchanged. */
async function runUntracked(
  name: string,
  fn: () => Promise<unknown>,
): Promise<unknown> {
  try {
    return await fn();
  } catch (e) {
    captureError("cron", e, { sweep: name });
    return { error: String(e) };
  }
}

/**
 * ONE WARNING PER SWEEP PER RUN when its time budget stopped it with work left (the 1,000-row
 * round). The run row already says so on /admin/jobs (the card reads `attention`); the warning is
 * what reaches somebody who is not looking at the console, and one a night is the right volume for
 * a backlog that is draining. Its count rides along; the cursor never does.
 */
function reportStoppedEarly(name: string, result: unknown): void {
  if (!sweepStoppedEarly(result)) return;
  captureWarning("cron", "sweep_stopped_early", {
    sweep: name,
    remaining: readRemaining(result),
  });
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
