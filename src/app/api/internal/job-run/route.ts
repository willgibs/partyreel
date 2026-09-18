/**
 * The job heartbeat + kill-switch endpoint (admin-portal P8, QA #15) — how a job that CANNOT reach
 * the database reports in. Two callers today: the Cloudflare media-backup Worker (reconcile + prune)
 * and the nightly DB-backup GitHub Action. The purge cron runs inside this app and writes the
 * heartbeat directly instead.
 *
 * Two phases, one route:
 *
 *   { phase: "start", job }   -> { ok, paused, runId, startedAtMs }
 *       Reads the job's `ops_flags` switch. Paused: this route writes the `skipped` row ITSELF and
 *       answers `paused: true`, so a paused job reports in even if the caller does nothing else.
 *       Running: opens a `running` row and hands back its id.
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
 * reaches a Cloudflare or GitHub job from here, because the app has no authenticated way to trigger
 * either one (see JOB_RUN_NOW_NOTE in the catalog).
 */
import { z } from "zod";

import {
  DEPTH_AGE_COUNT_KEYS,
  DEPTH_COUNT_KEYS,
  JOBS,
  QUEUE_BACKLOG_ATTENTION,
} from "@/app/admin/jobs/catalog";
import { constantTimeEquals } from "@/lib/crypto/constant-time";
import {
  finishJobRun,
  isJobEnabled,
  recordSkippedRun,
  startJobRun,
} from "@/lib/db/queries/jobs";
import { assertPruneApiEnv } from "@/lib/env";
import { captureError, captureWarning } from "@/lib/observability/sentry";

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
    });
  }

  // Alert BEFORE the write, so a depth reading still pages even if the heartbeat row cannot be
  // stored: the Cloudflare queue's state is the fact, and the row is only how the console shows it.
  alertOnDepths(job, body.counts);

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
