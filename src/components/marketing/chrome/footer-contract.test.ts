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
  it("redeclares the tokens --gallery* does not cover", () => {
    // ★ THE INVISIBLE BUG. bg-gallery paints the slab, but --ring, --border,
    // --foreground and --muted-foreground are NOT in that family, so under
    // .surface-paper (every (paper) route AND the root 404) they keep their
    // LIGHT values. globals.css applies `outline-ring/50` to every element, so
    // focus rings land at oklch(0.3) on an oklch(0.155) slab: 1.43:1 against a
    // 3:1 requirement, a flat WCAG failure. A bare border-t paints a near-white
    // hairline for the same reason.
    //
    // None of this is visible on cinema pages, where the footer sits inside
    // .dark and the ring reads 12.4:1 — so it would ship. Hence a pin.
    for (const token of [
      "[--background:var(--gallery)]",
      "[--border:var(--gallery-border)]",
      "[--foreground:var(--gallery-foreground)]",
      "[--muted-foreground:var(--gallery-muted)]",
      "[--ring:var(--gallery-foreground)]",
      // --brand aliases --primary, and Logo paints the mark bg-brand: without
      // this the brand mark inverts between skins (white on cinema, an
      // invisible dark-on-dark tile on every paper page).
      "[--primary:var(--gallery-foreground)]",
      "[--primary-foreground:var(--gallery)]",
      // ★ --brand DIRECTLY, not via --primary: a var() inside a custom property
      // is substituted at the element that declares it, so --brand resolved to
      // ink back at :root and inherits already-resolved. Overriding --primary
      // alone leaves the mark inverted on paper.
      "[--brand:var(--gallery-foreground)]",
      "[--brand-foreground:var(--gallery)]",
    ]) {
      expect(footerCode, `${token} missing from the slab`).toContain(token);
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

  it("passes the shipped 11s cadence rather than taking the 8s register", () => {
    // The engine's ruled register is 8s; this surface ships 11s. Retiring the
    // footer onto the engine without the override would silently re-time
    // ratified live chrome by 27%, inside a change whose whole point is that
    // nothing moves. Delete this pin only together with a cadence ruling.
    const glow = stripComments(
      read("src/components/marketing/chrome/footer-glow.tsx"),
    );
    expect(glow).toMatch(/"--glw-dur":\s*"11s"/);
  });
});
