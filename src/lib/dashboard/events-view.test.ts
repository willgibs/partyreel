import { describe, expect, it } from "vitest";

import {
  type EventListRow,
  filterEventRows,
  lensCounts,
  resolveEventsFilter,
  searchEventRows,
} from "./events-view";

/**
 * THE EVENTS LIST'S LENS AND SEARCH (home-wiring, 2026-09-20; the layouts, the order and the groups moved to
 * `display.ts`, host-dashboard r3).
 *
 * What is pinned is the BEHAVIOUR, not the chrome that draws it:
 *
 *   1. THE LENS NARROWS ANYTHING IT IS HANDED to one of its four values: it is read off a profile column a hand may
 *      have written, so a stranger must be a safe default, never an exception on a host's home page.
 *   2. THE BIN IS NEVER IN THE LIVE LIST. "All events" means the events you host and the events you added to (guest
 *      by upload, 2026-09-22); a deleted event appearing among live ones is how a host restores or opens the wrong
 *      thing.
 *   3. THE SEARCH FINDS A NAME BY EVERY WORD, accents and case aside.
 */

const row = (over: Partial<EventListRow>): EventListRow => ({
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

describe("which lens", () => {
  it("narrows whatever it is handed to one of the four, All by default", () => {
    expect(resolveEventsFilter(undefined)).toBe("all");
    expect(resolveEventsFilter(null)).toBe("all");
    expect(resolveEventsFilter("deleted")).toBe("deleted");
    expect(resolveEventsFilter("guest")).toBe("guest");
    expect(resolveEventsFilter("hosting")).toBe("hosting");
    expect(resolveEventsFilter("everything")).toBe("all");
    expect(resolveEventsFilter("__proto__")).toBe("all");
  });

  it("resolves the retired Saved lens to All events", () => {
    // Save died with guest by upload (2026-09-22); a value stored or typed before that is a
    // stranger like any other, never a lens that no longer exists.
    expect(resolveEventsFilter("saved")).toBe("all");
  });
});

describe("the lens", () => {
  const rows = [
    row({ id: "h", kind: "hosted" }),
    row({ id: "g", kind: "guest" }),
    row({ id: "d", kind: "deleted" }),
  ];

  it("keeps the bin out of the live list, and the events you added to in it", () => {
    expect(filterEventRows(rows, "all").map((r) => r.id)).toEqual(["h", "g"]);
  });

  it("shows exactly one kind when asked for one", () => {
    expect(filterEventRows(rows, "hosting").map((r) => r.id)).toEqual(["h"]);
    expect(filterEventRows(rows, "guest").map((r) => r.id)).toEqual(["g"]);
    expect(filterEventRows(rows, "deleted").map((r) => r.id)).toEqual(["d"]);
  });

  it("counts every lens at once, All being the live list", () => {
    expect(lensCounts(rows)).toEqual({
      all: 2,
      hosting: 1,
      guest: 1,
      deleted: 1,
    });
  });
});

describe("the search", () => {
  const rows = [
    row({ id: "a", name: "Ángela's Wedding" }),
    row({ id: "b", name: "Leo Turns 40" }),
    row({ id: "c", name: "Ines & Tom's Rehearsal Dinner" }),
  ];

  it("finds a name by every word typed, accents and case aside, in the list's own order", () => {
    expect(searchEventRows(rows, "angela").map((r) => r.id)).toEqual(["a"]);
    expect(searchEventRows(rows, "  TOM   dinner ").map((r) => r.id)).toEqual([
      "c",
    ]);
    expect(searchEventRows(rows, "tom wedding")).toEqual([]);
  });

  it("is the whole list with nothing typed", () => {
    expect(searchEventRows(rows, "   ")).toBe(rows);
  });
});
