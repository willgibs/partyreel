import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ★ A LAB RULE'S `:has()` STYLES ONLY ITS OWN ELEMENT (lab-sitting, from ROADMAP's line on the shell's
 * restyle: "about 7,800 elements restyled per album arrival inside a board").
 *
 * A `:has()` in an earlier compound of a selector (`.a:has(b) .c`) makes `.a` an anchor whose changes Chrome
 * answers by restyling `.a`'s whole subtree once production's `group-has-*` utilities are on the page (every
 * lab page loads them). The shell's `.lab-shell-body:has([data-lab-wide]) .lab-toc` did exactly that: one
 * tile appended to a board padded to 6,722 elements restyled 6,364 of them, a line of text changed the same;
 * without that one rule, 5 (Chrome 154, the trace's UpdateLayoutTree counts, each sheet rewritten on its way
 * in so the page loaded fresh without it). A `:has()` in a rule's own subject (`.a:has(b) { ... }`)
 * re-matches `.a` alone, and an inherited custom property carries its answer to the children for nothing
 * until the answer changes, so that is the one shape the sheet uses.
 *
 * The sheet is read as text: a selector is split at its top-level commas, and its subject is what follows
 * its last top-level combinator.
 */

const SHEET = join(
  process.cwd(),
  "src",
  "app",
  "(dev)",
  "design",
  "design.css",
);

/** Every selector of every style rule, comments and declarations aside. */
function selectors(css: string): string[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, " ");
  const out: string[] = [];
  // A prelude is what stands before a "{"; an at-rule's own prelude is skipped.
  for (const m of text.matchAll(/([^{};]+)\{/g)) {
    const prelude = m[1].trim();
    if (!prelude || prelude.startsWith("@")) continue;
    out.push(...splitTop(prelude, ","));
  }
  return out.map((s) => s.trim()).filter(Boolean);
}

/** Splits at `sep` outside any parentheses or brackets. */
function splitTop(s: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let at = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (c === sep && depth === 0) {
      parts.push(s.slice(at, i));
      at = i + 1;
    }
  }
  parts.push(s.slice(at));
  return parts;
}

/** Everything before the selector's last top-level combinator: the compounds that are not its subject. */
function context(selector: string): string {
  let depth = 0;
  let at = 0;
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (depth === 0 && /[\s>+~]/.test(c)) at = i + 1;
  }
  return selector.slice(0, at);
}

describe("the lab's sheet", () => {
  const all = selectors(readFileSync(SHEET, "utf8"));

  it("reads the sheet's selectors (the premise)", () => {
    expect(all).toContain(".lab-shell-body");
    expect(context(".a:has([b]) .c")).toBe(".a:has([b]) ");
    expect(context("html[x] .a:has([b])")).toBe("html[x] ");
    expect(context(".a:has(> .b .c)")).toBe("");
  });

  it("puts a :has() only in a rule's own subject", () => {
    expect(all.filter((s) => context(s).includes(":has("))).toEqual([]);
  });
});
