"use server";

/**
 * THE LIVE WALL'S ONE READ (host-dashboard r1, `arrivals=live`, Will 2026-10-02: "if we simple display
 * the featured event with that type of gallery preview to see what's happening, think that's a perfect
 * direction"). On a party's own day its newest photographs land on the stage as they arrive: the stage
 * listens on the album's doorbell (`useGalleryDoorbell`, the ping the album's own trigger sends when an
 * approved photograph lands) and asks this for the wall and the numbers that move with it.
 *
 * ★ NEVER A PAGE REFRESH. A `router.refresh()` per ping re-runs the whole dashboard (every event's
 * covers presigned again) for one photograph, the lag the hub's album already left behind
 * (`host-album.tsx`). This reads one event: its newest nine, its counts, who waits at its door, and
 * the last hour's arrivals.
 *
 * ★ A SERVER FUNCTION IS A PUBLIC ENDPOINT, so the id is the caller's word: `getEvent` proves it is the
 * signed-in host's own live event (RLS, `events_host_all`; a malformed id is never read), and the door
 * is read on the service role only after that proof, as the hub reads it. Anyone else gets null, the
 * same answer as an event that is gone.
 */
import { countArrivalsSince, getStagePhotos } from "@/lib/db/queries/dashboard";
import { getDoorCounts } from "@/lib/db/queries/event-doors";
import { getEvent, getEventCardStats } from "@/lib/db/queries/events";
import { captureError } from "@/lib/observability/sentry";

import { type StagePhoto, WALL_PHOTOS } from "./stage";

const HOUR_MS = 60 * 60 * 1000;

export type StageLive = {
  photos: StagePhoto[];
  /** In the album (approved). */
  approved: number;
  /** Waiting on review. */
  pending: number;
  /** People at the door. */
  waiting: number;
  /** Approved arrivals in the last hour. */
  lastHour: number;
};

export async function readStageLiveAction(
  eventId: unknown,
): Promise<StageLive | null> {
  if (typeof eventId !== "string") return null;
  try {
    const event = await getEvent(eventId);
    if (!event) return null;
    const hourAgo = new Date(Date.now() - HOUR_MS).toISOString();
    const [photos, stats, door, lastHour] = await Promise.all([
      getStagePhotos(event.id, WALL_PHOTOS),
      getEventCardStats([event.id]),
      getDoorCounts(event.id),
      countArrivalsSince(event.id, hourAgo),
    ]);
    const counts = stats.get(event.id) ?? { approved: 0, pending: 0 };
    return {
      photos,
      approved: counts.approved,
      pending: counts.pending,
      waiting: door.waiting,
      lastHour,
    };
  } catch (error) {
    // The wall keeps what it shows: a failed read costs one refresh, never the stage, and says so
    // where failures are read.
    captureError("db", error, { seam: "dashboard_stage_live" });
    return null;
  }
}
