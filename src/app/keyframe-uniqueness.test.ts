import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Every @keyframes name across every stylesheet is unique.
 *
 * Keyframes are document-global and the last definition wins, so a lab sheet
 * that redeclares a production name shadows production for the rest of the
 * session the moment /design is visited. The lab carried NINE such collisions
 * (six mkt-* from the marketing-identity round, three from the reel rounds)
 * until the library round deleted those blocks (2026-09-02). This pin keeps the
 * count at zero: a board that needs its own animation prefixes it (glw-, the
 * board's own name), never reuses a production name.
 */
const ROOT = process.cwd();

function cssFilesUnder(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(".css"))
    .map((f) => `${dir}/${f}`);
}

/** The sheets that are always there, whatever boards stand. */
const FIXED = [
  "src/app/globals.css",
  "src/app/(marketing)/marketing.css",
  "src/app/(dev)/design/design.css",
];

/** A sheet's keyframe names, its comments stripped: prose that says
 *  "@keyframes names are document-global" is not a keyframe called "names". */
function keyframesIn(rel: string): string[] {
  const css = readFileSync(join(ROOT, rel), "utf8").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  );
  return [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
}

describe("@keyframes names are unique across every stylesheet", () => {
  const sheets = [
    ...new Set([...FIXED, ...cssFilesUnder("src/app/(dev)/design")]),
  ];

  it("reads every sheet the app or the lab can load", () => {
    // The pin is only as good as its net. The floor is the FIXED sheets, not a
    // count: a count of boards' sheets went red as boards retired (2026-09-18),
    // and a standing board's sheet is in the net because it is under the lab.
    expect(sheets).toEqual(expect.arrayContaining(FIXED));
  });

  it("declares every keyframe name exactly once", () => {
    const owners = new Map<string, string[]>();
    for (const rel of sheets) {
      for (const name of keyframesIn(rel)) {
        owners.set(name, [...(owners.get(name) ?? []), rel]);
      }
    }
    // A net that reads nothing passes forever: production's own sheets carry
    // 27 names today, so a reading under 20 means the reader broke.
    const production = new Set(FIXED.slice(0, 2).flatMap(keyframesIn));
    expect(production.size, "no keyframes found at all").toBeGreaterThan(20);
    const collisions = [...owners.entries()]
      .filter(([, files]) => files.length > 1)
      .map(([name, files]) => `${name}: ${files.join(", ")}`);
    expect(
      collisions,
      "a keyframe name is declared in more than one sheet; the last loaded wins " +
        "and silently shadows the other. Rename the lab copy with its board's prefix.",
    ).toEqual([]);
  });
});
