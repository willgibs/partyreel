// ★ PENDING, NOT ABANDONED: strip "-pending" to publish these contracts on the
// library page. The collector indexes every file a @contract-for names, and an
// indexed file owes a `for` line in rules/component-notes.ts (gallery.test.ts
// fails without one). That file and the collector's COMPONENT_DIRS are the
// lab-library and lab-rules lanes, so the nine lines are asked for in this
// track's Handoff with the exact patch. The tests below RUN either way: the
// marker publishes a contract, it does not create one.
// @contract-for: src/components/lab/dock.tsx
// @contract-for: src/components/lab/specimen.tsx
// @contract-for: src/components/lab/board-state.tsx
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { BOARDS } from "@/app/(dev)/design/sandbox/registry";

/**
 * THE MIGRATION'S RATCHET.
 *
 * Every board before the kit built its own `Part`, its own `Knob`, its own
 * paste, its own apply button and its own page frame, because there was nowhere
 * else to put them. That is why the same landmine was paid for three times (the
 * stage-in-a-flex-row, the listener identity, the candidate's source order) and
 * why two boards could look like two different products.
 *
 * ★ A MIGRATED BOARD MAY NOT RE-DECLARE A KIT PIECE. The moment a board on the
 * template writes its own `Part` again, it has a second header grammar, and a
 * reviewer walking two boards is reading two designs. The check is by
 * declaration NAME rather than by shape, because the failure is always a copy of
 * the piece under the piece's own name.
 *
 * ★ AND THE EXEMPTION LIST ONLY SHRINKS. An unmigrated board is listed here by
 * id; the wave deletes its line when it migrates. A new board cannot be added to
 * the list, because a new board is written on the template.
 */
const ROOT = process.cwd();
const SANDBOX = "src/app/(dev)/design/sandbox";

/** Pieces the kit owns. A migrated board imports them; it never declares them. */
const OWNED = [
  "Row",
  "Part",
  "Knob",
  "PageFrame",
  "ApplyToSite",
  "CostMeter",
  "Paste",
  "CellLabel",
  "Labeled",
  "Cell",
  "BoardIndex",
  "RuleIndex",
];

/**
 * The boards still on the legacy path, by id. Every one of them is a line the
 * migration wave deletes; nothing is ever added.
 */
const LEGACY: readonly string[] = [
  "brand-voice",
  "floating-surfaces",
  "media-kit",
  "palette",
  "type-scale",
];

function filesIn(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) filesIn(p, out);
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe("a migrated board", () => {
  const migrated = BOARDS.map((b) => b.id);

  it("declares nothing the kit owns", () => {
    const offences: string[] = [];
    for (const id of migrated) {
      for (const file of filesIn(join(ROOT, SANDBOX, id))) {
        const src = readFileSync(file, "utf8");
        for (const name of OWNED) {
          const declared = new RegExp(
            `(?:export\\s+)?(?:function|const|class)\\s+${name}\\b`,
          );
          if (declared.test(src)) {
            offences.push(`${relative(ROOT, file)} declares ${name}`);
          }
        }
      }
    }
    expect(offences, "import it from @/components/lab instead").toEqual([]);
  });

  it("imports the kit from its new home, never the shim", () => {
    const offences: string[] = [];
    for (const id of migrated) {
      for (const file of filesIn(join(ROOT, SANDBOX, id))) {
        if (readFileSync(file, "utf8").includes("@/components/dev/board")) {
          offences.push(relative(ROOT, file));
        }
      }
    }
    expect(offences, "a migrated board uses @/components/lab").toEqual([]);
  });

  it("is two files at its root: a spec and a board", () => {
    for (const id of migrated) {
      const root = readdirSync(join(ROOT, SANDBOX, id));
      expect(root, `${id} has no spec.ts`).toContain("spec.ts");
      expect(root, `${id} has no board.tsx`).toContain("board.tsx");
    }
  });

  it("is never also on the legacy list", () => {
    const both = migrated.filter((id) => LEGACY.includes(id));
    expect(both, "a migrated board is still listed as legacy").toEqual([]);
  });

  it("leaves only boards that exist on the legacy list", () => {
    const gone = LEGACY.filter(
      (id) => !readdirSync(join(ROOT, SANDBOX)).includes(id),
    );
    expect(
      gone,
      "a legacy exemption outlived its board; delete the line",
    ).toEqual([]);
  });
});
