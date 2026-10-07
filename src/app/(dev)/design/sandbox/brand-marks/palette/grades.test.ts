import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { floors, GRADES, gradePaste, type PlateId } from "./grades";

/**
 * THE PLATES' TWO PROMISES, held where Will can trust them without reading a
 * number: the lifted plate IS production's grade (so the room's own black is
 * judged against what is built, never against a lane's guess at it), and no
 * plate lets a text step fall under its floor.
 */

const ROOT = process.cwd();
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const norm = (v: string) => v.replace(/\s+/g, " ").trim();

/** Every plain rule's declarations, by its selector as written (comma-spaced). */
function blocks(css: string) {
  const out: { sel: string; decls: Map<string, string> }[] = [];
  for (const m of strip(css).matchAll(
    /(^|\n|\})\s*([^{}@;]+?)\s*\{([^{}]*)\}/g,
  )) {
    const decls = new Map<string, string>();
    for (const d of m[3].split(";")) {
      const i = d.indexOf(":");
      if (i >= 0) decls.set(d.slice(0, i).trim(), norm(d.slice(i + 1)));
    }
    out.push({ sel: norm(m[2]).replace(/\s*,\s*/g, ", "), decls });
  }
  return out;
}

const PRODUCTION = [
  ...blocks(readFileSync(join(ROOT, "src/app/globals.css"), "utf8")),
  ...blocks(
    readFileSync(join(ROOT, "src/app/(marketing)/marketing.css"), "utf8"),
  ),
];

describe("the plates", () => {
  it("draws the lifted plate as production's own grade, value for value", () => {
    const differ: string[] = [];
    let checked = 0;
    for (const b of blocks(gradePaste(GRADES.lifted))) {
      const theirs = PRODUCTION.filter((p) => p.sel === b.sel);
      for (const [token, value] of b.decls) {
        // The ember's stops and the relit lamps are the one thing it adds.
        if (/^--(ember|lamp)-/.test(token)) continue;
        checked++;
        const said = theirs.map((p) => p.decls.get(token)).filter(Boolean);
        if (!said.includes(value))
          differ.push(
            `${b.sel} ${token}: ${value} (production: ${said.join(" | ") || "none"})`,
          );
      }
    }
    expect(checked, "the paste restates nothing").toBeGreaterThan(80);
    expect(differ).toEqual([]);
  });

  it("keeps every text step over its floor, on either plate", () => {
    const under: string[] = [];
    for (const id of Object.keys(GRADES) as PlateId[]) {
      for (const [key, r] of Object.entries(floors(GRADES[id]))) {
        if (r.ink < 7) under.push(`${id} ${r.where}: ink ${r.ink.toFixed(2)}`);
        if (r.muted < 4.5)
          under.push(`${id} ${r.where}: muted ${r.muted.toFixed(2)}`);
        // A held row on the room's display is production's one documented
        // place under it (globals.css: AA there would close the gap to the
        // muted step), and either plate keeps it as production does.
        if (key !== "roomScreenRow" && r.faint < 4.5)
          under.push(`${id} ${r.where}: faint ${r.faint.toFixed(2)}`);
      }
    }
    expect(under).toEqual([]);
  });
});
