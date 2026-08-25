"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

/**
 * The marketing loop-pause contract (Track B F3): EVERY infinite/ambient animation (conveyor,
 * Ken Burns drift, QR pulse, mp4 loop) pauses when it can't be seen. The lab deliberately never
 * paused (side-by-side comparison wants everything running); production MUST (the T2.5 build note),
 * and the reel player already proved the policy (offscreen IO + document.hidden + reduced motion,
 * `player.tsx`). Composes three signals into one `paused` boolean:
 *   - two-way IntersectionObserver (NOT the one-way reveal hook: loops resume when scrolled back)
 *   - `document.hidden` (background tabs burn battery for nobody)
 *   - `prefers-reduced-motion` (a loop is exactly the motion the preference refuses)
 *
 * Callback-ref, not a mount effect, so late-mounting nodes still get observed (the
 * `use-in-view-sentinel` lesson). Starts paused until the observer proves visibility, so an mp4
 * never plays a frame off-screen. Consumers mirror `paused` to `data-paused` (CSS pauses
 * `animation-play-state`) or call `video.pause()/play()` directly, catching `play()` rejections
 * (iOS Low Power Mode): the poster IS the fallback, never a spinner.
 */
export function useAmbientPause<T extends HTMLElement>(rootMargin = "25%") {
  const reduced = usePrefersReducedMotion();
  const [inView, setInView] = useState(false);
  const [hidden, setHidden] = useState(false);
  const ioRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (el: T | null) => {
      ioRef.current?.disconnect();
      ioRef.current = null;
      if (!el) return;
      const io = new IntersectionObserver(
        (entries) => setInView(entries.some((e) => e.isIntersecting)),
        { rootMargin },
      );
      io.observe(el);
      ioRef.current = io;
    },
    [rootMargin],
  );

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return { ref, paused: reduced || hidden || !inView };
}
