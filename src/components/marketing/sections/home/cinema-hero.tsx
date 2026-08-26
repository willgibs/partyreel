"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { DemoTicket } from "@/components/marketing/system/demo-ticket";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import {
  MARKETING_IMAGES,
  MARKETING_REELS,
} from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

/**
 * LOUD (the loud/quiet map): THE LIVING ALBUM WALL (Will's 2026-08-25 rework
 * ruling: keep the bold media-forwardness, kill the "slides design" — the
 * single letterboxed cut-cut loop plus story segments and a timecode read as
 * a slideshow). The rework EMBODIES the thesis instead of presenting shots:
 *
 *  - The substrate is a full-bleed, slowly drifting WALL of real event media
 *    (the whole event, in one album — literally), edge to edge under a
 *    lower-third scrim. Many photos at once reads as an ALBUM; one cutting
 *    video reads as slides. The media supplies the color (the achromatic
 *    doctrine); the drift is ambient (linear, ~55s alternate) and rides the
 *    loop-pause contract via [data-mkt-wall] + data-paused in marketing.css.
 *  - ONE live reel card sits IN the wall (desktop+): the album's reel,
 *    playing the real engine render poster-first. It is product truth (album
 *    plus reel), not player chrome: its only adornment is a hairline ring and
 *    a mono duration chip. The card hides on mobile (the "Watch a sample
 *    reel" CTA carries the reel there); its <video> mounts post-hydration,
 *    play() rejection leaves the poster, ambient-pause pauses it.
 *  - LCP CONTRACT (revised for the wall): the LCP element is the H1 or an
 *    eager wall tile. The first WALL_EAGER tiles load eager (they paint the
 *    above-the-fold wall immediately; ~50-135KB each), the rest lazy; the
 *    reel-card poster is eager too (small). No element carries the full
 *    preload/fetchPriority trio anymore — with a text-or-tile LCP there is no
 *    single hero image to prioritize above the others.
 *  - The kinetic H1 keeps the byte-pinned SITE_THESIS with the SPLICE word
 *    mechanic (round 2: instant swap + one fast width glide — see SpliceWord)
 *    on a plain interval. Reduced motion: static thesis ("event"), static
 *    wall, no video.
 *  - The DEMO TICKET under the CTAs points at the real demo event (QR + tap
 *    route in one glass artifact — system/demo-ticket.tsx, shared with the nav's Features panel).
 */

const SampleReelOverlay = lazy(
  () => import("../shared/sample-reel-overlay.lazy"),
);

function requireReel(id: string) {
  const reel = MARKETING_REELS.find((r) => r.id === id);
  if (!reel) throw new Error(`Unknown marketing reel id: ${id}`);
  return reel;
}

// The LANDSCAPE render: its frame is FULL (the portrait classic render
// letterboxes landscape clips, so its poster reads as black bars — judged on
// screenshots, not code). Landscape is a real product orientation; honest.
const HERO_REEL = requireReel("hero-candidate-02");

// The ruled thesis splits around its kinetic slot; deriving the halves keeps
// the byte-pinned constant the ONLY copy source (home-sections.test.ts pins
// that this split stays valid). Reduced motion renders the thesis verbatim.
const [THESIS_BEFORE, THESIS_AFTER] = SITE_THESIS.split("event") as [
  string,
  string,
];

const KINETIC_WORDS = ["wedding", "birthday", "festival", "send-off"] as const;
const WORD_INTERVAL_MS = 3200;

const HERO_EYEBROW = "One QR. No app. No account.";

/** The wall's tile order: manifest media re-sequenced so adjacent tiles vary
 *  in palette and subject (hand-tuned against the real images, not random —
 *  determinism keeps SSR/client identical). The wall doubles the sequence so
 *  the drift never exposes an empty edge. */
const WALL_ORDER = [
  "wedding-golden",
  "party-balloons",
  "festival-crowd",
  "wedding-toast",
  "party-dj",
  "wedding-petals",
  "reception-table",
  "festival-lights",
  "wedding-rings",
  "concert-confetti",
  "reception-hall",
  "wedding-arch",
] as const;

/** Tiles that load eager: the above-the-fold wall must paint with the page. */
const WALL_EAGER = 6;

/** Taller tiles at deterministic positions give the wall its album masonry
 *  rhythm (spans on a fixed grid; no measurement, no CLS). */
const TALL_TILES = new Set([0, 3, 5, 8, 10, 13, 16, 19, 21]);

const WALL_TILES = [...WALL_ORDER, ...WALL_ORDER].map((id, i) => {
  const image = MARKETING_IMAGES.find((m) => m.id === id);
  if (!image) throw new Error(`Unknown wall image id: ${id}`);
  return { ...image, key: `${id}-${i}`, tall: TALL_TILES.has(i), index: i };
});

/** True only after hydration (server snapshot false): the post-hydration gate
 *  for the <video> mount, as a store subscription so no effect sets state. */
const noopSubscribe = () => () => {};
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function CinemaHero() {
  const reduced = usePrefersReducedMotion();
  const { ref: pauseRef, paused } = useAmbientPause<HTMLElement>();
  const mounted = useHydrated();
  const [videoLive, setVideoLive] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Post-hydration + full-motion only (SSR/no-JS/reduced ship poster only).
  const showVideo = mounted && !reduced;

  // Reel-card transport: play/pause rides the ambient-pause signal.
  useEffect(() => {
    if (!showVideo) return;
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else
      v.play().catch(() => {
        // The poster stays; no spinner (the production contract).
      });
  }, [showVideo, paused]);

  // The kinetic word cycles on a plain interval, held while paused/offscreen
  // (a word flipping in a background tab is wasted theater).
  useEffect(() => {
    if (reduced || paused) return;
    const timer = setInterval(
      () => setWordIndex((i) => (i + 1) % KINETIC_WORDS.length),
      WORD_INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, [reduced, paused]);

  return (
    <section
      ref={pauseRef}
      data-paused={paused ? "true" : undefined}
      className="relative -mt-[var(--mkt-header-h,4rem)] flex min-h-[100svh] flex-col justify-end overflow-hidden"
    >
      {/* THE ALBUM WALL (see the header comment). The grid is taller than the
          viewport and drifts slowly; the doubled sequence covers the travel. */}
      <div className="absolute inset-x-0 -top-[6%] -bottom-[10%]" aria-hidden>
        <div
          data-mkt-wall
          className="grid h-[130%] w-full grid-flow-dense auto-rows-[minmax(0,1fr)] grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5"
        >
          {WALL_TILES.map((tile) => (
            <div
              key={tile.key}
              className={`relative overflow-hidden ${tile.tall ? "row-span-2" : ""}`}
            >
              <Image
                src={tile.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 25vw, 34vw"
                loading={tile.index < WALL_EAGER ? "eager" : "lazy"}
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {/* The scrim: a flat base darkening (bright tiles must never compete
            with the H1) + lower-third weight + an edge vignette. The wall
            stays visibly alive midframe, but the type is sovereign. */}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/50" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_30%_75%,transparent_30%,rgba(0,0,0,0.4)_100%)]" />
        {/* THE MOBILE COPY SCRIM (R4/A12): at 375 the copy block sits high in
            the frame, where the ramp above is at its weakest, so the eyebrow
            and subhead ran straight over bright tiles. One extra ramp below sm
            puts ink behind the WHOLE block; the desktop scrim (tuned against
            the wall) is deliberately untouched. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent sm:hidden" />
      </div>

      {/* THE REEL CARD: the album's live reel, sitting in the wall. */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="absolute right-[6%] bottom-[18%] w-[300px] xl:w-[340px]">
          <div className="relative aspect-video overflow-hidden rounded-lg ring-1 ring-white/25">
            <Image
              src={HERO_REEL.poster}
              alt=""
              fill
              sizes="260px"
              loading="eager"
              className="object-cover"
            />
            {showVideo && (
              <video
                ref={videoRef}
                src={HERO_REEL.src}
                preload="none"
                muted
                loop
                playsInline
                onPlaying={() => setVideoLive(true)}
                className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${
                  videoLive ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 pt-8 pb-2.5">
              <MonoCaption className="text-white/80">The reel</MonoCaption>
              <MonoCaption className="text-white/60">
                0:
                {String(Math.round(HERO_REEL.durationSeconds)).padStart(2, "0")}
              </MonoCaption>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Container className="pt-28 pb-14 sm:pb-20">
          {/* white/75, up from white/60 (R4/A12): the wide tracking already
              thins this line, and over a live media wall 60% lost it. */}
          <p className="text-xs font-medium tracking-[0.22em] text-white/75 uppercase">
            {HERO_EYEBROW}
          </p>
          <h1 className="mt-4 max-w-4xl font-heading text-5xl leading-[1.02] text-white sm:text-6xl md:text-7xl lg:text-8xl">
            {THESIS_BEFORE}
            {/* The accessible sentence stays the static thesis; the kinetic
                slot is presentation only. */}
            <span className="sr-only">event</span>
            <span aria-hidden className="inline-flex align-baseline">
              {reduced ? (
                <span>event</span>
              ) : (
                <SpliceWord word={KINETIC_WORDS[wordIndex]} />
              )}
            </span>
            {THESIS_AFTER}
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-pretty text-white/85">
            {SITE_SUBHEAD}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
            </Button>
            {/* A REAL SECONDARY BUTTON (R4/A13): a 25% hairline over a bright
                media wall read as plain text at 375. A dark glass fill plus a
                40% edge gives it a button's body while the solid-white primary
                keeps the hierarchy. */}
            <Button
              size="lg"
              variant="outline"
              onClick={() => setOverlayOpen(true)}
              className="h-11 gap-2 border-white/40 bg-black/40 px-5 text-base text-white backdrop-blur-[2px] hover:border-white/50 hover:bg-white/15 hover:text-white"
            >
              <Play className="size-4 fill-current" />
              Watch a sample reel
            </Button>
          </div>
          {/* The demo ticket: QR + route to the real demo event (Will's
              checkpoint ask), replacing the text-only demo link here. */}
          <div className="mt-5">
            <DemoTicket />
          </div>
        </Container>
      </div>

      {overlayOpen && (
        <Suspense fallback={null}>
          <SampleReelOverlay onClose={() => setOverlayOpen(false)} />
        </Suspense>
      )}
    </section>
  );
}

/** SPLICE (round 2; the Roll was "still not very clean" — Will's checkpoint
 *  review; three simultaneous motions read as a busy little machine at 8xl).
 *  The house film-cut grammar instead: the word swaps INSTANTLY, a projector
 *  splice — no travel, no crossfade — and the box width glides once, fast, so
 *  the sentence closing up around the new word is the ONLY visible motion.
 *  The natural clip during the glide reads as intent: a longer word wipes in
 *  as its box opens; a shorter word's box closes up behind the comma. The
 *  measured-width machinery survives from the Roll: the sizer holds the box
 *  pre-measure, then the explicit width owns layout; ResizeObserver re-syncs
 *  on late webfont swaps / breakpoint font-size changes / zoom (a stale
 *  measure clips the H1 indefinitely — the c1 lesson); ceil() guards
 *  sub-pixel clipping; the sizer is inline-block because ResizeObserver never
 *  fires for inline boxes. FALLBACK if this version also fails Will's eye:
 *  render "event" static and retire KINETIC_WORDS (pre-agreed). */
function SpliceWord({ word }: { word: string }) {
  const [width, setWidth] = useState<number | null>(null);
  const sizerRef = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const sizer = sizerRef.current;
    if (!sizer) return;
    const sync = () => setWidth(Math.ceil(sizer.getBoundingClientRect().width));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(sizer);
    return () => ro.disconnect();
  }, [word]);

  return (
    <span
      className="relative inline-block overflow-hidden align-baseline"
      style={{
        width: width === null ? undefined : width,
        transition: "width 180ms var(--ease-in-out-strong)",
      }}
    >
      <span
        aria-hidden
        ref={sizerRef}
        className="invisible inline-block whitespace-nowrap"
      >
        {word}
      </span>
      <span className="absolute inset-0 whitespace-nowrap">{word}</span>
    </span>
  );
}
