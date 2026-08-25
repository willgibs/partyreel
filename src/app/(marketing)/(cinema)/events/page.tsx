import type { Metadata } from "next";
import Link from "next/link";

import { EventFrameCards } from "@/components/marketing/event-frame-cards";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { FinalCta } from "@/components/marketing/final-cta";
import { BreadcrumbJsonLd, FaqPageJsonLd } from "@/components/marketing/jsonld";
import { Section } from "@/components/marketing/section";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { EVENTS_HUB } from "@/lib/constants/events";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Collect every photo and video from any event in one shared album. Guests scan a QR code and upload from their phones, no app and no account. Weddings, parties, conferences, trips, and more.",
  alternates: { canonical: "/events" },
};

// The /events hub: a real landing page (cross-event story + the type directory + an
// aggregate FAQ for rich results), not just the 4-card grid the home Events teaser shows.
// Copy is single-sourced in EVENTS_HUB; the cards come from the shared EventFrameCards.
export default function EventsHub() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Events", href: "/events" },
        ]}
      />
      <FaqPageJsonLd items={EVENTS_HUB.faq} />

      <section className="border-b">
        <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <span className="text-sm font-medium text-brand">
            {EVENTS_HUB.eyebrow}
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tighter text-balance sm:text-5xl">
            {EVENTS_HUB.headline}
          </h1>
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
            {EVENTS_HUB.subhead}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href="/login">Start free</Link>
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
        </Container>
      </section>

      <TrustStrip />

      <Section
        heading="Made for every kind of get-together"
        subhead={EVENTS_HUB.overview}
      >
        <EventFrameCards />
      </Section>

      <Section
        className="bg-muted/30"
        eyebrow="Why Partyreel"
        heading="Built for any event"
      >
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {EVENTS_HUB.benefits.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-heading text-base font-medium">
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="FAQ" heading="Common questions">
        <FaqAccordion items={EVENTS_HUB.faq} />
      </Section>

      <FinalCta />
    </>
  );
}
