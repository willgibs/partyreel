/**
 * ONE NUMBER for the operator-alerts bell: how many backend jobs need a look right now.
 *
 * The /admin/jobs page is the whole picture, but nobody opens a health console to find out whether
 * they should have opened it. The bell already carries the portal's other pending work (support,
 * applicants, reports), so the jobs join it — and this is the only place the verdict is reduced to a
 * count, through the SAME pure `jobHealth` the page renders and the purge cron's scan alerts on.
 *
 * ★ AN UNREADABLE HEALTH CONSOLE IS ITSELF SOMETHING THAT NEEDS A LOOK. A failed read here resolves
 * to ONE rather than zero, and raises its own Sentry event. Zero would be the calm-empty-page lie in
 * its purest form: the bell going quiet precisely because the thing that tells us about failures is
 * the thing that failed. The row leads to /admin/jobs, which draws the loud unreadable banner and
 * says what actually went wrong, so the count being approximate costs nothing.
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

/**
 * Jobs currently in a state an operator has to act on: overdue, failed, or flagged for attention.
 * A PAUSED job is not counted — pausing is a decision, and a bell that keeps ringing about a switch
 * the operator set themselves is a bell they learn to ignore.
 */
export async function countUnhealthyJobs(
  nowMs = Date.now(),
): Promise<number> {
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

    return [...healthById.values()].filter(isUnhealthy).length;
  } catch (e) {
    captureError("admin", e, { surface: "operator_alerts", signal: "jobs" });
    return 1;
  }
}
