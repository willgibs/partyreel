import { describe, expect, it } from "vitest";

import { linkOf, PARTIES, titleOf } from "./fixtures";
import {
  CELLS_BY_RING,
  CLEAR_R,
  finder,
  matrixOf,
  MID,
  MODULES,
  RINGS,
} from "./qr";

/**
 * The code's one grid is what lets a new address bloom out of the old one's
 * place (`code.tsx`), so every value the board can ever draw has to fit it:
 * each address the hero types, every prefix of one and the bare domain. A
 * longer list or a longer domain fails here, not as a crash on the page.
 */
describe("the code's grid", () => {
  const values = new Set<string>([linkOf("")]);
  for (const p of PARTIES)
    for (let n = 0; n <= p.slug.length; n++)
      values.add(linkOf(p.slug.slice(0, n)));

  it("holds every value the board can draw at its one version", () => {
    for (const v of values) {
      const m = matrixOf(v);
      expect(m.length, v).toBe(MODULES * MODULES);
    }
  });

  it("gives each address a code of its own", () => {
    const codes = PARTIES.map((p) => matrixOf(linkOf(p.slug)).join(""));
    expect(new Set(codes).size).toBe(PARTIES.length);
  });

  it("keeps every data dot out of the eyes and the heart, each in its ring", () => {
    const seen = new Set<number>();
    CELLS_BY_RING.forEach((ring, k) => {
      expect(k).toBeLessThan(RINGS);
      for (const cell of ring) {
        const r = Math.floor(cell.i / MODULES);
        const c = cell.i % MODULES;
        expect(finder(r, c)).toBe(false);
        expect(Math.hypot(cell.x - MID, cell.y - MID)).toBeGreaterThanOrEqual(
          CLEAR_R,
        );
        expect(seen.has(cell.i)).toBe(false);
        seen.add(cell.i);
      }
    });
  });

  it("gives the heart about a twentieth of the code, well inside the quarter Q recovers", () => {
    let covered = 0;
    for (let r = 0; r < MODULES; r++)
      for (let c = 0; c < MODULES; c++)
        if (!finder(r, c) && Math.hypot(c + 0.5 - MID, r + 0.5 - MID) < CLEAR_R)
          covered++;
    expect(covered / (MODULES * MODULES)).toBeLessThan(0.06);
  });
});

describe("the words the hero reads off an address", () => {
  it("names a card in a host's own words", () => {
    expect(titleOf("our-wedding")).toBe("Our wedding");
    expect(titleOf("my-30th")).toBe("My 30th");
    expect(titleOf("our-w")).toBe("Our w");
    expect(titleOf("")).toBe("");
  });
});
