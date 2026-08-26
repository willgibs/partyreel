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
      <FaqAccordion items={SHARING_FAQ} />
      <Reveal className="mt-10 flex flex-col items-center gap-2 text-center">
        <MonoCaption data-mkt-reveal style={{ "--i": 0 } as CSSProperties}>
          the exact details live in the help center
        </MonoCaption>
        <div data-mkt-reveal style={{ "--i": 1 } as CSSProperties}>
          <LearnMoreLink href="/help/download-photos-videos-and-albums">
            Download your photos and videos
          </LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}
