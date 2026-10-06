import { describe, expect, it } from "vitest";

import { entries, filesUnder, read } from "@/testing/source-tree";

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

const KIT = "src/components/lab";

/** Every source file under `dir`, tests excluded. */
function sources(dir: string): string[] {
  return filesUnder(dir).filter((path) => {
    const folders = path.slice(dir.length + 1).split("/");
    const name = folders.pop() ?? "";
    if (folders.some((f) => f === "node_modules" || f.startsWith(".")))
      return false;
    return /\.(ts|tsx|mjs)$/.test(name) && !/\.test\./.test(name);
  });
}

/** A file's text with its comments blanked, so a name in prose is not a use. */
function code(path: string): string {
  return read(path)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
}

const ALL = sources("src").map((path) => ({
  path,
  text: code(path),
}));

const exported = entries(KIT)
  .map((entry) => entry.name)
  .filter((f) => f.endsWith(".tsx") && !f.includes(".test."))
  .flatMap((file) => {
    const text = code(`${KIT}/${file}`);
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
