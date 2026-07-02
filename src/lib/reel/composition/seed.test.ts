import { describe, expect, it } from "vitest";

import { seeded, seededPick, seededRange } from "./seed";

describe("seeded PRNG (the WYSIWYG determinism engine)", () => {
  it("is deterministic + in [0, 1)", () => {
    const v = seeded(42, 0, 0);
    expect(v).toBe(seeded(42, 0, 0));
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });

  it("gives independent streams per salt + per index", () => {
    expect(seeded(42, 0, 0)).not.toBe(seeded(42, 0, 1)); // salt
    expect(seeded(42, 0, 0)).not.toBe(seeded(42, 1, 0)); // index
    expect(seeded(42, 0, 0)).not.toBe(seeded(43, 0, 0)); // seed
  });

  it("seededRange stays within [min, max) + is stable", () => {
    for (let i = 0; i < 64; i++) {
      const r = seededRange(i, i, 2, 5, 9);
      expect(r).toBeGreaterThanOrEqual(5);
      expect(r).toBeLessThan(9);
    }
    expect(seededRange(7, 1, 2, 0, 100)).toBe(seededRange(7, 1, 2, 0, 100));
  });

  it("seededPick picks from the array, deterministically + in-bounds", () => {
    const arr = ["a", "b", "c", "d"] as const;
    const p = seededPick(7, 0, 3, arr);
    expect(arr).toContain(p);
    expect(seededPick(7, 0, 3, arr)).toBe(p);
    // never out of bounds across many draws
    for (let i = 0; i < 100; i++) expect(arr).toContain(seededPick(i, i, 1, arr));
  });
});
