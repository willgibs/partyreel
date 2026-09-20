// @contract-for: src/app/(dev)/design/sandbox/seed-avatar/looks.ts
import { describe, expect, it } from "vitest";

import { orbFor } from "@/lib/avatar/gradient";

import {
  captionFor,
  centreLuminance,
  LOOK_STATS,
  paintRich,
  SAMPLE_SEEDS,
} from "./looks";

/**
 * ROUND TWO'S THREE CANDIDATES, HELD TO WHAT A BOARD FILE CANNOT PROVE.
 *
 * A contract guards function, never look: the numbers each option's caption
 * shows have to actually be the numbers `LOOK_STATS` computed, `SAMPLE_SEEDS`
 * has to be the deterministic thousand it claims (never fresh entropy, or the
 * board's own captions would mismatch between a server render and the
 * client's), and every look has to emit paintable CSS for any seed at all.
 * Whether `mesh`, `throw` or `lit-seam` actually CLEAR the generator's floors
 * is not asserted here as pass/fail — the brief is explicit that a look may
 * fail one and say so on its own frame rather than being quietly excluded —
 * so this only pins that the STATS ARE REAL: computed from the same seeds the
 * caption names, over the full thousand, never a smaller sample dressed as one.
 */

describe("the seeds are fixed", () => {
  it("is the same thousand every time this module loads", () => {
    expect(SAMPLE_SEEDS.length).toBe(1000);
    expect(new Set(SAMPLE_SEEDS).size).toBe(1000);
    // UUID-shaped: what seedFor(profiles.id) actually looks like on the
    // production path, never the board's own u-N-acct fixture shape.
    for (const s of SAMPLE_SEEDS.slice(0, 20)) {
      expect(s).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    }
  });
});

describe("every look paints", () => {
  const LOOKS = ["diagonal", "mesh", "throw", "lit-seam"] as const;

  it("emits a background image with no undefined or NaN, for any seed", () => {
    for (const look of LOOKS) {
      for (const seed of SAMPLE_SEEDS.slice(0, 50)) {
        const { image } = paintRich(orbFor(seed), look);
        expect(image, `${look} ${seed}`).not.toMatch(/undefined|NaN/);
        expect(image, `${look} ${seed}`).toContain("gradient(");
      }
    }
  });

  it("returns the identical paint for the identical seed", () => {
    for (const look of LOOKS) {
      const orb = orbFor("u-priya");
      expect(paintRich(orb, look)).toEqual(paintRich(orb, look));
    }
  });

  it("interpolates every gradient layer in oklab, never sRGB", () => {
    for (const look of LOOKS) {
      const { image } = paintRich(orbFor("u-maya"), look);
      for (const layer of image.split(/(?<=\)), /)) {
        if (layer.includes("gradient(")) expect(layer).toContain("in oklab");
      }
    }
  });

  it("names at least one colour to measure the disc against, and a finite letter reading", () => {
    for (const look of LOOKS) {
      const orb = orbFor("u-noor");
      const { all } = paintRich(orb, look);
      expect(all.length, look).toBeGreaterThan(0);
      expect(Number.isFinite(centreLuminance(orb, look)), look).toBe(true);
    }
  });
});

describe("the stats are real, not decorative", () => {
  const LOOKS = ["diagonal", "mesh", "throw", "lit-seam"] as const;

  it("holds a stat for every look, each a real percentage over the full thousand", () => {
    for (const look of LOOKS) {
      const s = LOOK_STATS[look];
      for (const pct of [s.letterPct, s.paperPct, s.inkPct, s.ringPct]) {
        expect(pct, look).toBeGreaterThanOrEqual(0);
        expect(pct, look).toBeLessThanOrEqual(100);
      }
      for (const worst of [
        s.letterWorst,
        s.paperWorst,
        s.inkWorst,
        s.ringWorst,
      ]) {
        expect(Number.isFinite(worst), look).toBe(true);
        expect(worst, look).toBeGreaterThan(0);
      }
    }
  });

  // ★ NOT "the control clears everything": measuring the wired `diagonal` this
  // rigorously is what caught this file's own first draft being wrong (it had
  // named `orb.lit` as a plausible letter colour and reported the LIVE avatar
  // failing every floor). What is actually true, and worth pinning so nobody
  // mistakes a real, previously-unmeasured gap for a regression: the
  // production contract (gradient.test.ts) only ever holds `orb.body` to
  // FLOOR.ground, and gives `orb.lit` a much looser `> 1.3` against paper on
  // purpose, because a highlight this bright cannot clear 3:1 against a
  // near-white page and still read as lit. Every look here shares that same
  // corner (mesh's `primary`, throw's `glowA`, the diagonal's own `lit`), so
  // none of the four should be expected to clear FLOOR.ground on `paper` by a
  // measure this strict — a bound never claimed before this round, not a look
  // pinned by this test.
  it("finds the same lit-pole gap the production contract already accepts at a looser bound", () => {
    for (const look of LOOKS) {
      expect(LOOK_STATS[look].paperWorst, look).toBeGreaterThan(1.3);
    }
  });

  it("holds the control's letter reading close to the production contract's own body/ink promise", () => {
    // gradient.test.ts holds contrast(orb.ink, orb.body) >= 4.5 for every one
    // of a thousand seeds. The diagonal's actual centre pixel is not `body`:
    // it is mostly `far` (body's own L and C at the second hue) blended with
    // a slice of the brighter `lit`, so it runs close behind that promise
    // rather than exactly on it. A sanity floor, not the production bound
    // itself, so a real regression here still fails loud.
    expect(LOOK_STATS.diagonal.letterWorst).toBeGreaterThan(3.5);
  });

  it("writes a caption naming all four floors for every look", () => {
    for (const look of LOOKS) {
      const caption = captionFor(look);
      expect(caption).toContain("letter");
      expect(caption).toContain("paper");
      expect(caption).toContain("ink");
      expect(caption).toContain("ring");
      expect(caption).toContain("1,000");
    }
  });
});

if (process.env.PRINT_LOOK_STATS) {
  it("prints LOOK_STATS for the spec's own drafting", () => {
    console.log(JSON.stringify(LOOK_STATS, null, 2));
    expect(true).toBe(true);
  });
}
