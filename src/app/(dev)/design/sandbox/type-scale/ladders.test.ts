import { describe, expect, it } from "vitest";

import {
  fluid,
  LADDERS,
  ladderById,
  RUNGS,
  STEPS,
  type Ladder,
  type StepId,
  type Surface,
  tokenTable,
} from "./ladders";

/**
 * The type-scale board's ladder laws, proven without a DOM.
 *
 * This is a BOARD's data contract, not a design rule: it exists so a candidate
 * cannot quietly stop being what its line on the board claims, and so today's
 * two documented faults stay documented while the board stands. It leaves with
 * the board when the ruling lands and the wiring round bakes the tokens.
 */

const CANDIDATES = LADDERS.filter((l) => l.id !== "today");
const surfaceOf = new Map<StepId, Surface>(STEPS.map((s) => [s.id, s.surface]));

/** A ladder's live steps on one surface at one end, smallest first. */
function rungsOf(ladder: Ladder, surface: Surface, end: "phone" | "desktop") {
  return STEPS.filter((s) => s.surface === surface)
    .filter((s) => ladder.steps[s.id] && ladder.aliases?.[s.id] === undefined)
    .map((s) => ({ id: s.id, ...ladder.steps[s.id]![end] }))
    .sort((a, b) => a.px - b.px);
}

describe("the step vocabulary", () => {
  it("gives every ladder an entry for every step", () => {
    for (const ladder of LADDERS) {
      for (const step of STEPS) {
        expect(ladder.steps).toHaveProperty(step.id);
      }
    }
  });

  it("names where each step lives in production", () => {
    for (const step of STEPS) {
      expect(step.where.length).toBeGreaterThan(10);
      expect(surfaceOf.get(step.id)).toBeDefined();
    }
  });
});

describe("the two faults the board is about", () => {
  // The whole reason this board exists: written out, today's phone end has
  // fewer distinct sizes than it has steps, and its tracking is one number for
  // a 160px masthead and a 16px card title alike. If a future edit "fixes"
  // TODAY, the board would be arguing against something the site no longer
  // does, so both faults are pinned rather than assumed.
  const today = ladderById("today");

  it("today's phone end collapses two marketing steps onto one size", () => {
    const sizes = rungsOf(today, "marketing", "phone").map((s) => s.px);
    expect(new Set(sizes).size).toBeLessThan(sizes.length);
    expect(today.steps.title!.phone.px).toBe(today.steps.chapter!.phone.px);
  });

  it("today tracks every step at the same -0.03em", () => {
    const tracking = new Set(
      STEPS.filter((s) => today.steps[s.id]).flatMap((s) => [
        today.steps[s.id]!.phone.ls,
        today.steps[s.id]!.desktop.ls,
      ]),
    );
    expect([...tracking]).toEqual([-0.03]);
  });

  it("today has no app step between the page title and the card title", () => {
    expect(today.steps.subsection).toBeNull();
  });
});

describe("every candidate separates its steps at both ends", () => {
  for (const ladder of CANDIDATES) {
    for (const surface of ["marketing", "app"] as const) {
      for (const end of ["phone", "desktop"] as const) {
        it(`${ladder.id}: ${surface} at ${end}`, () => {
          const sizes = rungsOf(ladder, surface, end).map((s) => s.px);
          expect(new Set(sizes).size).toBe(sizes.length);
        });
      }
    }
  }
});

describe("the tracking law: leading and tracking run inverse to size", () => {
  // design-system.md, "Icon + small-type rules": the system already states the
  // law; today's flat -0.03em is what does not implement it. Checked per
  // SURFACE, because two steps on different surfaces may swap order between
  // the two ends (a marketing prose head at 21 sits under an app page title at
  // 24 on a phone and over it on a desktop) without either ladder being wrong.
  for (const ladder of LADDERS) {
    for (const surface of ["marketing", "app"] as const) {
      for (const end of ["phone", "desktop"] as const) {
        it(`${ladder.id}: ${surface} at ${end}`, () => {
          const steps = rungsOf(ladder, surface, end);
          for (let i = 1; i < steps.length; i++) {
            expect(steps[i].lh).toBeLessThanOrEqual(steps[i - 1].lh);
            expect(steps[i].ls).toBeLessThanOrEqual(steps[i - 1].ls);
          }
        });
      }
    }
  }

  it("each candidate actually varies its tracking, today does not", () => {
    for (const ladder of CANDIDATES) {
      const tracking = new Set(
        STEPS.filter((s) => ladder.steps[s.id]).map(
          (s) => ladder.steps[s.id]!.desktop.ls,
        ),
      );
      expect(tracking.size).toBeGreaterThanOrEqual(5);
    }
  });
});

describe("B's law: marketing travels four rungs, the app travels one", () => {
  const b = ladderById("b");
  const index = (px: number) => RUNGS.indexOf(px as (typeof RUNGS)[number]);

  it("puts every step on a rung at both ends", () => {
    for (const step of STEPS) {
      const value = b.steps[step.id];
      if (!value) continue;
      expect(index(value.phone.px)).toBeGreaterThanOrEqual(0);
      expect(index(value.desktop.px)).toBeGreaterThanOrEqual(0);
    }
  });

  it("travels exactly four rungs on marketing and at most one on the app", () => {
    for (const step of STEPS) {
      const value = b.steps[step.id];
      if (!value) continue;
      const travel = index(value.desktop.px) - index(value.phone.px);
      if (step.surface === "marketing") expect(travel).toBe(4);
      else expect(travel).toBeLessThanOrEqual(1);
    }
  });

  it("widens the ratio as the rung set climbs", () => {
    const first = RUNGS[1] / RUNGS[0];
    const last = RUNGS[RUNGS.length - 1] / RUNGS[RUNGS.length - 2];
    expect(last).toBeGreaterThan(first);
  });
});

describe("C's law: two registers, marketing louder and the app quieter", () => {
  const today = ladderById("today");
  const c = ladderById("c");

  it("raises marketing's display step and lowers the app's page title", () => {
    expect(c.steps.display!.desktop.px).toBeGreaterThan(
      today.steps.display!.desktop.px,
    );
    expect(c.steps.page!.desktop.px).toBeLessThan(today.steps.page!.desktop.px);
  });

  it("folds the prose tier into the section step", () => {
    expect(c.aliases?.prose).toBe("section");
    expect(c.steps.prose).toEqual(c.steps.section);
  });
});

describe("the token table", () => {
  it("emits a fluid size whose ends are the step's two ends", () => {
    expect(fluid(64, 160)).toBe("clamp(4rem, 1.887rem + 9.01vw, 10rem)");
    expect(fluid(24, 24)).toBe("1.5rem");
  });

  it("gives every live step three properties", () => {
    for (const ladder of LADDERS) {
      const rows = tokenTable(ladder);
      const live = STEPS.filter((s) => ladder.steps[s.id]).length;
      expect(rows).toHaveLength(live);
      for (const row of rows) {
        expect(row.token).toMatch(/^--text-[a-z]+$/);
        expect(row.size).toMatch(/rem/);
        expect(row.lh).toMatch(/rem/);
        expect(row.ls).toMatch(/em$/);
      }
    }
  });
});
