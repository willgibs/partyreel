"use client";

import { useAmbientPause } from "@/lib/shared/use-ambient-pause";

/**
 * The "scan me" ring on the conference badge's QR plate (chapter-1
 * [data-mkt-pulse], the marketing QR vocabulary). RARE-frequency motion: one
 * hero artifact per page, so it earns a loop where a repeated element would
 * not.
 *
 * Rides the loop-pause contract itself (its own IntersectionObserver mirrors
 * `paused` onto the animating element) instead of asking the server-rendered
 * badge to become a client island. use-ambient-pause folds reduced motion in,
 * and marketing.css drops the animation under `prefers-reduced-motion: reduce`
 * anyway, so the preference is honored twice over.
 */
export function ScanPulseRing() {
  const { ref, paused } = useAmbientPause<HTMLSpanElement>();
  return (
    <span
      ref={ref}
      aria-hidden
      data-mkt-pulse=""
      data-paused={paused ? "true" : undefined}
      className="pointer-events-none absolute inset-0 rounded-lg"
    />
  );
}
