// @policy: engineering · Keyframe names are unique
// @refuses: a second @keyframes of the same name in any stylesheet, which shadows the first for the rest of the session.

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

describe("@keyframes names are unique across every stylesheet", () => {
  const sheets = [
    "src/app/globals.css",
    "src/app/(marketing)/marketing.css",
    ...cssFilesUnder("src/app/(dev)/design"),
  ];

  it("reads every sheet the app or the lab can load", () => {
    // The pin is only as good as its net: the lab must contribute at least its
    // own sheet plus the sandbox boards' sheets.
    expect(sheets.length).toBeGreaterThanOrEqual(5);
  });

  it("declares every keyframe name exactly once", () => {
    const owners = new Map<string, string[]>();
    for (const rel of sheets) {
      const css = readFileSync(join(ROOT, rel), "utf8");
      for (const m of css.matchAll(/@keyframes\s+([\w-]+)/g)) {
        owners.set(m[1], [...(owners.get(m[1]) ?? []), rel]);
      }
    }
    expect(owners.size, "no keyframes found at all").toBeGreaterThan(30);
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
