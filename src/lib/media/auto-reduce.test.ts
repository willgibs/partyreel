import { describe, expect, it } from "vitest";

import {
  largestFirst,
  takeLargestFirst,
  type ReduceItem,
} from "@/lib/media/auto-reduce";

const M = (id: string, file_size_bytes: number) => ({ id, file_size_bytes });
const total = (items: readonly ReduceItem[]) =>
  items.reduce((s, m) => s + m.file_size_bytes, 0);

/** The whole set as one page: what the reduce chose before it was paged. */
const whole = (items: ReduceItem[], cap: number) =>
  takeLargestFirst(items, total(items), cap).ids;

describe("takeLargestFirst, over the whole set", () => {
  it("removes nothing when already under (or at) the cap", () => {
    expect(whole([M("a", 5), M("b", 3)], 10)).toEqual([]);
    expect(whole([M("a", 6), M("b", 4)], 10)).toEqual([]);
  });

  it("removes the largest first, just enough to fit", () => {
    // total 18, cap 10 → drop the 10 → 8 ≤ 10.
    expect(whole([M("small", 3), M("big", 10), M("mid", 5)], 10)).toEqual([
      "big",
    ]);
  });

  it("removes multiple (largest-first) when one isn't enough", () => {
    // total 18, cap 4 → drop 10 → 8, drop 5 → 3 ≤ 4.
    expect(whole([M("small", 3), M("big", 10), M("mid", 5)], 4)).toEqual([
      "big",
      "mid",
    ]);
  });

  it("removes everything when the cap is 0", () => {
    expect(whole([M("a", 3), M("b", 5)], 0).sort()).toEqual(["a", "b"]);
  });

  it("handles no media", () => {
    expect(whole([], 10)).toEqual([]);
  });

  it("breaks a tie on size by id, ascending (the reads' keyset order)", () => {
    expect(whole([M("c", 5), M("a", 5), M("b", 5)], 6)).toEqual(["a", "b"]);
  });
});

describe("takeLargestFirst, a page at a time (crumbs-37)", () => {
  it("★ pages walked in order remove exactly what one sort of the whole set removes", () => {
    // 2,000 items of 37 sizes in a scrambled order, against caps from nothing to everything.
    const items = Array.from({ length: 2_000 }, (_, i) =>
      M(`m${String((i * 7_919) % 2_000).padStart(4, "0")}`, 1_000 + (i % 37)),
    );
    const sum = total(items);
    const ordered = [...items].sort(largestFirst);
    for (const cap of [0, 1_000, sum / 3, sum / 2, sum - 1, sum]) {
      for (const size of [1, 7, 500, 1_000, 2_000]) {
        let active = sum;
        const removed: string[] = [];
        for (let at = 0; at < ordered.length && active > cap; at += size) {
          const step = takeLargestFirst(
            ordered.slice(at, at + size),
            active,
            cap,
          );
          removed.push(...step.ids);
          active = step.activeBytes;
        }
        expect(removed, `cap ${cap}, page ${size}`).toEqual(whole(items, cap));
        const taken = new Set(removed);
        expect(active).toBe(sum - total(items.filter((m) => taken.has(m.id))));
      }
    }
  });

  it("answers what is left active after the page's picks", () => {
    expect(takeLargestFirst([M("a", 4), M("b", 3)], 20, 15)).toEqual({
      ids: ["a", "b"],
      activeBytes: 13,
    });
    // Already under: nothing taken, the total unchanged.
    expect(takeLargestFirst([M("a", 4)], 9, 10)).toEqual({
      ids: [],
      activeBytes: 9,
    });
  });
});
