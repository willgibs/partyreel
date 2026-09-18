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
 * THREE KINDS OF ENTRY, because "job" turned out to mean three different things once EVERY backend
 * job had to report (the admin-jobs round). They all resolve through ONE `jobHealth`, so the page
 * and the alerting scan can never hold two definitions of healthy:
 *
 *   scheduled — fires on a clock and writes its own `job_runs` rows. The cadence + the missed-run
 *               rule apply. The purge cron, the two Worker jobs, the DB-backup Action, and the four
 *               purge SUB-SWEEPS, each of which now opens and closes a row of its own.
 *   signal    — no clock. Something else does the work (a transactional email, a rate-limiter read)
 *               and the only question is "did any of it fail in the last 24 hours?". `job_runs`
 *               carries the FAILURES (status `error`); the successes are counted in their own table.
 *               A missed-run rule would be meaningless, so it is not applied.
 *   derived   — no rows at all. The reading rides another job's `counts` (the Cloudflare queue and
 *               dead-letter depths, which only the Worker can see). Its freshness is its source's.
 *
 * Adding a job: add an entry here, seed its `ops_flags` row if it has a switch, and have the job
 * call the heartbeat. `job_runs.job` is deliberately unconstrained in SQL so a new job never needs
 * a migration.
 */

export type JobId =
  | "purge_cron"
  | "backup_reconcile"
  | "backup_prune"
  | "db_backup"
  // The purge cron's four heaviest sub-sweeps, each its own run row (admin-jobs round). One bad
  // account now fails ONE sweep, and a sweep that fails is a red card of its own rather than a
  // line buried in the parent run's counts.
  | "purge_orphans"
  | "purge_deleted_accounts"
  | "purge_inactivity"
  | "purge_over_capacity"
  // The Cloudflare queue's backlog + its dead letters, read by the Worker, reported on its runs.
  | "backup_queue"
  | "backup_dead_letters"
  // Rolling 24h signals over work that has no schedule of its own.
  | "email_delivery"
  | "abuse_limiter"
  | "unlock_limiter";

/** Where the job actually executes. Decides what an operator can do about it from /admin. */
export type JobHost =
  | "vercel_cron"
  | "cloudflare_worker"
  | "github_actions"
  /** A sub-sweep of the purge cron: same invocation, its own row, its own switch. */
  | "purge_sweep"
  /** Not a place at all — a reading the app takes over its own tables. */
  | "app";

export type JobKind = "scheduled" | "signal" | "derived";

export type JobDef = {
  id: JobId;
  label: string;
  /** One plain line: what it does, and what it costs us if it silently stops. */
  description: string;
  kind: JobKind;
  host: JobHost;
  /** The cron expression as deployed (vercel.json / wrangler.jsonc / the workflow). Null off a clock. */
  cron: string | null;
  /** Human cadence, for the card. */
  cadence: string;
  /**
   * Nominal gap between runs, for `scheduled` entries only. The freshness scan allows
   * MISSED_GRACE_MULTIPLIER times this. Zero on a `signal` / `derived` entry: there is no clock to
   * be late against, and `isJobMissed` refuses to judge one.
   */
  expectedEveryMs: number;
  /** The `ops_flags` row that pauses it, or null where there is nothing to pause. */
  flagKey: string | null;
  /** True only where the app can actually start the job itself (see JOB_RUN_NOW_NOTE). */
  canRunNow: boolean;
  /** `derived` only: the jobs whose `counts` can carry this reading, freshest wins. */
  readFrom?: JobId[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** The window every `signal` job reports over. One day, matching the daily cron's own rhythm. */
export const SIGNAL_WINDOW_MS = DAY_MS;

/**
 * A run is late, not missing, until it is HALF a cadence overdue: a daily job that normally lands at
 * 04:00 has until 16:00 the next day before it pages anyone. Wide enough that a slow run or a
 * provider retry never cries wolf, tight enough that a job which stopped firing is caught the same
 * day (the scan itself runs daily, inside the purge cron).
 */
export const MISSED_GRACE_MULTIPLIER = 1.5;

/**
 * The `counts` keys the Worker reports its Cloudflare depths under. Named HERE, in the pure module,
 * because the Worker writes them and the console reads them back: a string typed twice in two
 * packages is exactly how a health signal quietly stops resolving.
 */
export const DEPTH_COUNT_KEYS = {
  backup_queue: "queue_backlog",
  backup_dead_letters: "dead_letter_backlog",
} as const;

/** The matching "how old is the oldest unacknowledged message" keys, in whole minutes. */
export const DEPTH_AGE_COUNT_KEYS = {
  backup_queue: "queue_oldest_min",
  backup_dead_letters: "dead_letter_oldest_min",
} as const;

/**
 * A backlog this size on the LIVE backup queue is a sign the consumer is not keeping up. It is not
 * a fault on its own (a wedding's upload burst legitimately queues, and the daily reconcile copies
 * anything the queue never reached), so it reads as attention rather than failure.
 */
export const QUEUE_BACKLOG_ATTENTION = 500;

export const JOBS: JobDef[] = [
  {
    id: "purge_cron",
    label: "Purge sweep",
    description:
      "Frees real storage: hard-deletes media past its recoverable tail, orphaned R2 objects, expired passes, and the over-capacity and inactivity lifecycle. The only job that reclaims bytes.",
    kind: "scheduled",
    host: "vercel_cron",
    cron: "0 4 * * *",
    cadence: "Daily, 04:00 UTC",
    expectedEveryMs: DAY_MS,
    flagKey: "purge_cron_enabled",
    // The app can call its own route with the cron secret, so this one is genuinely runnable.
    canRunNow: true,
  },
  // --- the purge cron's sub-sweeps -------------------------------------------------------------
  // Each opens and closes its own row inside the parent run. WHY these four and not the other seven:
  // they are the sweeps that loop over ACCOUNTS and either send email or delete bytes, so they are
  // where one bad row used to cost every row behind it, and where an operator might want to stop one
  // thing overnight without giving up storage reclamation.
  {
    id: "purge_orphans",
    label: "Orphan sweep",
    description:
      "Deletes R2 objects with no media row, behind the circuit-breaker. Stopping silently leaks storage forever; running wrongly is the one path that could empty the bucket, so both ends need a light on.",
    kind: "scheduled",
    host: "purge_sweep",
    cron: "0 4 * * *",
    cadence: "Daily, inside the purge sweep",
    expectedEveryMs: DAY_MS,
    flagKey: "purge_orphans_enabled",
    canRunNow: false,
  },
  {
    id: "purge_deleted_accounts",
    label: "Account deletion sweep",
    description:
      "Finishes the deletions people asked for: R2 objects, media rows, event rows, then the auth user. A stall here means someone who asked to be forgotten technically still exists.",
    kind: "scheduled",
    host: "purge_sweep",
    cron: "0 4 * * *",
    cadence: "Daily, inside the purge sweep",
    expectedEveryMs: DAY_MS,
    flagKey: "purge_deleted_accounts_enabled",
    canRunNow: false,
  },
  {
    id: "purge_inactivity",
    label: "Inactivity sweep",
    description:
      "Warns, then soft-deletes free events with no activity for six months. It removes a host's event, so both a stall and a misfire have to be visible the next morning.",
    kind: "scheduled",
    host: "purge_sweep",
    cron: "0 4 * * *",
    cadence: "Daily, inside the purge sweep",
    expectedEveryMs: DAY_MS,
    flagKey: "purge_inactivity_enabled",
    canRunNow: false,
  },
  {
    id: "purge_over_capacity",
    label: "Over-capacity sweep",
    description:
      "Opens the grace window for lapsed paid accounts over their cap, reminds them, then auto-reduces. Stopping silently means nobody is warned and nothing is reclaimed.",
    kind: "scheduled",
    host: "purge_sweep",
    cron: "0 4 * * *",
    cadence: "Daily, inside the purge sweep",
    expectedEveryMs: DAY_MS,
    flagKey: "purge_over_capacity_enabled",
    canRunNow: false,
  },
  // --- the backup Worker ------------------------------------------------------------------------
  {
    id: "backup_reconcile",
    label: "Backup reconcile",
    description:
      "The media backup's backstop: copies any event object the real-time queue missed into the locked second bucket. Without it a missed notification is a permanent hole in the backup.",
    kind: "scheduled",
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
    kind: "scheduled",
    host: "cloudflare_worker",
    cron: "0 6 * * 1",
    cadence: "Weekly, Mondays 06:00 UTC",
    expectedEveryMs: 7 * DAY_MS,
    flagKey: "backup_prune_enabled",
    canRunNow: false,
  },
  {
    id: "backup_queue",
    label: "Backup queue",
    description:
      "The live copy path's backlog: messages waiting to be copied into the backup bucket. A growing backlog means the real-time RPO is drifting from seconds toward the daily reconcile.",
    kind: "derived",
    host: "cloudflare_worker",
    cron: null,
    cadence: "Read on every Worker run",
    expectedEveryMs: 0,
    flagKey: null,
    canRunNow: false,
    readFrom: ["backup_reconcile", "backup_prune"],
  },
  {
    id: "backup_dead_letters",
    label: "Backup dead letters",
    description:
      "Objects the live copy path gave up on after every retry. Each one is a media file with no backup copy until a reconcile catches it, and until now they were visible only on the Cloudflare dashboard.",
    kind: "derived",
    host: "cloudflare_worker",
    cron: null,
    cadence: "Read on every Worker run",
    expectedEveryMs: 0,
    flagKey: null,
    canRunNow: false,
    readFrom: ["backup_reconcile", "backup_prune"],
  },
  {
    id: "db_backup",
    label: "Database backup",
    description:
      "The off-site Postgres dump into the locked backup bucket. Survives a whole Supabase account loss, and the media backup is worthless without the rows.",
    kind: "scheduled",
    host: "github_actions",
    cron: "0 6 * * *",
    cadence: "Daily, 06:00 UTC",
    expectedEveryMs: DAY_MS,
    flagKey: "db_backup_enabled",
    canRunNow: false,
  },
  // --- the rolling 24h signals ------------------------------------------------------------------
  // No switch on any of them: a signal reports on work other code does, so there is nothing here to
  // pause. A switch that only silenced the reading would be the opposite of this console.
  {
    id: "email_delivery",
    label: "Transactional email",
    description:
      "Every lifecycle and operator email of the last day, and every send that failed or was refused. A dead sender is silent by design today: the claim is released and the cron simply tries again tomorrow, forever.",
    kind: "signal",
    host: "app",
    cron: null,
    cadence: "Rolling 24 hours",
    expectedEveryMs: 0,
    flagKey: null,
    canRunNow: false,
  },
  {
    id: "abuse_limiter",
    label: "Abuse limiter",
    description:
      "The guest-route breadth limiter. It fails OPEN by design, so an unreachable counter looks exactly like a quiet night unless the error is counted somewhere.",
    kind: "signal",
    host: "app",
    cron: null,
    cadence: "Rolling 24 hours",
    expectedEveryMs: 0,
    flagKey: null,
    canRunNow: false,
  },
  {
    id: "unlock_limiter",
    label: "Unlock limiter",
    description:
      "The password-unlock brute-force limiter. Also fail-open, so a silent outage here is an open brute-force window nobody would ever learn about.",
    kind: "signal",
    host: "app",
    cron: null,
    cadence: "Rolling 24 hours",
    expectedEveryMs: 0,
    flagKey: null,
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
  purge_sweep:
    "Runs inside the purge sweep. Run that to run this; pausing it here leaves the rest of the sweep working.",
  app: "Nothing to start: this is a reading over work the app already did.",
};

export function jobById(id: string): JobDef | undefined {
  return JOBS.find((j) => j.id === id);
}

/** Every job that keeps its own `job_runs` rows, so a `derived` entry is never queried for. */
export function jobsWithRuns(): JobDef[] {
  return JOBS.filter((j) => j.kind !== "derived");
}

/** The purge sub-sweeps, in the order the cron runs them. */
export function subSweepJobs(): JobDef[] {
  return JOBS.filter((j) => j.host === "purge_sweep");
}

/** What the operator sees, worst-first. `paused` outranks everything: it is a deliberate state. */
export type JobHealth =
  | "paused"
  | "missed"
  | "failed"
  | "attention"
  | "running"
  | "ok"
  | "never";

/** The health states an operator has to do something about. Drives the alerts bell. */
export const UNHEALTHY: readonly JobHealth[] = [
  "missed",
  "failed",
  "attention",
];

export function isUnhealthy(health: JobHealth): boolean {
  return UNHEALTHY.includes(health);
}

/** The heartbeat row shape the health rules need (the full row lives in the queries module). */
export type JobRunSummary = {
  status: "running" | "ok" | "error" | "skipped";
  startedAtMs: number;
  finishedAtMs: number | null;
};

/** A `signal` job's rolling window: what succeeded, and what did not. */
export type JobSignal = {
  /** Successful work in the window (emails sent, limiter decisions taken). */
  ok24h: number;
  /** Failures in the window — the `job_runs` error rows this job wrote. */
  failed24h: number;
};

/** A `derived` job's reading, plus the health of the run that carried it. */
export type JobReading = {
  /** Null when no run has reported a reading yet. */
  value: number | null;
  /** When the reading was taken (the reporting run's start). Null with no reading. */
  readAtMs: number | null;
  /** The reporting job's own health, so a stale reading cannot read as a fresh zero. */
  sourceHealth: JobHealth;
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
  // A job with no clock cannot be late. Guarding HERE rather than at each call site means the
  // freshness scan in the purge cron needs no knowledge of the kinds: it asks every entry the same
  // question and gets an honest answer.
  if (def.kind !== "scheduled" || def.expectedEveryMs <= 0) return false;
  const deadline = def.expectedEveryMs * MISSED_GRACE_MULTIPLIER;
  // Never run at all is NOT "missed": a job with no history has nothing to be late for, and a fresh
  // deploy would otherwise page on every job at once. The page shows it as `never` instead.
  if (lastFinishedAtMs === null) return false;
  return nowMs - lastFinishedAtMs > deadline;
}

/**
 * A `signal` job's verdict. ONE failure in the window is a failure: these are all paths that are
 * supposed to be silent, so anything they logged is by definition the thing we could not see before.
 * No activity at all is `never`, never `ok` — zero of everything is the calm-empty-page reading this
 * console exists to refuse, and the card prints both numbers so the operator can tell which it is.
 */
export function signalHealth(signal: JobSignal | null): JobHealth {
  if (!signal) return "never";
  if (signal.failed24h > 0) return "failed";
  if (signal.ok24h > 0) return "ok";
  return "never";
}

/**
 * A `derived` job's verdict. The reading is only as good as the run that carried it, so an unwell
 * source WINS: a depth of zero read four days ago is not a healthy queue, it is no reading at all.
 * Any dead letter is a FAILURE (each one is a media object with no backup copy); a merely large live
 * backlog is `attention`, because an upload burst queues legitimately and the reconcile backstops it.
 */
export function readingHealth(
  def: JobDef,
  reading: JobReading | null,
): JobHealth {
  if (!reading) return "never";
  if (isUnhealthy(reading.sourceHealth)) return reading.sourceHealth;
  if (reading.value === null) return "never";
  if (def.id === "backup_dead_letters") {
    return reading.value > 0 ? "failed" : "ok";
  }
  return reading.value >= QUEUE_BACKLOG_ATTENTION ? "attention" : "ok";
}

/**
 * The single health verdict for a job card. Pure so the page and the alerting scan can never drift
 * into two different definitions of "healthy". Every kind resolves through here, and the extra
 * inputs are OPTIONAL so a caller that only knows about scheduled jobs (the purge cron's freshness
 * scan) still gets an honest answer: `never`, which is not `missed`, so it never pages on a reading
 * it did not take. Those two kinds raise their own alerts where the number is produced instead.
 */
export function jobHealth(input: {
  def: JobDef;
  enabled: boolean;
  lastRun: JobRunSummary | null;
  lastFinishedAtMs: number | null;
  nowMs: number;
  /** `signal` jobs only. */
  signal?: JobSignal | null;
  /** `derived` jobs only. */
  reading?: JobReading | null;
}): JobHealth {
  const { def, enabled, lastRun, lastFinishedAtMs, nowMs } = input;
  if (!enabled) return "paused";
  if (def.kind === "signal") return signalHealth(input.signal ?? null);
  if (def.kind === "derived") return readingHealth(def, input.reading ?? null);
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

/** One source run a `derived` reading can be pulled from. */
export type DepthSource = {
  job: JobId;
  counts: unknown;
  startedAtMs: number | null;
  health: JobHealth;
};

/**
 * Pull a `derived` job's number back out of the run row that carried it. PURE, and it lives here
 * next to the key names so the Worker's write and the console's read are ONE fact: the Worker puts
 * `queue_backlog` / `dead_letter_backlog` into its `counts`, and nothing else in the system knows
 * those strings. A run that reported no depth (an older Worker, or a run that could not read the
 * queue) yields `value: null`, which reads as "no reading" and never as zero.
 */
export function readDepth(
  def: JobDef,
  sources: DepthSource[],
): JobReading | null {
  if (def.kind !== "derived") return null;
  const key = DEPTH_COUNT_KEYS[def.id as keyof typeof DEPTH_COUNT_KEYS];
  const candidates = sources.filter((s) =>
    (def.readFrom ?? []).includes(s.job),
  );
  if (candidates.length === 0) return null;

  let best: (DepthSource & { value: number }) | null = null;
  for (const source of candidates) {
    const value = key ? numberFrom(source.counts, key) : null;
    if (value === null) continue;
    if (best && (source.startedAtMs ?? 0) <= (best.startedAtMs ?? 0)) continue;
    best = { ...source, value };
  }

  if (!best) {
    // We looked and found no number. Carry the freshest source's health so the card can say "the
    // Worker has not reported a depth yet" instead of falling silent or inventing a zero.
    const freshest = candidates.reduce((a, b) =>
      (b.startedAtMs ?? 0) > (a.startedAtMs ?? 0) ? b : a,
    );
    return { value: null, readAtMs: null, sourceHealth: freshest.health };
  }
  return {
    value: best.value,
    readAtMs: best.startedAtMs,
    sourceHealth: best.health,
  };
}

/** The oldest-message age a run reported alongside the depth, in minutes. Null when absent. */
export function readDepthAgeMinutes(
  def: JobDef,
  counts: unknown,
): number | null {
  const key = DEPTH_AGE_COUNT_KEYS[def.id as keyof typeof DEPTH_AGE_COUNT_KEYS];
  if (!key) return null;
  return numberFrom(counts, key);
}

function numberFrom(counts: unknown, key: string): number | null {
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    return null;
  }
  const raw = (counts as Record<string, unknown>)[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}
