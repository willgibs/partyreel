import { describe, expect, it } from "vitest";

import {
  BUILT as HOME_BUILT,
  FLIGHT as HOME_FLIGHT,
} from "@/components/marketing/sections/home/hero-stream";

import {
  ageOf,
  type Card,
  type Field,
  frameAt,
  HOME,
  homeTimeTo,
  homeTravel,
  mod,
  restAge,
  solve,
} from "./field";

/**
 * THE FIELD ENGINE'S ARITHMETIC (the heroes lane, 2026-09-18): the phase, the
 * frame, the reference. Round three's tests came across for the engine and
 * NOT for the look: the calm caps it pinned (40 px a second, sixteen lit) are
 * exactly what Will called "too boring", so nothing here limits a pace or a
 * count. A composition is graded against the home hero on its board, in words
 * the composition's own test holds to the tables.
 */

describe("the reference is the home hero, read off the shipped engine", () => {
  it("takes the home hero's clock and its flight", () => {
    expect(HOME.desktop.beat).toBe(
      Math.round(HOME_BUILT.lg.cycle / HOME_BUILT.lg.pool),
    );
    expect(HOME.phone.beat).toBe(
      Math.round(HOME_BUILT.base.cycle / HOME_BUILT.base.pool),
    );
    expect(HOME.desktop.flight).toBe(HOME_FLIGHT);
    expect(HOME.desktop.lit).toBe(HOME_BUILT.lg.facts.onScreen);
  });

  it("travels the home curve: slow off the code, fast by the edge", () => {
    // The shape, not the numbers: the numbers are the home hero's to change,
    // and the boards re-pace with it when they do.
    for (const mode of ["desktop", "phone"] as const) {
      expect(homeTravel(0, mode)).toBe(0);
      expect(HOME[mode].edge).toBeGreaterThan(HOME[mode].launch * 3);
      expect(homeTravel(homeTimeTo(HOME[mode].half, mode), mode)).toBeCloseTo(
        HOME[mode].half,
        0,
      );
      // Past the home hero's own flight the curve carries on, never stops.
      expect(homeTravel(HOME_FLIGHT + 1000, mode)).toBeGreaterThan(
        homeTravel(HOME_FLIGHT, mode),
      );
    }
  });
});

/** A two-card field whose answers are known by hand. */
const TOY: Field = (() => {
  const cards: Card[] = [0, 1].map((slot) => ({
    key: `toy-${slot}`,
    slot,
    photo: slot,
    w: 100,
    h: 125,
    at: slot * 500,
    roll: 0,
  }));
  return {
    mode: "desktop",
    cards,
    cycle: 1000,
    flight: 900,
    place: (_c, age) => ({ x: age / 10, y: 0, s: 0.5 + age / 1800 }),
    opacity: (_c, age) => (age < 800 ? 1 : 0),
  };
})();

describe("the clock is a closed form", () => {
  it("stands every card at its own launch offset when nothing runs", () => {
    for (const c of TOY.cards) expect(ageOf(c, 0, TOY.cycle)).toBe(restAge(c));
  });

  it("recycles a card by the cycle, never by bookkeeping", () => {
    const c = TOY.cards[1];
    expect(ageOf(c, 700, TOY.cycle)).toBe(200);
    expect(ageOf(c, 700 + 3 * TOY.cycle, TOY.cycle)).toBe(200);
    expect(mod(-1, 1000)).toBe(999);
  });
});

describe("a card is sized to its largest visible moment", () => {
  const solved = solve(TOY);

  it("never draws a photograph above the box it was rasterised at", () => {
    TOY.cards.forEach((c, i) => {
      const { fit } = solved.box[i];
      for (let age = 0; age <= TOY.flight; age += 5) {
        if (TOY.opacity(c, age) <= 0.004) continue;
        expect(TOY.place(c, age).s).toBeLessThanOrEqual(fit);
      }
    });
  });

  it("stops writing to a card once it has gone dark", () => {
    for (const b of solved.box) expect(b.exit).toBeGreaterThanOrEqual(795);
    for (const b of solved.box) expect(b.exit).toBeLessThanOrEqual(810);
  });

  it("measures its facts rather than claiming them", () => {
    // Both toy cards are lit together for most of the cycle.
    expect(solved.facts.lit).toBe(2);
    expect(solved.facts.nodes).toBe(2);
    // x moves a tenth of a px a ms: 100 px a second.
    expect(solved.facts.fastest).toBe(100);
  });

  it("paints the rest state from the same function as the loop", () => {
    const c = TOY.cards[1];
    const i = 1;
    const rest = frameAt(TOY, c, restAge(c), solved.box[i].fit, solved.box[i]);
    const first = frameAt(
      TOY,
      c,
      ageOf(c, 0, TOY.cycle),
      solved.box[i].fit,
      solved.box[i],
    );
    expect(first).toEqual(rest);
  });
});
