import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import * as FRONT_DOOR from "@/components/lab";
import { BOARD_FOLDERS, PREDATES } from "@/app/(dev)/design/sandbox/registry";

/**
 * A BOARD USES THE KIT THROUGH ITS FRONT DOOR, AND NEVER COPIES IT.
 *
 * Every board before the kit built its own `Part`, its own `Knob`, its own
 * paste and its own page frame, because there was nowhere else to put them,
 * and the same landmine was paid for three times. The migration those boards
 * went through is over (its exemption list emptied and is gone, the lab
 * revamp, 2026-09-29), and what it left is two rules:
 *
 * ★ A BOARD REACHES THE KIT THROUGH TWO DOORS ONLY: `@/components/lab` for
 * what its drawings draw with, and `@/components/lab/exploration` for its spec
 * and any pure data beside it. Everything else under `src/components/lab/` is
 * the machinery the board rides on, which a board reaching into would couple
 * to (the lab revamp trimmed the front door to what boards use, so a piece a
 * new board needs is added there, in the open, rather than imported around it).
 *
 * ★ A BOARD NEVER DECLARES WHAT THE FRONT DOOR GIVES IT, by name, because the
 * failure is always a copy of the piece under the piece's own name: a board
 * with its own `Fit` has a second zoom rule, and a reviewer walking two boards
 * reads two designs.
 *
 * The two boards that predate the folder shape (`PREDATES`) are exempt from
 * the first rule until their wiring lanes retire them.
 */
const ROOT = process.cwd();
const SANDBOX = "src/app/(dev)/design/sandbox";
const DOORS = ["@/components/lab", "@/components/lab/exploration"];

/** The front door's value exports: the pieces a board imports and never declares. */
const OWNED = Object.keys(FRONT_DOOR);

function filesIn(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) filesIn(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe("a board", () => {
  it("reaches the kit through its two doors", () => {
    const offences: string[] = [];
    for (const id of BOARD_FOLDERS.filter((b) => !(b in PREDATES))) {
      for (const file of filesIn(join(ROOT, SANDBOX, id))) {
        const src = readFileSync(file, "utf8");
        for (const [, path] of src.matchAll(
          /from\s+"(@\/components\/lab[^"]*)"/g,
        )) {
          if (!DOORS.includes(path))
            offences.push(`${relative(ROOT, file)} imports ${path}`);
        }
      }
    }
    expect(
      offences,
      "import it from @/components/lab (a spec's kit from @/components/lab/exploration); a piece a board needs is added to src/components/lab/index.ts",
    ).toEqual([]);
  });

  it("declares nothing the front door gives it", () => {
    expect(OWNED).toContain("ExplorationBoard");
    const offences: string[] = [];
    for (const id of BOARD_FOLDERS) {
      for (const file of filesIn(join(ROOT, SANDBOX, id))) {
        if (/\.test\.tsx?$/.test(file)) continue;
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

  it("has its spec and its board at the folder's root", () => {
    for (const id of BOARD_FOLDERS) {
      const root = readdirSync(join(ROOT, SANDBOX, id));
      expect(root, `${id} has no spec.ts`).toContain("spec.ts");
      expect(root, `${id} has no board.tsx`).toContain("board.tsx");
    }
  });
});
