/**
 * THE CONTACT SHEET, AS DATA (the-wait r1, Will's `wait=sheet`): a square a photo in the order the night took them,
 * everyone's from the sync's numbers alone (a count and its minutes, never an id), hers lit at their own minutes, what
 * she is sending at the end; the newest still warm; capped at a size, the oldest folding away while the count climbs.
 */
import { describe, expect, it } from "vitest";

import {
  columnsFor,
  type HerShot,
  layoutSheet,
  SHEET_CAP,
  sheetCapFor,
  waitStands,
} from "@/lib/disposable/contact-sheet";

const MIN = 60_000;
const T0 = 1_790_000_000_000 - (1_790_000_000_000 % MIN);

const her = (
  key: string,
  at: number | null,
  over: Partial<HerShot> = {},
): HerShot => ({
  key,
  at,
  src: `blob:${key}`,
  video: false,
  sending: false,
  ...over,
});

describe("everyone's, from the numbers alone", () => {
  it("draws one dark square a photo, in the night's order, and nothing it was not told", () => {
    const sheet = layoutSheet({
      waiting: {
        count: 5,
        minutes: [
          [T0, 2],
          [T0 + 3 * MIN, 3],
        ],
      },
      hers: [],
      cap: 100,
      nowMs: T0 + 60 * MIN,
    });
    expect(sheet.cells.map((c) => c.kind)).toEqual([
      "theirs",
      "theirs",
      "theirs",
      "theirs",
      "theirs",
    ]);
    expect(sheet.cells.map((c) => c.minute)).toEqual([
      T0,
      T0,
      T0 + 3 * MIN,
      T0 + 3 * MIN,
      T0 + 3 * MIN,
    ]);
    expect(sheet.count).toBe(5);
    expect(sheet.folded).toBe(0);
    // ★ No cell carries anything but a place and a minute: no id, no picture, no name of anyone else's.
    for (const cell of sheet.cells) {
      expect(Object.keys(cell).sort()).toEqual([
        "key",
        "kind",
        "minute",
        "warm",
      ]);
    }
  });

  it("nothing is warm before the reader's clock is known", () => {
    const sheet = layoutSheet({
      waiting: { count: 2, minutes: [[T0, 2]] },
      hers: [],
      cap: 100,
      nowMs: null,
    });
    expect(sheet.cells.every((c) => c.kind === "theirs" && c.warm === 0)).toBe(
      true,
    );
  });

  it("the newest still warm, cooling over a quarter of an hour", () => {
    const now = T0 + 20 * MIN;
    const sheet = layoutSheet({
      waiting: {
        count: 3,
        minutes: [
          [T0, 1],
          [T0 + 10 * MIN, 1],
          [T0 + 20 * MIN, 1],
        ],
      },
      hers: [],
      cap: 100,
      nowMs: now,
    });
    const warm = sheet.cells.map((c) => (c.kind === "theirs" ? c.warm : -1));
    expect(warm[0]).toBe(0);
    expect(warm[1]).toBeGreaterThan(0);
    expect(warm[1]).toBeLessThan(warm[2]);
    expect(warm[2]).toBe(1);
  });
});

describe("hers, lit where she took them", () => {
  it("★ lights her own at their minutes, inside the count (the sync's count is hers too)", () => {
    const sheet = layoutSheet({
      waiting: {
        count: 4,
        minutes: [
          [T0, 2],
          [T0 + 5 * MIN, 2],
        ],
      },
      hers: [her("m1", T0 + 5 * MIN + 12_000)],
      cap: 100,
      nowMs: T0 + 30 * MIN,
    });
    expect(sheet.cells.map((c) => c.kind)).toEqual([
      "theirs",
      "theirs",
      "hers",
      "theirs",
    ]);
    expect(sheet.count).toBe(4);
    expect(sheet.hers).toBe(1);
    const lit = sheet.cells[2];
    expect(lit.kind === "hers" && lit.src).toBe("blob:m1");
  });

  it("this visit's landings, not read back yet, take the newest places; one the count has not reached stands after", () => {
    const sheet = layoutSheet({
      waiting: { count: 3, minutes: [[T0, 3]] },
      hers: [
        her("q1", null),
        her("q2", null),
        her("q3", null),
        her("q4", null),
      ],
      cap: 100,
      nowMs: T0 + MIN,
    });
    // Three of the four fit the count's own squares (the newest first); the fourth landed after the count was read.
    expect(sheet.cells.map((c) => c.kind)).toEqual([
      "hers",
      "hers",
      "hers",
      "hers",
    ]);
    expect(sheet.count).toBe(4);
  });

  it("what she is sending stands at the very end, outside the count, and says so", () => {
    const sheet = layoutSheet({
      waiting: { count: 2, minutes: [[T0, 2]] },
      hers: [her("s1", null, { sending: true })],
      cap: 100,
      nowMs: T0 + MIN,
    });
    expect(sheet.cells.map((c) => c.kind)).toEqual([
      "theirs",
      "theirs",
      "sending",
    ]);
    expect(sheet.count).toBe(2);
    expect(sheet.hers).toBe(0);
  });

  it("names her newest landing, the one that takes the pass of light", () => {
    const sheet = layoutSheet({
      waiting: {
        count: 3,
        minutes: [
          [T0, 1],
          [T0 + MIN, 2],
        ],
      },
      hers: [her("old", T0), her("new", T0 + MIN + 5_000)],
      cap: 100,
      nowMs: T0 + 2 * MIN,
    });
    expect(sheet.newestHers).toBe("new");
  });
});

describe("★ the cap: a size the sheet never grows past, the count climbing beyond it", () => {
  it("keeps the newest squares and folds the oldest away, counting them", () => {
    const sheet = layoutSheet({
      waiting: {
        count: 1000,
        minutes: [
          [T0, 600],
          [T0 + MIN, 400],
        ],
      },
      hers: [],
      cap: 96,
      nowMs: T0 + 2 * MIN,
    });
    expect(sheet.cells).toHaveLength(96);
    expect(sheet.folded).toBe(904);
    expect(sheet.count).toBe(1000);
    expect(sheet.cells.every((c) => c.minute === T0 + MIN)).toBe(true);
  });

  it("a phone's sheet and a desk's, each a few rows of its own columns", () => {
    expect(sheetCapFor(12)).toBe(12 * 8);
    expect(sheetCapFor(30)).toBe(30 * 6);
    expect(SHEET_CAP).toBeGreaterThan(0);
  });

  it("squares of about thirty pixels: a phone's twelve, a desk's thirty, never past either", () => {
    expect(columnsFor(319)).toBe(12);
    expect(columnsFor(696)).toBe(20);
    expect(columnsFor(1072)).toBe(30);
    expect(columnsFor(4000)).toBe(30);
    expect(columnsFor(100)).toBe(12);
  });

  it("hers folded with the oldest still count as hers", () => {
    const sheet = layoutSheet({
      waiting: {
        count: 200,
        minutes: [
          [T0, 100],
          [T0 + MIN, 100],
        ],
      },
      hers: [her("early", T0 + 1_000)],
      cap: 96,
      nowMs: T0 + 2 * MIN,
    });
    expect(sheet.hers).toBe(1);
    expect(sheet.cells.some((c) => c.kind === "hers")).toBe(false);
  });
});

describe("waitStands: whether the sheet stands in the album at all", () => {
  it("stands where the album waits and something waits, or she is sending to it", () => {
    expect(waitStands({ waits: true, count: 3, sending: 0, landed: 0 })).toBe(
      true,
    );
    expect(waitStands({ waits: true, count: 0, sending: 1, landed: 0 })).toBe(
      true,
    );
    expect(waitStands({ waits: true, count: 0, sending: 0, landed: 2 })).toBe(
      true,
    );
  });

  it("an album that waits with nothing in it yet keeps its own empty state (the album starts with you)", () => {
    expect(waitStands({ waits: true, count: 0, sending: 0, landed: 0 })).toBe(
      false,
    );
  });

  it("an album that shows what is added at once never draws a wait, whatever a stale count says", () => {
    expect(waitStands({ waits: false, count: 4, sending: 1, landed: 0 })).toBe(
      false,
    );
  });
});
