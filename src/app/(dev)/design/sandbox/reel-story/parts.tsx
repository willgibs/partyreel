"use client";

import { Play } from "lucide-react";
import { type ReactNode, type RefObject, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * THE BOARD'S SHARED PIECES: whether a drawing is off the stage, the reel
 * door's chip as the wiring round draws it, and a caption's pixels.
 */

/**
 * WHETHER THIS DRAWING IS OFF THE STAGE. The step draws every option at once
 * and hides all but one (`design.css`: `visibility: hidden` in one grid cell),
 * which an IntersectionObserver still counts as on screen, so four loops
 * would run for the one a reader sees. The step marks a hidden option
 * `data-paused` for exactly this (the Stage reads it); a drawing lives in a
 * frame's document, so it finds that mark through the frame's own element.
 */
export function useOffStage(ref: RefObject<HTMLElement | null>): boolean {
  const [off, setOff] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const frame = el.ownerDocument.defaultView?.frameElement ?? null;
    const view = (frame ?? el).closest("[data-lab-view]");
    if (!view) return;
    const sync = () => setOff(view.hasAttribute("data-paused"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(view, { attributes: true, attributeFilter: ["data-paused"] });
    return () => mo.disconnect();
  }, [ref]);
  return off;
}

/** The loop's progress: the view's `Timeline`, a transform on a track. */
function Track({
  progress,
  className,
}: {
  progress: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative h-1 flex-1 overflow-hidden rounded-full bg-white/25",
        className,
      )}
    >
      <span
        className="absolute inset-0 origin-left rounded-full bg-white/85"
        style={{ transform: `scaleX(${progress})` }}
      />
    </span>
  );
}

/**
 * THE REEL DOOR'S CHIP, AS THE WIRING ROUND DRAWS IT: the view's resting bar
 * in miniature, a play glyph and a progress track with no length on it (the
 * live reel has no end, so "0:08" was a stored render's).
 */
export function BarChip() {
  return (
    <DoorChip>
      <Play className="size-3 fill-white" />
      <Track progress={0.42} className="w-7 flex-none" />
    </DoorChip>
  );
}

/** One small chip in the feature doors' own register (`feature-door.tsx`'s
 *  `Chip`: white on a dark wash), redrawn because the shipped one is local. */
function DoorChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-black/55 px-2 text-micro font-medium text-white backdrop-blur-sm">
      {children}
    </span>
  );
}

/** A caption quoting the frame's own measurements, never a literal. */
export function px(n: number): string {
  return `${Math.round(n)}px`;
}
