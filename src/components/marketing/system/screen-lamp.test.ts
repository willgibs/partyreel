import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The screen lamp samples its colours from the DOM it already wraps: sampling
 * from URLs would fetch every photograph a second time. How the lamp looks and
 * where it hangs are the brand kit's to show and tuned freely.
 */
const source = readFileSync(
  join(process.cwd(), "src/components/marketing/system/screen-lamp.tsx"),
  "utf8",
);
const code = source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

describe("the screen lamp", () => {
  it("samples from the DOM it wraps, never from URLs", () => {
    expect(code).toContain("useSampledPaletteFromDom");
    expect(code).not.toContain("useSampledPalette(");
  });
});
