import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { EventFrameCards } from "@/components/marketing/event-frame-cards";

import { Section } from "./section";

export function Events() {
  return (
    <Section
      id="events"
      eyebrow="Events"
      heading="Made for every kind of get-together"
      subhead="If people show up with phones, Partyreel collects what they capture."
    >
      <EventFrameCards />
      <div className="mt-12 text-center">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors duration-150 hover:text-brand"
        >
          Browse all events
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </Section>
  );
}
