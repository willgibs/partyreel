import { readdirSync, readFileSync } from "node:fs";
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

/** Every .tsx under components/marketing, for the CSS-to-delegate name check. */
function marketingSources(
  dir = join(process.cwd(), "src/components/marketing"),
): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return marketingSources(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

/**
 * ★ EVERY LOOP BELOW IS PINNED FOR NON-EMPTINESS (2026-09-01, the round-0
 * sweep). A `for (const x of scan())` assertion passes SILENTLY when the scan
 * returns nothing, so a broken parse or a moved file turns the whole policy
 * into a green no-op with no signal at all. This repo has now produced four of
 * those: the border-beam mark count, the em-dash file walk, the engine's
 * animation guard, and the lamp fence I wrote myself and had to watch fail
 * before it worked. The rule is: if a loop iterates something DERIVED (a scan,
 * a walk, a matchAll), pin the count first. Loops over hardcoded literal arrays
 * need no pin, since they cannot silently empty.
 */

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
    const sels = selectorLines();
    expect(sels.length, "the selector scan found nothing").toBeGreaterThan(200);
    for (const sel of sels) {
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
    const sels = selectorLines();
    expect(sels.length, "the selector scan found nothing").toBeGreaterThan(200);
    for (const sel of sels) {
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

  it("never targets a view-transition pseudo-element with a wildcard", () => {
    // ::view-transition-* are DOCUMENT-GLOBAL, the same hazard class as @keyframes: this sheet
    // persists app-wide once any marketing route has loaded, so a wildcard rule here would
    // silently own every future view transition anywhere in the product. Names only.
    // Comments stripped first (the --background test's move): the block above this rule NAMES the
    // anti-pattern in prose, and a guard that cannot tell a rule from a warning about it is a guard
    // that punishes documentation.
    const offenders = css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .filter((line) => /::view-transition[a-z-]*\(\s*\*\s*\)/.test(line));
    expect(
      offenders,
      "scope view-transition rules to a name, never (*)",
    ).toEqual([]);
  });

  it("names every view-transition rule after a live MorphDelegate", () => {
    // The other half of the name-scoping contract. Scoping to a NAME (above)
    // stops a rule owning transitions it should not; this stops the opposite
    // failure, a rule owning nothing at all. The delegate's `name` prop and the
    // pseudo-element's argument are ONE FACT IN TWO FILES, and renaming either
    // side alone costs the morph its timing with no error anywhere: the
    // transition still runs, just on the browser's default clock. Checked in
    // both directions, so a deleted morph cannot leave dead CSS behind either.
    const named = new Set(
      [
        ...css
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .matchAll(/::view-transition-[a-z-]+\(\s*([\w-]+)\s*\)/g),
      ].map((m) => m[1]),
    );
    const configured = new Set(
      marketingSources()
        .map((file) => readFileSync(file, "utf8"))
        .filter((src) => src.includes("<MorphDelegate"))
        .flatMap((src) =>
          [...src.matchAll(/name="([\w-]+)"/g)].map((m) => m[1]),
        ),
    );
    expect(
      [...named].sort(),
      "every ::view-transition name needs a MorphDelegate passing it, and vice versa",
    ).toEqual([...configured].sort());
  });

  it("prefixes every keyframes name with mkt-", () => {
    const frames = [...css.matchAll(/@keyframes\s+([\w-]+)/g)];
    expect(
      frames.length,
      "no @keyframes found in marketing.css",
    ).toBeGreaterThan(10);
    for (const match of frames) {
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
  //   • oklch(0.99 0 0)   — the paper field (the paper body edge; forced-light
  //     ruling 2026-08-26 — body sits outside the wrapper, so the edge rule
  //     needs the literal, exactly like the cinema one above);
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
    expect(chunks.length, "the declaration scan found nothing").toBeGreaterThan(
      500,
    );
    const literal =
      /#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?|oklch|oklab|hwb|lab|lch|color)\([^)]*\)/g;
    chunks.forEach((chunk) => {
      for (const match of chunk.matchAll(literal)) {
        const lit = match[0];
        const sanctioned =
          lit === "oklch(0.11 0 0)" ||
          lit === "oklch(0.99 0 0)" ||
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
