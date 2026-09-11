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
 * ★ THE SIDES END IN A POOL, NOT A FADE (Will's ruling on treatment A,
 * 2026-09-01: "the lamp extends its width beyond the width of the real
 * preview video, and the clipping feels very unnatural"). The seam's five
 * ellipses sit at 14/38/60/80/96% of the field, so at ANY box width the outer
 * two still carry ~40-50% opacity at the box's edges. The first cut put a
 * linear side mask on a box 64px wider than the screen (an 18% ramp), which
 * is therefore a WEDGE: 40% lit at the screen's own edge and ending on a
 * straight line outside it. So the box is exactly the screen's width and the
 * wrapper's mask is an ellipse anchored at the screen's bottom centre, rx
 * 46%: fullest under the middle, gone 31px INSIDE each edge (14px at 375),
 * and narrowing as it falls, the projector on the floor. Smoothstep stops,
 * because a two-stop ramp kinks where it ends and the eye reads a kink as a
 * ring (the halo's note in globals.css). A linear side mask is a wedge here
 * at any width; do not put one back. The mask stays on the WRAPPER, never on
 * the lamp (the engine owns the lamp's masks). No overflow-hidden anywhere.
 * The strip's answer to the same problem is full-bleed (film-strip-glow.tsx);
 * a screen's light must not be wider than the screen, so it pools instead.
 */
export function ReelScreenLamp({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement | null>(null);
  const colors = useSampledPaletteFromDom(host, { limit: 1 });

  return (
    <div ref={host} className="relative isolate">
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-full -z-10 h-[240px] [mask-image:radial-gradient(ellipse_46%_100%_at_50%_0%,#000_0%,rgba(0,0,0,0.97)_10%,rgba(0,0,0,0.9)_20%,rgba(0,0,0,0.78)_30%,rgba(0,0,0,0.65)_40%,rgba(0,0,0,0.5)_50%,rgba(0,0,0,0.35)_60%,rgba(0,0,0,0.22)_70%,rgba(0,0,0,0.1)_80%,rgba(0,0,0,0.03)_90%,transparent_100%)]"
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
