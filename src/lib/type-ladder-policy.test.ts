// @policy: engineering · One type ladder, reachable from a className
// @refuses: a step theme.css and cn() disagree on, a step name the color namespace already owns, and a heading ramp coming back.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { TYPE_STEPS } from "@/lib/utils";

/**
 * THE LADDER HAS THREE WAYS TO FAIL SILENTLY, AND THIS IS ALL THREE (the type
 * wiring, Will's ruling 2026-09-17).
 *
 * 1. A NAME THE COLOR NAMESPACE ALREADY OWNS. Tailwind v4 resolves a `text-*`
 *    class as a COLOR before a font size, so `--text-card` beside the
 *    long-standing `--color-card` would have been a token no className could
 *    ever reach. That is why the card step ships as `card-title`. Nothing tells
 *    you: the class simply paints the text the card colour.
 *
 * 2. A STEP `cn()` HAS NEVER HEARD OF. tailwind-merge does not read our
 *    stylesheet, so an unknown `text-*` falls into its `text-color` group and
 *    is dropped by any real colour in the same call: `cn("font-heading
 *    text-chapter text-white")` returned `font-heading text-white` until
 *    utils.ts declared the ladder. Measured on the blog list's own h2.
 *
 * 3. A RAMP COMING BACK. The three four-breakpoint ramps are what the ladder
 *    replaced (a step is a pair, not a list of sizes), so a `sm:`/`lg:` size
 *    returning to one of the three system components is the regression.
 *
 * The ladder's numbers are NOT pinned here, and never should be: a contract
 * guards function, never a look, and Will retunes a step without asking a test.
 */
const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const theme = read("src/app/theme.css");

/**
 * Every `--text-<name>` declared in theme.css. The `--` filter drops the
 * companions: `--text-display--line-height` captures as `display--line-height`,
 * and a companion is not a step.
 */
const declared = [...theme.matchAll(/^\s*--text-([a-z0-9-]+):\s/gm)]
  .map((m) => m[1])
  .filter((name) => !name.includes("--"));

describe("the type ladder", () => {
  it("declares nine steps in theme.css, each with its own leading and tracking", () => {
    expect(declared).toHaveLength(9);
    for (const step of declared) {
      expect(theme, step).toContain(`--text-${step}--line-height:`);
      expect(theme, step).toContain(`--text-${step}--letter-spacing:`);
    }
  });

  it("is the same list theme.css and cn() are working from", () => {
    // Trap 2. utils.ts teaches tailwind-merge the ladder; a step added to one
    // file and not the other is dropped from every className that also names a
    // colour, with nothing to see in the source.
    expect([...TYPE_STEPS].sort()).toEqual([...declared].sort());
  });

  it("gives no step a name the color namespace already owns", () => {
    // Trap 1. `text-<name>` would resolve as a color and the size would be
    // unreachable. The board named the card step `card`, against `--color-card`.
    const colors = new Set(
      [...theme.matchAll(/^\s*--color-([a-z0-9-]+):\s/gm)].map((m) => m[1]),
    );
    const clashes = declared.filter((step) => colors.has(step));
    expect(clashes, clashes.join(", ")).toEqual([]);
  });

  it("keeps the three system components on one class each, with no ramp", () => {
    // Trap 3. PageHero and SectionShell hold their scales in a table and
    // PageHeading has one default; a breakpoint-prefixed size in any of the
    // three means a ramp is back and the phone end has stopped being designed.
    for (const rel of [
      "src/components/marketing/system/page-hero.tsx",
      "src/components/marketing/system/section-shell.tsx",
      "src/components/shared/page-heading.tsx",
    ]) {
      const code = read(rel).replace(/\/\*[\s\S]*?\*\//g, "");
      expect(code, rel).not.toMatch(/\b(sm|md|lg|xl|2xl):text-(xs|sm|base|\d)/);
    }
  });
});
