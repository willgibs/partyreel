import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { eventFrame } from "@/components/marketing/event-frame";
import { EVENT_TYPES } from "@/lib/constants/events";
import { EVENT_PRESENTATION } from "@/lib/constants/events-layout";
import { cn } from "@/lib/utils";

// The 4 event-type cards, each previewing its DISTINCT landing-page frame in a uniform
// fixed-height "stage" (so the cards stay aligned despite the frames' different aspect
// ratios — no transform-scale). Shared by the `/events` hub AND the home Events teaser, so
// the showcase is single-sourced and never drifts; each card links straight to its event
// landing page. (When the hub grows beyond a directory, it adds value AROUND these cards.)
export function EventFrameCards({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2",
        className,
      )}
    >
      {EVENT_TYPES.map(({ slug, navLabel, teaser }) => (
        <Link
          key={slug}
          href={`/events/${slug}`}
          className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors duration-150 hover:border-brand/40"
        >
          <div className="flex h-64 items-center justify-center overflow-hidden border-b bg-muted/20 px-6">
            {eventFrame(EVENT_PRESENTATION[slug].frame, "preview", slug)}
          </div>
          <div className="flex flex-col gap-2 p-6">
            <h3 className="font-heading text-lg font-medium">{navLabel}</h3>
            <p className="text-sm text-muted-foreground">{teaser}</p>
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors duration-150 group-hover:text-brand">
              Explore
              <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
