import { describe, expect, it } from "vitest";

import { selectForAutoReduce } from "@/lib/media/auto-reduce";

const M = (id: string, file_size_bytes: number) => ({ id, file_size_bytes });

describe("selectForAutoReduce", () => {
  it("removes nothing when already under (or at) the cap", () => {
    expect(selectForAutoReduce([M("a", 5), M("b", 3)], 10)).toEqual([]);
    expect(selectForAutoReduce([M("a", 6), M("b", 4)], 10)).toEqual([]);
  });

  it("removes the largest first, just enough to fit", () => {
    // total 18, cap 10 → drop the 10 → 8 ≤ 10.
    expect(
      selectForAutoReduce([M("small", 3), M("big", 10), M("mid", 5)], 10),
    ).toEqual(["big"]);
  });

  it("removes multiple (largest-first) when one isn't enough", () => {
    // total 18, cap 4 → drop 10 → 8, drop 5 → 3 ≤ 4.
    expect(
      selectForAutoReduce([M("small", 3), M("big", 10), M("mid", 5)], 4),
    ).toEqual(["big", "mid"]);
  });

  it("removes everything when the cap is 0", () => {
    expect(selectForAutoReduce([M("a", 3), M("b", 5)], 0).sort()).toEqual([
      "a",
      "b",
    ]);
  });

  it("handles no media", () => {
    expect(selectForAutoReduce([], 10)).toEqual([]);
  });
});
