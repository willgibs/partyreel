/**
 * THE REEL'S ARRIVAL FEED (Will's `arrival=chip`): one chip per person for one hold, a second
 * photograph from the same person counting on their chip ("Theo +2"), people stacking newest first,
 * and past the feed's depth the oldest folding into one line that counts ("+12 more").
 */
import { describe, expect, it } from "vitest";

import {
  ARRIVAL_FEED_DEPTH,
  arrivalLabel,
  arrivalRows,
  nextArrivalExpiry,
  pruneArrivals,
  pushArrivals,
} from "./arrival-feed";

const HOLD = 3000;

describe("pushArrivals", () => {
  it("gives a new person a chip that lives one hold", () => {
    const feed = pushArrivals([], [{ id: "a", name: "Theo" }], 1000, HOLD);
    expect(feed).toEqual([
      { key: "name:Theo", name: "Theo", extra: 0, at: 1000, until: 4000 },
    ]);
  });

  it("counts a second photograph on the same chip and restarts its hold", () => {
    let feed = pushArrivals([], [{ id: "a", name: "Theo" }], 1000, HOLD);
    feed = pushArrivals(feed, [{ id: "b", name: "Theo" }], 2500, HOLD);
    expect(feed).toHaveLength(1);
    expect(feed[0]).toMatchObject({ extra: 1, until: 5500 });
    expect(arrivalLabel(arrivalRows(feed)[0])).toBe("Theo +1");
  });

  it("folds a burst from one person into one chip at once", () => {
    const feed = pushArrivals(
      [],
      Array.from({ length: 13 }, (_, i) => ({ id: `p${i}`, name: "Theo" })),
      0,
      HOLD,
    );
    expect(arrivalRows(feed).map(arrivalLabel)).toEqual(["Theo +12"]);
  });

  it("keeps a nameless photograph to itself (never grouped with another nameless one)", () => {
    const feed = pushArrivals(
      [],
      [
        { id: "x", name: null },
        { id: "y", name: null },
      ],
      0,
      HOLD,
    );
    expect(feed).toHaveLength(2);
    expect(arrivalLabel(arrivalRows(feed)[0])).toBe("New photo");
  });

  it("drops what has run its hold as it takes the next arrival", () => {
    let feed = pushArrivals([], [{ id: "a", name: "Theo" }], 0, HOLD);
    feed = pushArrivals(feed, [{ id: "b", name: "Maya" }], 3500, HOLD);
    expect(feed.map((e) => e.name)).toEqual(["Maya"]);
  });
});

describe("arrivalRows", () => {
  it("stacks people newest first, up to the feed's depth", () => {
    let feed = pushArrivals([], [{ id: "a", name: "Theo" }], 0, HOLD);
    feed = pushArrivals(feed, [{ id: "b", name: "Maya" }], 100, HOLD);
    feed = pushArrivals(feed, [{ id: "c", name: "Priya" }], 200, HOLD);
    expect(ARRIVAL_FEED_DEPTH).toBe(3);
    expect(arrivalRows(feed).map(arrivalLabel)).toEqual([
      "Priya",
      "Maya",
      "Theo",
    ]);
  });

  it("folds everyone past the depth into one counting line", () => {
    let feed = pushArrivals([], [{ id: "a", name: "Theo" }], 0, HOLD);
    feed = pushArrivals(
      feed,
      [
        { id: "b", name: "Theo" },
        { id: "c", name: "Theo" },
      ],
      50,
      HOLD,
    );
    feed = pushArrivals(feed, [{ id: "d", name: "Maya" }], 100, HOLD);
    feed = pushArrivals(feed, [{ id: "e", name: "Priya" }], 200, HOLD);
    feed = pushArrivals(feed, [{ id: "f", name: "Sam" }], 300, HOLD);
    // Two people shown; Maya (1) and Theo (1 + 2) folded: four photographs.
    expect(arrivalRows(feed).map(arrivalLabel)).toEqual([
      "Sam",
      "Priya",
      "+4 more",
    ]);
  });

  it("groups a count past 999 the way every count is printed (formatCount)", () => {
    expect(arrivalLabel({ kind: "more", key: "more", count: 1145 })).toBe(
      "+1,145 more",
    );
    expect(
      arrivalLabel({ kind: "person", key: "name:Theo", name: "Theo", extra: 1200 }),
    ).toBe("Theo +1,200");
  });
});

describe("the feed's own clock", () => {
  it("says when it next changes, and prunes on it", () => {
    let feed = pushArrivals([], [{ id: "a", name: "Theo" }], 0, HOLD);
    feed = pushArrivals(feed, [{ id: "b", name: "Maya" }], 1000, HOLD);
    expect(nextArrivalExpiry(feed)).toBe(3000);
    expect(pruneArrivals(feed, 3000).map((e) => e.name)).toEqual(["Maya"]);
    expect(nextArrivalExpiry([])).toBeNull();
  });
});
