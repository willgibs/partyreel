import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { cn, RADIUS_TOKENS, TYPE_STEPS } from "@/lib/utils";

/**
 * THE TYPE STEPS AND RADIUS TOKENS STAY REACHABLE. Two silent failures, and
 * neither is about how a step looks (the Library shows that):
 *
 * 1. A STEP `cn()` HAS NEVER HEARD OF. tailwind-merge does not read our
 *    stylesheet, so an unknown `text-*` falls into its `text-color` group and
 *    is dropped by any real colour in the same call: `cn("font-heading
 *    text-chapter text-white")` returned `font-heading text-white` until
 *    utils.ts declared the ladder. The custom radius tokens are the same trap:
 *    unknown to tailwind-merge, a token corner and a stock one both survive
 *    `cn()` and the stylesheet's alphabet picks.
 *
 * 2. A NAME THE COLOR NAMESPACE ALREADY OWNS. Tailwind v4 resolves a `text-*`
 *    class as a COLOR before a font size, so a step named like a colour token
 *    (`--text-card` beside `--color-card`) is a size no className can reach.
 */
const theme = readFileSync(join(process.cwd(), "src/app/theme.css"), "utf8");

/**
 * Every `--text-<name>` declared in theme.css. The `--` filter drops the
 * companions: `--text-display--line-height` captures as `display--line-height`,
 * and a companion is not a step.
 */
const declared = [...theme.matchAll(/^\s*--text-([a-z0-9-]+):\s/gm)]
  .map((m) => m[1])
  .filter((name) => !name.includes("--"));

describe("the type steps and radius tokens", () => {
  it("are the same list theme.css and cn() are working from", () => {
    expect(declared.length, "no --text-* step found in theme.css").toBeGreaterThan(0);
    expect([...TYPE_STEPS].sort()).toEqual([...declared].sort());
  });

  it("teach cn() every radius token theme.css maps, so a token corner overrides a stock one", () => {
    // The custom tokens are the self-mapped lines of the theme block
    // (`--radius-tile: var(--radius-tile)`); the derived sm..2xl steps carry
    // Tailwind's own names and need no teaching.
    const custom = [
      ...theme.matchAll(/^\s*--radius-([a-z0-9-]+):\s*var\(--radius-\1\);/gm),
    ].map((m) => m[1]);
    expect([...RADIUS_TOKENS].sort()).toEqual([...custom].sort());
    for (const name of custom) {
      // The last class wins in both directions, never the stylesheet's alphabet.
      expect(cn("rounded-md", `rounded-${name}`)).toBe(`rounded-${name}`);
      expect(cn(`rounded-${name}`, "rounded-full")).toBe("rounded-full");
    }
  });

  it("give no step a name the color namespace already owns", () => {
    const colors = new Set(
      [...theme.matchAll(/^\s*--color-([a-z0-9-]+):\s/gm)].map((m) => m[1]),
    );
    const clashes = declared.filter((step) => colors.has(step));
    expect(clashes, clashes.join(", ")).toEqual([]);
  });
});
