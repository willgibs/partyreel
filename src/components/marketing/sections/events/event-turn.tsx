import Image from "next/image";

import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

/**
 * THE TURN: the photograph a type page crosses on its way from cinema to paper.
 *
 * Will ruled `the-arc=chapter` (2026-09-19, verbatim): "This decision is more an
 * answer to 'all dark, paper chapter, or paper chapter with photo transition'
 * with my answer being 'paper chapter with photo transition'." It is his own
 * earlier ruling made concrete (2026-09-18): "full image backgrounds sections
 * should commonly serve as chapter transitions, so we go straight from dark to
 * light or vice versa less often."
 *
 * So the page runs dark through its hero and its statement, crosses HERE, and
 * spends its one light chapter on the planning document alone, which is the
 * only thing on these pages a reader studies rather than skims.
 *
 * ★ ONE PHOTOGRAPH, NOT AN ENGINE. `PhotoSection` is the ruled switching band
 * and it is the wrong tool here: a transition is a cut, and a cut that offers
 * five frames to walk through asks the reader to stop at the exact moment the
 * page is carrying them somewhere. One frame, one line, and the ground has
 * changed underneath by the time they look up.
 *
 * ★ THE LINE GETS ITS OWN GROUND, and it is a cast rather than a plate. White
 * type over the middle of a bright photograph is the legibility failure the
 * plate ruling exists for; a full plate here would turn the band into a card
 * and the crossing into a section. A centred radial does the job and leaves the
 * photograph's edges intact, which is what keeps this a band.
 *
 * ★ AND IT IS PAINTED, NEVER REVEALED. The band is the seam between two
 * chapters: a line that fades in after the ground has already changed reads as
 * a repaint, not an arrival.
 */
export function EventTurn({
  stillId,
  line,
  className,
}: {
  /** The type's own turn photograph (`events.ts`, `media.turn`). */
  stillId: string;
  /** One line, on the `section` step. */
  line: string;
  className?: string;
}) {
  const still = marketingImage(stillId);
  return (
    <section
      className={cn(
        // Tall enough to read as a room and short enough to stay a crossing:
        // at a full section's height it becomes a beat of its own and the page
        // gains a seventh chapter nobody asked for.
        "relative isolate h-[320px] overflow-hidden sm:h-[420px]",
        className,
      )}
    >
      <Image
        src={still.src}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(72% 62% at 50% 50%, oklch(0 0 0 / 0.66) 0%, oklch(0 0 0 / 0.42) 45%, transparent 82%)",
        }}
      />
      {/* The hairlines are the cut itself (the chapter doctrine: a cut is a
          hairline plus a plane change, never a gradient). The band carries both
          because it stands BETWEEN the two grounds rather than inside either. */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-white/15" />
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-white/15"
      />
      <div className="relative flex h-full items-center justify-center px-6">
        <p className="max-w-2xl text-center font-heading text-section text-balance text-white">
          {line}
        </p>
      </div>
    </section>
  );
}
