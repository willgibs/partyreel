import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The marketing.css containment contract (see its header). Layout CSS persists app-wide once any
 * marketing route loads (Next never unloads it on client navigation), so this pin makes the leak
 * guards mechanical: a violating declaration fails the build instead of silently re-timing or
 * re-skinning the app the first time someone visits the marketing site mid-session.
 */

const css = readFileSync(
  join(process.cwd(), "src/app/(marketing)/marketing.css"),
  "utf8",
);

/** Selector lines only: everything before a `{`, ignoring comments and declarations. */
function selectorLines(): string[] {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.endsWith("{") || line.endsWith(","))
    .map((line) => line.replace(/[{,]$/, "").trim())
    .filter(Boolean);
}

describe("marketing.css containment policy", () => {
  it("never declares on :root", () => {
    for (const sel of selectorLines()) {
      expect(sel.includes(":root"), sel).toBe(false);
    }
  });

  it("never defines the theme ease names (they would shadow Tailwind's layer app-wide)", () => {
    for (const name of [
      "--ease-out",
      "--ease-in-out",
      "--ease-linear",
      "--ease-emphasis",
      "--ease-in",
    ]) {
      expect(new RegExp(`${name}\\s*:`).test(css), `${name} defined`).toBe(
        false,
      );
    }
  });

  it("uses no bare element selectors except the sanctioned body:has([data-mkt...])", () => {
    for (const sel of selectorLines()) {
      if (sel.startsWith("@")) continue;
      // Keyframe stop selectors (from/to/percentages) are not element selectors.
      if (/^(from|to|\d+%)$/.test(sel)) continue;
      const bare = /(^|[\s>+~,])(html|body|\*|div|main|section)(?![\w-])/.exec(
        sel,
      );
      if (bare) {
        expect(sel.startsWith("body:has([data-mkt"), sel).toBe(true);
      }
    }
  });

  it("prefixes every keyframes name with mkt-", () => {
    for (const match of css.matchAll(/@keyframes\s+([\w-]+)/g)) {
      expect(match[1].startsWith("mkt-"), match[1]).toBe(true);
    }
  });

  it("declares --background only inside the sanctioned cinema skin selector", () => {
    const lines = css.replace(/\/\*[\s\S]*?\*\//g, "").split("\n");
    lines.forEach((line, i) => {
      if (!/--background\s*:/.test(line)) return;
      // Walk back to the nearest selector line and assert it is the skin block.
      for (let j = i - 1; j >= 0; j--) {
        const prev = lines[j].trim();
        if (prev.endsWith("{")) {
          expect(prev).toBe('.dark[data-mkt-skin="cinema"] {');
          return;
        }
      }
      throw new Error("--background declared outside any block");
    });
  });

  // The gap the selector checks above miss: the NO-COLOR-LITERAL rule (recipe
  // colors re-point at house tokens). Sanctioned literals only:
  //   • oklch(0.11 0 0)   — the cinema room ink (chapter 3 skin + body edge);
  //   • white rgba(255,255,255,…) — the tilt glare's LIGHT (capped by token);
  //   • #000 inside a mask-image  — an alpha ramp, machinery not palette.
  // Everything else (a hex, an rgb/hsl/oklch value, a named palette sneak-in
  // via color()) must arrive as a var()/color-mix over house tokens.
  it("uses no color literals beyond the sanctioned set", () => {
    // Scan per DECLARATION (split on ";", whitespace collapsed) so a
    // multi-line gradient still knows which property it belongs to.
    // Note color-mix over house vars never trips this: `in oklab` has no "(",
    // and var()/percentage/transparent arguments match nothing below.
    const chunks = css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split(";")
      .map((c) => c.replace(/\s+/g, " "));
    const literal =
      /#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?|oklch|oklab|hwb|lab|lch|color)\([^)]*\)/g;
    chunks.forEach((chunk) => {
      for (const match of chunk.matchAll(literal)) {
        const lit = match[0];
        const sanctioned =
          lit === "oklch(0.11 0 0)" ||
          /^rgba?\(\s*255\s*,\s*255\s*,\s*255/.test(lit) ||
          (lit === "#000" && /mask-image/.test(chunk)) ||
          // The accent block (the 2026-08-25 achromatic ruling): color
          // literals may define ONLY the --mkt-confetti-N tokens.
          /--mkt-confetti-\d\s*:/.test(chunk);
        expect(sanctioned, `${lit} in: ${chunk.trim()}`).toBe(true);
      }
    });
  });
});
