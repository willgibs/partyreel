"use client";

// the concept's own sheet; keyframes here carry the hhg- prefix.
import "./gathering.css";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { Caption } from "@/components/marketing/system/caption";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import {
  CANVAS,
  type Concept,
  type ConceptProps,
  copyFor,
  DemoQr,
  GUTTER,
  LADDER,
  type Mode,
  Photo,
  REELS,
  reelById,
} from "./shared";

/**
 * THE GATHERING (concept 3 of the home-hero board, round two).
 *
 * The argument: an event album is not a product's grid, it is what fourteen
 * people brought back from the same night. So the hero is their frames, at
 * unequal sizes and slight angles on an irregular field, bleeding off all four
 * edges, still arriving while you read. The type sits in the clearing they
 * leave. The QR is the EYEBROW because it is where every one of those frames
 * came from: one code, above the h1, small and real and scannable off the
 * screen.
 *
 * What holds the composition together, and why:
 *
 *  - THE CLEARING, not a scrim (bible 1). Every slot is placed OUTSIDE
 *    CLEAR_ZONE, a rectangle sized to the lockup plus air, so no photograph is
 *    ever behind the type and no photograph is ever dimmed. The type wins by
 *    placement. If a slot is retuned, it is retuned against that rectangle.
 *  - THE TYPE IS THE CONSTANT. The lockup carries NO entrance at all: it is
 *    there at paint, and the album gathers around it. That is the concept
 *    (the event is the fixed thing, the album accretes), and it is also the
 *    cheapest possible way to obey bible 13, since the h1 has no animation to
 *    get wrong.
 *  - THE FIELD IS A DEPTH FIELD. Every slot carries a depth, and depth buys
 *    exactly three things: the parallax rate, the sway amplitude, and the
 *    stacking order. It never buys a dimming, which is the usual way a hero
 *    fakes depth over media.
 *  - VIDEO IS A CARD, not a panel. Three of the fifteen desktop slots are
 *    vertical clips, cut out of the portrait stand-in reel by currentTime at
 *    its OWN shot boundaries (the manifest carries them), so a range never
 *    opens mid-shot. The house poster-first pattern, with one refinement the
 *    ranges force: the cross-fade waits until playback is inside the range,
 *    not merely playing, so a card never flashes the file's first frame.
 *
 * Phone: the field collapses to two staggered columns of fewer, larger cards
 * that bleed off the top, the bottom and both sides, with the same clearing
 * through the middle.
 */

/* ── The field ───────────────────────────────────────────────────────────── */

type Media = { kind: "photo"; i: number } | { kind: "clip"; range: number };

type Slot = {
  /** The card's CENTRE, in percent of the canvas. */
  x: number;
  y: number;
  /** Width in percent of the canvas WIDTH; the height follows `ar` (w / h). */
  w: number;
  ar: number;
  /** The placed angle, degrees. Hand-set per slot: this is the whole point. */
  r: number;
  /** Depth, 0 far to 1 near: parallax rate, sway amplitude, stacking. */
  d: number;
  /** Landing order. The jump at the end is the two stragglers. */
  o: number;
  /** Sway period. Every slot differs, so the field never breathes in unison. */
  s: number;
  media: Media;
};

/** One frame per line, positionally, so the field below reads as the table it
 *  is and stays legible to the eye that has to retune it. */
function at(
  x: number,
  y: number,
  w: number,
  ar: number,
  r: number,
  d: number,
  o: number,
  s: number,
  media: Media,
): Slot {
  return { x, y, w, ar, r, d, o, s, media };
}

const photo = (i: number): Media => ({ kind: "photo", i });
const clip = (range: number): Media => ({ kind: "clip", range });

/**
 * THE CLEARING: the lockup's box plus air, in percent, per canvas. Every slot
 * below sits outside it, which is what lets the media run at 100% with no
 * darkening anywhere, and the lockup takes its COLUMN WIDTH from the same
 * numbers, so the clearing and the type box cannot drift apart. Retune this,
 * then re-walk the slots against it.
 */
const CLEAR_ZONE = {
  desktop: { x0: 21, x1: 79, y0: 20, y1: 78 },
  phone: { x0: 0, x1: 100, y0: 23, y1: 77 },
} as const;

/**
 * Fifteen frames, hand placed. Twelve photographs (each stand-in used exactly
 * once, sequenced so neighbours differ in palette) and three vertical clips.
 * Denser at the left and right, bleeding off every edge, thinning toward the
 * clearing. The last two land late, a beat after the burst.
 */
// prettier-ignore
const DESKTOP_SLOTS: Slot[] = [
  //  x   y   w   ar        r     d     o   s
  at(  6, 21, 20, 3 / 2,   -6.5, 0.85,  1, 11.5, photo(0)),   // the left hand
  at( 12, 50, 12, 9 / 16,   4,   0.95,  4,  9,   clip(0)),
  at(  4, 79, 17, 3 / 2,    7,   0.7,   7, 12.5, photo(5)),
  at( 19, 93, 13, 1,       -5,   0.45, 10, 10.5, photo(7)),
  at( 17, 14, 10, 1,        8,   0.4,   6,  8.5, photo(3)),   // the top band
  at( 33,  8, 15, 3 / 2,    4.5, 0.6,   3, 13,   photo(2)),
  at( 64,  6, 13, 16 / 9,  -4,   0.35,  5,  9.8, photo(1)),
  at( 79, 12, 16, 3 / 2,   -7,   0.75,  2, 11,   photo(9)),
  at( 93, 28, 19, 3 / 2,    6,   0.9,   0, 12,   photo(6)),   // the right hand
  at( 88, 55, 12, 9 / 16,  -5,   0.65,  8, 10,   clip(1)),
  at( 97, 79, 13, 2 / 3,   -8,   0.5,  11, 13.5, photo(4)),
  at( 80, 92, 17, 3 / 2,    4,   0.8,   9,  9.4, photo(8)),
  at( 26, 85, 11, 3 / 2,   -6,   0.38, 13, 11.8, photo(11)),
  at( 40, 95, 14, 16 / 9,  -3,   0.3,  22, 12.8, photo(10)),  // the stragglers
  at( 61, 97, 12, 9 / 16,   6,   0.55, 34, 10.8, clip(2)),
];

/** Two staggered columns, fewer and larger, every one of them bleeding off an
 *  edge so the field reads as continuing past the phone. */
// prettier-ignore
const PHONE_SLOTS: Slot[] = [
  //  x   y   w   ar        r     d     o   s
  at( 20,  6, 52, 3 / 2,   -5,   0.8,   0, 11.5, photo(0)),
  at( 82,  4, 46, 9 / 16,   4,   0.95,  2,  9,   clip(0)),
  at( 14, 94, 50, 4 / 5,    6,   0.7,   4, 12.5, photo(4)),
  at( 84, 99, 46, 9 / 16,  -4,   0.85,  6, 10.2, clip(1)),
  at( 44, 97, 30, 3 / 2,   -7,   0.35, 18, 13,   photo(10)),
];

const SLOTS: Record<Mode, Slot[]> = {
  desktop: DESKTOP_SLOTS,
  phone: PHONE_SLOTS,
};

/**
 * THE CLIP RANGES, derived from the reel's OWN cuts. The portrait stand-in is
 * 13.08s over six shots; pairing adjacent shots gives three ranges of 4.2 to
 * 4.5s that each open on a real cut, which is the difference between a clip
 * and a video scrubbed to an arbitrary second. Will's eight vertical clips
 * replace these three ranges one for one.
 */
const REEL = reelById(REELS.portrait);
const CLIP_RANGES: [number, number][] = [
  [REEL.shotBoundaries[0], REEL.shotBoundaries[2]],
  [REEL.shotBoundaries[2], REEL.shotBoundaries[4]],
  [REEL.shotBoundaries[4], REEL.durationSeconds],
];

/** How far the nearest and furthest frames separate over one hero of scroll. */
const PARALLAX_PX = 110;

/* ── Copy ────────────────────────────────────────────────────────────────── */

/** The caption under the QR: it has two jobs, inviting the reader to scan a
 *  code that is genuinely live, and saying that everyone else scans this one
 *  too, which is the composition's whole argument in six words. */
const QR_CAPTION = "Scan it. Every guest scans the same one.";

/* ── The board's concept ─────────────────────────────────────────────────── */

export const gathering: Concept = {
  id: "gathering",
  n: 3,
  name: "The gathering",
  rationale:
    "An event album is what everyone who was there brought back, so the hero is their frames: fifteen of them at unequal sizes and slight angles, bleeding off all four edges, with two still arriving while you read. The type sits in the clearing they leave, and the QR is the eyebrow because it is where all of it came from.",
  eyebrow:
    "The live demo QR at 72px, above the h1, on its white plate with the house pulse ring, and one Caption line under it: Scan it. Every guest scans the same one.",
  proposed: {
    h1: "Everyone there, in one album.",
    subhead:
      "One QR code on the table. Every phone in the room fills the same album.",
    secondary: "Open the demo album",
  },
  departures: [],
  assets: [
    "36 event photographs, one grade, 1600px long edge, a third of them portrait. The field places 12 at once in 3:2, 16:9, 1:1, 4:5 and 2:3 boxes, so a frame that only exists at 3:2 crops hard in the tall slots. Replaces all twelve stand-ins by id: wedding-golden, party-dj, reception-table, festival-lights, wedding-petals, concert-confetti, wedding-toast, festival-crowd, wedding-rings, reception-hall, party-balloons, wedding-arch.",
    "8 vertical clips, 3 to 5s, 1080 x 1920, silent, each with its own poster at 1080 x 1920 (the clip's first frame). Three run at a time on desktop and two on phone; they replace the three currentTime ranges this cuts out of hero-candidate-01, which shares one poster between all three today.",
    "3 of the 36 showing a guest holding a phone up at the event. The many-hands argument is carried by the arrangement, and it lands harder if one or two frames say it literally.",
  ],
  render: (p) => <Gathering {...p} />,
};

/* ── The render ──────────────────────────────────────────────────────────── */

function Gathering({ mode, copy, qrUrl }: ConceptProps) {
  const text = copyFor(gathering, copy);
  const desktop = mode === "desktop";
  const clearing = CLEAR_ZONE[mode];

  return (
    <div className="relative h-full overflow-hidden bg-background">
      <Field mode={mode} />

      {/* THE CLEARING. The lockup carries no entrance: it is the fixed thing
          the album gathers around, and the h1 is at paint by construction. */}
      <div className="relative flex h-full items-center justify-center">
        <div
          className={cn(
            "flex flex-col items-center text-center",
            desktop ? null : GUTTER.phone.x,
          )}
          style={{ width: `${clearing.x1 - clearing.x0}%` }}
        >
          <span
            data-mkt-pulse
            data-hh-loop
            className="inline-flex rounded-[var(--radius-tile)]"
          >
            <DemoQr url={qrUrl} size={desktop ? 72 : 64} />
          </span>
          <Caption className={cn("text-white/65", desktop ? "mt-3" : "mt-2.5")}>
            {QR_CAPTION}
          </Caption>

          <h1
            className={cn(
              "font-heading text-balance text-white",
              LADDER.xl[mode],
              desktop ? "mt-7 leading-[1.02]" : "mt-5 leading-[1.04]",
            )}
          >
            {text.h1}
          </h1>

          <p
            className={cn(
              "text-[15px] leading-relaxed text-pretty text-white/80",
              desktop ? "mt-5 max-w-[33rem]" : "mt-4 max-w-[19rem]",
            )}
          >
            {text.subhead}
          </p>

          <div
            className={cn(
              "flex flex-wrap items-center justify-center gap-3",
              desktop ? "mt-7" : "mt-6",
            )}
          >
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href={text.primary.href}>{text.primary.label}</Link>
            </Button>
            {/* The secondary is the tap route to the same album the QR
                encodes, so it exists only when a demo does: a dead button next
                to a live code would undercut the one honest object here. */}
            {qrUrl && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 border-white/30 bg-transparent px-5 text-base text-white hover:border-white/45 hover:bg-white/10 hover:text-white"
              >
                <Link href={qrUrl}>{text.secondary}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ mode }: { mode: Mode }) {
  const reduced = usePrefersReducedMotion();
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const canvas = CANVAS[mode];
  const slots = SLOTS[mode];

  /**
   * THE PARALLAX. One number on the root, read by every card at its own depth
   * rate. The signal is the hero's own progress through the viewport, which is
   * exactly what it would be in production: this hook ships with the concept.
   *
   * ★ A RATIO, not a geometry read. shared.tsx's rule is that geometry comes
   * from CANVAS because getBoundingClientRect lies under the stage's `zoom`,
   * and it does: every value comes back multiplied by the zoom factor. It
   * cancels in `top / height`, so the progress is exact at any stage scale,
   * and no card is ever POSITIONED from a rect.
   */
  useEffect(() => {
    if (reduced) return;
    const el = fieldRef.current;
    if (!el) return;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const progress = rect.height ? -rect.top / rect.height : 0;
      const clamped = Math.max(-1, Math.min(1, progress));
      el.style.setProperty(
        "--hhg-scroll",
        `${(clamped * PARALLAX_PX).toFixed(1)}px`,
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  return (
    <div ref={fieldRef} className="hhg-field" aria-hidden>
      {slots.map((slot, i) => (
        <Card key={i} slot={slot} i={i} canvasWidth={canvas.w} />
      ))}
    </div>
  );
}

function Card({
  slot,
  i,
  canvasWidth,
}: {
  slot: Slot;
  i: number;
  canvasWidth: number;
}) {
  // Canvas-relative, never a vw value: the stage is zoomed, so a vw picks the
  // wrong candidate (shared.tsx).
  const px = Math.round((slot.w / 100) * canvasWidth);
  const sizes = `${px}px`;

  // The arrival comes from further OUT than the slot: the field converges.
  const fx = ((slot.x - 50) / 50) * 34;
  const fy = ((slot.y - 50) / 50) * 26;

  return (
    <div
      className="hhg-card"
      style={
        {
          left: `${slot.x}%`,
          top: `${slot.y}%`,
          width: `${slot.w}%`,
          aspectRatio: `${slot.ar}`,
          zIndex: Math.round(slot.d * 100),
          "--hhg-r": `${slot.r}deg`,
          "--hhg-d": slot.d,
          "--hhg-o": slot.o,
          "--hhg-i": i,
          "--hhg-s": `${slot.s}s`,
          "--hhg-fx": `${fx.toFixed(1)}px`,
          "--hhg-fy": `${fy.toFixed(1)}px`,
          // It rotates THROUGH its placed angle on the way down, so it settles
          // rather than simply appears.
          "--hhg-fr": `${(slot.r * -1.4).toFixed(1)}deg`,
        } as CSSProperties
      }
    >
      <div className="hhg-land">
        <div className="hhg-sway" data-hh-loop>
          {slot.media.kind === "photo" ? (
            <Photo index={slot.media.i} sizes={sizes} className="hhg-media" />
          ) : (
            <Clip range={CLIP_RANGES[slot.media.range]} sizes={sizes} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * One vertical clip: a range of the stand-in reel, on the house poster-first
 * pattern (no autoplay attribute, imperative play().catch(), the poster as a
 * separate next/image beneath, cross-faded in).
 *
 * THE RANGE KEEPER is a rAF loop rather than `timeupdate`, which fires about
 * four times a second and would show up to 250ms of the NEXT shot before
 * snapping back on every lap of a four-second range. rAF also stops dead in a
 * background tab, which is the behaviour we want anyway.
 *
 * The cross-fade waits for playback to be INSIDE the range, not merely
 * playing: with preload="none" the first frame decoded is the file's, and
 * revealing on `playing` would flash it before the seek lands.
 *
 * Pausing: the lab deliberately does not wire use-ambient-pause on scroll
 * (board.tsx: side-by-side comparison wants everything running), so this reads
 * the two signals that cannot misfire, a hidden tab and reduced motion.
 * Production swaps this pair for useAmbientPause, which adds the offscreen
 * observer.
 */
function Clip({ range, sizes }: { range: [number, number]; sizes: string }) {
  const [start, end] = range;
  const reduced = usePrefersReducedMotion();
  const hidden = useTabHidden();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [live, setLive] = useState(false);
  const play = !reduced && !hidden;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!play) {
      v.pause();
      return;
    }
    v.play().catch(() => {
      // The poster stays. An autoplay refusal is a valid end state, never a
      // spinner (the production contract).
    });
  }, [play]);

  useEffect(() => {
    if (!play) return;
    const v = videoRef.current;
    if (!v) return;
    let inside = false;
    let frame = requestAnimationFrame(function tick() {
      const t = v.currentTime;
      // Before metadata this sets the default playback start position, so the
      // clip opens on its cut instead of seeking after the fact.
      if (t < start - 0.04 || t >= end) v.currentTime = start;
      else if (!inside && t > start) {
        inside = true;
        setLive(true);
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [play, start, end]);

  return (
    <div className="hhg-media relative overflow-hidden bg-white/5">
      <Image
        src={REEL.poster}
        alt=""
        fill
        sizes={sizes}
        loading="eager"
        className="object-cover"
      />
      <video
        ref={videoRef}
        src={REEL.src}
        preload="none"
        muted
        loop
        playsInline
        className={cn(
          "absolute inset-0 size-full object-cover transition-opacity duration-500",
          live ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

/** The one pause signal the lab keeps (board.tsx's own rule): a hidden tab.
 *  The board's stage mirrors it onto data-paused for CSS loops; a video needs
 *  it in JS. False on the server, so the markup is identical either way. */
function useTabHidden(): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const sync = () => setHidden(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  return hidden;
}
