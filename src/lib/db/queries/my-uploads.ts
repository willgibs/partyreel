/**
 * The signed-in user's own uploads across ALL events (host uploads + guest uploads), render-ready for the
 * dashboard "Uploads" tab (Phase 4). `get_my_uploads` is a SECURITY DEFINER RPC because it reads the
 * name/date/token of events the user may NOT own (events RLS is host-only); it's auth.uid()-based +
 * authenticated-only. We presign the R2 keys server-side here (uploads-and-r2.md) — raw keys never reach the browser.
 *
 * ★ AN UPLOAD TO AN ALBUM THAT READS PRIVATE TO HER OFFERS NO HEART (a ROADMAP carry-over from
 * `crumbs-8`): `like_media` likes nothing on a private album but its host's (20260929100000), and an
 * account an event blocked reads that event as private everywhere, so a heart on such an upload could
 * only ever answer "Couldn't save that like." Each album her guest uploads sit in is read AS SHE SEES
 * IT (`getEventByQrToken`, the one read that masks a block), and its uploads carry `likeable: false`.
 * Her own events are never asked: a host likes on her own private album.
 */
import "server-only";

import { cache } from "react";

import type { GridMedia } from "@/components/app/media-grid";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { toMyUploadsItems } from "@/lib/r2/grid-items";
import { getRequestAuth } from "@/lib/supabase/request-auth";
import { formatEventDate } from "@/lib/utils";

// v1 cap on the flat cross-event feed (two presigns/item). `truncated` lets the UI say so rather than
// silently dropping the (limit+1)th upload (the "no silent caps" rule). A future cursor (created_at <)
// is the load-more upgrade path with no RPC change.
const MY_UPLOADS_LIMIT = 200;

/** Albums asked about at once: one read an album, and a feed of 200 uploads can span as many. */
const VISIBILITY_READS_AT_ONCE = 6;

/**
 * Which of these albums read private to the caller, each read as she sees it, a few at a time.
 *
 * ★ A COURTESY, NEVER A GATE: an album that cannot be read keeps its heart, whose press meets the
 * refusal it always met, so a failed read degrades to today's feed instead of failing her page (the
 * refusal itself is `like_media`'s, inside the database).
 */
async function albumsReadingPrivate(
  tokens: readonly string[],
): Promise<Set<string>> {
  const reading = new Set<string>();
  for (let i = 0; i < tokens.length; i += VISIBILITY_READS_AT_ONCE) {
    const batch = tokens.slice(i, i + VISIBILITY_READS_AT_ONCE);
    const answers = await Promise.allSettled(
      batch.map((token) => getEventByQrToken(token)),
    );
    answers.forEach((answer, k) => {
      if (
        answer.status === "fulfilled" &&
        answer.value.ok &&
        answer.value.data.visibility === "private"
      ) {
        reading.add(batch[k]);
      }
    });
  }
  return reading;
}

// cache() = request-scoped dedupe (see lib/supabase/request-auth).
export const getMyUploadCards = cache(
  async function getMyUploadCards(): Promise<{
    items: GridMedia[];
    truncated: boolean;
  }> {
    const { supabase, user } = await getRequestAuth();
    if (!user) return { items: [], truncated: false };

    const { data, error } = await supabase.rpc("get_my_uploads", {
      p_limit: MY_UPLOADS_LIMIT,
    });
    if (error) throw error;

    const rows = data ?? [];
    // Only the guest arm's albums: the host arm is her own, where she always likes.
    const guestAlbums = [
      ...new Set(
        rows.flatMap((r) =>
          !r.is_host_upload && r.event_qr_token ? [r.event_qr_token] : [],
        ),
      ),
    ];
    const [items, closed] = await Promise.all([
      toMyUploadsItems(
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
      ),
      albumsReadingPrivate(guestAlbums),
    ]);
    return {
      // `closed` holds only albums she does not host (the arms split on the event's host).
      items: items.map((item) =>
        item.eventQrToken != null && closed.has(item.eventQrToken)
          ? { ...item, likeable: false }
          : item,
      ),
      truncated: rows.length >= MY_UPLOADS_LIMIT,
    };
  },
);
