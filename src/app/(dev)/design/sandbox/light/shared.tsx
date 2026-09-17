"use client";

import Image from "next/image";

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
