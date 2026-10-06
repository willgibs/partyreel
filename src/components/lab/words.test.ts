import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { RETIRED } from "@/app/(dev)/design/_data/glossary";
import { entries, filesUnder, read } from "@/testing/source-tree";

/**
 * THE LAB'S WORDS ARE THE PROGRAM'S (the lab revamp, 2026-09-29).
 *
 * A pick is the best of what one round drew, a working version and never a
 * rule (CLAUDE.md, "Rising tides"), so the lab no longer says Will "ruled",
 * gave "a ruling", has something "to rule" on or "ratified" anything. The set is the glossary's: a
 * decision is answered with a PICK; a catalog card or a Library entry gets a
 * VERDICT; an ANSWER is either, and the ledger records answers. This refuses
 * the old words wherever the lab, the kit or the docs say them, and the
 * glossary's retired list is the one place they stand, to be looked up.
 *
 * Production's own comments are not the lab's and are not read here, nor are
 * the track manifests (a lane's working notes, deleted at its merge) or the
 * ledgers (Will's own words).
 */
const ROOT = process.cwd();
const OLD = /\b(?:un)?rul(?:ed|ing|ings)\b|\bto rule\b|\bratif/i;

const SCANNED = [
  "src/app/(dev)/design",
  "src/components/lab",
  "usher/kit",
  "docs",
  "CLAUDE.md",
];
const SCRIPTS = /^(lab-[a-z-]+|new-board)\.mjs$/;
const SKIPPED = ["docs/tracks", "src/components/lab/words.test.ts"];
const GLOSSARY = "src/app/(dev)/design/_data/glossary.ts";

/**
 * ★ THE DOC LINES THE LAB CANNOT EDIT, AND THIS LIST ONLY SHRINKS. Each is
 * outside the lab revamp's lane: its new words are in that lane's Handoff for
 * the Orchestrator's merge, and an entry whose words are gone is refused
 * below, so the list empties as they land. A retired line takes its entry
 * with it.
 */
const NOT_YET: readonly { file: string; says: string; why: string }[] = [];

/**
 * A scanned folder's files at any depth, or the scanned file itself
 * (CLAUDE.md); a SKIPPED path leaves out everything under it.
 */
function filesIn(path: string): string[] {
  const listed: readonly string[] = statSync(join(ROOT, path)).isDirectory()
    ? filesUnder(path)
    : [path];
  return listed.filter(
    (rel) =>
      !SKIPPED.some((skip) => rel === skip || rel.startsWith(`${skip}/`)) &&
      /\.(ts|tsx|mjs|js|css|md|sh|py|txt)$/.test(rel),
  );
}

const files = [
  ...SCANNED.flatMap((p) => filesIn(p)),
  ...entries("scripts")
    .map((entry) => entry.name)
    .filter((f) => SCRIPTS.test(f))
    .map((f) => `scripts/${f}`),
];

describe("the lab's words", () => {
  it("never say ruled, ruling or ratified", () => {
    const said: string[] = [];
    for (const file of files) {
      const lines = read(file).split("\n");
      lines.forEach((line, i) => {
        if (!OLD.test(line)) return;
        // The glossary's retired list names them, which is how a reader who
        // meets one in an old comment finds its word today.
        if (file === GLOSSARY && /^\s*term: "/.test(line)) return;
        if (NOT_YET.some((n) => n.file === file && line.includes(n.says)))
          return;
        said.push(`${file}:${i + 1} ${line.trim().slice(0, 120)}`);
      });
    }
    expect(
      said,
      "a decision is answered with a pick, a card or entry gets a verdict, and either is an answer",
    ).toEqual([]);
  });

  it("look the old words up in the glossary's retired list", () => {
    const retired = RETIRED.map((r) => r.term.toLowerCase()).join(" ");
    for (const word of ["ruling", "ruled", "ratified"])
      expect(retired, `the glossary retires "${word}"`).toContain(word);
  });

  it("carries no exemption whose doc line has changed", () => {
    for (const n of NOT_YET)
      expect(
        readFileSync(join(ROOT, n.file), "utf8").includes(n.says),
        `${n.file} no longer says "${n.says}": delete its NOT_YET entry`,
      ).toBe(true);
  });
});
