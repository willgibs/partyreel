"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import { LIVING_STILLS } from "./fixtures";

/**
 * THE LIVING THUMBNAIL: his hub note ("a more calm living thumbnail behind
 * this card version as a full background with overlay") and his album tile's
 * `crossfade`, one mechanism wherever the reel shows its face on the host's
 * side: the Reel card, the reel's own card on the page, the progression's band
 * and the dashboard's cover.
 *
 * ★ CALM IS A NUMBER HERE. Four and a half seconds on each still and a 1.4
 * second dissolve, on the custom ease: ambient media motion, the rare kind the
 * craft bar allows to breathe (bible 5), never the 200 ms a control gets. A
 * tile that changed every second would be the busy version he turned down.
 *
 * ★ REDUCED MOTION HOLDS THE FIRST STILL, AND NOTHING ELSE CHANGES. The layers
 * stay mounted and the clock never starts (bible 5), so a reader who asked for
 * less motion still sees the card as a picture with its overlay, and the box a
 * decision is judged on never moves.
 */

const REDUCED = "(prefers-reduced-motion: reduce)";

export function usePrefersReduced(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(REDUCED);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(REDUCED).matches,
    () => true,
  );
}

const HOLD_MS = 4500;

export function Living({
  stills = LIVING_STILLS,
  className,
}: {
  stills?: readonly string[];
  className?: string;
}) {
  const reduced = usePrefersReduced();
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (reduced || stills.length < 2) return;
    // Only the interval's own callback sets state: a clock the effect arms,
    // never a synchronous write in its body.
    const id = window.setInterval(
      () => setAt((i) => (i + 1) % stills.length),
      HOLD_MS,
    );
    return () => window.clearInterval(id);
  }, [reduced, stills.length]);
  return (
    <div
      data-rh-living={stills.length}
      aria-hidden
      className={cn("absolute inset-0 overflow-hidden", className)}
    >
      {stills.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- a local fixture still
        <img
          key={`${src}-${i}`}
          src={src}
          alt=""
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-[1400ms] ease-emphasis motion-reduce:transition-none",
            i === (reduced ? 0 : at) ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </div>
  );
}

/**
 * Two pips for a count toward the minimum of two: filled for each photo there
 * is. A number a host reads in half a glance, never a percentage bar pretending
 * a two-step path is long.
 */
export function Pips({
  have,
  of,
  tone = "light",
}: {
  have: number;
  of: number;
  tone?: "light" | "ink";
}) {
  return (
    <span data-rh-pips={`${have}/${of}`} className="flex items-center gap-1">
      {Array.from({ length: of }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-4 rounded-full",
            tone === "light"
              ? i < have
                ? "bg-white"
                : "bg-white/30"
              : i < have
                ? "bg-foreground"
                : "bg-foreground/20",
          )}
        />
      ))}
    </span>
  );
}
