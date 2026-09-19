import type { CSSProperties } from "react";

import { EventCard } from "@/components/marketing/sections/events/event-type-card";
import { CardGrid } from "@/components/marketing/system/card-grid";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { EVENT_TYPES } from "@/lib/constants/events";

import { LearnMoreLink } from "../shared/learn-more-link";

/**
 * QUIET-MEDIUM (the loud/quiet map): the four event-type cards over manifest
 * stills, each linking its /events/[slug] landing page (the internal-SEO job).
 *
 * ★ MEDIA-FORWARD, UNLIT, UNTILTED (Will, round 2). The card is the
 * photograph: full-bleed image, copy bottom-left over a dark scrim. The light
 * this row carried for two versions is gone by ruling (four spills followed
 * 765px later by the Pro card's beam put two light events inside one viewport,
 * and scarcity is a distance), and the tilt and its cursor glare went one
 * version earlier for the same family of reason.
 *
 * ★ ONE CARD, TWO SIZES (the events wiring, 2026-09-19). This row and the hub's
 * directory were two components with two opinions about the same object, which
 * is how the conference tile ended up an artifact here and a photograph there.
 * Both are `EventCard` now; this one takes the `teaser` size, which is the same
 * anatomy with the name a step down and the long tail left on the hub. The
 * stand-in stills that used to be named in this file moved to `events.ts` with
 * every other per-type photograph, so a generated set lands in one place
 * (ASSETS rows 24 and 25).
 *
 * In the chapter arc this is a SUPPORTING section: visually interesting on its
 * own, quieter than the reel that opens the chapter above it, and a step down
 * toward pricing, the FAQ and the close.
 */
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
          {EVENT_TYPES.map((type, i) => (
            <EventCard
              key={type.slug}
              type={type}
              size="teaser"
              style={{ "--i": i + 3 } as CSSProperties}
            />
          ))}
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
