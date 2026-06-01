import type { Metadata } from "next";

import { EventFrameCards } from "@/components/marketing/event-frame-cards";
import { FinalCta } from "@/components/marketing/final-cta";
import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { Section } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "Events",
  description:
    "See how Partyreel collects every photo and video for weddings, parties, conferences, and trips. No app and no account for your guests.",
  alternates: { canonical: "/events" },
};

export default function EventsHub() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Events", href: "/events" },
        ]}
      />
      <Section
        eyebrow="Events"
        heading="Made for every kind of get-together"
        subhead="If people show up with phones, Partyreel collects what they capture. Find your event."
      >
        <EventFrameCards />
      </Section>
      <FinalCta />
    </>
  );
}
