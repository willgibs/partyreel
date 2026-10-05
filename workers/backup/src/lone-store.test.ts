/**
 * THE LONE COPIES' TABLE, ON NODE'S OWN SQLITE (lone-store.ts): the statements the prune's Durable Object runs, run
 * here against a real SQLite, so what a range settles, what it keeps and what it drops is proved on SQL and not on a
 * stand-in. The point of it all is the second test: a pass that spans runs still reads the whole backup's lone
 * copies after every run, never each run's range alone.
 */
import { beforeEach, describe, expect, it } from "vitest";

import { createLoneStore, type LoneStore } from "./lone-store";
import { openDb, sqlOf, transactionOf, type Db } from "./testing/sqlite";

const k = (n: number) =>
  `events/e/photo/m${String(n).padStart(3, "0")}/original.jpg`;
const T0 = Date.UTC(2026, 9, 5, 6, 0, 0);
const DAY = 86_400_000;

let db: Db;
let store: LoneStore;

beforeEach(async () => {
  db = await openDb();
  store = createLoneStore(sqlOf(db), transactionOf(db));
});

describe("the lone copies' table", () => {
  it("keeps what a run found in its range, and says how many and since when", () => {
    expect(store.tally()).toEqual({ keys: 0, oldestMs: null });
    const after = store.walk(
      { after: null, through: null, found: [k(2), k(7)] },
      T0,
    );
    expect(after).toEqual({ keys: 2, oldestMs: T0 });
    expect(store.page(null, 10)).toEqual([k(2), k(7)]);
  });

  it("★ carries a lone copy across the runs of a pass: the next range reads the whole backup, not its own zero", () => {
    // Monday's run settles the head of the listing through k(5) and finds k(2) held by the backup alone.
    expect(
      store.walk({ after: null, through: k(5), found: [k(2)] }, T0).keys,
    ).toBe(1);
    // The next week's run takes the rest and finds nothing there: the backup still holds k(2) alone.
    expect(
      store.walk({ after: k(5), through: null, found: [] }, T0 + 7 * DAY).keys,
    ).toBe(1);
    // The pass after starts at the head again; k(2) is back in the primary (restored), so its range drops it.
    expect(
      store.walk({ after: null, through: k(5), found: [] }, T0 + 14 * DAY).keys,
    ).toBe(0);
  });

  it("drops a key its own range no longer finds, and never one outside the range it settled", () => {
    store.walk({ after: null, through: null, found: [k(1), k(4), k(9)] }, T0);
    store.walk({ after: k(2), through: k(6), found: [] }, T0 + DAY);
    expect(store.page(null, 10)).toEqual([k(1), k(9)]);
  });

  it("keeps the first time a key was found while it stays lone, so the oldest says how long it has waited", () => {
    store.walk({ after: null, through: null, found: [k(3)] }, T0);
    const later = store.walk(
      { after: null, through: null, found: [k(3), k(8)] },
      T0 + 7 * DAY,
    );
    expect(later).toEqual({ keys: 2, oldestMs: T0 });
  });

  it("ignores a found key outside the range the run settled: that range's own walk decides it", () => {
    store.walk({ after: k(5), through: k(9), found: [k(2), k(6)] }, T0);
    expect(store.page(null, 10)).toEqual([k(6)]);
  });

  it("settles a range bounded on both sides, the ends exclusive then inclusive", () => {
    store.walk({ after: null, through: null, found: [k(2), k(5), k(8)] }, T0);
    // (k(2), k(5)]: k(2) is outside, k(5) inside.
    store.walk({ after: k(2), through: k(5), found: [] }, T0 + DAY);
    expect(store.page(null, 10)).toEqual([k(2), k(8)]);
  });

  it("drops exactly the keys the restore resolved", () => {
    store.walk({ after: null, through: null, found: [k(1), k(2), k(3)] }, T0);
    expect(store.resolve([k(2), k(42)])).toEqual({ keys: 2, oldestMs: T0 });
    expect(store.page(null, 10)).toEqual([k(1), k(3)]);
  });

  it("pages in key order from a cursor", () => {
    store.walk(
      { after: null, through: null, found: [k(5), k(1), k(3), k(2)] },
      T0,
    );
    expect(store.page(null, 2)).toEqual([k(1), k(2)]);
    expect(store.page(k(2), 2)).toEqual([k(3), k(5)]);
    expect(store.page(k(5), 2)).toEqual([]);
  });

  it("changes nothing when a statement fails halfway: a range is settled whole or not at all", async () => {
    store.walk({ after: null, through: null, found: [k(1), k(2)] }, T0);
    const broken = createLoneStore(sqlOf(db, /^\s*DELETE/i), transactionOf(db));
    expect(() =>
      broken.walk({ after: null, through: null, found: [k(9)] }, T0 + DAY),
    ).toThrow(/the disk is gone/);
    expect(store.page(null, 10)).toEqual([k(1), k(2)]);
  });

  it("keeps its rows when the object is built again over the same database", () => {
    store.walk({ after: null, through: null, found: [k(4)] }, T0);
    const again = createLoneStore(sqlOf(db), transactionOf(db));
    expect(again.tally()).toEqual({ keys: 1, oldestMs: T0 });
  });
});
