import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The screen lamp's source contract (the footer-contract precedent): every
 * line here is a rule that fails silently in the browser. A lamp inside a
 * clipping frame is a hard-edged rectangle; a field the width of its object
 * ends the light on a vertical cut; a Tailwind filter utility on the engine
 * element replaces the turbulence wholesale.
 */
const source = readFileSync(
  join(process.cwd(), "src/components/marketing/system/screen-lamp.tsx"),
  "utf8",
);
const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("the screen lamp", () => {
  it("is a seam that hangs BELOW the object (the one underlight mechanic)", () => {
    expect(code).toContain('shape="seam"');
    expect(code).toContain("top-full");
    expect(code).not.toContain('shape="throw"');
    expect(code).not.toContain('shape="halo"');
  });

  it("renders the lamp AFTER the children, as their sibling", () => {
    // DOM order is paint order here (nothing creates a stacking context), and
    // a lamp inside the object's frame is clipped by it.
    expect(code.indexOf("{children}")).toBeLessThan(code.indexOf("<Glow"));
  });

  it("breaks out full-bleed so the field's side edges land off-screen", () => {
    expect(code).toMatch(/w-screen -translate-x-1\/2/);
  });

  it("samples from the DOM it wraps, never from URLs", () => {
    expect(code).toContain("useSampledPaletteFromDom");
    expect(code).not.toContain("useSampledPalette(");
  });

  it("passes the engine no className (the utilities layer outranks it)", () => {
    const glow = code.slice(code.indexOf("<Glow"), code.indexOf("/>", code.indexOf("<Glow")));
    expect(glow).not.toContain("className");
  });
});
