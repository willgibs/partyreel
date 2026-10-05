/**
 * THE SWEEP (`POST /api/internal/drive/sweep`, the Worker's cron every 5 minutes; drive-export.md): the backstop of
 * every kick. `cloud_export_sweep` answers which connections to kick (and how many lanes each, already stamped), and
 * does in SQL what time alone decides: a pause whose time came, what ran too long, what stuck, the breakers, the
 * connections failing or near a grant's end. The Worker enqueues the lanes this answers.
 *
 * After the answer, what needs a person or Google: a full Drive asked again (and resumed on room), the reconnect
 * mails, the stopped mails, the done mail (an hour's finished sends folded into one), the breakers and the stuck in
 * the `drive_transfer` signal, and once an hour the heartbeat (`drive_sweep` on /admin/jobs) with the Worker's queue
 * depths, so a Worker whose secret drifted, or whose cron stopped, reads Overdue.
 */
import { after } from "next/server";

import { driveRoom } from "@/lib/drive/google";
import { internalJson, readDriveWord } from "@/lib/drive/internal.server";
import { notifyDone, notifyReconnect, notifyStopped } from "@/lib/drive/mail.server";
import { sweepWordSchema, type SweepAnswer } from "@/lib/drive/protocol";
import { accessTokenFor, kickConnection } from "@/lib/drive/service.server";
import {
  lastSweepHeartbeatAt,
  markMailed,
  recordRoom,
  sweepSends,
  type SweepOutcome,
} from "@/lib/db/queries/drive";
import { recordClosedRun } from "@/lib/db/queries/jobs";
import { recordSignalFailure } from "@/lib/jobs/failure-log";
import { captureError } from "@/lib/observability/sentry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** The heartbeat's cadence: one row an hour, though the sweep runs every five minutes. */
const HEARTBEAT_EVERY_MS = 55 * 60 * 1000;

async function followUp(outcome: SweepOutcome, word: { mode: "on" | "off"; depths: Record<string, number> }) {
  // A full Drive, asked again: room for what is left resumes its sends, kicked at once.
  for (const connectionId of outcome.recheck) {
    try {
      const access = await accessTokenFor(connectionId);
      if (!access.ok) continue;
      const room = await driveRoom(access.token);
      const r = await recordRoom({ connectionId, limit: room.limit, usage: room.usage, resume: true });
      if (r.resumed > 0) await kickConnection(connectionId);
    } catch (e) {
      captureError("export", e, { action: "drive_recheck_room", connectionId });
    }
  }
  for (const c of outcome.reconnect) {
    await notifyReconnect({
      connectionId: c.connectionId,
      userId: c.userId,
      why: c.why === "grant_ending" ? "grant_ending" : "failing",
    });
  }
  for (const e of outcome.expired) await notifyStopped(e.jobId);
  for (const d of outcome.doneMail) {
    const named = await notifyDone(d.userId, d.sends);
    await markMailed(named).catch((e) => captureError("export", e, { action: "drive_mark_mailed" }));
  }
  for (const b of outcome.breakers) {
    await recordSignalFailure({
      job: "drive_transfer",
      area: "export",
      operation: "an account breaker tripped: its sends paused (Lift on /admin/exports)",
      error: new Error("drive breaker"),
      extra: { userId: b.userId, sent30: b.sent30 },
    });
  }
  if (outcome.stuck > 0) {
    await recordSignalFailure({
      job: "drive_transfer",
      area: "export",
      operation: "sends stuck an hour with work and no progress",
      error: new Error("drive stuck"),
      extra: { stuck: outcome.stuck },
    });
  }

  // The heartbeat, once an hour, with the Worker's own readings.
  const last = await lastSweepHeartbeatAt().catch(() => null);
  if (last === null || Date.now() - last >= HEARTBEAT_EVERY_MS) {
    await recordClosedRun("drive_sweep", "schedule", {
      status: "ok",
      counts: {
        ...word.depths,
        kicked: outcome.kick.length,
        resumed: outcome.resumed,
        stuck: outcome.stuck,
        expired: outcome.expired.length,
        breakers: outcome.breakers.length,
      },
      note: word.mode === "off" ? "The Worker is switched off (DRIVE_MODE): it sweeps and sends nothing." : undefined,
    });
  }
}

export async function POST(request: Request) {
  const read = await readDriveWord(request, sweepWordSchema, "sweep");
  if (!read.ok) return read.response;
  const word = read.word;

  let outcome: SweepOutcome;
  try {
    outcome = await sweepSends();
  } catch (e) {
    await recordSignalFailure({ job: "drive_transfer", area: "export", operation: "sweep", error: e });
    return internalJson({ ok: false, code: "sweep_failed" }, 500);
  }

  after(() => followUp(outcome, word).catch((e) => captureError("export", e, { action: "drive_sweep_follow_up" })));
  // A Worker switched off sends nothing, so it is handed no lanes (the SQL stamped their kick; the next sweep after
  // it is switched back on kicks again).
  const answer: SweepAnswer = { kick: word.mode === "off" ? [] : outcome.kick.filter((k) => k.lanes > 0) };
  return internalJson(answer);
}
