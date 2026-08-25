"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { MarketingReel } from "@/lib/constants/marketing-media";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { cn } from "@/lib/utils";

/**
 * The poster-first ambient reel loop (Track B, /reel): the production hero-substrate
 * mechanism from the plan, minus the word sync the home hero adds.
 *
 *  - The POSTER is a next/image rendered in the SSR HTML and layered UNDER the video
 *    (never the <video poster> attribute: the video only starts fetching post-hydration,
 *    so the poster must be the LCP-capable layer). `preloadPoster` marks the ONE
 *    above-the-fold instance (Next 16 renamed `priority` → `preload`).
 *  - The VIDEO ships `preload="none" muted loop playsInline` and is driven imperatively
 *    off use-ambient-pause (offscreen / hidden tab / reduced motion all pause it — the
 *    loop-pause contract). A rejected play() (iOS Low Power Mode, data saver) leaves the
 *    poster standing; never a spinner.
 *  - CLS 0: the wrapper is an aspect-ratio box derived from the manifest orientation.
 *
 * Decorative by contract (aria-hidden, muted, no controls): the surrounding copy carries
 * every fact the loop illustrates.
 */
export function AmbientReelVideo({
  reel,
  preloadPoster = false,
  sizes,
  className,
}: {
  reel: MarketingReel;
  /** True ONLY for the hero instance (it is the page's LCP element). */
  preloadPoster?: boolean;
  /** next/image responsive sizes for the poster. */
  sizes: string;
  className?: string;
}) {
  const { ref, paused } = useAmbientPause<HTMLDivElement>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) {
      v.pause();
    } else {
      v.play().catch(() => {
        // The poster stays (the production contract); autoplay refusal is a valid end state.
      });
    }
  }, [paused]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "relative overflow-hidden",
        reel.orientation === "portrait" ? "aspect-[9/16]" : "aspect-video",
        className,
      )}
    >
      <Image
        src={reel.poster}
        alt=""
        fill
        sizes={sizes}
        preload={preloadPoster}
        className="object-cover"
      />
      <video
        ref={videoRef}
        src={reel.src}
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
    </div>
  );
}
