import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * EVERY COMPONENT THE KIT EXPORTS IS DRAWN SOMEWHERE (lab-sitting, from
 * ROADMAP's line on the dock: `AppliedBadge`, `ReplayButton` and
 * `MotionToggle` were exported by `dock.tsx` and imported nowhere).
 *
 * A component left behind by the page-shaped board the question-first
 * exploration replaced reads, to the next author, as a piece of the kit to
 * reach for: it is documented, typed and exported, and nothing on the desk
 * draws it. So a kit module's exported component must be used, in another
 * file or in its own beyond its definition, or it goes. Comments do not count
 * as a use (a doc line naming a retired piece is no drawing of it).
 *
 * Components only (an exported function whose name is capitalised): a type or
 * a helper exported for a test to read is the module's API, and a dead one
 * costs nobody a wrong turn.
 */

const KIT = join(process.cwd(), "src", "components", "lab");

/** Every source file under `dir`, tests excluded. */
function sources(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      out.push(...sources(path));
    } else if (/\.(ts|tsx|mjs)$/.test(name) && !/\.test\./.test(name)) {
      out.push(path);
    }
  }
  return out;
}

/** A file's text with its comments blanked, so a name in prose is not a use. */
function code(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
}

const ALL = sources(join(process.cwd(), "src")).map((path) => ({
  path,
  text: code(path),
}));

const exported = readdirSync(KIT)
  .filter((f) => f.endsWith(".tsx") && !f.includes(".test."))
  .flatMap((file) => {
    const text = code(join(KIT, file));
    return [...text.matchAll(/^export function ([A-Z]\w*)/gm)].map((m) => ({
      file,
      name: m[1],
    }));
  });

describe("the kit's components", () => {
  it("finds the kit's exported components to check", () => {
    // The premise: a regex that matched nothing would pass every kit.
    expect(exported.map((e) => e.name)).toEqual(
      expect.arrayContaining(["BoardDock", "Frame", "Step"]),
    );
  });

  it("draws every component a kit module exports, somewhere", () => {
    const unused = exported.filter(({ name }) => {
      const word = new RegExp(`\\b${name}\\b`, "g");
      let uses = 0;
      for (const f of ALL) uses += f.text.match(word)?.length ?? 0;
      // The definition is one occurrence, in its own file.
      return uses <= 1;
    });
    expect(unused.map((u) => `${u.file}: ${u.name}`)).toEqual([]);
  });
});
