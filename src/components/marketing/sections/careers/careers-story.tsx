import Image from "next/image";
import type { CSSProperties } from "react";

import { BrowserFrame } from "@/components/marketing/frames";
import { InlineReelPlayer } from "@/components/marketing/sections/shared/inline-reel-player";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MediaSplit } from "@/components/marketing/system/media-split";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { CAREERS_STORY } from "@/lib/constants/careers";
import { marketingImage } from "@/lib/constants/marketing-media";

import { ContactSheet, SHEET_FRAMES } from "./contact-sheet";

/**
 * THE ARGUMENT: the roll -> the selects -> the reel.
 *
 * This is the page's answer to two questions a candidate actually has ("why
 * does this matter" and "what would I work on"), and it answers them in
 * PHOTOGRAPHS. The section it replaces was the product pitch restated in prose
 * on a page whose reader had already met it twice, which is exactly why two
 * prototypes read as generic.
 *
 * Three beats, one composition each, roughly forty words total:
 *
 *  1. THE ROLL - the contact sheet again, but with everything except the
 *     selects dimmed to almost nothing. The dimming IS the argument: an
 *     unselected frame is one nobody ever sees. Same component as the hero, so
 *     the page has one media vocabulary rather than three.
 *  2. THE SELECTS - the frames that lived, gathered into the product's own
 *     chrome. Composed from BrowserFrame + manifest tiles the way
 *     sections/home/album.tsx does, because the frames library renders fixed
 *     placeholder tiles with no media slot (frames are consumed as-is by
 *     contract).
 *  3. THE REEL - the real rendered loop, poster-first via InlineReelPlayer, so
 *     no video bytes load without intent. That is the PLAYER, not the reel
 *     engine, so the sanctioned-import boundary that keeps the engine out of
 *     marketing chunks is untouched.
 */

/**
 * THE FRAMES THE HOST KEPT - the single source of narrative truth. The roll
 * circles exactly these, and the album leads with exactly these, so the four
 * photographs that survive the cut are demonstrably the same four that show up
 * in the album a screen later. Change this list and both follow.
 */
const KEPT_FRAMES = [
  "party-balloons",
  "reception-table",
  "wedding-petals",
  "festival-lights",
] as const;

/** Derived, never hand-numbered: a literal index list silently rots the moment
 *  SHEET_FRAMES is reordered, and nothing would fail. */
export const ROLL_SELECTS = KEPT_FRAMES.map((id) =>
  SHEET_FRAMES.indexOf(id as (typeof SHEET_FRAMES)[number]),
);

/**
 * ! THE HERO'S MARKS ARE POSITIONAL AND SEPARATE, on purpose. The hero repeats
 *   the roll three times, so selecting by ID there would circle each keeper
 *   three times over. These indices are also deliberately LOW in the sheet:
 *   marks in the top row sit under the overlay header and the scrim's top fade,
 *   which hid them (Will's catch). Index 18+ clears row one at every breakpoint
 *   the sheet uses (5, 7 and 9 columns).
 */
export const HERO_SELECTS = [20, 25, 31];

/** Leads with the keepers, then two more the host also kept. */
const ALBUM_TILES = [...KEPT_FRAMES, "wedding-golden", "wedding-toast"];

export function CareersStory() {
  const [roll, selects, reel] = CAREERS_STORY;

  return (
    <>
      {/* 1. THE ROLL. Full width: the point is the sheer quantity of frames
             that go dark, so this one must not be boxed into a column. */}
      <SectionShell className="pb-8 sm:pb-10">
        <Reveal className="mx-auto flex max-w-2xl flex-col gap-3 text-center">
          <Eyebrow data-mkt-reveal style={{ "--i": 0 } as CSSProperties}>
            {roll.eyebrow}
          </Eyebrow>
          <h2
            data-mkt-reveal
            className="font-heading text-section text-balance"
            style={{ "--i": 1 } as CSSProperties}
          >
            {roll.title}
          </h2>
          <p
            data-mkt-reveal
            className="text-pretty text-muted-foreground"
            style={{ "--i": 2 } as CSSProperties}
          >
            {roll.body}
          </p>
        </Reveal>
        <Reveal className="mt-12">
          <div data-mkt-reveal style={{ "--i": 3 } as CSSProperties}>
            <ContactSheet
              variant="roll"
              selects={ROLL_SELECTS}
              columns="grid-cols-4 sm:grid-cols-6"
              className="ring-1 ring-border"
            />
          </div>
        </Reveal>
      </SectionShell>

      {/* 2. THE SELECTS. */}
      <SectionShell className="py-14 sm:py-16">
        <MediaSplit media={<AlbumVisual />} mediaSide="end">
          <Reveal className="flex flex-col gap-3">
            <Eyebrow data-mkt-reveal style={{ "--i": 0 } as CSSProperties}>
              {selects.eyebrow}
            </Eyebrow>
            <h2
              data-mkt-reveal
              className="font-heading text-section text-balance"
              style={{ "--i": 1 } as CSSProperties}
            >
              {selects.title}
            </h2>
            <p
              data-mkt-reveal
              className="text-pretty text-muted-foreground"
              style={{ "--i": 2 } as CSSProperties}
            >
              {selects.body}
            </p>
          </Reveal>
        </MediaSplit>
      </SectionShell>

      {/* 3. THE REEL. Media leads on this one so the two splits do not read as
             the same slide twice. */}
      <SectionShell className="py-14 sm:py-16">
        <MediaSplit media={<ReelVisual />} mediaSide="start">
          <Reveal className="flex flex-col gap-3">
            <Eyebrow data-mkt-reveal style={{ "--i": 0 } as CSSProperties}>
              {reel.eyebrow}
            </Eyebrow>
            <h2
              data-mkt-reveal
              className="font-heading text-section text-balance"
              style={{ "--i": 1 } as CSSProperties}
            >
              {reel.title}
            </h2>
            <p
              data-mkt-reveal
              className="text-pretty text-muted-foreground"
              style={{ "--i": 2 } as CSSProperties}
            >
              {reel.body}
            </p>
          </Reveal>
        </MediaSplit>
      </SectionShell>
    </>
  );
}

function AlbumVisual() {
  return (
    <div aria-hidden>
      <BrowserFrame label="partyreel.com/a/the-whole-event">
        <div className="grid grid-cols-3 gap-[var(--gap-gallery)]">
          {ALBUM_TILES.map((id) => {
            const image = marketingImage(id);
            return (
              <span
                key={id}
                className="relative block aspect-square overflow-hidden rounded-[var(--radius-tile)]"
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 18vw, 30vw"
                  loading="lazy"
                  className="object-cover"
                />
              </span>
            );
          })}
        </div>
      </BrowserFrame>
    </div>
  );
}

function ReelVisual() {
  return (
    // The LANDSCAPE cut, not the portrait one: a 9:16 reel poster letterboxes
    // its source frames, so the portrait version rendered as a tall black
    // column with a thin band of photo in the middle, and it stretched the
    // whole section to match. "And then it becomes a film" also just reads
    // better in a film shape.
    <div aria-hidden>
      {/* The float corner rides the player's own box, not a wrapper: the player
          carries the bright edge, and an edge follows the corner of the box it
          sits on (inline-reel-player.tsx says why a second clip breaks it). */}
      <InlineReelPlayer
        reelId="hero-candidate-02"
        sizes="(min-width: 1024px) 55vw, 92vw"
        className="rounded-[var(--radius-float)]"
      />
    </div>
  );
}
