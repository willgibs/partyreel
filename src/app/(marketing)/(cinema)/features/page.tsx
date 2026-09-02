import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import {
  type DoorSlug,
  FeatureDoor,
} from "@/components/marketing/sections/features/shared/feature-door";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import {
  FEATURE_PAGES,
  type FeaturePage,
} from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";

export const metadata: Metadata = {
  title: "Features",
  description: `Everything Partyreel does: the live album, a styled QR code, host curation, full-quality sharing and downloads, guest profiles, privacy controls, and a highlight reel in ${STYLE_CATALOG.length} styles.`,
  alternates: { canonical: "/features" },
};

/**
 * THE FEATURES HUB AS A DIRECTORY (the events-hub precedent): land, see the
 * seven doors, pick the question that matters to you. The old flat spotlight
 * depth REDISTRIBUTED into the dedicated feature pages; this page's job is
 * orientation + routing (the progressive-disclosure ladder's middle rung).
 *
 * The feature-pages round (2026-09-01) made the doors PHOTOGRAPHIC: the ruled
 * media-forward card (feature-door.tsx, the event cards' anatomy) with each
 * feature's own signature chip, the reel leading full-width on its own poster.
 * R4's hand-drawn motifs solved "seven identical text rectangles" at chip
 * scale; the photographs solve it at the size a door deserves, and they are
 * the same doors every feature page's closing band now shows, so the site has
 * ONE picture of each feature rather than a motif here and a text tile there.
 * The hero is the shared PageHero lockup on the cinema cut (the sweep Will
 * asked for), so this page can no longer drift from the six behind it.
 */
export default function FeaturesPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Features", href: "/features" },
        ]}
      />

      <PageHero
        entrance="cut"
        eyebrow="Features"
        heading="Everything you need, nothing to chase."
        subhead="One QR code in, one album out. This is everything Partyreel does in between, for your guests and for you."
        actions={
          /* A balanced pair, then the longer demo line on its own row beneath
             (Will, 2026-09-02): a button beside a sentence-length link read
             lopsided. */
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 px-6 text-base">
                <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 px-6 text-base"
              >
                <Link href="/how-it-works">How it works</Link>
              </Button>
            </div>
            <DemoCtaLink />
          </div>
        }
        className="overflow-x-clip pt-14 pb-4 sm:pt-20 sm:pb-6"
      />

      {/* The directory: the payoff leads full-width, then the six feature
          pages, each one buyer question. The stagger groups by ROW (lead=0,
          row one=1, row two=2) so the whole choreography lands inside the
          ~300ms budget instead of drifting to 540ms across seven items. The
          doors land on the hard cut: this is the page's one visual beat, and
          a cut is how a set of photographs arrives in the cinema. */}
      <SectionShell>
        <Reveal className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureDoor
            slug="reel"
            aspect="wide"
            copy="long"
            priority
            data-mkt-cut=""
            className="sm:col-span-2 lg:col-span-3"
            style={{ "--i": 0 } as CSSProperties}
          />
          {FEATURE_PAGES.map((page: FeaturePage, i) => (
            <FeatureDoor
              key={page.slug}
              slug={page.slug as DoorSlug}
              aspect="portrait"
              copy="long"
              data-mkt-cut=""
              style={{ "--i": Math.floor(i / 3) + 1 } as CSSProperties}
            />
          ))}
        </Reveal>
      </SectionShell>

      {/* The two-sided pointer: the one concept the directory can't carry in
          tiles (the product has a guest side and a host side), routing to the
          walkthrough that interleaves them, plus the hub's one GoDeeper rung
          into the help center. THE QUIET BEAT of the chapter (Will,
          2026-09-02): it used to be a full SectionShell with a body-tier
          heading and an outline button, which sat back to back with the
          CtaBand as two near-identical designs. It is now a minimal follow-up
          at the 24/30 prose tier with two chevron links, so the doors above
          keep the weight and the band below gets its pop back. */}
      <section className="pt-8 pb-20 sm:pt-10 sm:pb-24">
        <Container>
          <Reveal className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center">
            <Eyebrow data-mkt-reveal style={{ "--i": 0 } as CSSProperties}>
              How it works
            </Eyebrow>
            <h2
              data-mkt-reveal
              className="font-heading text-2xl text-balance sm:text-3xl"
              style={{ "--i": 1 } as CSSProperties}
            >
              Two sides, one album.
            </h2>
            <p
              data-mkt-reveal
              className="text-pretty text-muted-foreground"
              style={{ "--i": 2 } as CSSProperties}
            >
              Guests scan and shoot. You curate and keep. The walkthrough shows
              both sides, start to finish.
            </p>
            <div
              data-mkt-reveal
              className="mt-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2"
              style={{ "--i": 3 } as CSSProperties}
            >
              <LearnMoreLink href="/how-it-works">See how it works</LearnMoreLink>
              <LearnMoreLink href="/help/how-partyreel-works">
                How Partyreel works
              </LearnMoreLink>
            </div>
          </Reveal>
        </Container>
      </section>

      <CtaBand
        className="border-t"
        heading="Start your first event free."
        subhead="Create the event, put the QR where people can see it, and the album fills itself."
        demoLink
      />
    </>
  );
}
