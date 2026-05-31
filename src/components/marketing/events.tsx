import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { EVENT_TYPES } from "@/lib/constants/events";

import { Section } from "./section";

export function Events() {
  return (
    <Section
      id="events"
      eyebrow="Events"
      heading="Made for every kind of get-together"
      subhead="If people show up with phones, Partyreel collects what they capture."
    >
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {EVENT_TYPES.map(({ slug, navLabel, icon: Icon, teaser }) => (
          <Link
            key={slug}
            href={`/events/${slug}`}
            className="group flex flex-col gap-3"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-brand transition-colors duration-150 group-hover:bg-brand/15">
              <Icon className="size-5" />
            </span>
            <h3 className="font-heading text-base font-medium">{navLabel}</h3>
            <p className="text-sm text-muted-foreground">{teaser}</p>
          </Link>
        ))}
      </div>
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
