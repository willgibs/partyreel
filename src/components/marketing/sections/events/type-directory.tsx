import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { TiltCard } from "@/components/marketing/system/tilt-card";
import { EVENT_TYPES } from "@/lib/constants/events";

import { EventCard } from "./event-type-card";

/**
 * The /events hub's directory: four cards, one per landing page, two up at 1440
 * and one up at 375.
 *
 * ★ THE GRID IS RULED AND THE CARD WAS NOT (Will, 2026-09-19,
 * `directory=tilt-two-up`): "I would like to keep the 2x2 grid on desktop, as
 * it introduces each event card more fully and not all at once. However, these
 * event cards themselves could use a total redesign." So the shape here did not
 * move and everything inside it did: the 16:10 window, the chip row and the two
 * artifact tiles are gone, and each card is its type's own photograph at
 * directory size (`event-type-card.tsx`, the one anatomy the home row also wears).
 *
 * ★ THE TILT STAYS, AND ONLY HERE. It is what makes the hub's four read as
 * introduced one at a time rather than dealt out, which is the sentence he kept
 * the grid for; the home row is a supporting beat and takes none.
 */
export function TypeDirectory() {
  return (
    // The grid's own reveal continues the section header's stagger slots
    // (SectionShell spends 0 and 1 on heading + subhead), so header and cards
    // read as one arrival. Four cards at the 90ms step = 270ms of spread, under
    // the 300ms stagger ceiling.
    <Reveal className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
      {EVENT_TYPES.map((type, i) => (
        <TiltCard key={type.slug} className="rounded-2xl">
          <EventCard
            type={type}
            size="directory"
            style={{ "--i": i + 2 } as CSSProperties}
            // The top row peeks above the fold on desktop, where Next's LCP
            // heuristic picks a card still as the LCP element; two eager stills
            // keep LCP off a lazy load without touching the mobile budget.
            priority={i < 2}
            className="h-full"
          />
        </TiltCard>
      ))}
    </Reveal>
  );
}
