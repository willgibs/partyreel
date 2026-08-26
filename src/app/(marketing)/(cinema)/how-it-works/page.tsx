import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Reveal } from "@/components/marketing/system/reveal";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

// PHASE-A STUB: the Phase-B guide track (T3) replaces this body wholesale with
// the two-sided walkthrough spine. Metadata + hero grammar are already real.
export const metadata: Metadata = {
  title: "How it works",
  description:
    "From one QR code to the highlight reel: how a host sets up Partyreel, what guests see, and how the whole event lands in one album.",
  alternates: { canonical: "/how-it-works" },
};

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
                <Link href="/features">Browse the features</Link>
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
      <CtaBand
        className="border-t"
        heading="Start your first event free."
        subhead="Create the event, share one QR code, and the whole thing lands in one album."
        demoLink
      />
    </>
  );
}
