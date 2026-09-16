// @policy: engineering · The record is two rounds deep
// @refuses: a third CHANGELOG entry or one over 160 lines, a STATUS over 120 lines without its two round sections, a CLAUDE.md over 150 lines.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE RECORD'S DEPTH (Will, 2026-09-16: "we're over-indexing the importance of
 * archival documentation"; history "highly limited to very recent work"). Nothing
 * under docs/ is history: the CHANGELOG holds the current round and the one
 * before, STATUS is a snapshot, CLAUDE.md is the per-session tax. Git holds the
 * rest. The caps are the plan's numbers; a doc that needs more says so here, in
 * the same commit, with the reason.
 */
const read = (rel: string) =>
  readFileSync(join(process.cwd(), rel), "utf8").replace(/\n$/, "");
const lineCount = (s: string) => s.split("\n").length;

describe("the record's depth", () => {
  it("keeps the CHANGELOG to two rounds, each under 160 lines, with the git pointer", () => {
    const body = read("docs/CHANGELOG.md");
    const lines = body.split("\n");
    const starts = lines
      .map((l, i) => (/^## \d{4}-\d{2}-\d{2}/.test(l) ? i : -1))
      .filter((i) => i >= 0);
    expect(starts.length, "entries (## <date> — <round>)").toBeGreaterThan(0);
    expect(
      starts.length,
      "at most two entries: the current round and the one before",
    ).toBeLessThanOrEqual(2);
    for (let k = 0; k < starts.length; k++) {
      const end = k + 1 < starts.length ? starts[k + 1] : lines.length;
      expect(
        end - starts[k],
        `entry "${lines[starts[k]].slice(0, 60)}" is over 160 lines`,
      ).toBeLessThanOrEqual(160);
    }
    expect(body, "the pointer at git for everything older").toMatch(/git log/);
  });

  it("keeps STATUS a snapshot: the current round, the previous round, under 120 lines", () => {
    const body = read("docs/STATUS.md");
    expect(lineCount(body)).toBeLessThanOrEqual(120);
    expect(body).toMatch(/^\*\*Updated:\*\* \d{4}-\d{2}-\d{2}/m);
    expect(body).toMatch(/^## The current round/m);
    expect(body).toMatch(/^## The previous round/m);
  });

  it("keeps CLAUDE.md, the per-session tax, at 150 lines or fewer", () => {
    expect(lineCount(read("CLAUDE.md"))).toBeLessThanOrEqual(150);
  });
});
