import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The hero lockup's mechanisms, each of which fails SILENTLY: a heading that
 * stops being an h1 costs the page its document outline with no visual change
 * at all, a gated h1 delays the largest paint, a clipping ancestor eats the
 * display step's descenders without its padding, and a stage mounted inside
 * the lockup waits on the lockup's observer. How the hero looks (its steps,
 * its spacing, its entrances) is the Library's to show and tuned freely.
 *
 * Source-scanned rather than rendered, the footer-contract.test.ts precedent.
 */
const source = readFileSync(
  join(process.cwd(), "src/components/marketing/system/page-hero.tsx"),
  "utf8",
);

const stripComments = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const code = stripComments(source);

describe("the page hero lockup", () => {
  it("renders the heading as an h1, never a lesser tag", () => {
    // /contact once shipped with no h1; SectionShell's `as` prop carries the
    // same rule for sections. A hero IS the page's h1 slot.
    expect(code).toMatch(/<h1\b/);
    expect(code).not.toMatch(/<h2\b/);
  });

  it("never puts a reveal-hidden or animated state on the h1 (the LCP rule)", () => {
    // The h1 is the LCP element on a type-led hero, so an in-view gate, a line
    // reveal or a transition on it delays the largest paint for nothing. The
    // slots around it do the arriving, under every entrance the hero offers.
    const h1 = code.slice(code.indexOf("<h1"), code.indexOf("</h1>"));
    expect(h1).not.toContain("mark()");
    expect(h1).not.toContain("data-mkt-reveal");
    expect(h1).not.toContain("mkt-line");
    expect(h1).not.toContain("lineClass");
  });

  it("keeps the display step's descender padding", () => {
    // py-[0.08em] is what stops an overflow-hidden ancestor clipping the "y".
    // The trim removes the distance from LAYOUT; the glyph keeps its room.
    expect(code).toContain("py-[0.08em]");
  });

  it("renders the stage AFTER the lockup, inside the same Container", () => {
    // A page's object arrives under the type, never beside it: the QR hero is
    // bespoke for exactly that reason. The slot sits after the Reveal so the
    // stage's own island (a lamp, a fill clock) is not gated on the lockup's
    // observer.
    const reveal = code.indexOf("</Lockup>");
    const stage = code.indexOf("{children}");
    const container = code.indexOf("</Container>");
    expect(stage).toBeGreaterThan(reveal);
    expect(stage).toBeLessThan(container);
  });
});
