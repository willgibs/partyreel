/**
 * The signed-in user's own uploads across ALL events (host uploads + guest uploads), render-ready for her
 * profile's owner mode ("Your uploads"). `get_my_uploads` is a SECURITY DEFINER RPC because it reads the
 * name/date/token of events the user may NOT own (events RLS is host-only); it's auth.uid()-based +
 * authenticated-only. We presign the R2 keys server-side here (uploads-and-r2.md) — raw keys never reach the browser.
 *
 * ★ A PAGE AT A TIME, ON A KEYSET (crumbs-38: "My uploads and My likes stop at 200 with an honest note"). The feed
 * is read 200 at a time, newest first on `(created_at, id)`, the function's own total order (migration
 * 20261001203800); a page asks for one row past itself, so `next` is the cursor exactly when a further page holds
 * something, and a Show more never answers an empty page. Never an offset: an upload added or deleted between two
 * presses would shift every row after it, and a keyset only ever resumes after a row she has already been shown.
 *
 * ★ AN UPLOAD TO AN ALBUM THAT READS PRIVATE TO HER OFFERS NO HEART (a ROADMAP carry-over from
 * `crumbs-8`): `like_media` likes nothing on a private album but its host's (20260929100000), and an
 * account an event blocked reads that event as private everywhere, so a heart on such an upload could
 * only ever answer "Couldn't save that like." Each album her guest uploads sit in is read AS SHE SEES
 * IT (`getEventByQrToken`, the one read that masks a block), and its uploads carry `likeable: false`.
 * Her own events are never asked: a host likes on her own private album.
 *
 * ★ HER OWN EVENTS' UPLOADS SAY SO (`isHost`): one Trash removes the two arms differently (an upload to
 * somebody else's event is final; one to an event she hosts lands in its Deleted), and the viewer's confirm
 * says which off `isHost`. The function's own arm flag (`is_host_upload`) is the fact: it splits its two arms
 * on the event's host, so no second read of her events is needed to know which is which.
 */
import "server-only";

import { cache } from "react";

import type { GridMedia } from "@/components/app/media-grid";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { toMyUploadsItems } from "@/lib/r2/grid-items";
import { getRequestAuth, type RequestAuth } from "@/lib/supabase/request-auth";
import { formatEventDate } from "@/lib/utils";

/** Where the next page of a personal feed resumes: the last row shown, its time exactly as the server wrote it. */
export type FeedCursor = { at: string; id: string };

/** A page of a personal feed, and the cursor of the page after it (null at the end). */
export type FeedPage = { items: GridMedia[]; next: FeedCursor | null };

/** One page of a personal feed (two presigns an item); a Show more adds the next. */
export const MY_FEED_PAGE = 200;

/** Albums asked about at once: one read an album, and a page of 200 uploads can span as many. */
const VISIBILITY_READS_AT_ONCE = 6;

/** A page asks for one row past itself (`splitPage` reads the extra row as "more exist"). */
export const MY_FEED_ASK = MY_FEED_PAGE + 1;

/** The page's rows and the cursor after it: the extra row only says that more exist, and is never shown. */
export function splitPage<R>(
  rows: readonly R[],
  cursorOf: (row: R) => FeedCursor,
): { rows: R[]; next: FeedCursor | null } {
  if (rows.length <= MY_FEED_PAGE) return { rows: [...rows], next: null };
  const shown = rows.slice(0, MY_FEED_PAGE);
  return { rows: shown, next: cursorOf(shown[shown.length - 1]) };
}

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

/**
 * ONE PAGE OF HER UPLOADS for the auth already read (the page's own, or a Server Function's), after `before` (null:
 * the newest). Signed out reads nothing. A failed read throws: the owner mode's boundary or the Show more's own
 * answer says so, never an empty feed passed off as hers.
 */
export async function readMyUploadsPage(
  auth: RequestAuth,
  before: FeedCursor | null,
): Promise<FeedPage> {
  const { supabase, user } = auth;
  if (!user) return { items: [], next: null };

  // The first page asks by `p_limit` alone, as the build before the cursor did.
  const { data, error } = await supabase.rpc("get_my_uploads", {
    p_limit: MY_FEED_ASK,
    ...(before
      ? { p_before_created_at: before.at, p_before_id: before.id }
      : {}),
  });
  if (error) throw error;
  const page = splitPage(data ?? [], (r) => ({ at: r.created_at, id: r.id }));
  const rows = page.rows;
  // Only the guest arm's albums: the host arm is her own, where she always likes.
  const guestAlbums = [
    ...new Set(
      rows.flatMap((r) =>
        !r.is_host_upload && r.event_qr_token ? [r.event_qr_token] : [],
      ),
    ),
  ];
  const hostArm = new Set(
    rows.filter((r) => r.is_host_upload).map((r) => r.id),
  );
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
    items: items.map((item) => {
      if (hostArm.has(item.id)) return { ...item, isHost: true };
      // `closed` holds only albums she does not host (the arms split on the event's host).
      return item.eventQrToken != null && closed.has(item.eventQrToken)
        ? { ...item, likeable: false }
        : item;
    }),
    next: page.next,
  };
}

/** Her newest page, for the owner mode's first render. cache() = request-scoped dedupe (lib/supabase/request-auth). */
export const getMyUploadCards = cache(
  async function getMyUploadCards(): Promise<FeedPage> {
    return readMyUploadsPage(await getRequestAuth(), null);
  },
);
