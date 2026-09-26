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

/**
 * Every selector list in the sheet: the prelude before each `{` that is not an
 * at-rule, found by scanning braces rather than line endings (the round-0
 * rules audit, 2026-09-01, found the line scan misread a multi-line value as a
 * selector and a `*` inside calc() as the universal selector). A declaration
 * ends at `;`, a block at `}`, so neither can leak into a prelude.
 */
function selectorLines(): string[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") {
      const prelude = src.slice(start, i).trim();
      start = i + 1;
      if (!prelude || prelude.startsWith("@")) continue;
      for (const part of prelude.split(",")) {
        const sel = part.trim();
        if (sel) out.push(sel);
      }
    } else if (ch === "}" || ch === ";") {
      start = i + 1;
    }
  }
  return out;
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
});
