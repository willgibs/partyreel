/**
 * The host's curated REEL for an event: media_ids in add-order (position, then added_at, then media_id
 * as the tiebreak). HOST-ONLY by construction: the reel_items_host_select RLS policy scopes the read to
 * the host's OWN event (returns [] for anyone else), so one host's curation never leaks to another. The
 * reel ROOM seeds the ReelProvider with these ids and renders the builder or the Studio from them
 * (filtered to the already-presigned album items - no second presign); the hub's Reel card reads only
 * their number (`countReelItems`), never the list.
 */
import "server-only";

import { mustCount } from "@/lib/db/must-query";
import { readAllPages } from "@/lib/db/read-all";
import { createClient } from "@/lib/supabase/server";

/** The keyset over the reel's add-order: the last member's position, add time (raw string) and id. */
type ReelCursor = { position: number; at: string; id: string } | null;

/**
 * ★ THE MEMBERSHIP PREDICATE. `reel_items` rows OUTLIVE their media: deleting or removing a photo
 * leaves its curation row behind (deliberately - un-hiding resurrects the item at its old slot), so a
 * raw read of the junction table returns GHOSTS. Those ghosts leaked into every count and gate built
 * on this list: the section pill over-counted, and reorder bricked with 'stale' because the client
 * could only ever send the ids it can SEE while the RPC's set-equality guard compared against the
 * ghost-inflated set.
 *
 * So the read inner-joins media and keeps `status in ('approved','hidden')`:
 *   - HIDDEN items STAY members (the host sees them dimmed and can un-hide them),
 *   - only `removed`/purged rows are the ghosts we drop.
 *
 * This is DELIBERATELY WIDER than the reel's RENDER identity, which is `status = 'approved'` only
 * (buildReelProps, resolveReelRenderContext's hash, the guest RPC). Membership = what the host is
 * curating; timeline = what actually plays. Do not "unify" them: approved-only membership would
 * re-brick reorder for any reel containing a hidden item, and hidden-inclusive rendering would put a
 * hidden photo in a published video.
 *
 * ★ READ WHOLE, in add-order. `add_to_reel` caps nothing (a bulk "Add to reel" over a big album adds
 * every approved item it is handed), so the list pages through `readAllPages` on
 * `(position, added_at, media_id)`: position alone ties (a bulk add fires `add_to_reel` in parallel,
 * and each call reads the same `max(position) + 1`), and `media_id` makes the order total, so the
 * Studio sees one order on every read. A failed page THROWS: an empty list would read as "0 clips"
 * and hand the filmstrip a set `reorder_reel` refuses as `stale`.
 */
export async function listReelItems(eventId: string): Promise<string[]> {
  const supabase = await createClient();
  const { rows } = await readAllPages(
    "reel: membership",
    (after: ReelCursor, limit) => {
      let q = supabase
        .from("reel_items")
        // The FK hint is explicit on purpose: `media!inner` alone is resolvable today, but reel_items
        // already relates to `events` as well, and a future junction column would make it ambiguous
        // (PGRST201) - the same trap storage.ts documents. `status` is inside the authenticated
        // column-scoped SELECT grant on media, so this read stays legal.
        .select(
          "media_id, position, added_at, media!reel_items_media_id_fkey!inner(status)",
        )
        .eq("event_id", eventId)
        .in("media.status", ["approved", "hidden"])
        .order("position", { ascending: true })
        .order("added_at", { ascending: true })
        .order("media_id", { ascending: true })
        .limit(limit);
      // The rows strictly after the cursor in add-order. The timestamp and the id are quoted because
      // PostgREST reserves `.` and `:` inside a filter value (media.ts's newestFirstAfter says more).
      if (after) {
        const { position: p, at, id } = after;
        q = q.or(
          `position.gt.${p},and(position.eq.${p},added_at.gt."${at}"),and(position.eq.${p},added_at.eq."${at}",media_id.gt."${id}")`,
        );
      }
      return q;
    },
    (r) => ({ position: r.position, at: r.added_at, id: r.media_id }),
  );
  return rows.map((r) => r.media_id);
}

/**
 * How many members the reel has, COUNTED under the same membership predicate (approved + hidden;
 * a ghost never counts): the hub's "N clips" card. One head count, so the hub never reads the
 * whole membership just to say its size. A failed count throws rather than reading as zero.
 */
export async function countReelItems(eventId: string): Promise<number> {
  const supabase = await createClient();
  return mustCount(
    supabase
      .from("reel_items")
      .select("media_id, media!reel_items_media_id_fkey!inner(status)", {
        count: "exact",
        head: true,
      })
      .eq("event_id", eventId)
      .in("media.status", ["approved", "hidden"]),
    "reel: membership count",
  );
}

/**
 * The reel COMPOSER config (theme / seed / length / cover). HOST-ONLY: the highlight_reels_host_all RLS
 * policy scopes the read to the host's OWN event. Returns null when the host hasn't composed yet (the
 * reel row is created lazily on the first edit, via upsert_reel_config) — the composer then uses
 * defaults. The status/output_key (the render lifecycle) are NOT read here; they belong to the export
 * slice. Writes go through upsert_reel_config (host table writes are revoked; this only SELECTs).
 */
export type ReelConfig = {
  /** The catalog style id (mood or treatment) — the composer's primary control. */
  styleId: string;
  /** Portrait / landscape output. */
  orientation: string;
  /** Legacy theme column — kept for the composer's init fallback (pre-style_id rows). */
  theme: string;
  seed: number;
  lengthSeconds: number | null;
  coverMediaId: string | null;
  /** guest-flow.md ruling 1: the publish switch. False until the host's explicit "Share with guests". */
  guestVisible: boolean;
};

export async function getReelConfig(
  eventId: string,
): Promise<ReelConfig | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("highlight_reels")
    .select(
      "style_id, theme, orientation, seed, length_seconds, cover_media_id, guest_visible",
    )
    .eq("event_id", eventId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    styleId: data.style_id,
    orientation: data.orientation,
    theme: data.theme,
    seed: data.seed,
    lengthSeconds: data.length_seconds,
    coverMediaId: data.cover_media_id,
    guestVisible: data.guest_visible,
  };
}
