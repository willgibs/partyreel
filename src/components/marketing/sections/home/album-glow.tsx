"use client";

import { type ReactNode, useRef } from "react";

import { Glow } from "@/components/shared/glow";
import { useSampledPaletteFromDom } from "@/lib/shared/sampled-palette";

/**
 * THE ALBUM STRADDLE (lab moment 05, "ship, pinned to the card").
 *
 * Lamp: the album card, a lit screen full of photographs, caught crossing the
 * chapter cut. Direction: up and outward from the card's own box. Colour:
 * sampled from the eight tiles the card is showing.
 *
 * Law 1 is why this is the ONLY chapter cut on the site that gets light: it is
 * the one seam an object physically crosses, so it is the one seam with a
 * nameable lamp. Pinned to the card it is a lit object; pinned to the chapter
 * it becomes the every-seam-on-every-page failure the doctrine exists to stop.
 *
 * ★ THE LAB SPECIMEN IS UPSIDE DOWN RELATIVE TO THIS SURFACE. StraddleStage
 * puts paper ABOVE and dark BELOW and biases its throw downward (-top-6
 * -bottom-16). Production is the other way round: the home arc runs cinema ->
 * paper, and `lg:-mt-40` hangs the card UP out of the paper into the dark.
 * Copying the lab's insets would throw dark-register light DOWN onto near-white
 * paper, which is precisely the "dirty rather than lit" failure that
 * SPILL_REGISTER.paper was invented to fix. So the bias is mirrored. The
 * specimen's own caption -- "the card casts onto the dark field it overhangs"
 * -- is preserved exactly; only the geometry flips.
 *
 * ★ AND THE OVERHANG IS 63px, NOT THE 160px THE BOARD CLAIMS. Measured live,
 * and derivable: -mt-40 is 10rem, SectionShell contributes 6rem of pt at lg,
 * and PaperChapter's border-y another 1px, so 10 - 6 = 4rem, less the border.
 * The board read the margin alone. That is the whole vertical budget this lamp
 * has, which is why it spreads sideways along the cut rather than reaching up.
 *
 * ★ THE LIGHT STOPS DEAD AT THE CUT, and that is doctrine rather than
 * containment. PaperChapter's rule is that chapter cuts are HARD -- "hairline +
 * plane change, no gradients" -- so light bleeding across one would soften the
 * exact edge the chapter system is built on. Clipping there also means one lamp
 * needs one register instead of two.
 *
 * A children slot rather than a wrapper import, so album.tsx stays a SERVER
 * component and its eight <Image> tiles keep server-rendering.
 */
export function AlbumStraddleLamp({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement | null>(null);
  // lg-only, and minWidth skips the canvas work entirely below it: under lg the
  // split stacks, nothing overhangs, and law 1 says no overhang means no lamp.
  const colors = useSampledPaletteFromDom(host, { minWidth: 1024 });

  return (
    <div ref={host} className="relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -z-10 hidden overflow-hidden lg:block"
        style={{
          // From 4rem above the card's top down to the cut. `bottom` is
          // measured from the card's own bottom edge, so `100% - 4rem + 1px`
          // lands the clip on the chapter boundary no matter how tall the card
          // grows -- the two 4rem terms are the same number for the same
          // reason (the margin/padding difference above), and the 1px is
          // PaperChapter's border.
          top: "-4rem",
          bottom: "calc(100% - 4rem + 1px)",
        }}
      >
        <Glow
          shape="throw"
          drive="mask"
          colors={colors ?? undefined}
          vars={{
            "--glw-from-x": "50%",
            // Low in the box, so the falloff climbs INTO the dark rather than
            // pooling on the card that is emitting it.
            "--glw-from-y": "62%",
            "--glw-reach": "120%",
            "--glw-strength": "0.5",
            "--glw-base": "0.5",
            "--glw-blur": "26px",
            "--glw-dur": "11s",
          }}
        />
      </div>
      {children}
    </div>
  );
}
