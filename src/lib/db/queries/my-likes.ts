/**
 * The signed-in user's liked media across ALL events, render-ready for the dashboard "Likes" tab.
 * `get_my_likes` is a SECURITY DEFINER RPC (it reads the name/date/token of events the user may NOT own,
 * exactly like get_my_uploads); it's auth.uid()-based + authenticated-only, and RE-APPLIES the like
 * access predicate so a liked media that has since gone private / removed / had its event deleted drops
 * out (never leaking its key). We presign the R2 keys server-side here (uploads-and-r2.md) — raw keys never reach
 * the browser. Reuses toMyUploadsItems: the row shape (originalKey + event context) is identical.
 */
import "server-only";

import { cache } from "react";

import type { GridMedia } from "@/components/app/media-grid";
import { toMyUploadsItems } from "@/lib/r2/grid-items";
import { getRequestAuth } from "@/lib/supabase/request-auth";
import { formatEventDate } from "@/lib/utils";

// Same v1 cap as Uploads (two presigns/item). `truncated` lets the UI say so (no silent caps); a future
// cursor (liked_at <) is the load-more path with no RPC change.
const MY_LIKES_LIMIT = 200;

// cache() = request-scoped dedupe (see lib/supabase/request-auth).
export const getMyLikeCards = cache(async function getMyLikeCards(): Promise<{
  items: GridMedia[];
  truncated: boolean;
}> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return { items: [], truncated: false };

  const { data, error } = await supabase.rpc("get_my_likes", {
    p_limit: MY_LIKES_LIMIT,
  });
  if (error) throw error;

  const rows = data ?? [];
  const items = await toMyUploadsItems(
    rows.map((r) => ({
      id: r.id,
      type: r.type,
      originalKey: r.original_key,
      previewKey: r.preview_key ?? null,
      eventName: r.event_name,
      // event_date is nullable in reality (the generated TABLE type widens it to string); guard it.
      eventDateLabel: r.event_date ? formatEventDate(r.event_date) : null,
      eventQrToken: r.event_qr_token,
      width: r.width,
      height: r.height,
      durationSeconds: r.duration_seconds,
    })),
  );
  // Every item here is liked by the viewer by definition; the Likes-tab gallery seeds the LikesProvider
  // with these ids (its initialLikedIds), so the hearts paint filled instantly. No count (host-only).
  return { items, truncated: rows.length >= MY_LIKES_LIMIT };
});
