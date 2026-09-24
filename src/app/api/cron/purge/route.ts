/**
 * Phase 3 purge sweeper — Vercel Cron (daily, see vercel.json). Reclaims storage
 * by HARD-deleting media that has aged out of its recoverable tail, plus orphaned
 * R2 objects. This is the ONLY path that frees real bytes (R2 + DB rows +
 * profiles.storage_used_bytes); everything upstream is soft state.
 *
 * AUTH: Vercel auto-sends `Authorization: Bearer $CRON_SECRET`. We fail CLOSED —
 * no secret configured, or a mismatch, returns 401 and runs nothing. The compare
 * is timing-safe (sha256 + timingSafeEqual) so it leaks neither value nor length.
 *
 * ORDERING (load-bearing): for each batch the sweeps delete R2 OBJECTS FIRST, then the
 * DB rows (`reclaimMedia`, src/lib/lifecycle/reclaim.ts). WHY: deleting an event row
 * cascades (FK) to its media rows, which would destroy the original_key/preview_key we
 * still need to delete from R2. R2-then-DB also makes a crash recoverable: leftover
 * rows whose objects are gone get retried (R2 delete of an absent key is a no-op
 * success), and leftover objects whose rows are gone get caught by the orphan sweep.
 *
 * THE SWEEPS live in src/lib/lifecycle/sweeps/ (and account deletion in
 * src/lib/lifecycle/account-deletion.ts); this route runs them in order, each
 * independently guarded (src/lib/jobs/purge-sweeps.ts) so one failure doesn't abort
 * the rest.
 *
 * ★ THE TIME BUDGET (the 1,000-row round, 2026-09-23). This is ONE invocation of at most
 * `maxDuration` seconds. Every sweep works in keyset batches and checks a deadline before
 * each one; the deadlines share `SWEEP_WINDOW_MS` out between the budgeted sweeps as they
 * start (src/lib/lifecycle/sweep-budget.ts), so a backlog in one can never starve the ones
 * behind it or run the invocation into Vercel's kill (which would leave the heartbeat open
 * and every later sweep unrun). A sweep the deadline stops reports `stopped_early` with
 * what it left, raises one warning, and marks the run for `/admin/jobs` (the card reads
 * "Needs a look"); the next run carries on.
 *
 * OPERABILITY (admin-portal P8): the run is bracketed by the job heartbeat, so /admin/jobs can say
 * when this last ran, how long it took and what it reclaimed, and an operator can PAUSE it from
 * there without a deploy. It also carries the platform's freshness scan: this is the only scheduled
 * app-side code, so at the end of every run it checks EVERY job (including the Cloudflare and GitHub
 * ones) for a missing heartbeat and raises a Sentry warning per silent job.
 */
import { JOBS, jobHealth, type JobId } from "@/app/admin/jobs/catalog";
import { constantTimeEquals } from "@/lib/crypto/constant-time";
import {
  finishJobRun,
  getJobFlags,
  getJobStates,
  readSweepCursor,
  recordSkippedRun,
  startJobRun,
  type JobTrigger,
} from "@/lib/db/queries/jobs";
import type { Json } from "@/lib/db/types";
import { assertCronEnv } from "@/lib/env";
import { createSweepRunner } from "@/lib/jobs/purge-sweeps";
import {
  purgeRunVerdict,
  ROWS_NOTE_KEY,
  STOPPED_NOTE_KEY,
} from "@/lib/jobs/sweep-tally";
import { sweepDeletedAccounts } from "@/lib/lifecycle/account-deletion";
import {
  createSweepClock,
  SWEEP_WINDOW_MS,
  type Deadline,
} from "@/lib/lifecycle/sweep-budget";
import { sweepExpiredEvents } from "@/lib/lifecycle/sweeps/expired-events";
import { sweepInactiveFreeEvents } from "@/lib/lifecycle/sweeps/inactivity";
import { sweepOrphans } from "@/lib/lifecycle/sweeps/orphans";
import { sweepOverCapacity } from "@/lib/lifecycle/sweeps/over-capacity";
import {
  sweepExpiredPasses,
  sweepRenewalNudges,
} from "@/lib/lifecycle/sweeps/passes";
import { sweepRemovedMedia } from "@/lib/lifecycle/sweeps/removed-media";
import { sweepStandbyBudget } from "@/lib/lifecycle/sweeps/standby-budget";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { servesApp } from "@/lib/surface";
import { createAdminClient } from "@/lib/supabase/admin";

// node:crypto + the service-role admin client require the Node runtime; never edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The whole invocation's ceiling. The sweeps share SWEEP_WINDOW_MS of it (sweep-budget.ts), which
// leaves room for the freshness scan, the heartbeat and one batch's overrun; sweep-budget.test.ts
// reads this line and holds the two together.
export const maxDuration = 60;

/** The sweeps that work under a deadline, in the order they run: the clock shares the window between them. */
const BUDGETED_SWEEPS = 9;

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * A heartbeat write that did not land. Never fatal (the sweeps matter, the bookkeeping does not),
 * but never silent either: a job whose heartbeat stops writing would otherwise start reading as
 * MISSED on /admin/jobs while it is in fact running perfectly, which is the worst of both worlds.
 * Lives here rather than in the store because Sentry never gets imported into `src/lib/db/*`.
 */
function reportHeartbeat(error: string | null, phase: string): void {
  if (!error) return;
  captureWarning("cron", "job_heartbeat_write_failed", {
    job: "purge_cron",
    phase,
    error,
  });
}

function isSweepError(value: unknown): boolean {
  return typeof value === "object" && value !== null && "error" in value;
}

/**
 * The sweep tallies, stored on the heartbeat row so /admin/jobs can show what a run actually
 * reclaimed. Error TEXT never lands here: a thrown sweep becomes `{ error: true }`, and a tally's own
 * note lines (`rows_note`, `stopped_note`) are left out, because a failed row's first message can
 * quote an address or a row from a failed email send; the full error already went to Sentry (which
 * scrubs), and the run's note says which sweeps failed or stopped. What stays is the tally as the
 * sweep returned it: its numbers, a cutoff stamp, and a rotating sweep's resume cursor.
 */
function summarizeSweeps(
  sweeps: Record<string, unknown>,
): Record<string, Json> {
  const out: Record<string, Json> = {};
  for (const [name, value] of Object.entries(sweeps)) {
    if (isSweepError(value)) {
      out[name] = { error: true };
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const tally: Record<string, Json> = {};
      for (const [key, field] of Object.entries(value)) {
        if (key === ROWS_NOTE_KEY || key === STOPPED_NOTE_KEY) continue;
        tally[key] = field as Json;
      }
      out[name] = tally;
      continue;
    }
    out[name] = (value ?? null) as Json;
  }
  return out;
}

/**
 * Where a rotating sweep left off (`readSweepCursor`). An unreadable cursor is not worth a failed
 * sweep: it starts from the beginning (which re-examines accounts but can never skip one) and says so.
 */
async function resumeCursor(
  job: JobId,
  sweep?: string,
): Promise<string | null> {
  try {
    return await readSweepCursor(job, sweep);
  } catch (e) {
    captureWarning("cron", "sweep_cursor_unreadable", {
      job,
      sweep: sweep ?? null,
      error: String(e).slice(0, 300),
    });
    return null;
  }
}

/**
 * THE MISSED-RUN SIGNAL. Nothing else in the system is scheduled app-side, so this daily cron is
 * where "did the Cloudflare Worker and the GitHub Action actually run?" gets asked. A job that has
 * not reported a finished run within 1.5x its own cadence raises ONE Sentry warning per run (daily,
 * so a dead job pages once a day rather than once a minute) and shows as missed on /admin/jobs.
 * The verdict comes from `jobHealth`, the same pure function the page renders, so the alert and the
 * console can never disagree about what healthy means.
 */
async function scanJobFreshness(now: Date): Promise<Json> {
  const [flags, states] = await Promise.all([getJobFlags(), getJobStates()]);
  const nowMs = now.getTime();
  const missed: string[] = [];

  for (const def of JOBS) {
    const state = states.find((s) => s.job === def.id);
    const health = jobHealth({
      def,
      enabled: flags[def.id],
      lastRun: state?.lastRun ?? null,
      lastFinishedAtMs: state?.lastFinishedAtMs ?? null,
      nowMs,
    });
    if (health !== "missed") continue;
    missed.push(def.id);
    captureWarning("cron", "job_missed_run", {
      job: def.id,
      cadence: def.cadence,
      host: def.host,
      last_finished_at: state?.lastFinishedAtMs
        ? new Date(state.lastFinishedAtMs).toISOString()
        : null,
      last_status: state?.lastRun?.status ?? null,
    });
  }
  return { checked: JOBS.length, missed };
}

/**
 * The freshness scan, guarded, for the two EARLY-RETURN paths (paused, and switch unreadable). On
 * the normal path the scan rides `runSweep`, which already catches; these two returns happen before
 * that helper exists, and an unguarded throw there turns a correctly-skipped run into a 500 — which
 * is how a paused cron would start looking like a broken deploy. Found by red-teaming the paused
 * path against a database that did not have `job_runs` yet, which is exactly the window this branch
 * ships into.
 */
async function safeScanJobFreshness(now: Date): Promise<Json> {
  try {
    return await scanJobFreshness(now);
  } catch (e) {
    captureError("cron", e, { sweep: "job_health" });
    return { error: true };
  }
}

export async function GET(request: Request): Promise<Response> {
  // The invocation's clock starts here: the sweeps' window is measured from the moment Vercel
  // started counting `maxDuration`, not from whenever the first sweep happens to begin.
  const invokedAtMs = Date.now();
  let cronSecret: string;
  try {
    cronSecret = assertCronEnv().CRON_SECRET;
  } catch {
    // Fail closed — better a broken cron than an unauthenticated purge.
    return new Response("Cron not configured", { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!constantTimeEquals(authHeader, `Bearer ${cronSecret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // THIS JOB BELONGS TO THE APP SURFACE (the admin split, 2026-09-18). vercel.json is ONE file in
  // ONE repository, so BOTH Vercel projects register this cron and Vercel invokes it once per
  // project, twice a day for a job that hard-deletes bytes and writes a heartbeat. The admin
  // deployment answers and stops HERE, before the admin client exists: no sweep, no DB read, and
  // crucially no heartbeat, since a second run row a day would make /admin/jobs report a cadence
  // the job does not have and would mask a real missed run. The freshness scan rides the app
  // surface's run, so nothing is lost. After the auth check on purpose: the route's contract is
  // identical on both surfaces, and an unauthenticated prober learns nothing new either way.
  // Vercel also offers a per-project cron disable (the project's `crons.disabledAt`), worth
  // setting on partyreel-admin as well, but this guard is the one that lives in the repo and
  // survives a project being recreated.
  if (!servesApp()) {
    return Response.json({
      ok: true,
      skipped: true,
      reason: "not_this_surface",
      ran_at: new Date().toISOString(),
    });
  }

  const admin = createAdminClient();
  const now = new Date();
  // `Run now` on /admin/jobs sets this header so a manual run is distinguishable from the cron in
  // the heartbeat. Any other value (including absent) is the schedule.
  const triggeredBy: JobTrigger =
    request.headers.get("x-job-trigger") === "manual" ? "manual" : "schedule";

  // THE KILL SWITCH, and it fails CLOSED. This job hard-deletes bytes, so "we could not read whether
  // an operator paused it" must never resolve to "delete anyway". One skipped daily purge costs
  // nothing (the next run reclaims the same rows); ignoring a pause could cost data. The freshness
  // scan below still runs either way, so pausing the purge never blinds the other three jobs.
  let killSwitchOn = true;
  try {
    killSwitchOn = (await getJobFlags()).purge_cron;
  } catch (e) {
    captureError("cron", e, { job: "purge_cron", phase: "flag_read" });
    const skip = await recordSkippedRun(
      "purge_cron",
      triggeredBy,
      "Kill switch unreadable, skipped to fail closed.",
    );
    reportHeartbeat(skip.heartbeatError, "skip");
    const health = await safeScanJobFreshness(now);
    return Response.json({
      ok: true,
      skipped: true,
      reason: "flag_unavailable",
      ran_at: now.toISOString(),
      health,
    });
  }

  if (!killSwitchOn) {
    // A paused job still REPORTS IN: the skipped row keeps its heartbeat fresh, so pausing never
    // masquerades as a dead job on /admin/jobs (or pages anyone at 3am).
    const skip = await recordSkippedRun(
      "purge_cron",
      triggeredBy,
      "Paused from /admin/jobs.",
    );
    reportHeartbeat(skip.heartbeatError, "skip");
    const health = await safeScanJobFreshness(now);
    return Response.json({
      ok: true,
      skipped: true,
      reason: "paused",
      ran_at: now.toISOString(),
      health,
    });
  }

  const run = await startJobRun("purge_cron", triggeredBy);
  reportHeartbeat(run.heartbeatError, "start");

  // Track media ids handled by earlier sweeps so a later sweep can't double-process.
  const handled = new Set<string>();
  const sweeps: Record<string, unknown> = {};

  // Each sweep is independently guarded so one failure doesn't abort the rest. The guard reports to
  // Sentry and, for the FOUR promoted sub-sweeps, keeps a `job_runs` row, a kill switch and a card of
  // their own (`createSweepRunner`, src/lib/jobs/purge-sweeps.ts).
  const sweepRunner = createSweepRunner(triggeredBy);
  const runSweep = async (name: string, fn: () => Promise<unknown>) => {
    sweeps[name] = await sweepRunner.run(name, fn);
  };
  const clock = createSweepClock({
    startMs: invokedAtMs,
    windowMs: SWEEP_WINDOW_MS,
    sweeps: BUDGETED_SWEEPS,
  });
  // A budgeted sweep takes its share as it STARTS (so a quick sweep before it leaves it more), and
  // takes it even when its own switch skips it (so the share it never used rolls down the line).
  const runBudgeted = async (
    name: string,
    fn: (deadline: Deadline) => Promise<unknown>,
  ) => {
    const deadline = clock.next();
    await runSweep(name, () => fn(deadline));
  };

  await runBudgeted("expired_events", (deadline) =>
    sweepExpiredEvents(admin, now, handled, { deadline }),
  );
  await runBudgeted("removed_media", (deadline) =>
    sweepRemovedMedia(admin, now, handled, { deadline }),
  );
  // Accounts that asked to be deleted: after removed_media so `handled` is populated, before the
  // capacity sweeps so they never act on bytes this run is about to reclaim. Pre-apply it returns
  // { skipped: "not_provisioned" }.
  await runBudgeted("deleted_accounts", (deadline) =>
    sweepDeletedAccounts(admin, now, handled, { deadline }),
  );
  await runBudgeted("orphans", (deadline) =>
    sweepOrphans(admin, now, { deadline }),
  );
  // The three that EXAMINE accounts rather than delete them resume where their last run stopped
  // (the cursor rides the run row: RESUME_KEY in src/lib/jobs/sweep-tally.ts).
  await runBudgeted("expired_passes", async (deadline) =>
    sweepExpiredPasses(admin, now, {
      deadline,
      resumeAfter: await resumeCursor("purge_cron", "expired_passes"),
    }),
  );
  await runBudgeted("over_capacity", async (deadline) =>
    sweepOverCapacity(admin, now, {
      deadline,
      resumeAfter: await resumeCursor("purge_over_capacity"),
    }),
  );
  await runBudgeted("renewal_nudges", async (deadline) =>
    sweepRenewalNudges(admin, now, {
      deadline,
      resumeAfter: await resumeCursor("purge_cron", "renewal_nudges"),
    }),
  );
  await runBudgeted("inactive_free_events", async (deadline) =>
    sweepInactiveFreeEvents(admin, now, {
      deadline,
      resumeAfter: await resumeCursor("purge_inactivity"),
    }),
  );
  // LAST of the budgeted: after expired_events + removed_media (so `handled` excludes ids they
  // purged) and after over_capacity (whose auto-reduce is system-removed and never counts here).
  await runBudgeted("standby_budget", (deadline) =>
    sweepStandbyBudget(admin, now, handled, { deadline }),
  );
  // Prune the unlock rate-limiter log — rows older than its longest window are dead weight.
  await runSweep("unlock_attempts", () => sweepUnlockAttempts(admin, now));
  await runSweep("action_attempts", () => sweepActionAttempts(admin, now));

  // The platform freshness scan. It is a sweep like any other so a failure here is caught + reported
  // rather than losing the whole run, and it runs LAST so this run's own heartbeat is not yet closed
  // (the purge is judged on its PREVIOUS finish, which is the honest question anyway).
  await runSweep("job_health", () => scanJobFreshness(now));

  // A sweep that threw, or whose isolated rows failed, fails the run; one that stopped early leaves
  // it ok but flagged, and names itself in the note (purgeRunVerdict, src/lib/jobs/sweep-tally.ts).
  const verdict = purgeRunVerdict(sweeps);
  const done = await finishJobRun(run, {
    status: verdict.status,
    counts: { ...summarizeSweeps(sweeps), ...verdict.flags },
    note: verdict.note,
  });
  reportHeartbeat(done.heartbeatError, "finish");

  return Response.json({ ok: true, ran_at: now.toISOString(), sweeps });
}

/**
 * Sweep 9 — prune the unlock rate-limiter log. The limiter only counts failures within the last
 * UNLOCK_EVENT_WINDOW_MIN (60 min), so rows older than a day are dead weight. Keeps the table tiny
 * (and cleans up rows orphaned by deleted events — the table has no FK, by design). One DELETE,
 * whose count comes back with it (a write's answer is not capped).
 */
async function sweepUnlockAttempts(admin: AdminClient, now: Date) {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("unlock_attempts")
    .delete({ count: "exact" })
    .lt("attempted_at", cutoff);
  if (error) throw new Error(`prune unlock_attempts: ${error.message}`);
  return { pruned: count ?? 0, before: cutoff };
}

/**
 * Sweep 10 — prune the abuse rate-limiter log (`action_attempts`). The limiter's widest window is 60 min, so
 * rows older than a day are dead weight (and this cleans up rows orphaned by deleted events — no FK, by
 * design). Mirrors sweep 9 (unlock_attempts).
 */
async function sweepActionAttempts(admin: AdminClient, now: Date) {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("action_attempts")
    .delete({ count: "exact" })
    .lt("created_at", cutoff);
  if (error) throw new Error(`prune action_attempts: ${error.message}`);
  return { pruned: count ?? 0, before: cutoff };
}
