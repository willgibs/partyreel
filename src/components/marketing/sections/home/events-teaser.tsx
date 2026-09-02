import type { CSSProperties } from "react";

import { CardGrid } from "@/components/marketing/system/card-grid";
import { EventTypeCard } from "@/components/marketing/sections/home/event-type-card";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { EVENT_TYPES } from "@/lib/constants/events";
import { marketingImage } from "@/lib/constants/marketing-media";

import { LearnMoreLink } from "../shared/learn-more-link";

/**
 * QUIET-MEDIUM (the loud/quiet map): the four event-type cards over manifest
 * stills, each linking its /events/[slug] landing page (the internal-SEO job).
 *
 * ★ MEDIA-FORWARD, UNLIT, UNTILTED (Will, round 2). The card is the
 * photograph: full-bleed image, copy bottom-left over a dark scrim, the blog
 * post-card's anatomy adopted whole (event-type-card.tsx). The light this row
 * carried for two versions is gone by ruling -- four spills followed 765px
 * later by the Pro card's beam put two light events inside one viewport, and
 * scarcity is a distance. The tilt and its cursor glare went one version
 * earlier for the same family of reason: a device has to be site-wide to read
 * as identity, and neither complemented the light it sat beside.
 *
 * In the chapter arc this is a SUPPORTING section: visually interesting on its
 * own, quieter than the reel that opens the chapter above it, and a step down
 * toward pricing, the FAQ and the close.
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
          {EVENT_TYPES.map(({ slug, navLabel, teaser }, i) => (
            <EventTypeCard
              key={slug}
              href={`/events/${slug}`}
              src={marketingImage(EVENT_STILLS[slug] ?? "wedding-golden").src}
              title={navLabel}
              teaser={teaser}
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
