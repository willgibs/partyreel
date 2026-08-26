import type { CSSProperties, ReactNode } from "react";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import type { FaqItem } from "@/components/marketing/faq-data";
import { FaqPageJsonLd } from "@/components/marketing/jsonld";
import { Reveal } from "@/components/marketing/system/reveal";
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
      {/* R4 body choreography: the list used to appear statically under a header
          that rose. ONE quiet slot continuing the header's two (eyebrow +
          heading), not a per-question stagger — this is a reading surface, and
          animating each row would make a calm block twitch. */}
      <Reveal>
        <div data-mkt-reveal style={{ "--i": 2 } as CSSProperties}>
          <FaqAccordion items={items} />
        </div>
      </Reveal>
      {/* GoDeeper stays STILL on purpose (the quiet-rows rule): it is a
          help-centre pointer, not a moment. */}
      {children && (
        <div className="mt-10 flex flex-col items-center gap-3">{children}</div>
      )}
    </SectionShell>
  );
}
