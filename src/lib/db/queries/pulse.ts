/**
 * THE PULSE'S OWN READS: the photographs that just arrived and the newest few per
 * event for the row view. (Whether each event's live reel plays yet is an event
 * fact, `getReelProgress` in `events.ts`, which the old reel route reads too.)
 *
 * ★ ITS OWN FILE RATHER THAN MORE EXPORTS ON `events.ts`: these reads are the
 * home's alone, while `events.ts` holds the event rows every host page reads, so
 * the home can change shape without touching them.
 *
 * Everything here is RLS-scoped: `media_host_all` and `events_host_all` already
 * limit these tables to the signed-in host's own events, and we re-validate the user with `getRequestAuth()` (the
 * request-cached `getUser()`) before reading, because the proxy is not a
 * security boundary. Each read ALSO names the host through `events!inner`
 * (the 1,000-row round, 2026-09-23): a parent filter, where the old reads put
 * every event id in one URL, which grows with the host's events and fails
 * outright long before PostgREST's row cap.
 *
 * ★ KEYS NEVER REACH THE BROWSER. Every tile is presigned here, server-side,
 * exactly once: `preview_key ?? original_key`, the same choice
 * `getEventCoverUrls` makes. One presign per tile rather than the three
 * `toGridItems` does, because these strips are a GLANCE — no lightbox, no
 * download button, so a download URL and a separate preview URL would be two
 * signatures minted per tile for nothing. A phone opening the home would pay
 * for all of them.
 */
import "server-only";

import { cache } from "react";

import {
  ARRIVALS_TARGET,
  arrivalWindowStarts,
  type ArrivalWindow,
  describeArrivals,
  pickArrivalWindow,
} from "@/lib/dashboard/arrivals";
import { mustCount, mustQuery } from "@/lib/db/must-query";
import { inChunks } from "@/lib/db/read-all";
import { presignDownload } from "@/lib/r2/presign";
import { getRequestAuth } from "@/lib/supabase/request-auth";

/** A tile in a strip: what `MediaTile` needs and nothing else. */
export type PulseTile = {
  id: string;
  type: "photo" | "video";
  /** A short-lived presigned URL. Never a raw R2 key. */
  url: string;
};

export type Pulse = {
  arrivals: PulseTile[];
  /** Which window the strip settled on, for the band's own honesty. */
  window: ArrivalWindow;
  /** The line beside the heading ("12 in the last hour", "Newest, 3 days ago"). */
  caption: string;
  /** Up to four newest per event, for the row view's strip. */
  newestByEvent: Map<string, PulseTile[]>;
};

/** Up to four sit beside the name in a row (the board's ruled shape). */
const NEWEST_PER_EVENT = 4;

/**
 * THE HOME'S PULSE, in four reads at once, none of which can be clipped:
 *
 *   - the strip: the newest twelve approved uploads across the host's live
 *     events (the strip's own size, `ARRIVALS_TARGET`, is the bound);
 *   - the window's two numbers, "N in the last hour" and "N today", as HEAD
 *     counts over the same set. They used to be counted over the newest 240
 *     rows, so neither could ever say more than 240;
 *   - each event's newest four for the row view, one row per EVENT with its four
 *     embedded: every event gets its strip, where the old read took them from the
 *     same 240 rows and an event outside them got none.
 *
 * Approved only: a pending upload belongs in the review queue, which is band
 * one's job. Showing it here would tell the host it is already in the album.
 */
export const getPulse = cache(async function getPulse(
  eventIds: string[],
  now: number,
  startOfToday: number,
): Promise<Pulse> {
  const empty: Pulse = {
    arrivals: [],
    window: "recent",
    caption: "Nothing yet",
    newestByEvent: new Map(),
  };
  if (eventIds.length === 0) return empty;

  const { supabase, user } = await getRequestAuth();
  if (!user) return empty;

  const starts = arrivalWindowStarts(now, startOfToday);
  // The one set every read here counts or shows: approved, not in the bin, in one of the host's
  // live events. Spelled once, as a function, because a supabase-js builder mutates in place.
  const arrivalsSince = (since: string, label: string) =>
    mustCount(
      supabase
        .from("media")
        .select("id, events!media_event_id_fkey!inner(host_id, deleted_at)", {
          count: "exact",
          head: true,
        })
        .eq("events.host_id", user.id)
        .is("events.deleted_at", null)
        .eq("status", "approved")
        .is("removed_at", null)
        .gte("created_at", since),
      label,
    );

  const [arrivalRead, inHour, inToday, eventStrips] = await Promise.all([
    mustQuery(
      supabase
        .from("media")
        .select(
          "id, event_id, type, created_at, preview_key, original_key, events!media_event_id_fkey!inner(host_id, deleted_at)",
        )
        .eq("events.host_id", user.id)
        .is("events.deleted_at", null)
        .eq("status", "approved")
        .is("removed_at", null)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(ARRIVALS_TARGET),
      "dashboard: just arrived",
    ),
    arrivalsSince(starts.hour, "dashboard: arrivals in the last hour"),
    arrivalsSince(starts.today, "dashboard: arrivals today"),
    // One row per event, its newest four embedded: PostgREST applies the embed's filter, order and
    // limit per event, so the answer is as long as the chunk however big the albums are. The
    // filter is ONE logic tree on the embed (`media.or=`), which filters the embedded rows, never
    // the events: an event with nothing approved comes back with an empty strip.
    inChunks(
      "dashboard: newest per event",
      eventIds,
      async (chunk) =>
        (await mustQuery(
          supabase
            .from("events")
            .select(
              "id, media!media_event_id_fkey(id, event_id, type, created_at, preview_key, original_key)",
            )
            .in("id", chunk)
            .or("and(status.eq.approved,removed_at.is.null)", {
              referencedTable: "media",
            })
            .order("created_at", { referencedTable: "media", ascending: false })
            .order("id", { referencedTable: "media", ascending: false })
            .limit(NEWEST_PER_EVENT, { referencedTable: "media" }),
          "dashboard: newest per event",
        )) ?? [],
    ),
  ]);
  const arrivalRows = arrivalRead ?? [];
  if (arrivalRows.length === 0) return empty;

  const { window, count } = pickArrivalWindow({ inHour, inToday });
  const caption = describeArrivals(
    window,
    count,
    arrivalRows[0]?.created_at ?? null,
    now,
  );

  type TileRow = {
    id: string;
    type: "photo" | "video";
    preview_key: string | null;
    original_key: string;
  };
  const newestRows = new Map<string, TileRow[]>();
  for (const event of eventStrips) {
    const media = (event.media ?? []).slice(0, NEWEST_PER_EVENT);
    if (media.length > 0) newestRows.set(event.id, media);
  }

  // ONE presign per distinct id, however many strips it appears in: the newest
  // photograph of the busiest event is both an arrival and the head of its own
  // row, and signing it twice would mint two signatures for one <img>.
  const needed = new Map<string, TileRow>();
  for (const row of [...arrivalRows, ...[...newestRows.values()].flat()]) {
    needed.set(row.id, row);
  }
  const signed = new Map<string, PulseTile>();
  await Promise.all(
    [...needed.values()].map(async (row) => {
      signed.set(row.id, {
        id: row.id,
        type: row.type,
        url: await presignDownload({
          key: row.preview_key ?? row.original_key,
          stable: true,
        }),
      });
    }),
  );

  const take = (rs: readonly TileRow[]) =>
    rs.map((r) => signed.get(r.id)).filter((t): t is PulseTile => Boolean(t));

  return {
    arrivals: take(arrivalRows),
    window,
    caption,
    newestByEvent: new Map(
      [...newestRows].map(([id, rs]) => [id, take(rs)] as const),
    ),
  };
});
