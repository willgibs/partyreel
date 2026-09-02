/**
 * THE BACKEND-JOB CATALOG — the single source for what jobs exist, how often each is supposed to
 * run, which `ops_flags` row switches it off, and whether an operator can trigger it by hand.
 *
 * PURE on purpose (no env, no DB, no `server-only`), for two reasons: it is unit-tested next door,
 * and every consumer needs it — the /admin/jobs page, the purge cron route, the internal job-run
 * endpoint the Cloudflare Worker and the GitHub Action call, and the freshness scan. It lives beside
 * the page rather than in `src/lib/db` because the health vocabulary below is a PRESENTATION fact
 * (what the operator is told), not a data-access one; `src/lib/db/queries/jobs.ts` holds the reads
 * and writes and imports from here.
 *
 * Adding a job: add an entry here, seed its `ops_flags` row, and have the job call the heartbeat.
 * `job_runs.job` is deliberately unconstrained in SQL so a new job never needs a migration.
 */

export type JobId =
  | "purge_cron"
  | "backup_reconcile"
  | "backup_prune"
  | "db_backup";

/** Where the job actually executes. Decides what an operator can do about it from /admin. */
export type JobHost = "vercel_cron" | "cloudflare_worker" | "github_actions";

export type JobDef = {
  id: JobId;
  label: string;
  /** One plain line: what it does, and what it costs us if it silently stops. */
  description: string;
  host: JobHost;
  /** The cron expression as deployed (vercel.json / wrangler.jsonc / the workflow). */
  cron: string;
  /** Human cadence, for the card. */
  cadence: string;
  /** Nominal gap between runs. The freshness scan allows MISSED_GRACE_MULTIPLIER times this. */
  expectedEveryMs: number;
  /** The `ops_flags` row that pauses it. */
  flagKey: string;
  /** True only where the app can actually start the job itself (see JOB_RUN_NOW_NOTE). */
  canRunNow: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A run is late, not missing, until it is HALF a cadence overdue: a daily job that normally lands at
 * 04:00 has until 16:00 the next day before it pages anyone. Wide enough that a slow run or a
 * provider retry never cries wolf, tight enough that a job which stopped firing is caught the same
 * day (the scan itself runs daily, inside the purge cron).
 */
export const MISSED_GRACE_MULTIPLIER = 1.5;

export const JOBS: JobDef[] = [
  {
    id: "purge_cron",
    label: "Purge sweep",
    description:
      "Frees real storage: hard-deletes media past its recoverable tail, orphaned R2 objects, expired passes, and the over-capacity and inactivity lifecycle. The only job that reclaims bytes.",
    host: "vercel_cron",
    cron: "0 4 * * *",
    cadence: "Daily, 04:00 UTC",
    expectedEveryMs: DAY_MS,
    flagKey: "purge_cron_enabled",
    // The app can call its own route with the cron secret, so this one is genuinely runnable.
    canRunNow: true,
  },
  {
    id: "backup_reconcile",
    label: "Backup reconcile",
    description:
      "The media backup's backstop: copies any event object the real-time queue missed into the locked second bucket. Without it a missed notification is a permanent hole in the backup.",
    host: "cloudflare_worker",
    cron: "0 5 * * *",
    cadence: "Daily, 05:00 UTC",
    expectedEveryMs: DAY_MS,
    flagKey: "backup_reconcile_enabled",
    canRunNow: false,
  },
  {
    id: "backup_prune",
    label: "Backup prune",
    description:
      "Reclaims backup objects whose media is gone from both the database and the primary bucket. The only job that deletes from the last-resort copy, so it stays in dry run until launch.",
    host: "cloudflare_worker",
    cron: "0 6 * * 1",
    cadence: "Weekly, Mondays 06:00 UTC",
    expectedEveryMs: 7 * DAY_MS,
    flagKey: "backup_prune_enabled",
    canRunNow: false,
  },
  {
    id: "db_backup",
    label: "Database backup",
    description:
      "The off-site Postgres dump into the locked backup bucket. Survives a whole Supabase account loss, and the media backup is worthless without the rows.",
    host: "github_actions",
    cron: "0 6 * * *",
    cadence: "Daily, 06:00 UTC",
    expectedEveryMs: DAY_MS,
    flagKey: "db_backup_enabled",
    canRunNow: false,
  },
];

/** Why a job has no Run now button, said in the operator's language on the card. */
export const JOB_RUN_NOW_NOTE: Record<JobHost, string | null> = {
  vercel_cron: null,
  cloudflare_worker:
    "Runs on Cloudflare. Trigger it from the Worker's dashboard, or wait for the next cron.",
  github_actions:
    "Runs on GitHub. Trigger it from the Actions tab (Run workflow), or wait for the next cron.",
};

export function jobById(id: string): JobDef | undefined {
  return JOBS.find((j) => j.id === id);
}

/** What the operator sees, worst-first. `paused` outranks everything: it is a deliberate state. */
export type JobHealth =
  | "paused"
  | "missed"
  | "failed"
  | "running"
  | "ok"
  | "never";

/** The heartbeat row shape the health rules need (the full row lives in the queries module). */
export type JobRunSummary = {
  status: "running" | "ok" | "error" | "skipped";
  startedAtMs: number;
  finishedAtMs: number | null;
};

/**
 * Is this job overdue? A run counts as "reported in" only when it FINISHED — `skipped` included, so
 * pausing a job never makes it look missing, and `error` included, because a failure is a different
 * (louder) signal than a silence. A row still `running` past the window is treated as missing too:
 * it never reported a result, which is exactly the shape of a job that died mid-flight.
 */
export function isJobMissed(
  def: JobDef,
  lastFinishedAtMs: number | null,
  nowMs: number,
): boolean {
  const deadline = def.expectedEveryMs * MISSED_GRACE_MULTIPLIER;
  // Never run at all is NOT "missed": a job with no history has nothing to be late for, and a fresh
  // deploy would otherwise page on every job at once. The page shows it as `never` instead.
  if (lastFinishedAtMs === null) return false;
  return nowMs - lastFinishedAtMs > deadline;
}

/**
 * The single health verdict for a job card. Pure so the page and the alerting scan can never drift
 * into two different definitions of "healthy".
 */
export function jobHealth(input: {
  def: JobDef;
  enabled: boolean;
  lastRun: JobRunSummary | null;
  lastFinishedAtMs: number | null;
  nowMs: number;
}): JobHealth {
  const { def, enabled, lastRun, lastFinishedAtMs, nowMs } = input;
  if (!enabled) return "paused";
  if (!lastRun) return "never";
  if (isJobMissed(def, lastFinishedAtMs, nowMs)) return "missed";
  if (lastRun.status === "running") {
    // A run in flight is healthy until it outlives its own cadence window, at which point it is a
    // stuck run and reads as missed (nothing will ever close it).
    const overdue =
      nowMs - lastRun.startedAtMs >
      def.expectedEveryMs * MISSED_GRACE_MULTIPLIER;
    return overdue ? "missed" : "running";
  }
  if (lastRun.status === "error") return "failed";
  return "ok";
}
