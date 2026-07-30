"use client";

/**
 * The RATIFIED reveal grammar's numbers, in ONE place.
 *
 * The composite reveal (the beat where a host's reel first exists) was ruled by
 * Will at T1 and ratified AS-BUILT at T2, so these values are CLOSED: they are
 * transplanted verbatim from the design lab (reel-reveal-variants.tsx `TUNE_MS`
 * + reel-experience-shared.tsx `RXP_TUNE_MS`) and are NOT to be re-tuned as part
 * of a build. Retiming is a deliberate design decision on the tuner, followed by
 * baking the new value in three places at once (see the contract below).
 *
 * THE THREE-PLACE CONTRACT (docs/systems/design-system.md, the motion tuner):
 *   1. globals.css `:root` bakes the value  → the live default
 *   2. the `var(--tune-x, <fallback>)` in globals.css mirrors it → tuner no-op
 *      until a slider moves
 *   3. these constants mirror it → the JS-timed act holds match the CSS exactly
 *   (+ motion-tuner-config.ts `default` mirrors it, so the panel opens at live)
 * Change one, change all four.
 */

import { readCssMs } from "@/lib/shared/read-css-ms";
import type { ActScript } from "@/lib/shared/use-reveal-acts";

/** The CLOSED composite-reveal beats (T2-ratified). */
export const RVL_MS = {
  "--tune-rvl-fly-ms": 640, // per-tile assembly flight
  "--tune-rvl-stagger-ms": 42, // per-tile flight delay step
  "--tune-rvl-hold-ms": 700, // the stack hold before the flash
  "--tune-rvl-flash-ms": 360, // the camera flash
  "--tune-rvl-expand-ms": 720, // the full-bleed expansion
  "--tune-rvl-title-ms": 1700, // the title hold
} as const;

/** The reel-experience beats (publish flourish + sheets/swaps). */
export const RXP_MS = {
  "--tune-rxp-pub-ms": 700, // the publish flourish (bloom / canvas glow)
  "--tune-rxp-sheet-ms": 260, // studio sheets + content swaps (under the 300ms ceiling)
} as const;

export const rvlMs = (v: keyof typeof RVL_MS) => readCssMs(v, RVL_MS[v]);
export const rxpMs = (v: keyof typeof RXP_MS) => readCssMs(v, RXP_MS[v]);

/** The composite's acts, in order. */
export type RevealAct =
  | "gather"
  | "condense"
  | "held"
  | "ignite"
  | "open"
  | "title"
  | "settled";

/**
 * The screen's birth pose = the tile stack's footprint (ONE shared scale, so the
 * camera flash covers a same-size swap): 55% of the full-bleed width, centered.
 */
export const REVEAL_FROM_SCALE = 0.55;

/** The seeded scatter the flying copies wear at the stack (determinism is the
 *  house rule — this is a fixed table, never Math.random). Indexed modulo, so
 *  it serves any number of tiles. */
export const REVEAL_SCATTER_DEG = [-6, 4, -2, 7, -5, 2, -8, 5];

/**
 * The beat script, built FRESH each run so a tuner drag retimes the next play.
 * Derived holds carry small margins with reasons, not magic: the gather hold
 * covers the LAST tile's landing (flight + final stagger step) plus a settle
 * breath; the open hold ends slightly BEFORE the expansion lands so the title
 * enters "as it reaches full screen" (the ruling's words), not after a dead stop.
 */
export function compositeScript(tileCount: number): ActScript<RevealAct> {
  const fly = rvlMs("--tune-rvl-fly-ms");
  const stagger = rvlMs("--tune-rvl-stagger-ms");
  const expand = rvlMs("--tune-rvl-expand-ms");
  return [
    { act: "gather", holdMs: fly + stagger * Math.max(0, tileCount - 1) + 60 },
    { act: "condense", holdMs: 360 }, // the squaring beat (320ms move + settle)
    { act: "held", holdMs: rvlMs("--tune-rvl-hold-ms") },
    { act: "ignite", holdMs: rvlMs("--tune-rvl-flash-ms") },
    { act: "open", holdMs: Math.max(expand - 90, 120) },
    { act: "title", holdMs: rvlMs("--tune-rvl-title-ms") },
    { act: "settled", holdMs: 0 },
  ];
}

/**
 * Reduced motion keeps the NARRATIVE as plain fades (the reduce CSS strips every
 * transform): the reel arrives full bleed, the title names the event, then
 * settled with the player paused on frame 0, play one tap away. Fixed holds on
 * purpose — the tunable beats describe MOVEMENT that no longer happens.
 */
export const COMPOSITE_REDUCED: ActScript<RevealAct> = [
  { act: "open", holdMs: 700 },
  { act: "title", holdMs: 1600 },
  { act: "settled", holdMs: 0 },
];

/**
 * When the reel starts MOVING: at the expansion. The flash covers the
 * stack-to-canvas swap on frame 0, then the still takes breath AS it scales, so
 * full bleed arrives already alive.
 */
export const COMPOSITE_RELEASED = new Set<RevealAct | "idle">([
  "open",
  "title",
  "settled",
]);
