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

  it("the root 404 renders the footer WITHOUT disclosure", () => {
    // not-found.tsx renders outside (marketing), so marketing.css and [data-mkt]
    // are both absent and every .mkt-acc selector fails to match. A "collapsed"
    // group would sit permanently open there. Nothing throws; it just looks
    // broken on a page nobody screenshots.
    expect(stripComments(read("src/app/not-found.tsx"))).toContain(
      "<MarketingFooter disclosure={false} />",
    );
  });

  it("closed disclosure panels are inert (clipped links leave the tab order)", () => {
    // .mkt-acc-panel-inner is `overflow: hidden`, not `clip`, so a clipped link
    // stays focusable: tabbing into it scrolls the hidden box and drops focus
    // somewhere invisible. The FAQ accordion never hit this because its panels
    // hold only a <p>.
    const disclosure = stripComments(
      read("src/components/marketing/chrome/footer-disclosure.tsx"),
    );
    expect(disclosure).toContain("inert={!open || undefined}");
    // Padding on the list, never on -inner: a padded 0fr track never closes.
    expect(disclosure).not.toMatch(/mkt-acc-panel-inner[^>]*p[xytblr]?-\d/);
  });
});
