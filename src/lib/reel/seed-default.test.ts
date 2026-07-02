import { describe, expect, it } from "vitest";

import { defaultReelSeed, SEED_MAX } from "./seed-default";

describe("defaultReelSeed (the un-shuffled WYSIWYG seed)", () => {
  it("is stable per event id + stays < SEED_MAX (the V8-exact multiply invariant)", () => {
    const id = "2485e1e6-12b1-4d02-aee3-1e2bb5d38d4f";
    expect(defaultReelSeed(id)).toBe(defaultReelSeed(id));
    expect(defaultReelSeed(id)).toBeGreaterThanOrEqual(0);
    expect(defaultReelSeed(id)).toBeLessThan(SEED_MAX);
  });

  it("differs across event ids", () => {
    expect(defaultReelSeed("event-a")).not.toBe(defaultReelSeed("event-b"));
  });

  it("every seed it produces is < 1e6 (so seeded()'s multiply stays exact in V8)", () => {
    for (const id of ["", "x", "a-very-long-event-identifier-string", "🎉🎬"]) {
      const s = defaultReelSeed(id);
      expect(s).toBeLessThan(1_000_000);
      expect(Number.isInteger(s)).toBe(true);
    }
  });
});
