/**
 * THE EVENTS LIST'S ROW, ITS LENS AND ITS SEARCH (host-dashboard r1's lens and r3's `events=menu`): what
 * one event is to the list, resolved on the server and plain, so the client lays the list out (`display.ts`:
 * the layout, the order, the filters, the groups) without a round trip, the management-tool contract: a
 * filter is instant or it is not a filter.
 *
 * Pure + node-safe: the server page and the client section share one definition of a row. How the list is
 * SHOWN is the host's own choice and is kept on her account (`profiles.events_display`, `display.ts`); the
 * old cookie that kept the two-way view toggle is gone with the toggle.
 */

import type { Marks } from "./attention";

/* ── The lens ────────────────────────────────────────────────────────────── */

/**
 * The bin and the events you added to are FILTERS OF THIS LIST, never a chip row (his `density` note read
 * with `home=pulse`: the five-chip inbox goes): Display's Show says whose (All, Hosting, Guest, Deleted),
 * each with its number. A lens with nothing in it is not offered, All excepted (and the one she has set,
 * so it can always be undone).
 *
 * "Guest" names the events this account ADDED PHOTOS TO at someone else's party (guest by upload, Will
 * 2026-09-22: a person is a guest of an event only through an upload of theirs), in the profile's own
 * word. "Deleted" names ONE thing: soft-deleted EVENTS in the recovery window, never the media bin, which
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

/* ── One row, whichever layout draws it ──────────────────────────────────── */

/**
 * What every layout needs about one event, already resolved server-side (covers presigned, dates
 * formatted, counts counted, its marks decided, the three facts the Display rules read). Plain and
 * serializable, so the client can re-lens, search, reorder and group the list without a server
 * round-trip.
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
  /**
   * The day it sits on, `YYYY-MM-DD`: a hosted event's (`dayOf`: the host's date, else the day its newest
   * photographs landed), a guest album's newest upload of hers, a deleted event's date. What the Event date
   * order, the Upcoming and Past filters and the year read; null for an undated, empty album.
   */
  day: string | null;
  /** Whether its host set a date: the No date filter's fact (a day inferred from photographs is not one). */
  dated: boolean;
  /**
   * When the host last pressed into it from her dashboard (`events.host_opened_at`), hosted rows only; null
   * for one never opened. What the Last opened order and the Recent row read.
   */
  openedAt: string | null;
};

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

/** How many rows each lens holds: the numbers Display's Show says beside its words. */
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

/** From this many events (hosted and added to) the section's head carries the search. */
export const EVENTS_SEARCH_FROM = 9;
