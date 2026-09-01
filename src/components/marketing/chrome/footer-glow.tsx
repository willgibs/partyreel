"use client";

import { Glow, GlowFilter } from "@/components/shared/glow";

/**
 * THE SEAM GLOW: light spilling into the ink slab from the page above.
 *
 * The slab meets a bright paper page (and a darker cinema room) at a hard cut
 * that read as a wireframe edge. This was a hand-rolled copy of the
 * transitions-pro organic-shimmer mechanic; at round 0 (2026-09-01) it was
 * retired onto the SPILL engine, which IS that same mechanic generalised. The
 * site was shipping two engines painting one light, and this file was the
 * older of the two.
 *
 * Everything the hand-rolled version tuned is now the engine's DEFAULT, which
 * is not a coincidence: the engine was calibrated against this footer. 210px
 * layer, base and band both at 0.62, 16px blur, the same five-ellipse field in
 * the same deliberately-scrambled 4/5/1/2/3 hue order, the same 100deg 9-stop
 * comet at 280% width, the same turbulence seed. The ONE override is the
 * cadence: the engine's ruled register is 8s and this surface ships 11s, so it
 * is passed explicitly rather than silently re-timing ratified live chrome by
 * 27%. Which of the two the footer should keep is its own ruling, taken on an
 * A/B of the real footer with nothing else moving.
 *
 * Colour comes from --lamp-* (globals.css) via the engine's own defaults, so
 * no `colors` prop: the footer's light is the house light. That is also why
 * the seam now renders on the root 404, where marketing.css never loads. The
 * old version went flat there, and a lit seam matching every other page is the
 * better answer.
 *
 * The sweep is INFINITE, so it owns the loop-pause contract, which the Glow
 * primitive carries BY CONSTRUCTION (useAmbientPause -> data-paused, mirroring
 * offscreen / hidden-tab / reduced-motion). That matters more here than
 * anywhere on the site: the footer sits below the fold on every page, so the
 * default state is paused and the animation only ever runs while someone is
 * actually looking at it.
 */
export function FooterGlow() {
  return (
    <>
      <Glow shape="seam" vars={{ "--glw-dur": "11s" }} />
      {/* The seam itself: a hairline the light appears to be leaking through.
          A SIBLING of the glow, not a child, which is how the lab writes it and
          what keeps the 1px line crisp while the light behind it undulates. It
          reads --foreground, which this footer remaps to --gallery-foreground
          (see marketing-footer.tsx), so the computed colour is unchanged. */}
      <div data-glw-seamline aria-hidden />
      {/* The turbulence field. Rendered once, and only here: the footer is
          still the single consumer. The second one hoists this to the root
          layout (see GlowFilter). */}
      <GlowFilter />
    </>
  );
}
