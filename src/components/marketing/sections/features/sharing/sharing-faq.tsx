import type { CSSProperties } from "react";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import type { FaqItem } from "@/components/marketing/faq-data";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * Sharing page close: the brief's three questions on the shared accordion
 * (page.tsx pairs the same items with FaqPageJsonLd), plus the GoDeeper row
 * to the owning help article.
 */
export const SHARING_FAQ: FaqItem[] = [
  {
    q: "Can guests download everything?",
    a: "Yes, anyone with access to the album can. Download all packages the originals into one zip, filtered to everything, photos only, or videos only.",
  },
  {
    q: "Is quality lost on download?",
    a: "No. You get the exact file that was uploaded: same resolution, no re-compression, and no watermarks on photos on any plan.",
  },
  {
    q: "Can I export just my selection?",
    a: "Hosts can. Select photos in the gallery and choose Download selected, or fold hidden items into a full album export.",
  },
];

export function SharingFaq() {
  return (
    <SectionShell width="narrow" eyebrow="FAQ" heading="Common questions">
      {/* Same body choreography as FeatureFaq: one quiet slot after the
          header's two, no per-question stagger. */}
      <Reveal>
        <div data-mkt-reveal style={{ "--i": 2 } as CSSProperties}>
          <FaqAccordion items={SHARING_FAQ} />
        </div>
      </Reveal>
      {/* The help-centre pointer stays STILL (the quiet-rows rule), which is
          also how the shared GoDeeper row behaves on the other pages. */}
      <div className="mt-10 flex flex-col items-center gap-2 text-center">
        <MonoCaption>the exact details live in the help center</MonoCaption>
        <LearnMoreLink href="/help/download-photos-videos-and-albums">
          Download your photos and videos
        </LearnMoreLink>
      </div>
    </SectionShell>
  );
}
