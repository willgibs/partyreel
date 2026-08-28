"use client";

import { useAmbientPause } from "@/lib/shared/use-ambient-pause";

/**
 * THE SEAM GLOW: light spilling into the ink slab from the page above.
 *
 * The slab meets a bright paper page (and a darker cinema room) at a hard cut
 * that read as a wireframe edge. This is the transitions-pro organic-shimmer
 * mechanic pinned to that seam: a colour band warped by an SVG turbulence field
 * and swept by a travelling mask, faded downward so it reads as spill rather
 * than a stripe. The palette is the ratified confetti five, consumed via
 * color-mix in marketing.css, so nothing new was added to the accent set.
 *
 * The sweep is INFINITE, so it owns the loop-pause contract: useAmbientPause
 * mirrors offscreen/tab-hidden/reduced-motion onto data-paused. That matters
 * more here than anywhere else on the site, because the footer sits below the
 * fold on every page, so the default state is paused and the animation only
 * ever runs while someone is actually looking at it.
 *
 * Absent on the root 404 (no marketing.css there, so every .mkt-* selector
 * fails to match) — the seam simply renders flat, which is correct for a 404.
 */
export function FooterGlow() {
  const { ref, paused } = useAmbientPause<HTMLDivElement>();

  return (
    <>
      <div
        ref={ref}
        className="mkt-fglow"
        data-paused={paused ? "true" : "false"}
        aria-hidden
      >
        <div className="mkt-fglow-warp">
          {/* Base is always visible; the band sweeps a brighter comet over it. */}
          <div className="mkt-fglow-base" />
          <div className="mkt-fglow-band" />
        </div>
        <div className="mkt-fglow-ring" />
      </div>
      {/* The displacement field that waves the band. Rendered once, and only
          here: the footer is the single consumer. */}
      <svg
        width="0"
        height="0"
        className="absolute"
        aria-hidden
        focusable="false"
      >
        <filter
          id="mkt-fglow-warp"
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.009 0.015"
            numOctaves="2"
            seed="7"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="30"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
    </>
  );
}
