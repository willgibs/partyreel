"use client";

import { ChevronDown } from "lucide-react";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import type { FaqItem } from "@/components/marketing/faq-data";
import { HomeFaqAccordion } from "@/components/marketing/sections/home/faq-accordion";
import { ALBUM_FAQ } from "@/components/marketing/sections/features/album/album-faq";
import { PRICING_FAQ_ITEMS } from "@/components/marketing/sections/pricing/pricing-faq-data";

/**
 * DECISION 2: ONE FAQ LOOK, drawn on both of the site's two FAQs.
 *
 * "card" and "shared" reuse the shipped components unchanged: they are
 * literally today's two looks, adopted everywhere. "heading" is the one
 * candidate with no production home yet: the shared accordion's exact 14/500
 * sizing, kept zero-JS on the native <details>/<summary> pair, with the
 * question moved into a real <h3> INSIDE the <summary> — legal HTML (a
 * <summary> may contain phrasing content or one heading element) and the
 * cheapest fix for "a <summary> is not a heading" that exists.
 */

export type FaqLookId = "card" | "shared" | "heading";
export type FaqSourceId = "pricing" | "album";

export const FAQ_SOURCES: Record<
  FaqSourceId,
  { eyebrow: string; heading: string; items: FaqItem[] }
> = {
  pricing: {
    eyebrow: "Questions",
    heading: "The fine print, in plain words.",
    items: PRICING_FAQ_ITEMS,
  },
  album: {
    eyebrow: "FAQ",
    heading: "Common questions",
    items: ALBUM_FAQ,
  },
};

/** The one new candidate: the shared look's own classes, verbatim, plus a
 *  heading wrapper around the question. Nothing else about faq-accordion.tsx
 *  changes, which is why this is a copy of ~15 lines rather than a fork of
 *  the whole file. */
function HeadingFaqAccordion({
  items,
  className,
}: {
  items: FaqItem[];
  className?: string;
}) {
  return (
    <div
      className={
        "mx-auto mt-10 max-w-2xl divide-y rounded-xl border bg-card/40" +
        (className ? ` ${className}` : "")
      }
    >
      {items.map((item) => (
        <details key={item.q} className="group px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 outline-none">
            <h3 className="m-0 text-sm font-medium">{item.q}</h3>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-[var(--mkt-acc-chevron,250ms)] ease-emphasis group-open:rotate-180" />
          </summary>
          <p className="pb-4 text-sm text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

function FaqPanel({ look, items }: { look: FaqLookId; items: FaqItem[] }) {
  if (look === "card") return <HomeFaqAccordion items={items} />;
  if (look === "shared") return <FaqAccordion items={items} />;
  return <HeadingFaqAccordion items={items} />;
}

export function FaqLookPanel({
  look,
  source,
}: {
  look: FaqLookId;
  source: FaqSourceId;
}) {
  const { eyebrow, heading, items } = FAQ_SOURCES[source];
  return (
    // Both real placements (pricing's own FAQ section, and the shared
    // FeatureFaq on every /features page) sit AFTER their page's last
    // PaperChapter closes, back in the cinema route group's forced-dark
    // default (`dark flex ... text-foreground`, (marketing)/(cinema)/layout.tsx)
    // — forced here too, never left to the lab's own ambient theme.
    // `data-mkt`/`data-mkt-skin` are the marketing grammar's own scope
    // (marketing.css keys `.mkt-acc`'s collapse off `[data-mkt]`, absent it
    // the card step's rows render stuck open): the pattern album-page's and
    // privacy-hero's own board copies already use. The click guard is theirs
    // too: a press inside a preview is looking, not leaving.
    <div
      className="dark bg-background text-foreground"
      data-mkt=""
      data-mkt-skin="cinema"
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest?.("a[href]")) e.preventDefault();
      }}
    >
      <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6">
        <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-center font-heading text-section text-balance">
          {heading}
        </h2>
        <FaqPanel look={look} items={items} />
      </div>
    </div>
  );
}
