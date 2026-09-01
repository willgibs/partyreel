import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { CardGrid } from "@/components/marketing/system/card-grid";
import { EventCardLamp } from "@/components/marketing/sections/home/event-card-glow";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { EVENT_TYPES } from "@/lib/constants/events";
import { marketingImage } from "@/lib/constants/marketing-media";

import { LearnMoreLink } from "../shared/learn-more-link";

/**
 * QUIET (the loud/quiet map): the four event-type cards over manifest stills,
 * each linking its /events/[slug] landing page (the internal-SEO job).
 *
 * ★ THE FLOURISH HERE IS LIGHT, NOT MOTION (Will, round 1b). The card-tilt
 * recipe used to run here; both halves of it are gone. A 3D tilt and a
 * cursor-tracking glare are each attractive alone, but either one would have to
 * be adopted site-wide to read as identity rather than as a one-off, and the
 * glare in particular competes with the spill it now sits beside: two different
 * light models on one card, one of them chasing the pointer. The underlight
 * replaces both, and it is the SAME mechanic as the film strip and the footer.
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
      /* TEMPO (R4/A32): pointer-ended section, so part of the bottom padding
         goes back (the reviewer clocked a ~190px dead band under this link). */
      className="pb-10 sm:pb-12"
    >
      {/* ONE CHOREOGRAPHY (R4): four cards and a pointer used to appear flat
          under a revealed header. They continue the header's cascade (slots
          0-2) under ONE observer at a tightened 70ms step, so five more slots
          still land inside ~350ms. */}
      <Reveal
        className="mx-auto mt-12 max-w-6xl"
        style={{ "--mkt-stagger-ms": "70ms" } as CSSProperties}
      >
        <CardGrid columns={4}>
          {EVENT_TYPES.map(({ slug, navLabel, teaser }, i) => {
            const still = marketingImage(
              EVENT_STILLS[slug] ?? "wedding-golden",
            );
            // EQUAL BOTTOM EDGE (R4/A7): grid items stretch, but the tilt's
            // inner .mkt-tilt-card is a plain block, so a 2-line teaser card
            // stopped short of its 3-line neighbours. Height is threaded
            // through EVERY wrapper here (the shared .mkt-tilt-card class also
            // serves non-grid consumers, so it must not be made 100% globally).
            return (
              <EventCardLamp
                key={slug}
                style={{ "--i": i + 3 } as CSSProperties}
              >
                {/* The house press idiom (R4): explicit transition
                      properties, never `all`. TiltCard was removed at round 1b
                      (Will): the 3D tilt and its cursor-tracking glare are both
                      fine effects in isolation, but each would have to become a
                      site-wide pattern to belong, and neither complements the
                      spill/beam identity -- the glare in particular competes
                      with the very light it sits next to. */}
                <Link
                  href={`/events/${slug}`}
                  className="flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-transform duration-150 ease-emphasis active:scale-[0.99]"
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
              </EventCardLamp>
            );
          })}
        </CardGrid>
        <div
          data-mkt-reveal
          className="mt-10 text-center"
          style={{ "--i": 7 } as CSSProperties}
        >
          <LearnMoreLink href="/events">Browse all events</LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}
