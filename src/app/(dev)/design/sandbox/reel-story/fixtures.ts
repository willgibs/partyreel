import type { GridMedia } from "@/components/app/media-grid";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import type { ReelProps } from "@/lib/reel/engine/reel-types";

import { EVENT, GALLERY_ITEMS } from "../gallery-fixtures";

/**
 * THE DEMO ALBUM'S OWN TAKE, DRAWN BY THE REAL ENGINE.
 *
 * ★ THE SAME STAND-IN EVERY REEL-ROUND BOARD PLAYS. `gallery-fixtures.ts` is
 * the one shared album (Mia & Theo's Wedding), never duplicated
 * (`reel-view`'s own fixtures.ts carries the identical note): eighteen
 * approved items, the same uploaders. This board's `teaser` and `events`
 * asks read it as the marketing site's own demo album, exactly the framing
 * `reel-teaser.tsx` and `event-door.tsx` already give a rendered stand-in
 * today.
 *
 * `buildReelProps` is the same pure builder the shipped Studio, the render
 * service and the live player all call: a `ReelProps` object built here is
 * drawn by the same `drawReelFrame` every other surface uses, so a specimen
 * mounted with it is not a picture of the engine, it is the engine.
 *
 * The style is a stand-in, named as one: "Cinematic" (`classic`) is today's
 * default mood, the safest constant across boards; the ruling's own default
 * is "a new loop-tuned mood" nothing has designed yet. No ask on this board
 * is about which mood plays.
 */

const REEL_SEED = 240_926;
const STYLE_ID = "classic";

const ORDERED_IDS = GALLERY_ITEMS.map((m: GridMedia) => m.id);
const BY_ID = new Map(GALLERY_ITEMS.map((m: GridMedia) => [m.id, m]));

export const DEMO_REEL_LANDSCAPE: ReelProps = buildReelProps({
  orderedIds: ORDERED_IDS,
  byId: BY_ID,
  styleId: STYLE_ID,
  seed: REEL_SEED,
  orientation: "landscape",
  watermark: false,
});

export const DEMO_REEL_PORTRAIT: ReelProps = buildReelProps({
  orderedIds: ORDERED_IDS,
  byId: BY_ID,
  styleId: STYLE_ID,
  seed: REEL_SEED,
  orientation: "portrait",
  watermark: false,
});

export { EVENT };

/* ── the shared screen knob every ask carries (`configs: [SCREEN]` in spec.ts) ── */

export type ScreenId = "1440" | "375";
export const screenOf = (v?: string): ScreenId => (v === "375" ? "375" : "1440");
export const phoneOf = (screen: ScreenId): boolean => screen === "375";
