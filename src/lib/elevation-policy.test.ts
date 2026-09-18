// @policy: engineering · Two shadows, each declared by its role
// @refuses: a stock Tailwind shadow, a hand-typed box-shadow or the retired shadow-float name on a production surface, and a ground that re-declares the theme without both shadows.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * TWO SHADOWS, AND A CALL SITE SAYS WHICH (Will's ruling on the light board,
 * 2026-09-17: "A small shadow where one card sits on another, and a larger one
 * under menus, dialogs and toasts"; on seeing the four together: "I now see how
 * step, ring, lift, and float work together").
 *
 * The family is a ROLE system, not a size scale:
 *
 *   shadow-lift   one object really overlapping another of its own lightness
 *                 (stacked photographs, a print deck, a card overhanging a cut,
 *                 a white chip laid on a photograph)
 *   shadow-layer  anything the page keeps living behind (a menu, a dialog, a
 *                 sheet, a toast, a bar floating over the gallery), and a
 *                 marketing mock that quotes one of those
 *   neither       a surface lying flat, in EITHER mode: it is its step and its
 *                 ring. A shadow under it is a smudge in dark (bible 10) and a
 *                 fifth depth technique in light.
 *
 * ★ WHY A POLICY AND NOT A REVIEW NOTE. The sweep that landed this found 45 raw
 * shadows and 30 readers of one token, and not one of them was wrong when it
 * was written: `shadow-sm` on a card is what every generator and every
 * reference emits. A size scale invites exactly that (pick the size that looks
 * right), and a size chosen by eye is a role nobody declared, so dark mode gets
 * a smudge under every flat card the day the ramp lands. With only two names in
 * reach the question a call site has to answer is "does this overlap, or does
 * it float?", and "neither" is the usual, correct answer.
 *
 * ★ THE FOUR WAYS BACK IN, which are the four tests:
 *  1. a stock size (`shadow-sm` .. `shadow-2xl`, the bare `shadow`) or an
 *     arbitrary value (`shadow-[...]`, which is also how the old single token
 *     was worn on marketing: an arbitrary shadow wrapping its var). The class
 *     is not spelled out here on purpose: Tailwind scans this file, and a
 *     spelled-out class compiles a dead rule for a retired token;
 *  2. a hand-typed box-shadow in an inline style, which no class scan sees;
 *  3. the retired name. `--shadow-float` was the single shadow before the
 *     ruling, kept as a lab bridge that resolved to NOTHING in dark; it left
 *     with the rounding board on 2026-09-18 and is declared nowhere now, so a
 *     surface wearing it would draw no shadow at all. Refused so it stays gone;
 *  4. a new ground. A shadow has to be darker than what it falls on, so a block
 *     that re-declares the ink (which is what flipping a ground's lightness
 *     means) and not the ramp leaves its subtree on the wrong alphas, silently:
 *     6 percent of black over a dark slab is arithmetically nothing.
 *
 * SCOPED `engineering` FOR NOW, like the type ladder's policy: a design scope
 * has to be cited by a bible rule (rules-registry.test.ts), and bible 10 is the
 * Orchestrator's to reword at the merge. When its `enforcedBy` names this file
 * the scope becomes `global`, which is what this is.
 *
 * NOT HERE: the values (a contract guards function, never a look, and Will
 * retunes an alpha without asking a test), `drop-shadow` (a filter on a glyph
 * is legibility, not elevation), `inset-shadow-*` (material), and CSS files
 * (a ring, a focus mark and a pulse are all honest box-shadows there; the law
 * for those is in globals.css: never overwrite box-shadow where a ring lives).
 */
const ROOT = process.cwd();

/** Not production surfaces: the lab, its kit, the key-gated tuner, vendored code. */
const OUTSIDE = [
  "src/app/(dev)/",
  "src/components/dev/",
  "src/components/lab/",
  "src/components/vendor/",
];

/**
 * THE ALLOW-LIST: every exception by name, with the reason it is not elevation
 * or not this policy's to fix. Short on purpose. An entry added to make a red
 * gate green, without a reason that would survive being read aloud, is the
 * regression this file exists to stop.
 */
const ALLOWED: Record<string, string> = {
  "src/components/app/avatar-cropper.tsx":
    "not elevation: a 9999px spread is the crop circle's scrim, drawn as a shadow so the hole stays a hole",
  "src/lib/shared/use-sortable-grid.ts":
    "the dragged tile's pick-up shadow, set and cleared from JS during a drag; it should read var(--shadow-layer), and the file sat outside the lane that wrote this policy (flagged in its handoff)",
};

function filesUnder(dir: string, exts: string[]): string[] {
  return readdirSync(join(ROOT, dir), { recursive: true })
    .map(String)
    .filter((f) => exts.some((e) => f.endsWith(e)))
    .map((f) => `${dir}/${f}`);
}

/** Comments name the old classes on purpose (this file does); code may not. */
const stripComments = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/^\s*\/\/.*$/gm, "");

const sources = filesUnder("src", [".ts", ".tsx", ".mdx"]).filter(
  (f) =>
    !/\.test\.tsx?$/.test(f) &&
    !OUTSIDE.some((dir) => f.startsWith(dir)) &&
    !(f in ALLOWED),
);

function scan(pattern: RegExp): string[] {
  const hits: string[] = [];
  for (const rel of sources) {
    const lines = stripComments(readFileSync(join(ROOT, rel), "utf8")).split(
      "\n",
    );
    lines.forEach((line, i) => {
      for (const m of line.matchAll(pattern))
        hits.push(`${rel}:${i + 1} ${m[0].trim()}`);
    });
  }
  return hits;
}

describe("two shadows, each declared by its role", () => {
  it("scanned the production tree, and every allow-listed file exists", () => {
    expect(sources.length).toBeGreaterThan(400);
    for (const rel of Object.keys(ALLOWED)) {
      // A reason for a file that has left is a hole nobody is watching.
      expect(() => readFileSync(join(ROOT, rel), "utf8"), rel).not.toThrow();
    }
  });

  it("wears no stock or arbitrary Tailwind shadow on a production surface", () => {
    // Way back in 1. The lookbehind keeps `drop-shadow-*`, `inset-shadow-*` and
    // `text-shadow-*` out (different utilities), and `shadow-none`,
    // `shadow-lift` and `shadow-layer` are simply not in the list.
    const sized = scan(
      /(?<![\w-])shadow-(?:2xs|xs|sm|md|lg|xl|2xl|inner|\[[^\]\s]*\]|\([^)\s]*\))(?![\w-])/g,
    );
    // The bare `shadow` utility is a plain English word, and the canvas reel
    // renderer's strings use it as one, so it only counts inside a string
    // literal that is visibly a class list (another hyphenated token beside it).
    const bare: string[] = [];
    for (const rel of sources) {
      const lines = stripComments(readFileSync(join(ROOT, rel), "utf8")).split(
        "\n",
      );
      lines.forEach((line, i) => {
        for (const m of line.matchAll(/(["'`])((?:(?!\1).)*)\1/g)) {
          const tokens = m[2].split(/\s+/).filter(Boolean);
          const wears = tokens.some((t) => /(^|:)shadow$/.test(t));
          const classList = tokens.some((t) =>
            /^[a-z][\w:[\]=/.-]*-[\w[\]./-]+$/.test(t),
          );
          if (wears && classList) bare.push(`${rel}:${i + 1} shadow`);
        }
      });
    }
    expect(
      [...sized, ...bare],
      "a raw shadow: declare the role instead (shadow-lift for a real overlap, shadow-layer for anything floating over a living page, nothing for a flat surface)",
    ).toEqual([]);
  });

  it("types no box-shadow by hand in an inline style", () => {
    // Way back in 2. A literal that reads one of the two tokens is the family
    // (the footer's photo pile has to ride inline, beside the card-stack
    // recipe's own hairline); any other literal is a fourth geometry.
    const literal = /box-?shadow["']?\s*[:=]\s*(["'`])([^"'`]*)\1/gi;
    const hits: string[] = [];
    for (const rel of sources) {
      const lines = stripComments(readFileSync(join(ROOT, rel), "utf8")).split(
        "\n",
      );
      lines.forEach((line, i) => {
        for (const m of line.matchAll(literal)) {
          const value = m[2].trim();
          if (!value) continue; // clearing it
          if (/var\(--shadow-(lift|layer)\)/.test(value)) continue;
          hits.push(`${rel}:${i + 1} ${value}`);
        }
      });
    }
    expect(hits, "a hand-typed box-shadow").toEqual([]);
  });

  it("never wears the retired name on a production surface", () => {
    // Way back in 3. It is declared nowhere since 2026-09-18, so it would
    // resolve to no shadow at all.
    expect(
      scan(/shadow-float/g),
      "shadow-float is retired; production declares lift or layer",
    ).toEqual([]);
  });

  it("declares both shadows on every ground that re-declares the ink", () => {
    // Way back in 4. Every top-level block of globals.css that sets
    // --foreground has flipped (or re-stated) a ground's lightness.
    const globals = stripComments(
      readFileSync(join(ROOT, "src/app/globals.css"), "utf8"),
    );
    // Column 0 only: a block nested in @media print re-inks a sheet of paper
    // for the printer, which is not a ground anything floats over.
    const grounds = [...globals.matchAll(/^([^\s{}@][^{}]*)\{([^{}]*)\}/gm)]
      .map((m) => ({ selector: m[1].trim().replace(/\s+/g, " "), body: m[2] }))
      .filter((b) => /(^|[\s;])--foreground\s*:/.test(b.body));
    // :root with .surface-paper, .dark and .surface-ink today.
    expect(grounds.length).toBeGreaterThanOrEqual(3);
    for (const { selector, body } of grounds) {
      expect(body, `${selector} is missing --shadow-lift`).toMatch(
        /(^|[\s;])--shadow-lift\s*:/,
      );
      expect(body, `${selector} is missing --shadow-layer`).toMatch(
        /(^|[\s;])--shadow-layer\s*:/,
      );
    }
  });

  it("maps both into the theme, so each is a utility a className can reach", () => {
    // A token with no `@theme` entry generates no class, and the next surface
    // reaches for an arbitrary value instead, which is way back in 1.
    const theme = stripComments(
      readFileSync(join(ROOT, "src/app/theme.css"), "utf8"),
    );
    expect(theme).toMatch(/--shadow-lift:\s*var\(--shadow-lift\);/);
    expect(theme).toMatch(/--shadow-layer:\s*var\(--shadow-layer\);/);
  });
});
