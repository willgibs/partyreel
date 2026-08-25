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

import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { MARKETING_REELS } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

/**
 * LOUD (the loud/quiet map): the ruled Direction-B cinema hero over the real
 * rendered engine loop (the F5 hero-substrate lab round, rewritten with
 * reference). The load-bearing mechanics, all red-team-ratified in the plan:
 *
 *  - LCP CONTRACT: the poster is a SERVER-RENDERED next/image layered UNDER
 *    the video, never the <video> poster attribute (the video mounts
 *    post-hydration, so relying on it would regress the LCP element to the
 *    H1). In Next 16 the old `priority` behavior split THREE ways, and
 *    `preload` alone leaves the image lazy (the dev server logs an LCP
 *    warning): the poster needs `preload` + `loading="eager"` +
 *    `fetchPriority="high"` together (/reel-track finding, 2026-08-25). ONLY
 *    this LCP element gets the trio; every other poster on the page stays
 *    lazy. Its wrapper also carries NO reveal attribute: a reveal's initial
 *    opacity delay would suppress the LCP paint.
 *  - The <video> mounts post-hydration with preload="none" muted loop
 *    playsInline; a rejected play() (iOS Low Power Mode, data saver) leaves
 *    the poster standing, never a spinner.
 *  - use-ambient-pause owns the loop-pause contract (offscreen / hidden tab /
 *    reduced motion all pause the mp4); the 12 sections below give the pause
 *    its runway.
 *  - STATELESS shot sync: every presented frame derives the active shot from
 *    currentTime against the manifest's shotBoundaries (never increment, so
 *    the native loop wrap self-heals), via requestVideoFrameCallback
 *    (mediaTime, Safari 15.4+) with an rAF fallback. Segment fills + the mono
 *    timecode write through refs (no re-render per frame); only a shot CHANGE
 *    touches state (the kinetic word needs React).
 *  - The kinetic H1 renders the byte-pinned SITE_THESIS with the ruled slot:
 *    "The whole {word}, in one album." The word cuts WITH the footage via the
 *    WIDTH-ANIMATED Roll (Will's 2026-08-25 ruling replaced the widest-word
 *    reservation: the sentence closes up around each word). Reduced motion is
 *    the static thesis (the word "event"), no cycling, no video.
 */

const SampleReelOverlay = lazy(
  () => import("../shared/sample-reel-overlay.lazy"),
);

function requireReel(id: string) {
  const reel = MARKETING_REELS.find((r) => r.id === id);
  if (!reel) throw new Error(`Unknown marketing reel id: ${id}`);
  return reel;
}

const HERO_REEL = requireReel("hero-candidate-01");

// The ruled thesis splits around its kinetic slot; deriving the halves keeps
// the byte-pinned constant the ONLY copy source (home-sections.test.ts pins
// that this split stays valid). Reduced motion renders the thesis verbatim.
const [THESIS_BEFORE, THESIS_AFTER] = SITE_THESIS.split("event") as [
  string,
  string,
];

const KINETIC_WORDS = ["wedding", "birthday", "festival", "send-off"] as const;

const HERO_EYEBROW = "One QR. No app. No account.";

/** rVFC feature detection without depending on the lib.dom version. */
type VfcVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    cb: (now: number, meta: { mediaTime: number }) => void,
  ) => number;
  cancelVideoFrameCallback?: (id: number) => void;
};

function formatTimecode(t: number, dur: number) {
  const ss = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");
  return `00:${ss(t)} / 00:${ss(Math.round(dur))}`;
}

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
  const [shot, setShot] = useState(0);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const segRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const timeRef = useRef<HTMLSpanElement | null>(null);

  const boundaries = HERO_REEL.shotBoundaries;
  const dur = HERO_REEL.durationSeconds;

  // Post-hydration + full-motion only (SSR/no-JS/reduced ship poster only).
  const showVideo = mounted && !reduced;

  // Transport: play/pause rides the ambient-pause signal.
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

  // The stateless per-frame sync (see the header comment).
  useEffect(() => {
    if (!showVideo) return;
    const v = videoRef.current as VfcVideo | null;
    if (!v) return;
    let raf = 0;
    let vfc = 0;
    let alive = true;

    const sync = (t: number) => {
      let idx = 0;
      for (let i = 0; i < boundaries.length; i++)
        if (t >= boundaries[i]) idx = i;
      setShot((s) => (s === idx ? s : idx));
      boundaries.forEach((b, i) => {
        const fill = segRefs.current[i];
        if (!fill) return;
        const end = i + 1 < boundaries.length ? boundaries[i + 1] : dur;
        const p = t >= end ? 1 : t < b ? 0 : (t - b) / (end - b);
        fill.style.transform = `scaleX(${p})`;
      });
      if (timeRef.current) timeRef.current.textContent = formatTimecode(t, dur);
    };

    if (v.requestVideoFrameCallback && v.cancelVideoFrameCallback) {
      const loop = (_now: number, meta: { mediaTime: number }) => {
        if (!alive) return;
        sync(meta.mediaTime);
        vfc = v.requestVideoFrameCallback!(loop);
      };
      vfc = v.requestVideoFrameCallback(loop);
      return () => {
        alive = false;
        v.cancelVideoFrameCallback?.(vfc);
      };
    }
    const loop = () => {
      if (!alive) return;
      sync(v.currentTime);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [showVideo, boundaries, dur]);

  return (
    <section
      ref={pauseRef}
      data-paused={paused ? "true" : undefined}
      className="relative flex min-h-[calc(100svh-var(--mkt-header-h,4rem))] flex-col justify-end overflow-hidden"
    >
      {/* THE SUBSTRATE SLOT: poster under video (see the header comment). */}
      <div className="absolute inset-0" aria-hidden>
        <Image
          src={HERO_REEL.poster}
          alt=""
          fill
          sizes="100vw"
          preload
          loading="eager"
          fetchPriority="high"
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
        {/* The scrim keeps the lower-third type legible over any footage. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />
      </div>

      <div className="relative">
        <Container className="pt-24 pb-10 sm:pb-14">
          <p className="text-xs font-medium tracking-[0.22em] text-white/60 uppercase">
            {HERO_EYEBROW}
          </p>
          <h1 className="mt-4 max-w-3xl font-heading text-5xl leading-[1.02] text-white sm:text-6xl md:text-7xl">
            {THESIS_BEFORE}
            {/* The accessible sentence stays the static thesis; the kinetic
                slot is presentation only. */}
            <span className="sr-only">event</span>
            <span aria-hidden className="inline-flex align-baseline">
              {reduced ? (
                <span>event</span>
              ) : (
                <RollWord word={KINETIC_WORDS[shot % KINETIC_WORDS.length]} />
              )}
            </span>
            {THESIS_AFTER}
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-pretty text-white/70">
            {SITE_SUBHEAD}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setOverlayOpen(true)}
              className="h-11 gap-2 border-white/25 bg-transparent px-5 text-base text-white hover:bg-white/10 hover:text-white"
            >
              <Play className="size-4 fill-current" />
              Watch a sample reel
            </Button>
          </div>
          <div className="mt-4">
            <DemoCtaLink className="text-white/60 hover:text-white" />
          </div>

          {/* Story-style progress (one segment per shot, boundaries-count) +
              the mono timecode; the sync loop writes both through refs. */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex flex-1 gap-1.5">
              {boundaries.map((b, i) => (
                <span
                  key={b}
                  className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25"
                >
                  <span
                    ref={(el) => {
                      segRefs.current[i] = el;
                    }}
                    className="block h-full w-full origin-left bg-white"
                    style={{ transform: "scaleX(0)" }}
                  />
                </span>
              ))}
            </div>
            <span
              ref={timeRef}
              className="font-mono text-[11px] text-white/50 tabular-nums"
            >
              {formatTimecode(0, dur)}
            </span>
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

/** Roll (the ruled word animation): a vertical swap, outgoing up and fading
 *  beneath the incoming word sliding up from below, both clipped to the line
 *  box. The box WIDTH is measured per word and transitioned alongside the
 *  roll: the old widest-word reservation left "a huge inline gap" on short
 *  words (Will, 2026-08-25); the sentence must close up around each word,
 *  smoothly. Ported from the hero-substrate lab round. */
function RollWord({ word }: { word: string }) {
  const [prev, setPrev] = useState<string | null>(null);
  const [entered, setEntered] = useState(true);
  const [width, setWidth] = useState<number | null>(null);
  const wordRef = useRef(word);
  const sizerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (wordRef.current === word) return;
    setPrev(wordRef.current);
    wordRef.current = word;
    setEntered(false);
    const raf = requestAnimationFrame(() => setEntered(true));
    const done = setTimeout(() => setPrev(null), 340);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [word]);

  // Keep the explicit width synced to the sizer's RENDERED size: measures on
  // the word swap AND re-syncs whenever the sizer's own box changes (a late
  // webfont swap, a breakpoint's font-size change, zoom) via ResizeObserver.
  // Waiting for "the next cycle" to self-correct is not enough here: a paused
  // substrate (play() rejected on Low Power Mode) never advances the word, so
  // a stale measure would leave the H1 clipped indefinitely (caught in the c1
  // verification pass). ceil() guards sub-pixel clipping; the sizer renders
  // inline-block because ResizeObserver never fires for inline boxes.
  useLayoutEffect(() => {
    const sizer = sizerRef.current;
    if (!sizer) return;
    const sync = () => setWidth(Math.ceil(sizer.getBoundingClientRect().width));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(sizer);
    return () => ro.disconnect();
  }, [word]);

  const move =
    "transform 260ms var(--ease-emphasis), opacity 260ms var(--ease-emphasis)";
  return (
    <span
      className="relative inline-block overflow-hidden align-baseline"
      style={{
        width: width === null ? undefined : width,
        transition: "width 260ms var(--ease-emphasis)",
      }}
    >
      {/* The sizer holds the box pre-measure (first paint) and is the
          measuring target after; the explicit width owns layout from then on. */}
      <span
        aria-hidden
        ref={sizerRef}
        className="invisible inline-block whitespace-nowrap"
      >
        {word}
      </span>
      {prev !== null && (
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            transition: move,
            transform: entered ? "translateY(-100%)" : "translateY(0)",
            opacity: entered ? 0 : 1,
          }}
        >
          {prev}
        </span>
      )}
      <span
        className="absolute inset-0"
        style={{
          transition: move,
          transform: entered ? "translateY(0)" : "translateY(100%)",
          opacity: entered ? 1 : 0,
        }}
      >
        {word}
      </span>
    </span>
  );
}
