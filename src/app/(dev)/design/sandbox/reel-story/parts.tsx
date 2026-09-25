"use client";

import { Pause, Play, X } from "lucide-react";
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import type { Orientation } from "@/lib/reel/engine/constants";
import { LiveReelPlayer } from "@/lib/reel/engine/player-live";
import { createClipSource } from "@/lib/reel/live/source";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import {
  DEMO_EVENT_ID,
  DEMO_ITEMS,
  LIVE_HOLD_SCALE,
  LIVE_STYLE_ID,
} from "./fixtures";

/**
 * THE BOARD'S SHARED PIECES: the live reel on the real engine, and the view's
 * own chrome at rest, drawn from the shipped parts.
 */

/**
 * WHETHER THIS DRAWING IS OFF THE STAGE. The step draws every option at once
 * and hides all but one (`design.css`: `visibility: hidden` in one grid cell),
 * which an IntersectionObserver still counts as on screen, so four players
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

/**
 * THE DEMO ALBUM'S LIVE REEL, ON THE REAL ENGINE: the same `LiveReelPlayer`
 * and clip source the guest's full-screen view mounts (`live-reel-view.tsx`),
 * at the view's own look (the default mood and hold, the wall surface), over
 * the board's album.
 *
 * ★ ONE SOURCE PER PLAYER. A source owns its windows and their bitmap retains
 * (`live/source.ts`), and the harness swaps players over one source rather
 * than running two at once, so every mount builds its own. Every source shares
 * one event id, so every option plays the same take.
 *
 * ★ THE PLAY STATE IS OURS, SO REDUCED MOTION IS TOO. Passing `paused` hands
 * the player's control to the caller (its own doc), so the reader's preference
 * is honoured here: under reduced motion the reel holds its first frame, the
 * view's own still state; off the stage it holds wherever it was.
 *
 * `fill` covers the box the way the view covers a screen; `maxDim` caps the
 * backing store (the album tile's thumb path).
 */
export function DemoReel({
  orientation,
  maxDim = 1280,
  className,
}: {
  orientation: Orientation;
  maxDim?: number;
  className?: string;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const off = useOffStage(box);
  const reduced = usePrefersReducedMotion();
  const source = useMemo(
    () => createClipSource({ eventId: DEMO_EVENT_ID, items: DEMO_ITEMS }),
    [],
  );
  return (
    <div ref={box} className={cn("absolute inset-0", className)}>
      <LiveReelPlayer
        source={source}
        styleId={LIVE_STYLE_ID}
        surface="wall"
        holdScale={LIVE_HOLD_SCALE}
        orientation={orientation}
        maxDim={maxDim}
        paused={off || reduced}
        fill
        className="absolute inset-0"
      />
    </div>
  );
}

/**
 * THE VIEW'S CHROME AT REST, from its shipped parts (`live-reel-view.tsx`):
 * Close top right in the glass circle, and the slim bar at the foot, play and
 * progress in a 132 by 34 pill, which a pointer grows into the dock. The dock
 * itself opens radix menus, which would portal out of a frame, so the board
 * draws the rest state the view settles into and nothing that opens.
 */
export function ViewRest({
  onClose,
  progress = 0.36,
}: {
  onClose?: () => void;
  progress?: number;
}) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent"
      />
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={cn(
          "absolute top-3 right-3 z-30 flex size-10 items-center justify-center rounded-full text-white outline-none",
          "transition-transform duration-150 ease-emphasis active:scale-[0.94] motion-reduce:active:scale-100",
          "focus-visible:ring-2 focus-visible:ring-white/70",
          GLASS,
        )}
      >
        <X className={cn("size-4", GLASS_MARK_LIT)} aria-hidden />
      </button>
      <RestBar
        progress={progress}
        className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2"
      />
    </>
  );
}

/** The slim bar alone: the view's resting control, play and progress. */
export function RestBar({
  progress,
  className,
}: {
  progress: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-[34px] w-[132px] items-center gap-2.5 px-3.5 text-white",
        GLASS,
        className,
      )}
      style={{ borderRadius: 17 }}
    >
      <Pause className={cn("size-3 fill-white", GLASS_MARK_LIT)} />
      <Track progress={progress} />
    </span>
  );
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
 * THE REEL DOOR'S CHIP, WHERE ITS DURATION WAS. The shipped chip is a play
 * glyph and "0:08", a stored render's length; the live reel has no length and
 * no end. What its surface really draws at rest is the view's slim bar, so the
 * chip is that bar in miniature: a play glyph and a progress track, no number.
 */
export function BarChip() {
  return (
    <DoorChip>
      <Play className="size-3 fill-white" />
      <Track progress={0.42} className="w-7 flex-none" />
    </DoorChip>
  );
}

/** The arrival beat the view draws top left ("Theo Calder +2"), as a chip. */
export function ArrivalChip({ name, extra }: { name: string; extra: number }) {
  return (
    <DoorChip>
      <span className="relative flex size-1.5">
        <span className="absolute inset-0 rounded-full bg-reel/70" />
        <span className="relative size-1.5 rounded-full bg-reel" />
      </span>
      {extra > 0 ? `${name} +${extra}` : name}
    </DoorChip>
  );
}

/** One small chip in the feature doors' own register (`feature-door.tsx`'s
 *  `Chip`: white on a dark wash), redrawn because the shipped one is local. */
export function DoorChip({ children }: { children: ReactNode }) {
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
