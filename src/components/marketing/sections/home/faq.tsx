import { FAQ_ITEMS } from "@/components/marketing/faq-data";
import { FaqJsonLd } from "@/components/marketing/faq-jsonld";
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
      <HomeFaqAccordion items={FAQ_ITEMS} className="mt-10" />
      <FaqJsonLd />
    </SectionShell>
  );
}
