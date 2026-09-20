// ★ PENDING, NOT ABANDONED, exactly as `sandbox/registry.test.ts` was before it:
// strip "-pending" below to publish this contract on the library page. The
// collector indexes every file a live `@contract-for` names, and an indexed file
// owes a `for` line in `rules/component-notes.ts` (gallery.test.ts fails without
// one). That file belongs to the lab-rules lane, not this one, so the two-line
// patch is asked for in this track's Handoff instead of taken. THE TESTS BELOW RUN
// EITHER WAY: the marker publishes a contract, it does not create one.
// @contract-for-pending: src/app/(dev)/design/sandbox/seed-avatar/gradient.ts

import { describe, expect, it } from "vitest";

import {
  background,
  contrast,
  FLOOR,
  GROUND,
  type Look,
  orbFor,
  type PaletteMode,
  RING,
  seedsFrom,
} from "./gradient";

/**
 * THE SEEDED AVATAR'S GENERATOR, HELD TO THREE PROMISES.
 *
 * A contract guards FUNCTION, never look (docs/design/README.md), and the function
 * of this generator is exactly three things, each of which fails silently if it is
 * not tested: the colour is the same every time, the crowd is really varied, and
 * every orb it emits is legible on both themes with a letter over it.
 *
 * ★ THE THIRD IS THE ONE THAT PAYS FOR ITSELF. hashvatar's own gradient mode draws a
 * body between L 0.55 and 0.77, which is a fine picture and an illegible ground for a
 * 10px initial on a 24px chip. Our `fitBody` bisects into the window where the letter
 * and both page grounds are satisfied at once; if a future edit widens the chroma or
 * moves a floor, this is what says so rather than a guest list going quietly unreadable.
 *
 * The sizes do not relax the floor. None of 24, 32 or 40px carries large text (WCAG
 * starts that relief at 18.66px bold or 24px, and the initials are 10, 14 and 18), so
 * 4.5:1 is the one number that applies at every size the `Avatar` contract names.
 */

/** A crowd big enough to find a hole in: a thousand accounts. */
const SEEDS = Array.from({ length: 1000 }, (_, i) => `u-${i.toString(36)}-acct`);
const MODES: PaletteMode[] = ["wheel", "curated", "warm"];
const LOOKS: Look[] = ["orb", "diagonal", "aurora", "flat"];

describe("the seed, hashed", () => {
  it("gives the same numbers for the same string, every time", () => {
    expect(seedsFrom("u-priya", 6)).toEqual(seedsFrom("u-priya", 6));
    // Lowercased and trimmed, as hashvatar does: one account, one colour, however
    // the id reaches the renderer.
    expect(seedsFrom("  U-Priya ", 6)).toEqual(seedsFrom("u-priya", 6));
  });

  it("sends neighbouring strings nowhere near each other", () => {
    const a = orbFor("u-priya");
    const b = orbFor("u-priyb");
    expect(Math.abs(a.hue - b.hue)).toBeGreaterThan(20);
  });
});

describe("the same seed gives the same colours", () => {
  it("returns an identical orb on every call", () => {
    for (const mode of MODES) {
      expect(orbFor("u-maya", mode)).toEqual(orbFor("u-maya", mode));
    }
  });

  it("returns an identical background string on every call", () => {
    for (const look of LOOKS) {
      expect(background(orbFor("g-17"), look)).toBe(
        background(orbFor("g-17"), look),
      );
    }
  });

  it("gives two different accounts two different colours", () => {
    const hues = new Set(SEEDS.map((s) => Math.round(orbFor(s).hue)));
    // Rounded to whole degrees there are only 360 to go round, so a thousand
    // accounts must collide somewhere; what would be wrong is a handful of hues.
    expect(hues.size).toBeGreaterThan(250);
  });
});

describe("a thousand seeds spread across the wheel", () => {
  it("fills every one of twelve 30 degree buckets", () => {
    const buckets = new Array(12).fill(0);
    for (const s of SEEDS) buckets[Math.floor(orbFor(s).hue / 30) % 12] += 1;
    // Uniform would be 83 per bucket; 40 is half of that, which catches a
    // generator that has lost a quadrant without failing on ordinary noise.
    for (const [i, n] of buckets.entries()) {
      expect(n, `bucket ${i * 30} to ${i * 30 + 30} holds ${n}`).toBeGreaterThan(40);
    }
  });

  it("keeps the curated set to its twelve, and the warm arc to its arc", () => {
    const curated = new Set(SEEDS.map((s) => orbFor(s, "curated").hue));
    expect(curated.size).toBe(12);
    for (const s of SEEDS) {
      const { hue } = orbFor(s, "warm");
      expect(hue >= 8 && hue <= 118, `warm hue ${hue} left the arc`).toBe(true);
    }
  });
});

describe("every colour clears its floor", () => {
  it("reads under the initial at 24, 32 and 40px", () => {
    for (const mode of MODES) {
      for (const seed of SEEDS) {
        const orb = orbFor(seed, mode);
        const ratio = contrast(orb.ink, orb.body);
        expect(
          ratio,
          `${mode} ${seed} (hue ${orb.hue.toFixed(0)}) puts the letter at ${ratio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(FLOOR.letter);
      }
    }
  });

  it("separates from the page on paper and on ink", () => {
    for (const mode of MODES) {
      for (const seed of SEEDS) {
        const orb = orbFor(seed, mode);
        for (const [name, ground] of Object.entries(GROUND)) {
          const ratio = contrast(orb.body, ground);
          expect(
            ratio,
            `${mode} ${seed} sits at ${ratio.toFixed(2)}:1 on ${name}`,
          ).toBeGreaterThanOrEqual(FLOOR.ground);
        }
      }
    }
  });

  it("never matches the ring drawn over it", () => {
    for (const seed of SEEDS) {
      const orb = orbFor(seed);
      expect(contrast(orb.body, RING)).toBeGreaterThanOrEqual(FLOOR.ring);
    }
  });

  it("keeps the lit pole and the shadow inside the disc's own range", () => {
    for (const seed of SEEDS) {
      const { lit, body, deep } = orbFor(seed);
      // The shading is a shading, not a second colour: the light is above the body
      // and the shadow below it, always, or the orb stops reading as one object.
      expect(lit.l).toBeGreaterThan(body.l);
      expect(deep.l).toBeLessThan(body.l);
      // And the lit pole never reaches the paper ground it would dissolve into.
      expect(contrast(lit, GROUND.paper)).toBeGreaterThan(1.3);
    }
  });
});

describe("the background it emits", () => {
  it("is one CSS value a server component can hand to a style attribute", () => {
    for (const look of LOOKS) {
      const value = background(orbFor("u-noor"), look);
      expect(value).not.toMatch(/undefined|NaN/);
      expect(value.startsWith("oklch(") || value.includes("gradient(")).toBe(true);
    }
  });

  it("interpolates in oklab wherever it ramps between two colours", () => {
    // sRGB interpolation walks a saturated hue through grey at its midpoint, which
    // is the one way a fitted palette can still paint an unfitted colour.
    for (const look of LOOKS.filter((l) => l !== "flat")) {
      for (const part of background(orbFor("u-maya"), look).split(/(?<=\)), /)) {
        if (part.includes("gradient(")) expect(part).toContain("in oklab");
      }
    }
  });
});
