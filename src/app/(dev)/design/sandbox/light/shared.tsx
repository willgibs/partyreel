"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import {
  GroundBox,
  useMountOnApproach,
  type Ground,
  type Mode,
} from "@/components/lab";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

/**
 * THE LIGHT BOARD'S ATOMS (the review wave, 2026-09-14; cut to what the catalog
 * uses at the revamp, 2026-09-16).
 *
 * Two rules decide everything in this file, and both come from what the board
 * is judging:
 *
 * 1. A LABEL IS NEVER INSIDE THE JUDGED AREA. Every cue on this board is an
 *    edge treatment, so a caption box drawn around a specimen would be a fifth
 *    cue competing with the four. Captions sit under the specimen, on the bare
 *    ground, in the ground's own muted ink.
 * 2. A SPECIMEN SITS ON THE GROUND, NOT IN A FRAME. Same reason.
 *
 * ★ WHAT LEFT AT THE REVAMP. `Takeaway`, `Proposal`, `KnobNote` and `LampCard`
 * were the round-four board's voice: a paragraph under every specimen saying
 * what to carry away from it. The catalog's card says the same thing in a line
 * and four facts, and the reading budget counts the difference (round five was
 * 10,164 words outside its folds). A specimen that needs a paragraph to be read
 * is the specimen that should change.
 */

/** A real photograph, because two grey rectangles cannot argue about whether
 *  two photographs need separating. Sized in CSS by the caller. */
export function Photo({
  id,
  className,
  style,
  cue,
  sizes = "240px",
}: {
  id: string;
  className?: string;
  style?: React.CSSProperties;
  /** board.css's depth cue, applied to the photograph's own box. */
  cue?: string;
  sizes?: string;
}) {
  const img = marketingImage(id);
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ borderRadius: "var(--radius-tile)", ...style }}
      data-lgt-cue={cue}
    >
      <Image src={img.src} alt="" fill sizes={sizes} className="object-cover" />
    </div>
  );
}

/**
 * A CROP OPENS ON THE MIDDLE OF ITS CANVAS, NOT ON ITS LEFT GUTTER.
 *
 * ★ THE FIRST BUILD OF THIS ROUND SHOWED 440 PIXELS OF EMPTY MARGIN. A
 * marketing chapter is a centred column inside a 1440 canvas, so the left edge
 * of that canvas is gutter: the aurora card rendered the real closer, correctly
 * and at true size, and what a reviewer saw was the blank strip beside it. A
 * scroll offset is the honest fix, because it moves the WINDOW rather than the
 * specimen: every pixel is still the pixel the page ships, and the rest of the
 * section is one sideways scroll away in either direction.
 *
 * ★ IT IS A HOOK BECAUSE THE COMPILER SAYS SO. `react-hooks/immutability`
 * refuses `ref.current.scrollLeft = n` written inline against a ref another
 * hook returned ("consider moving the modification into the hook where the
 * value is constructed"), which is a fair rule and this is its answer: one
 * hook, three callers, one place to read it.
 */
export function useCentredCrop(
  ref: React.RefObject<HTMLDivElement | null>,
  ready: boolean,
  width: number,
) {
  const done = useRef(false);
  useEffect(() => {
    const box = ref.current;
    if (!box || !ready || done.current) return;
    // One pass, after the canvas exists: re-centring on every resize would
    // fight a reviewer who has scrolled the crop himself.
    box.scrollLeft = Math.max(0, (width - box.clientWidth) / 2);
    done.current = true;
  }, [ref, ready, width]);
}

/**
 * A WINDOW ONTO A REAL SECTION, AT 1:1.
 *
 * ★ A CROP IS NOT A SCALE. The section is laid out at the canvas width and this
 * box shows as much of it as there is room for, with the rest one sideways
 * scroll away. Every pixel inside it is the pixel the page ships, which is why
 * a stage that zoom-fits was ruled out on a board judging light.
 *
 * ★ THE SECTION SETS ITS OWN HEIGHT (round eight). The crop used to be handed a
 * number (510 for the closer), and the closer is 469 tall today: the lower band
 * of the field sat 41 pixels above the crop's foot, over nothing. A field lives
 * at the SECTION's edges, and the section's height belongs to production (the
 * type scale is being rewired this very round), so `reserve` only holds the
 * room until the section mounts and the box then ends where the section does.
 *
 * ★ AND IT MOUNTS ON APPROACH. A real marketing section is not free; the
 * observer runs ahead of the reader, which is one flick, and a crop that is
 * not displayed (the half of a step board.css hides) never approaches at all.
 *
 * ★ data-inview="true" IS LOAD-BEARING, NOT DECORATION. marketing.css keys the
 * chapter entrance grammar off `[data-inview="true"] [data-mkt-reveal]`, and a
 * section's own Reveal cannot reach the observer ratio it wants inside a window
 * onto it: the copy would sit at opacity 0 for ever and the specimen would read
 * as an empty box. Declaring the settled state on the crop is the type-scale
 * board's own remedy, and it is the right one here too, because this board
 * judges LIGHT and not an entrance.
 */
export function SectionCrop({
  ground,
  mode,
  reserve,
  fill = false,
  children,
}: {
  ground: Ground;
  mode: Mode;
  /** The room held before the section mounts, so the page does not jump. */
  reserve: number;
  /**
   * Take the container's width instead of the canvas's. A step's tile IS a 1440
   * canvas, less its own two pixels of border: a 1440 box inside it overflows
   * by exactly that, and the crop grew a scrollbar nobody could use (a tile is
   * inert) across the foot of every picture.
   */
  fill?: boolean;
  children: React.ReactNode;
}) {
  const [box, near] = useMountOnApproach();
  const width = mode === "desktop" ? 1440 : 375;
  useCentredCrop(box, near && !fill, width);
  return (
    <div ref={box} className={fill ? "overflow-hidden" : "overflow-x-auto"}>
      <GroundBox
        ground={ground}
        className="relative overflow-hidden rounded-lg"
        style={{
          width: fill ? "100%" : width,
          minHeight: near ? undefined : reserve,
        }}
      >
        <div data-inview="true" className="w-full">
          {near ? children : null}
        </div>
      </GroundBox>
    </div>
  );
}
