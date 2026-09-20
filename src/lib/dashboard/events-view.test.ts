// @contract-for: src/lib/dashboard/events-view.ts
import { describe, expect, it } from "vitest";

import {
  DEFAULT_EVENTS_VIEW,
  type EventListRow,
  filterEventRows,
  resolveEventsFilter,
  resolveEventsSort,
  resolveEventsView,
  sortEventRows,
} from "./events-view";

/**
 * THE EVENTS LIST'S TWO VIEWS, THE ORDER AND THE LENS (home-wiring, 2026-09-20).
 *
 * What is pinned is the BEHAVIOUR Will's `density=cover` note bought, not the
 * chrome that draws it:
 *
 *   1. COVER CARDS ARE THE DEFAULT, and an unreadable cookie resolves to them
 *      rather than throwing or picking rows. The view is read on the SERVER to
 *      paint the first frame, so an unparseable value must be a safe default,
 *      never an exception on a host's home page.
 *   2. THE BIN IS NEVER IN THE LIVE LIST. "All events" means hosted and saved;
 *      a deleted event appearing among live ones is how a host restores or
 *      opens the wrong thing.
 *   3. THE ORDER IS STABLE. Equal keys keep the incoming recency order, which
 *      is what makes "Most waiting" readable when nothing is waiting.
 */

const row = (over: Partial<EventListRow>): EventListRow => ({
  id: "e",
  kind: "hosted",
  name: "Event",
  href: "/dashboard/e",
  coverUrl: null,
  dateLabel: "No date set",
  sortDate: "2026-09-01T00:00:00.000Z",
  items: 0,
  guests: null,
  pending: 0,
  statusLabel: null,
  byline: null,
  needs: null,
  qr: null,
  ...over,
});

describe("which view paints first", () => {
  it("defaults to the cover cards", () => {
    expect(DEFAULT_EVENTS_VIEW).toBe("cards");
    expect(resolveEventsView(undefined)).toBe("cards");
    expect(resolveEventsView(null)).toBe("cards");
    expect(resolveEventsView("")).toBe("cards");
  });

  it("honours a stored choice and refuses anything else", () => {
    expect(resolveEventsView("rows")).toBe("rows");
    expect(resolveEventsView("cards")).toBe("cards");
    // A hand-forged cookie is not a trust boundary, but it IS a value this app
    // reads back, so it can only ever narrow to the two legal views.
    expect(resolveEventsView("table")).toBe("cards");
    expect(resolveEventsView("__proto__")).toBe("cards");
  });

  it("narrows the order and the lens the same way", () => {
    expect(resolveEventsSort(undefined)).toBe("newest");
    expect(resolveEventsSort("waiting")).toBe("waiting");
    expect(resolveEventsSort("sideways")).toBe("newest");
    expect(resolveEventsFilter(undefined)).toBe("all");
    expect(resolveEventsFilter("deleted")).toBe("deleted");
    expect(resolveEventsFilter("everything")).toBe("all");
  });
});

describe("the lens", () => {
  const rows = [
    row({ id: "h", kind: "hosted" }),
    row({ id: "s", kind: "saved" }),
    row({ id: "d", kind: "deleted" }),
  ];

  it("keeps the bin out of the live list", () => {
    expect(filterEventRows(rows, "all").map((r) => r.id)).toEqual(["h", "s"]);
  });

  it("shows exactly one kind when asked for one", () => {
    expect(filterEventRows(rows, "saved").map((r) => r.id)).toEqual(["s"]);
    expect(filterEventRows(rows, "deleted").map((r) => r.id)).toEqual(["d"]);
  });
});

describe("the order", () => {
  it("sorts newest first by the row's own recency key", () => {
    const rows = [
      row({ id: "old", sortDate: "2026-01-01T00:00:00.000Z" }),
      row({ id: "new", sortDate: "2026-09-01T00:00:00.000Z" }),
    ];
    expect(sortEventRows(rows, "newest").map((r) => r.id)).toEqual([
      "new",
      "old",
    ]);
  });

  it("sorts by what is waiting, and stays stable where nothing is", () => {
    const rows = [
      row({ id: "a", pending: 0 }),
      row({ id: "b", pending: 9 }),
      row({ id: "c", pending: 0 }),
    ];
    expect(sortEventRows(rows, "waiting").map((r) => r.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("sorts names the way a person reads them, accents included", () => {
    const rows = [
      row({ id: "z", name: "Zoe's leaving do" }),
      row({ id: "a", name: "Ángela's wedding" }),
    ];
    expect(sortEventRows(rows, "name").map((r) => r.id)).toEqual(["a", "z"]);
  });

  it("never mutates the list it was handed", () => {
    const rows = [row({ id: "a", pending: 0 }), row({ id: "b", pending: 5 })];
    sortEventRows(rows, "waiting");
    expect(rows.map((r) => r.id)).toEqual(["a", "b"]);
  });
});
