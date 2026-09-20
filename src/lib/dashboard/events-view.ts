/**
 * THE EVENTS LIST'S TWO VIEWS, AND THE ORDER AND THE LENS OVER EITHER
 * (`density=cover`, Will 2026-09-20: "Let's do both. Let's make a toggle
 * opposite 'your events' (aligned right side)... For fewer events, I'd expect
 * the cover card to be more popular, but for users with more events, I'd
 * expect the table to be more popular with sorting/filtering").
 *
 * Pure + node-safe, so the server page (which reads the cookie and paints the
 * first frame) and the client control (which flips it) share ONE definition of
 * what a view is. Nothing here touches `next/headers`: the cookie NAME lives
 * here, the cookie ACCESS lives in the page and the Server Action.
 *
 * ★ WHY A COOKIE AND NOT localStorage. The view has to be known on the SERVER,
 * before the first byte: a local preference would render cover cards on the
 * server and swap to rows after hydration on every single load, which is a
 * visible flip of the whole list every time the host opens the app. A cookie
 * set by a Server Action is read during render, so the first paint is already
 * the view the host chose. (Setting a cookie in a Server Function also makes
 * Next re-render the page and its layouts server-side, so the flip needs no
 * router.refresh() of its own — verified against the Next 16 docs.)
 *
 * Cross-device persistence would want a `profiles.events_view` column; that is
 * a migration, which is the Orchestrator's, and it is a Question in the lane's
 * manifest rather than a thing this file pretends to do.
 */

/** The cookie the toggle writes and the dashboard reads. */
export const EVENTS_VIEW_COOKIE = "pr_events_view";

/** A year: this is a preference, not a session fact. */
export const EVENTS_VIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type EventsView = "cards" | "rows";

/**
 * Cover cards by default — his expectation for the host with a handful of
 * events, and the shape the dashboard has always opened on.
 */
export const DEFAULT_EVENTS_VIEW: EventsView = "cards";

export function resolveEventsView(raw: string | undefined | null): EventsView {
  return raw === "rows" || raw === "cards" ? raw : DEFAULT_EVENTS_VIEW;
}

/* ── The order ───────────────────────────────────────────────────────────── */

export type EventsSort = "newest" | "waiting" | "name";

/** His three, in his words. The row view carries the menu; the cards do not. */
export const EVENTS_SORT_OPTIONS: { value: EventsSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "waiting", label: "Most waiting" },
  { value: "name", label: "Name" },
];

export function resolveEventsSort(raw: string | undefined | null): EventsSort {
  return raw === "waiting" || raw === "name" ? raw : "newest";
}

/* ── The lens ────────────────────────────────────────────────────────────── */

/**
 * The bin and the saved events are FILTERS OF THIS LIST, never a chip row
 * (his `density` note read with `home=pulse`: the five-chip inbox goes). The
 * lens renders in BOTH views on purpose — cover cards are the default, so a
 * filter that lived only in the row view would leave a default-view host with
 * no door to their own bin at all.
 *
 * "Deleted" names ONE thing (the board's word, kept): soft-deleted EVENTS in
 * the recovery window. It is not the media bin, which is the event's own.
 */
export type EventsFilter = "all" | "saved" | "deleted";

export const EVENTS_FILTER_OPTIONS: { value: EventsFilter; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "saved", label: "Saved" },
  { value: "deleted", label: "Deleted" },
];

export function resolveEventsFilter(
  raw: string | undefined | null,
): EventsFilter {
  return raw === "saved" || raw === "deleted" ? raw : "all";
}

/* ── One row, whichever view draws it ────────────────────────────────────── */

/**
 * What both views need about one event, already resolved server-side (covers
 * presigned, dates formatted, counts counted). Plain and serializable, so the
 * client control can reorder and re-lens the list without a server round-trip
 * — the management-tool contract: a filter is instant or it is not a filter.
 */
export type EventListRow = {
  id: string;
  kind: "hosted" | "saved" | "deleted";
  name: string;
  /** null = an unopenable card (a saved event since made private, or the bin). */
  href: string | null;
  coverUrl: string | null;
  dateLabel: string;
  /** The event's own date, for the "Newest" order; null sorts last. */
  sortDate: string;
  /** Approved items in the album. */
  items: number;
  /** Signed-in uploaders, when the host's guest list is on; else null. */
  guests: number | null;
  /** The amber count: media waiting on the host's review. */
  pending: number;
  /** "Open" / "Closed" / "Password" / the bin countdown. */
  statusLabel: string | null;
  /** Saved events only: "Hosted by X". */
  byline: string | null;
  /** The one next thing this event wants, already phrased. */
  needs: string | null;
  /**
   * Hosted rows only: what the cover card's QR chip needs to open the share
   * dialog. Null on saved and deleted rows, which have no QR to offer — a
   * saved event is somebody else's, and a deleted one is not shareable.
   */
  qr: { token: string; style: string } | null;
};

/**
 * ★ A STABLE SORT, AND `localeCompare` FOR THE NAME. Array.prototype.sort is
 * stable in every engine we ship to, so equal keys keep the incoming order
 * (newest-first), which is what makes "Most waiting" read sensibly when four
 * events are all waiting on nothing. The name order uses localeCompare rather
 * than `<`, or "Ángela" sorts after "Zoe" for a host whose guests have accents.
 */
export function sortEventRows(
  rows: EventListRow[],
  sort: EventsSort,
): EventListRow[] {
  const out = [...rows];
  if (sort === "name") {
    out.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    return out;
  }
  if (sort === "waiting") {
    out.sort((a, b) => b.pending - a.pending);
    return out;
  }
  out.sort((a, b) => (a.sortDate < b.sortDate ? 1 : a.sortDate > b.sortDate ? -1 : 0));
  return out;
}

export function filterEventRows(
  rows: EventListRow[],
  filter: EventsFilter,
): EventListRow[] {
  if (filter === "saved") return rows.filter((r) => r.kind === "saved");
  if (filter === "deleted") return rows.filter((r) => r.kind === "deleted");
  // "All events" is the live list: hosted and saved together, interleaved by
  // recency exactly as the merged Events tab always was. The bin is NEVER in
  // it — a deleted event appearing among live ones is how a host restores the
  // wrong thing.
  return rows.filter((r) => r.kind !== "deleted");
}
