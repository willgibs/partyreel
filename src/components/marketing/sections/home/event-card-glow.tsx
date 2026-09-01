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
      {/* ★ THE BOX IS SIZED SO THE FALLOFF DIES INSIDE IT, not so that it frames
          the region I want lit. Those are different numbers, and confusing them
          is what put a visible rectangle under the first version: the mask is
          still partly opaque where the box stops, so the box edge becomes a
          drawn edge. With reach 0.55 the ramp reaches transparent at about 43%
          of the box's half-dimension, so 48px of side inset and 160px below the
          card leave clear margin on every side. NO overflow-hidden here, ever. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-12 top-1/2 -bottom-40 -z-10"
      >
        <Glow
          shape="throw"
          drive="mask"
          colors={colors ?? undefined}
          vars={{
            "--glw-from-x": "50%",
            "--glw-from-y": "22%",
            "--glw-reach": "55%",
            "--glw-dur": "11s",
          }}
        />
      </div>
      {children}
    </div>
  );
}
