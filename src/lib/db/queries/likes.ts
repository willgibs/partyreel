/**
 * Like COUNTS for the host management gallery. HOST-ONLY by construction: get_event_like_counts is a
 * SECURITY DEFINER RPC gated to the event's host (it returns zero rows for anyone else), so a count can
 * never reach a guest. Counts are a curation signal (which media guests loved) + the data the future
 * sort/filter system will use. Returned as a Map<mediaId, count> for the host page to merge into its items.
 */
import "server-only";

import { getRequestAuth } from "@/lib/supabase/request-auth";

export async function getEventLikeCounts(
  eventId: string,
): Promise<Map<string, number>> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return new Map();

  const { data, error } = await supabase.rpc("get_event_like_counts", {
    p_event_id: eventId,
  });
  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.media_id, row.like_count]));
}
