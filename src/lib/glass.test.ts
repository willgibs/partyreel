import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GLASS, GLASS_BEHIND, GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";

/**
 * THE GLASS MATERIAL COMPILES. A Tailwind `@utility` only compiles in the
 * sheet Tailwind is imported from, so a glass utility moved into theme.css or
 * a component sheet would generate nothing and every surface wearing it would
 * silently lose the material. How the material looks is the brand kit's to
 * show and is tuned freely.
 */
const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

describe("the glass material", () => {
  it("compiles as Tailwind utilities in the ENTRY sheet", () => {
    for (const name of [
      GLASS,
      "glass-mark",
      GLASS_BEHIND,
      GLASS_MARK_LIT,
    ] as const) {
      expect(CSS, `@utility ${name} must live in globals.css`).toMatch(
        new RegExp(`@utility\\s+${name}\\s*\\{`),
      );
    }
    expect(GLASS_MARK).toBe(`${GLASS} glass-mark`);
  });
});
