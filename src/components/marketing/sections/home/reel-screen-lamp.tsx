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
 * GEOMETRY, because the reverted rounds were all geometry. The box is 96px
 * larger than the player on every side and the reach is set so the mask
 * reaches transparent PAST the player's edge but BEFORE the box's edge: with
 * `--glw-reach` 115%, the ramp ends ~46px outside the player horizontally and
 * ~64px vertically, and ~30-50px inside the box. Light that dies inside its
 * own box has no drawn edge (law 4); light that reaches the box edge is a
 * rectangle. The box has NO overflow-hidden, and neither does the wrapper.
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
            "--glw-reach": "115%",
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
