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
    for (const name of ["--ease-out", "--ease-in-out", "--ease-linear", "--ease-emphasis", "--ease-in"]) {
      expect(new RegExp(`${name}\\s*:`).test(css), `${name} defined`).toBe(false);
    }
  });

  it("uses no bare element selectors except the sanctioned body:has([data-mkt...])", () => {
    for (const sel of selectorLines()) {
      if (sel.startsWith("@")) continue;
      // Keyframe stop selectors (from/to/percentages) are not element selectors.
      if (/^(from|to|\d+%)$/.test(sel)) continue;
      const bare = /(^|[\s>+~,])(html|body|\*|div|main|section)(?![\w-])/.exec(sel);
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
});
