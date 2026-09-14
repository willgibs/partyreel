import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BIBLE, BIBLE_GROUPS } from "./bible";

/**
 * THE BIBLE'S SHAPE: every rule numbered in order, named once, said in one
 * or two sentences with a why, honest about its enforcement (a test that
 * exists, or "review") and, after a review, about where it stands (a status
 * naming the board or track it inherits from). It does not check what the
 * rules say; that is Will's.
 */
const ROOT = process.cwd();

describe("the bible", () => {
  it("numbers its rules from one, in order, with a unique id each", () => {
    expect(BIBLE.map((r) => r.n)).toEqual(BIBLE.map((_, i) => i + 1));
    expect(new Set(BIBLE.map((r) => r.id)).size).toBe(BIBLE.length);
    for (const r of BIBLE) expect(r.id, r.id).toMatch(/^[a-z0-9-]+$/);
  });

  it("says each rule in one or two sentences, with a why", () => {
    for (const r of BIBLE) {
      expect(r.statement.trim().length, r.id).toBeGreaterThan(0);
      expect(r.statement, r.id).not.toMatch(/\n/);
      expect(r.statement.trim(), r.id).toMatch(/\.$/);
      expect(r.why.trim().length, r.id).toBeGreaterThan(0);
      expect(r.why, r.id).not.toMatch(/\n/);
      expect(BIBLE_GROUPS, r.id).toContain(r.group);
      expect(r.ruledOn, r.id).toMatch(/^20\d\d-\d\d-\d\d$/);
    }
  });

  it("names tests that exist, or says review", () => {
    for (const r of BIBLE) {
      if (r.enforcedBy === "review") continue;
      expect(
        r.enforcedBy.length,
        `${r.id}: an empty list is review`,
      ).toBeGreaterThan(0);
      for (const path of r.enforcedBy) {
        expect(
          existsSync(join(ROOT, path)),
          `${r.id}: enforcedBy names a missing test: ${path}`,
        ).toBe(true);
      }
    }
  });

  it("names a slug for the board or track a reviewed rule inherits from", () => {
    for (const r of BIBLE) {
      if (
        r.status === undefined ||
        r.status === "ruled" ||
        r.status === "retired"
      )
        continue;
      expect(r.status, r.id).toMatch(
        /^(under exploration|retiring): [a-z0-9-]+$/,
      );
    }
  });
});
