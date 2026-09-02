import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * WHERE A LAMP MAY BE PLACED.
 *
 * Round 1 shipped two lamps that rendered as hard-edged grey rectangles and had
 * to be reverted. One of the two causes was mechanical and is completely
 * preventable: the glow sat inside an ancestor with `overflow: hidden`, which
 * clips the ALREADY-BLURRED output at a straight edge. Law 4 says spill "fades
 * with distance, never draws an edge"; a clipping ancestor draws one for you,
 * silently, with no error and nothing failing.
 *
 * This repo is full of clipping ancestors, and two of them are the exact
 * components a lamp most wants to sit next to:
 *   - `.mkt-tilt-card` (marketing.css) is `overflow: hidden` AND transformed,
 *     so a child glow is both clipped and dragged around by the tilt.
 *   - `Conveyor` is `overflow-hidden` because it is a marquee.
 *
 * So both are checked by name, plus any `overflow-hidden` on the wrapper the
 * lamp is declared in. The rule for authors is simply: a lamp is a SIBLING of
 * the clipping thing, never a child of it.
 */

const ROOT = process.cwd();
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.name === "node_modules"
      ? []
      : e.isDirectory()
        ? walk(join(dir, e.name))
        : [join(dir, e.name)],
  );

const CLIPPING_COMPONENTS = ["TiltCard", "Conveyor"];

describe("no lamp sits inside a clipping ancestor", () => {
  const files = walk(join(ROOT, "src"))
    .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"))
    .filter((f) => !f.includes(`${"(dev)"}`)) // the lab prototypes freely
    .map((f) => ({
      path: f.slice(ROOT.length + 1),
      src: readFileSync(f, "utf8"),
    }))
    .filter((f) => /<Glow\b/.test(f.src));

  it("scanned the production lamps", () => {
    // A scan over an empty set passes silently, which is the whole failure
    // class the round-0 sweep was about. Pin that it found some.
    expect(
      files.length,
      "no production <Glow> call sites found",
    ).toBeGreaterThan(1);
  });

  it("never nests a lamp in TiltCard or Conveyor", () => {
    const offenders: string[] = [];
    for (const { path, src } of files) {
      for (const name of CLIPPING_COMPONENTS) {
        const open = src.indexOf(`<${name}`);
        const close = src.indexOf(`</${name}>`);
        const glow = src.indexOf("<Glow");
        if (open > -1 && close > open && glow > open && glow < close) {
          offenders.push(`${path}: <Glow> is inside <${name}>`);
        }
      }
    }
    expect(
      offenders,
      `A lamp inside a clipping component has its falloff cut to a straight edge:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("never declares the lamp's own wrapper as overflow-hidden", () => {
    const offenders: string[] = [];
    for (const { path, src } of files) {
      // The wrapper is the last className before the <Glow tag.
      const glow = src.indexOf("<Glow");
      const before = src.slice(0, glow);
      const lastClass = [...before.matchAll(/className="([^"]*)"/g)].at(-1);
      if (lastClass && /\boverflow-hidden\b/.test(lastClass[1])) {
        offenders.push(
          `${path}: wrapper has overflow-hidden -> "${lastClass[1]}"`,
        );
      }
    }
    expect(
      offenders,
      `The element a lamp is declared in must not clip it:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("passes a sampled palette wherever media is present", () => {
    // A lamp on a surface with photographs must take its colour FROM them
    // (law 3). Dropping the prop is silent: it falls back to the house five
    // and simply looks generic.
    for (const { path, src } of files) {
      if (!/useSampledPaletteFromDom/.test(src)) continue;
      expect(src, `${path} samples but does not pass colors`).toMatch(
        /colors=\{[^}]*\}/,
      );
    }
  });
});

describe("the reel screen's lamp is held to the screen", () => {
  it("keeps the box the screen's width and ends its sides in a pool", () => {
    // THE WEDGE (Will's ruling on treatment A, 2026-09-01). A seam's five
    // ellipses sit at 14/38/60/80/96% of the field, so its colour is still
    // ~40-50% at the ends of ANY box; a box wider than the screen with a
    // linear side fade lit the screen's own edge at 40% and ended on a
    // straight line 64px outside it. The fix is geometric and silent to lose.
    const src = readFileSync(
      new URL(
        "../marketing/sections/home/reel-screen-lamp.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    const glow = src.indexOf("<Glow");
    expect(glow).toBeGreaterThan(-1);
    const wrapper =
      [...src.slice(0, glow).matchAll(/className="([^"]*)"/g)].at(-1)?.[1] ??
      "";
    expect(wrapper).toMatch(/\binset-x-0\b/);
    expect(wrapper).not.toMatch(/-inset-x-/);
    expect(wrapper).toMatch(
      /\[mask-image:radial-gradient\(ellipse_\d+%_\d+%_at_50%_0%,/,
    );
    expect(wrapper).not.toMatch(/\[mask-image:linear-gradient\(to_right/);
  });
});
