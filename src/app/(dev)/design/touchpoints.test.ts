import { describe, expect, it } from "vitest";

import { BOARDS } from "./sandbox/registry";
import { RULINGS, SANDBOX } from "./touchpoints";

/**
 * The board registry stays a registry: unique ids, one-line whys, the files
 * each board redraws, and a row for exactly the boards the dispatcher renders
 * (an extra one would 404 at runtime; a missing one would hide a standing
 * board from the sidebar).
 */
describe("the design lab's board registry", () => {
  it("has a unique id per board", () => {
    const ids = RULINGS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every ask and why to one line and names what every board redraws", () => {
    for (const r of RULINGS) {
      expect(r.asks.length, `${r.id}: asks nothing`).toBeGreaterThan(0);
      expect(r.why, r.id).not.toMatch(/\n/);
      expect(r.why.length, `${r.id}: why is too long`).toBeLessThanOrEqual(170);
      expect(r.lives.length, `${r.id}: lives is empty`).toBeGreaterThan(0);
    }
  });

  it("holds a row for exactly the standing sandbox boards", () => {
    // DERIVED, not listed: the registry's boards, whichever those are today. A
    // hand list here would make every lane that adds or retires a board edit
    // one more shared file. A board whose picks are built leaves both.
    expect(SANDBOX.map((r) => r.id).sort()).toEqual(
      BOARDS.map((b) => b.id).sort(),
    );
  });
});
