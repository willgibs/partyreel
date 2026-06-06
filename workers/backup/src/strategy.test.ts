import { describe, expect, it } from "vitest";

import {
  COPY_PART_BYTES,
  SINGLE_PUT_MAX_BYTES,
  needsMultipart,
  partRanges,
} from "./strategy";

describe("needsMultipart", () => {
  it("is false at or below the single-put threshold", () => {
    expect(needsMultipart(0)).toBe(false);
    expect(needsMultipart(1)).toBe(false);
    expect(needsMultipart(SINGLE_PUT_MAX_BYTES)).toBe(false);
  });
  it("is true above the single-put threshold", () => {
    expect(needsMultipart(SINGLE_PUT_MAX_BYTES + 1)).toBe(true);
    expect(needsMultipart(2 * 1024 ** 3)).toBe(true); // 2 GB video
    expect(needsMultipart(5 * 1000 ** 3)).toBe(true); // 5 GB (future unified limit)
  });
});

describe("partRanges", () => {
  it("returns no ranges for a non-positive size", () => {
    expect(partRanges(0)).toEqual([]);
    expect(partRanges(-10)).toEqual([]);
  });

  it("returns a single short part below one part size", () => {
    expect(partRanges(10, 100)).toEqual([
      { partNumber: 1, offset: 0, length: 10 },
    ]);
  });

  it("splits an exact multiple into equal parts", () => {
    expect(partRanges(300, 100)).toEqual([
      { partNumber: 1, offset: 0, length: 100 },
      { partNumber: 2, offset: 100, length: 100 },
      { partNumber: 3, offset: 200, length: 100 },
    ]);
  });

  it("makes the last part shorter on a remainder", () => {
    expect(partRanges(250, 100)).toEqual([
      { partNumber: 1, offset: 0, length: 100 },
      { partNumber: 2, offset: 100, length: 100 },
      { partNumber: 3, offset: 200, length: 50 },
    ]);
  });

  it("covers the whole object with contiguous, non-overlapping ranges (2 GB @ default part)", () => {
    const size = 2 * 1024 ** 3;
    const ranges = partRanges(size);
    // contiguous + complete
    expect(ranges[0].offset).toBe(0);
    let covered = 0;
    for (let i = 0; i < ranges.length; i++) {
      expect(ranges[i].partNumber).toBe(i + 1);
      if (i > 0) {
        expect(ranges[i].offset).toBe(
          ranges[i - 1].offset + ranges[i - 1].length,
        );
      }
      covered += ranges[i].length;
    }
    expect(covered).toBe(size);
    // every part except the last is exactly COPY_PART_BYTES (R2's equal-part-size rule)
    for (let i = 0; i < ranges.length - 1; i++) {
      expect(ranges[i].length).toBe(COPY_PART_BYTES);
    }
    expect(ranges[ranges.length - 1].length).toBeLessThanOrEqual(
      COPY_PART_BYTES,
    );
  });
});
