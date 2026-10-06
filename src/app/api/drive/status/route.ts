/**
 * WHERE HER SENDS STAND (`GET /api/drive/status`; drive-export.md, "What her page reads"): her connection and every
 * send that matters now (unfinished, closed in the last day, or a stop whose flag is still due), in one answer the
 * album's strip, the dashboard's lights, Take it home, Account and the app-wide flag all read. Polled only while
 * something is unfinished, at the beat `use-drive-status.ts` keeps.
 *
 * `getUser()`; her sends through her own session (RLS, the progress columns); her connection on the service role,
 * keyed on that id (the table is deny-all). `private, no-store`: it is hers alone.
 *
 * ★ A SEND SHE IS WATCHING THAT HAS NOT MOVED IN HALF AN HOUR raises `drive_stalled` (Sentry, once a send an instance):
 * with the Worker down there is no sweep to notice, and her open page is the one place that still can.
 *
 * ★ A SEND STOPPED A MOMENT AGO SAYS WHETHER IT IS STILL LANDING (`landing`): files already on their way at her Cancel
 * land after it, so while a lane holds any its numbers still move and her page keeps listening (the walk's strip froze
 * at 10 of 60 with 14 in her Drive). Asked only for sends canceled or stopped inside a lease's 15 minutes, so a page
 * with none asks nothing more.
 */
import { NextResponse } from "next/server";

import {
  readConnection,
  readLanding,
  readMySends,
  type SendRow,
} from "@/lib/db/queries/drive";
import { driveConfigured } from "@/lib/env";
import type { SendView } from "@/lib/drive/moments";
import { mayBeLanding, type DriveStatus } from "@/lib/drive/status";
import { captureWarning } from "@/lib/observability/sentry";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALLED_AFTER_MS = 30 * 60 * 1000;

/** Sends already reported stalled by this instance (a process's memory: once a send, never a storm). */
const stalledSaid = new Set<string>();

/** Is her stop's flag due? Set at a stop that needs her, and not yet shown by her app. */
function flagDue(row: SendRow): boolean {
  if (!row.attentionAt) return false;
  return (
    !row.attentionSeenAt ||
    Date.parse(row.attentionSeenAt) < Date.parse(row.attentionAt)
  );
}

function viewOf(row: SendRow, landing: ReadonlySet<string>): SendView {
  return {
    id: row.id,
    eventId: row.eventId,
    albumName: row.albumName,
    status: row.status,
    pauseReason: row.pauseReason,
    stopReason: row.stopReason,
    resumeAt: row.resumeAt,
    includeHidden: row.includeHidden,
    itemsTotal: row.itemsTotal,
    itemsSent: row.itemsSent,
    itemsKept: row.itemsKept,
    itemsSkipped: row.itemsSkipped,
    itemsFailed: row.itemsFailed,
    bytesTotal: row.bytesTotal,
    bytesSent: row.bytesSent,
    folderUrl: row.folderUrl,
    createdAt: row.createdAt,
    startedAt: row.startedAt,
    lastProgressAt: row.lastProgressAt,
    closedAt: row.closedAt,
    flagDue: flagDue(row),
    landing: landing.has(row.id),
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { ok: false, code: "unauthorized" },
      { status: 401 },
    );

  const nowMs = Date.now();
  const [connection, rows] = await Promise.all([
    readConnection(user.id),
    readMySends(nowMs),
  ]);
  const landing = await readLanding(
    rows.filter((r) => mayBeLanding(r, nowMs)).map((r) => r.id),
    nowMs,
  );
  const sends = rows.map((r) => viewOf(r, landing));

  for (const s of sends) {
    const moved = Date.parse(s.lastProgressAt ?? s.startedAt ?? s.createdAt);
    if (
      s.status === "sending" &&
      Number.isFinite(moved) &&
      nowMs - moved > STALLED_AFTER_MS &&
      !stalledSaid.has(s.id)
    ) {
      stalledSaid.add(s.id);
      captureWarning("export", "drive_stalled", {
        jobId: s.id,
        minutes: Math.round((nowMs - moved) / 60_000),
      });
    }
  }

  const status: DriveStatus = {
    configured: driveConfigured(),
    connection: connection
      ? {
          email: connection.email,
          status: connection.status,
          connectedAt: connection.createdAt,
          folderUrl: connection.rootFolderId
            ? `https://drive.google.com/drive/folders/${connection.rootFolderId}`
            : null,
          free:
            connection.quota.limit !== null && connection.quota.usage !== null
              ? Math.max(connection.quota.limit - connection.quota.usage, 0)
              : null,
        }
      : null,
    sends,
    now: new Date(nowMs).toISOString(),
  };
  return NextResponse.json(status, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
