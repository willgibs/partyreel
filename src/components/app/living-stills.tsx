"use client";

import { useEffect, useState } from "react";

import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { cn } from "@/lib/utils";

/**
 * THE LIVING STILLS: a calm dissolve through a few photographs, as a full background under an
 * overlay. It is how the reel shows its face on the host's side (`reel-host`, Will 2026-09-25):
 * the hub's Reel card once the reel is live (his `reel-front` note on the labelled card: "a more
 * calm living thumbnail behind this card version as a full background with overlay to make the
 * Reel card feel more alive than the rest"), and each dashboard event card in its turn (his
 * `pulse` note, a design tie-in to that card).
 *
 * ★ CALM IS A NUMBER. Four and a half seconds on a still and a 1.4 second dissolve on the
 * emphasis ease: ambient media motion, the rare kind the craft bar lets breathe (bible 5), never
 * the 200 ms a control gets. A card that changed every second would pull the eye off the album
 * it sits above.
 *
 * ★ THREE IMAGES AT MOST, NEVER THE WHOLE SET. Only the still going out, the still on screen and
 * the NEXT one are mounted, so the next is already decoding when its dissolve begins (no blank
 * frame at the handover) and a dashboard of twenty cards holds sixty images, not every still of
 * every event. Keyed by position, so the outgoing still keeps its node and fades rather than
 * vanishing.
 *
 * The component is pure: who advances `at`, and when, is the caller's (`useLivingClock` for one
 * surface on its own clock, the dashboard's cover cycle for a row of cards taking turns).
 */
export function LivingStills({
  stills,
  at,
  className,
}: {
  stills: readonly string[];
  /** Which still is on screen; any integer, read modulo the count. */
  at: number;
  className?: string;
}) {
  const n = stills.length;
  if (n === 0) return null;
  const current = ((at % n) + n) % n;
  const mounted =
    n === 1
      ? [0]
      : [...new Set([(current - 1 + n) % n, current, (current + 1) % n])];
  return (
    <div
      aria-hidden
      data-living={n}
      className={cn("absolute inset-0 overflow-hidden", className)}
    >
      {mounted.map((i) => (
        // eslint-disable-next-line @next/next/no-img-element -- a presigned R2 preview, never optimizable
        <img
          key={i}
          src={stills[i]}
          alt=""
          decoding="async"
          draggable={false}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-[1400ms] ease-emphasis motion-reduce:transition-none",
            i === current ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </div>
  );
}

/** One still holds this long before the next dissolves in. */
export const LIVING_HOLD_MS = 4500;

/**
 * A clock for one living surface: `at` advances every hold while the surface can be seen.
 *
 * ★ IT RUNS ONLY WHERE SOMEONE CAN SEE IT (`useAmbientPause`: on screen, in a visible tab, and
 * never under reduced motion, which holds the first still with its overlay, the card complete at
 * rest). Attach `ref` to the surface.
 */
export function useLivingClock<T extends HTMLElement>(
  count: number,
  holdMs: number = LIVING_HOLD_MS,
) {
  const { ref, paused } = useAmbientPause<T>();
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (paused || count < 2) return;
    // Only the interval's own callback sets state: a clock the effect arms, never a synchronous
    // write in its body.
    const id = window.setInterval(() => setAt((i) => i + 1), holdMs);
    return () => window.clearInterval(id);
  }, [paused, count, holdMs]);
  return { ref, at };
}
