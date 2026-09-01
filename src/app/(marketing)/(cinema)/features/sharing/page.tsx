import type { Metadata } from "next";
import Link from "next/link";

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
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Reveal } from "@/components/marketing/system/reveal";
import { ScreenLamp } from "@/components/marketing/system/screen-lamp";
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

      {/* The hero on the shared lockup (the PageHero sweep) over the
          album-as-link artifact, which is THE PAGE'S LAMP: an album open on a
          photograph is a lit screen, and it throws its own sampled light down
          onto the dark section beneath it (system/screen-lamp.tsx). The
          lightbox mock further down stays unlit on purpose: two lit screens
          inside one viewport is the scarcity failure. */}
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
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </>
        }
        /* overflow-x-clip, never overflow-hidden: the lamp hangs below. */
        className="overflow-x-clip pt-14 pb-10 sm:pt-20 sm:pb-14"
      >
        {/* The Reveal is the trigger ANCESTOR only: the tiles inside are the
            hero's LCP media, so nothing here is reveal-hidden. The frame's
            own non-LCP chrome (the address pill, the copy control) carries
            the quiet arrival instead. */}
        <Reveal className="mx-auto mt-10 w-full max-w-3xl sm:mt-14">
          <ScreenLamp>
            <div aria-hidden>
              <AlbumLinkHero />
            </div>
          </ScreenLamp>
        </Reveal>
      </PageHero>

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
