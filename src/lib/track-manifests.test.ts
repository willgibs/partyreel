import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

/**
 * THE LANE GUARD. Every parallel branch claims path prefixes in
 * docs/tracks/<track>.md (the operating model, 2026-09-02); this pins the
 * manifests' shape and refuses two live tracks claiming the same ground, which
 * is the collision a branch name cannot express. Prefixes, not globs: overlap
 * is exact and needs no library. "Touched a path outside the claim" is not a
 * tree property; that is the lane check the agent pastes into Handoff and the
 * Orchestrator re-runs (docs/tracks/README.md).
 */

const DIR = join(process.cwd(), "docs", "tracks");
const STATUSES = ["open", "handed-off", "integrated"];
// Nobody claims these: the Orchestrator alone edits them (CLAUDE.md "Git").
const NEVER_OWNED = [
  "docs/CHANGELOG.md",
  "docs/STATUS.md",
  "docs/ROADMAP.md",
  "docs/PROGRAM.md",
  "CLAUDE.md",
  "AGENTS.md",
  "src/lib/db/types.ts",
  "docs/tracks/",
  "docs/ASSETS.md",
  // Will's verbatim rulings and the review ledgers (the Library x Lab round):
  // the Orchestrator writes both from his messages; no track claims them.
  "docs/design/rulings.md",
  "docs/reviews/",
];

type Manifest = {
  file: string;
  track: string;
  status: string;
  owns: string[];
  reads?: string[];
};

const manifests: Manifest[] = readdirSync(DIR)
  .filter((f) => f.endsWith(".md") && f !== "README.md")
  .map((f) => ({
    file: f,
    ...(matter(readFileSync(join(DIR, f), "utf8")).data as Omit<
      Manifest,
      "file"
    >),
  }));

const covers = (claim: string, p: string) =>
  p === claim || p.startsWith(claim.endsWith("/") ? claim : `${claim}/`);

describe("track manifests", () => {
  it("scanned the tracks directory", () => {
    expect(manifests.length).toBeGreaterThan(0);
  });

  for (const m of manifests) {
    it(`${m.file} is well-formed`, () => {
      expect(m.file).toBe(`${m.track}.md`);
      expect(STATUSES, `status ${m.status}`).toContain(m.status);
      expect(m.owns?.length ?? 0, "owns is empty").toBeGreaterThan(0);
      for (const p of m.owns) {
        expect(p, "repo-relative prefix, no globs").not.toMatch(/^\/|\.\.|\*/);
        expect(
          p.split("/").filter(Boolean).length,
          `${p} is too broad`,
        ).toBeGreaterThan(1);
        for (const n of NEVER_OWNED) {
          expect(covers(p, n) || covers(n, p), `${p} claims ${n}`).toBe(false);
        }
      }
      for (const r of m.reads ?? []) {
        expect(
          existsSync(join(process.cwd(), r)),
          `read ${r} does not exist`,
        ).toBe(true);
        expect(
          m.owns.some((o) => covers(o, r)),
          `${r} is owned, not read`,
        ).toBe(false);
      }
    });
  }

  it("no two live tracks claim overlapping paths", () => {
    const live = manifests.filter((m) => m.status !== "integrated");
    for (const a of live) {
      for (const b of live) {
        if (a.track >= b.track) continue;
        for (const x of a.owns) {
          for (const y of b.owns) {
            expect(
              covers(x, y) || covers(y, x),
              `${a.track} owns ${x}; ${b.track} owns ${y}`,
            ).toBe(false);
          }
        }
      }
    }
  });
});
