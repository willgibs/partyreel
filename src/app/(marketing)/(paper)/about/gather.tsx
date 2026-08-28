"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

import { CinemaChapter } from "@/components/marketing/system/cinema-chapter";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Container } from "@/components/shared/container";
import { ABOUT_GATHER } from "@/lib/constants/about";
import { marketingImage } from "@/lib/constants/marketing-media";
import { useInViewOnce } from "@/lib/shared/use-in-view-once";

/**
 * THE GATHER: /about's one loud beat, and the thematic mirror of the home page's
 * signature. Home takes a reel APART into its source tiles; About runs the exact
 * same ratified CSS ([data-mkt-fly], marketing.css chapter 1) FORWARD, and the
 * photos converge into one album. The home page uses the grammar inverted (tiles
 * seated at their seats with vectors pointing back at a reel's centre, so firing
 * reads as an outward burst); its documented default direction was unused
 * anywhere on the site until this. Zero new motion grammar.
 *
 * ── THE CHAPTER CUT, AND THE STRADDLE ──
 *
 * The ruled chapter doctrine is cinema = the event, paper = the morning after /
 * the host's desk. This beat is BOTH, in order: the media arrives out of the
 * dark, and then the finished album is set down on the desk. So the plate is not
 * inside the dark chapter, it is pulled UP into it (the album.tsx idiom, lg only:
 * "over the dark field it reads as a print laid on the desk"), and it carries
 * `surface-paper` itself, which re-aliases the light block INCLUDING
 * --shadow-float that CinemaChapter deliberately zeroes. The attribute that
 * makes it straddle is the same one that gives back its elevation.
 *
 * DOM order matters here and is the safe direction: the plate lives AFTER the
 * chapter and reaches back into it, so it paints over the dark naturally. The
 * inverse (a plate inside the chapter hanging down) would depend on whatever
 * follows staying transparent, which nothing guarantees.
 *
 * Below lg the split stacks and the plain hard cut carries the seam, exactly as
 * on home.
 *
 * ── ONE OBSERVER ──
 *
 * A single useInViewOnce on the outer wrapper drives the header cut, the tile
 * flight and the payoff line. Two observers (one on a Reveal, one on the stage)
 * fire near-simultaneously on the desktop this gets developed on, but on a phone
 * the header can be read and scrolled past before the plate ever trips. The
 * ordering is authored, not incidental.
 *
 * ★ [data-mkt-fly] is SELF-keyed: the final-state rule is
 * `[data-mkt-fly][data-on="true"]`, so every tile needs its own data-on. The
 * wrapper's data-inview only drives the descendant [data-mkt-cut]/[data-mkt-reveal].
 */

const STAGE_W = 820;

/**
 * Design px on the 820-wide stage, converted to container-query units so one
 * geometry serves every viewport (the decomposition cq() helper). VECTORS ONLY
 * are scaled; the plate is never scaled.
 *
 * The axes scale independently because the phone case is anisotropic: at three
 * columns the plate turns portrait, so there is vertical room and no horizontal
 * room. Shrinking both (one scalar) would give the smallest screen the LEAST
 * travel, which is the inverse of what decomposition learned ("below sm the
 * stage CROPS instead of shrinking").
 */
const cqv = (px: number, axis: "x" | "y") =>
  `calc(${((px / STAGE_W) * 100).toFixed(2)}cqw * var(--gscale-${axis}, 1))`;

type GatherTile = {
  id: string;
  /** Bearing the tile flies IN from, degrees, CSS convention (90 = from below). */
  deg: number;
  /** Distance travelled, design px. Near-equal across the set, on purpose. */
  r: number;
  /** Stagger slot. Authored, NOT the array index (see below). */
  i: number;
  /** The settle's resting tilt, degrees. */
  settle: number;
};

/**
 * ★ EQUAL-MAGNITUDE VECTORS ON AN AUTHORED COMPASS, never `k * seat offset`.
 *
 * Radial-proportional vectors are correct for a BURST (things fly apart), which
 * is why decomposition uses them. Run forward they do not gather: the inner
 * middle-row tiles sit barely one tile-width from their seats and slide in like
 * a carousel, and because travel scales with distance while duration does not,
 * the far tiles move FASTEST, which is backwards. Near-equal r over equal
 * duration means twelve objects moving at one velocity, which reads as ONE
 * gesture rather than twelve animations.
 *
 * Bearings are roughly each seat's own, perturbed so no two neighbours trace
 * parallel paths, with the middle row pushed near-vertical so it does not enter
 * sideways.
 *
 * ★ `i` is authored, never the array index: row-major arrival reads like a
 * loading skeleton. The shuffle is the "everyone's phone, no particular order"
 * signal, and it must be a FIXED table (never Math.random(), which desyncs SSR).
 * Array order IS grid order, so index 5 is row 2 column 2 at four columns.
 *
 * ★ INDEX 5 IS THE THIRTEENTH PHOTO. Eleven tiles gather; this one arrives alone
 * at i:36 (2340ms), roughly 440ms after the payoff line has finished landing.
 * A complete rectangle says "this is all of it", which is a photo album; the
 * product's promise is that there is always one more phone in the room. The dead
 * air in the middle is not a bug, it is the content: a gather that ends is an
 * album, a gather that pauses and continues is a party. Reduced motion collapses
 * the fly to an instant opacity swap with zero delay, so all twelve arrive
 * together and the hole never exists, which is the correct behaviour there.
 */
const TILES: readonly GatherTile[] = [
  { id: "wedding-golden", deg: 208, r: 430, i: 3, settle: -2.4 },
  { id: "reception-table", deg: 256, r: 395, i: 7, settle: 1.8 },
  { id: "party-balloons", deg: 288, r: 410, i: 1, settle: -1.5 },
  { id: "concert-confetti", deg: 332, r: 425, i: 9, settle: 2.6 },
  { id: "wedding-rings", deg: 188, r: 440, i: 5, settle: 2.1 },
  { id: "reception-hall", deg: 268, r: 400, i: 36, settle: -1.9 }, // ← the thirteenth
  { id: "party-dj", deg: 74, r: 405, i: 10, settle: 1.4 },
  { id: "wedding-toast", deg: 348, r: 435, i: 2, settle: -2.7 },
  { id: "festival-lights", deg: 152, r: 420, i: 6, settle: 1.6 },
  { id: "festival-crowd", deg: 108, r: 390, i: 0, settle: -2.2 },
  { id: "wedding-arch", deg: 66, r: 415, i: 8, settle: 2.3 },
  { id: "wedding-petals", deg: 28, r: 440, i: 4, settle: -1.3 },
];

const rad = (deg: number) => (deg * Math.PI) / 180;

function GatherTilePhoto({ id }: { id: string }) {
  const m = marketingImage(id);
  return (
    <Image
      src={m.src}
      alt=""
      fill
      sizes="(min-width: 820px) 120px, (min-width: 640px) 15vw, 30vw"
      className="object-cover"
    />
  );
}

export function Gather() {
  // 0.25 + a negative bottom margin: the beat starts assembling while the
  // section is still entering, so the last arrival is not stranded below the
  // fold for a fast scroller.
  const { ref, inView } = useInViewOnce<HTMLDivElement>(
    0.25,
    "0px 0px -10% 0px",
  );

  return (
    <div ref={ref} data-inview={inView ? "true" : "false"}>
      <CinemaChapter>
        {/* The extra lg bottom padding is the room the plate reaches back into. */}
        <section className="py-20 sm:py-24 lg:pb-56">
          <Container className="mx-auto max-w-2xl text-center">
            <Eyebrow data-mkt-cut style={{ "--i": 0 } as CSSProperties}>
              {ABOUT_GATHER.eyebrow}
            </Eyebrow>
            <h2
              data-mkt-cut
              style={{ "--i": 1 } as CSSProperties}
              className="mt-3 font-heading text-2xl text-balance sm:text-3xl"
            >
              {ABOUT_GATHER.heading}
            </h2>
            <p
              data-mkt-cut
              style={{ "--i": 2 } as CSSProperties}
              className="mt-4 text-pretty text-muted-foreground"
            >
              {ABOUT_GATHER.subhead}
            </p>
          </Container>
        </section>
      </CinemaChapter>

      {/* THE STRADDLE. surface-paper is load-bearing twice: the print reads as
          laid on the desk, and it restores --shadow-float (and the light
          --border/--card the plate paints with) that the chapter zeroes. */}
      <div aria-hidden className="surface-paper relative z-10 mt-10 lg:-mt-52">
        {/* The container-query stage: aspect-locked so the seats are stable, and
            wide enough that incoming tiles are partly visible before they clip.
            At three columns the plate turns portrait, so the stage does too. */}
        <div className="[container-type:inline-size] relative mx-auto w-full max-w-[820px] overflow-hidden max-sm:[--gscale-x:0.55] max-sm:[--gscale-y:1.3] max-sm:[--plate:88cqw]">
          <div className="relative aspect-[820/520] max-sm:aspect-[820/760]">
            <div className="absolute top-1/2 left-1/2 w-[var(--plate,56cqw)] -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-card p-2 ring-1 ring-[var(--border)] lg:shadow-[var(--shadow-float)]">
              <div className="grid grid-cols-3 gap-[var(--gap-gallery)] sm:grid-cols-4">
                {TILES.map((t) => (
                  <div
                    key={t.id}
                    data-mkt-fly
                    data-on={inView ? "true" : undefined}
                    className="mkt-settle relative aspect-square overflow-hidden rounded-[var(--radius-tile)] bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"
                    style={
                      {
                        "--fly-x": cqv(Math.cos(rad(t.deg)) * t.r, "x"),
                        "--fly-y": cqv(Math.sin(rad(t.deg)) * t.r, "y"),
                        "--settle-r": `${t.settle}deg`,
                        "--i": t.i,
                      } as CSSProperties
                    }
                  >
                    <GatherTilePhoto id={t.id} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The payoff lands on PAPER, under the print: the album has arrived on the
          desk and the line is the caption on it. --i 5 against a locally retuned
          240ms stagger unit puts it at 1200ms, after the eleventh tile settles
          and before the twelfth arrives. */}
      <section className="pt-12 pb-20 sm:pb-24 lg:pt-16">
        <Container>
          <p
            data-mkt-reveal
            style={{ "--i": 5, "--mkt-stagger-ms": "240ms" } as CSSProperties}
            className="mx-auto max-w-md text-center font-heading text-2xl leading-tight text-balance sm:text-3xl"
          >
            {ABOUT_GATHER.payoff}
          </p>
        </Container>
      </section>
    </div>
  );
}
