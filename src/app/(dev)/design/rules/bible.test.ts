import { describe, expect, it } from "vitest";

import { BIBLE, BIBLE_GROUPS } from "./bible";

/**
 * THE BIBLE'S SHAPE: every principle numbered in order, with a unique slug (the
 * Library anchors on it), said in one or two sentences with its reason, in a
 * group the page renders. It never checks what a principle says; that is
 * Will's, and it changes in one edit in bible.ts.
 */
describe("the bible", () => {
  it("numbers its principles from one, in order, with a unique slug each", () => {
    expect(BIBLE.map((r) => r.n)).toEqual(BIBLE.map((_, i) => i + 1));
    expect(new Set(BIBLE.map((r) => r.id)).size).toBe(BIBLE.length);
    for (const r of BIBLE) expect(r.id, r.id).toMatch(/^[a-z0-9-]+$/);
  });

  it("says each principle on one line, with its reason, in a known group", () => {
    for (const r of BIBLE) {
      expect(r.statement.trim().length, r.id).toBeGreaterThan(0);
      expect(r.statement, r.id).not.toMatch(/\n/);
      expect(r.statement.trim(), r.id).toMatch(/\.$/);
      expect(r.why.trim().length, r.id).toBeGreaterThan(0);
      expect(r.why, r.id).not.toMatch(/\n/);
      expect(BIBLE_GROUPS, r.id).toContain(r.group);
    }
  });
});
