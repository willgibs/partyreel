import { describe, expect, it } from "vitest";

import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  type ManifestEntry,
} from "@/lib/events/album-wire";

import {
  arrivalsOf,
  flatMarks,
  isLandingNow,
  landedWith,
  LIT_WITHIN_MINUTES,
  msUntilQuiet,
  newestOf,
  slotsFor,
  STRIP_TIERS,
  stripMarks,
} from "./event-hub-head-strip-marks";

/**
 * THE FACTS STRIP'S MATHS (`event-header` r3, Will's `facts=strip`): one mark a photograph in the album's own order,
 * each as tall as how many landed within ten minutes of it, lit only for what is landing now. Pinned by what the line
 * SAYS for each shape of event he named (a morning, a weekend, no date, a trickle), never by a pixel.
 */

const DESK = STRIP_TIERS[2];
const HAND = STRIP_TIERS[0];

/** A manifest entry at `minute` (the album's microseconds), newest-first lists built by the caller. */
const at = (minute: number, flags = 0, id = `m${minute}`): ManifestEntry => [
  id,
  100,
  100,
  flags,
  Math.round(minute * 60_000_000),
];

describe("the arrivals", () => {
  it("reads the album's entries oldest first, in minutes since the epoch", () => {
    // The store keeps the album newest first; the strip lays it oldest first.
    const entries = [at(30), at(20), at(10)];
    expect(arrivalsOf(entries)).toEqual([10, 20, 30]);
  });

  it("★ counts what the hub's album holds: approved and hidden, never what waits in Review", () => {
    const entries = [
      at(40, ENTRY_PENDING),
      at(30, ENTRY_HIDDEN),
      at(20),
      at(10, ENTRY_PENDING),
    ];
    expect(arrivalsOf(entries)).toEqual([20, 30]);
  });

  it("reads a list handed in some other order in time, never in its own", () => {
    expect(arrivalsOf([at(10), at(30), at(20)])).toEqual([10, 20, 30]);
  });

  it("is empty for an empty album, and its newest is nobody's", () => {
    expect(arrivalsOf([])).toEqual([]);
    expect(newestOf([])).toBeNull();
    expect(newestOf([5, 9, 12])).toBe(12);
  });
});

describe("how many landed with each photograph", () => {
  it("counts the photographs within ten minutes of each, itself included", () => {
    // 0, 2 and 4 stand within ten of one another, 100 stands alone, 150 and 155 are a pair.
    expect(landedWith([0, 2, 4, 100, 150, 155])).toEqual([3, 3, 3, 1, 2, 2]);
  });

  it("is 1 for a trickle: one photograph a week, none with another", () => {
    const week = 7 * 24 * 60;
    expect(landedWith([0, week, 2 * week, 3 * week])).toEqual([1, 1, 1, 1]);
  });

  it("stands a run from one press of Add taller than a lone photograph", () => {
    const run = Array.from({ length: 12 }, (_, i) => 500 + i * 0.1);
    const heights = landedWith([0, ...run]);
    expect(heights[0]).toBe(1);
    expect(heights[5]).toBe(12);
  });
});

describe("how many marks each width draws", () => {
  it("takes one a photograph up to as many as fit, and never fewer than a quiet line's worth", () => {
    expect(slotsFor(3, DESK)).toBe(DESK.least);
    expect(slotsFor(100, DESK)).toBe(100);
    expect(slotsFor(10_000, DESK)).toBe(DESK.most);
    expect(slotsFor(3, HAND)).toBe(HAND.least);
    expect(slotsFor(10_000, HAND)).toBe(HAND.most);
  });

  it("is the board's own two at a hand and a desk, and a tablet's between them", () => {
    expect(STRIP_TIERS.map((t) => [t.id, t.least, t.most])).toEqual([
      ["hand", 19, 52],
      ["mid", 36, 104],
      ["desk", 54, 160],
    ]);
  });
});

describe("the marks", () => {
  /** A party: bursts in the evening, a quiet morning after. */
  const party = [
    ...Array.from({ length: 40 }, (_, i) => 1000 + i * 0.5),
    ...Array.from({ length: 5 }, (_, i) => 1400 + i * 30),
  ];

  it("★ spans the whole line for an album with more photographs than slots, with no gap in it", () => {
    const marks = stripMarks(party, 20);
    expect(marks).toHaveLength(20);
    expect(marks.every((m) => !m.waiting)).toBe(true);
  });

  it("★ reads true for any shape: a morning's and a weekend's fill the line, a trickle's gathers at its newest end, and none has a gap", () => {
    const morning = Array.from({ length: 148 }, (_, i) => 540 + i * 0.8);
    const weekend = Array.from({ length: 312 }, (_, i) => i * 14);
    const trickle = Array.from({ length: 41 }, (_, i) => i * 7 * 24 * 60);
    for (const arrivals of [morning, weekend]) {
      const marks = stripMarks(arrivals, 54);
      expect(marks.filter((m) => !m.waiting)).toHaveLength(54);
    }
    // Forty-one photographs over fifty-four slots: thirteen quiet points, then the album, unbroken to the newest.
    const slow = stripMarks(trickle, 54);
    expect(slow.slice(0, 13).every((m) => m.waiting)).toBe(true);
    expect(slow.slice(13).every((m) => !m.waiting)).toBe(true);
  });

  it("stands the busiest stretch tallest, on the album's own scale, and every mark within 0 to 1", () => {
    const marks = stripMarks(party, 40);
    const peak = Math.max(...marks.map((m) => m.h));
    expect(peak).toBeCloseTo(1, 5);
    for (const m of marks) {
      expect(m.h).toBeGreaterThanOrEqual(0);
      expect(m.h).toBeLessThanOrEqual(1);
    }
    // The evening's burst stands over the sparse morning that follows it.
    expect(marks[5].h).toBeGreaterThan(marks[39].h);
  });

  it("gathers a small album at the newest end, the slots before its first photograph waiting", () => {
    const marks = stripMarks([10, 20, 30], 19);
    expect(marks.slice(0, 16).every((m) => m.waiting && m.h === 0)).toBe(true);
    expect(marks.slice(16).every((m) => !m.waiting && m.h > 0)).toBe(true);
  });

  it("waits the whole line for an empty album", () => {
    const marks = stripMarks([], 54);
    expect(marks).toHaveLength(54);
    expect(marks.every((m) => m.waiting && !m.fresh)).toBe(true);
  });

  it("is one full mark for a single photograph", () => {
    const marks = stripMarks([42], 19);
    expect(marks.filter((m) => !m.waiting)).toEqual([
      { h: 1, waiting: false, fresh: true },
    ]);
  });

  it("marks the quarter hour before the newest photograph fresh, and nothing older", () => {
    const arrivals = [0, 100, 200, 300, 400, 500, 595, 598, 600];
    const marks = stripMarks(arrivals, 9);
    expect(marks.map((m) => m.fresh)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      true,
      true,
    ]);
  });

  it("softens each mark against its two neighbours, so the line is the album's breath and not a barcode", () => {
    // A burst of five between four lone photographs: raw heights 1 1 5 5 5 5 5 1 1, each then read as a quarter of the
    // mark before it, half of itself and a quarter of the one after it, against the busiest.
    const arrivals = [
      0, 1000, 2000, 2000.1, 2000.2, 2000.3, 2000.4, 3000, 4000,
    ];
    expect(landedWith(arrivals)).toEqual([1, 1, 5, 5, 5, 5, 5, 1, 1]);
    const marks = stripMarks(arrivals, arrivals.length);
    expect(marks.map((m) => Math.round(m.h * 100) / 100)).toEqual([
      0.2, 0.4, 0.8, 1, 1, 1, 0.8, 0.4, 0.2,
    ]);
  });

  it("reads a shared `heights` as the arrivals' own", () => {
    const heights = landedWith(party);
    expect(stripMarks(party, 24, heights)).toEqual(stripMarks(party, 24));
  });
});

describe("an album whose shape is not known", () => {
  it("is a flat quiet line, never a shape it does not have", () => {
    const marks = flatMarks(19);
    expect(marks).toHaveLength(19);
    expect(new Set(marks.map((m) => m.h)).size).toBe(1);
    expect(marks.every((m) => !m.waiting && !m.fresh)).toBe(true);
  });
});

describe("photographs landing now", () => {
  const minute = 60_000;

  it("is a quarter of an hour on the reader's clock", () => {
    const newest = 1_000;
    const nowMs = (m: number) => m * minute;
    expect(isLandingNow(newest, nowMs(newest + 1))).toBe(true);
    expect(isLandingNow(newest, nowMs(newest + LIT_WITHIN_MINUTES - 0.1))).toBe(
      true,
    );
    expect(isLandingNow(newest, nowMs(newest + LIT_WITHIN_MINUTES))).toBe(
      false,
    );
    expect(isLandingNow(newest, nowMs(newest + 600))).toBe(false);
  });

  it("is nothing for an album with no photograph", () => {
    expect(isLandingNow(null, Date.now())).toBe(false);
  });

  it("says how long until the newest photograph stops being now, and zero once it has", () => {
    const newest = 1_000;
    expect(msUntilQuiet(newest, (newest + 5) * minute)).toBe(
      (LIT_WITHIN_MINUTES - 5) * minute,
    );
    expect(msUntilQuiet(newest, (newest + 20) * minute)).toBe(0);
  });
});
