import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { KIT_PIECES } from "./notes";

/**
 * THE TOOLBOX PAGE LISTS THE FRONT DOOR, THE WHOLE OF IT AND NOTHING ELSE
 * (the lab revamp, 2026-09-29). It is the page a board lane's brief points
 * at, so a piece a board can import that the page does not explain is a piece
 * the next board rebuilds, and a row for a piece that left is a lie.
 */
const INDEX = join(process.cwd(), "src/components/lab/index.ts");

/** Every name `index.ts` exports, types included (they are the API too). */
function frontDoor(): string[] {
  const src = readFileSync(INDEX, "utf8");
  const names: string[] = [];
  for (const [, list] of src.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g))
    for (const part of list.split(",")) {
      const name = part.trim().replace(/^type\s+/, "");
      if (name) names.push(name);
    }
  return names.sort();
}

describe("the toolbox page", () => {
  it("has a row for every name the front door exports, and none for another", () => {
    const listed = KIT_PIECES.flatMap((p) => p.names).sort();
    expect(listed).toEqual(frontDoor());
  });

  it("points every row at a file that exists", () => {
    for (const p of KIT_PIECES)
      expect(existsSync(join(process.cwd(), p.file)), p.file).toBe(true);
  });
});
