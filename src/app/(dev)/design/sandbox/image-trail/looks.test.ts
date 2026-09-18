import { describe, expect, it } from "vitest";

import { optionLabel, optionMeans } from "@/components/lab/board-spec";

import {
  DECAY,
  DEFAULT_LOOK,
  DENSITY,
  facts,
  type Look,
  SIZE,
  specOf,
} from "./looks";
import { IMAGE_TRAIL } from "./spec";
import { lifeMs } from "./trail-engine";

/**
 * THE BOARD'S WORDS AGAINST THE ENGINE'S NUMBERS.
 *
 * Every figure a tile states is measured here off the same functions the board
 * draws with, so a retune of the engine or of a table turns THIS red instead of
 * reaching Will as a tile that says one thing and shows another. That has
 * happened once (the tile-sign bug) and the lesson was written down rather than
 * remembered.
 *
 * It is not a look test. Nothing here pins a colour, a curve or a word: only the
 * arithmetic a reviewer is being asked to trust.
 */

/** THE WHOLE TILE, which is what a reviewer reads: the option's name and the
 *  sentence under it. A figure may sit in either and the reader cannot tell the
 *  difference, so neither can this. */
const means = (ask: string, option: string) => {
  const a = IMAGE_TRAIL.asks.find((x) => x.id === ask)!;
  const o = a.options.find(
    (x) => (typeof x === "string" ? x : x.id) === option,
  )!;
  return `${optionLabel(o)} ${optionMeans(o) ?? ""}`;
};

describe("the density tiles", () => {
  it("state the travel each option really uses", () => {
    expect(DENSITY.d60).toBe(60);
    expect(DENSITY.d100).toBe(100);
    expect(DENSITY.d140).toBe(140);
    for (const [id, px] of Object.entries(DENSITY)) {
      expect(means("density", id), `density ${id}`).toContain(`${px} px`);
    }
  });

  it("state the count the engine measures on the board's own scripted hand", () => {
    const of = (density: Look["density"]) =>
      facts({ ...DEFAULT_LOOK, density }, "desktop").lit;
    expect(means("density", "d60")).toContain(`${of("d60")} lit`);
    expect(means("density", "d100")).toContain(`${of("d100")} lit`);
    expect(means("density", "d140")).toContain(`${of("d140")} lit`);
  });

  it("state an overlap the recommended photograph really has", () => {
    // The tiles quote the overlap at the recommended 240 px card, which the
    // decision's own context says. Three quarters, three fifths, two fifths.
    const w = SIZE[DEFAULT_LOOK.size].desktop;
    expect((w - DENSITY.d60) / w).toBeCloseTo(0.75, 2);
    expect((w - DENSITY.d100) / w).toBeCloseTo(0.58, 2);
    expect((w - DENSITY.d140) / w).toBeCloseTo(0.42, 2);
  });
});

describe("the decay tiles", () => {
  it("state the life each option really has, to a tenth of a second", () => {
    const life = (decay: Look["decay"]) =>
      lifeMs(specOf({ ...DEFAULT_LOOK, decay }, "desktop")) / 1000;
    expect(life("quick")).toBeCloseTo(0.9, 1);
    expect(life("linger")).toBeCloseTo(1.4, 1);
    expect(life("long")).toBeCloseTo(2.0, 1);
    expect(means("decay", "quick")).toContain("0.9 second");
    expect(means("decay", "linger")).toContain("1.4 second");
    expect(means("decay", "long")).toContain("2 second");
  });

  it("state the count each option really draws", () => {
    const of = (decay: Look["decay"]) =>
      facts({ ...DEFAULT_LOOK, decay }, "desktop").lit;
    expect(means("decay", "quick")).toContain(`${of("quick")} lit`);
    expect(means("decay", "linger")).toContain(`${of("linger")} lit`);
    expect(means("decay", "long")).toContain(`${of("long")} lit`);
    // And the promise the three make together: longer means more on screen.
    expect(of("quick")).toBeLessThan(of("linger"));
    expect(of("linger")).toBeLessThan(of("long"));
  });

  it("keeps the most of itself under the long option, which its tile claims", () => {
    expect(DECAY.long.endScale).toBeGreaterThan(DECAY.linger.endScale);
    expect(DECAY.long.endScale).toBeCloseTo(1 / 3, 1);
    // And the shrink runs ahead of the fade, which is the whole argument for
    // two clocks rather than one.
    expect(DECAY.linger.shrinkMs).toBeLessThan(DECAY.linger.fadeMs);
  });
});

describe("the size tiles", () => {
  it("state both numbers each option really uses", () => {
    for (const [id, px] of Object.entries(SIZE)) {
      const m = means("size", id);
      expect(m, `size ${id} at 1440`).toContain(`${px.desktop} px`);
      expect(m, `size ${id} at 375`).toContain(`${px.phone} on a phone`);
      expect(
        specOf({ ...DEFAULT_LOOK, size: id as Look["size"] }, "desktop").size,
      ).toBe(px.desktop);
      expect(
        specOf({ ...DEFAULT_LOOK, size: id as Look["size"] }, "phone").size,
      ).toBe(px.phone);
    }
  });

  it("holds the gap in PHOTOGRAPH widths across the two screens", () => {
    // A phone's card is a share of its column, and the density follows it, so
    // "three quarters covered" means the same thing on both screens. Without
    // this the phone would draw a completely different trail from the one the
    // decision was answered on.
    for (const size of ["s180", "s240", "s300"] as const) {
      const look = { ...DEFAULT_LOOK, size };
      const d = specOf(look, "desktop");
      const p = specOf(look, "phone");
      expect(p.density / p.size).toBeCloseTo(d.density / d.size, 2);
    }
  });
});

describe("the board as a whole", () => {
  it("draws every option it offers, and offers nothing it cannot draw", () => {
    // `defineExploration` guarantees this by construction; this is the guard
    // that the previews map in board.tsx has not drifted from the spec.
    const keys = IMAGE_TRAIL.asks.flatMap((a) =>
      a.options.map((o) => `${a.id}.${typeof o === "string" ? o : o.id}`),
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.length).toBe(3 + 3 + 3 + 3 + 4 + 4);
  });

  it("puts the home knob on every step that is not the home question itself", () => {
    for (const a of IMAGE_TRAIL.asks) {
      if (a.id === "home") continue;
      expect(a.strip, `${a.id} has no home knob`).toContain("home");
    }
    // One control per id, or the dock draws the home knob six times.
    const ids = (IMAGE_TRAIL.controls ?? []).map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("costs a hero no more nodes than the ceiling allows", () => {
    for (const density of ["d60", "d100", "d140"] as const) {
      for (const decay of ["quick", "linger", "long"] as const) {
        const f = facts({ ...DEFAULT_LOOK, density, decay }, "desktop");
        expect(f.nodes, `${density}/${decay}`).toBeLessThanOrEqual(24);
        // And the pool is never smaller than what is lit at once, or the ring
        // would recycle a photograph out from under the reader's eye.
        expect(f.nodes, `${density}/${decay}`).toBeGreaterThan(f.lit);
      }
    }
  });
});
