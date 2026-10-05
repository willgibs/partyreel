/**
 * The job heartbeat + kill-switch endpoint (admin-portal P8, QA #15) — how a job that CANNOT reach
 * the database reports in. Two callers today: the Cloudflare media-backup Worker (reconcile + prune)
 * and the nightly DB-backup GitHub Action. The purge cron runs inside this app and writes the
 * heartbeat directly instead.
 *
 * Two phases, one route:
 *
 *   { phase: "start", job }   -> { ok, paused, runId, startedAtMs[, releasedAtMs] }
 *       Reads the job's `ops_flags` switch. Paused: this route writes the `skipped` row ITSELF and
 *       answers `paused: true`, so a paused job reports in even if the caller does nothing else.
 *       Running: opens a `running` row and hands back its id. For the backup prune it also carries
 *       `releasedAtMs`, the last "Release the hold" pressed on /admin/jobs (null for none): the Worker
 *       never lets a held backlog through by itself (the Advisor's Q20), and this is how a person does.
 *
 *   { phase: "finish", runId, startedAtMs, status, counts?, note? }  -> { ok }
 *       Closes the row with a duration and the job's own tallies.
 *
 * AUTH: `Authorization: Bearer $PRUNE_API_SECRET`, fail CLOSED (500 unset, 401 mismatch), timing-safe
 * — the same shared internal-jobs bearer the backup-prune confirm endpoint uses. Deliberately REUSED
 * rather than minting a second secret: both callers already hold it, a new value would need three
 * homes plus a Worker secret plus a GitHub secret, and the blast radius of this endpoint is strictly
 * smaller than the prune's (it writes observability rows and reads a boolean; it can neither delete
 * anything nor disclose user data). A dedicated JOB_API_SECRET would still be cleaner post-launch.
 *
 * Note what this route CANNOT do by design: it never starts a job. Pausing is the only control that
 * reaches a Cloudflare or GitHub job from here (see JOB_RUN_NOW_NOTE in the catalog); the one start the
 * app has, the backup restore's Restore now, goes to the Worker's own door instead (restore-now.ts).
 *
 * WHAT IT RAISES, where each report lands (the Worker reaches neither Sentry nor the mail): a dead letter
 * or a deep queue (a warning), a held prune (a warning and the ops mail), and the backup's lone copies
 * (`primary_missing`, from the prune's run or the restore's pass: a warning and the ops mail, once a day).
 */
import { z } from "zod";

import {
  BREAKER_TRIPPED_KEY,
  DEPTH_AGE_COUNT_KEYS,
  DEPTH_COUNT_KEYS,
  JOBS,
  QUEUE_BACKLOG_ATTENTION,
  jobById,
} from "@/app/admin/jobs/catalog";
import { readPruneHoldReleasedAtMs } from "@/app/admin/jobs/prune-hold";
import { ADMIN_HOST } from "@/lib/auth/admin-host";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/constants/site";
import { constantTimeEquals } from "@/lib/crypto/constant-time";
import {
  finishJobRun,
  isJobEnabled,
  recordSkippedRun,
  startJobRun,
} from "@/lib/db/queries/jobs";
import { sendOnce } from "@/lib/email/send";
import { pruneHoldEmail } from "@/lib/email/templates";
import { assertPruneApiEnv, serverEnv } from "@/lib/env";
import { captureError, captureWarning } from "@/lib/observability/sentry";

import { loneCopiesEmail } from "./lone-copies-mail";

// The service-role admin client requires the Node runtime; never edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jobId = z.enum(JOBS.map((j) => j.id) as [string, ...string[]]);

const startSchema = z.object({
  phase: z.literal("start"),
  job: jobId,
  triggeredBy: z.enum(["schedule", "manual"]).default("schedule"),
});

const finishSchema = z.object({
  phase: z.literal("finish"),
  job: jobId,
  runId: z.uuid(),
  startedAtMs: z.number().int().positive(),
  status: z.enum(["ok", "error", "skipped"]),
  // Free-form per-job tallies, and where the ADDITIVE Cloudflare depth keys ride (the Worker's
  // queue-metrics.ts writes `queue_backlog` / `dead_letter_backlog`; the catalog names them for the
  // reader). No new field was needed for them precisely because this has always been a free-form
  // record: an app deploy predating the Worker's stores them harmlessly, one postdating it reads
  // them. The key COUNT is capped so a runaway job cannot post an unbounded body.
  counts: z
    .record(z.string().max(64), z.union([z.number(), z.string(), z.boolean()]))
    .refine((c) => Object.keys(c).length <= 40, {
      message: "too many count keys",
    })
    .optional(),
  note: z.string().max(500).optional(),
});

const bodySchema = z.discriminatedUnion("phase", [startSchema, finishSchema]);

/**
 * THE DEAD-LETTER ALERT, raised where the reading arrives rather than a day later.
 *
 * The daily missed-run scan can only page on a job that stopped REPORTING; a dead letter is a job
 * reporting perfectly and saying something is wrong, which no freshness rule can catch. So the
 * moment a Worker run hands us a depth, this reads it: any dead letter at all is a warning (each one
 * is a media object with no backup copy until a reconcile sweep catches it), and a large live
 * backlog is a softer note (an upload burst queues legitimately). Numbers only — nothing here can
 * carry a key, an address or a token.
 */
function alertOnDepths(
  job: string,
  counts: Record<string, number | string | boolean> | undefined,
): void {
  if (!counts) return;
  const numberAt = (key: string): number | null => {
    const raw = counts[key];
    return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
  };

  const dead = numberAt(DEPTH_COUNT_KEYS.backup_dead_letters);
  if (dead !== null && dead > 0) {
    captureWarning("cron", "job_dead_letters_pending", {
      job,
      dead_letters: dead,
      oldest_minutes: numberAt(DEPTH_AGE_COUNT_KEYS.backup_dead_letters),
    });
  }

  const backlog = numberAt(DEPTH_COUNT_KEYS.backup_queue);
  if (backlog !== null && backlog >= QUEUE_BACKLOG_ATTENTION) {
    captureWarning("cron", "job_queue_backlog", {
      job,
      backlog,
      oldest_minutes: numberAt(DEPTH_AGE_COUNT_KEYS.backup_queue),
      threshold: QUEUE_BACKLOG_ATTENTION,
    });
  }
}

/** The one job a hold can stop, and so the one whose start answer carries a release. */
const HELD_JOB = "backup_prune";

/** A job's card on the jobs console, on the admin host where there is one. */
function jobsUrlFor(job: string): string {
  return ADMIN_HOST
    ? `https://${ADMIN_HOST}/admin/jobs#job-${job}`
    : `${SITE_URL}/admin/jobs#job-${job}`;
}

/**
 * The jobs whose reports carry the backup's lone copies: the catalog's reading names them (the prune and the
 * restore), so what raises and what the card reads can never part.
 */
const LONE_SOURCES: readonly string[] =
  jobById("backup_primary_missing")?.readFrom ?? [];

/**
 * THE BACKUP'S LONE COPIES, RAISED WHERE THE REPORT LANDS (durability-restore), as the dead letters and a held prune
 * raise theirs: a key held by the backup alone is a host's media with one copy left, and its card and the bell are
 * read only by someone already looking. Any count at all raises a Sentry warning, on every report that carries one
 * (the prune's weekly run, the restore's daily pass, its skipped one with the mode off included); the ops mail goes at
 * most once a day (deduplicated on the run's day across both jobs), so lone copies that stand are mailed each day
 * until they are copied back. Numbers only, the restore's mode and the run's own note. A mail that fails never costs
 * the run its row.
 */
async function alertOnLoneCopies(
  job: string,
  startedAtMs: number,
  counts: Record<string, number | string | boolean> | undefined,
  note: string | undefined,
): Promise<void> {
  if (!counts || !LONE_SOURCES.includes(job)) return;
  const raw = counts[DEPTH_COUNT_KEYS.backup_primary_missing];
  const keys = typeof raw === "number" && Number.isFinite(raw) ? raw : null;
  if (keys === null || keys <= 0) return;
  const restoreMode =
    typeof counts.restore_mode === "string" ? counts.restore_mode : null;
  captureWarning("cron", "backup_primary_missing", {
    job,
    keys,
    restore_mode: restoreMode,
  });
  try {
    const mail = loneCopiesEmail({
      keys,
      reportedBy: jobById(job)?.label ?? job,
      restoreMode,
      runNote: note ?? null,
      jobsUrl: jobsUrlFor("backup_restore"),
    });
    await sendOnce({
      kind: "prune_breaker",
      dedupeKey: `lone:${new Date(startedAtMs).toISOString().slice(0, 10)}`,
      to: serverEnv.CONTACT_NOTIFY_EMAIL ?? SUPPORT_EMAIL,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  } catch (e) {
    captureError("cron", e, { job, phase: "lone_alert" });
  }
}

/**
 * The last "Release the hold" pressed, for the prune's start answer. An unreadable stamp reads as none, and says
 * so: a release that cannot be read leaves the hold standing (the safe side, a week of backup storage), never a
 * failed start, which would skip the whole run.
 */
async function releaseStamp(job: string): Promise<number | null> {
  try {
    return await readPruneHoldReleasedAtMs();
  } catch (e) {
    captureWarning("cron", "prune_hold_release_unreadable", {
      job,
      error: String(e).slice(0, 300),
    });
    return null;
  }
}

/**
 * THE HELD PRUNE'S ALERT, raised where the report arrives (the Advisor's Q20), like the dead letters above: the
 * Worker cannot reach Sentry or the mail, and a hold waits for a person, so the person is told. A Sentry warning on
 * every held run, and the ops mail once a run (deduplicated on the run's day, so a retried report never mails twice;
 * a hold that stands is mailed again each week until someone releases or pauses it). Numbers only, and the run's
 * own note. A mail that fails never costs the run its row.
 */
async function alertOnHold(
  job: string,
  startedAtMs: number,
  counts: Record<string, number | string | boolean> | undefined,
  note: string | undefined,
): Promise<void> {
  if (job !== HELD_JOB || counts?.[BREAKER_TRIPPED_KEY] !== true) return;
  const numberAt = (key: string): number | null => {
    const raw = counts[key];
    return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
  };
  const heldMedia = numberAt("gone_media");
  const heldKeys = numberAt("remaining");
  const threshold = numberAt("hold_threshold");
  captureWarning("cron", "backup_prune_held", {
    job,
    held_media: heldMedia,
    held_keys: heldKeys,
    hold_threshold: threshold,
  });
  try {
    const mail = pruneHoldEmail({
      heldMedia,
      heldKeys,
      threshold,
      runNote: note ?? null,
      jobsUrl: jobsUrlFor(HELD_JOB),
    });
    await sendOnce({
      kind: "prune_breaker",
      dedupeKey: `hold:${new Date(startedAtMs).toISOString().slice(0, 10)}`,
      to: serverEnv.CONTACT_NOTIFY_EMAIL ?? SUPPORT_EMAIL,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  } catch (e) {
    captureError("cron", e, { job, phase: "hold_alert" });
  }
}

export async function POST(request: Request): Promise<Response> {
  let secret: string;
  try {
    secret = assertPruneApiEnv().PRUNE_API_SECRET;
  } catch {
    // Fail closed. An unauthenticated caller could otherwise forge heartbeats, which would mask a
    // genuinely dead job behind a healthy-looking /admin/jobs.
    return new Response("Job API not configured", { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!constantTimeEquals(authHeader, `Bearer ${secret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // The job ids are validated against the catalog above, so these casts are the enum round-trip.
  const job = body.job as (typeof JOBS)[number]["id"];

  if (body.phase === "start") {
    // Only a SCHEDULED job has a run to open. A `signal` entry owns nothing but closed failure rows
    // and a `derived` one owns no rows at all, so a start against either would leave a `running` row
    // that nothing will ever close — which the console would eventually read as a stuck job. Found
    // by pointing the endpoint at its own new job ids.
    if (jobById(job)?.kind !== "scheduled") {
      return new Response("Not a scheduled job", { status: 400 });
    }

    let enabled: boolean;
    try {
      enabled = await isJobEnabled(job);
    } catch (e) {
      // The switch is unreadable. Say so and let the caller decide: the reconcile runs anyway (not
      // backing up is the bigger risk), the prune refuses (it deletes from the last-resort copy).
      captureError("cron", e, { job, phase: "flag_read" });
      return Response.json(
        { ok: false, code: "flag_unavailable" },
        { status: 503 },
      );
    }

    if (!enabled) {
      const skip = await recordSkippedRun(
        job,
        body.triggeredBy,
        "Paused from /admin/jobs.",
      );
      if (skip.heartbeatError) {
        captureWarning("cron", "job_heartbeat_write_failed", {
          job,
          phase: "skip",
          error: skip.heartbeatError,
        });
      }
      return Response.json({ ok: true, paused: true });
    }

    const run = await startJobRun(job, body.triggeredBy);
    if (run.heartbeatError) {
      captureWarning("cron", "job_heartbeat_write_failed", {
        job,
        phase: "start",
        error: run.heartbeatError,
      });
    }
    return Response.json({
      ok: true,
      paused: false,
      runId: run.runId,
      startedAtMs: run.startedAtMs,
      ...(job === HELD_JOB ? { releasedAtMs: await releaseStamp(job) } : {}),
    });
  }

  // Alert BEFORE the write, so a depth reading, a hold or a lone copy still pages even if the heartbeat
  // row cannot be stored: the Cloudflare queue's state, the hold and the backup's lone copies are the
  // facts; the row is how the console shows them.
  alertOnDepths(job, body.counts);
  await alertOnHold(job, body.startedAtMs, body.counts, body.note);
  await alertOnLoneCopies(job, body.startedAtMs, body.counts, body.note);

  const done = await finishJobRun(
    { runId: body.runId, startedAtMs: body.startedAtMs, heartbeatError: null },
    { status: body.status, counts: body.counts ?? null, note: body.note },
  );
  if (done.heartbeatError) {
    captureWarning("cron", "job_heartbeat_write_failed", {
      job,
      phase: "finish",
      error: done.heartbeatError,
    });
  }
  return Response.json({ ok: true });
}
