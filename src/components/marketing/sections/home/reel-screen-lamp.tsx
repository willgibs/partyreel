"use client";

import { type ReactNode, useRef } from "react";

import { Glow } from "@/components/shared/glow";
import { useSampledPaletteFromDom } from "@/lib/shared/sampled-palette";

/**
 * THE SCREEN'S LIGHT. The reel player is a screen, and a screen in a dark room
 * is the most literal emitting object on the whole page: law 1 (name the lamp)
 * is satisfied by the object itself. The light is thrown from BEHIND it and
 * only the part that escapes past the player's edges is visible, because the
 * player is opaque -- which is exactly what light behind a screen looks like.
 *
 * Colour is sampled from the poster the player shows (law 3), read off the
 * live <img> next/image renders, so it costs no bytes.
 *
 * GEOMETRY, because the reverted rounds were all geometry, and the first cut
 * of this file got it wrong in the same way. The box is 96px larger than the
 * player on every side, and the mask must reach transparent PAST the player's
 * edge but BEFORE the box's edge -- light that dies inside its own box has no
 * drawn edge (law 4); light that reaches the box edge is a rectangle.
 *
 * ★ --glw-reach IS A FRACTION OF THE BOX'S FULL DIMENSION, NOT ITS HALF. The
 * mask is `radial-gradient(ellipse R R at 50% 50%, ... transparent 78%)`, and
 * a percentage radius in a radial gradient is measured against the gradient
 * box's WIDTH (rx) and HEIGHT (ry). So the ramp ends at 0.78 x reach x width
 * from the centre. At 115% that is ~0.9 of the full width -- nearly twice the
 * half-width -- so the whole box was lit and rendered as a faint rectangle
 * with vertical edges, visible on the deployed preview even in the paused
 * state. At 58% the ramp ends ~50px inside the box horizontally and ~35px
 * vertically, and ~85-100px outside the player: a glow with room to die.
 * The lab's throw preset uses 95% because its origin sits ON an edge, where
 * a large reach fades across the whole box from one side; a CENTRED origin
 * needs about half that. The box has NO overflow-hidden, nor does the wrapper.
 *
 * ★ WHY THIS SURFACE MAY BE LIT AT ALL. The reel sat one viewport from the
 * event-card lamps and was ruled out on scarcity. Those lamps are gone (the
 * cards went media-forward), so the chapter's opening section is free to be
 * the chapter's light -- and the next lamp down the page is the footer,
 * several viewports away.
 */
export function ReelScreenLamp({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement | null>(null);
  const colors = useSampledPaletteFromDom(host, { limit: 1 });

  return (
    <div ref={host} className="relative isolate">
      <div aria-hidden className="pointer-events-none absolute -inset-24 -z-10">
        <Glow
          shape="throw"
          drive="mask"
          colors={colors ?? undefined}
          vars={{
            "--glw-from-x": "50%",
            "--glw-from-y": "50%",
            "--glw-reach": "58%",
            "--glw-base": "0.55",
            "--glw-strength": "0.45",
            "--glw-blur": "32px",
            "--glw-dur": "11s",
          }}
        />
      </div>
      {children}
    </div>
  );
}
