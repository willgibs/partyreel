import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { marketingImage } from "@/lib/constants/marketing-media";
import { filesUnder, read } from "@/testing/source-tree";

import {
  bandPx,
  DIAMETER_CSS,
  GAP_CSS,
  GLIDE_EASE,
  HEADER_PX,
  heroHeightPx,
  keyframeNames,
  LENS,
  LENS_KEYFRAMES,
  lensDiameter,
  lensGap,
  lensKeyframes,
  lensPath,
  lensVars,
  PRIVACY_STILL,
  REACHES,
  REST_PLACES,
  restCentre,
  restTransforms,
  WIDE_MIN_PX,
  type Reach,
} from "./privacy-lens";

/**
 * THE LENS'S NUMBERS AGAINST WHAT THE SHEET DRAWS (privacy-hero r4, wired).
 *
 * The promise the picture makes is that a rest never sits on the words and the
 * pane always shows what is behind it. Both are arithmetic in CSS (`calc` and
 * `clamp` over custom properties, `%` of a stage-sized box), so this file reads
 * the CSS the module writes with a small evaluator and checks the promise at a
 * grid of screens, rather than trusting the TypeScript twin of the same numbers.
 */

const ROOT = process.cwd();
const DIR = "src/components/marketing/sections/features/privacy";
const sheet = readFileSync(join(ROOT, DIR, "privacy-lens.css"), "utf8");
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/* ── A small evaluator for the CSS this module writes ───────────────────── */

type Ctx = {
  vars: Record<string, string>;
  /** The width the `%` of a translate's x resolves against, px. */
  pctX: number;
  /** The height `%` of a translate's y resolves against, px. */
  pctY: number;
  /** The viewport's width, px. */
  vw: number;
  /** Which axis a `%` is on. */
  axis: "x" | "y";
};

function resolveVars(expr: string, vars: Record<string, string>): string {
  let out = expr;
  for (let i = 0; i < 12 && out.includes("var("); i++) {
    out = out.replace(
      /var\((--[\w-]+)(?:,\s*([^)]+))?\)/g,
      (_m, name: string, fallback?: string) => {
        const value = vars[name] ?? fallback;
        if (value === undefined) throw new Error(`no value for ${name}`);
        return `(${value})`;
      },
    );
  }
  if (out.includes("var(")) throw new Error(`unresolved var in ${expr}`);
  return out;
}

function evaluate(expr: string, ctx: Ctx): number {
  const src = resolveVars(expr, ctx.vars);
  let at = 0;
  const peek = () => src[at];
  const skip = () => {
    while (src[at] === " ") at++;
  };
  function number(): number {
    skip();
    const m = /^-?\d*\.?\d+(?:e-?\d+)?/.exec(src.slice(at));
    if (!m) throw new Error(`number expected at ${at} in ${src}`);
    at += m[0].length;
    const value = Number(m[0]);
    const unit = /^(px|%|vw|rem|svh)/.exec(src.slice(at))?.[1];
    if (unit) at += unit.length;
    if (unit === "%")
      return (value / 100) * (ctx.axis === "x" ? ctx.pctX : ctx.pctY);
    if (unit === "vw") return (value / 100) * ctx.vw;
    if (unit === "rem") return value * 16;
    return value;
  }
  function args(): number[] {
    const out: number[] = [];
    skip();
    for (;;) {
      out.push(sum());
      skip();
      if (peek() === ",") {
        at++;
        continue;
      }
      break;
    }
    return out;
  }
  function factor(): number {
    skip();
    const fn = /^(calc|clamp|min|max)\(/.exec(src.slice(at));
    if (fn) {
      at += fn[0].length;
      const a = args();
      skip();
      if (peek() !== ")") throw new Error(`) expected at ${at} in ${src}`);
      at++;
      if (fn[1] === "calc") return a[0];
      if (fn[1] === "min") return Math.min(...a);
      if (fn[1] === "max") return Math.max(...a);
      return Math.min(Math.max(a[1], a[0]), a[2]);
    }
    if (peek() === "(") {
      at++;
      const v = sum();
      skip();
      if (peek() !== ")") throw new Error(`) expected at ${at} in ${src}`);
      at++;
      return v;
    }
    return number();
  }
  function product(): number {
    let v = factor();
    for (;;) {
      skip();
      if (peek() === "*") {
        at++;
        v *= factor();
      } else if (peek() === "/") {
        at++;
        v /= factor();
      } else return v;
    }
  }
  function sum(): number {
    let v = product();
    for (;;) {
      skip();
      if (peek() === "+") {
        at++;
        v += product();
      } else if (peek() === "-") {
        at++;
        v -= product();
      } else return v;
    }
  }
  const result = sum();
  skip();
  if (at !== src.length) throw new Error(`trailing text at ${at} in ${src}`);
  return result;
}

/** `translate(x, y)` to its two lengths, x on the stage's width and y on its height. */
function translate(
  transform: string,
  ctx: Omit<Ctx, "axis">,
): [number, number] {
  const inner = /^translate\(([\s\S]*)\)$/.exec(transform)![1];
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === "(") depth++;
    else if (inner[i] === ")") depth--;
    else if (inner[i] === "," && depth === 0) cut = i;
  }
  return [
    evaluate(inner.slice(0, cut), { ...ctx, axis: "x" }),
    evaluate(inner.slice(cut + 1), { ...ctx, axis: "y" }),
  ];
}

/** The hero's custom properties at a viewport width, as CSS values ready to evaluate. */
const varsFor = (): Record<string, string> =>
  Object.fromEntries(
    Object.entries(lensVars()).map(([k, v]) => [k, String(v)]),
  );

const VARS: Record<string, string> = {
  ...varsFor(),
  "--mkt-header-h": "4rem",
};

/* ── The measured lockup: how tall the words are at a width ────────────── */

/**
 * THE WORDS' OWN INK AT EVERY WIDTH, measured on the rendered page (2026-10-02,
 * `PageHero` at scale `lg` with the privacy page's copy, a headless Chrome at each
 * width): the width and height of the union of the eyebrow, the headline's lines,
 * the subhead's and the actions. The bands are the hero's padding, so none of this
 * decides where a pane rests; it is what the check below stands the words up as,
 * and it wants re-measuring when the copy changes (bible 10: copy is open).
 */
const INK: { w: number; inkW: number; inkH: number }[] = [
  { w: 320, inkW: 246, inkH: 420 },
  { w: 375, inkW: 300, inkH: 354 },
  { w: 480, inkW: 340, inkH: 362 },
  { w: 540, inkW: 464, inkH: 339 },
  { w: 640, inkW: 468, inkH: 290 },
  { w: 768, inkW: 474, inkH: 299 },
  { w: 900, inkW: 500, inkH: 308 },
  { w: 1024, inkW: 547, inkH: 317 },
  { w: 1280, inkW: 645, inkH: 335 },
  { w: 1440, inkW: 706, inkH: 346 },
  { w: 1920, inkW: 706, inkH: 346 },
  { w: 2560, inkW: 706, inkH: 346 },
];
const inkAt = (w: number) =>
  [...INK].reverse().find((row) => row.w <= w) ?? INK[0];
const reachAt = (w: number): Reach => (w >= WIDE_MIN_PX ? "wide" : "narrow");

const WIDTHS = [
  ...new Set([
    ...INK.map((r) => r.w),
    ...Array.from({ length: 24 }, (_, i) => 320 + i * 100),
  ]),
].sort((a, b) => a - b);

/* ── The pane's size and its bands ──────────────────────────────────────── */

describe("the pane's size and the bands it rests in", () => {
  it("is the board's size at the board's canvases and held outside them", () => {
    expect(lensDiameter(1440)).toBe(240);
    expect(lensDiameter(375)).toBe(124);
    expect(lensDiameter(320)).toBe(124);
    expect(lensDiameter(2560)).toBe(240);
    expect(lensGap(375)).toBe(24);
    expect(lensGap(1440)).toBe(10);
    for (let w = 320; w < 2560; w += 20)
      expect(lensDiameter(w + 20), `${w}`).toBeGreaterThanOrEqual(
        lensDiameter(w),
      );
  });

  it("makes the hero the board's own height at the board's canvases", () => {
    // 1440 by 930 and 375 by 760 (its lockups measured 346 and 359 tall there).
    expect(heroHeightPx(1440, 346)).toBe(930);
    expect(heroHeightPx(375, 354)).toBeCloseTo(762, 0);
  });

  it("leaves a gap of at least the pane's air above and below it, at every width", () => {
    for (let w = 280; w <= 2800; w += 8) {
      expect(bandPx(w) - lensDiameter(w)).toBeCloseTo(2 * lensGap(w), 9);
      expect(lensGap(w), `${w}`).toBeGreaterThanOrEqual(LENS.gapMinPx);
      expect(lensDiameter(w), `${w}`).toBeGreaterThanOrEqual(LENS.dMinPx);
    }
  });

  it("writes the same numbers as CSS (the clamp the custom properties carry)", () => {
    for (let w = 280; w <= 2800; w += 7) {
      const ctx = { vars: VARS, pctX: w, pctY: 900, vw: w, axis: "x" } as const;
      expect(evaluate(DIAMETER_CSS, ctx), `d at ${w}`).toBeCloseTo(
        lensDiameter(w),
        2,
      );
      expect(evaluate(GAP_CSS, ctx), `gap at ${w}`).toBeCloseTo(lensGap(w), 2);
      // The slopes are written to five places, so the band (a diameter and two gaps) is true to a few hundredths.
      expect(evaluate(VARS["--pvl-band"], ctx), `band at ${w}`).toBeCloseTo(
        bandPx(w),
        1,
      );
    }
  });
});

/* ── Nothing a rest settles on sits on the words ─────────────────────────── */

describe("every rest, at every screen", () => {
  /** A rest's pane, evaluated: its top-left corner on a hero of this size. */
  function pane(reach: Reach, i: number, w: number, h: number) {
    const rest = REST_PLACES[reach][i];
    const [x, y] = translate(restTransforms(rest).pane, {
      vars: VARS,
      pctX: w,
      pctY: h,
      vw: w,
    });
    const d = lensDiameter(w);
    return { x, y, d, cx: x + d / 2, cy: y + d / 2 };
  }

  it("sits whole on the hero, under the header and clear of the screen's sides", () => {
    for (const w of WIDTHS) {
      const reach = reachAt(w);
      const natural = heroHeightPx(w, inkAt(w).inkH);
      for (const h of [natural, natural + 160, natural * 1.6]) {
        REST_PLACES[reach].forEach((_, i) => {
          const p = pane(reach, i, w, h);
          const where = `${reach} rest ${i} at ${w} by ${Math.round(h)}`;
          expect(p.x, where).toBeGreaterThanOrEqual(LENS.edgePx - 0.01);
          expect(p.x + p.d, where).toBeLessThanOrEqual(w - LENS.edgePx + 0.01);
          expect(p.y, where).toBeGreaterThanOrEqual(HEADER_PX);
          expect(p.y + p.d, where).toBeLessThanOrEqual(h);
        });
      }
    }
  });

  it("is clear of the lockup by at least the gap, on a hero as tight as it gets and on any taller one", () => {
    for (const w of WIDTHS) {
      const reach = reachAt(w);
      const ink = inkAt(w);
      const natural = heroHeightPx(w, ink.inkH);
      for (const h of [natural, natural + 160, natural * 1.6]) {
        // The lockup is centred in what the bands leave, whatever the height.
        const cy = (h + HEADER_PX) / 2;
        const box = {
          x0: w / 2 - ink.inkW / 2,
          x1: w / 2 + ink.inkW / 2,
          y0: cy - ink.inkH / 2,
          y1: cy + ink.inkH / 2,
        };
        REST_PLACES[reach].forEach((_, i) => {
          const p = pane(reach, i, w, h);
          const dx = Math.max(box.x0 - p.cx, 0, p.cx - box.x1);
          const dy = Math.max(box.y0 - p.cy, 0, p.cy - box.y1);
          const clear = Math.hypot(dx, dy) - p.d / 2;
          expect(
            clear,
            `${reach} rest ${i} at ${w} by ${Math.round(h)} is ${clear.toFixed(1)}px from the words`,
          ).toBeGreaterThanOrEqual(lensGap(w) - 0.5);
        });
      }
    }
  });

  it("is the board's own rest at the board's canvases", () => {
    // 1440 by 930: the board's four, to the pixel its own table was typed to.
    const wide = REST_PLACES.wide.map((_, i) => {
      const p = pane("wide", i, 1440, 930);
      return [Math.round(p.cx), Math.round(p.cy)];
    });
    expect(wide[0][0]).toBeCloseTo(290, -1);
    expect(wide[1][0]).toBeCloseTo(1150, -1);
    expect(wide[2][0]).toBeCloseTo(810, -1);
    expect(wide[3][0]).toBeCloseTo(400, -1);
    expect(wide.map(([, y]) => y)).toEqual([194, 194, 800, 800]);
    // 375: the four corners of the screen the board's climbs ran between.
    const narrow = REST_PLACES.narrow.map((_, i) => {
      const p = pane("narrow", i, 375, 762);
      return [Math.round(p.cx), Math.round(p.cy)];
    });
    expect(narrow[0][0]).toBeCloseTo(70, -1);
    expect(narrow[1][0]).toBeCloseTo(305, -1);
  });
});

/* ── The pane and its photograph move as one ─────────────────────────────── */

describe("the pane's photograph moves exactly against the pane", () => {
  it("is the opposite translate at every stop of both reaches, on every screen", () => {
    for (const reach of REACHES) {
      for (const stop of lensPath(reach).stops) {
        const t = restTransforms(stop.rest);
        for (const w of [320, 375, 768, 1024, 1440, 2560]) {
          for (const h of [600, 900, 1400]) {
            const ctx = { vars: VARS, pctX: w, pctY: h, vw: w };
            const [px, py] = translate(t.pane, ctx);
            const [vx, vy] = translate(t.view, ctx);
            const where = `${reach} ${JSON.stringify(stop.rest)} at ${w} by ${h}`;
            expect(px + vx, where).toBeCloseTo(0, 6);
            expect(py + vy, where).toBeCloseTo(0, 6);
          }
        }
      }
    }
  });

  it("writes both on one timeline: the same offsets and the same easing in both blocks", () => {
    for (const reach of REACHES) {
      const css = lensKeyframes(reach);
      const names = keyframeNames(reach);
      const pane = new RegExp(
        `@keyframes ${names.pane}\\{(.*?)\\}@keyframes`,
      ).exec(css)![1];
      const view = new RegExp(`@keyframes ${names.view}\\{(.*)\\}$`).exec(
        css,
      )![1];
      const frames = (block: string) =>
        [
          ...block.matchAll(
            /([\d.]+)%\{transform:.*?;animation-timing-function:([^;}]+)/g,
          ),
        ].map((m) => [m[1], m[2]]);
      expect(frames(pane).length).toBe(lensPath(reach).stops.length);
      expect(frames(view)).toEqual(frames(pane));
    }
  });
});

/* ── The clock ──────────────────────────────────────────────────────────── */

describe("the pane's clock", () => {
  it("is its rests plus its glides, each glide at the reach's speed with a floor", () => {
    for (const reach of REACHES) {
      const { stops, cycleMs, glidesMs } = lensPath(reach);
      const rests = REST_PLACES[reach];
      expect(cycleMs).toBe(
        rests.length * LENS.restMs + glidesMs.reduce((s, g) => s + g, 0),
      );
      rests.forEach((a, i) => {
        const b = rests[(i + 1) % rests.length];
        const ca = restCentre(reach, a);
        const cb = restCentre(reach, b);
        const ms =
          (Math.hypot(cb.x - ca.x, cb.y - ca.y) / LENS.pxPerS[reach]) * 1000;
        expect(glidesMs[i]).toBeGreaterThanOrEqual(LENS.minGlideMs);
        expect(
          Math.abs(glidesMs[i] - Math.max(ms, LENS.minGlideMs)),
        ).toBeLessThanOrEqual(5);
      });
      // Monotonic, closed on the first rest, a hold then a leave at every rest.
      for (let i = 1; i < stops.length; i++)
        expect(stops[i].at).toBeGreaterThanOrEqual(stops[i - 1].at);
      expect(stops[0]).toMatchObject({ at: 0, rest: rests[0], leaves: false });
      expect(stops.at(-1)).toMatchObject({
        at: 1,
        rest: rests[0],
        leaves: false,
      });
      expect(stops.length).toBe(rests.length * 2 + 1);
    }
  });

  it("keeps the board's pace: about two seconds a glide, a loop of about sixteen to eighteen", () => {
    expect(lensPath("wide").cycleMs).toBeGreaterThan(15_000);
    expect(lensPath("wide").cycleMs).toBeLessThan(17_000);
    expect(lensPath("narrow").cycleMs).toBeGreaterThan(16_500);
    expect(lensPath("narrow").cycleMs).toBeLessThan(18_500);
  });

  it("eases only the glides, and holds the rests at one place", () => {
    for (const reach of REACHES) {
      const css = lensKeyframes(reach);
      const eased = css.match(
        new RegExp(GLIDE_EASE.replace(/[().]/g, "\\$&"), "g"),
      );
      // Two blocks, one easing per rest in each.
      expect(eased?.length).toBe(REST_PLACES[reach].length * 2);
    }
  });
});

/* ── The sheet and the module say the same things ────────────────────────── */

describe("the sheet", () => {
  const css = stripComments(sheet);

  it("starts the wide reach where the module says, everywhere it switches", () => {
    const queries = [...css.matchAll(/@media \(min-width: (\d+)px\)/g)].map(
      (m) => Number(m[1]),
    );
    expect(queries.length).toBeGreaterThanOrEqual(3);
    for (const px of queries) expect(px).toBe(WIDE_MIN_PX);
  });

  it("reads only custom properties the hero writes or the sheet declares", () => {
    const written = new Set(Object.keys(lensVars()));
    const declared = new Set(
      [...css.matchAll(/(--pvl-[\w-]+)\s*:/g)].map((m) => m[1]),
    );
    const read = [...css.matchAll(/var\((--pvl-[\w-]+)/g)].map((m) => m[1]);
    expect(read.length).toBeGreaterThan(10);
    for (const name of new Set(read))
      expect(
        written.has(name) || declared.has(name),
        `${name} is read and never set`,
      ).toBe(true);
  });

  it("starts every animation inside the no-preference query, so reduced motion is the rest state", () => {
    // Top-level blocks: an animating rule may only live under `prefers-reduced-motion: no-preference`.
    let depth = 0;
    let start = 0;
    const blocks: { prelude: string; body: string }[] = [];
    let preludeStart = 0;
    for (let i = 0; i < css.length; i++) {
      if (css[i] === "{") {
        if (depth === 0) {
          start = i;
          // the prelude is what sits between the last close and this open
        }
        depth++;
      } else if (css[i] === "}") {
        depth--;
        if (depth === 0) {
          blocks.push({
            prelude: css.slice(preludeStart, start).trim(),
            body: css.slice(start + 1, i),
          });
          preludeStart = i + 1;
        }
      }
    }
    expect(blocks.length).toBeGreaterThan(10);
    let animating = 0;
    for (const { prelude, body } of blocks) {
      if (prelude.startsWith("@keyframes")) continue;
      if (/\banimation(-name|-duration)?\s*:/.test(body)) {
        animating++;
        expect(prelude, "an animation outside the no-preference query").toBe(
          "@media (prefers-reduced-motion: no-preference)",
        );
      }
    }
    expect(animating).toBeGreaterThanOrEqual(2);
  });

  it("veils the photograph with a still, never a backdrop filter under the moving pane", () => {
    // A backdrop filter under a sibling that moves every frame is a full-screen blur the compositor re-runs round the
    // pane each time; a filter on the photograph is drawn once. The measured table is in the manifest's Handoff.
    expect(css).not.toMatch(/backdrop-filter/);
    expect(css).not.toMatch(/glass-behind\b(?!-)/);
    expect(css).toMatch(
      /\.pvl-photo\s*\{[^}]*filter:\s*blur\(var\(--glass-behind-blur\)\)/,
    );
    // Its own layer, so WebKit applies the blur on the GPU instead of painting it on the CPU.
    expect(css).toMatch(/\.pvl-photo\s*\{[^}]*will-change:\s*transform/);
  });

  it("takes the veil's material from the lightbox's own tokens, which exist", () => {
    const globals = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");
    for (const token of [
      "--glass-behind-blur",
      "--glass-behind-brightness",
      "--glass-behind-saturate",
      "--glass-behind-tint",
      "--glass-lip",
      "--glass-hairline",
    ]) {
      expect(css, `${token} read by the sheet`).toContain(`var(${token})`);
      expect(globals, `${token} declared`).toMatch(
        new RegExp(`${token}:\\s*[\\d.]+`),
      );
    }
  });
});

/* ── Names that cannot collide ───────────────────────────────────────────── */

describe("the keyframes' names", () => {
  function cssFiles(dir: string): string[] {
    return filesUnder(dir).filter((f) => f.endsWith(".css"));
  }

  it("are prefixed, distinct and declared nowhere else in the repo", () => {
    const generated = REACHES.flatMap((r) => Object.values(keyframeNames(r)));
    expect(new Set(generated).size).toBe(4);
    for (const name of generated) expect(name.startsWith("pvl-")).toBe(true);
    for (const name of generated)
      expect(LENS_KEYFRAMES).toContain(`@keyframes ${name}{`);
    const own = "pvl-stage-in";
    const owners = new Map<string, string[]>();
    for (const file of cssFiles("src")) {
      const text = stripComments(read(file));
      for (const m of text.matchAll(/@keyframes\s+([\w-]+)/g))
        owners.set(m[1], [...(owners.get(m[1]) ?? []), file]);
    }
    for (const name of [...generated, own]) {
      const files = owners.get(name) ?? [];
      // The generated ones live in no sheet at all; the stage's arrival lives in this one only.
      expect(files, name).toEqual(
        name === own ? [`${DIR}/privacy-lens.css`] : [],
      );
    }
  });
});

describe("the photograph", () => {
  it("is a media-manifest id, a landscape still the page can cover a screen with", () => {
    const photo = marketingImage(PRIVACY_STILL);
    expect(photo.orientation).toBe("landscape");
    expect(photo.width / photo.height).toBeGreaterThan(1.4);
  });
});
