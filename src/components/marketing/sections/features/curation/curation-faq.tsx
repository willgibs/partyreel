import type { CSSProperties } from "react";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import type { FaqItem } from "@/components/marketing/faq-data";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

/**
 * Curation page close: the brief's three questions on the shared accordion
 * (page.tsx pairs the same items with FaqPageJsonLd), plus the GoDeeper row
 * to the owning help article.
 */
export const CURATION_FAQ: FaqItem[] = [
  {
    q: "Do guests see hidden or removed photos?",
    a: "Never. Hiding takes a photo off the guest album instantly, and removing deletes it. Hidden items stay dimmed in your own view, so only you see them.",
  },
  {
    q: "Can I approve uploads before anyone sees them?",
    a: "Yes. Turn on review in your event settings and every upload waits for your approval first. Clear the queue with Approve all, or Select the exceptions and handle them together.",
  },
  {
    q: "What if I delete something by mistake?",
    a: `Removed photos and videos wait in the Trash for ${RECENTLY_DELETED_WINDOW_DAYS} days. Restore one and it comes back exactly as it was; after ${RECENTLY_DELETED_WINDOW_DAYS} days it is permanently deleted.`,
  },
];

export function CurationFaq() {
  return (
    <SectionShell width="narrow" eyebrow="FAQ" heading="Common questions">
      <FaqAccordion items={CURATION_FAQ} />
      <Reveal className="mt-10 flex flex-col items-center gap-2 text-center">
        <MonoCaption data-mkt-reveal style={{ "--i": 0 } as CSSProperties}>
          the exact steps live in the help center
        </MonoCaption>
        <div data-mkt-reveal style={{ "--i": 1 } as CSSProperties}>
          <LearnMoreLink href="/help/moderate-and-curate-your-album">
            Curate what shows up in your album
          </LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}
