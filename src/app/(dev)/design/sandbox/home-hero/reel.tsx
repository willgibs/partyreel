"use client";

// the concept's own sheet; keyframes here carry the hhr- prefix.
import "./reel.css";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import {
  CANVAS,
  type Concept,
  type ConceptProps,
  DemoQr,
  GUTTER,
  LADDER,
  REELS,
  copyFor,
  reelById,
} from "./shared";

/**
 * The reel (concept 2 of the home-hero board, round two), built by lp/hero-reel
 * against the contract in shared.tsx.
 *
 * THE ARGUMENT. The shipped hero is a BACKDROP: media runs edge to edge and the
 * page is printed on top of it, which is why it needs four stacked darkenings
 * to keep its own h1 legible. This one is an OBJECT. One film, in one frame,
 * inset to the page column and sized by the viewport, with the promise set over
 * it and a real scannable QR pinned inside it. An object can be lit, can have
 * an edge, and can hold a corner card without the card floating free of
 * anything; a backdrop can do none of those.
 *
 * WHY THAT ANSWERS THE BOARD'S QUESTION. The QR is not a badge beside the
 * hero, it is IN the frame, at the bottom left of the film it started. In
 * production the card is `lg:fixed` (see the card below), so the one object
 * that turns a stranger into a host travels with the visitor the whole way down
 * the page. The board's stage is a fixed-size canvas, so it renders absolute
 * here and the fixed behaviour is production wiring, not a lab trick.
 *
 * THE MECHANISM, in the order it matters:
 *  - the frame: an inset, rounded container (the radius is a flagged
 *    departure; see `departures`), full bleed with a sealed bottom on phone;
 *  - the film: the house video pattern exactly (no `autoplay` attribute, the
 *    poster as a separate next/image UNDER an imperatively played <video>,
 *    cross-faded on onPlaying, play() rejection leaves the poster standing);
 *  - the light: the poster again, blurred, as the frame's own spill, because
 *    rule 10 forbids a shadow and asks for light from under (flagged);
 *  - the beat: the live dot fires on the film's real cuts, read off
 *    video.currentTime against the manifest's shotBoundaries;
 *  - no scrim by default. The footage is graded dark (the asset ask). The
 *    board's scrim toggle puts ONE radial behind the type block only, so the
 *    trade is ruled rather than inherited.
 *
 * Reduced motion: no <video> mounts at all. The poster is the film, still, and
 * the whole composition is already its own rest state (rule 13): nothing here
 * arrives hidden, the h1 least of all.
 */

/** The stand-in film. Module scope so `shotBoundaries` keeps one identity
 *  across renders and the cut watcher's effect does not re-subscribe. */
const REEL = reelById(REELS.landscape);

/** The frame's inset inside the canvas, in px, and the corner it takes.
 *
 *  Desktop: the page column left and right (GUTTER.inset), a top that clears
 *  the 64px overlay header with room to breathe, and a real page seal below.
 *  Phone: Ploy's escape hatch, taken in its sharpest form. A 16px gutter at 375
 *  spends the only width the film has, so the frame runs full bleed and under
 *  the header, and the ONLY corner it keeps is the bottom pair. Content that
 *  reaches the top edge and curves away at the bottom is how a screen reads on
 *  a phone; a card at 343px wide is how a banner reads.
 */
const FRAME = {
  desktop: {
    top: 88,
    side: GUTTER.desktop.inset,
    bottom: 56,
    pad: 64,
    radius: "24px",
  },
  phone: {
    top: 0,
    side: 0,
    bottom: 24,
    pad: 20,
    // The type still has to clear the overlay header on a full-bleed frame.
    radius: "0 0 24px 24px",
  },
} as const;

/** Extra top padding inside the frame where the frame runs under the header. */
const HEADER_CLEARANCE = { desktop: 0, phone: 56 } as const;

function ReelHero({ mode, copy, scrim, qrUrl }: ConceptProps) {
  const reduced = usePrefersReducedMotion();
  const text = copyFor(reel, copy);
  const f = FRAME[mode];
  const desktop = mode === "desktop";

  // Canvas-derived, never measured: getBoundingClientRect lies under the
  // stage's zoom, and a vw `sizes` picks the wrong candidate for the same
  // reason. The frame's real width IS the right candidate width.
  const frameW = CANVAS[mode].w - f.side * 2;
  const sizes = `${frameW}px`;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [live, setLive] = useState(false);
  const [shot, setShot] = useState(0);
  const hidden = useTabHidden();
  const showVideo = !reduced;

  // The house play contract. A rejected play() (Low Power Mode, a data saver)
  // leaves the poster standing, which is a valid end state and never a spinner.
  // showVideo is a dependency because the <video> mounts and unmounts with it:
  // a newly mounted element needs this effect to run again or it never starts.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hidden) v.pause();
    else v.play().catch(() => {});
  }, [hidden, showVideo]);

  // THE CUT WATCHER. The manifest carries the exact shot boundaries, so the
  // active shot is derived statelessly from currentTime (the shipped hero's
  // own convention) rather than tracked with timers that drift across a loop.
  // rAF, not `timeupdate`: the event fires about four times a second, and a
  // quarter-second late on a two-second shot is the difference between a beat
  // that is synced and one that is merely near. rAF is throttled to nothing in
  // a hidden tab, so this costs nothing where nobody is looking.
  useEffect(() => {
    if (!live || reduced || hidden) return;
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      if (v) {
        const t = v.currentTime;
        let next = 0;
        for (let i = 0; i < REEL.shotBoundaries.length; i++) {
          if (t >= REEL.shotBoundaries[i]) next = i;
        }
        setShot((prev) => (prev === next ? prev : next));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, reduced, hidden]);

  return (
    <div className="relative size-full overflow-hidden bg-background">
      <div
        className="absolute"
        style={{
          top: f.top,
          bottom: f.bottom,
          left: f.side,
          right: f.side,
        }}
      >
        {/* THE SPILL. Outside the frame's clip on purpose: a blurred copy of
            the film's own poster, pushed down so the light reads as coming
            from under the object (rule 10). Same src as the poster inside, so
            it is one request, not two. */}
        <div
          aria-hidden
          className="hhr-bloom pointer-events-none absolute -inset-5 translate-y-3"
        >
          <Image
            src={REEL.poster}
            alt=""
            fill
            sizes={sizes}
            loading="eager"
            className="object-cover"
          />
        </div>

        {/* THE FRAME. */}
        <div
          className="relative size-full overflow-hidden"
          style={{ borderRadius: f.radius }}
        >
          {/* THE FILM. Poster first and underneath, always: the video only
              starts fetching post-hydration, so the poster is the layer that
              can carry the largest paint. `preload="none"` on the video keeps
              the network on the poster until the imperative play() asks for
              the file. Production adds `preload` to THIS poster (the head
              link) because it is the page's one hero image; the board holds
              three stages at once, so the link would be lab noise. */}
          <div aria-hidden className="hhr-settle absolute inset-0">
            <Image
              src={REEL.poster}
              alt=""
              fill
              sizes={sizes}
              loading="eager"
              fetchPriority="high"
              className="object-cover"
            />
            {showVideo && (
              <video
                ref={videoRef}
                src={REEL.src}
                preload="none"
                muted
                loop
                playsInline
                onPlaying={() => setLive(true)}
                className={cn(
                  "absolute inset-0 size-full object-cover transition-opacity duration-500",
                  live ? "opacity-100" : "opacity-0",
                )}
              />
            )}
          </div>

          {/* THE LOCKUP. Centred in the room the card does not occupy, left
              aligned on the frame's own padding, so the type and the QR share
              one edge and the whole hero reads as a single column. */}
          <div
            className="absolute inset-0 flex flex-col justify-center"
            style={{
              padding: f.pad,
              paddingTop: f.pad + HEADER_CLEARANCE[mode],
              paddingBottom: f.pad + (desktop ? 168 : 156),
            }}
          >
            <div className="relative">
              {scrim && (
                <div
                  aria-hidden
                  className={cn(
                    "hhr-type-scrim pointer-events-none absolute",
                    desktop
                      ? "-inset-x-16 -inset-y-14"
                      : "-inset-x-10 -inset-y-10",
                  )}
                />
              )}
              <div className="relative">
                {/* The announcement, in the one place caps belong. */}
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 py-1 pr-3 pl-2.5 backdrop-blur-sm">
                  <span className="relative flex size-1.5 items-center justify-center">
                    <span className="size-1.5 rounded-full bg-white" />
                    {/* Keyed on the shot index: a key change remounts the
                        ring, which restarts the animation. The dot itself
                        never moves, so reduced motion gets a live dot that is
                        simply lit. */}
                    {live && !reduced && (
                      <span
                        key={shot}
                        aria-hidden
                        className="hhr-ping absolute inset-0 rounded-full border border-white"
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "hhr-ink font-medium tracking-[0.14em] text-white/80 uppercase",
                      desktop ? "text-xs" : "text-[11px]",
                    )}
                  >
                    Live demo, scan to try
                  </span>
                </span>

                {/* Rule 13: at paint, at opacity 1, ungated, unanimated. */}
                <h1
                  className={cn(
                    "hhr-ink mt-5 font-heading text-balance text-white",
                    LADDER.xl[mode],
                    // AFTER the ladder class, deliberately: tailwind-merge drops a
                    // leading-* that precedes a text-* size (a font-size utility can
                    // carry a line-height), so the house 1.02 has to come last or it
                    // silently loses to text-8xl's default.
                    "leading-[1.02]",
                    desktop ? "max-w-[19ch]" : "max-w-[15ch]",
                  )}
                >
                  {text.h1}
                </h1>
                <p
                  className={cn(
                    "hhr-ink mt-5 max-w-[34rem] text-balance text-white/90",
                    desktop ? "text-[17px]" : "text-[15px]",
                    // Same ordering trap as the h1 above.
                    "leading-relaxed",
                  )}
                >
                  {text.subhead}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Button
                    asChild
                    size="lg"
                    className={cn(
                      "rounded-action-lg",
                      desktop ? "h-12 px-7 text-base" : "h-11 px-5 text-sm",
                    )}
                  >
                    <Link href={text.primary.href}>{text.primary.label}</Link>
                  </Button>
                  {/* A real button body, not a hairline: over live footage a
                      25 percent edge reads as plain text (the lesson the
                      shipped hero learned at 375). Dark glass plus a 40
                      percent edge, with the solid primary keeping hierarchy. */}
                  <SecondaryCta
                    href={qrUrl}
                    label={text.secondary}
                    desktop={desktop}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* THE ANNOUNCEMENT CARD. Bottom left, on the frame's padding, so it
              sits on the left edge the type already established.
              PRODUCTION WIRING: this is `absolute lg:fixed bottom-8 left-8`
              on the real page, so past the hero it detaches and rides down the
              page with the visitor. The board's stage is a fixed-size canvas
              (fixed would escape it and pin to the browser window), so it
              stays absolute here and the fixed half is a note, not a bluff. */}
          <div
            className="absolute"
            style={{ left: f.pad, bottom: f.pad }}
          >
            <div className="hhr-card flex items-center gap-3.5 border border-white/20 bg-black/45 backdrop-blur-sm">
              <DemoQr url={qrUrl} size={96} />
              <p className="max-w-[10.5rem] text-[13px] leading-snug font-medium text-white">
                Scan it. That is the whole product.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The demo CTA. A Link when a demo is configured, an inert button when it is
 *  not, so the composition never loses a control to an unset env var. */
function SecondaryCta({
  href,
  label,
  desktop,
}: {
  href: string | null;
  label: string;
  desktop: boolean;
}) {
  const className = cn(
    "rounded-action-lg border-white/40 bg-black/40 text-white backdrop-blur-sm hover:border-white/60 hover:bg-black/60 hover:text-white dark:border-white/40 dark:bg-black/40 dark:hover:bg-black/60",
    desktop ? "h-12 px-7 text-base" : "h-11 px-5 text-sm",
  );
  if (!href) {
    return (
      <Button type="button" variant="outline" size="lg" className={className}>
        {label}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline" size="lg" className={className}>
      <Link href={href}>{label}</Link>
    </Button>
  );
}

/** Pause the film in a hidden tab, and nothing else.
 *
 *  Production wiring is useAmbientPause, which adds the two-way offscreen
 *  observer. The lab deliberately does not take it (board.tsx says why: side by
 *  side comparison wants everything running), and there is a second reason
 *  here: an IntersectionObserver never fires in a background tab, so a board
 *  verified through a driven browser would report a hero that never plays.
 */
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

export const reel: Concept = {
  id: "reel",
  n: 2,
  name: "The reel",
  rationale:
    "The hero stops being a backdrop and becomes an object: one film in one frame, inset to the page column, lit from under by its own light, with the promise set over it and no darkening layer anywhere. Bottom left, inside the frame, a real scannable QR sits as the announcement, absolute here and fixed from lg in production, so the thing that starts an album travels with the visitor the whole way down the page.",
  eyebrow:
    "An announcement pill with a live dot that beats on the film's real cuts: Live demo, scan to try.",
  proposed: {
    h1: "The album your guests already made.",
    subhead:
      "One QR at the door. Every photo and video, in one album, by morning.",
    secondary: "Open the live demo",
  },
  departures: [
    "The frame's radius: 24px at 1440, where the house surface token is 2px. A 2px corner on a 1216px object is invisible, so the object reads as a crop of the page rather than a thing on it. Proposed as a real step in the rounding system rather than a literal: --radius-screen, the corner a media object takes once it is big enough to read as a screen.",
    "The same radius goes to zero at 375, on three corners. The frame runs full bleed and under the header and keeps only the bottom pair, so the film gets the whole width and still curves away from the page.",
    "Light on a cinema hero: one spill under the frame, the film's own poster blurred at 42 percent. Rule 10 forbids a shadow on a dark ground and asks for light from under, which leaves a floating object with no depth cue at all unless it is lit. The source is named, and it is the film itself.",
    "The type scrim, off by default and on under the board's toggle: one radial sized to the type block, never over the film. The real answer is the grade (see the asks); this is here so the trade gets ruled rather than assumed.",
    "The ink on the type: a soft shadow on the glyphs themselves, always on. White type over live footage fails at the small sizes first, and the house answer so far has been to dim the photograph, which spends rule 1 on a typography problem. A glyph shadow darkens the two or three pixels around a letterform and nothing else, so the film keeps every pixel it had.",
    "Caps appear once, in the eyebrow pill, and nowhere else. The uppercase display register was considered for the h1 and left: the ruled thesis is a sentence with a full stop, and a register that exists only on the home page is the ladder breaking by another name. Say the word and it flips.",
  ],
  assets: [
    "THE FILM, replacing the stand-in hero-candidate-02 (8.25s, four shots): 15 to 20 seconds of real event moments, fast cuts on the beat, roughly 12 to 18 shots. The shot list that reads best over type: a toast, confetti, the dance floor from above, sparklers, hands in the air, the cake, a phone held up filming, a first dance. Nothing that needs a face in focus to work, because the type sits over the left half.",
    "THE GRADE, and this is the load-bearing ask: cut dark and warm, with the left 55 percent of frame kept in the lower third of the range in every shot. That is what buys a hero with no scrim over the media, which is rule 1 held rather than argued. Highlights are welcome on the right, where the frame is empty.",
    "THE MASTERS: 1920 x 1080, and a 1080 x 1920 crop of the same edit for the phone frame (the composition runs full bleed at 375, so it cannot letterbox). Muted, no audio track at all.",
    "THE FILES: H.264 mp4 under 1.5 MB at 1080, a VP9 webm beside it, and a poster frame exported from the FIRST frame of the graded edit at both aspects, under 120 KB each. The poster is the hero's LCP layer and the frame's light, so it has to carry the grade on its own.",
    "THE CUT LIST: the shot boundary times in seconds, from the edit, for the manifest entry's shotBoundaries. The live dot beats on them, and the shipped hero already derives its active shot from the same numbers, so an edit without them silently loses both.",
  ],
  render: (p) => <ReelHero {...p} />,
};
