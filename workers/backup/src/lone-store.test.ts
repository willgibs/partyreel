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

/**
 * ★ TWO JUDGES, SPLIT BY AGE (backup-reconcile): the weekly prune judges the keys past its 36-day gate, the daily
 * reconcile the younger ones, and each walk settles only its own side of the gate, by when the backup took the key.
 * On the old code a walk settled every row in its range, so the prune's next walk dropped a young lone copy the
 * reconcile had found (it never judges young keys), and the card read it gone while the backup still held it alone.
 */
describe("the lone copies' two judges", () => {
  const GATE = 36 * DAY;
  /** The prune's walk at `at`: the old side of the gate. */
  const prune = (at: number) => ({ side: "old", cutMs: at - GATE }) as const;
  /** The reconcile's walk at `at`: the young side. */
  const reconcile = (at: number) =>
    ({ side: "young", cutMs: at - GATE }) as const;
  const young = (n: number, takenAt = T0 - 3 * DAY) => ({
    key: k(n),
    uploadedMs: takenAt,
  });

  it("★ never lets the prune's walk drop a young lone copy the reconcile holds", () => {
    store.settle(
      { after: null, through: null, found: [young(2)], judged: reconcile(T0) },
      T0,
    );
    // The prune's whole-range walk the next morning finds an old lone copy and judges nothing young.
    const after = store.walk(
      { after: null, through: null, found: [k(7)], judged: prune(T0 + DAY) },
      T0 + DAY,
    );
    expect(after.keys).toBe(2);
    expect(store.page(null, 10)).toEqual([k(2), k(7)]);
  });

  it("never lets the reconcile's walk drop an old lone copy the prune holds", () => {
    store.walk(
      { after: null, through: null, found: [k(4)], judged: prune(T0) },
      T0,
    );
    store.settle(
      { after: null, through: null, found: [], judged: reconcile(T0 + DAY) },
      T0 + DAY,
    );
    expect(store.page(null, 10)).toEqual([k(4)]);
  });

  it("drops a young copy its own judge no longer finds: back in the primary, or named by no row now", () => {
    store.settle(
      {
        after: null,
        through: null,
        found: [young(1), young(3)],
        judged: reconcile(T0),
      },
      T0,
    );
    store.settle(
      {
        after: null,
        through: null,
        found: [young(3)],
        judged: reconcile(T0 + DAY),
      },
      T0 + DAY,
    );
    expect(store.page(null, 10)).toEqual([k(3)]);
  });

  it("★ holds a copy that aged past the gate between walks until the prune's walk judges it, never dropping it unseen", () => {
    const taken = T0 - 35 * DAY; // young today, past the gate the day after tomorrow
    store.settle(
      {
        after: null,
        through: null,
        found: [young(5, taken)],
        judged: reconcile(T0),
      },
      T0,
    );
    // Two days on the reconcile no longer judges it (it is old): its walk leaves it held.
    store.settle(
      {
        after: null,
        through: null,
        found: [],
        judged: reconcile(T0 + 2 * DAY),
      },
      T0 + 2 * DAY,
    );
    expect(store.page(null, 10)).toEqual([k(5)]);
    // The prune's walk finds it still lone: kept, with its first-found time.
    expect(
      store.walk(
        {
          after: null,
          through: null,
          found: [k(5)],
          judged: prune(T0 + 3 * DAY),
        },
        T0 + 3 * DAY,
      ),
    ).toEqual({ keys: 1, oldestMs: T0 });
    // A week on its row is gone and the primary still lacks it (prunable, not lone): the prune's walk drops it.
    store.walk(
      { after: null, through: null, found: [], judged: prune(T0 + 10 * DAY) },
      T0 + 10 * DAY,
    );
    expect(store.tally().keys).toBe(0);
  });

  it("keeps a found key only on the side of the gate its walk judged", () => {
    store.settle(
      {
        after: null,
        through: null,
        // An old key handed to the reconcile's walk is the prune's to judge, never the reconcile's to keep.
        found: [young(1), { key: k(2), uploadedMs: T0 - 40 * DAY }],
        judged: reconcile(T0),
      },
      T0,
    );
    expect(store.page(null, 10)).toEqual([k(1)]);
  });

  it("says how many of the keys it kept were new to the table, so a restore pass is asked for only then", () => {
    const first = store.settle(
      {
        after: null,
        through: null,
        found: [young(1), young(2)],
        judged: reconcile(T0),
      },
      T0,
    );
    expect(first).toEqual({ keys: 2, oldestMs: T0, added: 2 });
    const again = store.settle(
      {
        after: null,
        through: null,
        found: [young(1), young(2), young(3)],
        judged: reconcile(T0 + DAY),
      },
      T0 + DAY,
    );
    expect(again).toEqual({ keys: 3, oldestMs: T0, added: 1 });
  });

  it("gives the table the restore's first deploy made an age column, its rows the prune's", () => {
    // The table as durability-restore created it: no uploaded_ms.
    db.exec("DROP TABLE lone_copies");
    db.exec(
      "CREATE TABLE lone_copies (key TEXT PRIMARY KEY, found_at INTEGER NOT NULL, seen INTEGER NOT NULL DEFAULT 0)",
    );
    db.exec(
      `INSERT INTO lone_copies (key, found_at, seen) VALUES ('${k(8)}', ${T0}, 0)`,
    );
    const upgraded = createLoneStore(sqlOf(db), transactionOf(db));
    // Its row is the prune's: the reconcile's walk leaves it, the prune's judges it.
    upgraded.settle(
      { after: null, through: null, found: [], judged: reconcile(T0 + DAY) },
      T0 + DAY,
    );
    expect(upgraded.page(null, 10)).toEqual([k(8)]);
    upgraded.walk(
      { after: null, through: null, found: [], judged: prune(T0 + DAY) },
      T0 + DAY,
    );
    expect(upgraded.tally().keys).toBe(0);
    // Built again over it, the column is there already: nothing throws.
    expect(() => createLoneStore(sqlOf(db), transactionOf(db))).not.toThrow();
  });
});
