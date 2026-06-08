import { describe, expect, it } from "vitest";

import { evaluatePrune } from "./prune-guard";

describe("evaluatePrune", () => {
  it("never trips on an empty candidate set (even when the media table is empty)", () => {
    expect(evaluatePrune({ mediaCount: 0, candidateCount: 0 })).toEqual({
      trip: false,
      reason: null,
    });
    expect(evaluatePrune({ mediaCount: 1000, candidateCount: 0 })).toEqual({
      trip: false,
      reason: null,
    });
  });

  it("trips media_table_empty when candidates exist but the media table is empty", () => {
    // The pre-launch landmine: source has 0 rows, so every backup looks gone.
    expect(evaluatePrune({ mediaCount: 0, candidateCount: 1 })).toEqual({
      trip: true,
      reason: "media_table_empty",
    });
    expect(evaluatePrune({ mediaCount: 0, candidateCount: 10_000 })).toEqual({
      trip: true,
      reason: "media_table_empty",
    });
  });

  it("does not trip on a large candidate set when media exists (the per-run cap is a clamp, not a trip)", () => {
    // For an accrue-only backup a big prunable backlog is normal; the Worker clamps, never wedges.
    expect(evaluatePrune({ mediaCount: 5, candidateCount: 1_000_000 })).toEqual(
      { trip: false, reason: null },
    );
  });
});
