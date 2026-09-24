/**
 * Like COUNTS for the host management gallery. HOST-ONLY by construction: get_event_like_counts is a
 * SECURITY DEFINER RPC gated to the event's host (it returns zero rows for anyone else), so a count can
 * never reach a guest. Counts are a curation signal (which media guests loved) + the data the future
 * sort/filter system will use. Returned as a Map<mediaId, count> for the host page to merge into its items.
 *
 * ★ LIKED MEDIA ONLY, READ WHOLE (the 1,000-row round, 2026-09-23). The function answers one row per
 * media somebody liked (`20260924010000_row_cap_album.sql`), paged on `media_id`, so the map holds every
 * liked item however big the album is. An item nobody liked is ABSENT, and every reader maps an absent
 * id to 0: `likeCounts.get(m.id) ?? 0` in `lib/event/gallery-items.ts`, the one path a count takes to the
 * host pages, the reel builder and the studio picker (quick-add reads `likeCount ?? 0` besides).
 */
import "server-only";

import { readAllPages } from "@/lib/db/read-all";
import { getRequestAuth } from "@/lib/supabase/request-auth";

export async function getEventLikeCounts(
  eventId: string,
): Promise<Map<string, number>> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return new Map();

  const { rows } = await readAllPages(
    "host: like counts",
    (after: string | null, limit) =>
      supabase.rpc("get_event_like_counts", {
        p_event_id: eventId,
        p_after: after ?? undefined,
        p_limit: limit,
      }),
    (row) => row.media_id,
  );

  return new Map(rows.map((row) => [row.media_id, row.like_count]));
}
