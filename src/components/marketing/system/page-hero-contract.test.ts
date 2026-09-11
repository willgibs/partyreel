import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The hero lockup's source contract. Every line here is something that fails
 * SILENTLY: a heading that stops being an h1 costs the page its document
 * outline with no visual change at all, and the display step's trim is
 * asymmetric on purpose in a way that reads like a bug.
 *
 * Source-scanned rather than rendered, the footer-contract.test.ts precedent:
 * these are authoring rules about the file, not behaviour of the component.
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

  it("never puts a reveal-hidden state on the h1 (the LCP rule)", () => {
    // The h1 is the LCP element on a type-led hero, so an in-view gate plus a
    // transition delays the largest paint for nothing. The slots around it do
    // the arriving. Same note on qr-hero, attribution-hero, album-link-hero.
    const h1 = code.slice(code.indexOf("<h1"), code.indexOf("</h1>"));
    expect(h1).not.toContain("mark()");
    expect(h1).not.toContain("data-mkt-reveal");
  });

  it("keeps one shared gap for every scale", () => {
    // The grammar is the shared part (Will, 2026-08-28: "share grammar, page
    // picks scale"). A per-scale gap would re-open the drift this closes.
    expect(code).toContain("flex flex-col gap-6");
    expect(code.match(/gap-6/g)).toHaveLength(1);
  });

  it("trims the display step's TOP only, never its bottom", () => {
    // The box overstates the ink above the cap (leading-[0.85] + py) and
    // UNDERSTATES it below (the descender hangs past the box). Trimming both
    // ends is the intuitive move and it tightens the one end already tight.
    expect(code).toContain("-mt-[0.12em]");
    expect(code).not.toMatch(/-mb-\[/);
  });

  it("keeps the display step's descender padding", () => {
    // py-[0.08em] is what stops an overflow-hidden ancestor clipping the "y".
    // The trim removes the distance from LAYOUT; the glyph keeps its room.
    expect(code).toContain("py-[0.08em]");
  });

  it("declares the type size as a length, not a bare clamp", () => {
    // Tailwind v4 cannot infer whether a clamp() in text-* is a size or a
    // color, and guesses wrong silently.
    expect(code).toContain("text-[length:clamp(");
  });

  it("keeps every scale in the table rather than inline", () => {
    for (const step of ["display:", "xl:", "lg:"]) expect(code).toContain(step);
  });

  it("keeps the side bearing out of the heading class, gated on align", () => {
    // The vertical trim holds at any alignment; the horizontal one only means
    // something against a column edge. Folded into `heading` it drags a CENTRED
    // masthead off centre by half its value, which reads as "the hero is
    // slightly wrong" and nothing more. /press found it at 3.6px.
    const table = code.slice(code.indexOf("const HERO_SCALE"));
    const displayHeading = table.slice(
      table.indexOf("display:"),
      table.indexOf("leadIn:"),
    );
    expect(displayHeading).not.toContain("margin-inline-start");
    expect(code).toMatch(/align === "left" && HERO_SCALE\[scale\]\.leadIn/);
  });

  it("offers three named entrances, and the blur-rise never touches the h1", () => {
    // rise for the identity pages, cut for the cinema family (2026-09-01), and
    // blur for the utility trio (Will's hero ruling, 2026-09-02: few named
    // registers, no unnamed variants). The texts-reveal line rests at opacity
    // 0, which is the LCP hole above, so the h1 is the one slot that is never
    // a `.mkt-line`; the blur register wraps in the class-keyed island.
    expect(code).toMatch(/type HeroEntrance = "rise" \| "cut" \| "blur"/);
    expect(code).toContain('"data-mkt-cut"');
    expect(code).toContain('"data-mkt-reveal"');
    expect(code).toContain("TextsReveal");
    const h1 = code.slice(code.indexOf("<h1"), code.indexOf("</h1>"));
    expect(h1).not.toContain("mkt-line");
    expect(h1).not.toContain("lineClass");
    expect(h1).not.toContain("mark()");
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

  it("keeps the tracking squeeze on the display step itself", () => {
    // `.mkt-name` belongs to the STEP, not to /about (Will, 2026-08-29): a page
    // taking `display` gets the masthead entrance without knowing the recipe
    // exists. It composes with the reveal because it animates a different
    // property (letter-spacing, not opacity or transform).
    expect(code).toMatch(/display:\s*\{\s*heading:\s*\n?\s*"mkt-name /);
  });
});
