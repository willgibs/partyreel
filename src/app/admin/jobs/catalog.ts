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
 *               rule apply. The purge cron, the backup Worker's three jobs and the export Worker's
 *               heartbeat, the DB-backup Action, and the six purge SUB-SWEEPS, each of which opens
 *               and closes a row of its own.
 *   signal    — no clock. Something else does the work (a transactional email, a rate-limiter read)
 *               and the only question is "did any of it fail in the last 24 hours?". `job_runs`
 *               carries the FAILURES (status `error`); the successes are counted in their own table.
 *               A missed-run rule would be meaningless, so it is not applied.
 *   derived   — no rows at all. The reading rides another job's `counts` (the Cloudflare queue and
 *               dead-letter depths, which only the Worker can see, and the keys the prune found the
 *               backup alone holds). Its freshness is its source's.
 *
 * Adding a job: add an entry here, seed its `ops_flags` row if it has a switch, and have the job
 * call the heartbeat. `job_runs.job` is deliberately unconstrained in SQL so a new job never needs
 * a migration.
 */

export type JobId =
  | "purge_cron"
  // Our own spend guards (lane `spend-watch`): reads our counters, alerts past ten times the week's busiest, and
  // pauses the switch that stops a vector where a false alarm costs no guest's moment.
  | "spend_watch"
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
  // The album change log's prune (crumbs-37): rows only, but in the album's live core, so it keeps
  // its own switch and card like the four that touch accounts.
  | "purge_album_log"
  // The develop (20261002200000): it reveals photographs, so it keeps its own switch and card.
  | "develop_rolls"
  // The Cloudflare queue's backlog + its dead letters, read by the Worker, reported on its runs.
  | "backup_queue"
  | "backup_dead_letters"
  // What the backup prune found held by the backup alone (crumbs-75): rows alive, primary objects gone.
  | "backup_primary_missing"
  // The restore that copies those lone copies back (durability-restore): only keys a live row names, never over an
  // object that is there, under the Worker's RESTORE_MODE.
  | "backup_restore"
  // The "Download all" zip Worker's daily self-check (`export-ends`), on the exports' own switch.
  | "export"
  // Send to Google Drive (drive-wiring): the Worker's sweep (its heartbeat, hourly), its queue and dead letters (read
  // by the Worker on each sweep), and the transfer's own failures, a rolling signal.
  | "drive_export"
  | "drive_queue"
  | "drive_dead_letters"
  | "drive_transfer"
  // Rolling 24h signals over work that has no schedule of its own.
  | "email_delivery"
  | "abuse_limiter"
  | "unlock_limiter"
  | "help_feedback"
  | "export_delivery";

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
  /**
   * The route Run now calls with the cron secret, for a job the app can start: the one `vercel.json` schedules, so
   * a manual run is the scheduled run in every sense (`catalog.test.ts` holds the two together).
   */
  runPath?: string;
  /** `derived` only: the jobs whose `counts` can carry this reading, freshest wins. */
  readFrom?: JobId[];
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * How long a download the Worker spoke of may go without saying how it ended before `export_delivery` counts it as
 * owed (crumbs-75): past what a whole 20 GB part takes on a 10 Mbps line (about four and a half hours), so a long
 * download still streaming is never read as one that died.
 */
export const EXPORT_END_GRACE_MS = 6 * HOUR_MS;

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
 * packages is exactly how a health signal quietly stops resolving. `primary_missing` is the count of
 * keys the backup alone holds, the whole backup's (the Worker's lone copies' table): the prune writes
 * it on every run that judged its candidates, zero included (`workers/backup/src/prune-run.ts`), the
 * daily reconcile on every run that reached its table (`reconcile-run.ts`, which judges the keys
 * younger than the prune's gate), and the restore on every pass (`workers/backup/src/restore-pass.ts`).
 */
export const DEPTH_COUNT_KEYS = {
  backup_queue: "queue_backlog",
  backup_dead_letters: "dead_letter_backlog",
  // The Drive Worker reports its own queue's depths under the same keys (workers/drive/src/queue-metrics.ts).
  drive_queue: "queue_backlog",
  drive_dead_letters: "dead_letter_backlog",
  backup_primary_missing: "primary_missing",
} as const;

/**
 * The readings where any count at all is a failure: a dead letter is a media object with no backup copy, and a key
 * held by the backup alone is a media object with no primary copy (a host's photo that will not open, the backup its
 * last copy). A live backlog is the other kind: a burst queues legitimately, so a big one reads attention.
 */
export const ZERO_TOLERANCE_READINGS: readonly JobId[] = [
  "backup_dead_letters",
  "backup_primary_missing",
  // A Drive lane that died three times over (a poison connection): its connection pauses itself at three a day, and
  // the dead letter waits here for a look (nothing drains the dead-letter queue).
  "drive_dead_letters",
];

/** The matching "how old is the oldest unacknowledged message" keys, in whole minutes. */
export const DEPTH_AGE_COUNT_KEYS = {
  backup_queue: "queue_oldest_min",
  backup_dead_letters: "dead_letter_oldest_min",
  drive_queue: "queue_oldest_min",
  drive_dead_letters: "dead_letter_oldest_min",
} as const;

/**
 * A backlog this size on the LIVE backup queue is a sign the consumer is not keeping up. It is not
 * a fault on its own (a wedding's upload burst legitimately queues, and the daily reconcile copies
 * anything the queue never reached), so it reads as attention rather than failure.
 */
export const QUEUE_BACKLOG_ATTENTION = 500;

/**
 * THE "STOPPED EARLY" FLAG, a top-level `counts` key (the 1,000-row round, 2026-09-23). A purge
 * sweep works in batches under a time budget (`src/lib/lifecycle/sweep-budget.ts`); one that runs
 * out of time with work left sets this `true` on its tally, beside a `remaining` count where it can
 * take one, and the parent purge run sets it when any sweep did. Named HERE because the sweeps write
 * it and the console reads it back (the depth keys' reason above). A run that stopped early reads as
 * `attention`: it did nothing wrong, but a backlog that outlasts one night is exactly what used to
 * grow without a word.
 */
export const STOPPED_EARLY_KEY = "stopped_early";

/** Did the run whose `counts` these are stop early? Only an explicit `true` says so. */
export function countsStoppedEarly(counts: unknown): boolean {
  return countsFlag(counts, STOPPED_EARLY_KEY);
}

/**
 * A TRIPPED BREAKER'S FLAG, a top-level `counts` key. When the Orphan sweep's circuit-breaker finds the
 * orphan candidates pathological (durability-backups.md) it deletes nothing, fires its Sentry error and
 * the operator email, and returns normally with this `true`, so the run closes `ok`: the breaker did its
 * job, and nothing failed. Read here as `attention`, because a tripped breaker is a person's call to make
 * (a lost media set, or an intentional purge on the wrong path), and a card reading Healthy beside that
 * email was a quiet contradiction. The spend watch is a breaker too and sets the same key while a reading
 * trips or a switch it paused still stands (`runCounts`, src/lib/jobs/spend-watch.ts), and so does the
 * backup reconcile when a key's two copies differ (it never overwrites the backup: a person decides which
 * copy is good, workers/backup/src/reconcile-run.ts). The sweep types the key on its tally
 * (`OrphansTally`); the catalog's test pins the two together.
 */
export const BREAKER_TRIPPED_KEY = "breaker_tripped";

/** Did the run whose `counts` these are trip the orphan circuit-breaker? Only an explicit `true`. */
export function countsBreakerTripped(counts: unknown): boolean {
  return countsFlag(counts, BREAKER_TRIPPED_KEY);
}

function countsFlag(counts: unknown, key: string): boolean {
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    return false;
  }
  return (counts as Record<string, unknown>)[key] === true;
}

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
    runPath: "/api/cron/purge",
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
  // A fifth that deletes neither bytes nor accounts, promoted for where it works: the album's change
  // log, the live core every open album polls. A prune that misbehaved is stopped here without giving up
  // the night's storage reclamation, and its pass across the log rotates on its own run row's cursor.
  {
    id: "purge_album_log",
    label: "Album change log",
    description:
      "Prunes the album change log of the rows purged items leave behind, raising each album's watermark so a client that missed them is sent its album whole. Stopping silently only grows the log; a prune that went wrong would leave an album stale on a screen.",
    kind: "scheduled",
    host: "purge_sweep",
    cron: "0 4 * * *",
    cadence: "Daily, inside the purge sweep",
    expectedEveryMs: DAY_MS,
    flagKey: "purge_album_log_enabled",
    canRunNow: false,
  },
  // A sixth that deletes nothing: the develop, the backstop for an album nobody opened after its develop
  // time (the album's own first read develops it in the day). It REVEALS photographs, so an operator can stop it alone.
  {
    id: "develop_rolls",
    label: "Developing rolls",
    description:
      "Develops every album whose develop time has passed, so its photos appear for every guest even if nobody has opened it since. Stopping silently leaves photos sealed past their time until someone opens the album.",
    kind: "scheduled",
    host: "purge_sweep",
    cron: "0 4 * * *",
    cadence: "Daily, inside the purge sweep",
    expectedEveryMs: DAY_MS,
    flagKey: "develop_rolls_enabled",
    canRunNow: false,
  },
  // --- our own spend guards ----------------------------------------------------------------------
  // Its own route and its own cron, never a ride on the purge's: it must run while the purge is paused, and it may
  // be the one pausing it. Hobby fires a daily cron anywhere in its hour, so 05:00 lands after the purge's 04:00
  // hour has sent the night's lifecycle mail. ★ HOURLY AT LAUNCH: `0 * * * *` here and in vercel.json (Pro), with
  // `expectedEveryMs` an hour.
  {
    id: "spend_watch",
    label: "Spend watch",
    description:
      "Our own spend guards: reads uploads, mail, sign-ins, album changes, downloads and the purge's runs from our own tables, alerts past ten times the busiest of the week, and pauses lifecycle mail, downloads or the purge on its own. It also reads every vendor's plan meters against their limits (the Plan limits card) and mails each crossing. Stopping silently leaves the vendors with no cap of ours.",
    kind: "scheduled",
    host: "vercel_cron",
    cron: "0 5 * * *",
    cadence: "Daily, 05:00 UTC (hourly at launch)",
    expectedEveryMs: DAY_MS,
    flagKey: "spend_watch_enabled",
    canRunNow: true,
    runPath: "/api/cron/spend-watch",
  },
  // --- the backup Worker ------------------------------------------------------------------------
  {
    id: "backup_reconcile",
    label: "Backup reconcile",
    description:
      "The media backup's backstop: compares both buckets' listings and copies any event object the real-time queue missed into the locked second bucket, and finds the media files lost from the primary in their first five weeks. Without it a missed notification is a permanent hole in the backup.",
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
  // The prune's own finding (crumbs-75): the inverse of a dead letter, a primary object gone while its row lives.
  // The prune finds those past its gate and the reconcile the younger ones (backup-reconcile), both carried in the
  // Worker's lone copies' table; the restore copies them back and reports what it leaves, so the reading is the
  // freshest of the three.
  {
    id: "backup_primary_missing",
    label: "Held by the backup alone",
    description:
      "Media files whose row still names them while the primary bucket lost the object: the backup is the only copy, and the photo will not open for its host until it is restored. The daily reconcile finds them among the backup keys younger than five weeks and the weekly prune among the older ones, and neither deletes one; the backup restore below copies them back.",
    kind: "derived",
    host: "cloudflare_worker",
    cron: null,
    cadence: "Read on every reconcile run, prune run and restore pass",
    expectedEveryMs: 0,
    flagKey: null,
    canRunNow: false,
    readFrom: ["backup_prune", "backup_restore", "backup_reconcile"],
  },
  // The remedy for the card above, a job of its own (durability-restore): a pass is the Worker's Durable Object
  // alarm, asked for by the daily cron (the reconcile's), by each prune's end and by Restore now, so it reports daily.
  // Its Restore now is no generic Run now: the app asks the Worker's own door (restore-now.ts), so `canRunNow` stays
  // for the jobs the app starts itself.
  {
    id: "backup_restore",
    label: "Backup restore",
    description:
      "Copies the backup's lone copies back into the primary bucket: only keys a live row still names, never over an object that is there. Off, dry run or on by its Worker's RESTORE_MODE, a dry run until it is switched on. Stopping silently leaves a host's photo with one copy and unopenable.",
    kind: "scheduled",
    host: "cloudflare_worker",
    cron: "0 5 * * *",
    cadence:
      "Daily with the backup reconcile, after each prune, and on Restore now",
    expectedEveryMs: DAY_MS,
    flagKey: "backup_restore_enabled",
    canRunNow: false,
  },
  // --- the "Download all" Worker --------------------------------------------------------------
  // Its switch is the exports' own kill switch (`export_enabled`, the one /admin/exports flips): pausing
  // downloads is the only thing a switch here could mean, and a heartbeat with a switch of its own would
  // only silence the reading.
  {
    id: "export",
    label: "Download all Worker",
    description:
      "The zip Worker's daily self-check: it reads the bucket and signs a ping the app verifies, so a Worker that stopped, lost its bucket or its signing secret reads here before a host's download fails.",
    kind: "scheduled",
    host: "cloudflare_worker",
    cron: "30 5 * * *",
    cadence: "Daily, 05:30 UTC",
    expectedEveryMs: DAY_MS,
    flagKey: "export_enabled",
    canRunNow: false,
  },
  // --- Send to Google Drive (drive-export.md) ---------------------------------------------------
  // The switch is Drive's own (`drive_export_enabled`, the one /admin/exports flips, as `export` and Download all):
  // read inside the lease's own transaction, so a paused switch leases nothing and the card says Paused.
  {
    id: "drive_export",
    label: "Send to Google Drive",
    description:
      "The Send to Google Drive Worker's sweep, every five minutes: it kicks a send that stopped moving, resumes a pause whose time came, ends what ran too long, and reports its queue. Its heartbeat is written once an hour from the Worker's signed call, so a Worker whose secret drifted reads Overdue.",
    kind: "scheduled",
    host: "cloudflare_worker",
    cron: "*/5 * * * *",
    cadence: "Every 5 minutes (a heartbeat an hour)",
    expectedEveryMs: 60 * 60 * 1000,
    flagKey: "drive_export_enabled",
    canRunNow: false,
  },
  {
    id: "drive_queue",
    label: "Drive queue",
    description:
      "Lanes waiting to run: each one a connection's turn to send. A backlog that grows means sends are waiting behind each other longer than a slice.",
    kind: "derived",
    host: "cloudflare_worker",
    cron: null,
    cadence: "Read on every Drive sweep",
    expectedEveryMs: 0,
    flagKey: null,
    canRunNow: false,
    readFrom: ["drive_export"],
  },
  {
    id: "drive_dead_letters",
    label: "Drive dead letters",
    description:
      "Lanes that died on every retry. The connection they ran for pauses itself at three in a day (Resume on /admin/exports), so a dead letter is a bug worth reading, never a stalled send.",
    kind: "derived",
    host: "cloudflare_worker",
    cron: null,
    cadence: "Read on every Drive sweep",
    expectedEveryMs: 0,
    flagKey: null,
    canRunNow: false,
    readFrom: ["drive_export"],
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
      "Every lifecycle and operator email of the last day, every send that failed or was refused, and every one-time notice still waiting to send. A failed notice (an event removed, a grace opened, a plan reduced) is kept and retried by its sweep each night until it goes, and given up, said here, after 30 days.",
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
  {
    // help-center r1 `feedback=beacon`: the counts themselves are read at /admin/help-feedback.
    id: "help_feedback",
    label: "Help feedback",
    description:
      "Every Yes and No a reader leaves on a help article, counted at /admin/help-feedback. The reader sees the same thank-you whether the click was recorded or not, so a failing write is silent everywhere but here.",
    kind: "signal",
    host: "app",
    cron: null,
    cadence: "Rolling 24 hours",
    expectedEveryMs: 0,
    flagKey: null,
    canRunNow: false,
  },
  {
    // drive-wiring: what reached hosts' Drives, read at /admin/exports.
    id: "drive_transfer",
    label: "Sends to Google Drive",
    description:
      "Every file a send put in a host's Google Drive in the last day, and every one that failed for good, every original missing in R2, every dying lane, every refresh refused for a reason other than revocation, every duplicate a closing check counted, every breaker that tripped, and every send stuck an hour. The host sees her send's own place; nothing else would tell us.",
    kind: "signal",
    host: "app",
    cron: null,
    cadence: "Rolling 24 hours",
    expectedEveryMs: 0,
    flagKey: null,
    canRunNow: false,
  },
  {
    // `export-ends`: the Worker's own reports (export_log), read at /admin/exports.
    id: "export_delivery",
    label: "Album downloads",
    description:
      "Every Download all the Worker finished in the last day, every one that failed (a check the bucket could not answer, a zip an object read broke, a mint with nothing configured), and every one the Worker spoke of but never said how it ended, hours on. A guest sees a toast; nothing else would tell us.",
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

/**
 * Every health, in the operator's words: one home for the jobs console and any page that shows one job's
 * state beside its own work (`/admin/exports` shows its Worker's heartbeat and its downloads' signal).
 */
export const HEALTH_LABEL: Record<JobHealth, string> = {
  ok: "Healthy",
  running: "Running",
  paused: "Paused",
  missed: "Overdue",
  failed: "Last run failed",
  attention: "Needs a look",
  never: "No runs yet",
};

/** A signal job's "No activity" reads differently from a scheduled job's "No runs yet". */
export const NEVER_LABEL: Record<string, string> = {
  signal: "No activity",
  derived: "No reading",
};

/** One job's health as its card words it: a job that has never reported says so in its own kind's words. */
export function healthLabel(def: JobDef, health: JobHealth): string {
  return health === "never"
    ? (NEVER_LABEL[def.kind] ?? HEALTH_LABEL.never)
    : HEALTH_LABEL[health];
}

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
  /** The run's `counts` carried `STOPPED_EARLY_KEY`: it ran out of time with work left. */
  stoppedEarly?: boolean;
  /** The run's `counts` carried `BREAKER_TRIPPED_KEY`: the orphan breaker refused the delete. */
  breakerTripped?: boolean;
};

/** A `signal` job's rolling window: what succeeded, and what did not. */
export type JobSignal = {
  /** Successful work in the window (emails sent, limiter decisions taken). */
  ok24h: number;
  /** Failures in the window — the `job_runs` error rows this job wrote. */
  failed24h: number;
  /**
   * Work the path still owes past its grace (crumbs-75): a one-time notice kept for its retry, a download the Worker
   * spoke of but never said how it ended. Nothing has thrown, so it is not a failure; nothing is done either, so it
   * is never a calm reading. Absent where a signal owes nothing by construction.
   */
  owed?: number;
  /** When the oldest owed piece of work began owing (the first failure of the oldest kept notice), or null. */
  owedSinceMs?: number | null;
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
 * Work still OWED past its grace (a notice waiting to send, a download with no end) is `attention`
 * (crumbs-75): nothing failed in the window, which is exactly how it used to stay off the bell.
 * No activity at all is `never`, never `ok` — zero of everything is the calm-empty-page reading this
 * console exists to refuse, and the card prints both numbers so the operator can tell which it is.
 */
export function signalHealth(signal: JobSignal | null): JobHealth {
  if (!signal) return "never";
  if (signal.failed24h > 0) return "failed";
  if ((signal.owed ?? 0) > 0) return "attention";
  if (signal.ok24h > 0) return "ok";
  return "never";
}

/**
 * A `derived` job's verdict. The reading is only as good as the run that carried it, so an unwell
 * source WINS: a depth of zero read four days ago is not a healthy queue, it is no reading at all.
 * Any count on a zero-tolerance reading is a FAILURE (`ZERO_TOLERANCE_READINGS`: a dead letter, a key
 * the backup alone holds); a merely large live backlog is `attention`, because an upload burst queues
 * legitimately and the reconcile backstops it.
 */
export function readingHealth(
  def: JobDef,
  reading: JobReading | null,
): JobHealth {
  if (!reading) return "never";
  if (isUnhealthy(reading.sourceHealth)) return reading.sourceHealth;
  if (reading.value === null) return "never";
  if (ZERO_TOLERANCE_READINGS.includes(def.id)) {
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
  // A run that finished but ran out of time with work left: nothing failed, and the next run
  // resumes, but a backlog that outlasts a night is the thing this console exists to show.
  if (lastRun.stoppedEarly) return "attention";
  // A tripped orphan breaker closed its run `ok` on purpose (it deleted nothing, as designed) and
  // is still waiting on a human: the card says so rather than reading Healthy beside the email.
  if (lastRun.breakerTripped) return "attention";
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
