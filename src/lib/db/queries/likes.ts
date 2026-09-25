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

import { mustQuery } from "@/lib/db/must-query";
import { readAllPages } from "@/lib/db/read-all";
import { createAdminClient } from "@/lib/supabase/admin";
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

/**
 * A WINDOW'S LIKE COUNTS: exactly the asked ids of one event, one jsonb (`media_like_counts`,
 * 20260926300000). The paged album mints links for what is on screen, and the host's links carry
 * each item's count beside them, so the count read has the window's size, never the event's
 * (`getEventLikeCounts` pages over every liked item, which a per-window read cannot afford).
 *
 * ★ SERVICE ROLE, AFTER THE CALLER'S OWN CHECK. The function reads every liker's rows, which
 * media_likes' owner-only RLS hides from a client role, so no client role can execute it. Its two
 * callers (the host's links route and the hub page) have already re-verified the session and read
 * the event through RLS (`getEvent`), which is the ownership check; the event filter inside means an
 * id from another album is never counted even if one slipped in. An item nobody liked is ABSENT and
 * reads as 0, the convention every count reader keeps.
 */
export async function readMediaLikeCounts(
  eventId: string,
  mediaIds: readonly string[],
): Promise<Map<string, number>> {
  if (mediaIds.length === 0) return new Map();
  const data = await mustQuery(
    createAdminClient().rpc("media_like_counts", {
      p_event_id: eventId,
      p_media_ids: [...mediaIds],
    }),
    "likes: media like counts",
  );
  return parseLikeCounts(data);
}

/** `media_like_counts`' jsonb as a map, defensively: anything but a whole positive count is dropped. */
export function parseLikeCounts(json: unknown): Map<string, number> {
  const out = new Map<string, number>();
  if (!json || typeof json !== "object" || Array.isArray(json)) return out;
  for (const [id, n] of Object.entries(json as Record<string, unknown>)) {
    if (typeof n === "number" && Number.isSafeInteger(n) && n > 0)
      out.set(id, n);
  }
  return out;
}
