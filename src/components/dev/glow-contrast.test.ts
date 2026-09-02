import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  alphaAtAaFloor,
  compositeOver,
  contrastRatio,
  effectiveAlpha,
  oklchToSrgb,
  parseOklch,
  relativeLuminance,
  seamCoverage,
  worstCaseGround,
} from "./glow-contrast";

/**
 * The numbers the doctrine board reports have to be right, or the board is a
 * confident-looking way to make a wrong ruling. These pin the maths against
 * known values and against the ratios footer-contract.test.ts documents in
 * prose but never measures.
 */

// The real production tokens (globals.css).
const SLAB = "oklch(0.155 0 0)";
const SLAB_FG = "oklch(0.97 0 0)";
const SLAB_MUTED = "oklch(0.62 0 0)";
const PALETTE = [
  "oklch(0.72 0.17 25)",
  "oklch(0.8 0.15 85)",
  "oklch(0.72 0.14 155)",
  "oklch(0.7 0.14 255)",
  "oklch(0.68 0.16 305)",
];

describe("colour maths", () => {
  it("round-trips the achromatic extremes", () => {
    const white = oklchToSrgb(1, 0, 0);
    expect(white.r).toBeGreaterThan(250);
    expect(white.g).toBeGreaterThan(250);
    const black = oklchToSrgb(0, 0, 0);
    expect(black.r).toBe(0);
  });

  it("computes the canonical WCAG extreme", () => {
    const ratio = contrastRatio(
      { r: 255, g: 255, b: 255 },
      { r: 0, g: 0, b: 0 },
    );
    expect(ratio).toBeCloseTo(21, 1);
  });

  it("puts white at luminance 1 and black at 0", () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 4);
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 4);
  });

  it("composites source-over", () => {
    const half = compositeOver({ r: 255, g: 255, b: 255 }, 0.5, {
      r: 0,
      g: 0,
      b: 0,
    });
    expect(half.r).toBe(128);
    expect(
      compositeOver({ r: 255, g: 0, b: 0 }, 0, { r: 1, g: 2, b: 3 }),
    ).toEqual({ r: 1, g: 2, b: 3 });
  });

  it("rejects anything that is not an oklch triple", () => {
    expect(parseOklch("var(--nope)")).toBeNull();
    expect(parseOklch("oklch(0.5 0.1 200)")).not.toBeNull();
  });
});

describe("the ink slab's headroom", () => {
  it("reproduces the documented unlit ratios", () => {
    // footer-contract.test.ts states these in prose: 17.9:1 body, 5.37:1 muted.
    const slab = parseOklch(SLAB)!;
    expect(contrastRatio(parseOklch(SLAB_FG)!, slab)).toBeGreaterThan(17);
    expect(contrastRatio(parseOklch(SLAB_MUTED)!, slab)).toBeCloseTo(5.37, 1);
  });

  it("models the mask falloff, not just the layer opacity", () => {
    // The whole reason the naive model is wrong: a seam is transparent well
    // before the layer ends, so text a little way down meets a fraction of
    // the light at the edge. At the seam itself there is no text.
    expect(seamCoverage(0, 210)).toBeCloseTo(1, 3);
    expect(seamCoverage(210 * 0.72, 210)).toBe(0);
    expect(seamCoverage(300, 210)).toBe(0);
    expect(seamCoverage(80, 210)).toBeGreaterThan(0.4);
    expect(seamCoverage(80, 210)).toBeLessThan(0.5);
  });

  it("stacks the three multipliers that decide what text meets", () => {
    const a = effectiveAlpha({ layerOpacity: 0.62, coverage: 1 });
    expect(a).toBeCloseTo(0.62 * 0.62, 4);
    expect(effectiveAlpha({ layerOpacity: 0.62, coverage: 0 })).toBe(0);
  });

  it("is an UPPER BOUND, and says so by construction", () => {
    // Deliberately not asserting "the shipped footer passes AA": this model
    // stacks peak-stop x layer-opacity x mask-coverage and still ignores the
    // blob's own radial falloff and the 16px blur, both of which only ever
    // REDUCE what a text run meets. Every number it produces is therefore a
    // ceiling, never a measurement. The real footer is measured in the browser
    // during verification; the board prints both and labels which is which.
    const atSeam = worstCaseGround(SLAB, SLAB_FG, SLAB_MUTED, PALETTE, 0.4)!;
    const deeper = worstCaseGround(SLAB, SLAB_FG, SLAB_MUTED, PALETTE, 0.1)!;
    expect(atSeam.mutedRatio).toBeLessThan(deeper.mutedRatio);
    expect(deeper.mutedRatio).toBeLessThan(
      contrastRatio(parseOklch(SLAB_MUTED)!, parseOklch(SLAB)!),
    );
  });

  it("says where the ceiling is instead of leaving R8 to find it", () => {
    const floor = alphaAtAaFloor(SLAB, SLAB_MUTED, PALETTE);
    // The headline number for the board: on the ink slab, muted text crosses
    // 4.5:1 once the wash composites past roughly a tenth of full strength.
    // That is the budget every placement spends from.
    expect(floor).toBeGreaterThan(0.05);
    expect(floor).toBeLessThan(0.3);
    // Body text has far more room, which is why the doctrine can allow a lamp
    // near a heading and not near a caption.
    const atFloor = worstCaseGround(SLAB, SLAB_FG, SLAB_MUTED, PALETTE, floor)!;
    expect(atFloor.bodyRatio).toBeGreaterThan(7);
  });

  it("names the worst hue rather than averaging the palette", () => {
    const report = worstCaseGround(SLAB, SLAB_FG, SLAB_MUTED, PALETTE, 0.3)!;
    // Amber is the lightest of the five, so it lifts a dark ground the most.
    expect(report.worstColor).toBe("oklch(0.8 0.15 85)");
  });
});

/**
 * ★ THE LAMP SET HAS TWO HOMES BY NECESSITY, SO PIN THEM TOGETHER.
 *
 * CSS reads --lamp-1..5 from globals.css. The contrast instrument cannot: it
 * parses colour numerically, so it needs literals. Same for the vendored beam
 * palette. That is a real constraint, not sloppiness, but it means a retune of
 * the lamp set can silently leave the board reporting contrast for the OLD
 * five, on the instrument whose whole job is telling you whether light is
 * legible.
 *
 * The failure mode is worse than drift. Hand parseOklch a "var(--lamp-1)" and
 * it returns null, worstCaseGround returns null, and the board renders floor 1
 * with every ratio undefined instead of floor 0.13: wrong numbers, no error,
 * no crash. I made exactly that edit during round 0 while de-duplicating the
 * palette, and caught it only in the live pass. This test is what should have
 * caught it.
 */
describe("the board's fallback palette tracks the shipped lamp set", () => {
  const globals = readFileSync(
    join(process.cwd(), "src/app/globals.css"),
    "utf8",
  );
  const board = readFileSync(
    join(
      process.cwd(),
      "src/app/(dev)/design/components/glow-doctrine-variants.tsx",
    ),
    "utf8",
  );

  it("matches --lamp-1..5 value for value", () => {
    const shipped = [1, 2, 3, 4, 5].map((n) => {
      const m = globals.match(new RegExp(`--lamp-${n}:\\s*([^;]+);`));
      return m?.[1].trim();
    });
    expect(shipped.filter(Boolean).length, "--lamp-* not found").toBe(5);

    const block = board.slice(board.indexOf("const FALLBACK_PALETTE = ["));
    const listed = [
      ...block.slice(0, block.indexOf("]")).matchAll(/"([^"]+)"/g),
    ].map((m) => m[1]);
    expect(listed.length, "FALLBACK_PALETTE not found").toBe(5);

    expect(
      listed,
      "The board's fallback five drifted from --lamp-* in globals.css. They are " +
        "duplicated on purpose (the contrast math parses colour and cannot take " +
        "a var()), so a retune has to update both by hand.",
    ).toEqual(shipped);
  });

  it("stays parseable, so the contrast table cannot go silently blank", () => {
    const block = board.slice(board.indexOf("const FALLBACK_PALETTE = ["));
    const listed = [
      ...block.slice(0, block.indexOf("]")).matchAll(/"([^"]+)"/g),
    ].map((m) => m[1]);
    const report = worstCaseGround(
      "oklch(0.14 0 0)",
      "oklch(0.62 0 0)",
      "oklch(0.62 0 0)",
      listed,
      0.62,
    );
    expect(
      report,
      "worstCaseGround returned null: an entry is not parseable as a colour " +
        "(a var() token, most likely). The board would render floor 1 and every " +
        "ratio undefined, with no error.",
    ).not.toBeNull();
    expect(report!.mutedRatio).toBeGreaterThan(0);
  });
});
