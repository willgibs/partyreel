/**
 * ONE READ of the backend's health, for everything in the portal that says
 * something about it.
 *
 * The /admin/jobs page is the whole picture, but nobody opens a health console to find out whether
 * they should have opened it. So the verdict is reduced here, once, through the SAME pure
 * `jobHealth` the page renders and the purge cron's scan alerts on, and three surfaces read it: the
 * alerts bell's count, the chip in the tool bar, and the band under it
 * (`health=portal`, Will 2026-09-20: a band under the bar on every page, gone on a good day).
 *
 * ★ AN UNREADABLE HEALTH CONSOLE IS ITSELF SOMETHING THAT NEEDS A LOOK, AND IT IS NOT "ONE JOB".
 * A failed read resolves to `readable: false` and raises its own Sentry event. Zero would be the
 * calm-empty-page lie in its purest form: the bell going quiet precisely because the thing that
 * tells us about failures is the thing that failed. But saying "1 job needs you" would be the same
 * lie wearing a number, so the band says the console could not be read and sends the operator to
 * /admin/jobs, which draws the loud banner and says what actually went wrong. `countUnhealthyJobs`
 * still answers 1, because a BELL has nowhere to put a sentence and a ringing bell is right.
 */
import "server-only";

import {
  JOBS,
  isUnhealthy,
  jobHealth,
  readDepth,
  type DepthSource,
  type JobHealth,
  type JobId,
} from "@/app/admin/jobs/catalog";
import {
  getJobFlags,
  getJobSignals,
  getJobStates,
} from "@/lib/db/queries/jobs";
import { captureError } from "@/lib/observability/sentry";

export type UnhealthyJob = {
  id: JobId;
  label: string;
  health: JobHealth;
};

export type JobHealthReport = {
  /** false = the heartbeat could not be read at all. Never rendered as a count. */
  readable: boolean;
  /** Every job an operator has to act on: overdue, failed, or flagged for attention. */
  unhealthy: UnhealthyJob[];
  /** Jobs an operator paused on purpose. Counted apart, never as a fault. */
  pausedCount: number;
  /** Age of the freshest terminal run across every job, or null if nothing has ever finished. */
  heartbeatAgeMs: number | null;
};

const UNREADABLE: JobHealthReport = {
  readable: false,
  unhealthy: [],
  pausedCount: 0,
  heartbeatAgeMs: null,
};

/**
 * The whole verdict, once. A PAUSED job is not "unhealthy" — pausing is a decision, and a signal
 * that keeps shouting about a switch the operator set themselves is one they learn to ignore — but
 * it is counted separately, because "two jobs are off on purpose" is worth a line on a bad day.
 */
export async function readJobHealth(
  nowMs = Date.now(),
): Promise<JobHealthReport> {
  try {
    const [flags, states, signals] = await Promise.all([
      getJobFlags(),
      getJobStates(),
      getJobSignals(nowMs),
    ]);

    const healthById = new Map<JobId, JobHealth>();
    for (const def of JOBS) {
      if (def.kind === "derived") continue;
      const state = states.find((s) => s.job === def.id);
      healthById.set(
        def.id,
        jobHealth({
          def,
          enabled: flags[def.id],
          lastRun: state?.lastRun ?? null,
          lastFinishedAtMs: state?.lastFinishedAtMs ?? null,
          nowMs,
          signal: signals[def.id] ?? null,
        }),
      );
    }

    // Second pass for the derived readings, which inherit the health of the run that carried them.
    const sources: DepthSource[] = states.map((s) => ({
      job: s.job,
      counts: s.lastRunRow?.counts ?? null,
      startedAtMs: s.lastRun?.startedAtMs ?? null,
      health: healthById.get(s.job) ?? "never",
    }));
    for (const def of JOBS) {
      if (def.kind !== "derived") continue;
      healthById.set(
        def.id,
        jobHealth({
          def,
          enabled: true,
          lastRun: null,
          lastFinishedAtMs: null,
          nowMs,
          reading: readDepth(def, sources),
        }),
      );
    }

    const unhealthy: UnhealthyJob[] = [];
    let pausedCount = 0;
    // JOBS order is the console's order, so the band names jobs in the order the
    // page lists them rather than in whatever order a Map happened to fill.
    for (const def of JOBS) {
      const health = healthById.get(def.id);
      if (!health) continue;
      if (health === "paused") pausedCount += 1;
      else if (isUnhealthy(health))
        unhealthy.push({ id: def.id, label: def.label, health });
    }

    const finished = states
      .map((s) => s.lastFinishedAtMs)
      .filter((ms): ms is number => typeof ms === "number");
    const freshest = finished.length > 0 ? Math.max(...finished) : null;

    return {
      readable: true,
      unhealthy,
      pausedCount,
      heartbeatAgeMs: freshest === null ? null : Math.max(0, nowMs - freshest),
    };
  } catch (e) {
    captureError("admin", e, { surface: "job_health", signal: "jobs" });
    return UNREADABLE;
  }
}

/**
 * ONE NUMBER for the operator-alerts bell. A bell has nowhere to put "the console is unreadable",
 * and a silent bell would be the worse of the two lies, so an unreadable read rings once.
 */
export async function countUnhealthyJobs(nowMs = Date.now()): Promise<number> {
  const report = await readJobHealth(nowMs);
  return report.readable ? report.unhealthy.length : 1;
}
