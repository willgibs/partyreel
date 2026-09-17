"use client";

import { type ReactNode, useRef } from "react";

import { Glow } from "@/components/shared/glow";
import { useSampledPaletteFromDom } from "@/lib/shared/sampled-palette";
import { cn } from "@/lib/utils";

/**
 * THE SCREEN LAMP: a lit object throws its own light down off its bottom edge.
 *
 * This is the ONE underlight mechanic the site uses (design-system.md, "Light":
 * the film strip's lamp, the reel treatment's lamp, and now the feature heroes
 * all throw DOWN, because neither `throw` nor `halo` can backlight an opaque
 * object, and a screen in a dark room lights the floor, not the air around
 * it). It was three near-identical files before this one; a fourth copy is a
 * config, not a component.
 *
 * Lamp (law 1): the children, which must contain the photographs being lit.
 * Direction (law 2): down, from the bottom edge of the wrapped object.
 * Colour (law 3): SAMPLED from the `<img>` elements inside the wrapper via
 * useSampledPaletteFromDom, so the light is the colour of what the visitor is
 * looking at; the house five stand in until the sample resolves (and on any
 * surface with no photographs, which is law 3's no-media branch).
 * Falloff (law 4): the engine's seam shape (base + band, always together).
 *
 * ★ THE LAMP IS A SIBLING OF THE OBJECT, NEVER INSIDE IT. The children are
 * usually a BrowserFrame, a Conveyor or a player, and every one of those clips
 * (rounded + overflow-hidden). A glow inside a clipping ancestor lands as a
 * hard-edged grey rectangle, which is what got the album straddle's light
 * reverted. The seam hangs BELOW the wrapper, in the wrapper's own box.
 *
 * ★ FULL-BLEED, NOT OBJECT-WIDTH. A seam's mask fades top-to-bottom only, so a
 * field that ends on screen ends the light on a hard vertical cut. `w-screen`
 * plus the centring translate breaks the field out of the Container so those
 * edges land off-screen, exactly as the film strip's lamp does. Which means
 * the caller's SECTION must not be `overflow-hidden`: use `overflow-x-clip`
 * (clip on one axis leaves the other visible; `hidden` does not) so the field
 * can hang below the section and spill over the viewport's sides.
 *
 * ★ Placement rules the home page paid for: the lamp goes AFTER its object in
 * DOM order (children first), and content that must paint over the light
 * carries its own `relative` (the engine isolates itself; a static div does
 * not).
 */
export function ScreenLamp({
  children,
  className,
  height = 220,
  strength = 0.5,
  limit = 8,
  minWidth,
}: {
  children: ReactNode;
  className?: string;
  /** The seam's height below the object, in px (the engine's --glw-h). */
  height?: number;
  /** The travelling band's strength; the base rests at the engine default. */
  strength?: number;
  /** How many of the wrapper's images to sample (the eager run is plenty). */
  limit?: number;
  /** Skip the canvas read below this viewport width. */
  minWidth?: number;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  const colors = useSampledPaletteFromDom(host, { limit, minWidth });

  return (
    <div ref={host} className={cn("relative", className)}>
      {children}
      {/* top-full puts the seam's top edge exactly ON the object's bottom
          edge: a seam is opaque at 0%, so the light is at full strength where
          the object ends, which reads as light leaking from a real edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-full left-1/2 w-screen -translate-x-1/2"
        style={{ height }}
      >
        <Glow
          shape="seam"
          drive="mask"
          colors={colors ?? undefined}
          vars={{
            "--glw-h": `${height}px`,
            "--glw-strength": String(strength),
            // The one lamp clock, read from its token: Will ruled 8s on the
            // whole page (2026-09-17) and every production lamp follows it from
            // here. Never a literal, or this lamp drifts out of the page's
            // register the next time the ruling moves.
            "--glw-dur": "var(--spill-cadence)",
          }}
        />
      </div>
    </div>
  );
}
