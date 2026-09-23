import type { Metadata } from "next";
import Link from "next/link";

import { HelpPane } from "@/components/marketing/built-for";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { BreadcrumbJsonLd, FaqPageJsonLd } from "@/components/marketing/jsonld";
import { EventDoor } from "@/components/marketing/sections/events/event-door";
import { EventsHubObject } from "@/components/marketing/sections/events/event-object";
import { TypeDirectory } from "@/components/marketing/sections/events/type-directory";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { PageHero } from "@/components/marketing/system/page-hero";
import { SectionLight } from "@/components/marketing/system/section-light";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Button } from "@/components/ui/button";
import { EVENTS_HUB } from "@/lib/constants/events";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Collect every photo and video from any event in one shared album. Guests scan a QR code and upload from their phones, with no app required. Weddings, parties, conferences, trips, and more.",
  alternates: { canonical: "/events" },
};

/**
 * THE /events HUB: the cross-event landing page and the directory into the four
 * type pages, rebuilt with them (`event-identity` round one).
 *
 * ★ IT STAYS ALL DARK, which is the one place its arc differs from its four
 * children's. A hub is a way in rather than a page you read at a desk, and it
 * has no planning document of its own to earn a light chapter; the type pages
 * turn to paper because theirs do (`the-arc=chapter`).
 *
 * ★ ITS OBJECT IS THE CROSS-EVENT ONE. A type page's still life is one kind of
 * event and the hub's has to say ANY, so it is one print per type with the same
 * real code standing in front of them. (Which object the hub wears was the open
 * call in the track manifest; this is the answer, and it is stated in the
 * Handoff as Will's to overrule.)
 *
 * ★ AND ITS PROOF IS THE SAME DOOR its children close on, in the cross-event
 * register. The reel band that used to sit here retired with the round: a
 * centred 300px portrait in a 1,280px room was the shape he named twice in one
 * day, and every page ending on the reel was the other half of the note.
 */
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

      {/* The same pool of light the four type heroes stand in, so the family
          reads as one place from the first screen. */}
      <SectionLight placement="room" from={{ x: "50%", y: "78%" }} reach="112%">
        <PageHero
          entrance="cut"
          eyebrow={EVENTS_HUB.eyebrow}
          heading={EVENTS_HUB.headline}
          subhead={EVENTS_HUB.subhead}
          actions={
            /* The pair on one row, the longer demo line beneath (the hub's
               balance, Will 2026-09-02). */
            <div className="flex flex-col items-center gap-4">
              <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                <Button asChild size="cta" className="w-full sm:w-auto">
                  <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
                </Button>
                <Button
                  asChild
                  size="cta"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>
              <DemoCtaLink />
            </div>
          }
          className="relative overflow-x-clip pt-10 pb-0 sm:pt-20 sm:pb-16"
        >
          <EventsHubObject stills={EVENTS_HUB.heroPrints} />
        </PageHero>
      </SectionLight>

      <SectionShell
        heading="Pick your kind of event"
        subhead={EVENTS_HUB.overview}
      >
        <TypeDirectory />
      </SectionShell>

      {/* The hub's benefits ride the SAME windowpane the four type pages use
          (A20 cohesion), so the umbrella page reads as their parent rather
          than a different template. */}
      <SectionShell eyebrow="Why Partyreel" heading="Built for any event">
        <HelpPane help={EVENTS_HUB.benefits} />
      </SectionShell>

      <EventDoor singular="event" angle={EVENTS_HUB.reelAngle} />

      <SectionShell
        width="narrow"
        eyebrow="FAQ"
        heading="Common questions"
        className="max-sm:pb-10"
      >
        <FaqAccordion items={EVENTS_HUB.faq} />
      </SectionShell>

      <CtaBand
        className="border-t max-sm:pt-10"
        heading="Whatever you're hosting, start it free."
        subhead="Create the event, share one QR code, and the whole thing lands in one album."
        demoLink
      />
    </>
  );
}
