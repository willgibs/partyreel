import type { CSSProperties } from "react";

import { FAQ_ITEMS } from "@/components/marketing/faq-data";
import { FaqJsonLd } from "@/components/marketing/faq-jsonld";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

import { HomeFaqAccordion } from "./faq-accordion";

/**
 * QUIET (the loud/quiet map): the 8 items from the faq-data single-source on
 * the chapter-2 accordion clocks. FaqJsonLd stays mounted over the SAME items
 * so the FAQPage structured data always matches the visible accordion (the
 * rich-results requirement). Anchored as /#faq (the footer link target).
 */
export function Faq() {
  return (
    <SectionShell
      id="faq"
      eyebrow="FAQ"
      heading="Questions, answered"
      width="narrow"
    >
      {/* ONE CHOREOGRAPHY (R4): the panel used to appear flat under a revealed
          two-line header. It rises as ONE block at slot 2 on purpose: eight
          staggered rows would blow past the stagger budget, and a question
          list is a calm surface, not a cascade. */}
      <Reveal data-mkt-reveal style={{ "--i": 2 } as CSSProperties}>
        <HomeFaqAccordion items={FAQ_ITEMS} className="mt-10" />
      </Reveal>
      <FaqJsonLd />
    </SectionShell>
  );
}
