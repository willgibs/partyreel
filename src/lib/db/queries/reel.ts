/**
 * The host's curated REEL for an event: media_ids in add-order (position, then added_at). HOST-ONLY by
 * construction: the reel_items_host_select RLS policy scopes the read to the host's OWN event (returns []
 * for anyone else), so one host's curation never leaks to another. The event page seeds the ReelProvider
 * with these ids AND renders the Reel panel from them (filtered to the already-presigned gallery items -
 * no second presign). Generation (the highlight VIDEO) is deferred; this is just the curated input set.
 */
import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function listReelItems(eventId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reel_items")
    .select("media_id")
    .eq("event_id", eventId)
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
};

export async function getReelConfig(
  eventId: string,
): Promise<ReelConfig | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("highlight_reels")
    .select("style_id, theme, orientation, seed, length_seconds, cover_media_id")
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
  };
}
