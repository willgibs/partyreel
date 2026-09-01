"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useRef } from "react";

import { Glow } from "@/components/shared/glow";
import { useSampledPaletteFromDom } from "@/lib/shared/sampled-palette";

/**
 * AN EVENT CARD, LIT FROM ITS OWN PHOTOGRAPH.
 *
 * The light is the BACKGROUND OF THE CARD'S LOWER BLOCK, bleeding down out of
 * the image directly above it and dying inside the card. It is not a pool on
 * the page under the card.
 *
 * ★ THAT DISTINCTION IS THE WHOLE CORRECTION (Will, round 1b). Two earlier
 * versions put the light OUTSIDE the card -- first a throw from its
 * centre-bottom, then a seam hanging below its bottom edge -- and the second
 * read as a detached coloured slab floating beneath a card it had no visible
 * connection to. Contained, the same light instead reads as the photograph
 * continuing into the card's own body, which is what "the media supplies the
 * colour" actually looks like on a card.
 *
 * ★ SO THE CARD'S overflow-hidden IS CORRECT HERE, and it is the one place in
 * this system where a clipping ancestor is not the bug. Everywhere else a clip
 * cuts a falloff into a straight edge (the reason the album straddle was
 * reverted). Here the clip IS the card, the falloff that matters runs
 * vertically and completes well before the card's bottom, and the horizontal
 * edges coincide with the card's own edges so they read as the card rather than
 * as a drawn edge of light. The test that guards this checks the wrapper the
 * lamp is DECLARED in; this one is a plain `relative isolate` block.
 *
 * ★ NO TILT, NO GLARE (Will). The card-tilt recipe used to run here. A 3D hover
 * and a cursor-tracking glare are each fine alone, but either would have to
 * become a site-wide pattern to read as identity, and the glare is a second
 * light model on the same card, chasing the pointer, inches from a lamp arguing
 * that light comes from the photograph. The press affordance stays.
 */
export function EventCard({
  href,
  src,
  title,
  teaser,
  style,
}: {
  href: string;
  src: string;
  title: string;
  teaser: string;
  style?: CSSProperties;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  // One image per card, so one card's light can never be another's. The four
  // side by side landing on four different hues is the section's own argument
  // ("every kind of get-together") and the only place on the site where law 3
  // is visible rather than merely true.
  const colors = useSampledPaletteFromDom(host, { limit: 1 });

  return (
    <div ref={host} data-mkt-reveal className="h-full" style={style}>
      {/* The house press idiom (R4): explicit transition properties, never `all`. */}
      <Link
        href={href}
        className="flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-transform duration-150 ease-emphasis active:scale-[0.99]"
      >
        <div className="relative aspect-[4/3]">
          <Image
            src={src}
            alt=""
            fill
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="relative isolate flex flex-1 flex-col gap-1 p-5">
          {/* A seam anchored at this block's top edge, which IS the photograph's
              bottom edge -- the same real-boundary condition the film strip and
              the footer use. --glw-h is deliberately shorter than the block so
              the light is gone before the card's lower rim. */}
          <Glow
            shape="seam"
            drive="mask"
            colors={colors ?? undefined}
            vars={{
              "--glw-dur": "11s",
              "--glw-h": "120px",
              "--glw-base": "0.5",
              "--glw-strength": "0.4",
            }}
          />
          <h3 className="relative font-heading text-lg sm:text-xl">{title}</h3>
          <p className="relative text-sm text-muted-foreground">{teaser}</p>
        </div>
      </Link>
    </div>
  );
}
