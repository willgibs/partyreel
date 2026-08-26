import type { ReactNode } from "react";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import type { FaqItem } from "@/components/marketing/faq-data";
import { FaqPageJsonLd } from "@/components/marketing/jsonld";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * The per-page FAQ band (template kit, item 5): the shared FaqAccordion +
 * FAQPage JSON-LD over the same items, in the events/[slug] section shape.
 * `children` is the optional GoDeeper row under the accordion (kit item 6).
 * T1-SHARED across album / qr / guests (see related-features.tsx for why the
 * shared copy lives in album/).
 */
export function FeatureFaq({
  items,
  children,
}: {
  items: FaqItem[];
  children?: ReactNode;
}) {
  return (
    <SectionShell width="narrow" eyebrow="FAQ" heading="Common questions">
      <FaqPageJsonLd items={items} />
      <FaqAccordion items={items} />
      {children && (
        <div className="mt-10 flex flex-col items-center gap-3">{children}</div>
      )}
    </SectionShell>
  );
}
