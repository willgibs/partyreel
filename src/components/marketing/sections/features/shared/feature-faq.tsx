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
 * ONE FAQ band for all six feature pages since the feature-pages round
 * (2026-09-01): curation, sharing and privacy each carried a near-copy, and
 * the page files emitted the JSON-LD a second time beside it. The items stay
 * per page (each `*-faq.ts` is data, exported for the JSON-LD pairing test);
 * the band, its one quiet arrival slot and the JSON-LD emission live here.
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
