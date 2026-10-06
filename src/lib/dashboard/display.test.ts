import { describe, expect, it } from "vitest";

import {
  arrange,
  changed,
  DISPLAY_DEFAULT,
  type Display,
  directionWords,
  filtered,
  lensOptions,
  naturalDesc,
  offersDisplay,
  recentRowsOf,
  resetChoices,
  resolveDisplay,
  SORTS,
  sorted,
  storedDisplay,
  yearsOf,
} from "./display";
import { type EventListRow, lensCounts } from "./events-view";

/**
 * HOW YOUR EVENTS ARE SHOWN, AND KEPT (host-dashboard r3, `events=menu`), pinned as rules, never looks:
 *
 *   1. WHAT IS KEPT IS NARROWED ON EVERY READ AND SPARSE ON EVERY WRITE: a stranger in the column is a default, and
 *      what is written is only what differs from the defaults, so `{}` is every default and a round trip is exact.
 *   2. A KEY A ROW HAS NOTHING FOR SORTS AFTER THE REST, EITHER WAY, and a tie keeps the newest made first.
 *   3. THE FILTERS SAY WHAT THEY NAME: the bin is never in All, an undated empty album waits with what is coming, a
 *      day inferred from photographs is no host's date.
 *   4. THE RECENT ROW IS THE HOST'S OWN EVENTS SHE OPENED, newest open first, never one already standing above it.
 */

const row = (over: Partial<EventListRow> = {}): EventListRow => ({
  id: "e",
  kind: "hosted",
  name: "Event",
  href: "/dashboard/e",
  coverUrl: null,
  stills: [],
  dateLabel: "No date set",
  when: "No date",
  face: null,
  sortDate: "2026-09-01T00:00:00.000Z",
  items: 0,
  pending: 0,
  waiting: 0,
  statusLabel: null,
  byline: null,
  marks: null,
  day: null,
  dated: false,
  openedAt: null,
  ...over,
});

const ids = (rows: readonly EventListRow[]) => rows.map((r) => r.id);
const TODAY = "2026-10-02";

describe("what is kept", () => {
  it("is every default when nothing, or nothing usable, is kept", () => {
    for (const raw of [undefined, null, "table", 7, [], [1, 2], {}])
      expect(resolveDisplay(raw)).toEqual(DISPLAY_DEFAULT);
  });

  it("narrows every key to its legal values, a stranger falling back to its default", () => {
    const strange = resolveDisplay({
      layout: "carousel",
      sort: "sideways",
      desc: "yes",
      lens: "saved",
      when: "someday",
      year: "20x6",
      group: "month",
      scale: "xl",
      recent: "gone",
      extra: "ignored",
    });
    expect(strange).toEqual(DISPLAY_DEFAULT);
    expect(resolveDisplay({ year: "2023" }).year).toBe("2023");
    expect(resolveDisplay({ year: "202" }).year).toBeNull();
    expect(resolveDisplay({ year: 2023 }).year).toBeNull();
  });

  it("reads a missing direction as the order's own: A to Z for names, the newest or most first for the rest", () => {
    expect(resolveDisplay({ sort: "name" }).desc).toBe(false);
    expect(resolveDisplay({ sort: "date" }).desc).toBe(true);
    expect(resolveDisplay({ sort: "name", desc: true }).desc).toBe(true);
    expect(naturalDesc("name")).toBe(false);
    for (const s of SORTS.filter((s) => s.id !== "name"))
      expect(naturalDesc(s.id)).toBe(true);
  });

  it("keeps only what differs from the defaults, so {} is every default", () => {
    expect(storedDisplay(DISPLAY_DEFAULT)).toEqual({});
    expect(
      storedDisplay({
        ...DISPLAY_DEFAULT,
        layout: "table",
        sort: "date",
        year: "2023",
      }),
    ).toEqual({ layout: "table", sort: "date", year: "2023" });
    // A name order in its own direction says no direction; reversed, it says so.
    expect(
      storedDisplay({ ...DISPLAY_DEFAULT, sort: "name", desc: false }),
    ).toEqual({ sort: "name" });
    expect(
      storedDisplay({ ...DISPLAY_DEFAULT, sort: "name", desc: true }),
    ).toEqual({ sort: "name", desc: true });
    expect(storedDisplay({ ...DISPLAY_DEFAULT, recent: "folded" })).toEqual({
      recent: "folded",
    });
  });

  it("round-trips exactly: what is kept reads back as what was chosen", () => {
    const every: Display[] = [];
    for (const layout of ["gallery", "table", "list"] as const)
      for (const sort of SORTS.map((s) => s.id))
        for (const desc of [true, false])
          every.push({
            layout,
            sort,
            desc,
            lens: "hosting",
            when: "past",
            year: "2024",
            group: "year",
            scale: "l",
            recent: "folded",
          });
    every.push(DISPLAY_DEFAULT);
    for (const d of every) expect(resolveDisplay(storedDisplay(d))).toEqual(d);
  });

  it("is small enough for the column's own envelope even with every choice made", () => {
    const biggest = storedDisplay({
      layout: "table",
      sort: "photos",
      desc: false,
      lens: "hosting",
      when: "undated",
      year: "2023",
      group: "year",
      scale: "l",
      recent: "folded",
    });
    expect(JSON.stringify(biggest).length).toBeLessThan(256);
  });
});

describe("what a choice says", () => {
  it("says nothing when nothing differs, and each difference once", () => {
    expect(changed(DISPLAY_DEFAULT)).toEqual([]);
    expect(
      changed({
        ...DISPLAY_DEFAULT,
        layout: "table",
        sort: "date",
        year: "2023",
      }),
    ).toEqual(["Table", "Event date", "2023"]);
    expect(
      changed({
        ...DISPLAY_DEFAULT,
        layout: "list",
        lens: "guest",
        when: "undated",
        group: "year",
      }),
    ).toEqual(["List", "Guest", "No date", "By year"]);
  });

  it("calls a turned-round order reversed, by the order's own direction", () => {
    expect(changed({ ...DISPLAY_DEFAULT, desc: false })).toEqual([
      "Newest, reversed",
    ]);
    // Names run A to Z of their own accord: that is no change; Z to A is.
    expect(changed({ ...DISPLAY_DEFAULT, sort: "name", desc: false })).toEqual([
      "Name",
    ]);
    expect(changed({ ...DISPLAY_DEFAULT, sort: "name", desc: true })).toEqual([
      "Name, reversed",
    ]);
  });

  it("counts the cover size only where it shows, and Recent's fold never", () => {
    expect(changed({ ...DISPLAY_DEFAULT, scale: "l" })).toEqual([
      "Large covers",
    ]);
    expect(changed({ ...DISPLAY_DEFAULT, scale: "s" })).toEqual([
      "Small covers",
    ]);
    expect(
      changed({ ...DISPLAY_DEFAULT, layout: "table", scale: "l" }),
    ).toEqual(["Table"]);
    expect(changed({ ...DISPLAY_DEFAULT, recent: "folded" })).toEqual([]);
  });

  it("resets every choice but leaves Recent as she pressed it", () => {
    expect(
      resetChoices({
        ...DISPLAY_DEFAULT,
        layout: "table",
        year: "2023",
        scale: "l",
        recent: "folded",
      }),
    ).toEqual({ ...DISPLAY_DEFAULT, recent: "folded" });
  });

  it("speaks each direction in the order's own words", () => {
    expect(directionWords("made", true)).toBe("Newest first");
    expect(directionWords("made", false)).toBe("Oldest first");
    expect(directionWords("date", true)).toBe("Latest first");
    expect(directionWords("date", false)).toBe("Soonest first");
    expect(directionWords("opened", true)).toBe("Most recent first");
    expect(directionWords("opened", false)).toBe("Least recent first");
    expect(directionWords("name", false)).toBe("A to Z");
    expect(directionWords("name", true)).toBe("Z to A");
    expect(directionWords("photos", true)).toBe("Most first");
    expect(directionWords("waiting", false)).toBe("Fewest first");
  });

  it("names the album's size as the table does, never photos (the count includes video)", () => {
    expect(SORTS.find((s) => s.id === "photos")?.label).toBe("In the album");
    expect(SORTS.map((s) => s.label).join(" ")).not.toMatch(/photo/i);
  });
});

describe("her order", () => {
  it("sorts the newest made first, and turns round", () => {
    const rows = [
      row({ id: "old", sortDate: "2026-01-01T00:00:00.000Z" }),
      row({ id: "new", sortDate: "2026-09-01T00:00:00.000Z" }),
      row({ id: "mid", sortDate: "2026-05-01T00:00:00.000Z" }),
    ];
    expect(ids(sorted(rows, "made", true))).toEqual(["new", "mid", "old"]);
    expect(ids(sorted(rows, "made", false))).toEqual(["old", "mid", "new"]);
  });

  it("compares moments, not spellings: one instant written two ways is one instant", () => {
    const rows = [
      row({ id: "a", sortDate: "2026-09-01T10:00:00.000Z" }),
      row({ id: "b", sortDate: "2026-09-01T12:00:00+02:00" }),
    ];
    // 12:00+02:00 is 10:00Z: the same instant, so the tie falls to the ids, in whichever order the rows came.
    expect(ids(sorted(rows, "made", true))).toEqual(["a", "b"]);
    expect(ids(sorted([...rows].reverse(), "made", true))).toEqual(["a", "b"]);
  });

  it("sorts by event date with the undated after the rest, whichever way it runs", () => {
    const rows = [
      row({ id: "none", day: null }),
      row({ id: "june", day: "2026-06-01" }),
      row({ id: "dec", day: "2026-12-12" }),
    ];
    expect(ids(sorted(rows, "date", true))).toEqual(["dec", "june", "none"]);
    expect(ids(sorted(rows, "date", false))).toEqual(["june", "dec", "none"]);
  });

  it("sorts by what she opened last, the never opened after the rest either way", () => {
    const rows = [
      row({ id: "never" }),
      row({ id: "old", openedAt: "2026-09-01T09:00:00.000Z" }),
      row({ id: "last", openedAt: "2026-10-01T09:00:00.000Z" }),
    ];
    expect(ids(sorted(rows, "opened", true))).toEqual(["last", "old", "never"]);
    // Least recent first is the stalest she has opened, and still not the ones she never did.
    expect(ids(sorted(rows, "opened", false))).toEqual([
      "old",
      "last",
      "never",
    ]);
  });

  it("sorts names the way a person reads them, accents and numbers included", () => {
    const rows = [
      row({ id: "z", name: "Zoe's leaving do" }),
      row({ id: "t10", name: "Table 10" }),
      row({ id: "a", name: "Ángela's wedding" }),
      row({ id: "t2", name: "Table 2" }),
    ];
    expect(ids(sorted(rows, "name", false))).toEqual(["a", "t2", "t10", "z"]);
    expect(ids(sorted(rows, "name", true))).toEqual(["z", "t10", "t2", "a"]);
  });

  it("sorts by the album's size for a hosted event, a guest album having none to sort by", () => {
    const rows = [
      row({ id: "guest", kind: "guest", items: 0 }),
      row({ id: "small", items: 3 }),
      row({ id: "big", items: 400 }),
    ];
    expect(ids(sorted(rows, "photos", true))).toEqual([
      "big",
      "small",
      "guest",
    ]);
    expect(ids(sorted(rows, "photos", false))).toEqual([
      "small",
      "big",
      "guest",
    ]);
  });

  it("sorts by what waits, people at a door counting as surely as uploads, and nothing waiting last", () => {
    const rows = [
      row({ id: "quiet" }),
      row({ id: "uploads", pending: 2 }),
      row({ id: "door", waiting: 3 }),
    ];
    expect(ids(sorted(rows, "waiting", true))).toEqual([
      "door",
      "uploads",
      "quiet",
    ]);
  });

  it("★ is a total order: equal names, instants and counts fall to the newest made and then the id, whatever order the rows arrive in", () => {
    // crumbs-82's review: the dashboard recomposes her events around another lead on a press (the drawn lead's row joins the
    // list last), and four events named alike came out `s2, s1, n0` there and `n0, s2, s1` from the server, because the
    // name sort had no tie-break (this file's own header promises one).
    const standups = [
      row({
        id: "n0",
        name: "Weekly standup",
        sortDate: "2026-10-04T09:00:00.000Z",
      }),
      row({
        id: "s1",
        name: "Weekly standup",
        sortDate: "2026-10-01T09:00:00.000Z",
      }),
      row({
        id: "s2",
        name: "Weekly standup",
        sortDate: "2026-10-01T09:00:00.000Z",
      }),
      row({
        id: "s3",
        name: "Weekly standup",
        sortDate: "2026-10-03T09:00:00.000Z",
      }),
    ];
    const arrivals = [
      standups,
      [...standups].reverse(),
      [standups[2]!, standups[0]!, standups[3]!, standups[1]!],
    ];
    for (const sort of SORTS.map((s) => s.id))
      for (const desc of [true, false]) {
        const [first, ...rest] = arrivals.map((rows) =>
          ids(sorted(rows, sort, desc)),
        );
        for (const other of rest)
          expect(other, `${sort} ${desc}`).toEqual(first);
      }
    // The newest made leads among equal names, then the lower id among equal instants.
    expect(ids(sorted(standups, "name", false))).toEqual([
      "n0",
      "s3",
      "s1",
      "s2",
    ]);
  });

  it("keeps the newest made first among equals, and never mutates the list it was handed", () => {
    const rows = [
      row({ id: "a", day: "2026-06-01", sortDate: "2026-01-01T00:00:00.000Z" }),
      row({ id: "b", day: "2026-06-01", sortDate: "2026-09-01T00:00:00.000Z" }),
    ];
    expect(ids(sorted(rows, "date", true))).toEqual(["b", "a"]);
    expect(ids(sorted(rows, "date", false))).toEqual(["b", "a"]);
    expect(ids(rows)).toEqual(["a", "b"]);
  });
});

describe("what shows", () => {
  const rows = [
    row({ id: "host-past", day: "2026-06-01", dated: true }),
    row({ id: "host-soon", day: "2026-10-09", dated: true }),
    row({ id: "host-today", day: TODAY, dated: true }),
    row({ id: "host-blank" }),
    // An undated album placed by its photographs: it has a day, and no date of the host's.
    row({ id: "host-inferred", day: "2026-09-20", dated: false }),
    row({ id: "friend", kind: "guest", day: "2025-08-15", dated: true }),
    row({ id: "bin", kind: "deleted", day: "2024-03-01", dated: true }),
  ];
  const f = (over: Partial<Display>) =>
    ids(filtered(rows, { ...DISPLAY_DEFAULT, ...over }, TODAY));

  it("keeps the bin out of All and offers it through Show", () => {
    expect(f({})).not.toContain("bin");
    expect(f({ lens: "deleted" })).toEqual(["bin"]);
    expect(f({ lens: "guest" })).toEqual(["friend"]);
    expect(f({ lens: "hosting" })).toEqual([
      "host-past",
      "host-soon",
      "host-today",
      "host-blank",
      "host-inferred",
    ]);
  });

  it("calls an event upcoming from its own day on, and an empty undated album upcoming too", () => {
    expect(f({ when: "upcoming" })).toEqual([
      "host-soon",
      "host-today",
      "host-blank",
    ]);
  });

  it("calls an event past once its day has gone, the inferred day included", () => {
    expect(f({ when: "past" })).toEqual([
      "host-past",
      "host-inferred",
      "friend",
    ]);
  });

  it("calls an event undated only when its host set no date: a day from photographs is not one", () => {
    expect(f({ when: "undated" })).toEqual(["host-blank", "host-inferred"]);
  });

  it("filters by a year, the bin and the undated never in one", () => {
    expect(f({ year: "2026" })).toEqual([
      "host-past",
      "host-soon",
      "host-today",
      "host-inferred",
    ]);
    expect(f({ year: "2025" })).toEqual(["friend"]);
    expect(f({ year: "2024" })).toEqual([]);
  });

  it("offers the years her events sit in, newest first, the bin's out, and the one she set so it can be undone", () => {
    expect(yearsOf(rows)).toEqual(["2026", "2025"]);
    expect(yearsOf(rows, "2023")).toEqual(["2026", "2025", "2023"]);
  });
});

describe("her events, laid out", () => {
  const rows = [
    row({
      id: "a",
      name: "Ángela's wedding",
      day: "2026-06-01",
      dated: true,
      sortDate: "2026-05-01T00:00:00.000Z",
    }),
    row({
      id: "b",
      name: "Leo turns 40",
      day: "2025-03-01",
      dated: true,
      sortDate: "2026-09-01T00:00:00.000Z",
    }),
    row({ id: "c", name: "Book club", sortDate: "2026-09-30T00:00:00.000Z" }),
    row({
      id: "d",
      name: "Wedding rehearsal",
      day: "2026-06-02",
      dated: true,
      sortDate: "2026-04-01T00:00:00.000Z",
    }),
  ];

  it("is one unlabelled group when nothing is grouped, her order applied", () => {
    const groups = arrange(rows, DISPLAY_DEFAULT, TODAY);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ id: "all", label: "" });
    expect(ids(groups[0]!.rows)).toEqual(["c", "b", "a", "d"]);
  });

  it("searches the names inside what her filters keep, never past them", () => {
    expect(
      ids(arrange(rows, DISPLAY_DEFAULT, TODAY, "wedding")[0]!.rows),
    ).toEqual(["a", "d"]);
    expect(
      ids(
        arrange(
          rows,
          { ...DISPLAY_DEFAULT, year: "2026" },
          TODAY,
          "wedding",
        )[0]!.rows,
      ),
    ).toEqual(["a", "d"]);
    expect(
      ids(
        arrange(
          rows,
          { ...DISPLAY_DEFAULT, year: "2025" },
          TODAY,
          "wedding",
        )[0]!.rows,
      ),
    ).toEqual([]);
  });

  it("groups by year in the order her order first reaches each, the day-less last of all under their own head", () => {
    const groups = arrange(
      rows,
      { ...DISPLAY_DEFAULT, group: "year", sort: "date", desc: true },
      TODAY,
    );
    expect(groups.map((g) => [g.id, g.label, ids(g.rows)])).toEqual([
      ["2026", "2026", ["d", "a"]],
      ["2025", "2025", ["b"]],
      ["undated", "No date yet", ["c"]],
    ]);
    // Turned round, the calendar reads from its oldest year.
    const back = arrange(
      rows,
      { ...DISPLAY_DEFAULT, group: "year", sort: "date", desc: false },
      TODAY,
    );
    expect(back.map((g) => g.id)).toEqual(["2025", "2026", "undated"]);
  });

  it("is no group at all when nothing is found", () => {
    const groups = arrange(
      rows,
      { ...DISPLAY_DEFAULT, group: "year" },
      TODAY,
      "zzz",
    );
    expect(groups).toEqual([]);
    expect(arrange(rows, DISPLAY_DEFAULT, TODAY, "zzz")[0]!.rows).toEqual([]);
  });
});

describe("what the section offers", () => {
  const counts = { all: 5, hosting: 4, guest: 1, deleted: 0 };

  it("offers every lens with something in it, All always, and the one she has set", () => {
    expect(lensOptions(counts, "all").map((l) => [l.id, l.count])).toEqual([
      ["all", 5],
      ["hosting", 4],
      ["guest", 1],
    ]);
    expect(lensOptions(counts, "deleted").map((l) => l.id)).toEqual([
      "all",
      "hosting",
      "guest",
      "deleted",
    ]);
  });

  it("offers Display from a second event, or whenever the bin holds one", () => {
    expect(offersDisplay([row({ id: "only" })])).toBe(false);
    expect(offersDisplay([row({ id: "one" }), row({ id: "two" })])).toBe(true);
    // One live event and a deleted one: Restore lives only here, so the button must show.
    expect(
      offersDisplay([row({ id: "one" }), row({ id: "bin", kind: "deleted" })]),
    ).toBe(true);
    expect(lensCounts([row({ id: "bin", kind: "deleted" })]).all).toBe(0);
    expect(offersDisplay([row({ id: "bin", kind: "deleted" })])).toBe(true);
    expect(offersDisplay([])).toBe(false);
  });
});

describe("the Recent row", () => {
  it("falls to the id between two events opened in the same moment, whatever order they arrive in", () => {
    const rows = [
      row({ id: "b", openedAt: "2026-10-01T09:00:00.000Z" }),
      row({ id: "a", openedAt: "2026-10-01T09:00:00.000Z" }),
      row({ id: "c", openedAt: "2026-10-01T10:00:00.000Z" }),
    ];
    const set = new Set<string>();
    expect(ids(recentRowsOf(rows, set))).toEqual(["c", "a", "b"]);
    expect(ids(recentRowsOf([...rows].reverse(), set))).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  const rows = [
    row({ id: "stage-adjacent", openedAt: "2026-10-02T09:00:00.000Z" }),
    row({ id: "week", openedAt: "2026-10-02T08:00:00.000Z" }),
    row({ id: "oldest", openedAt: "2026-08-01T00:00:00.000Z" }),
    row({ id: "newest", openedAt: "2026-10-01T00:00:00.000Z" }),
    row({ id: "middle", openedAt: "2026-09-01T00:00:00.000Z" }),
    row({ id: "fourth", openedAt: "2026-08-15T00:00:00.000Z" }),
    row({ id: "fifth", openedAt: "2026-08-10T00:00:00.000Z" }),
    row({ id: "never" }),
    row({ id: "guest", kind: "guest", openedAt: "2026-10-02T10:00:00.000Z" }),
    row({ id: "bin", kind: "deleted", openedAt: "2026-10-02T11:00:00.000Z" }),
  ];

  it("is the host's own events she opened, newest open first, four at most", () => {
    expect(ids(recentRowsOf(rows, new Set()))).toEqual([
      "stage-adjacent",
      "week",
      "newest",
      "middle",
    ]);
  });

  it("never holds an event already standing above it, the stage's or this week's", () => {
    expect(
      ids(recentRowsOf(rows, new Set(["stage-adjacent", "week"]))),
    ).toEqual(["newest", "middle", "fourth", "fifth"]);
  });

  it("holds no guest album and no deleted event, and none she never opened", () => {
    const out = ids(recentRowsOf(rows, new Set(), 20));
    expect(out).not.toContain("guest");
    expect(out).not.toContain("bin");
    expect(out).not.toContain("never");
  });

  it("is empty when she has opened nothing, and never mutates the rows", () => {
    const quiet = [row({ id: "a" }), row({ id: "b" })];
    expect(recentRowsOf(quiet, new Set())).toEqual([]);
    const before = ids(rows);
    recentRowsOf(rows, new Set());
    expect(ids(rows)).toEqual(before);
  });
});
