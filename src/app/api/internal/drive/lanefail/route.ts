/**
 * A LANE THAT DIED (`POST /api/internal/drive/lanefail`): a lane's last attempt says so before it throws, with or
 * without a lease. `cloud_connection_lane_failed` counts the connection's dead lanes for the day, and at three its
 * sends pause `failing` (an operator's Resume on /admin/exports): a poison connection pauses itself and never loops.
 * Every one is a `drive_transfer` failure: a lane that dies is a bug worth reading.
 */
import { internalJson, readDriveWord } from "@/lib/drive/internal.server";
import { laneFailWordSchema } from "@/lib/drive/protocol";
import { recordLaneFailed } from "@/lib/db/queries/drive";
import { recordSignalFailure } from "@/lib/jobs/failure-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const read = await readDriveWord(request, laneFailWordSchema, "lanefail");
  if (!read.ok) return read.response;
  const { connectionId, error } = read.word;
  try {
    const r = await recordLaneFailed(connectionId, error);
    await recordSignalFailure({
      job: "drive_transfer",
      area: "export",
      operation: r.paused > 0 ? "a lane died a third time today: its connection paused" : "a lane died",
      error: new Error(error),
      extra: { connectionId, failures: r.failures },
    });
    return internalJson({ ok: true, failures: r.failures, paused: r.paused > 0 });
  } catch (e) {
    await recordSignalFailure({ job: "drive_transfer", area: "export", operation: "lane failure", error: e });
    return internalJson({ ok: false }, 500);
  }
}
