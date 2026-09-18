import { describe, expect, it } from "vitest";

import { RULINGS, SANDBOX } from "./touchpoints";

/**
 * The rulings registry stays a registry: unique ids, one-line whys, a home for
 * every rule, and `board` set on exactly the boards the dispatcher renders (an
 * extra one would 404 at runtime; a missing one would hide a standing board
 * from the sidebar).
 */
describe("the design lab's rulings registry", () => {
  it("has a unique id per ruling and a non-empty record", () => {
    const ids = RULINGS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(30);
  });

  it("keeps every why to one line and names where every rule lives", () => {
    for (const r of RULINGS) {
      expect(r.why, r.id).not.toMatch(/\n/);
      expect(r.why.length, `${r.id}: why is too long`).toBeLessThanOrEqual(170);
      expect(r.lives.length, `${r.id}: lives is empty`).toBeGreaterThan(0);
    }
  });

  it("marks exactly the standing sandbox boards", () => {
    expect(SANDBOX.map((r) => r.id).sort()).toEqual(
      [
        "glow-doctrine",
        "glow-moments",
        // the two legacy marketing boards retired to the record in the
        // Library x Lab migration wave (2026-09-15), and five more with their
        // rulings on 2026-09-17: the palette (Graphite), the home hero (whose
        // favourite ships as cinema-hero.tsx), the type scale (B, rungs, now
        // the nine --text-* steps in theme.css), light (both shadows by
        // role and the bright edge, now two tokens and one attribute in
        // globals.css) and floating surfaces (Card's anatomy, the nested
        // corner and the entrances by frequency, now ui/floating-layer.ts and
        // the menu's new parts). A ruled board leaves sandbox/ and keeps only
        // its RULINGS row; type-phone and rounding (the review wave's last
        // board) left the same way on 2026-09-18, into theme.css and the
        // radius tokens
        // round four (2026-09-15): the burst and the river, killed as heroes
        "album-hero",
        "river-visual",
        // the ninth batch (2026-09-18): the river in the QR door
        "river-card",
      ].sort(),
    );
    for (const r of SANDBOX) expect(r.ruled, r.id).toMatch(/open/);
  });
});
