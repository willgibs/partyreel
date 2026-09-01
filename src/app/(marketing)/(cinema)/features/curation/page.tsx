import type { Metadata } from "next";
import Link from "next/link";

import { BreadcrumbJsonLd, FaqPageJsonLd } from "@/components/marketing/jsonld";
import { BulkTools } from "@/components/marketing/sections/features/curation/bulk-tools";
import {
  CURATION_FAQ,
  CurationFaq,
} from "@/components/marketing/sections/features/curation/curation-faq";
import { RelatedFeatures } from "@/components/marketing/sections/features/shared/related-features";
import { Reversibility } from "@/components/marketing/sections/features/curation/reversibility";
import { ReviewModes } from "@/components/marketing/sections/features/curation/review-modes";
import { ReviewQueueDemo } from "@/components/marketing/sections/features/curation/review-queue-demo";
import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

const page = featurePage("curation");

export const metadata: Metadata = {
  title: page.navLabel,
  description: page.heroSub,
  alternates: { canonical: "/features/curation" },
};

/**
 * /features/curation (expansion track T2): the host's desk. Deliberately the
 * most PAPER page on the site: a short dark hero (restraint IS this page's
 * identity, no big media), then the long paper body (the review-queue signature
 * demo + the mode choice + reversibility + bulk tools as one chapter, the
 * pricing-document treatment matured), then the dark close.
 */
export default function CurationFeaturePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Features", href: "/features" },
          { name: page.navLabel, href: "/features/curation" },
        ]}
      />
      <FaqPageJsonLd items={CURATION_FAQ} />

      {/* The short dark hero on the shared lockup (the PageHero sweep): the
          cinema cut around a STATIC h1, contextual secondary to the album
          page (the surface curation shapes). No stage and no lamp on purpose:
          restraint IS this page's identity, and the queue below is the beat. */}
      <PageHero
        entrance="cut"
        eyebrow={<FeatureHeroEyebrow label={page.navLabel} />}
        heading={page.h1}
        subhead={page.heroSub}
        actions={
          <>
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 px-6 text-base"
            >
              <Link href="/features/album">See the live album</Link>
            </Button>
          </>
        }
        className="overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14"
      />

      {/* THE HOST'S DESK: the whole working body on one paper chapter (the
          chapter doctrine: reading, deciding, trust). */}
      <PaperChapter>
        <ReviewQueueDemo />
        <ReviewModes />
        <Reversibility />
        <BulkTools />
      </PaperChapter>

      {/* The dark close: siblings, questions, then the one conversion band.
          The chapter's own bottom hairline owns the cut back to the cinema,
          so no border-t anywhere in the close. */}
      <RelatedFeatures slugs={["album", "sharing", "privacy"]} />
      <CurationFaq />
      <CtaBand
        heading="Your album, your call."
        subhead="Start your first event free. Let it fill live, or hold every upload for your approval."
        demoLink
      />
    </>
  );
}
