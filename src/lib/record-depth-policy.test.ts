import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE RECORD IS A SNAPSHOT. Nothing under docs/ is history (Will): a doc states
 * the current rule, fact or state, STATUS is rewritten in place, CLAUDE.md is the
 * per-session tax, and what shipped lives in the merge commits and `git log`. A
 * doc that needs a bigger cap says so here, in the same commit, with the reason.
 */
const read = (rel: string) =>
  readFileSync(join(process.cwd(), rel), "utf8").replace(/\n$/, "");
const lineCount = (s: string) => s.split("\n").length;

describe("the record's depth", () => {
  it("keeps no CHANGELOG: the merge commits and git log are the record of what shipped", () => {
    expect(existsSync(join(process.cwd(), "docs/CHANGELOG.md"))).toBe(false);
  });

  it("keeps STATUS a snapshot: the current round, under 80 lines, no previous round", () => {
    const body = read("docs/STATUS.md");
    expect(lineCount(body)).toBeLessThanOrEqual(80);
    expect(body).toMatch(/^\*\*Updated:\*\* \d{4}-\d{2}-\d{2}/m);
    expect(body).toMatch(/^## The current round/m);
    expect(body, "a snapshot holds no previous round").not.toMatch(/^## The previous round/m);
  });

  it("keeps CLAUDE.md, the per-session tax, at 150 lines or fewer", () => {
    expect(lineCount(read("CLAUDE.md"))).toBeLessThanOrEqual(150);
  });
});
