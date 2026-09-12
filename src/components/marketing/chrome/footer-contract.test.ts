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
    // ★ THE INVISIBLE BUG (kept, moved). bg-gallery paints the slab, but --ring,
    // --border, --foreground and --muted-foreground are NOT in that family, so
    // under .surface-paper (every (paper) route AND the root 404) they keep
    // their LIGHT values: focus rings at 1.43:1 on the slab, a near-white
    // hairline from a bare border-t. Invisible on cinema pages, where the
    // footer sits inside .dark. The footer used to spray nine tokens on its
    // element; since the library phase (2026-09-11) the set is `.surface-ink`
    // in globals.css, one class for every ink leaf. Both ends are pinned: the
    // class on the footer, the full set (plus --brand DIRECTLY, not via
    // --primary: a var() inside a custom property resolves where it is
    // declared, so overriding --primary alone leaves the mark inverted on
    // paper) in the block.
    expect(footerCode).toMatch(/className=\{cn\(\s*"surface-ink"/);
    expect(footerCode).not.toContain("[--background:var(--gallery)]");
    const globals = read("src/app/globals.css");
    const start = globals.indexOf(".surface-ink {");
    expect(start, "the .surface-ink block is missing").toBeGreaterThan(0);
    const block = globals.slice(start, globals.indexOf("}", start));
    for (const token of [
      "--background: var(--gallery)",
      "--border: var(--gallery-border)",
      "--foreground: var(--gallery-foreground)",
      "--muted-foreground: var(--gallery-muted)",
      "--ring: var(--gallery-foreground)",
      "--primary: var(--gallery-foreground)",
      "--primary-foreground: var(--gallery)",
      "--brand: var(--gallery-foreground)",
      "--brand-foreground: var(--gallery)",
      "--card-foreground: var(--gallery-foreground)",
      "--muted:",
      "--shadow-float:",
    ]) {
      expect(block, `${token} missing from .surface-ink`).toContain(token);
    }
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
    // The engine's ruled register is 8s (2026-08-31); every lamp shipped 11s.
    // Retiring the footer onto the engine without the override would have
    // re-timed ratified chrome by 27%. Since the library phase (2026-09-11)
    // the override is --spill-cadence in globals.css, one token for every
    // lamp, so the cadence sitting rules once and the tuner's knob drives it.
    const glow = stripComments(
      read("src/components/marketing/chrome/footer-glow.tsx"),
    );
    expect(glow).toMatch(/"--glw-dur":\s*"var\(--spill-cadence\)"/);
    const globals = read("src/app/globals.css");
    expect(globals).toMatch(/--spill-cadence:\s*11s;/);
  });
});
