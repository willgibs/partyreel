"use client";

import type { ReactNode } from "react";

import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

type ConveyorProps = {
  children: ReactNode;
  /** The clipping viewport. */
  className?: string;
  /**
   * Classes on EACH of the two copies (gap + trailing padding). The trailing
   * pr-* must equal the internal gap or the -50% wrap shows a seam — which is
   * why the copies carry the gap instead of the track (a track-level gap sits
   * BETWEEN the copies and shifts the wrap point off by gap/2).
   */
  copyClassName?: string;
};

/**
 * The marquee shell (Track B system layer): the film-strip / cover-filmstrip
 * conveyor. Renders its children TWICE (the duplicate aria-hidden) on a
 * [data-mkt-marquee] track (marketing.css chapter 1: 32s linear, translateX
 * -50%, linear on purpose — ambient motion stays linear) and OWNS the
 * loop-pause contract: useAmbientPause mirrors offscreen/hidden/reduced onto
 * data-paused, which freezes the animation. Reduced motion never mounts the
 * marquee at all — a static single row (the duplicate would be noise).
 */
export function Conveyor({
  children,
  className,
  copyClassName = "gap-4 pr-4",
}: ConveyorProps) {
  const { ref, paused } = useAmbientPause<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return (
      <div className={cn("overflow-hidden", className)}>
        <div className={cn("flex w-max items-center", copyClassName)}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <div
        data-mkt-marquee
        data-paused={paused ? "true" : "false"}
        className="flex w-max"
      >
        <div className={cn("flex w-max items-center", copyClassName)}>
          {children}
        </div>
        <div
          aria-hidden
          className={cn("flex w-max items-center", copyClassName)}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
