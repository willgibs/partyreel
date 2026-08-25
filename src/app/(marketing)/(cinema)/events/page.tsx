import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { BreadcrumbJsonLd, FaqPageJsonLd } from "@/components/marketing/jsonld";
import { TypeDirectory } from "@/components/marketing/sections/events/type-directory";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { EVENTS_HUB } from "@/lib/constants/events";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Collect every photo and video from any event in one shared album. Guests scan a QR code and upload from their phones, no app and no account. Weddings, parties, conferences, trips, and more.",
  alternates: { canonical: "/events" },
};

// The /events hub (B2 re-skin): a real landing page (cross-event story + the
// type directory + an aggregate FAQ for rich results), rebuilt onto the cinema
// system layer. All copy stays single-sourced in EVENTS_HUB; structure + JSON-LD
// (Breadcrumb + FAQPage) carry over intact, the SEO equity this route exists for.
export default function EventsHub() {
  const cut = (i: number) => ({
    "data-mkt-cut": "",
    style: { "--i": i } as CSSProperties,
  });

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Events", href: "/events" },
        ]}
      />
      <FaqPageJsonLd items={EVENTS_HUB.faq} />

      {/* Hero: centered, the route-H1 scale (4xl/5xl/6xl) on the cinema cut. */}
      <section className="overflow-hidden pt-14 pb-4 sm:pt-20 sm:pb-6">
        <Container>
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <Eyebrow {...cut(0)}>{EVENTS_HUB.eyebrow}</Eyebrow>
            <h1
              {...cut(1)}
              className="font-heading text-4xl text-balance sm:text-5xl lg:text-6xl"
            >
              {EVENTS_HUB.headline}
            </h1>
            <p
              {...cut(2)}
              className="max-w-2xl text-pretty text-lg text-muted-foreground"
            >
              {EVENTS_HUB.subhead}
            </p>
            <div
              {...cut(3)}
              className="mt-2 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-11 px-6 text-base">
                  <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-11 px-6 text-base"
                >
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>
              <DemoCtaLink />
            </div>
          </Reveal>
        </Container>
      </section>

      <SectionShell
        heading="Pick your kind of event"
        subhead={EVENTS_HUB.overview}
      >
        <TypeDirectory />
      </SectionShell>

      <SectionShell eyebrow="Why Partyreel" heading="Built for any event">
        <Reveal className="mx-auto mt-12 grid max-w-4xl gap-x-10 gap-y-10 sm:grid-cols-2">
          {EVENTS_HUB.benefits.map(({ icon: Icon, title, body }, i) => (
            <div
              key={title}
              data-mkt-reveal
              className="flex items-start gap-4"
              style={{ "--i": i } as CSSProperties}
            >
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border text-muted-foreground">
                <Icon className="size-5" strokeWidth={1.5} />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-heading text-base font-medium">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </Reveal>
      </SectionShell>

      <SectionShell width="narrow" eyebrow="FAQ" heading="Common questions">
        <FaqAccordion items={EVENTS_HUB.faq} />
      </SectionShell>

      <CtaBand
        className="border-t"
        heading="Whatever you're hosting, start it free."
        subhead="Create the event, share one QR code, and the whole thing lands in one album."
        demoLink
      />
    </>
  );
}
