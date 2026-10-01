/**
 * THE OPERATOR'S ALBUM DRILL-IN, A PAGE AT A TIME (crumbs-37): `/admin/albums/<event>` read and presigned
 * every item of the album on every visit, so past a few thousand items one look at an album was thousands of
 * links. It now draws one page, newest first, and an Older link carries the page's last item as a keyset
 * cursor (`?at=<its raw created_at>&id=<its id>`), the same order and cursor the read pages on. Pure: the
 * page and its test share it.
 */
import { isUuidShape } from "@/lib/validation/uuid-shape";

/** Items one page of the drill-in reads and signs. */
export const ALBUM_DRILL_IN_PAGE = 500;

/** Where a page ends: its last item's RAW `created_at` (microseconds decide ties) and its id. */
export type AlbumCursor = { at: string; id: string };

/**
 * A timestamp as PostgREST writes one (`2026-09-23T12:00:00.123456+00:00`): the only shape a cursor's `at`
 * may take, so nothing else reaches the read's filter (whose commas and parentheses are its syntax).
 */
const RAW_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;

type SearchParams = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * The cursor a page's URL carries, or null for the newest page. A cursor that is not one (a mangled or
 * hand-typed link) reads as the newest page rather than an error: it names no item, and the album is there.
 */
export function parseAlbumCursor(
  params: SearchParams | undefined,
): AlbumCursor | null {
  const at = one(params?.at);
  const id = one(params?.id);
  if (!at || !id) return null;
  if (!RAW_TIMESTAMP.test(at) || !isUuidShape(id)) return null;
  return { at, id };
}

/** A page's address: the album's own, with the cursor when the page is an older one. */
export function albumPageHref(
  eventId: string,
  cursor: AlbumCursor | null,
): string {
  const base = `/admin/albums/${eventId}`;
  if (!cursor) return base;
  return `${base}?${new URLSearchParams({ at: cursor.at, id: cursor.id })}`;
}
