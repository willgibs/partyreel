import Image from "next/image";
import Link from "next/link";

import { CardGrid } from "@/components/marketing/system/card-grid";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { TiltCard } from "@/components/marketing/system/tilt-card";
import { EVENT_TYPES } from "@/lib/constants/events";
import { marketingImage } from "@/lib/constants/marketing-media";

import { LearnMoreLink } from "../shared/learn-more-link";

/**
 * QUIET (the loud/quiet map): the four event-type cards over manifest stills,
 * each linking its /events/[slug] landing page (the internal-SEO job). The
 * card-tilt recipe is the one allowed flourish here (hover feedback, not a
 * mechanic). TiltCard is applied directly (not CardGrid's tilt prop) so the
 * card radius reaches .mkt-tilt-card via border-radius:inherit and the glare
 * clips to the rounded corners; CardGrid's tilt wrapper takes no className,
 * a threading gap flagged for the orchestrator.
 */

// Representative stills per type. KNOWN MANIFEST GAP: the bootstrap 12 have no
// conference or trip subjects (the plan's batch-1 fill list), so those two
// borrow the closest reads (venue hall / outdoor crowd); the fix is a manifest
// swap, never a component change.
const EVENT_STILLS: Record<string, string> = {
  weddings: "wedding-golden",
  parties: "party-balloons",
  conferences: "reception-hall",
  trips: "festival-crowd",
};

export function EventsTeaser() {
  return (
    <SectionShell
      id="events"
      eyebrow="Events"
      heading="Made for every kind of get-together"
      subhead="If people show up with phones, Partyreel collects what they capture."
    >
      <CardGrid columns={4} className="mx-auto mt-12 max-w-6xl">
        {EVENT_TYPES.map(({ slug, navLabel, teaser }) => {
          const still = marketingImage(EVENT_STILLS[slug] ?? "wedding-golden");
          return (
            <TiltCard key={slug} className="rounded-xl">
              <Link
                href={`/events/${slug}`}
                className="flex h-full flex-col overflow-hidden rounded-xl border bg-card"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={still.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1 p-5">
                  <h3 className="font-heading text-lg sm:text-xl">
                    {navLabel}
                  </h3>
                  <p className="text-sm text-muted-foreground">{teaser}</p>
                </div>
              </Link>
            </TiltCard>
          );
        })}
      </CardGrid>
      <div className="mt-10 text-center">
        <LearnMoreLink href="/events">Browse all events</LearnMoreLink>
      </div>
    </SectionShell>
  );
}
