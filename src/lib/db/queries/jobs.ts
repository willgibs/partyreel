/**
 * The backend-job heartbeat store (admin-portal P8, QA #15) — every read and write of `job_runs`
 * plus the per-job kill-switch rows in `ops_flags`. Both tables are deny-all, so everything here
 * goes through the service-role admin client; the callers are the jobs themselves, the internal
 * job-run endpoint, and the requireAdmin + AAL2 gated /admin/jobs page.
 *
 * Reads and writes share one file on purpose: the heartbeat is a single small protocol (open a row,
 * close it), and splitting it across `queries/` and `mutations/` would put four lines of insert in
 * its own module away from the reads that interpret them. The job vocabulary itself lives in the
 * pure catalog (`src/app/admin/jobs/catalog.ts`).
 *
 * TWO RULES, and they point in opposite directions on purpose:
 *
 *  - The heartbeat WRITES degrade. A job must never fail because its bookkeeping failed, and this
 *    branch ships BEFORE its migration is applied (the Orchestrator applies it), so the very first
 *    deploy would otherwise 500 the purge cron on an unknown table. So the writes swallow and REPORT
 *    (`heartbeatError`), and the caller raises the Sentry warning — Sentry never gets imported into
 *    `src/lib/db/*`.
 *  - The health READS do not. A failed read of a health signal resolves as a confident "nothing to
 *    report", which is the one answer that means "all clear" (see must-query.ts). They use mustQuery
 *    and throw; /admin/jobs catches and says so in the UI instead of drawing an empty, healthy page.
 */
import "server-only";

import {
  JOBS,
  SIGNAL_WINDOW_MS,
  countsStoppedEarly,
  jobsWithRuns,
  type JobId,
  type JobRunSummary,
  type JobSignal,
} from "@/app/admin/jobs/catalog";
import { mustCount, mustQuery } from "@/lib/db/must-query";
import type { Json, Database } from "@/lib/db/types";
import { cursorFrom } from "@/lib/jobs/sweep-tally";
import { createAdminClient } from "@/lib/supabase/admin";

export type JobRunStatus = "running" | "ok" | "error" | "skipped";
export type JobTrigger = "schedule" | "manual";

export type JobRunRow = {
  id: string;
  job: string;
  status: JobRunStatus;
  triggered_by: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  counts: Json | null;
  note: string | null;
};

function jobRunsDb() {
  return createAdminClient();
}

/**
 * The generated row says `string` for `status` and `triggered_by` because the columns are `text`
 * with a CHECK (the catalog is TypeScript, so a new job never needs a migration); the app-level
 * JobRunRow narrows them to the unions the CHECK enforces. One cast, at the read boundary.
 */
function narrowRun(
  row: Database["public"]["Tables"]["job_runs"]["Row"],
): JobRunRow {
  return row as JobRunRow;
}

// ---------------------------------------------------------------------------
// Kill switches (ops_flags)
// ---------------------------------------------------------------------------

/**
 * Every job's switch state, keyed by JobId. A MISSING row reads as enabled (the flag simply has not
 * been seeded), but an unreachable table THROWS: a kill switch that fails open is not a kill switch
 * (the /admin/exports lesson, kept verbatim here).
 */
export async function getJobFlags(): Promise<Record<JobId, boolean>> {
  const admin = createAdminClient();
  // A job with a null flagKey has nothing to pause (the derived readings and the rolling signals):
  // it is always "enabled", because there is no run for a switch to stop.
  const keys = JOBS.map((j) => j.flagKey).filter(
    (k): k is string => k !== null,
  );
  // row-cap: the kill switches of the JOBS registry: a fixed handful of config rows
  const rows = await mustQuery(
    admin.from("ops_flags").select("key, enabled").in("key", keys),
    "admin/jobs: kill switches",
  );
  const byKey = new Map((rows ?? []).map((r) => [r.key, r.enabled]));
  const out = {} as Record<JobId, boolean>;
  for (const job of JOBS) {
    out[job.id] =
      job.flagKey === null ? true : (byKey.get(job.flagKey) ?? true);
  }
  return out;
}

/** One job's switch, for the job itself (which only cares about its own). */
export async function isJobEnabled(job: JobId): Promise<boolean> {
  const flags = await getJobFlags();
  return flags[job];
}

/** Flip one job's switch. Callers re-check admin + AAL2 first; this is the write half only. */
export async function setJobEnabled(
  flagKey: string,
  enabled: boolean,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  // upsert, not update: a flag row the migration has not seeded yet must still be switchable rather
  // than silently updating zero rows and reporting success.
  const { error } = await admin
    .from("ops_flags")
    .upsert(
      { key: flagKey, enabled, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  return { error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// The heartbeat (job_runs writes — degrade, never throw)
// ---------------------------------------------------------------------------

export type StartedRun = {
  /** Null when the row could not be written; the job still runs, `heartbeatError` says why. */
  runId: string | null;
  startedAtMs: number;
  heartbeatError: string | null;
};

/** Open a `running` row. Never throws: a job must not die because its heartbeat could not be written. */
export async function startJobRun(
  job: JobId,
  triggeredBy: JobTrigger,
): Promise<StartedRun> {
  const startedAtMs = Date.now();
  try {
    const { data, error } = await jobRunsDb()
      .from("job_runs")
      .insert({
        job,
        status: "running",
        triggered_by: triggeredBy,
        started_at: new Date(startedAtMs).toISOString(),
      })
      .select("id")
      .single();
    if (error)
      return { runId: null, startedAtMs, heartbeatError: error.message };
    return { runId: data.id, startedAtMs, heartbeatError: null };
  } catch (e) {
    return { runId: null, startedAtMs, heartbeatError: String(e) };
  }
}

/** Close a run. A null `runId` (the heartbeat never opened) is a no-op, not an error. */
export async function finishJobRun(
  run: StartedRun,
  outcome: {
    status: Exclude<JobRunStatus, "running">;
    counts?: Json;
    note?: string;
  },
): Promise<{ heartbeatError: string | null }> {
  if (!run.runId) return { heartbeatError: run.heartbeatError };
  try {
    const { error } = await jobRunsDb()
      .from("job_runs")
      .update({
        status: outcome.status,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - run.startedAtMs,
        counts: outcome.counts ?? null,
        note: outcome.note ?? null,
      })
      .eq("id", run.runId);
    return { heartbeatError: error?.message ?? null };
  } catch (e) {
    return { heartbeatError: String(e) };
  }
}

/**
 * THE FAILURE LOG for a `signal` job — one closed `error` row for something that went wrong in a
 * path with no schedule of its own (a transactional send, a rate-limiter read). Degrades like every
 * other heartbeat write: the caller is mid-failure already and must not be handed a second one.
 *
 * `job_runs` is deliberately the store rather than a new table: the column is unconstrained by
 * design, the rows are already deny-all and already rendered in the activity feed, and a failure IS
 * a run of something. The alerting lives at the call site (`src/lib/jobs/failure-log.ts`), which
 * also throttles: a database outage must not turn one failure per request into a write storm on the
 * table we are trying to read health from.
 */
export async function recordJobFailure(
  job: JobId,
  note: string,
): Promise<{ heartbeatError: string | null }> {
  try {
    const now = new Date().toISOString();
    const { error } = await jobRunsDb()
      .from("job_runs")
      .insert({
        job,
        status: "error",
        triggered_by: "schedule",
        started_at: now,
        finished_at: now,
        duration_ms: 0,
        note: note.slice(0, 500),
      });
    return { heartbeatError: error?.message ?? null };
  } catch (e) {
    return { heartbeatError: String(e) };
  }
}

/**
 * Record a run that never happened because the job is paused. Written as a CLOSED row so a paused
 * job keeps reporting in and never trips the missed-run alert: pausing is a decision, not a fault.
 */
export async function recordSkippedRun(
  job: JobId,
  triggeredBy: JobTrigger,
  note: string,
): Promise<{ heartbeatError: string | null }> {
  try {
    const now = new Date().toISOString();
    const { error } = await jobRunsDb().from("job_runs").insert({
      job,
      status: "skipped",
      triggered_by: triggeredBy,
      started_at: now,
      finished_at: now,
      duration_ms: 0,
      note,
    });
    return { heartbeatError: error?.message ?? null };
  } catch (e) {
    return { heartbeatError: String(e) };
  }
}

// ---------------------------------------------------------------------------
// The readout (job_runs reads — mustQuery, throw loudly)
// ---------------------------------------------------------------------------

/** The newest runs across every job, for the /admin/jobs activity feed. */
export async function listRecentJobRuns(limit = 60): Promise<JobRunRow[]> {
  const rows = await mustQuery(
    jobRunsDb()
      .from("job_runs")
      .select(
        "id, job, status, triggered_by, started_at, finished_at, duration_ms, counts, note",
      )
      .order("started_at", { ascending: false })
      .limit(limit),
    "admin/jobs: recent runs",
  );
  return (rows ?? []).map(narrowRun);
}

export type JobState = {
  job: JobId;
  /** The newest run of any status (what the card shows as "last run"). */
  lastRun: JobRunSummary | null;
  lastRunRow: JobRunRow | null;
  /** The newest run that actually REPORTED a result — the freshness clock. */
  lastFinishedAtMs: number | null;
};

/**
 * Per-job freshness, used by BOTH the page cards and the missed-run scan so the two can never drift
 * into different definitions of "last heard from". Two indexed single-row reads per job.
 */
export async function getJobStates(): Promise<JobState[]> {
  const db = jobRunsDb();
  // `derived` jobs keep no rows of their own (their reading rides another job's counts), so asking
  // for theirs would be two guaranteed-empty queries per page load.
  return Promise.all(
    jobsWithRuns().map(async (def): Promise<JobState> => {
      const [latest, lastFinished] = await Promise.all([
        mustQuery(
          db
            .from("job_runs")
            .select(
              "id, job, status, triggered_by, started_at, finished_at, duration_ms, counts, note",
            )
            .eq("job", def.id)
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          `admin/jobs: latest run (${def.id})`,
        ),
        mustQuery(
          db
            .from("job_runs")
            .select("finished_at")
            .eq("job", def.id)
            .not("finished_at", "is", null)
            .order("finished_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          `admin/jobs: last finish (${def.id})`,
        ),
      ]);
      const run = latest ? narrowRun(latest) : null;
      return {
        job: def.id,
        lastRunRow: run,
        lastRun: run
          ? {
              status: run.status,
              startedAtMs: Date.parse(run.started_at),
              finishedAtMs: run.finished_at
                ? Date.parse(run.finished_at)
                : null,
              // A finished run that ran out of time with work left reads as `attention`.
              stoppedEarly: countsStoppedEarly(run.counts),
            }
          : null,
        lastFinishedAtMs: lastFinished?.finished_at
          ? Date.parse(lastFinished.finished_at)
          : null,
      };
    }),
  );
}

/**
 * WHERE A SWEEP LEFT OFF (the 1,000-row round): the resume cursor its last FINISHED run stored in
 * `counts` (`RESUME_KEY` in `src/lib/jobs/sweep-tally.ts`, which says which sweeps keep one). A
 * sub-sweep keeps it on its own row (`job` alone); a sweep riding the parent run keeps it in its
 * nested tally (`job` = `purge_cron`, `sweep` = its name). The newest `ok` or `error` run decides: a
 * `running` row is this very run (or one that died), a `skipped` row carries no counts, and a pause
 * must not reset the rotation. Null means "start from the beginning", which re-examines rows but can
 * never skip one. A failed read THROWS, like every read here; the sweep catches it and starts over.
 */
export async function readSweepCursor(
  job: JobId,
  sweep?: string,
): Promise<string | null> {
  const row = await mustQuery(
    jobRunsDb()
      .from("job_runs")
      .select("counts")
      .eq("job", job)
      .in("status", ["ok", "error"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    `admin/jobs: resume cursor (${sweep ?? job})`,
  );
  return cursorFrom(row?.counts ?? null, sweep);
}

// ---------------------------------------------------------------------------
// The rolling 24h signals (`signal` jobs — a query, not a stored aggregate)
// ---------------------------------------------------------------------------

/** Every `signal` job's window, keyed by JobId. `mustCount` throughout: see the header's second rule. */
export type JobSignals = Partial<Record<JobId, JobSignal>>;

/**
 * The 24h windows for the three signal jobs, as SIX head-counts in parallel.
 *
 * A QUERY, not a stored daily aggregate, and the cost is why: every one of these is a bounded
 * count over a table that is either tiny by construction (`action_attempts` and `unlock_attempts`
 * are pruned to 24h by the purge cron's own sweeps) or tiny by budget (`sent_emails` tops out near
 * the 3,000/month Resend free tier). A row-per-day aggregate would need a table, a migration, a
 * writer, its own backfill and its own failure mode, to save six index-or-small-table counts on a
 * page only an operator opens. Revisit if `sent_emails` ever outgrows a seq scan; the additive
 * `sent_emails (sent_at desc)` index in this round's migration is the first step of that.
 *
 * THE FAILURE half is always `job_runs` (the error rows `recordJobFailure` writes); the SUCCESS half
 * is each path's own evidence, so "nothing failed" can never be printed without saying whether
 * anything happened at all.
 */
export async function getJobSignals(nowMs = Date.now()): Promise<JobSignals> {
  const db = jobRunsDb();
  const sinceIso = new Date(nowMs - SIGNAL_WINDOW_MS).toISOString();

  const failuresOf = (job: JobId) =>
    mustCount(
      db
        .from("job_runs")
        .select("*", { count: "exact", head: true })
        .eq("job", job)
        .eq("status", "error")
        .gt("started_at", sinceIso),
      `admin/jobs: 24h failures (${job})`,
    );

  const [
    emailsSent,
    emailFailures,
    abuseAttempts,
    abuseFailures,
    unlockAttempts,
    unlockFailures,
  ] = await Promise.all([
    mustCount(
      db
        .from("sent_emails")
        .select("*", { count: "exact", head: true })
        .gt("sent_at", sinceIso),
      "admin/jobs: 24h emails sent",
    ),
    failuresOf("email_delivery"),
    mustCount(
      db
        .from("action_attempts")
        .select("*", { count: "exact", head: true })
        .gt("created_at", sinceIso),
      "admin/jobs: 24h abuse-limiter records",
    ),
    failuresOf("abuse_limiter"),
    mustCount(
      db
        .from("unlock_attempts")
        .select("*", { count: "exact", head: true })
        .gt("attempted_at", sinceIso),
      "admin/jobs: 24h unlock-limiter records",
    ),
    failuresOf("unlock_limiter"),
  ]);

  return {
    email_delivery: { ok24h: emailsSent, failed24h: emailFailures },
    abuse_limiter: { ok24h: abuseAttempts, failed24h: abuseFailures },
    unlock_limiter: { ok24h: unlockAttempts, failed24h: unlockFailures },
  };
}
