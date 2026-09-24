/**
 * THE SURFACE PACING — ONE factor, three effects (the live reel, 2026-09-22).
 *
 * Will's shape: "faster-paced slideshow", and the reel plays in two places that want different
 * speeds — a phone in a hand, where a viewer is scrolling and a clip has seconds to land, and a
 * television across a room, where the same pacing reads as a strobe. The plan's call: "the hand
 * faster than the wall; the exact seconds are the reel-view and reel-screen boards' knobs,
 * prototyped, never planned." So this module owns the FACTOR and not the seconds: the boards tune
 * `holdScale` on top of it and their verdicts move the numbers here at the wiring.
 *
 * ★ ONE FACTOR, NOT THREE KNOBS. It scales the photo hold, EVERY transition's duration, and the
 * video window together. Scaling only the hold is what would break the engine: planReel's clamp
 * keeps a clip longer than its adjacent gaps, so a hold squeezed under a fixed transition length
 * silently stops shrinking (the reel refuses to get faster) or, worse, drives the three-layer
 * condition timeline.ts names. Scaled together, the whole edit keeps its proportions and the guard
 * (layout.ts's LAYER_GUARD_FRAMES) never binds: the rhythm is the same film, run faster.
 *
 * Pure: no DOM, no React. The theme it returns is a COPY, so the shared kits in themes.ts are never
 * mutated by a viewer's knob.
 */

import type { ReelTheme } from "@/lib/reel/engine/reel-types";

/** Where the reel is playing. A phone or a laptop's tile is a "hand"; a venue screen is a "wall". */
export type Surface = "hand" | "wall";

/**
 * The surface factor. The wall is the kits' own pacing (1: ~2.5-2.9s holds, the moods as designed);
 * the hand runs at 0.7, which lands the default mood near 1.9s — quick enough to read as a montage
 * on a small screen without becoming a flicker book. Both are starting points for the boards.
 */
export const SURFACE_FACTORS: Record<Surface, number> = {
  hand: 0.7,
  wall: 1,
};

export const DEFAULT_SURFACE: Surface = "hand";

/** The video window at factor 1 (the plan's six seconds); `reel-engine-video` reads it through here. */
export const BASE_VIDEO_WINDOW_SEC = 6;

/**
 * The knob's safe range. Outside it the reel is either a slideshow of stills or a strobe.
 *
 * ★ THE CEILING IS SIX, NOT THREE (reel-guest-wiring, 2026-09-24). The view's Hold control takes
 * ABSOLUTE seconds (Will's `pacing=unhurried`, amended: "3 seconds the default, but this should be
 * adjustable"), converted per mood into this factor (lib/guest/reel-prefs.ts's `holdScaleFor`),
 * and the slowest step, 7 s, on the fastest mood (Kinetic holds 1.4 s) is a factor of 5. A ceiling
 * of three silently capped that viewer at 4.2 s. The edit keeps its proportions at any factor (the
 * header), so the widened range is a slower film, never a broken one.
 */
const MIN_SCALE = 0.25;
const MAX_SCALE = 6;

/** The one factor: the surface's own, times the board knob's multiplier (default 1). */
export function pacingFactor(surface: Surface, holdScale = 1): number {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, holdScale));
  return (SURFACE_FACTORS[surface] ?? SURFACE_FACTORS.wall) * scale;
}

/**
 * The theme this surface plays: the same kit with its hold, and every transition in its palette,
 * scaled by the one factor. A "cut" (durationSec 0) stays a cut — zero scales to zero and layout.ts
 * gives it its two frames either way.
 */
export function pacedTheme(
  theme: ReelTheme,
  surface: Surface,
  holdScale = 1,
): ReelTheme {
  const factor = pacingFactor(surface, holdScale);
  if (factor === 1) return theme;
  return {
    ...theme,
    photoHoldSec: theme.photoHoldSec * factor,
    transitions: theme.transitions.map((spec) => ({
      ...spec,
      durationSec: spec.durationSec * factor,
    })),
  };
}

/** How long a video clip plays with motion on this surface (the range-window reader's ask). */
export function videoWindowSec(surface: Surface, holdScale = 1): number {
  return BASE_VIDEO_WINDOW_SEC * pacingFactor(surface, holdScale);
}
