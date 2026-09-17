// @contract-for: src/components/marketing/chrome/marketing-footer.tsx
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * SOURCE-TEXT PINS for the ink-slab footer (the globals-theme-contract.test.ts
 * house pattern). Everything guarded here fails SILENTLY and INVISIBLY: no
 * exception, no type error, and nothing wrong on the pages you develop on. A
 * behavioral test cannot reach any of it, so the source is the contract.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

// Comments legitimately discuss `.dark`, `disclosure`, and the tokens; strip
// them so a pin never passes (or fails) on prose.
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const footer = read("src/components/marketing/chrome/marketing-footer.tsx");
const footerCode = stripComments(footer);

describe("the ink-slab footer contract", () => {
  it("takes the slab's token set from .surface-ink, declared once in globals.css", () => {
    // ★ THE INVISIBLE BUG (kept, moved). A dark background paints the slab, but
    // --ring, --border, --foreground and --muted-foreground are not surfaces, so
    // under .surface-paper (every (paper) route AND the root 404) they keep
    // their LIGHT values: focus rings at 1.41:1 on the slab, a near-white
    // hairline from a bare border-t. Invisible on cinema pages, where the
    // footer sits inside .dark. The footer used to spray nine tokens on its
    // element; since the library phase (2026-09-11) the set is `.surface-ink`
    // in globals.css, one class for every ink leaf. Both ends are pinned: the
    // class on the footer, the full set (plus --brand, which must be declared
    // HERE: a var() inside a custom property resolves where it is declared, so
    // overriding --primary alone leaves the mark inverted on paper) in the
    // block.
    //
    // ★ THE NAMES, NOT THE VALUES. This used to pin each line as
    // `var(--gallery-*)`, which pinned a LOOK: the palette's round eight split
    // the slab (0.165) from the media well (0.065), so the block writes its own
    // values and deriving from --gallery would drag the leaf into the well. What
    // the contract is actually for is that every token the leaf needs is
    // re-declared on the class, whatever it is set to.
    expect(footerCode).toMatch(/className=\{cn\(\s*"surface-ink"/);
    expect(footerCode).not.toContain("[--background:var(--gallery)]");
    // bg-gallery on the slab would now paint the WELL, two registers deeper.
    expect(footerCode).not.toContain("bg-gallery");
    const globals = read("src/app/globals.css");
    const start = globals.indexOf(".surface-ink {");
    expect(start, "the .surface-ink block is missing").toBeGreaterThan(0);
    const block = globals.slice(start, globals.indexOf("}", start));
    for (const token of [
      "--background:",
      "--border:",
      "--foreground:",
      "--muted-foreground:",
      "--faint:",
      "--ring:",
      "--primary:",
      "--primary-foreground:",
      "--brand:",
      "--brand-foreground:",
      "--card-foreground:",
      "--muted:",
      // The two shadows (the light ruling, 2026-09-17). The leaf re-declares
      // the DARK ramp: on a paper page it would otherwise inherit paper's
      // alphas, which are nothing on a slab, and the demo's photo pile under
      // the QR plate is a real overlap that reads `--shadow-lift`. The old
      // name is pinned only while it exists: it is the lab's bridge now, and
      // unless the leaf re-states its zero the paper page's alias would reach
      // in (globals.css, THE OLD NAME).
      "--shadow-lift:",
      "--shadow-layer:",
      "--shadow-float:",
    ]) {
      expect(block, `${token} missing from .surface-ink`).toContain(token);
    }
    // ...and none of them derived from the well, which is the split the ruling
    // made: a var(--gallery*) back in this block is the regression.
    expect(
      block,
      ".surface-ink must not derive from the media well",
    ).not.toMatch(/var\(--gallery/);
  });

  it("never nests .dark (the standing --gallery* rule)", () => {
    // globals.css: "never nest .dark inside .surface-paper (always-dark media
    // surfaces use --gallery* instead)". A .dark wrapper here would also
    // silently neuter every `dark:` utility in the subtree, because the custom
    // variant is `:is(.dark *):not(.surface-paper *)`.
    expect(footerCode).not.toMatch(/\bdark\b/);
  });

  it("keeps the QR server-rendered (no client island for a constant graphic)", () => {
    const qr = read("src/components/marketing/chrome/footer-qr.tsx");
    // The value is a build-time constant, so a client island would fetch and
    // parse a chunk after hydration on ~50 statically prerendered routes just
    // to paint a below-the-fold graphic.
    expect(stripComments(qr)).not.toContain('"use client"');
  });

  it("the seam glow owns the loop-pause contract, through the primitive", () => {
    // The sweep is infinite, and the house rule is that every infinite
    // animation carries data-paused wiring. It matters more here than anywhere:
    // the footer is below the fold on every page, so the default state is
    // paused and the animation only runs while someone is actually looking.
    //
    // Retired onto the SPILL engine at round 0, so the wiring is no longer in
    // this file: Glow carries it BY CONSTRUCTION. Assert the delegation rather
    // than the old inline hook, and assert the primitive still honours it, or
    // this test passes on a footer that quietly stopped pausing.
    const glow = stripComments(
      read("src/components/marketing/chrome/footer-glow.tsx"),
    );
    expect(glow).toContain("<Glow ");
    expect(glow).not.toContain("useAmbientPause");
    const primitive = stripComments(read("src/components/shared/glow.tsx"));
    expect(primitive).toContain("useAmbientPause");
    expect(primitive).toContain('data-paused={paused ? "true" : "false"}');
  });

  it("reads the lamps' cadence from the one token, never a literal", () => {
    // The engine's ruled register was 8s from the start (2026-08-31) and every
    // lamp shipped 11s against it for two rounds; Will judged the whole home
    // page at each on the tuner's knob and ruled 8s (2026-09-17), so the two
    // finally agree. What this guards is not the number but the INDIRECTION:
    // the footer reads --spill-cadence rather than restating a literal, which
    // is what lets one ruling re-time every lamp at once and what the Aurora's
    // own clock multiplies. A literal back in this file is the regression.
    const glow = stripComments(
      read("src/components/marketing/chrome/footer-glow.tsx"),
    );
    expect(glow).toMatch(/"--glw-dur":\s*"var\(--spill-cadence\)"/);
    const globals = read("src/app/globals.css");
    expect(globals).toMatch(/--spill-cadence:\s*8s;/);
  });
});
