/**
 * THE OPERATOR'S ALBUM DRILL-IN, A PAGE AT A TIME (crumbs-37): `/admin/albums/<event>` read and presigned
 * every item of the album on every visit, so past a few thousand items one look at an album was thousands of
 * links. It now draws one page, newest first, and an Older link carries the page's last item as a keyset
 * cursor (`?at=<its raw created_at>&id=<its id>`), the same order and cursor the read pages on. Pure: the
 * page and its test share it.
 *
 * ★ AND ONE STATUS AT A TIME, WHEN ASKED (crumbs-41, a board idea from crumbs-37): `?status=` narrows the album
 * to the Albums feed's own words (Pending, Approved, Hidden, Removed), so an operator meets a big album's held or
 * removed items without paging through the rest; each filter pages the same way, its cursor carrying the filter.
 * The drill-in's All stays every status, removed included, as it always was (the feed's first tab is Active, which
 * leaves the removed out: a different question, so a different word).
 */
import {
  ALBUM_FILTER_META,
  ALBUM_FILTERS,
  type AlbumFilter,
} from "@/lib/moderation/operator-actions";
import { isUuidShape } from "@/lib/validation/uuid-shape";

/** Items one page of the drill-in reads and signs. */
export const ALBUM_DRILL_IN_PAGE = 500;

/** Where a page ends: its last item's RAW `created_at` (microseconds decide ties) and its id. */
export type AlbumCursor = { at: string; id: string };

/** One status the drill-in narrows to: the feed's own four, never its Active. */
export type AlbumStatus = Exclude<AlbumFilter, "all">;

/** The drill-in's filters in the feed's order: every status (null, its All), then the four. */
export const ALBUM_STATUSES: readonly AlbumStatus[] = ALBUM_FILTERS.filter(
  (f): f is AlbumStatus => f !== "all",
);

/** A filter's word: the feed's own for a status, and All for every status (never the feed's "Active"). */
export function albumStatusLabel(status: AlbumStatus | null): string {
  return status ? ALBUM_FILTER_META[status].label : "All";
}

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

/**
 * The status a page's URL narrows to, or null for every status. Anything else (a mangled or hand-typed value, the
 * feed's `all`) reads as every status: only the four words ever reach the read's filter.
 */
export function parseAlbumStatus(
  params: SearchParams | undefined,
): AlbumStatus | null {
  const status = one(params?.status);
  return ALBUM_STATUSES.find((s) => s === status) ?? null;
}

/**
 * A page's address: the album's own, with its filter when it narrows to one status, and the cursor when the page is
 * an older one. A filter's own first page carries no cursor, so changing the filter always starts at its newest.
 */
export function albumPageHref(
  eventId: string,
  cursor: AlbumCursor | null,
  status: AlbumStatus | null = null,
): string {
  const base = `/admin/albums/${eventId}`;
  const params = new URLSearchParams({
    ...(status ? { status } : {}),
    ...(cursor ? { at: cursor.at, id: cursor.id } : {}),
  });
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
