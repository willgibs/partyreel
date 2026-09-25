import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { CARD_COPY_SCRIM } from "@/components/marketing/sections/features/shared/feature-door";
import type { EventType } from "@/lib/constants/events";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

/**
 * AN EVENT-TYPE CARD: THE PHOTOGRAPH IS THE CARD, at both of the sizes the site
 * shows one.
 *
 * `the-cards=frame` was chosen, verbatim: "However, with this
 * selection, all events should have a photograph (weddings, parties) rather
 * than an artifact (conferences, trips). These cards could use a ton of design
 * polish, only approving the photograph as full bg component here." Earlier the
 * same day, keeping the grid: "I would like to keep the 2x2 grid on desktop, as
 * it introduces each event card more fully and not all at once. However, these
 * event cards themselves could use a total redesign."
 *
 * ★ ALL FOUR CARRY A PHOTOGRAPH NOW, and the two the manifest has no subject
 * for carry a NAMED STAND-IN rather than an artifact (`events.ts`,
 * `media.card`; ASSETS rows 24 and 25 are the swap, and it is a data change in
 * that one file). The artifact-inside-a-card is gone from both sizes: it is
 * the thing removed by name.
 *
 * ★ ONE ANATOMY, TWO SIZES. The hub's directory card and the home row's card
 * used to be two components with two opinions about the same object (a 16:10
 * window with chips, and a 4:5 photograph with a scrim). They are one thing
 * now, and `size` changes only what a 438px card can hold that a 280px one
 * cannot: the type step of the name, and the long-tail line.
 *
 * ★ THE SCRIM IS THE SHARED ONE, never a fresh ramp. `CARD_COPY_SCRIM`
 * (feature-door.tsx) is two measured layers, a band for the copy row's ground
 * and a bloom in the corner the copy starts from; the rest scrim above it lifts
 * on hover while the copy's own gradient holds, so the photograph brightens and
 * the words do not move.
 *
 * ★ AND NOTHING HIDES BEHIND THE CURSOR. Every card is read on a phone first,
 * so the arrow is present at rest and hover only moves it. The one thing that
 * is hover-only is the photograph's scale, which a phone loses nothing by.
 */

type CardSize = "directory" | "teaser";

const SIZE: Record<
  CardSize,
  { radius: string; pad: string; name: string; teaser: string; sizes: string }
> = {
  /** The /events hub's 2x2: room for the name at an editorial size and for the
   *  long tail the umbrella pages exist to show. */
  directory: {
    radius: "rounded-2xl",
    pad: "p-6",
    name: "text-section",
    teaser: "text-subhead",
    sizes: "(min-width: 640px) 440px, 100vw",
  },
  /** The home page's four-up row: a supporting beat, so the name comes down a
   *  step and the long tail stays on the hub where a reader went looking. */
  teaser: {
    radius: "rounded-xl",
    pad: "p-5",
    name: "text-subsection",
    teaser: "text-sm",
    sizes: "(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw",
  },
};

export function EventCard({
  type,
  size,
  style,
  priority,
  className,
}: {
  type: EventType;
  size: CardSize;
  /** The caller's stagger seat (`--i`); the card marks itself for the reveal. */
  style?: CSSProperties;
  /** The hub's top row peeks above the fold, where Next's heuristic picks a
   *  card still as the LCP element. */
  priority?: boolean;
  className?: string;
}) {
  const s = SIZE[size];
  const still = marketingImage(type.media.card);
  return (
    <Link
      href={`/events/${type.slug}`}
      data-mkt-reveal
      style={style}
      className={cn(
        "group relative flex aspect-4/5 flex-col justify-end overflow-hidden bg-muted",
        s.radius,
        // An edge, so a dark photograph does not dissolve into the cinema
        // ground it sits on.
        "ring-1 ring-white/10",
        // The focus ring is WHITE and offset inward, not the token ring:
        // `outline-ring` lands ~1.4:1 on a dark photograph.
        "focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white",
        // The house press idiom: named properties, never `all`.
        "transition-transform duration-200 ease-emphasis active:scale-[0.99] motion-reduce:transition-none",
        className,
      )}
    >
      <Image
        src={still.src}
        alt=""
        fill
        sizes={s.sizes}
        priority={priority}
        // 500ms on the photograph alone, and deliberately outside the control
        // budget: a large slow push is the ratified card behaviour here (the
        // home row shipped this), while every control response on the card
        // stays at 200ms or under.
        className="object-cover transition-transform duration-500 ease-emphasis group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />

      {/* Rest scrim to hover scrim: 180ms out is the ratified hover asymmetry
          (a card is skimmed, not studied). Bottom-weighted, so the copy's
          ground is the darkest part of the frame and the top of the photograph
          stays nearly clear. */}
      <span
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10 transition-opacity duration-[180ms] ease-emphasis group-hover:opacity-70 motion-reduce:transition-none"
      />
      <span aria-hidden className="absolute inset-0" style={CARD_COPY_SCRIM} />

      <span className={cn("relative flex flex-col gap-2", s.pad)}>
        <span
          className={cn(
            "font-heading text-balance text-white",
            s.name,
            // The name is the card's own heading and rides the ladder; the
            // measure keeps a long one off the photograph's right edge.
            size === "directory" && "max-w-[9ch]",
          )}
        >
          {type.navLabel}
        </span>
        <span className={cn("text-pretty text-white/85", s.teaser)}>
          {type.teaser}
        </span>

        {size === "directory" && (
          <>
            {/* The long tail as ONE running line, which is what the chip row
                became: every term search rewards survives, and the section
                stops reading as a tag cloud. */}
            <span className="mt-3 border-t border-white/15 pt-3 text-xs font-medium text-white/65">
              {type.nestedThemes.slice(0, 4).join(" · ")} and more
            </span>
          </>
        )}

        {/* Present at rest, moving on hover: the learn-more idiom, so a thumb
            reads the same affordance a cursor does. */}
        <span
          aria-hidden
          className={cn(
            "mt-3 inline-flex items-center gap-1.5 text-white",
            size === "teaser" ? "text-xs" : "text-sm",
          )}
        >
          <span className="font-medium">See {type.navLabel.toLowerCase()}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            className="transition-transform duration-150 ease-emphasis group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          >
            <path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" />
          </svg>
        </span>
      </span>
    </Link>
  );
}
