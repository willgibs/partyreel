"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { CARD_COPY_SCRIM } from "@/components/marketing/sections/features/shared/feature-door";
import {
  AttendeeBadge,
  SharedRoll,
} from "@/components/marketing/sections/events/event-artifacts";
import { TypeDirectory } from "@/components/marketing/sections/events/type-directory";
import { Reveal } from "@/components/marketing/system/reveal";
import { TiltCard } from "@/components/marketing/system/tilt-card";
import { EVENT_TYPES } from "@/lib/constants/events";
import { cn } from "@/lib/utils";

import { CARD_STILL } from "./fixtures";
import { Pic, seat } from "./pieces";

/**
 * DECISION 3: THE CARDS.
 *
 * Will (2026-09-19, verbatim, on the hub's directory): "This is the best
 * implementation across these three options, and I would like to keep the 2x2
 * grid on desktop, as it introduces each event card more fully and not all at
 * once. However, these event cards themselves could use a total redesign."
 *
 * So the grid is settled and the CARD is the question. All four options keep
 * two up at 1440 and one up at 375, and all four carry the same four types, so
 * a reviewer is comparing anatomy and nothing else.
 *
 * ★ TWO OF THE FOUR HAVE NO PHOTOGRAPH, and every card design has to survive
 * it. The manifest has no honest conference or trip subject and the shipped
 * ruling is that a card never promises the wrong event, so those two preview
 * with the product artifact their own pages lead with. A design that only looks
 * good on the two photographed types is a design that breaks the grid.
 */
export type CardShape = "today" | "frame" | "stack" | "plate";

const THEME_CHIPS = 3;

/** The artifact a type previews with when the manifest has no still for it. */
function Artifact({ slug }: { slug: string }) {
  return slug === "conferences" ? (
    <AttendeeBadge scale="card" />
  ) : (
    <div className="w-full max-w-[230px]">
      <SharedRoll scale="card" />
    </div>
  );
}

/** One type's picture, whichever it is, in whatever window the card gives it. */
function CardArt({
  slug,
  className,
  sizes,
}: {
  slug: string;
  className?: string;
  sizes?: string;
}) {
  const still = CARD_STILL[slug];
  if (still) return <Pic id={still} className={className} sizes={sizes} />;
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden bg-muted/40 px-4",
        className,
      )}
    >
      <Artifact slug={slug} />
    </div>
  );
}

/* ── the grid every option shares ────────────────────────────────────────── */

function Grid({ children }: { children: ReactNode }) {
  return (
    <Reveal className="mx-auto grid max-w-4xl gap-5 px-6 py-12 sm:grid-cols-2">
      {children}
    </Reveal>
  );
}

/* ── frame: the photograph is the card ───────────────────────────────────── */

/**
 * The house's own media-forward anatomy (the home's event card, ruled by Will
 * in round 2: "the image being the full background, the copy keeping its
 * position bottom left, and using a dark gradient overlay") brought up to
 * directory size, where there is room for the long-tail themes the hub exists
 * to show. The scrim is the ruled one, never a fresh ramp.
 */
function FrameCards() {
  return (
    <Grid>
      {EVENT_TYPES.map(({ slug, navLabel, teaser, nestedThemes }, i) => {
        const photographed = Boolean(CARD_STILL[slug]);
        return (
          <Link
            key={slug}
            href={`/events/${slug}`}
            data-mkt-reveal
            style={seat(i + 2)}
            className="group relative flex aspect-4/5 flex-col justify-end overflow-hidden rounded-2xl bg-muted transition-transform duration-200 ease-emphasis active:scale-[0.99] motion-reduce:transition-none"
          >
            <CardArt
              slug={slug}
              // An artifact centres in the space ABOVE the copy floor, not in
              // the whole card: centred over the card it was cut in half by
              // the floor the copy stands on.
              className={
                photographed
                  ? "absolute inset-0"
                  : "absolute inset-x-0 top-0 bottom-[36%]"
              }
              sizes="(min-width: 640px) 430px, 100vw"
            />
            {/* ★ THE SCRIM IS FOR A PHOTOGRAPH, AND ONLY FOR ONE. Drawn over the
                two artifact types it buried the badge and the roll in black,
                which would have shown Will a broken card rather than the real
                cost of this option. A card with no photograph keeps its plate
                lit and takes the copy on a plain floor, which IS what this
                option does to the grid's weak corner. */}
            {photographed ? (
              <>
                <span
                  aria-hidden
                  className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10 transition-opacity duration-[180ms] ease-emphasis group-hover:opacity-70 motion-reduce:transition-none"
                />
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={CARD_COPY_SCRIM}
                />
              </>
            ) : null}
            <span
              className={cn(
                "relative flex flex-col gap-2 p-6",
                photographed ? "text-white" : "bg-card",
              )}
            >
              <span
                className={cn(
                  "font-heading text-section",
                  photographed && "text-white",
                )}
              >
                {navLabel}
              </span>
              <span
                className={cn(
                  "text-subhead",
                  photographed ? "text-white/85" : "text-muted-foreground",
                )}
              >
                {teaser}
              </span>
              <span
                className={cn(
                  "mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs font-medium",
                  photographed ? "text-white/60" : "text-faint",
                )}
              >
                {nestedThemes.slice(0, THEME_CHIPS).join(" · ")} and more
              </span>
            </span>
          </Link>
        );
      })}
    </Grid>
  );
}

/* ── stack: the card is the album ────────────────────────────────────────── */

/**
 * The card behaves like the thing it sells: a small pile of that type's
 * photographs, the top one facing you and two more settled behind it, squaring
 * up when the cursor arrives. A reader who has not read a word already knows
 * what the product does.
 *
 * ★ AND IT IS FANNED AT REST, NOT ON HOVER. A phone has no cursor, so the
 * composition has to be the resting state and the hover is a small reward on
 * top of it (bible 14's spirit: the still is the picture, motion is a bonus).
 */
function StackCards() {
  const pile: Record<string, readonly string[]> = {
    weddings: ["wedding-arch", "wedding-golden", "wedding-toast"],
    parties: ["party-balloons", "party-dj", "reception-table"],
  };
  return (
    <Grid>
      {EVENT_TYPES.map(({ slug, navLabel, teaser, nestedThemes }, i) => {
        const shots = pile[slug];
        return (
          <Link
            key={slug}
            href={`/events/${slug}`}
            data-mkt-reveal
            style={seat(i + 2)}
            className="group flex flex-col gap-5 rounded-2xl border bg-card p-6 transition-[border-color] duration-150 hover:border-foreground/25"
          >
            <span className="relative block h-[268px]">
              {shots ? (
                shots.map((id, k) => (
                  <Pic
                    key={id}
                    id={id}
                    sizes="(min-width: 640px) 300px, 70vw"
                    className={cn(
                      "absolute top-0 left-1/2 h-[250px] w-[200px] -translate-x-1/2 rounded-xl border-4 border-card shadow-lift ring-1 ring-foreground/10",
                      "transition-transform duration-300 ease-emphasis motion-reduce:transition-none",
                      k === 0 &&
                        "z-30 -rotate-[5deg] group-hover:rotate-0 motion-reduce:group-hover:-rotate-[5deg]",
                      k === 1 &&
                        "z-20 translate-x-[calc(-50%+26px)] rotate-[6deg] group-hover:translate-x-[calc(-50%+12px)] group-hover:rotate-[2deg]",
                      k === 2 &&
                        "z-10 translate-x-[calc(-50%-26px)] rotate-[-11deg] group-hover:translate-x-[calc(-50%-12px)] group-hover:rotate-[-2deg]",
                    )}
                  />
                ))
              ) : (
                <span className="absolute inset-x-0 top-0 flex h-[250px] items-center justify-center rounded-xl bg-muted/40">
                  <Artifact slug={slug} />
                </span>
              )}
            </span>
            <span className="flex flex-col gap-2">
              <span className="font-heading text-section">{navLabel}</span>
              <span className="text-subhead text-muted-foreground">
                {teaser}
              </span>
              <span className="mt-1 text-xs font-medium text-faint">
                {nestedThemes.slice(0, THEME_CHIPS).join(" · ")} and more
              </span>
            </span>
          </Link>
        );
      })}
    </Grid>
  );
}

/* ── plate: the editorial index ──────────────────────────────────────────── */

/**
 * The quietest of the four and the most information: a tall window, a hairline,
 * the name at the `section` step, the long tail as one running line, and a
 * standing row that says where the card goes. Nothing hides behind a hover, so
 * the phone and the desktop read identically.
 */
function PlateCards() {
  return (
    <Grid>
      {EVENT_TYPES.map(({ slug, navLabel, teaser, nestedThemes }, i) => (
        <TiltCard key={slug} className="rounded-2xl">
          <Link
            href={`/events/${slug}`}
            data-mkt-reveal
            style={seat(i + 2)}
            className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-[border-color,transform] duration-150 hover:border-foreground/25 active:scale-[0.99]"
          >
            <CardArt
              slug={slug}
              className="aspect-3/2"
              sizes="(min-width: 640px) 430px, 100vw"
            />
            <span className="flex flex-1 flex-col p-6">
              <span className="font-heading text-section">{navLabel}</span>
              <span className="mt-2 text-subhead text-muted-foreground">
                {teaser}
              </span>
              <span className="mt-5 block h-px bg-border" />
              <span className="mt-4 text-xs font-medium text-faint">
                {nestedThemes.slice(0, 4).join(" · ")}
              </span>
              <span className="mkt-learn mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium">
                See {navLabel.toLowerCase()}
                <ArrowRight className="size-4" />
              </span>
            </span>
          </Link>
        </TiltCard>
      ))}
    </Grid>
  );
}

/* ── the switch ──────────────────────────────────────────────────────────── */

export function CardsPreview({ shape }: { shape: CardShape }): ReactNode {
  if (shape === "frame") return <FrameCards />;
  if (shape === "stack") return <StackCards />;
  if (shape === "plate") return <PlateCards />;
  return (
    <div className="px-6 pt-2 pb-12">
      <TypeDirectory />
    </div>
  );
}
