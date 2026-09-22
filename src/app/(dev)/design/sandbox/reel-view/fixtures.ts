import type { GridMedia } from "@/components/app/media-grid";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import type { Orientation } from "@/lib/reel/engine/constants";
import type { ReelProps, ReelTheme } from "@/lib/reel/engine/reel-types";

import { EVENT, GALLERY_ITEMS } from "../gallery-fixtures";

/**
 * ONE ALBUM, AND EVERY REEL THIS BOARD PLAYS OVER IT.
 *
 * ★ THE SAME WORLD MEDIA-VIEWER USES. `gallery-fixtures.ts` is the one shared
 * album (Mia & Theo's Wedding), never duplicated: eighteen approved items, the
 * same uploaders, the same shapes. Two of them are re-typed to `"video"` here
 * (their marketing still standing in as the poster, exactly as the retired
 * `reel-studio` board's fixtures did) so `Include videos` has something to
 * toggle. Nothing here reaches Supabase, R2 or an RPC.
 *
 * ★ EVERY REEL FRAME IS THE REAL ENGINE'S. `buildReelProps` is the same pure
 * builder the shipped Studio and the guest overlay call; a `ReelProps` object
 * built here is drawn by the same `drawReelFrame` the live player and the
 * on-device encoder step. What this file owns is only the INPUT: which clips,
 * which style, which seed, and (for the `pacing` and `reduced` asks) a themed
 * hold length the wiring round has not built a control for yet.
 *
 * ★ THE STYLE IS A STAND-IN, NAMED AS ONE. "Cinematic" (`classic`) is today's
 * default mood and the safest constant across boards; the ruling's own default
 * is "a new loop-tuned mood" nothing has designed yet. Nothing here answers
 * that question, and no ask on this board is about which mood plays.
 */

const REEL_SEED = 482_913;
const STYLE_ID = "classic";

/** Two of eighteen become videos: enough for `Include videos` to change the take. */
const VIDEO_AT = new Set([4, 11]);

export const CLIPS: GridMedia[] = GALLERY_ITEMS.map((m, i) =>
  VIDEO_AT.has(i) ? { ...m, type: "video" as const } : m,
);
const ORDERED_IDS = CLIPS.map((m) => m.id);
const BY_ID = new Map(CLIPS.map((m) => [m.id, m]));

/** The guest the arrival beat names: gallery-fixtures.ts's own `g3` uploader. */
export const LATEST_UPLOADER = "Theo Calder";

/**
 * Every clip plays on every option (Include videos defaults ON everywhere,
 * per his ruling); no ask on this board toggles it off, so the pool never
 * varies, only the style's theme and the orientation do.
 */
function propsFor(opts: {
  theme?: Partial<ReelTheme>;
  orientation?: Orientation;
} = {}): ReelProps {
  const base = buildReelProps({
    orderedIds: ORDERED_IDS,
    byId: BY_ID,
    styleId: STYLE_ID,
    seed: REEL_SEED,
    orientation: opts.orientation ?? "portrait",
    watermark: false,
  });
  return opts.theme ? { ...base, theme: { ...base.theme, ...opts.theme } } : base;
}

/** The baseline take: portrait, every clip, the style's own hold. */
export const REEL_PORTRAIT: ReelProps = propsFor();
/** The same take, landscape: `posture`'s "follow the viewport" at a laptop. */
export const REEL_LANDSCAPE: ReelProps = propsFor({ orientation: "landscape" });

/** `pacing`'s own knob: three real hold lengths, nothing else changed. */
export const PACE_SECONDS = { quick: 1.0, steady: 1.5, unhurried: 2.2 } as const;
export type PaceId = keyof typeof PACE_SECONDS;

const withHold = (sec: number, orientation: Orientation) =>
  propsFor({ theme: { photoHoldSec: sec, holdJitter: 0.04 }, orientation });

export const REEL_BY_PACE: Record<PaceId, { portrait: ReelProps; landscape: ReelProps }> = {
  quick: {
    portrait: withHold(PACE_SECONDS.quick, "portrait"),
    landscape: withHold(PACE_SECONDS.quick, "landscape"),
  },
  steady: {
    portrait: withHold(PACE_SECONDS.steady, "portrait"),
    landscape: withHold(PACE_SECONDS.steady, "landscape"),
  },
  unhurried: {
    portrait: withHold(PACE_SECONDS.unhurried, "portrait"),
    landscape: withHold(PACE_SECONDS.unhurried, "landscape"),
  },
};

/** `reduced`'s "it plays, just slower" option: gentler again than `unhurried`. */
export const REDUCED_SLOW_SECONDS = 3.2;
export const REEL_REDUCED_SLOW: Record<Orientation, ReelProps> = {
  portrait: withHold(REDUCED_SLOW_SECONDS, "portrait"),
  landscape: withHold(REDUCED_SLOW_SECONDS, "landscape"),
};

export { EVENT };
