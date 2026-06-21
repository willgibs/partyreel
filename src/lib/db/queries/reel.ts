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
