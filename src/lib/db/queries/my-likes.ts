/**
 * The signed-in user's liked media across ALL events, render-ready for her profile's owner mode ("Your likes").
 * `get_my_likes` is a SECURITY DEFINER RPC (it reads the name/date/token of events the user may NOT own,
 * exactly like get_my_uploads); it's auth.uid()-based + authenticated-only, and RE-APPLIES the like
 * access predicate so a liked media that has since gone private / removed / had its event deleted drops
 * out (never leaking its key). We presign the R2 keys server-side here (uploads-and-r2.md) — raw keys never reach
 * the browser. Reuses toMyUploadsItems: the row shape (originalKey + event context) is identical.
 *
 * ★ A PAGE AT A TIME, ON A KEYSET (crumbs-38), like her uploads (`my-uploads.ts` holds the page's rules): newest
 * liked first on `(liked_at, media id)`, a total order of hers (a photograph is liked once), 200 a page.
 */
import "server-only";

import { cache } from "react";

import {
  feedArgs,
  feedRpc,
  splitPage,
  type FeedCursor,
  type FeedPage,
} from "@/lib/db/queries/my-uploads";
import { toMyUploadsItems } from "@/lib/r2/grid-items";
import { getRequestAuth, type RequestAuth } from "@/lib/supabase/request-auth";
import { formatEventDate } from "@/lib/utils";

/**
 * ONE PAGE OF HER LIKES for the auth already read, after `before` (null: the newest). Every item here is liked by
 * the viewer by definition; the Likes gallery seeds the LikesProvider with these ids (its initialLikedIds), so the
 * hearts paint filled instantly. No count (host-only). A failed read throws, as her uploads' does.
 */
export async function readMyLikesPage(
  auth: RequestAuth,
  before: FeedCursor | null,
): Promise<FeedPage> {
  const { supabase, user } = auth;
  if (!user) return { items: [], next: null };

  const page = splitPage(
    await feedRpc(
      supabase,
      "get_my_likes",
      feedArgs(before, { at: "p_before_liked_at", id: "p_before_id" }),
    ),
    (r) => ({ at: r.liked_at, id: r.id }),
  );
  const items = await toMyUploadsItems(
    page.rows.map((r) => ({
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
  return { items, next: page.next };
}

/** Her newest liked page, for the owner mode's first render. cache() = request-scoped dedupe. */
export const getMyLikeCards = cache(
  async function getMyLikeCards(): Promise<FeedPage> {
    return readMyLikesPage(await getRequestAuth(), null);
  },
);
