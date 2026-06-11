import { describe, expect, it } from "vitest";

import {
  MAX_UPLOAD_BYTES,
  MULTIPART_PART_SIZE_BYTES,
  MULTIPART_THRESHOLD_BYTES,
} from "@/lib/media/limits";

import { planParts, uploadStrategyFor } from "./part-plan";

describe("upload strategy threshold", () => {
  it("single below the threshold, multipart at and above it", () => {
    expect(uploadStrategyFor(MULTIPART_THRESHOLD_BYTES - 1)).toBe("single");
    expect(uploadStrategyFor(MULTIPART_THRESHOLD_BYTES)).toBe("multipart");
    expect(uploadStrategyFor(MULTIPART_THRESHOLD_BYTES + 1)).toBe("multipart");
  });
});

describe("planParts", () => {
  it("sums exactly to the declared size with a remainder last part", () => {
    const size = MULTIPART_PART_SIZE_BYTES * 3 + 12_345;
    const parts = planParts(size);
    expect(parts).toHaveLength(4);
    expect(parts.slice(0, 3)).toEqual([
      MULTIPART_PART_SIZE_BYTES,
      MULTIPART_PART_SIZE_BYTES,
      MULTIPART_PART_SIZE_BYTES,
    ]);
    expect(parts[3]).toBe(12_345);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(size);
  });

  it("an exact multiple has a full-size last part", () => {
    const size = MULTIPART_PART_SIZE_BYTES * 2;
    expect(planParts(size)).toEqual([
      MULTIPART_PART_SIZE_BYTES,
      MULTIPART_PART_SIZE_BYTES,
    ]);
  });

  it("the 10 GB ceiling stays far under S3's 10,000-part max", () => {
    const parts = planParts(MAX_UPLOAD_BYTES);
    expect(parts.length).toBeLessThan(10_000);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(MAX_UPLOAD_BYTES);
  });
});
