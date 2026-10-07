/**
 * THE DASHBOARD'S OWN READS (host-dashboard r1's wiring, 2026-10-02): what the stage, the week and the
 * grouping by when need that no other page reads. Its own file, apart from `events.ts`, which every
 * host page shares, so the home can change shape without touching the event rows.
 *
 * Every read here is RLS-scoped (`media_host_all`, `events_host_all`, `link_stats_host_select`): the
 * signed-in host's own events and nothing else, re-validated through `getRequestAuth()` (the
 * request-cached `getUser()`), because the proxy is not a security boundary. A caller that is not
 * the host reads nothing: empty maps, zero counts, no photographs.
 *
 * ★ BOUNDED BY CONSTRUCTION (the 1,000-row rules, `read-all.ts`): one row per event through the
 * embed's own limit (`getLastArrivals`, chunked through `inChunks`), a head count for every number,
 * and the stage's photographs at the stage's own size.
 *
 * ★ KEYS NEVER REACH THE BROWSER: every photograph is presigned here, `stable`, so a refresh inside the
 * half hour hands the stage the same urls and the browser its cached images.
 */
import "server-only";

import type { StagePhoto } from "@/lib/dashboard/stage";
import { inChunks } from "@/lib/db/read-all";
import { mustCount, mustQuery } from "@/lib/db/must-query";
import { nowIso, unsealedFilter } from "@/lib/disposable/seal";
import { presignDownload } from "@/lib/r2/presign";
import { getRequestAuth } from "@/lib/supabase/request-auth";

/** Approved and outside the bin: the album a host and her guests see. */
const IN_ALBUM = "and(status.eq.approved,removed_at.is.null)";

/**
 * EACH EVENT'S NEWEST ARRIVAL: the instant its newest approved upload landed, by event id, absent for an
 * event whose album holds none. What places an undated album in time (`when.ts`'s `dayOf`) and names
 * the latest activity (`moment.ts`). One row per event, its newest upload embedded: the embed's filter,
 * order and limit apply per event, so the answer is as long as the chunk however big the albums are.
 */
export async function getLastArrivals(
  eventIds: readonly string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (eventIds.length === 0) return out;
  const { supabase, user } = await getRequestAuth();
  if (!user) return out;

  const rows = await inChunks(
    "dashboard: last arrivals",
    eventIds,
    async (chunk) =>
      (await mustQuery(
        supabase
          .from("events")
          .select("id, media!media_event_id_fkey(created_at)")
          .in("id", chunk)
          .or(IN_ALBUM, { referencedTable: "media" })
          .order("created_at", { referencedTable: "media", ascending: false })
          .limit(1, { referencedTable: "media" }),
        "dashboard: last arrivals",
      )) ?? [],
  );
  for (const row of rows) {
    const newest = row.media?.[0]?.created_at;
    if (newest) out.set(row.id, newest);
  }
  return out;
}

/** Approved uploads to one event since an instant, counted (never a list's length). */
export async function countArrivalsSince(
  eventId: string,
  since: string,
): Promise<number> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return 0;
  return mustCount(
    supabase
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "approved")
      .is("removed_at", null)
      .gte("created_at", since),
    "dashboard: arrivals since",
  );
}

/**
 * THE STAGE'S PHOTOGRAPHS: an event's newest drawable uploads, newest first, at most `count` (the live
 * wall's nine). Drawable is the reel's own word for it: a photograph, or a video with its poster, since
 * the stage draws a still and never a file (`getReelProgress`).
 *
 * ★ HELD TO WHAT HER GUESTS SEE (crumbs-88). Her own session is exempt from a disposable album's seal at every
 * SQL home (`e.host_id = auth.uid()`), so this read, on her RLS client, would draw on the wall the very photographs the
 * hub covers until the develop (`hubCovered`: `host-cover.ts`) and her guests meet as a contact sheet. The wall is
 * the album's face, so it asks the seal's own predicate (`unsealedFilter`, `lib/disposable/seal.ts`, on the column her
 * grant reads), per row: a row sealed past now is not drawn, and an album with no develop time ahead holds none, so
 * this is the read it was for every album that never waited. A covered album's wall then has nothing to draw until
 * the first row developed or one of the album's older ones, and the stage stands on its code's plate (`stage.tsx`).
 * The other `.or()` below is a second logic tree beside it, which PostgREST ANDs.
 */
export async function getStagePhotos(
  eventId: string,
  count: number,
): Promise<StagePhoto[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];
  const rows =
    (await mustQuery(
      supabase
        .from("media")
        .select("id, type, preview_key, original_key")
        .eq("event_id", eventId)
        .eq("status", "approved")
        .is("removed_at", null)
        .or(unsealedFilter(nowIso()))
        .or("type.eq.photo,preview_key.not.is.null")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(count),
      "dashboard: stage photographs",
    )) ?? [];
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      url: await presignDownload({
        key: row.preview_key ?? row.original_key,
        stable: true,
      }),
    })),
  );
}

/**
 * HOW OFTEN EACH EVENT'S LINK WAS OPENED, for the few events the dashboard asks readiness of (the
 * stage's and the week's before their day): the hub's own number (`getLinkStats`: scans and views,
 * the host's own included), so "the code" ticks here exactly when it ticks on the hub. One aggregate
 * an event (`event_link_totals`, SQL-summed); the caller bounds the list. An event whose read failed
 * is absent, and its readiness is left unsaid rather than guessed.
 */
export async function getOpenedCounts(
  eventIds: readonly string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (eventIds.length === 0) return out;
  const { supabase, user } = await getRequestAuth();
  if (!user) return out;
  const counter = (totals: unknown, key: string) => {
    const value = Number(
      typeof totals === "object" && totals !== null
        ? (totals as Record<string, unknown>)[key]
        : 0,
    );
    return Number.isFinite(value) ? value : 0;
  };
  await Promise.all(
    [...new Set(eventIds)].map(async (id) => {
      const { data, error } = await supabase.rpc("event_link_totals", {
        p_event_id: id,
      });
      if (error || !data) return;
      out.set(id, counter(data, "qr_scans") + counter(data, "album_views"));
    }),
  );
  return out;
}
