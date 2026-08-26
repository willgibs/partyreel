import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd, FaqPageJsonLd } from "@/components/marketing/jsonld";
import { BulkTools } from "@/components/marketing/sections/features/curation/bulk-tools";
import {
  CURATION_FAQ,
  CurationFaq,
} from "@/components/marketing/sections/features/curation/curation-faq";
import { RelatedFeatures } from "@/components/marketing/sections/features/curation/related-features";
import { Reversibility } from "@/components/marketing/sections/features/curation/reversibility";
import { ReviewModes } from "@/components/marketing/sections/features/curation/review-modes";
import { ReviewQueueDemo } from "@/components/marketing/sections/features/curation/review-queue-demo";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Reveal } from "@/components/marketing/system/reveal";
import { Container } from "@/components/shared/container";
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
  const cut = (i: number) => ({
    "data-mkt-cut": "",
    style: { "--i": i } as CSSProperties,
  });

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

      {/* The short dark hero: the stub grammar, contextual secondary to the
          album page (the surface curation shapes). */}
      <section className="overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14">
        <Container>
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <Link
              {...cut(0)}
              href="/features"
              className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground"
            >
              Features
            </Link>
            <Eyebrow {...cut(1)}>{page.navLabel}</Eyebrow>
            <h1
              {...cut(2)}
              className="font-heading text-4xl text-balance sm:text-5xl lg:text-6xl"
            >
              {page.h1}
            </h1>
            <p
              {...cut(3)}
              className="max-w-2xl text-lg text-pretty text-muted-foreground"
            >
              {page.heroSub}
            </p>
            <div {...cut(4)} className="mt-2 flex flex-col gap-3 sm:flex-row">
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
            </div>
          </Reveal>
        </Container>
      </section>

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
      <RelatedFeatures />
      <CurationFaq />
      <CtaBand
        heading="Your album, your call."
        subhead="Start your first event free. Let it fill live, or hold every upload for your approval."
        demoLink
      />
    </>
  );
}
