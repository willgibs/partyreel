"use client";

import { type ReactNode, useRef } from "react";

import { Glow } from "@/components/shared/glow";
import { useSampledPaletteFromDom } from "@/lib/shared/sampled-palette";

/**
 * THE FILM STRIP'S UNDERLIGHT.
 *
 * Lamp: the strip of photographs itself. Direction: down, off its bottom edge.
 * Colour: sampled from the frames actually on the strip.
 *
 * ★ WHY THIS SURFACE AND NOT THE HERO (the lesson from the reverted round). A
 * lamp reads as light only when its SOURCE is visible above it, its GROUND is
 * dark AND QUIET, its falloff has room to complete, and it sits at a REAL
 * boundary. The hero failed three of those: the wall was the ground rather than
 * the source, the ground was 24 drifting photographs, and the edge was invented
 * mid-frame. This surface passes all four. The strip's bottom edge is a genuine
 * boundary (the sprocket rail stops, black begins), there is open dark beneath
 * it, and the three SCENE cards 48px below are positioned to CATCH the light,
 * which is the part the hero had nothing of.
 *
 * ★ THE LAMP IS A SIBLING OF <Conveyor>, NEVER A CHILD. Conveyor is
 * `overflow-hidden` (it is a marquee). A glow inside it would have its blurred
 * falloff clipped to a hard rectangle, which is exactly the grey box that got
 * the album straddle reverted. Check for clipping ancestors BEFORE placing a
 * lamp; this repo has several.
 *
 * A children slot, so film-strip.tsx stays a SERVER component and its 48
 * frames keep server-rendering.
 */
export function FilmStripLamp({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement | null>(null);
  // The strip carries 48 frames (the manifest doubled twice). Eight is plenty
  // for five well-separated hues and keeps the one-time canvas read small.
  const colors = useSampledPaletteFromDom(host, { limit: 8 });

  return (
    <div ref={host} className="relative -mx-4 mt-12 sm:-mx-6 lg:-mx-8">
      {children}
      {/* top-full puts the light's top edge exactly ON the strip's bottom edge.
          A seam's mask is opaque at 0%, so it is at full strength where it
          starts: that reads as light leaking from a seam when the seam is real,
          and as a band with no cause when it is not. */}
      {/* ★ FULL-BLEED, NOT STRIP-WIDTH. The five ellipses still have opacity at
          the field's left and right extremes, so a box that ends on screen ends
          the light on a hard vertical cut. The footer seam has never shown this
          only because it spans the viewport, putting those edges off-screen.
          w-screen + the centring translate breaks this box out of the Container
          so it does the same. Light spreading a little wider than its own lamp
          is what light does; a straight edge is not. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-full left-1/2 h-[220px] w-screen -translate-x-1/2"
      >
        <Glow
          shape="seam"
          drive="mask"
          colors={colors ?? undefined}
          vars={{ "--glw-dur": "var(--spill-cadence)", "--glw-strength": "0.5" }}
        />
      </div>
    </div>
  );
}
