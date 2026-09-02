import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  huesToSpillColors,
  pickSpillHues,
  srgbToOklch,
} from "./sampled-palette";

/**
 * Law 3's sampling math: real logic, testable without a canvas. Split out of
 * glow-contract.test.ts at the round-0 promotion, when the contract test
 * followed the primitive into components/shared/ and this module did not (the
 * sampler is still lab-only until the cross-origin blocker in its own header is
 * fixed, which is the round that ships Law 3 on real user media).
 */

describe("spill sampling (law 3)", () => {
  it("converts sRGB to plausible OKLCH", () => {
    const red = srgbToOklch(255, 0, 0);
    expect(red.l).toBeGreaterThan(0.55);
    expect(red.l).toBeLessThan(0.68);
    expect(red.c).toBeGreaterThan(0.2);
    expect(red.h).toBeGreaterThan(20);
    expect(red.h).toBeLessThan(45);
    const grey = srgbToOklch(128, 128, 128);
    expect(grey.c).toBeLessThan(0.005);
  });

  function pixels(rgb: [number, number, number][]): Uint8ClampedArray {
    const out = new Uint8ClampedArray(rgb.length * 4);
    rgb.forEach(([r, g, b], i) => {
      out[i * 4] = r;
      out[i * 4 + 1] = g;
      out[i * 4 + 2] = b;
      out[i * 4 + 3] = 255;
    });
    return out;
  }

  it("finds the hues actually present, spread apart", () => {
    const hues = pickSpillHues(
      pixels([
        [200, 40, 40],
        [200, 40, 40],
        [40, 90, 200],
        [40, 160, 80],
      ]),
      3,
    );
    expect(hues).toHaveLength(3);
    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        const d = Math.abs(hues[i].hue - hues[j].hue);
        expect(Math.min(d, 360 - d)).toBeGreaterThanOrEqual(40);
      }
    }
  });

  it("never lets five hues share one quadrant", () => {
    // The real failure Will caught: a foliage photograph sampled to
    // 34/68/97/130/158, five neighbours that composite to mud on paper. A
    // green-and-yellow image must still yield a SPREAD, not a cluster.
    const greens: [number, number, number][] = [
      [60, 140, 50],
      [90, 160, 40],
      [140, 170, 40],
      [40, 130, 70],
      [110, 150, 45],
    ];
    const hues = pickSpillHues(pixels(greens), 5);
    expect(hues).toHaveLength(5);
    const sorted = hues.map((h) => h.hue).sort((a, b) => a - b);
    const arc = sorted[sorted.length - 1] - sorted[0];
    expect(arc).toBeGreaterThan(180);
  });

  it("carries a lighter, calmer register for paper", () => {
    // On a dark ground light ADDS; over near-white the same wash darkens and
    // reads as stain. The paper register sits near the paper's own lightness.
    const hues = pickSpillHues(pixels([[200, 40, 40]]));
    const dark = huesToSpillColors(hues, "dark");
    const paper = huesToSpillColors(hues, "paper");
    expect(dark[0]).toMatch(/^oklch\(0\.72 0\.15 /);
    expect(paper[0]).toMatch(/^oklch\(0\.88 0\.08 /);
  });

  it("ignores near-black, near-white and grey pixels", () => {
    // These are the pixels whose hue is numerically unstable: letting them vote
    // is how a night photograph produces a muddy, arbitrary palette.
    expect(
      pickSpillHues(
        pixels([
          [2, 2, 3],
          [253, 254, 253],
          [128, 128, 128],
        ]),
      ),
    ).toHaveLength(0);
  });

  it("always returns five inputs, even from a near-monochrome image", () => {
    // A single-hue photograph is legitimate; the engine must never receive a
    // short array, or every caller has to branch. The filler now fans AROUND
    // the wheel rather than crowding the one hue that was found.
    const hues = pickSpillHues(pixels([[200, 40, 40]]), 5);
    expect(hues).toHaveLength(5);
    expect(huesToSpillColors(hues)).toHaveLength(5);
    const sorted = hues.map((h) => h.hue).sort((a, b) => a - b);
    expect(sorted[sorted.length - 1] - sorted[0]).toBeGreaterThan(180);
  });

  it("normalises every sampled colour into the atmosphere register", () => {
    // Hue-only sampling is what makes the central experiment readable: the two
    // palettes then differ in exactly one variable. It also stops a dark photo
    // from producing a spill that is not light.
    for (const c of huesToSpillColors(pickSpillHues(pixels([[200, 40, 40]])))) {
      expect(c).toMatch(/^oklch\(0\.72 0\.15 \d+(\.\d+)?\)$/);
    }
  });
});

/**
 * ★ THE LOADER, PINNED AS SOURCE TEXT, because its failure is the silent kind
 * (the footer-contract.test.ts house pattern). A bare `new Image()` sets no
 * crossOrigin: a presigned R2 photo then taints the canvas, getImageData throws
 * SecurityError, the catch hands back the fallback five, and the only symptom
 * is that the light looks generic. Nothing throws, nothing logs, no unit test
 * of the sampling MATH can see it -- the maths above is fed pixels directly and
 * passes either way. That is precisely the gap this pin closes.
 */
describe("the URL sampler's loader is the CORS-clean one", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/shared/sampled-palette.ts"),
    "utf8",
  );
  // Comments FIRST: this file explains the taint at length, and a pin that
  // trips on its own explanation teaches the next agent to delete the
  // explanation rather than keep the fix.
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  it("decodes through the reel engine's decodeImage", () => {
    expect(code).toMatch(
      /import \{ decodeImage \} from "@\/lib\/reel\/engine\/assets"/,
    );
    expect(code).toMatch(/decodeImage\(one, ac\.signal\)/);
  });

  it("never constructs a bare Image() to sample from", () => {
    // The exact regression: `new Image()` + img.decode() reads fine, looks
    // cheaper than a fetch, and silently loses every cross-origin photo.
    expect(code).not.toMatch(/new Image\(\)/);
  });

  it("releases the decoded bitmaps it only needed for one 32px draw", () => {
    // An ImageBitmap's pixels live outside the JS heap, so dropping the
    // reference does not free them promptly. The reel engine keeps its own
    // because it redraws them every frame; this hook draws each once.
    expect(code).toMatch(/if \("close" in img\) img\.close\(\)/);
  });
});
