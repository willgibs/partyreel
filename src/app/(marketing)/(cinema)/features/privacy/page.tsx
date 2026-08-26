import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { BreadcrumbJsonLd, FaqPageJsonLd } from "@/components/marketing/jsonld";
import { AccessSwitch } from "@/components/marketing/sections/features/privacy/access-switch";
import { MediaLives } from "@/components/marketing/sections/features/privacy/media-lives";
import { NeverRidesAlong } from "@/components/marketing/sections/features/privacy/never-rides-along";
import { PeopleNotMachines } from "@/components/marketing/sections/features/privacy/people-not-machines";
import { PRIVACY_FAQ } from "@/components/marketing/sections/features/privacy/privacy-faq";
import { RelatedFeatures } from "@/components/marketing/sections/features/shared/related-features";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

const page = featurePage("privacy");

export const metadata: Metadata = {
  title: page.navLabel,
  description: page.heroSub,
  alternates: { canonical: "/features/privacy" },
};

/**
 * THE SOBER PAGE (Phase B, T3): the trust story a nervous wedding host reads
 * before handing us the album. Paper-dominant and document-grade by design,
 * the site's quietest page: a short dark hero, then ONE paper chapter (the
 * access switch signature, the quiet protections, the durability document,
 * the human-moderation close), then a dark close. Restraint IS the design;
 * every claim stays inside the verified trust facts and nothing overclaims.
 */
export default function PrivacyFeaturePage() {
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
          { name: page.navLabel, href: "/features/privacy" },
        ]}
      />
      <FaqPageJsonLd items={PRIVACY_FAQ} />

      {/* The short dark hero: registry grammar, deliberately no media. */}
      <section className="overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14">
        <Container>
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            {/* ONE ruled eyebrow, not two stacked labels: the parent link and
                the page name read as a single breadcrumb line. */}
            <Eyebrow {...cut(0)}>
              <Link
                href="/features"
                className="transition-colors duration-150 hover:text-foreground"
              >
                Features
              </Link>
              <span aria-hidden className="px-1.5 text-muted-foreground/50">
                ·
              </span>
              {page.navLabel}
            </Eyebrow>
            <h1
              {...cut(1)}
              className="font-heading text-4xl text-balance sm:text-5xl lg:text-6xl"
            >
              {page.h1}
            </h1>
            <p
              {...cut(2)}
              className="max-w-2xl text-lg text-pretty text-muted-foreground"
            >
              {page.heroSub}
            </p>
            <div {...cut(3)} className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 px-6 text-base">
                <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 px-6 text-base"
              >
                <Link href="/features/curation">How curation works</Link>
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* THE PAPER CHAPTER: trust is read at a desk, so the whole argument
          lives on one paper plane (the chapter doctrine's hard cut). */}
      <PaperChapter>
        <AccessSwitch />
        <NeverRidesAlong />
        <MediaLives />
        <PeopleNotMachines />
      </PaperChapter>

      {/* The dark close: sideways routes, the FAQ, then the one CTA. The
          chapter's bottom hairline owns the cut, so no border-t here. */}
      <RelatedFeatures slugs={["curation", "sharing", "guests"]} />

      <SectionShell width="narrow" eyebrow="FAQ" heading="Common questions">
        {/* The list arrives on the slot after the header's lines, instead of
            popping in finished under an animated heading. */}
        <Reveal>
          <div data-mkt-reveal style={{ "--i": 3 } as CSSProperties}>
            <FaqAccordion items={PRIVACY_FAQ} />
          </div>
        </Reveal>
      </SectionShell>

      <CtaBand
        heading="Start your first event free."
        subhead="Create the event, share one QR code, and the whole thing lands in one album."
        demoLink
      />
    </>
  );
}
