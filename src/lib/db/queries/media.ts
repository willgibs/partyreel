/**
 * Media reads for the authenticated host gallery. RLS-scoped server client +
 * `getUser()` re-check (RLS is the boundary; the proxy is not). `media_host_all`
 * scopes rows to media in the host's own events, so we never filter by host here.
 *
 * 'removed' rows are excluded — those are deleted (their R2 objects purged in
 * Phase 3) and must not surface. Pending + approved + hidden all show to the host.
 */
import "server-only";

import type { Tables } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";

export type MediaRow = Tables<"media">;

export async function listEventMedia(eventId: string): Promise<MediaRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("event_id", eventId)
    .neq("status", "removed")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
