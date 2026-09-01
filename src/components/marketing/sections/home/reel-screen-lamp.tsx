"use client";

import { type ReactNode, useRef } from "react";

import { Glow } from "@/components/shared/glow";
import { useSampledPaletteFromDom } from "@/lib/shared/sampled-palette";

/**
 * THE SCREEN'S LIGHT, THROWN DOWN ONTO THE FLOOR. The reel player is a screen
 * in a dark room, the most literal emitting object on the page, so law 1 is
 * answered by the object itself. Its light falls DOWN out of its bottom edge
 * onto the dark beneath it, where the style strip and the pointer sit in the
 * pool: the projector-on-the-floor image, and the same mechanic the film strip
 * and the footer use -- a seam anchored on a real edge.
 *
 * Colour is sampled from the poster the player shows (law 3), read off the
 * live <img> next/image renders, so it costs no bytes.
 *
 * ★ WHY NOT A GLOW ALL THE WAY AROUND, since that was the first cut. A `throw`
 * is opaque at its origin and fades outward, so by the time its light clears
 * an OPAQUE object's edge the mask is already down to ~20% and the ring is
 * nearly invisible -- measured on the preview, and derivable: the ramp's
 * stops are fractions of `--glw-reach`, which is a fraction of the box's FULL
 * dimension, so a centred throw in a box the object mostly fills has spent
 * its ramp before the object ends. The `halo` is the inverse ramp, but it is
 * designed to be clipped INSIDE the object it backlights (a pill with text),
 * which an opaque screen makes invisible. Neither shape is a backlight for an
 * opaque object; a seam under it is, and it is already ratified twice.
 *
 * The side fade on the box is the film strip's lesson: a seam's five ellipses
 * still carry opacity at the field's left and right extremes, so a box that
 * ends on screen ends the light on a vertical cut. The strip solved it by
 * going full-bleed; a screen's light should stay the screen's width, so this
 * box fades its own sides instead. The mask is on the WRAPPER, never on the
 * lamp (the engine owns the lamp's masks). No overflow-hidden anywhere.
 */
export function ReelScreenLamp({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement | null>(null);
  const colors = useSampledPaletteFromDom(host, { limit: 1 });

  return (
    <div ref={host} className="relative isolate">
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-16 top-full -z-10 h-[240px] [mask-image:linear-gradient(to_right,transparent,#000_18%,#000_82%,transparent)]"
      >
        <Glow
          shape="seam"
          drive="mask"
          colors={colors ?? undefined}
          vars={{
            "--glw-dur": "11s",
            "--glw-h": "220px",
            "--glw-strength": "0.5",
          }}
        />
      </div>
    </div>
  );
}
