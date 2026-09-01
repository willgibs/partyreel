import type { FaqItem } from "@/components/marketing/faq-data";
import { HEADING_SCROLL_MT } from "@/components/marketing/mdx-components";
import { cn } from "@/lib/utils";

/** The FAQ section's anchor; the article page adds it to the ToC when a post carries `faq`. */
export const ARTICLE_FAQ_ID = "questions";
export const ARTICLE_FAQ_HEADING = "Questions";

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
    <section
      id={ARTICLE_FAQ_ID}
      aria-labelledby={`${ARTICLE_FAQ_ID}-heading`}
      className={cn("not-prose mt-12 border-t pt-8", HEADING_SCROLL_MT)}
    >
      <h2 id={`${ARTICLE_FAQ_ID}-heading`} className="font-heading text-xl">
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
