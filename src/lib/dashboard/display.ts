/**
 * HOW YOUR EVENTS ARE SHOWN, AND KEPT (host-dashboard r3, Will 2026-10-04: `events=menu`, and the board's carried
 * call `kept` taken as written: "On her account, so her phone opens the way her laptop left it"). One Display menu
 * over one collection: the layout (gallery, table, list), the order and its direction, what shows (whose, when, a
 * year), the groups and the covers' size. Defaults are quiet (covers, the newest first, nothing grouped or filtered),
 * so a host with ten events sees ten covers and nothing to set.
 *
 * Pure and node-safe, so the server page (which reads her kept choices and paints the first frame in them) and the
 * client section (which lays the list out instantly, with no round trip: a filter is instant or it is not a filter)
 * share one definition of every rule, and each is pinned (`display.test.ts`).
 *
 * ★ WHAT IS KEPT IS SPARSE AND NEVER TRUSTED. `profiles.events_display` holds only what differs from the defaults
 * (`storedDisplay`), so `{}` is every default and a default changed later reaches everyone who never chose; every key
 * is narrowed on every read (`resolveDisplay`), so a value a hand wrote straight through PostgREST, or one a later
 * build dropped, can only ever fall back to a default. The column's own CHECK is an envelope (an object, 512 bytes).
 *
 * ★ A KEY A ROW HAS NOTHING FOR SORTS AFTER THE REST, EITHER WAY: an undated event by date, an event she never
 * opened by Last opened, a guest album by size. A tie keeps the newest made first, and two made at one instant fall to
 * their ids, so every order is total over distinct rows: a sort never shuffles, and her list is the same whatever order
 * its rows arrive in (the dashboard recomposes it around another lead on a press, `leading.ts`, and the two must agree).
 */

import {
  EVENTS_FILTER_OPTIONS,
  type EventListRow,
  type EventsFilter,
  filterEventRows,
  lensCounts,
  resolveEventsFilter,
  searchEventRows,
} from "./events-view";
import { daysFrom } from "./when";

/* ── What there is to choose ─────────────────────────────────────────────── */

export type Layout = "gallery" | "table" | "list";
export type SortKey =
  | "made"
  | "date"
  | "opened"
  | "name"
  | "photos"
  | "waiting";
export type WhenFilter = "any" | "upcoming" | "past" | "undated";
export type GroupBy = "none" | "year";
export type TileScale = "s" | "m" | "l";
export type RecentState = "open" | "folded";

export const LAYOUTS: readonly { id: Layout; label: string }[] = [
  { id: "gallery", label: "Gallery" },
  { id: "table", label: "Table" },
  { id: "list", label: "List" },
];

/**
 * The orders, in the words the table's columns use: "In the album", never "photos", because the count includes video
 * (the stage says the same, dashboard.md).
 */
export const SORTS: readonly { id: SortKey; label: string }[] = [
  { id: "made", label: "Newest" },
  { id: "date", label: "Event date" },
  { id: "opened", label: "Last opened" },
  { id: "name", label: "Name" },
  { id: "photos", label: "In the album" },
  { id: "waiting", label: "Waiting" },
];

export const WHENS: readonly { id: WhenFilter; label: string }[] = [
  { id: "any", label: "Any time" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "undated", label: "No date" },
];

export const GROUPS: readonly { id: GroupBy; label: string }[] = [
  { id: "none", label: "None" },
  { id: "year", label: "By year" },
];

export const SCALES: readonly { id: TileScale; label: string }[] = [
  { id: "s", label: "S" },
  { id: "m", label: "M" },
  { id: "l", label: "L" },
];

/** Everything kept for one host: the menu's choices, and whether the Recent row is folded. */
export type Display = {
  layout: Layout;
  sort: SortKey;
  /** Newest, latest, largest or Z first; a press on a sort's direction turns it round. */
  desc: boolean;
  lens: EventsFilter;
  when: WhenFilter;
  /** `YYYY`, or null for every year. */
  year: string | null;
  group: GroupBy;
  scale: TileScale;
  /** Her own press on the Recent row's Hide: kept with her choices, but never one of them (no badge, no Reset). */
  recent: RecentState;
};

/** A sort's natural direction: names A to Z, everything else the most or newest first. */
export const naturalDesc = (sort: SortKey): boolean => sort !== "name";

/** THE QUIET DEFAULT (his r2 note: "All of these still feel like they're over-organizing"). */
export const DISPLAY_DEFAULT: Display = {
  layout: "gallery",
  sort: "made",
  desc: true,
  lens: "all",
  when: "any",
  year: null,
  group: "none",
  scale: "m",
  recent: "open",
};

/* ── Kept, and read back ─────────────────────────────────────────────────── */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const oneOf = <T extends string>(
  all: readonly { id: T }[],
  value: unknown,
  fallback: T,
): T => (all.some((o) => o.id === value) ? (value as T) : fallback);

const YEAR = /^\d{4}$/;

/**
 * Whatever the column holds, as the choices it can mean: every key narrowed to its legal values, a stranger (a key a
 * later build dropped, a value written by hand, a column that does not exist yet) falling back to its default. A
 * missing direction is the order's own natural one.
 */
export function resolveDisplay(raw: unknown): Display {
  const o = isRecord(raw) ? raw : {};
  const sort = oneOf(SORTS, o.sort, DISPLAY_DEFAULT.sort);
  return {
    layout: oneOf(LAYOUTS, o.layout, DISPLAY_DEFAULT.layout),
    sort,
    desc: typeof o.desc === "boolean" ? o.desc : naturalDesc(sort),
    lens: resolveEventsFilter(typeof o.lens === "string" ? o.lens : null),
    when: oneOf(WHENS, o.when, DISPLAY_DEFAULT.when),
    year: typeof o.year === "string" && YEAR.test(o.year) ? o.year : null,
    group: oneOf(GROUPS, o.group, DISPLAY_DEFAULT.group),
    scale: oneOf(SCALES, o.scale, DISPLAY_DEFAULT.scale),
    recent: o.recent === "folded" ? "folded" : "open",
  };
}

/**
 * What the column keeps: only what differs from the defaults, and the direction only when it is not the order's own, so
 * `resolveDisplay(storedDisplay(d))` is `d` and `{}` is every default.
 */
export function storedDisplay(d: Display): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  if (d.layout !== DISPLAY_DEFAULT.layout) out.layout = d.layout;
  if (d.sort !== DISPLAY_DEFAULT.sort) out.sort = d.sort;
  if (d.desc !== naturalDesc(d.sort)) out.desc = d.desc;
  if (d.lens !== DISPLAY_DEFAULT.lens) out.lens = d.lens;
  if (d.when !== DISPLAY_DEFAULT.when) out.when = d.when;
  if (d.year !== null) out.year = d.year;
  if (d.group !== DISPLAY_DEFAULT.group) out.group = d.group;
  if (d.scale !== DISPLAY_DEFAULT.scale) out.scale = d.scale;
  if (d.recent !== DISPLAY_DEFAULT.recent) out.recent = d.recent;
  return out;
}

/* ── What a choice says ──────────────────────────────────────────────────── */

export const sortLabel = (id: SortKey): string =>
  SORTS.find((s) => s.id === id)?.label ?? id;

/** What a direction says for an order: "Newest first", "A to Z". */
export function directionWords(sort: SortKey, desc: boolean): string {
  switch (sort) {
    case "name":
      return desc ? "Z to A" : "A to Z";
    case "made":
      return desc ? "Newest first" : "Oldest first";
    case "date":
      return desc ? "Latest first" : "Soonest first";
    case "opened":
      return desc ? "Most recent first" : "Least recent first";
    default:
      return desc ? "Most first" : "Fewest first";
  }
}

/**
 * THE CHOICES THAT DIFFER FROM THE DEFAULT, in words: what the Display button counts and the quiet line under the head
 * says ("Table · Event date · 2023"). The cover size counts only where it shows (a gallery), and Recent's fold never
 * does: it is a press of its own, not a menu choice.
 */
export function changed(d: Display): string[] {
  const out: string[] = [];
  if (d.layout !== DISPLAY_DEFAULT.layout)
    out.push(LAYOUTS.find((l) => l.id === d.layout)?.label ?? d.layout);
  const reversed = d.desc !== naturalDesc(d.sort);
  if (d.sort !== DISPLAY_DEFAULT.sort || reversed)
    out.push(`${sortLabel(d.sort)}${reversed ? ", reversed" : ""}`);
  if (d.lens !== "all")
    out.push(
      EVENTS_FILTER_OPTIONS.find((o) => o.value === d.lens)?.label ?? d.lens,
    );
  if (d.when !== "any")
    out.push(WHENS.find((w) => w.id === d.when)?.label ?? d.when);
  if (d.year) out.push(d.year);
  if (d.group !== "none") out.push("By year");
  if (d.layout === "gallery" && d.scale !== DISPLAY_DEFAULT.scale)
    out.push(d.scale === "l" ? "Large covers" : "Small covers");
  return out;
}

/** Reset: every choice back to its default, Recent's fold left as she pressed it. */
export const resetChoices = (d: Display): Display => ({
  ...DISPLAY_DEFAULT,
  recent: d.recent,
});

/* ── The collection, laid out her way ────────────────────────────────────── */

const instant = (iso: string): number => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
};

const yearOf = (r: EventListRow): string | null => r.day?.slice(0, 4) ?? null;

/** The years her events sit in, newest first: the menu's year chips (and the one she has set, so it can be undone). */
export function yearsOf(
  rows: readonly EventListRow[],
  keep: string | null = null,
): string[] {
  const years = new Set<string>();
  for (const r of rows) {
    const y = r.kind === "deleted" ? null : yearOf(r);
    if (y) years.add(y);
  }
  if (keep) years.add(keep);
  return [...years].sort((a, b) => b.localeCompare(a));
}

function passesWhen(r: EventListRow, when: WhenFilter, today: string): boolean {
  if (when === "any") return true;
  if (when === "undated") return r.kind === "hosted" && !r.dated;
  // An undated, empty album has no day at all and waits with what is coming (`seasons.ts`' old rule, kept).
  if (when === "upcoming") return r.day === null || daysFrom(today, r.day) >= 0;
  return r.day !== null && daysFrom(today, r.day) < 0;
}

/** The rows her filters keep: whose, then when, then the year. */
export function filtered(
  rows: readonly EventListRow[],
  d: Pick<Display, "lens" | "when" | "year">,
  today: string,
): EventListRow[] {
  return filterEventRows([...rows], d.lens).filter(
    (r) => passesWhen(r, d.when, today) && (!d.year || yearOf(r) === d.year),
  );
}

/**
 * HER ORDER, every key with a direction. A key a row has nothing for sorts after the rest either way, and a tie keeps
 * the newest made first.
 */
export function sorted(
  rows: readonly EventListRow[],
  sort: SortKey,
  desc: boolean,
): EventListRow[] {
  const made = (a: EventListRow, b: EventListRow) =>
    instant(b.sortDate) - instant(a.sortDate) || a.id.localeCompare(b.id);
  const dir = desc ? -1 : 1;
  const keyed =
    (key: (r: EventListRow) => number | string | null) =>
    (a: EventListRow, b: EventListRow): number => {
      const x = key(a);
      const y = key(b);
      if (x === null && y === null) return made(a, b);
      if (x === null) return 1;
      if (y === null) return -1;
      if (x < y) return -dir;
      if (x > y) return dir;
      return made(a, b);
    };
  const out = [...rows];
  if (sort === "made") out.sort((a, b) => (desc ? made(a, b) : made(b, a)));
  else if (sort === "date") out.sort(keyed((r) => r.day));
  else if (sort === "opened")
    out.sort(keyed((r) => (r.openedAt ? instant(r.openedAt) : null)));
  else if (sort === "name")
    out.sort(
      (a, b) =>
        (desc
          ? b.name.localeCompare(a.name, undefined, { numeric: true })
          : a.name.localeCompare(b.name, undefined, { numeric: true })) ||
        made(a, b),
    );
  else if (sort === "photos")
    out.sort(keyed((r) => (r.kind === "hosted" ? r.items : null)));
  else out.sort(keyed((r) => r.pending + r.waiting || null));
  return out;
}

export type Group = { id: string; label: string; rows: EventListRow[] };

/**
 * Her events, filtered, searched, ordered and grouped as she set them. Grouped by year, each year is a group in the
 * order its first event comes in her order (so a date order reads as a calendar), the events with no day at all under
 * "No date yet".
 */
export function arrange(
  rows: readonly EventListRow[],
  d: Display,
  today: string,
  query = "",
): Group[] {
  const kept = searchEventRows(filtered(rows, d, today), query);
  const ordered = sorted(kept, d.sort, d.desc);
  if (d.group === "none") return [{ id: "all", label: "", rows: ordered }];
  const groups = new Map<string, Group>();
  for (const r of ordered) {
    const year = yearOf(r);
    const id = year ?? "undated";
    const group = groups.get(id) ?? {
      id,
      label: year ?? "No date yet",
      rows: [],
    };
    group.rows.push(r);
    groups.set(id, group);
  }
  return [...groups.values()];
}

/* ── What the section offers ─────────────────────────────────────────────── */

/**
 * The lenses Display's Show offers: All always, a lens with something in it, and the one she has set (so it can be
 * undone), each with its number.
 */
export function lensOptions(
  counts: Record<EventsFilter, number>,
  active: EventsFilter,
): { id: EventsFilter; label: string; count: number }[] {
  return EVENTS_FILTER_OPTIONS.filter(
    (o) => o.value === "all" || o.value === active || counts[o.value] > 0,
  ).map((o) => ({ id: o.value, label: o.label, count: counts[o.value] }));
}

/**
 * THE DISPLAY BUTTON shows from a second event, or whenever Deleted holds one: the bin's Restore lives only here, so
 * a host with one live event and one deleted must still be able to reach it.
 */
export function offersDisplay(rows: readonly EventListRow[]): boolean {
  const counts = lensCounts(rows);
  return counts.all > 1 || counts.deleted > 0;
}

/** How many events the Recent row holds: one row of covers at a desk. */
export const RECENT_MAX = 4;

/**
 * From this many events (hosted and added to, the stage's own included) the Recent row shows: below it every event is
 * on the first screen of her events anyway, and a row of the last few would only repeat them.
 */
export const RECENT_FROM = 7;

/**
 * THE RECENT ROW: the events she opened lately, newest first, as the rows the collection already draws; never an event
 * already standing above it (the stage's, this week's), nor a guest album or a deleted event (only a host's own event
 * is stamped).
 */
export function recentRowsOf(
  rows: readonly EventListRow[],
  above: ReadonlySet<string>,
  max = RECENT_MAX,
): EventListRow[] {
  return rows
    .filter(
      (r) => r.kind === "hosted" && r.openedAt !== null && !above.has(r.id),
    )
    .sort(
      (a, b) =>
        instant(b.openedAt!) - instant(a.openedAt!) || a.id.localeCompare(b.id),
    )
    .slice(0, max);
}
