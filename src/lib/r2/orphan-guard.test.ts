import { describe, expect, it } from "vitest";

import {
  ORPHAN_DELETE_ABSOLUTE_CAP,
  ORPHAN_DELETE_MAX_FRACTION,
  ORPHAN_RATIO_MIN_SCANNED,
  evaluateOrphanSweep,
} from "@/lib/r2/orphan-guard";

describe("evaluateOrphanSweep", () => {
  it("never trips when there are no candidates (even if the media table is empty)", () => {
    expect(
      evaluateOrphanSweep({
        mediaCount: 0,
        candidateCount: 0,
        objectsScanned: 0,
      }),
    ).toEqual({ trip: false, reason: null });
    expect(
      evaluateOrphanSweep({
        mediaCount: 100,
        candidateCount: 0,
        objectsScanned: 5000,
      }),
    ).toEqual({ trip: false, reason: null });
  });

  it("trips media_table_empty when objects exist but the media table is empty", () => {
    expect(
      evaluateOrphanSweep({
        mediaCount: 0,
        candidateCount: 1,
        objectsScanned: 1,
      }),
    ).toEqual({ trip: true, reason: "media_table_empty" });
    // the full-wipe scenario: a whole page of objects, zero rows
    expect(
      evaluateOrphanSweep({
        mediaCount: 0,
        candidateCount: 20000,
        objectsScanned: 20000,
      }),
    ).toEqual({ trip: true, reason: "media_table_empty" });
  });

  it("allows a normal small orphan backlog through (healthy table)", () => {
    expect(
      evaluateOrphanSweep({
        mediaCount: 500,
        candidateCount: 6,
        objectsScanned: 1010,
      }),
    ).toEqual({ trip: false, reason: null });
  });

  it("trips absolute_cap above the absolute ceiling", () => {
    expect(
      evaluateOrphanSweep({
        mediaCount: 10_000,
        candidateCount: ORPHAN_DELETE_ABSOLUTE_CAP + 1,
        objectsScanned: 1_000_000, // huge sample so the fraction guard alone would NOT trip
      }),
    ).toEqual({ trip: true, reason: "absolute_cap" });
  });

  it("does not trip exactly at the absolute cap", () => {
    expect(
      evaluateOrphanSweep({
        mediaCount: 10_000,
        candidateCount: ORPHAN_DELETE_ABSOLUTE_CAP,
        objectsScanned: 1_000_000,
      }),
    ).toEqual({ trip: false, reason: null });
  });

  it("trips fraction_cap when orphans exceed the fraction of a meaningful sample", () => {
    // 300 / 1000 = 30% > 25%, sample past the floor, under the absolute cap
    expect(
      evaluateOrphanSweep({
        mediaCount: 700,
        candidateCount: 300,
        objectsScanned: 1000,
      }),
    ).toEqual({ trip: true, reason: "fraction_cap" });
  });

  it("skips the fraction guard below the min-scanned floor (tiny bucket)", () => {
    const belowFloor = ORPHAN_RATIO_MIN_SCANNED - 10; // 40
    expect(
      evaluateOrphanSweep({
        mediaCount: 5,
        candidateCount: Math.floor(belowFloor / 2), // 20 -> 50% of sample, but sample too small
        objectsScanned: belowFloor,
      }),
    ).toEqual({ trip: false, reason: null });
  });

  it("applies the fraction guard once the sample reaches the floor", () => {
    const atFloor = ORPHAN_RATIO_MIN_SCANNED; // 50
    const overFraction = Math.ceil(atFloor * ORPHAN_DELETE_MAX_FRACTION) + 1; // 14
    expect(
      evaluateOrphanSweep({
        mediaCount: 10,
        candidateCount: overFraction,
        objectsScanned: atFloor,
      }),
    ).toEqual({ trip: true, reason: "fraction_cap" });
  });

  it("does not trip just under the fraction at the floor", () => {
    const atFloor = ORPHAN_RATIO_MIN_SCANNED; // 50
    const underFraction = Math.floor(atFloor * ORPHAN_DELETE_MAX_FRACTION); // 12 -> 24% < 25%
    expect(
      evaluateOrphanSweep({
        mediaCount: 10,
        candidateCount: underFraction,
        objectsScanned: atFloor,
      }),
    ).toEqual({ trip: false, reason: null });
  });
});
