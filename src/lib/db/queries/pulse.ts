/**
 * THE PULSE'S OWN READS: the photographs that just arrived, the newest few per
 * event for the row view, and which events already have a reel.
 *
 * ★ A NEW FILE RATHER THAN A FEW MORE EXPORTS ON `events.ts`, DELIBERATELY.
 * `events.ts` holds `getEventCardStats`, which the event SETTINGS page shares;
 * growing it with the home's reads would tie two surfaces to one module and
 * make every future dashboard change a settings-page risk. The lane's brief
 * names this separation and it is the right one.
 *
 * Everything here is RLS-scoped: `media_host_all` and `highlight_reels_host_all`
 * already limit these tables to the signed-in host's own events, and we
 * re-validate the user with `getRequestAuth()` (the request-cached `getUser()`)
 * before reading, because the proxy is not a security boundary.
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
  type ArrivalWindow,
  describeArrivals,
  pickArrivalWindow,
} from "@/lib/dashboard/arrivals";
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

/**
 * How many media rows the pulse reads before it stops caring. The strips show
 * twelve and four-per-event, so the newest few hundred rows always contain
 * every tile either can draw; a cap keeps a busy host's home from selecting
 * their entire library to render twenty thumbnails. Nothing downstream is a
 * COUNT, so the cap cannot make a number wrong — only the window-widening
 * search, which has already found its twelve long before this bound.
 */
const PULSE_SCAN_LIMIT = 240;

/** Up to four sit beside the name in a row (the board's ruled shape). */
const NEWEST_PER_EVENT = 4;

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

  // Approved only: a pending upload belongs in the review queue, which is band
  // one's job. Showing it here would tell the host it is already in the album.
  // row-cap-todo: M3 every event id rides one URL
  const { data, error } = await supabase
    .from("media")
    .select("id, event_id, type, created_at, preview_key, original_key")
    .in("event_id", eventIds)
    .eq("status", "approved")
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(PULSE_SCAN_LIMIT);
  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) return empty;

  const { window, count } = pickArrivalWindow(
    rows.map((r) => r.created_at),
    now,
    startOfToday,
  );
  const caption = describeArrivals(
    window,
    count,
    rows[0]?.created_at ?? null,
    now,
  );

  // The strip: the narrowest window's rows, capped at twelve. When the window
  // is "recent" the cap IS the selection.
  const arrivalRows = rows.slice(
    0,
    Math.min(window === "recent" ? ARRIVALS_TARGET : count, ARRIVALS_TARGET),
  );

  // The row view's per-event strips, from the same rows (newest-first already).
  const newestRows = new Map<string, typeof rows>();
  for (const row of rows) {
    const bucket = newestRows.get(row.event_id) ?? [];
    if (bucket.length < NEWEST_PER_EVENT) {
      bucket.push(row);
      newestRows.set(row.event_id, bucket);
    }
  }

  // ONE presign per distinct id, however many strips it appears in: the newest
  // photograph of the busiest event is both an arrival and the head of its own
  // row, and signing it twice would mint two signatures for one <img>.
  const needed = new Map<string, (typeof rows)[number]>();
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

  const take = (rs: typeof rows) =>
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

/**
 * Which of these events already have a reel, for the next-best-step rule's
 * "a live event with no reel". A row's existence is the whole answer, so this
 * selects one column and never the config. `highlight_reels_host_all` scopes
 * it to the host's own events.
 */
export const getEventsWithReels = cache(async function getEventsWithReels(
  eventIds: string[],
): Promise<Set<string>> {
  if (eventIds.length === 0) return new Set();

  const { supabase, user } = await getRequestAuth();
  if (!user) return new Set();

  // row-cap-todo: M3 every event id rides one URL
  const { data, error } = await supabase
    .from("highlight_reels")
    .select("event_id")
    .in("event_id", eventIds);
  if (error) throw error;

  return new Set((data ?? []).map((r) => r.event_id));
});
