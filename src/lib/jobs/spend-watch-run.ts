/**
 * THE SPEND WATCH'S RUN (admin-observability.md, "The spend watch"): read every counter, judge each against ten times
 * the week's busiest (never under its floor), pause what a new trip may pause, alert on any trip, and report through
 * `job_runs` like every job. The rules are pure (`spend-watch.ts`); this file only reads, writes and tells.
 *
 * NEVER THROWS, NEVER SILENT: each read that fails becomes a reading that says why (the run then closes as an error,
 * so the card reads "Last run failed" rather than a calm night), and each write that fails is captured and named in
 * the run's note. Heartbeat writes degrade like every job's (the caller is told, Sentry hears).
 *
 * ★ ITS OWN SWITCH FAILS TO THE MIDDLE: paused, it logs a skipped run; unreadable, it still reads and alerts but
 * pauses nothing, so neither a broken read nor an operator's pause it could not see is overridden.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { jobById, jobHealth } from "@/app/admin/jobs/catalog";
import { ADMIN_HOST } from "@/lib/auth/admin-host";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/constants/site";
import { mustQuery } from "@/lib/db/must-query";
import {
  finishJobRun,
  getJobFlags,
  recordSkippedRun,
  startJobRun,
  type JobTrigger,
} from "@/lib/db/queries/jobs";
import type { Json } from "@/lib/db/types";
import { sendOnce } from "@/lib/email/send";
import { spendWatchEmail } from "@/lib/email/templates";
import { serverEnv } from "@/lib/env";
import {
  BASIS_WORDS,
  LIFECYCLE_MAIL_KINDS,
  SWITCH_LABEL,
  TRAILING_MS,
  baselineRun,
  carryPaused,
  formatAmount,
  formatReading,
  judgeAll,
  parseDbReadings,
  parseStoredRun,
  planActions,
  readingById,
  runCounts,
  takeReadings,
  type DbReadings,
  type ReadingId,
  type StoredRun,
  type SwitchKey,
  type SwitchStates,
  type Verdict,
} from "@/lib/jobs/spend-watch";
import { readResendDay } from "@/lib/jobs/spend-watch-resend";
import { pauseSwitch, readSwitches } from "@/lib/jobs/spend-watch-switches";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: `spend_watch_readings` arrives with migration 20261003190000, so the
 * call that names it goes through this untyped client (drop the cast then).
 */
function untyped(admin: AdminClient): SupabaseClient {
  return admin as unknown as SupabaseClient;
}

/** A heartbeat write that did not land: never fatal, never silent (the purge cron's rule). */
function reportHeartbeat(error: string | null, phase: string): void {
  if (!error) return;
  captureWarning("cron", "job_heartbeat_write_failed", {
    job: "spend_watch",
    phase,
    error,
  });
}

/**
 * The watch's own runs over the trailing week and a day, newest first, each read back by `parseStoredRun`. An hourly
 * watch keeps about 190 of them; a Run now storm past 500 loses only the oldest points of the week. THROWS.
 */
export async function readWatchHistory(
  admin: AdminClient,
  nowMs: number,
): Promise<StoredRun[]> {
  const rows = await mustQuery(
    admin
      .from("job_runs")
      .select("started_at, counts")
      .eq("job", "spend_watch")
      .in("status", ["ok", "error"])
      .gte("started_at", new Date(nowMs - TRAILING_MS - DAY_MS).toISOString())
      .order("started_at", { ascending: false })
      .limit(500),
    "spend watch: its own history",
  );
  const out: StoredRun[] = [];
  for (const row of rows ?? []) {
    const parsed = parseStoredRun(row.counts, Date.parse(row.started_at));
    if (parsed) out.push(parsed);
  }
  return out;
}

/** The newest run that took readings, for the console's card (the newest of all may be a pause's skipped row). */
export async function readLatestWatchRun(): Promise<{
  run: StoredRun;
  startedAt: string;
  status: string;
} | null> {
  const row = await mustQuery(
    createAdminClient()
      .from("job_runs")
      .select("started_at, status, counts")
      .eq("job", "spend_watch")
      .in("status", ["ok", "error"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "admin/jobs: the spend watch's last readings",
  );
  if (!row) return null;
  const run = parseStoredRun(row.counts, Date.parse(row.started_at));
  return run ? { run, startedAt: row.started_at, status: row.status } : null;
}

/** Read the counters in one call. A failed call is every DB reading missing, with the database's own words. */
async function readDb(
  admin: AdminClient,
  now: Date,
): Promise<{ db: DbReadings | null; error?: string }> {
  try {
    const { data, error } = await untyped(admin).rpc("spend_watch_readings", {
      p_now: now.toISOString(),
      p_lifecycle_kinds: [...LIFECYCLE_MAIL_KINDS],
    });
    if (error) return { db: null, error: error.message };
    return { db: parseDbReadings(data) };
  } catch (e) {
    return { db: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * WHO WATCHES THE WATCHMAN. The purge cron carries the freshness scan for every job, so the one job whose silence it
 * cannot see is its own: the watch, the only other scheduled app-side code, asks for it, in the scan's own words (one
 * Sentry issue either way). A failed read is said, never taken for a fresh run.
 */
async function checkPurgeFreshness(
  admin: AdminClient,
  nowMs: number,
  purgeEnabled: boolean,
): Promise<void> {
  const def = jobById("purge_cron");
  if (!def) return;
  try {
    const last = await mustQuery(
      admin
        .from("job_runs")
        .select("status, started_at, finished_at")
        .eq("job", "purge_cron")
        .not("finished_at", "is", null)
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      "spend watch: the purge's last finish",
    );
    if (!last?.finished_at) return;
    const lastFinishedAtMs = Date.parse(last.finished_at);
    const health = jobHealth({
      def,
      enabled: purgeEnabled,
      lastRun: {
        status: last.status as "ok" | "error" | "skipped",
        startedAtMs: Date.parse(last.started_at),
        finishedAtMs: lastFinishedAtMs,
      },
      lastFinishedAtMs,
      nowMs,
    });
    if (health !== "missed") return;
    captureWarning("cron", "job_missed_run", {
      job: def.id,
      cadence: def.cadence,
      host: def.host,
      last_finished_at: last.finished_at,
      last_status: last.status,
      seen_by: "spend_watch",
    });
  } catch (e) {
    captureError("cron", e, { job: "spend_watch", phase: "purge_freshness" });
  }
}

/** The portal's spend watch card, on the admin host where one is configured. */
function jobsUrl(): string {
  return ADMIN_HOST
    ? `https://${ADMIN_HOST}/admin/jobs#job-spend_watch`
    : `${SITE_URL}/admin/jobs#job-spend_watch`;
}

function readingWords(v: Verdict): {
  label: string;
  reading: string;
  ceiling: string;
} {
  const def = readingById(v.id);
  if (!def || v.value === null) {
    return { label: v.id, reading: "no reading", ceiling: String(v.ceiling) };
  }
  return {
    label: def.label,
    reading: `${v.atLeast ? "at least " : ""}${formatReading(def, v.value)}`,
    ceiling: `${formatAmount(def, v.ceiling)}, ${BASIS_WORDS[v.basis]}`,
  };
}

/**
 * THE ALERT: one Sentry error every run that trips (it groups by the readings), and the ops mail at most once a day
 * per set of readings (`sendOnce`'s claim). A mail that fails is captured, never a reason to undo a pause.
 */
async function alert(input: {
  now: Date;
  tripped: Verdict[];
  paused: SwitchKey[];
  offered: SwitchKey[];
  failed: SwitchKey[];
}): Promise<void> {
  const ids = input.tripped.map((v) => v.id).sort();
  captureError("cron", new Error(`spend watch tripped: ${ids.join(", ")}`), {
    job: "spend_watch",
    readings: Object.fromEntries(
      input.tripped.map((v) => [
        v.id,
        { value: v.value, ceiling: v.ceiling, basis: v.basis },
      ]),
    ),
    paused: input.paused,
    offered: input.offered,
    failed: input.failed,
  });
  try {
    const mail = spendWatchEmail({
      tripped: input.tripped.map(readingWords),
      paused: input.paused.map((k) => SWITCH_LABEL[k]),
      offered: input.offered.map((k) => SWITCH_LABEL[k]),
      failed: input.failed.map((k) => SWITCH_LABEL[k]),
      jobsUrl: jobsUrl(),
    });
    await sendOnce({
      kind: "spend_watch",
      dedupeKey: `${ids.join("+")}:${input.now.toISOString().slice(0, 10)}`,
      to: serverEnv.CONTACT_NOTIFY_EMAIL ?? SUPPORT_EMAIL,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  } catch (e) {
    captureError("cron", e, { job: "spend_watch", phase: "alert_mail" });
  }
}

export type WatchOutcome = {
  status: "ok" | "error" | "skipped";
  tripped: ReadingId[];
  missing: ReadingId[];
  paused: SwitchKey[];
  offered: SwitchKey[];
  note: string | null;
};

/** The run's one line on the card: what tripped and what was done, then what could not be read. */
function noteFor(input: {
  verdicts: Verdict[];
  paused: SwitchKey[];
  offered: SwitchKey[];
  failed: SwitchKey[];
  extra: string[];
}): string | null {
  const parts: string[] = [];
  const label = (id: ReadingId) => readingById(id)?.label ?? id;
  const tripped = input.verdicts.filter((v) => v.state === "tripped");
  if (tripped.length > 0) {
    parts.push(
      `Past the ceiling: ${tripped.map((v) => label(v.id)).join(", ")}.`,
    );
  }
  if (input.paused.length > 0) {
    parts.push(
      `Paused: ${input.paused.map((k) => SWITCH_LABEL[k]).join(", ")}.`,
    );
  }
  if (input.offered.length > 0) {
    parts.push(
      `Left for you: ${input.offered.map((k) => SWITCH_LABEL[k]).join(", ")}.`,
    );
  }
  if (input.failed.length > 0) {
    parts.push(
      `Could not pause: ${input.failed.map((k) => SWITCH_LABEL[k]).join(", ")}.`,
    );
  }
  const missing = input.verdicts.filter((v) => v.state === "missing");
  if (missing.length > 0) {
    parts.push(`No reading: ${missing.map((v) => label(v.id)).join(", ")}.`);
  }
  parts.push(...input.extra);
  return parts.length > 0 ? parts.join(" ").slice(0, 500) : null;
}

export async function runSpendWatch(opts: {
  trigger: JobTrigger;
  now?: Date;
}): Promise<WatchOutcome> {
  const now = opts.now ?? new Date();
  const nowMs = now.getTime();
  const extra: string[] = [];

  // 1. Its own switch: paused logs a skipped run; unreadable reads and alerts, pausing nothing.
  let mayPause = true;
  let purgeEnabled = true;
  try {
    const flags = await getJobFlags();
    purgeEnabled = flags.purge_cron;
    if (!flags.spend_watch) {
      const skip = await recordSkippedRun(
        "spend_watch",
        opts.trigger,
        "Paused from /admin/jobs.",
      );
      reportHeartbeat(skip.heartbeatError, "skip");
      return {
        status: "skipped",
        tripped: [],
        missing: [],
        paused: [],
        offered: [],
        note: "Paused from /admin/jobs.",
      };
    }
  } catch (e) {
    captureError("cron", e, { job: "spend_watch", phase: "flag_read" });
    mayPause = false;
    extra.push("Its switch could not be read, so it paused nothing.");
  }

  const run = await startJobRun("spend_watch", opts.trigger);
  reportHeartbeat(run.heartbeatError, "start");
  const admin = createAdminClient();

  // 2. Its own week: the ceilings' peaks, the counters' baseline, and whether a trip is new.
  let history: StoredRun[] = [];
  let historyRead = true;
  try {
    history = await readWatchHistory(admin, nowMs);
  } catch (e) {
    historyRead = false;
    captureError("cron", e, { job: "spend_watch", phase: "history" });
    extra.push(
      "Its history could not be read: every ceiling fell to its floor.",
    );
  }
  const baseline = baselineRun(history, nowMs);
  const previous =
    history
      .filter((r) => r.readAtMs < nowMs)
      .sort((a, b) => b.readAtMs - a.readAtMs)[0] ?? null;

  // 3. The readings: our tables in one call, Resend's own list beside it.
  const [{ db, error: dbError }, resend] = await Promise.all([
    readDb(admin, now),
    readResendDay(nowMs),
  ]);
  const verdicts = judgeAll(
    takeReadings({ nowMs, db, dbError, resend, baseline }),
    history,
    nowMs,
  );

  // 4. The switches, and what the trips do to them.
  let switches: SwitchStates | null = null;
  try {
    switches = await readSwitches();
  } catch (e) {
    captureError("cron", e, { job: "spend_watch", phase: "switches" });
    extra.push("The switches could not be read, so nothing was paused.");
  }
  const plan = planActions({ verdicts, previous, switches, mayPause });
  const justPaused: Partial<Record<SwitchKey, string>> = {};
  const failed: SwitchKey[] = [];
  for (const key of plan.pause) {
    try {
      const at = await pauseSwitch(key, now);
      if (at) justPaused[key] = at;
    } catch (e) {
      failed.push(key);
      captureError("cron", e, {
        job: "spend_watch",
        phase: "pause",
        switch: key,
      });
    }
  }
  const pausedNow = Object.keys(justPaused) as SwitchKey[];
  const pausedAt = carryPaused({ history, switches, justPaused });

  // 5. The purge's own silence, which nothing else would page on.
  await checkPurgeFreshness(admin, nowMs, purgeEnabled);

  // 6. Tell.
  const tripped = verdicts.filter((v) => v.state === "tripped");
  if (tripped.length > 0) {
    await alert({
      now,
      tripped,
      paused: pausedNow,
      offered: plan.offer,
      failed,
    });
  }

  // 7. Close the run. A reading that could not be taken, a pause that could not be written or a week that could not
  // be read fails the run: the card must never read healthy over a reading it did not take.
  const missing = verdicts.filter((v) => v.state === "missing");
  const status =
    missing.length > 0 || failed.length > 0 || !historyRead ? "error" : "ok";
  const note = noteFor({
    verdicts,
    paused: pausedNow,
    offered: plan.offer,
    failed,
    extra,
  });
  const counts = runCounts({
    nowMs,
    baseline,
    verdicts,
    snap: {
      ...(db?.ledger ? { ledger: db.ledger } : {}),
      ...(db?.album !== undefined ? { album: db.album } : {}),
    },
    pausedAt,
  });
  const done = await finishJobRun(run, {
    status,
    counts: counts as Json,
    ...(note ? { note } : {}),
  });
  reportHeartbeat(done.heartbeatError, "finish");

  return {
    status,
    tripped: tripped.map((v) => v.id),
    missing: missing.map((v) => v.id),
    paused: pausedNow,
    offered: plan.offer,
    note,
  };
}
