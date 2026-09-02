import type { FaqItem } from "@/components/marketing/faq-data";
import { FaqPageJsonLd } from "@/components/marketing/jsonld";
import {
  ARTICLE_FAQ_HEADING,
  ARTICLE_FAQ_ID,
  HEADING_SCROLL_MT,
} from "@/components/marketing/reading/heading-contract";
import { cn } from "@/lib/utils";

/**
 * THE ARTICLE'S QUESTIONS: an optional Q&A after the body, from the post's frontmatter `faq`.
 *
 * Always open, never an accordion. The same items ship as FAQPage JSON-LD, and structured data
 * that claims answers are on the page while a collapsed card hides them is the mismatch Google's
 * guidelines name; more simply, an article FAQ is READ, not browsed. So not the marketing
 * FaqAccordion (a rounded card built for a band), and `not-prose` because this sits beside the
 * prose column rather than inside it and the typography plugin styles dl/dt/dd.
 *
 * Server-safe and hook-free (imports mdx-components, which reaches node:fs, so this stays on the
 * article page and never in the client index island).
 */
export function ArticleFaq({ items }: { items: FaqItem[] }) {
  return (
    <section className="not-prose mt-12 border-t pt-8">
      {/* The structured data is emitted HERE, from the same array the list prints, so no call site
          can ever slice or reorder one without the other (the FeatureFaq precedent). */}
      <FaqPageJsonLd items={items} />
      {/* The anchor sits on the HEADING, like every body h2 the scroll-spy measures, so the ToC
          row activates on the same box geometry as the rest of the piece. */}
      <h2
        id={ARTICLE_FAQ_ID}
        className={cn("font-heading text-xl", HEADING_SCROLL_MT)}
      >
        {ARTICLE_FAQ_HEADING}
      </h2>
      <dl className="mt-4 divide-y">
        {items.map((item) => (
          <div key={item.q} className="py-4 first:pt-2">
            <dt className="font-medium text-pretty">{item.q}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
