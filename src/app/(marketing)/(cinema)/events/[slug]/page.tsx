import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { BuiltFor } from "@/components/marketing/built-for";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { BreadcrumbJsonLd, FaqPageJsonLd } from "@/components/marketing/jsonld";
import { EventHeroMedia } from "@/components/marketing/sections/events/event-hero-media";
import { ReelAngleBand } from "@/components/marketing/sections/events/reel-angle-band";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { EVENT_TYPE_SLUGS, getEventType } from "@/lib/constants/events";
import { EVENT_PRESENTATION } from "@/lib/constants/events-layout";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

export function generateStaticParams() {
  return EVENT_TYPE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const eventType = getEventType(slug);
  if (!eventType) return {};
  return {
    title: eventType.navLabel,
    description: eventType.intro,
    alternates: { canonical: `/events/${slug}` },
  };
}

// The per-type landing page (B2 re-skin): all SEO structure carries over intact
// (static params, per-type metadata + OG, Breadcrumb + FAQPage JSON-LD, the
// EVENT_TYPES single source, the per-type BuiltFor layouts), rebuilt onto the
// cinema system layer with real manifest media in the hero and the NEW per-type
// reel angle routing to /reel.
export default async function EventTypePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eventType = getEventType(slug);
  if (!eventType) notFound();

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
          { name: eventType.navLabel, href: `/events/${slug}` },
        ]}
      />
      <FaqPageJsonLd items={eventType.faq} />

      {/* Hero: centered copy at the route-H1 scale, then the type's DISTINCT
          media moment (EventHeroMedia keys off EVENT_PRESENTATION.frame). */}
      <section className="overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14">
        <Container>
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <Link
              {...cut(0)}
              href="/events"
              className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground"
            >
              Events
            </Link>
            <h1
              {...cut(1)}
              className="font-heading text-4xl text-balance sm:text-5xl lg:text-6xl"
            >
              {eventType.headline}
            </h1>
            <p
              {...cut(2)}
              className="max-w-2xl text-lg text-pretty text-muted-foreground"
            >
              {eventType.subhead}
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
          <EventHeroMedia frame={EVENT_PRESENTATION[slug].frame} />
        </Container>
      </section>

      {/* THE PLANNING CHAPTER (the 2026-08-26 chapter ruling, type-page shape
          1-2-3): the per-type media hero stays cinema; the intro + BuiltFor
          read as the planning document on paper (this is the "how it works
          for YOUR wedding" content — a thing you read at a desk); then the
          reel angle, FAQ, and CTA close back in the dark. */}
      <PaperChapter>
        <SectionShell width="narrow">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p
              data-mkt-reveal
              className="text-lg text-pretty text-muted-foreground"
              style={{ "--i": 0 } as CSSProperties}
            >
              {eventType.intro}
            </p>
            <div
              data-mkt-reveal
              className="mt-6 flex flex-wrap justify-center gap-2"
              style={{ "--i": 1 } as CSSProperties}
            >
              {eventType.nestedThemes.map((theme) => (
                <span
                  key={theme}
                  className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {theme}
                </span>
              ))}
            </div>
          </Reveal>
        </SectionShell>

        <BuiltFor
          layout={EVENT_PRESENTATION[slug].builtFor}
          help={eventType.howItHelps}
          navLabel={eventType.navLabel}
        />
      </PaperChapter>

      <ReelAngleBand eventType={eventType} />

      <SectionShell width="narrow" eyebrow="FAQ" heading="Common questions">
        <FaqAccordion items={eventType.faq} />
      </SectionShell>

      <CtaBand
        className="border-t"
        heading={`${eventType.ctaTitle}.`}
        subhead="Free to start. Your guests need nothing but their phones."
        demoLink
      />
    </>
  );
}
