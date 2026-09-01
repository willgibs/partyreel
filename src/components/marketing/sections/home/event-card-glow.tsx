"use client";

import { type CSSProperties, type ReactNode, useRef } from "react";

import { Glow } from "@/components/shared/glow";
import { useSampledPaletteFromDom } from "@/lib/shared/sampled-palette";

/**
 * THE EVENT CARD'S UNDERLIGHT. One lamp per card, and the point is that they
 * DIFFER.
 *
 * Lamp: the card's own photograph. Direction: down and out from under it.
 * Colour: sampled from that one photograph, so weddings pool gold, parties
 * pool the balloons' multicolour, conferences blue-white, trips stage-orange.
 *
 * ★ THE FOUR-COLOUR SPREAD IS THE ARGUMENT, not decoration. The section's own
 * heading is "made for every kind of get-together"; four lamps in a row, each
 * the colour of its own event, is that sentence in light. It is also the first
 * place on the site where law 3 is VISIBLE rather than merely true: one sampled
 * lamp is indistinguishable from a fixed palette, four side by side cannot be.
 *
 * ★ THE LAMP IS A SIBLING OF <TiltCard>, NEVER A CHILD. `.mkt-tilt-card` is
 * `overflow: hidden` AND transformed (marketing.css). Inside it, the blurred
 * falloff would be clipped to a hard rectangle AND the light would tilt with
 * the card. The clipped-falloff version of this mistake is what got the album
 * straddle reverted, so it is worth stating twice: check every ancestor for
 * overflow-hidden before placing a lamp.
 *
 * ★ `isolate` on the host is load-bearing. Without it the -z-10 layer escapes
 * the cell's stacking context and falls behind the page ground instead of
 * sitting between the ground and the card.
 *
 * The card body is opaque (bg-card + border), so the lamp is hidden behind it
 * and only what escapes below and to the sides is visible. That is what makes
 * this an UNDERLIGHT rather than a wash: the object occludes its own source.
 *
 * A children slot, so events-teaser.tsx stays a SERVER component.
 */
export function EventCardLamp({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  // One image per card, so one card's light can never be another's.
  const colors = useSampledPaletteFromDom(host, { limit: 1 });

  return (
    <div
      ref={host}
      data-mkt-reveal
      className="relative isolate h-full"
      style={style}
    >
      {/* ★ A SEAM AT THE CARD'S BOTTOM EDGE, NOT A THROW FROM ITS MIDDLE
          (Will, round 1b). The throw put a distinct point source emanating from
          each card's centre-bottom, which read as four little spotlights and
          fought the ratified hero underlight -- a wide, even, quiet band. A
          seam is that band: opaque at its own top edge, fading straight down.
          `top-full` puts that edge exactly ON the card's bottom edge, which is
          the same real-boundary condition the film strip and the footer use.
          One mechanic for every underlight on the site. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-full -z-10 h-[130px]"
      >
        <Glow
          shape="seam"
          drive="mask"
          colors={colors ?? undefined}
          vars={{
            "--glw-dur": "11s",
            "--glw-base": "0.45",
            "--glw-strength": "0.35",
          }}
        />
      </div>
      {children}
    </div>
  );
}
