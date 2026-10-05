/**
 * HER STOPS THAT WAIT ON HER, for the host's bell (drive-export.md; notifications-analytics-growth.md "The host's
 * bell"): apart from `drive.ts` so the bell, which every host page's layout reads, pulls in nothing but this one read.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { mustQuery } from "@/lib/db/must-query";
import type { Database } from "@/lib/db/types";

/** A stop of hers the bell carries: the send, its album and why it waits on her (or `partly_done`). */
export type DriveStop = {
  jobId: string;
  eventId: string | null;
  albumName: string;
  reason: string;
};

/**
 * Alerts are state: a row stands while its stop does. Through the client the bell already holds (her session: RLS
 * scopes the rows, the column grant the fields): a pause only she can lift, or a send of the last month that ended
 * with files short. At most 10.
 */
export async function readMyDriveStops(
  client: SupabaseClient<Database>,
  nowMs: number = Date.now(),
): Promise<DriveStop[]> {
  const month = new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString();
  const rows = await mustQuery(
    client
      .from("cloud_exports")
      .select("id, event_id, album_name, status, pause_reason")
      .or(
        `and(status.eq.paused,pause_reason.in.(drive_full,disconnected,folder_gone,domain_policy)),and(status.eq.partly_done,closed_at.gte.${month})`,
      )
      .order("created_at", { ascending: false })
      .limit(10),
    "drive: her stops for the bell",
  );
  return (rows ?? [])
    .map((r) => ({
      jobId: r.id,
      eventId: r.event_id,
      albumName: r.album_name,
      reason:
        r.status === "partly_done" ? "partly_done" : (r.pause_reason ?? ""),
    }))
    .filter((stop) => stop.jobId !== "");
}
