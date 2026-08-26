import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { FEATURE_PAGES } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";

export const metadata: Metadata = {
  title: "Features",
  description: `Everything Partyreel does: the live album, a styled QR code, host curation, full-quality sharing and downloads, guest profiles, privacy controls, and a highlight reel in ${STYLE_CATALOG.length} styles.`,
  alternates: { canonical: "/features" },
};

/**
 * THE FEATURES HUB AS A DIRECTORY (the expansion round; the events-hub
 * precedent): land, see the seven doors, pick the question that matters to
 * you. The old flat spotlight depth REDISTRIBUTED into the dedicated feature
 * pages; this page's job is orientation + routing (the progressive-disclosure
 * ladder's middle rung). Tile visuals get their bespoke mini-identities in the
 * Phase-C polish pass once the pages themselves land.
 */
export default function FeaturesPage() {
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
        ]}
      />

      <section className="overflow-hidden pt-14 pb-4 sm:pt-20 sm:pb-6">
        <Container>
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <Eyebrow {...cut(0)}>Features</Eyebrow>
            <h1
              {...cut(1)}
              className="font-heading text-4xl text-balance sm:text-5xl lg:text-6xl"
            >
              Everything you need, nothing to chase.
            </h1>
            <p
              {...cut(2)}
              className="max-w-xl text-lg text-pretty text-muted-foreground"
            >
              One QR code in, one album out. This is everything Partyreel does
              in between, for your guests and for you.
            </p>
            <div
              {...cut(3)}
              className="mt-2 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
            >
              <Button asChild size="lg" className="h-11 px-6 text-base">
                <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
              </Button>
              <DemoCtaLink />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* The directory: the six feature pages + the reel, each one buyer
          question. Whole tiles are mkt-learn links (the paper-card interaction
          recipe on the cinema field). */}
      <SectionShell>
        <Reveal className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ...FEATURE_PAGES.map((page) => ({
              href: `/features/${page.slug}`,
              title: page.navLabel,
              blurb: page.heroSub,
            })),
            {
              href: "/reel",
              title: "The highlight reel",
              blurb:
                "The whole event, cut into a cinematic minute you can restyle instantly and take home.",
            },
          ].map((tile, i) => (
            <Link
              key={tile.href}
              href={tile.href}
              data-mkt-reveal
              className="mkt-learn group flex flex-col gap-2 rounded-xl border bg-card/40 p-6 transition-[border-color,transform] duration-150 hover:border-foreground/25 active:scale-[0.99]"
              style={{ "--i": i } as CSSProperties}
            >
              <span className="flex items-center gap-1.5 font-heading text-lg sm:text-xl">
                {tile.title}
                <LearnChevron />
              </span>
              <span className="text-sm leading-relaxed text-muted-foreground">
                {tile.blurb}
              </span>
            </Link>
          ))}
        </Reveal>
      </SectionShell>

      {/* The two-sided teaser: the one concept the directory can't carry in
          tiles — the product has a guest side and a host side — routing to the
          walkthrough that interleaves them. */}
      <SectionShell
        width="narrow"
        eyebrow="How it works"
        heading="Two sides, one album."
        subhead="Guests scan and shoot. You curate and keep. The walkthrough shows both sides, start to finish."
      >
        <Reveal className="mt-8 flex justify-center">
          <Button asChild size="lg" variant="outline" className="h-11 px-6">
            <Link href="/how-it-works">See how it works</Link>
          </Button>
        </Reveal>
      </SectionShell>

      <CtaBand
        className="border-t"
        heading="Start your first event free."
        subhead="Create the event, put the QR where people can see it, and the album fills itself."
        demoLink
      />
    </>
  );
}
