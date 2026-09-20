import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PRICING_FAQ_ITEMS } from "./pricing-faq-data";

/**
 * THE MONEY PAGE'S SHAPE, as `pricing-page` r1 ruled it (Will, 2026-09-20).
 * Not a policy (it holds one page, not a line across the tree) and not a
 * component's contract: it is the page's own structure, which is the thing
 * six of his eight answers were about.
 *
 * What is pinned is the CHAPTER ORDER and the FAQ's two ends, because both are
 * decisions a later edit can undo without anything else going red:
 *
 *  · `opening=plans`: the page opens on the paper chapter, the plans inside
 *    it, and no dark hero above them.
 *  · `sheet` (his own answer): the tiles and the table stay, the band is gone,
 *    and the matrix is OUTSIDE the paper chapter, which is what makes it dark.
 *  · `close=eight` with "reduce the count row (5-6 total?)": the accordion
 *    keeps five or six questions, and the JSON-LD reads the SAME list (a
 *    FAQPage that describes questions a visitor cannot see is the one thing
 *    structured data must never do).
 *
 * No copy is pinned (bible 21): not a heading, not a question, not an answer.
 */

const PAGE = readFileSync(
  join(process.cwd(), "src/app/(marketing)/(cinema)/pricing/page.tsx"),
  "utf8",
);

/** The page source with its comments dropped: a rule about what the page
 *  RENDERS must not be satisfied (or broken) by a sentence about it. */
const RENDERED = PAGE.replace(/\/\*[\s\S]*?\*\//g, "").replace(
  /\{\/\*[\s\S]*?\*\/\}/g,
  "",
);

const at = (needle: string) => RENDERED.indexOf(needle);

describe("the pricing page's chapters", () => {
  it("opens on the paper chapter, with the plans and the pass inside it", () => {
    const open = at("<PaperChapter>");
    const close = at("</PaperChapter>");
    expect(open, "a paper chapter").toBeGreaterThan(-1);
    expect(RENDERED.split("<PaperChapter>").length - 1, "exactly one").toBe(1);

    // Nothing renders above it but the structured data.
    const body = RENDERED.slice(at("return ("), open);
    expect(body).not.toContain("PageHero");
    expect(body).not.toContain("<SectionShell");

    for (const child of ["<PlanPair", "<PassCard"]) {
      expect(at(child), child).toBeGreaterThan(open);
      expect(at(child), child).toBeLessThan(close);
    }
  });

  it("runs the tiles, the calculator, the matrix and the questions in one dark room", () => {
    const close = at("</PaperChapter>");
    const order = ["<UnlockGrid", "<Calculator", "<ComparisonTable", 'id="faq"'];
    let last = close;
    for (const part of order) {
      const i = at(part);
      expect(i, `${part} after the paper chapter`).toBeGreaterThan(last);
      last = i;
    }
    // The band is his one deletion: "keep the tiles and the table, kill the band".
    expect(RENDERED).not.toContain("SharedBand");
  });
});

describe("the pricing FAQ", () => {
  it("keeps the accordion to five or six questions", () => {
    expect(PRICING_FAQ_ITEMS.length).toBeGreaterThanOrEqual(5);
    expect(PRICING_FAQ_ITEMS.length).toBeLessThanOrEqual(6);
  });

  it("answers every one of them", () => {
    for (const item of PRICING_FAQ_ITEMS) {
      expect(item.q.trim().length, item.q).toBeGreaterThan(0);
      expect(item.a.trim().length, item.q).toBeGreaterThan(40);
    }
    const questions = PRICING_FAQ_ITEMS.map((i) => i.q);
    expect(new Set(questions).size, "no question twice").toBe(
      questions.length,
    );
  });

  it("feeds the accordion and the FAQPage JSON-LD from the one list", () => {
    const reads = RENDERED.split("PRICING_FAQ_ITEMS").length - 1;
    // The import, the JSON-LD's items and the accordion's items.
    expect(reads).toBe(3);
    expect(RENDERED).toContain("<FaqPageJsonLd items={PRICING_FAQ_ITEMS} />");
    expect(RENDERED).toContain("<HomeFaqAccordion items={PRICING_FAQ_ITEMS} />");
  });
});
