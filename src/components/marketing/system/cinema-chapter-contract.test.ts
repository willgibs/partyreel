import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * SOURCE-TEXT PINS for CinemaChapter (the footer-contract.test.ts house
 * pattern, and for the same reason). Everything guarded here fails SILENTLY and
 * INVISIBLY: no exception, no type error, and nothing wrong on the cinema pages
 * a developer is most likely to be looking at. A behavioral test cannot reach
 * any of it, so the source is the contract.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

// The header comment legitimately discusses `.dark`, `data-mkt-skin` and every
// token by name; strip comments so a pin never passes or fails on prose.
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const chapterCode = stripComments(
  read("src/components/marketing/system/cinema-chapter.tsx"),
);

describe("the cinema chapter contract", () => {
  it("redeclares the tokens --gallery* does not cover", () => {
    // ★ THE INVISIBLE BUG (the footer's, inherited). bg-gallery paints the
    // ground, but these tokens are NOT in the always-dark family, so under
    // .surface-paper they keep their LIGHT values: focus rings at 1.44:1
    // against a 3:1 requirement, muted text at 2.62:1 against 4.5:1, and any
    // border painting a near-white hairline.
    for (const token of [
      "[--background:var(--gallery)]",
      "[--border:var(--gallery-border)]",
      "[--foreground:var(--gallery-foreground)]",
      "[--muted-foreground:var(--gallery-muted)]",
      "[--ring:var(--gallery-foreground)]",
      "[--primary:var(--gallery-foreground)]",
      "[--primary-foreground:var(--gallery)]",
      // ★ --brand DIRECTLY, not via --primary: a var() inside a custom property
      // substitutes at the element that DECLARES it, so --brand resolved to ink
      // back at :root and inherits down already-resolved.
      "[--brand:var(--gallery-foreground)]",
      "[--brand-foreground:var(--gallery)]",
      // ★ The foreground halves travel WITH their surfaces. shadcn Card is
      // `bg-card text-card-foreground`; redeclaring only --card makes a Card
      // ink-on-ink, which is invisible rather than merely wrong.
      "[--card:var(--gallery)]",
      "[--card-foreground:var(--gallery-foreground)]",
      "[--muted:var(--gallery)]",
      "[--accent-foreground:var(--gallery-foreground)]",
      "[--secondary-foreground:var(--gallery-foreground)]",
      // border-input on any Input/Select/Textarea paints the same near-white
      // hairline --border is redeclared to stop.
      "[--input:var(--gallery-border)]",
    ]) {
      expect(chapterCode, `${token} missing from the chapter`).toContain(token);
    }
  });

  it("zeroes --shadow-float with the INVISIBLE value, never `none`", () => {
    // globals.css says it where .dark does the same thing: "Dark mode has NO
    // shadows; an invisible value keeps the utility valid." Tailwind composes
    // --tw-shadow into a comma-separated box-shadow beside the ring/inset
    // slots, so a `none` inside that list invalidates the WHOLE declaration and
    // takes any ring on the same element with it. Without the token at all, a
    // shadow-float child paints a light-mode drop shadow on near-black.
    expect(chapterCode).toContain("[--shadow-float:0_0_0_0_oklch(0_0_0/0)]");
    expect(chapterCode).not.toContain("[--shadow-float:none]");
  });

  it("derives --secondary/--accent from the gallery pair, never .dark's literals", () => {
    // Copying oklch(0.25 0 0) out of globals.css would fork the theme: the two
    // would drift the first time the dark ramp is retuned. A color-mix over the
    // gallery pair tracks it automatically.
    for (const token of [
      "[--accent:color-mix(in_oklab,var(--gallery-foreground)_11%,var(--gallery))]",
      "[--secondary:color-mix(in_oklab,var(--gallery-foreground)_11%,var(--gallery))]",
    ]) {
      expect(chapterCode, `${token} missing from the chapter`).toContain(token);
    }
  });

  it("never nests .dark, and never carries data-mkt-skin", () => {
    // globals.css: "never nest .dark inside .surface-paper (always-dark media
    // surfaces use --gallery* instead)". A .dark wrapper would also silently
    // neuter every `dark:` utility in the subtree (the variant is
    // `:is(.dark *):not(.surface-paper *)`).
    expect(chapterCode).not.toMatch(/\bdark\b/);
    // body:has([data-mkt-skin=...]) keys PAGE-level chrome off that attribute,
    // so a chapter carrying it would flip the entire body's ground.
    expect(chapterCode).not.toContain("data-mkt-skin");
  });

  it("re-declares data-mkt so derived tokens re-resolve", () => {
    // --mkt-pulse-ring is a color-mix over var(--foreground), and unregistered
    // custom properties substitute at the DECLARING element: without data-mkt
    // here the ring inherits the paper page's pre-baked value and disappears.
    expect(chapterCode).toContain("data-mkt");
  });

  it("never sets overflow-hidden (seam-straddling children must overhang)", () => {
    // A plate pulled across the cut with a negative margin has to be free to
    // overhang the chapter box. PaperChapter carries the same rule.
    expect(chapterCode).not.toContain("overflow-hidden");
    // ★ isolate would create a stacking context and trap the straddling child's
    // z-index inside the chapter, so the next section's background would paint
    // over the very thing meant to overhang it. The footer WANTS isolate (its
    // glow must not escape upward); a chapter must never have it.
    expect(chapterCode).not.toMatch(/\bisolate\b/);
  });

  it("carries the stacked-viewport padding rule", () => {
    // Two section paddings meeting at a cut read as a long dead stretch on
    // phones (PaperChapter's checkpoint lesson).
    expect(chapterCode).toContain("max-lg:[&>section]:py-14");
  });
});
