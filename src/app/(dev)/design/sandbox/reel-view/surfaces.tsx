"use client";

import { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Palette,
  Pause,
  Play,
  Video,
  Wand2,
  X,
} from "lucide-react";

import { GroundBox } from "@/components/lab";
import { GLASS, GLASS_MARK } from "@/lib/glass";
import { CanvasReelPlayer } from "@/lib/reel/engine/player";
import type { Orientation } from "@/lib/reel/engine/constants";
import type { ReelProps } from "@/lib/reel/engine/reel-types";
import { PlayBadge } from "@/components/shared/play-badge";
import { cn } from "@/lib/utils";

import { LATEST_UPLOADER } from "./fixtures";

/**
 * THE VIEW'S OWN PIECES, drawn over the REAL engine.
 *
 * ★ CHROME-LESS BY CONSTRUCTION. Every specimen mounts `CanvasReelPlayer` with
 * `showControls={false}`: the engine's own scrubber is the harness's tool, not
 * the shipped view's, exactly as `guest-reel-overlay.tsx` (this lane's read-only
 * truth) already does. Everything a guest sees around the picture, the close
 * circle, the foot controls, the arrival beat, is drawn here.
 *
 * ★ THE PLAYER'S OWN WIDTH CAP IS NEVER FOUGHT. `player.tsx` hardcodes
 * `max-w-[360px]` portrait / `max-w-[640px]` landscape on its own wrapper (read,
 * never edited), so "full-bleed" here means the DARK BACKDROP and the chrome are
 * full-bleed, exactly as the shipped guest cinema already is; the canvas itself
 * stays the shipped card, height-bound so it never depends on `dvh` (which
 * would read the LAB PAGE's real window, not this board's device box: the
 * `reel-studio` room's own lesson, quoted in its `LitReel` comment).
 */

/* ── the device the reel fills ──────────────────────────────────────────── */

export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v?: string): ScreenId =>
  v === "375" ? "375" : "1440";

export function Screen({
  id,
  screen,
  caption,
  children,
}: {
  id: string;
  screen: ScreenId;
  caption: string;
  children: React.ReactNode;
}) {
  const { w, h, name } = SCREENS[screen];
  return (
    <figure
      data-reel-view-frame={id}
      className="m-0 flex min-w-0 flex-col gap-2"
    >
      <figcaption className="flex flex-col gap-0.5" style={{ width: w }}>
        <span className="text-sm font-medium">{`${w} x ${h}, ${name}`}</span>
        <span className="min-h-[2.75rem] text-[11px] leading-snug text-muted-foreground">
          {caption}
        </span>
      </figcaption>
      <GroundBox
        ground="cinema"
        className="relative overflow-hidden rounded-lg border border-border"
        style={{ width: w, height: h }}
      >
        {children}
      </GroundBox>
    </figure>
  );
}

/* ── the shapes each ask can take ───────────────────────────────────────── */

export type ChromeShape = "bare" | "thin" | "foot";
export type ControlsShape = "row" | "weighted" | "split";
export type ArrivalShape = "caption" | "chip" | "none";
export type TapShape = "lightbox" | "pause" | "none";
export type PostureShape = "follow" | "letterboxed";
export type PaceShape = "quick" | "steady" | "unhurried";
export type LoopShape = "continues" | "breath" | "title";
export type ReducedShape = "paused" | "frame" | "slower";

const pick = <T extends string>(all: readonly T[], v: string | undefined) =>
  all.includes(v as T) ? (v as T) : all[0];

export const chromeOf = (v?: string) => pick(["bare", "thin", "foot"] as const, v);
export const controlsOf = (v?: string) =>
  pick(["row", "weighted", "split"] as const, v);
export const arrivalOf = (v?: string) =>
  pick(["caption", "chip", "none"] as const, v);
export const tapOf = (v?: string) =>
  pick(["lightbox", "pause", "none"] as const, v);
export const postureOf = (v?: string) => pick(["follow", "letterboxed"] as const, v);
export const paceOf = (v?: string) =>
  pick(["quick", "steady", "unhurried"] as const, v);
export const loopOf = (v?: string) =>
  pick(["continues", "breath", "title"] as const, v);
export const reducedOf = (v?: string) =>
  pick(["paused", "frame", "slower"] as const, v);

/** `posture=follow` picks the orientation the SCREEN itself suggests; `letterboxed` stays portrait. */
export function orientationFor(
  posture: PostureShape,
  screen: ScreenId,
): Orientation {
  if (posture === "letterboxed") return "portrait";
  return screen === "1440" ? "landscape" : "portrait";
}

/* ── the idle-fade: chrome answers a REAL pointer, not a description ─────── */

/**
 * Whether the chrome should be UP right now: true on mount (a first frame
 * always carries its chrome for a beat, so a reviewer never lands on a blank
 * frame with no idea one exists), true again for `idleMs` after the last
 * pointer move over the surface, false after. Reduced motion never fades
 * chrome away on its own: a control that vanishes unasked is exactly the
 * motion the setting exists to remove.
 */
function useIdleFade(
  fades: boolean,
  reduced: boolean,
  idleMs = 2200,
): { shown: boolean; onMove: () => void } {
  // Stored as "gone idle yet", never "shown": the exposed value below is
  // DERIVED (`!fades || reduced || !idle`), so the effect never has to set
  // state synchronously just to say "shown" on mount or on a shape change
  // (react-hooks/set-state-in-effect) — only the timeout's OWN callback ever
  // calls setState, which is the async "subscribe to an external clock" case
  // the rule asks for.
  const [idle, setIdle] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  useEffect(() => {
    clear();
    if (fades && !reduced) timer.current = setTimeout(() => setIdle(true), idleMs);
    return clear;
  }, [fades, reduced, idleMs]);

  const onMove = () => {
    if (!fades || reduced) return;
    setIdle(false);
    clear();
    timer.current = setTimeout(() => setIdle(true), idleMs);
  };

  return { shown: !fades || reduced || !idle, onMove };
}

/**
 * A beat that cycles on for `holdMs`, off for `restMs`, so a reviewer watching
 * for a few seconds catches it without needing to trigger anything. Reduced
 * motion holds it ON rather than pulsing (a beat that never resolves is the
 * thing the setting exists to stop).
 */
function useBeat(holdMs: number, restMs: number, reduced: boolean): boolean {
  // Starts true (the initial state, set for free) and the effect only ever
  // ARMS a timer; every setState after that runs inside the timeout's own
  // callback, never synchronously in the effect body. Reduced motion arms
  // nothing at all, so `on` simply stays at its initial true.
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (reduced) return;
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const cycle = (show: boolean) => {
      if (!alive) return;
      setOn(show);
      t = setTimeout(() => cycle(!show), show ? holdMs : restMs);
    };
    t = setTimeout(() => cycle(false), holdMs);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [holdMs, restMs, reduced]);
  return reduced || on;
}

/* ── the picture, height-bound so it never reads a real dvh ──────────────── */

function Picture({
  reelProps,
  landscape,
  frame,
}: {
  reelProps: ReelProps;
  landscape: boolean;
  frame?: number;
}) {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-4">
      <div
        className={cn(
          "flex h-full max-w-full items-center",
          landscape ? "aspect-video" : "aspect-[9/16]",
        )}
      >
        <CanvasReelPlayer
          reelProps={reelProps}
          showControls={false}
          frame={frame}
        />
      </div>
    </div>
  );
}

/* ── the close circle: ALWAYS reachable, never gated by the chrome's fade ── */

function CloseCircle() {
  return (
    <span
      className={cn(
        "absolute top-3 right-3 z-30 flex size-9 items-center justify-center rounded-full text-white/85",
        GLASS,
      )}
    >
      <X className="size-4" aria-hidden />
    </span>
  );
}

/* ── the arrival beat: "just added by <name>" ─────────────────────────────── */

function ArrivalBeat({ shape, show }: { shape: ArrivalShape; show: boolean }) {
  if (shape === "none") return null;
  const common =
    "z-20 rounded-full px-3.5 py-1.5 text-[12px] font-medium text-white transition-opacity duration-300 ease-emphasis motion-reduce:transition-none";
  if (shape === "chip")
    return (
      <span
        data-reel-view-arrival="chip"
        className={cn(
          "absolute top-3 left-3",
          common,
          GLASS_MARK,
          show ? "opacity-100" : "opacity-0",
        )}
      >
        {LATEST_UPLOADER}
      </span>
    );
  return (
    <span
      data-reel-view-arrival="caption"
      className={cn(
        "absolute inset-x-0 top-[64%]",
        common,
        GLASS_MARK,
        "mx-auto block w-fit max-w-[80%] text-center",
        show ? "opacity-100" : "opacity-0",
      )}
    >
      Just added by {LATEST_UPLOADER}
    </span>
  );
}

/* ── the loop's own turn: nothing, a breath, or a title card ──────────────── */

function LoopBeat({
  shape,
  show,
  eventName,
}: {
  shape: LoopShape;
  show: boolean;
  eventName: string;
}) {
  if (shape === "continues") return null;
  if (shape === "breath")
    return (
      <span
        data-reel-view-loop="breath"
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-20 bg-[oklch(0.07_0_0)] transition-opacity duration-500 ease-emphasis motion-reduce:transition-none",
          show ? "opacity-90" : "opacity-0",
        )}
      />
    );
  return (
    <div
      data-reel-view-loop="title"
      className={cn(
        "pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[oklch(0.07_0_0)] transition-opacity duration-500 ease-emphasis motion-reduce:transition-none",
        show ? "opacity-100" : "opacity-0",
      )}
    >
      <p className="px-6 text-center font-heading text-subsection text-white">
        {eventName}
      </p>
    </div>
  );
}

/* ── the tap hint: an annotation, never a change to the real gesture engine ── */

const TAP_LABEL: Record<TapShape, string> = {
  lightbox: "Tap: opens in the lightbox",
  pause: "Tap: pauses in place",
  none: "Tap: does nothing",
};

function TapHint({ shape }: { shape: TapShape }) {
  return (
    <span
      aria-hidden
      data-reel-view-tap={shape}
      className="pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/35 px-3 py-1.5 text-[11px] font-medium tracking-wide text-white/70 uppercase"
    >
      {TAP_LABEL[shape]}
    </span>
  );
}

/* ── the control dock, in its three arrangements ──────────────────────────── */

function Pill({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-medium whitespace-nowrap text-white",
        accent ? "bg-reel" : GLASS,
      )}
    >
      {children}
    </span>
  );
}

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-white",
        GLASS,
      )}
    >
      {children}
    </span>
  );
}

/** The five foot controls, Close excluded (it keeps its own corner, every arrangement). */
function Utility({ playing }: { playing: boolean }) {
  return (
    <>
      <IconChip>
        {playing ? (
          <Pause className="size-4" aria-hidden />
        ) : (
          <Play className="size-4" aria-hidden />
        )}
      </IconChip>
      <IconChip>
        <Video className="size-4" aria-hidden />
      </IconChip>
      <IconChip>
        <Palette className="size-4" aria-hidden />
      </IconChip>
    </>
  );
}

function Verbs() {
  return (
    <>
      <Pill>
        <ImagePlus className="size-3.5" aria-hidden />
        Add yours
      </Pill>
      <Pill accent>
        <Wand2 className="size-3.5" aria-hidden />
        Make your own
      </Pill>
    </>
  );
}

export function ControlDock({
  shape,
  playing,
}: {
  shape: ControlsShape;
  playing: boolean;
}) {
  if (shape === "row")
    return (
      <div
        data-reel-view-controls="row"
        className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-center gap-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <Utility playing={playing} />
        <Verbs />
      </div>
    );
  if (shape === "split")
    return (
      <>
        <div
          data-reel-view-controls="split-utility"
          className="absolute top-3 left-3 z-30 flex items-center gap-1.5"
        >
          <Utility playing={playing} />
        </div>
        <div
          data-reel-view-controls="split-verbs"
          className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-center gap-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <Verbs />
        </div>
      </>
    );
  return (
    <div
      data-reel-view-controls="weighted"
      className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center gap-1.5">
        <Utility playing={playing} />
      </div>
      <div className="flex w-full max-w-xs items-center gap-2">
        <span className="flex-1">
          <Pill>
            <ImagePlus className="size-3.5" aria-hidden />
            Add yours
          </Pill>
        </span>
        <span className="flex-1">
          <Pill accent>
            <Wand2 className="size-3.5" aria-hidden />
            Make your own
          </Pill>
        </span>
      </div>
    </div>
  );
}

/* ── the whole view, over the real engine ─────────────────────────────────── */

export function ReelViewSurface({
  reelProps,
  landscape,
  chrome,
  controls,
  arrival = "none",
  tap = "lightbox",
  loop = "continues",
  eventName,
  reduced = false,
  forceChromeUp = false,
}: {
  reelProps: ReelProps;
  landscape: boolean;
  chrome: ChromeShape;
  controls: ControlsShape;
  arrival?: ArrivalShape;
  tap?: TapShape;
  loop?: LoopShape;
  eventName: string;
  /** The reviewer's own OS setting, read once by the caller (`usePrefersReducedMotion`). */
  reduced?: boolean;
  /** `controls` and `tap` ask a question a hidden dock cannot answer: force it up. */
  forceChromeUp?: boolean;
}) {
  const fades = !forceChromeUp && chrome !== "foot";
  const idle = useIdleFade(fades, reduced);
  const level: "none" | "thin" | "full" = forceChromeUp
    ? "full"
    : chrome === "foot"
      ? "full"
      : idle.shown
        ? "full"
        : chrome === "thin"
          ? "thin"
          : "none";
  const arrivalOn = useBeat(2600, 5200, reduced);
  const loopOn = useBeat(1500, 7000, reduced);

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[oklch(0.09_0_0)]"
      onPointerMove={idle.onMove}
      onMouseMove={idle.onMove}
    >
      <Picture reelProps={reelProps} landscape={landscape} />
      <LoopBeat shape={loop} show={loopOn} eventName={eventName} />
      <ArrivalBeat shape={arrival} show={arrivalOn} />
      <TapHint shape={tap} />
      <CloseCircle />
      {level === "full" && <ControlDock shape={controls} playing />}
      {level === "thin" && (
        <div
          data-reel-view-controls="thin"
          className="absolute inset-x-0 bottom-4 z-30 flex justify-center"
        >
          <span
            className={cn(
              "flex h-7 items-center gap-2 rounded-full px-3 text-white/80",
              GLASS,
            )}
          >
            <Play className="size-3" aria-hidden />
            <span className="h-1 w-16 overflow-hidden rounded-full bg-white/25">
              <span className="block h-full w-2/3 rounded-full bg-white/70" />
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

/** A single frozen frame with only the shared play mark: no chrome at all. */
export function ReelPosterFrame({
  reelProps,
  landscape,
}: {
  reelProps: ReelProps;
  landscape: boolean;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[oklch(0.09_0_0)]">
      <Picture reelProps={reelProps} landscape={landscape} frame={0} />
      <PlayBadge size="lg" />
    </div>
  );
}

/** Frame 0, but the view's OWN chrome is already up (the shipped guest overlay's own reduced-motion state). */
export function ReelPausedWithControls({
  reelProps,
  landscape,
  controls,
}: {
  reelProps: ReelProps;
  landscape: boolean;
  controls: ControlsShape;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[oklch(0.09_0_0)]">
      <Picture reelProps={reelProps} landscape={landscape} frame={0} />
      <CloseCircle />
      <ControlDock shape={controls} playing={false} />
    </div>
  );
}
