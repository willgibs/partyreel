import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd, FaqPageJsonLd } from "@/components/marketing/jsonld";
import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import { AlbumLinkHero } from "@/components/marketing/sections/features/sharing/album-link-hero";
import { DownloadsSection } from "@/components/marketing/sections/features/sharing/downloads-section";
import { OneLink } from "@/components/marketing/sections/features/sharing/one-link";
import { RelatedFeatures } from "@/components/marketing/sections/features/shared/related-features";
import {
  SHARING_FAQ,
  SharingFaq,
} from "@/components/marketing/sections/features/sharing/sharing-faq";
import { WhoGetsWhat } from "@/components/marketing/sections/features/sharing/who-gets-what";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Reveal } from "@/components/marketing/system/reveal";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

const page = featurePage("sharing");

export const metadata: Metadata = {
  title: page.navLabel,
  description: page.heroSub,
  alternates: { canonical: "/features/sharing" },
};

/**
 * /features/sharing (expansion track T2): after the party. Warm cinema/paper
 * mix on the brief's 2-dark / 2-paper / close shape: the album-as-link hero +
 * the lightbox experience in the dark, then the downloads truth (with the zip
 * modal signature) and the who-gets-what clarity on paper, then the dark close.
 */
export default function SharingFeaturePage() {
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
          { name: page.navLabel, href: "/features/sharing" },
        ]}
      />
      <FaqPageJsonLd items={SHARING_FAQ} />

      {/* The hero: stub grammar + the album-as-link artifact beneath. */}
      <section className="overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14">
        <Container>
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <FeatureHeroEyebrow {...cut(0)} label={page.navLabel} />
            {/* LCP rule: the H1 never carries a reveal-hidden state. */}
            <h1 className="font-heading text-4xl text-balance sm:text-5xl md:text-6xl lg:text-7xl">
              {page.h1}
            </h1>
            <p
              {...cut(1)}
              className="max-w-2xl text-lg text-pretty text-muted-foreground"
            >
              {page.heroSub}
            </p>
            <div {...cut(2)} className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 px-6 text-base">
                <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 px-6 text-base"
              >
                <Link href="/how-it-works">See how it works</Link>
              </Button>
            </div>
          </Reveal>
          {/* The Reveal is the trigger ANCESTOR only: the tiles inside are the
              hero's LCP media, so nothing here is reveal-hidden. The frame's
              own non-LCP chrome (the address pill, the copy control) carries
              the quiet arrival instead. */}
          <Reveal className="mx-auto mt-10 w-full max-w-3xl sm:mt-14">
            <div aria-hidden>
              <AlbumLinkHero />
            </div>
          </Reveal>
        </Container>
      </section>

      <OneLink />

      {/* THE MORNING-AFTER PAPER: taking it home is a desk decision (the
          chapter doctrine), so downloads + who-gets-what read on one page. */}
      <PaperChapter>
        <DownloadsSection />
        <WhoGetsWhat />
      </PaperChapter>

      <RelatedFeatures slugs={["album", "privacy", "reel"]} />
      <SharingFaq />
      <CtaBand
        className="border-t"
        heading="Collect it all, hand it all back."
        subhead={
          "Start your first event free. When it’s over, one link carries the whole thing home."
        }
        demoLink
      />
    </>
  );
}
