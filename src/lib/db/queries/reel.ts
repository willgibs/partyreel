/**
 * The host's curated REEL for an event: media_ids in add-order (position, then added_at). HOST-ONLY by
 * construction: the reel_items_host_select RLS policy scopes the read to the host's OWN event (returns []
 * for anyone else), so one host's curation never leaks to another. The event page seeds the ReelProvider
 * with these ids AND renders the Reel panel from them (filtered to the already-presigned gallery items -
 * no second presign).
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";

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
 */
export async function listReelItems(eventId: string): Promise<string[]> {
  const supabase = await createClient();
  // row-cap-todo: M9 the reel's members, cut at 1,000
  const { data, error } = await supabase
    .from("reel_items")
    // The FK hint is explicit on purpose: `media!inner` alone is resolvable today, but reel_items
    // already relates to `events` as well, and a future junction column would make it ambiguous
    // (PGRST201) - the same trap storage.ts documents. `status` is inside the authenticated
    // column-scoped SELECT grant on media, so this read stays legal.
    .select("media_id, media!reel_items_media_id_fkey!inner(status)")
    .eq("event_id", eventId)
    .in("media.status", ["approved", "hidden"])
    .order("position", { ascending: true })
    .order("added_at", { ascending: true });
  if (error || !data) return [];
  return data.map((r) => r.media_id);
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
