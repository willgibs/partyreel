import Image from "next/image";
import type { CSSProperties } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

/**
 * THE CONTACT SHEET - the careers page's signature composition.
 *
 * A photographic proof sheet: real event frames butted tight, numbered in the
 * mono register, with a few circled the way an editor marks a select. It is
 * this page's own composition and nothing else's, which the media doctrine
 * requires (sections/events/event-hero-media.tsx: every page keeps a DISTINCT
 * composition, and "a hero photo is a promise"). Home owns the drifting wall,
 * pricing the stacked photos, the footer the fanning pile.
 *
 * ! WHY A PROOF SHEET, on this page specifically: marking the selects IS our
 *   product's core act. The hero is not decoration that happens to be photos,
 *   it is the thing the company does, performed once, above the fold.
 *
 * ! ACHROMATIC MARKS. The obvious grease pencil is red and the identity is
 *   zero-chroma, so the marks read as white pencil on the sheet. Do not
 *   "improve" this with a brand hue; there isn't one.
 *
 * Decorative by contract: aria-hidden at the root, so the numbers and marks
 * carry no meaning a screen reader needs.
 */

/** The roll. Mixed subjects on purpose: careers promises the RANGE of events
 *  we serve, not one type (the events pages are where a single promise
 *  matters). Order is composed, not alphabetical: strong frames lead. */
export const SHEET_FRAMES = [
  "wedding-golden",
  "party-balloons",
  "festival-crowd",
  "wedding-toast",
  "reception-table",
  "concert-confetti",
  "wedding-petals",
  "party-dj",
  "wedding-arch",
  "festival-lights",
  "reception-hall",
  "wedding-rings",
] as const;

/** Frames that paint with the page. The rest lazy-load: a photographic hero is
 *  far heavier than DOM art and this is the LCP surface. */
const EAGER_FRAMES = 6;

type ContactSheetProps = {
  /** Frame indices circled as selects. Empty = an unmarked roll. */
  selects?: number[];
  /**
   * "hero" = the full sheet behind the headline (dark room, ken-burns breath).
   * "roll" = the argument's opening beat: the same sheet with everything BUT
   * the selects dimmed to almost nothing, which is the whole point being made.
   */
  variant?: "hero" | "roll";
  columns?: string;
  /**
   * How many times the roll repeats. A real proof sheet is MANY SMALL frames,
   * and density is also what keeps the sheet from competing with the headline:
   * six large photographs behind two words is a fight, twenty-four small ones
   * is a texture.
   */
  repeat?: number;
  className?: string;
};

export function ContactSheet({
  selects = [],
  variant = "hero",
  columns = "grid-cols-4 sm:grid-cols-6",
  repeat = 1,
  className,
}: ContactSheetProps) {
  const selected = new Set(selects);
  const isRoll = variant === "roll";
  const frames = Array.from({ length: repeat }, () => SHEET_FRAMES).flat();

  return (
    <div
      aria-hidden
      className={cn("grid gap-px bg-foreground/10", columns, className)}
    >
      {frames.map((id, i) => {
        const image = marketingImage(id);
        const isSelect = selected.has(i);
        return (
          <figure
            key={`${id}-${i}`}
            className="relative aspect-[4/3] overflow-hidden bg-background"
          >
            <Image
              src={image.src}
              alt=""
              fill
              sizes="(min-width: 640px) 17vw, 25vw"
              loading={i < EAGER_FRAMES ? "eager" : "lazy"}
              priority={variant === "hero" && i < EAGER_FRAMES}
              // The roll's argument is carried by the DIMMING: an unselected
              // frame is one nobody ever sees again. Grayscale + a hard opacity
              // drop, so the few selects read as the only living images.
              className={cn(
                "object-cover",
                // The hero's uniform dim buys the headline headroom without
                // making the scrim crush the photographs it exists to show.
                variant === "hero" && "opacity-80",
                isRoll && !isSelect && "opacity-[0.14] grayscale",
                isRoll && isSelect && "opacity-100",
              )}
              // A slow breath on a few frames, so the sheet is alive without
              // the whole block drifting (which would echo home's wall).
              {...(variant === "hero" && i % 5 === 2
                ? { "data-mkt-shot": "", style: { "--shot-i": i } as CSSProperties }
                : {})}
            />
            <span className="absolute top-1 left-1.5 font-mono text-[10px] tabular-nums text-white/45 mix-blend-plus-lighter">
              {String(i + 1).padStart(2, "0")}
            </span>
            {isSelect && <SelectMark index={i} />}
          </figure>
        );
      })}
    </div>
  );
}

/**
 * The editor's mark. An SVG ellipse whose stroke DRAWS itself in on arrival
 * (the success-check recipe's stroke-draw mechanic, re-tokened here): the page
 * performs a curation pass in front of you. Careers is a rare surface, so the
 * animate-by-frequency discipline sanctions a real beat; the marks are the one
 * place this page spends it.
 *
 * `--mark-i` staggers them so they land one after another rather than together.
 * Reduced motion renders them already drawn (globals.css clamps the duration,
 * and the CSS keeps the final state outside the media query).
 */
function SelectMark({ index }: { index: number }) {
  return (
    <span
      className="mkt-select-mark absolute inset-0"
      style={{ "--mark-i": index } as CSSProperties}
    >
      <svg viewBox="0 0 100 75" className="size-full" fill="none" preserveAspectRatio="none">
        <ellipse
          cx="50"
          cy="37.5"
          rx="41"
          ry="30"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          transform="rotate(-6 50 37.5)"
        />
      </svg>
    </span>
  );
}
