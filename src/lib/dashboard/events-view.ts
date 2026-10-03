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

import type { Marks } from "./attention";
import type { Season } from "./seasons";

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
 * The bin and the events you added to are FILTERS OF THIS LIST, never a chip
 * row (his `density` note read with `home=pulse`: the five-chip inbox goes).
 * They render in BOTH views on purpose, so a host on the default view always
 * has a door to her own bin.
 *
 * ★ ONE ROW OF COUNTS, NOT A MENU (host-dashboard r1, drawn under every option
 * of the board's `events` ask): All, the events you host, the events you added
 * to and the bin, each with its number, said at once and one press each, where
 * the Show menu hid three lenses and every number behind a press. A lens with
 * nothing in it is not drawn, All excepted.
 *
 * "Guest" names the events this account ADDED PHOTOS TO at someone else's
 * party (guest by upload, Will 2026-09-22: a person is a guest of an event only
 * through an upload of theirs), in the profile's own word. "Deleted" names ONE
 * thing: soft-deleted EVENTS in the recovery window, never the media bin, which
 * is the event's own.
 */
export type EventsFilter = "all" | "hosting" | "guest" | "deleted";

export const EVENTS_FILTER_OPTIONS: { value: EventsFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hosting", label: "Hosting" },
  { value: "guest", label: "Guest" },
  { value: "deleted", label: "Deleted" },
];

/**
 * Narrows a stored or hand-typed value to a lens. The retired "saved" (save
 * died with guest by upload) resolves to "all", like any other stranger.
 */
export function resolveEventsFilter(
  raw: string | undefined | null,
): EventsFilter {
  return raw === "hosting" || raw === "guest" || raw === "deleted"
    ? raw
    : "all";
}

/* ── One row, whichever view draws it ────────────────────────────────────── */

/**
 * What both views need about one event, already resolved server-side (covers
 * presigned, dates formatted, counts counted, its group by when and its marks
 * decided). Plain and serializable, so the client can re-lens, search and
 * reorder the list without a server round-trip: the management-tool contract,
 * a filter is instant or it is not a filter.
 */
export type EventListRow = {
  id: string;
  kind: "hosted" | "guest" | "deleted";
  name: string;
  /** null = an unopenable tile (a guest album since made private, or the bin). */
  href: string | null;
  coverUrl: string | null;
  /**
   * Hosted rows only: the stills the tile dissolves through in its turn, the cover first
   * (`getEventCardStills`). Empty on guest and deleted rows, which hold their cover.
   */
  stills: string[];
  /** The rows view's date in full ("October 3, 2026", "October 3–5, 2026", "No date set"), or a guest album's line. */
  dateLabel: string;
  /** The tile's when, in the fewest exact words (`whenOf`): "Tomorrow", "Sat, Sep 26", "Day 2 of 3", "No date". */
  when: string;
  /** A cover-less hosted tile's face: its date as an invitation sets it; null when it has no date. */
  face: { weekday: string; month: string; day: string } | null;
  /**
   * The row's recency for the "Newest" order: a hosted event's creation, a
   * guest row's newest live upload of yours, a binned event's deletion.
   */
  sortDate: string;
  /** Approved items in the album (hosted rows; a guest row carries 0 and never shows it). */
  items: number;
  /** The amber count: media waiting on the host's review. */
  pending: number;
  /** People waiting at the door for the host to let them in. */
  waiting: number;
  /** Open / Paused (`uploadsLabel`), "Password" on a guest row, or the bin countdown. */
  statusLabel: string | null;
  /** Guest rows only: "Hosted by X". */
  byline: string | null;
  /** Hosted rows only: the marks its tile wears (`marksOf`), Live and one state. */
  marks: Marks | null;
  /** The group by when it sits in (`seasonsOf`, or "guest"); null in the bin. */
  seasonId: string | null;
};

/** A group of the events by when, as the gallery view lays it out: its rows' ids in its own order. */
export type EventSeason = Season;

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
    out.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
    return out;
  }
  if (sort === "waiting") {
    // People at a door wait as surely as an upload does (the doors, event-settings r1).
    out.sort((a, b) => b.pending + b.waiting - (a.pending + a.waiting));
    return out;
  }
  out.sort((a, b) =>
    a.sortDate < b.sortDate ? 1 : a.sortDate > b.sortDate ? -1 : 0,
  );
  return out;
}

export function filterEventRows(
  rows: EventListRow[],
  filter: EventsFilter,
): EventListRow[] {
  if (filter === "hosting") return rows.filter((r) => r.kind === "hosted");
  if (filter === "guest") return rows.filter((r) => r.kind === "guest");
  if (filter === "deleted") return rows.filter((r) => r.kind === "deleted");
  // "All" is the live list: the events you host and the events you
  // added to, interleaved by recency. The bin is NEVER in it — a deleted event
  // appearing among live ones is how a host restores the wrong thing.
  return rows.filter((r) => r.kind !== "deleted");
}

/** How many rows each lens holds: the numbers the lens row says beside its words. */
export function lensCounts(
  rows: readonly EventListRow[],
): Record<EventsFilter, number> {
  const hosting = rows.filter((r) => r.kind === "hosted").length;
  const guest = rows.filter((r) => r.kind === "guest").length;
  return {
    all: hosting + guest,
    hosting,
    guest,
    deleted: rows.filter((r) => r.kind === "deleted").length,
  };
}

/** A name as a search reads it: lower case, accents off, so "angela" finds "Ángela's wedding". */
const folded = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/**
 * THE SEARCH, PAST EIGHT EVENTS (host-dashboard r1's drawn lens bar; his `events` note: a planner
 * bouncing between old events back to back should never have to scroll for one): the rows whose name
 * holds every word typed, in the list's own order. An empty query is the whole list.
 */
export function searchEventRows(
  rows: EventListRow[],
  query: string,
): EventListRow[] {
  const words = folded(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return rows;
  return rows.filter((r) => {
    const name = folded(r.name);
    return words.every((w) => name.includes(w));
  });
}

/** From this many events (hosted and added to) the lens row carries the search. */
export const EVENTS_SEARCH_FROM = 9;
