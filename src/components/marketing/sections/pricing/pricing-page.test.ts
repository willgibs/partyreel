import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PRICING_FAQ_ITEMS } from "./pricing-faq-data";

/**
 * THE PRICING FAQ: every question is answered, and the accordion and the
 * FAQPage JSON-LD read the ONE list, because a FAQPage that describes
 * questions a visitor cannot see is the one thing structured data must never
 * do. The page's composition and its copy are the Library's and production's
 * to show, never a test's.
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

describe("the pricing FAQ", () => {
  it("answers every one of them", () => {
    for (const item of PRICING_FAQ_ITEMS) {
      expect(item.q.trim().length, item.q).toBeGreaterThan(0);
      expect(item.a.trim().length, item.q).toBeGreaterThan(40);
    }
    const questions = PRICING_FAQ_ITEMS.map((i) => i.q);
    expect(new Set(questions).size, "no question twice").toBe(questions.length);
  });

  it("feeds the accordion and the FAQPage JSON-LD from the one list", () => {
    const reads = RENDERED.split("PRICING_FAQ_ITEMS").length - 1;
    // The import, the JSON-LD's items and the accordion's items.
    expect(reads).toBe(3);
    expect(RENDERED).toContain("<FaqPageJsonLd items={PRICING_FAQ_ITEMS} />");
    expect(RENDERED).toContain(
      "<HomeFaqAccordion items={PRICING_FAQ_ITEMS} />",
    );
  });
});
