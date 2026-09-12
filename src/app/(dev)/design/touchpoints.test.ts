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
        "home-hero",
        "marketing-decomposition",
        "marketing-hero-substrate",
      ].sort(),
    );
    for (const r of SANDBOX) expect(r.ruled, r.id).toMatch(/open/);
  });
});
