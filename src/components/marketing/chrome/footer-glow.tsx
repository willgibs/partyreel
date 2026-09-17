"use client";

import { Glow } from "@/components/shared/glow";

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
 * comet at 280% width, the same turbulence seed.
 *
 * The cadence is still passed explicitly, and now for a different reason. It
 * began as an override (the engine ruled 8s, this surface shipped 11s, and
 * retiring the footer onto the engine would have re-timed ratified live chrome
 * by 27%). Will judged the whole home page at each and ruled 8s on 2026-09-17,
 * so --spill-cadence and the engine default now agree; what the var still buys
 * is that ONE ruling re-times every lamp at once, and that the Aurora's field
 * can run a multiple of this clock rather than a number written beside it.
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
      <Glow shape="seam" vars={{ "--glw-dur": "var(--spill-cadence)" }} />
      {/* The seam itself: a hairline the light appears to be leaking through.
          A SIBLING of the glow, not a child, which is how the lab writes it and
          what keeps the 1px line crisp while the light behind it undulates. It
          reads --foreground, which this footer remaps to --gallery-foreground
          (see marketing-footer.tsx), so the computed colour is unchanged. */}
      <div data-glw-seamline aria-hidden />
    </>
  );
}
