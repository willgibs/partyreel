"use client";

import { Pause, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  MARKETING_REELS,
  type MarketingReel,
} from "@/lib/constants/marketing-media";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * The recurring poster-first reel playback surface: the reel-teaser's inline
 * sample and the hero's sample-reel overlay both render THIS, so the transport
 * contract lives once. Poster (next/image) paints immediately; the <video>
 * mounts only once playback is requested (zero video bytes without intent),
 * fades over the poster on its first frames, and a rejected play() leaves the
 * poster standing, never a spinner. The play/pause badge rides the icon-swap
 * recipe (.mkt-icon-swap, marketing.css chapter 2).
 */

/** Manifest lookup that throws, so a typo'd reel id fails loudly at build. */
export function requireReel(id: string): MarketingReel {
  const reel = MARKETING_REELS.find((r) => r.id === id);
  if (!reel) throw new Error(`Unknown marketing reel id: ${id}`);
  return reel;
}

export function InlineReelPlayer({
  reelId,
  autoStart = false,
  sizes = "(min-width: 768px) 768px, 100vw",
  className,
}: {
  reelId: string;
  /** Start playing on mount (the overlay: opening it IS the user's gesture). */
  autoStart?: boolean;
  sizes?: string;
  className?: string;
}) {
  const reel = requireReel(reelId);
  const reduced = usePrefersReducedMotion();
  const { ref: pauseRef, paused: ambientPaused } =
    useAmbientPause<HTMLDivElement>();
  const [started, setStarted] = useState(autoStart);
  const [userPaused, setUserPaused] = useState(false);
  const [live, setLive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Offscreen/hidden-tab pause WITHOUT the reduced-motion term: playback here
  // is user-INITIATED (poster-first, a tap starts it), which reduced motion
  // does not forbid. The hook folds `reduced` into `paused`, so for
  // reduced-motion users the offscreen signal is unreadable and their explicit
  // playback keeps its own controls instead of auto-pausing offscreen (the
  // accepted edge; the loop is short and muted).
  const offscreen = ambientPaused && !reduced;

  useEffect(() => {
    if (!started) return;
    const v = videoRef.current;
    if (!v) return;
    if (offscreen || userPaused) v.pause();
    else
      v.play().catch(() => {
        // The poster stays (iOS Low Power Mode, data saver); no spinner.
      });
  }, [started, offscreen, userPaused]);

  const playing = started && !userPaused;
  const toggle = () => {
    if (!started) {
      setStarted(true);
      setUserPaused(false);
    } else {
      setUserPaused((p) => !p);
    }
  };

  return (
    <div
      ref={pauseRef}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl bg-gallery",
        reel.orientation === "portrait" ? "aspect-[9/16]" : "aspect-video",
        className,
      )}
    >
      <Image
        src={reel.poster}
        alt=""
        fill
        sizes={sizes}
        className="object-cover"
      />
      {started && (
        <video
          ref={videoRef}
          src={reel.src}
          preload="auto"
          muted
          loop
          playsInline
          onPlaying={() => setLive(true)}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-300",
            live ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause the sample reel" : "Play the sample reel"}
        className="absolute inset-0 flex items-center justify-center"
      >
        <span
          data-state={playing ? "b" : "a"}
          className={cn(
            "mkt-icon-swap size-14 place-items-center rounded-full bg-white/90 text-gallery transition-opacity duration-300",
            // While playing the badge rests hidden; hover/focus surfaces it.
            playing &&
              "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
          )}
        >
          <span
            className="mkt-icon flex items-center justify-center"
            data-icon="a"
          >
            <Play className="size-6 translate-x-0.5 fill-current" />
          </span>
          <span
            className="mkt-icon flex items-center justify-center"
            data-icon="b"
          >
            <Pause className="size-6 fill-current" />
          </span>
        </span>
      </button>
    </div>
  );
}
