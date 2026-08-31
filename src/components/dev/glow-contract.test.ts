import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  huesToSpillColors,
  pickSpillHues,
  srgbToOklch,
} from "./sampled-palette";

/**
 * THE SPILL ENGINE'S CONTRACT.
 *
 * Two halves. The source-text pins guard the failures that are SILENT: no
 * exception, no type error, and nothing visibly wrong on the surface you happen
 * to be developing on (the footer-contract.test.ts house pattern). The unit
 * tests cover the sampling math, which is real logic and testable without a
 * canvas.
 *
 * The engine is lab-local this round. When the wiring round promotes it into
 * globals.css these pins move with it, and the keyframe-collision check below
 * becomes considerably more load-bearing than it already is.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const glowSrc = read("src/components/dev/glow.tsx");
const glowCode = stripComments(glowSrc);
const designCss = read("src/app/(dev)/design/design.css");
// The engine block only: everything appended under the SPILL banner.
const engine = designCss.slice(designCss.indexOf("SPILL: the light engine"));
const engineCode = stripComments(engine);

describe("the spill primitive", () => {
  it("uses the per-shape pause contract, not one hook for everything", () => {
    // useAmbientPause starts paused and stays paused offscreen, so a one-shot
    // wired to it never fires (or fires unwatched). `bloom` therefore takes
    // useInViewOnce. Losing this is invisible until someone notices a
    // celebration beat that simply never plays.
    expect(glowCode).toContain("useAmbientPause");
    expect(glowCode).toContain("useInViewOnce");
    expect(glowCode).toMatch(/const oneShot = shape === "bloom"/);
    expect(glowCode).toMatch(/oneShot \? arrival\.ref : ambient\.ref/);
    expect(glowCode).toMatch(/oneShot \? false : ambient\.paused/);
  });

  it("mirrors the pause state onto data-paused for CSS to read", () => {
    expect(glowCode).toContain('data-paused={paused ? "true" : "false"}');
  });

  it("always renders the base beside the band, UNCONDITIONALLY", () => {
    // ★ THE PIN THAT WAS TOO WEAK. The first version of this checked only that
    // both strings appear in the source, which passed while the band was
    // actually behind `{(!oneShot || inView) && ...}` and therefore absent at
    // runtime for every one-shot. That is invariant 2 broken in the one place
    // a source-text pin was supposed to protect.
    //
    // A swept layer rests fully off-layer, so a band without a base shows
    // NOTHING whenever it is paused: its default state below the fold, and its
    // reduced-motion state, since the global guard forces
    // animation-iteration-count: 1.
    expect(glowCode).toContain("<div data-glw-base />");
    expect(glowCode).toContain("<div data-glw-band />");
    const baseAt = glowCode.indexOf("data-glw-base");
    const bandAt = glowCode.indexOf("data-glw-band");
    expect(bandAt).toBeGreaterThan(baseAt);
    // Neither layer may sit behind a conditional or a ternary.
    for (const layer of ["data-glw-base", "data-glw-band"]) {
      const line = glowCode
        .split("\n")
        .find((l) => l.includes(layer) && l.includes("<div"));
      expect(line, layer).toBeTruthy();
      expect(line!.trim(), `${layer} is conditionally rendered`).toMatch(
        /^<div data-glw-(base|band) \/>$/,
      );
    }
  });

  it("arms a one-shot by attribute rather than by mounting it", () => {
    // A user-triggered bloom must not depend on an IntersectionObserver having
    // fired, and the resting light must be present from first paint.
    expect(glowCode).toMatch(/const armed =/);
    expect(glowCode).toContain("data-glw-armed");
    expect(glowCode).toMatch(/runId > 0/);
  });

  it("accepts no className", () => {
    const glowFn = glowCode.slice(
      glowCode.indexOf("export function Glow("),
      glowCode.indexOf("export function GlowFilter("),
    );
    // Tailwind's filter/mask utilities live in the utilities layer, which
    // outranks everything the engine declares. One `blur-sm` from a caller
    // replaces `filter: url(#glw-warp) blur(...)` wholesale and the turbulence
    // warp vanishes with no error. This repo already paid for a
    // utilities-beats-base surprise once (the [data-reveal-chip] !importants).
    expect(glowFn).not.toMatch(/\bclassName\b/);
    // GlowFilter is exempt: it positions a zero-size <svg>, and carries none
    // of the engine's filter or mask properties.
    expect(glowCode).toMatch(/GlowFilter[\s\S]*className="absolute"/);
  });

  it("never renders the filter host itself", () => {
    // SVG ids are document-global; duplicates resolve by document order, which
    // is unstable under reconciliation and portals. Exactly one GlowFilter per
    // document, owned by the page, never by the effect.
    const glowFn = glowCode.slice(
      glowCode.indexOf("export function Glow("),
      glowCode.indexOf("export function GlowFilter("),
    );
    expect(glowFn).not.toContain("feTurbulence");
    expect(glowFn).not.toContain("<filter");
  });
});

describe("the spill engine CSS", () => {
  it("declares the blur on the element, never only in a keyframe", () => {
    // get-pro-button's recipe puts blur() and saturate() INSIDE its keyframe.
    // Under the global reduced-motion guard (iteration-count 1, no fill-mode)
    // the element reverts to its unanimated style, so a keyframe-only blur
    // leaves hard-edged colour blobs. Same class of bug as the star note, one
    // step over.
    expect(engineCode).toMatch(
      /\[data-glw-field\]\s*\{[^}]*filter:\s*url\(#glw-warp\) blur\(var\(--glw-blur\)\)/,
    );
    const keyframeBlocks =
      engineCode.match(/@keyframes[^{]*\{[\s\S]*?\n\}/g) ?? [];
    for (const block of keyframeBlocks) {
      expect(block, `blur inside ${block.slice(0, 40)}`).not.toContain("blur(");
    }
  });

  it("ships the -webkit- pair on every mask declaration", () => {
    // iOS Safari is a first-class guest device on this product and still needs
    // the prefixed properties. The shipped footer gets this right; an engine
    // that did not would fail only on the phones that matter most.
    // Strip the @supports condition first: `@supports not (mask-image: ...)`
    // reads as a declaration to a naive scan and is not one.
    const decls = engineCode.replace(/@supports[^{]*\{/g, "{");
    const std = (decls.match(/(?<!-)\bmask-image:/g) ?? []).length;
    const pre = (decls.match(/-webkit-mask-image:/g) ?? []).length;
    expect(pre).toBe(std);
    const stdPos = (decls.match(/(?<!-)\bmask-position:/g) ?? []).length;
    const prePos = (decls.match(/-webkit-mask-position:/g) ?? []).length;
    expect(prePos).toBe(stdPos);
  });

  it("isolates, so the edge beam cannot paint over the lit content", () => {
    // Without `isolation`, [data-glw] is position:absolute at z-index auto and
    // creates no stacking context, so [data-glw-edge]'s z-index: 1 competes at
    // the PARENT's level and lands the beam on top of the very content the
    // light is meant to sit behind. It reads as "too strong" and sends you
    // tuning opacity instead of fixing the stack.
    expect(engineCode).toMatch(/\[data-glw\]\s*\{[^}]*isolation:\s*isolate/);
  });

  it("lets an ancestor drive the lamp's position", () => {
    // A custom property declared ON an element always beats the same property
    // inherited from an ancestor, so plain `--glw-from-x: 50%` defaults here
    // silently shadow any wrapper trying to move the lamp: pointer tracking,
    // a measured position, or a section setting the register for everything
    // inside it. Reading through a second name is what keeps those possible,
    // and it looks exactly like an indirection worth deleting.
    expect(engineCode).toMatch(/--glw-from-x:\s*var\(--glw-origin-x,/);
    expect(engineCode).toMatch(/--glw-from-y:\s*var\(--glw-origin-y,/);
  });

  it("keeps the scalar drive at the same specificity as the shared mask block", () => {
    // The bloom guard turned the shared block into four attribute selectors.
    // A bare [data-glw-drive="scalar"] override is two, loses, and the band
    // parks at the shared mask-position while --glw-t updates and changes
    // nothing at all. Both selectors must carry the same :not() so source
    // order decides.
    const scalarOverride = engineCode.slice(
      engineCode.indexOf("mask-position: calc(150%"),
    );
    expect(scalarOverride.length).toBeGreaterThan(0);
    const before = engineCode.slice(
      0,
      engineCode.indexOf("mask-position: calc(150%"),
    );
    const selector = before.slice(before.lastIndexOf("[data-glw]"));
    expect(selector).toContain(':not([data-glw-shape="bloom"])');
    expect(selector).toContain('[data-glw-drive="scalar"]');
  });

  it("carries the forced-colors, print and no-mask fallbacks", () => {
    // A purely decorative colour layer is exactly where these belong, and the
    // repo has no other instance of any of them.
    expect(engineCode).toMatch(/@media \(forced-colors: active\)/);
    expect(engineCode).toMatch(/@media print/);
    expect(engineCode).toMatch(/@supports not \(mask-image/);
  });

  it("keeps every animation inside the no-preference block", () => {
    // House convention: FINAL states sit outside the media queries (a
    // reduced-motion jump still arrives), motion lives inside no-preference.
    const noPref = engineCode.slice(
      engineCode.indexOf("@media (prefers-reduced-motion: no-preference)"),
    );
    for (const m of engineCode.matchAll(/^\s{2}animation:/gm)) {
      expect(noPref).toContain(m[0].trim());
    }
  });

  it("namespaces every keyframe it adds under glw-", () => {
    for (const m of engineCode.matchAll(/@keyframes\s+([\w-]+)/g)) {
      expect(m[1].startsWith("glw-"), m[1]).toBe(true);
    }
  });

  it("does not collide with a keyframe name already defined elsewhere", () => {
    // Keyframes are document-global and the last definition wins. This repo
    // already has nine collisions between design.css and production (logged to
    // ROADMAP); the engine must not add a tenth.
    const names = (rel: string) =>
      [...read(rel).matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
    const mine = [...engineCode.matchAll(/@keyframes\s+([\w-]+)/g)].map(
      (m) => m[1],
    );
    const elsewhere = new Set([
      ...names("src/app/globals.css"),
      ...names("src/app/(marketing)/marketing.css"),
      // design.css minus the engine block itself. Slice the RAW file, then
      // strip: the banner lives inside a CSS comment, so it cannot be found
      // in the comment-stripped text (indexOf would return -1 and quietly
      // hand back the whole file, including the engine's own keyframes).
      ...[
        ...stripComments(
          designCss.slice(0, designCss.indexOf("SPILL: the light engine")),
        ).matchAll(/@keyframes\s+([\w-]+)/g),
      ].map((m) => m[1]),
    ]);
    for (const name of mine) expect(elsewhere.has(name), name).toBe(false);
    expect(mine.length).toBeGreaterThan(0);
  });

  it("uses a filter id nothing else in the repo claims", () => {
    expect(engineCode).toContain("url(#glw-warp)");
    expect(
      read("src/components/marketing/chrome/footer-glow.tsx"),
    ).not.toContain("glw-warp");
  });
});

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
