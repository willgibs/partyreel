import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { PricingPointer } from "@/components/marketing/sections/how-it-works/pricing-pointer";
import { ReelPayoff } from "@/components/marketing/sections/how-it-works/reel-payoff";
import { SideChip } from "@/components/marketing/sections/how-it-works/side-chip";
import { Spine } from "@/components/marketing/sections/how-it-works/spine";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Reveal } from "@/components/marketing/system/reveal";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From one QR code to the highlight reel: how a host sets up Partyreel, what guests see, and how the whole event lands in one album.",
  alternates: { canonical: "/how-it-works" },
};

/**
 * THE WALKTHROUGH (Phase B, T3): the planning guide for a host who wants to
 * understand everything before going all-in. Short dark hero, then the
 * two-sided spine on paper (host and guest steps interleaved as one numbered
 * timeline, the page's signature), then the lights come down for the reel
 * payoff, a quiet pricing pointer, and the close.
 */
export default function HowItWorksPage() {
  const cut = (i: number) => ({
    "data-mkt-cut": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "How it works", href: "/how-it-works" },
        ]}
      />

      {/* The short dark hero: the stub's grammar + the two-sided legend. */}
      <section className="overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14">
        <Container>
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <Eyebrow {...cut(0)}>How it works</Eyebrow>
            <h1
              {...cut(1)}
              className="font-heading text-4xl text-balance sm:text-5xl lg:text-6xl"
            >
              From QR to reel, start to finish.
            </h1>
            <p
              {...cut(2)}
              className="max-w-2xl text-lg text-pretty text-muted-foreground"
            >
              What you set up, what your guests see, and how the whole event
              comes back as one album and a highlight reel.
            </p>
            {/* The legend: the spine below interleaves both sides. */}
            <div {...cut(3)} className="flex items-center gap-2">
              <SideChip>For hosts</SideChip>
              <SideChip>For guests</SideChip>
            </div>
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
                <Link href="/features">Browse the features</Link>
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* THE PAPER SPINE: a plan is read at a desk (the chapter doctrine). */}
      <PaperChapter>
        <Spine />
      </PaperChapter>

      {/* Lights back down for the payoff, then the quiet pricing strip; its
          own border-y hairlines carry the cuts, so the CtaBand adds none. */}
      <ReelPayoff />
      <PricingPointer />

      <CtaBand
        heading="Start your first event free."
        subhead="Create the event, share one QR code, and the whole thing lands in one album."
        demoLink
      />
    </>
  );
}
