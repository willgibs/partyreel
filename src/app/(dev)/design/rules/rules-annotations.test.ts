import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  EXTRA_GUARDS,
  NOT_GUARDS,
  discoverGuardFiles,
  heuristicMatches,
} from "../../../../../scripts/design-rules/collect.mjs";
import {
  COMPONENT_NOTES,
  FILE_ANNOTATIONS,
  RULE_ANNOTATIONS,
} from "./annotations";
import { COMPONENTS, RULES } from "./rules";

/**
 * THE COVERAGE GUARD: the hand layer keeps up with the derived one. Every
 * guard test has exactly one file annotation and every annotation names a
 * guard test that exists; the include and exclude lists resolve and are not
 * vacuous; every verdict points at a rule that exists (or at a tombstone
 * whose rule is gone on purpose); a reworded rule is flagged for a re-read
 * rather than silently carrying an old verdict; every component file the
 * library does not import carries a reason.
 */
const ROOT = process.cwd();
const guards = discoverGuardFiles(ROOT);
const ruleIds = new Set(RULES.map((r) => r.id));
const titleOf = new Map(RULES.map((r) => [r.id, r.title]));

describe("the guard-test discovery", () => {
  it("found the guard tests", () => {
    expect(guards.length).toBeGreaterThanOrEqual(40);
  });

  it("keeps its include and exclude lists honest", () => {
    for (const rel of EXTRA_GUARDS) {
      expect(
        existsSync(join(ROOT, rel)),
        `EXTRA_GUARDS names a missing file: ${rel}`,
      ).toBe(true);
    }
    for (const rel of Object.keys(NOT_GUARDS)) {
      expect(
        existsSync(join(ROOT, rel)),
        `NOT_GUARDS names a missing file: ${rel}`,
      ).toBe(true);
      expect(
        heuristicMatches(ROOT, rel),
        `NOT_GUARDS excludes a file the heuristic no longer matches: ${rel}`,
      ).toBe(true);
    }
  });
});

describe("the file annotations", () => {
  it("cover every guard test exactly once", () => {
    const annotated = FILE_ANNOTATIONS.map((a) => a.file);
    expect(new Set(annotated).size, "a file annotated twice").toBe(
      annotated.length,
    );
    const missing = guards.filter((g) => !annotated.includes(g));
    expect(missing, "a guard test without a file annotation").toEqual([]);
    const stale = annotated.filter((a) => !guards.includes(a));
    expect(
      stale,
      "a file annotation for a test that is not a guard (or is gone)",
    ).toEqual([]);
  });

  it("say one line each about what the file guards", () => {
    for (const a of FILE_ANNOTATIONS) {
      expect(a.guards, a.file).not.toMatch(/\n/);
      expect(
        a.guards.length,
        `${a.file}: the guards line is too long`,
      ).toBeLessThanOrEqual(170);
      if (a.ruledOn) expect(a.ruledOn, a.file).toMatch(/^20\d\d-\d\d-\d\d$/);
    }
  });
});

describe("the rule annotations", () => {
  it("point at rules that exist, or at tombstones whose rule is gone", () => {
    for (const a of RULE_ANNOTATIONS) {
      if (a.id.startsWith("r:")) continue;
      if (a.droppedOn) {
        expect(
          ruleIds.has(a.id),
          `${a.id} was dropped on ${a.droppedOn} but its rule is back`,
        ).toBe(false);
        continue;
      }
      expect(
        ruleIds.has(a.id),
        `${a.id}: no such rule (reworded? run pnpm design:rules and re-key)`,
      ).toBe(true);
    }
  });

  it("carry the title they were written against (a reworded rule wants a re-read)", () => {
    for (const a of RULE_ANNOTATIONS) {
      if (a.droppedOn || a.id.startsWith("r:")) continue;
      expect(
        titleOf.get(a.id),
        `${a.id}: reworded since its verdict; re-read and re-affirm`,
      ).toBe(a.title);
    }
  });

  it("keep merges and intents well-formed", () => {
    const ids = new Set(RULE_ANNOTATIONS.map((a) => a.id));
    expect(ids.size, "a rule annotated twice").toBe(RULE_ANNOTATIONS.length);
    for (const a of RULE_ANNOTATIONS) {
      if (a.verdict === "merge") {
        expect(
          a.mergeInto,
          `${a.id}: a merge names what it folds into`,
        ).toBeTruthy();
        expect(
          ruleIds.has(a.mergeInto!),
          `${a.id}: mergeInto points at a missing rule`,
        ).toBe(true);
      }
      if (a.intent) {
        expect(a.intent, a.id).not.toMatch(/\n/);
        expect(
          a.intent.length,
          `${a.id}: intent is too long`,
        ).toBeLessThanOrEqual(170);
      }
    }
  });
});

describe("the component index", () => {
  it("renders every component in the library, or says why not", () => {
    const missing = COMPONENTS.filter(
      (c) => c.specimens.length === 0 && !COMPONENT_NOTES[c.file]?.unspecimened,
    ).map((c) => c.file);
    expect(
      missing,
      "a component without a specimen (or an unspecimened reason)",
    ).toEqual([]);
  });

  it("keeps its reasons for files that exist and still lack a specimen", () => {
    const byFile = new Map(COMPONENTS.map((c) => [c.file, c]));
    for (const [file, note] of Object.entries(COMPONENT_NOTES)) {
      const c = byFile.get(file);
      expect(
        c,
        `COMPONENT_NOTES names a file the index does not know: ${file}`,
      ).toBeTruthy();
      if (note.unspecimened) {
        expect(
          c!.specimens,
          `${file} has a specimen now; drop its unspecimened reason`,
        ).toEqual([]);
      }
    }
  });
});
