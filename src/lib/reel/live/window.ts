/**
 * THE WINDOW — a plan over N clips of the take, handed over mid-hold (the live reel, 2026-09-22).
 *
 * The shipped composer is FIXED-LENGTH: every clip decoded up front, one plan, one duration. A reel
 * over a 300-photograph album cannot work that way (300 decodes before the first frame, and a plan
 * that has to be thrown away the moment somebody uploads), so the live reel plans a WINDOW at a
 * time and rolls.
 *
 * ★ WINDOWS OVERLAP BY ONE CLIP, AND THE SWAP LANDS MID-HOLD. Window N+1 begins with window N's
 * LAST clip, and the player swaps plans at `handoverFrame` — the first frame of that clip's clean
 * hold, where `frameStateAt` reports no transition in flight. Two consequences, both load-bearing:
 * no two plans are ever composited (so no background, overlay or watermark is drawn twice, and the
 * two-layer resolver is never asked to hold three), and the clip on screen is the SAME clip before
 * and after, so the swap has nothing to hide.
 *
 * ★ AND IT IS SEAMLESS, because the windows share the loop's seed and differ only by
 * `indexOffset` (layout.ts): window N+1's clip 0 is the loop's clip k, exactly as window N's last
 * clip was, with the same hold, the same Ken-Burns and the same entering gap. The next window
 * resumes at `handoverOffset`, the phase that clip had already reached, so the picture does not move
 * at all across the swap. Seeding each window independently instead would re-roll `panFrac`, and
 * `baseZoom` is `1 + 2 * panFrac + 0.015`: a ~5% scale jump every window, forever.
 *
 * Pure: no DOM, no React, no clock.
 */

import type { Orientation } from "@/lib/reel/engine/constants";
import { planReel, type PlanProps, type ReelPlan } from "@/lib/reel/engine/layout";
import type { ReelClip, ReelTheme } from "@/lib/reel/engine/reel-types";
import {
  DEFAULT_STYLE_ID,
  resolveStyleEntry,
} from "@/lib/reel/engine/style-registry";
import { resolveTheme } from "@/lib/reel/engine/themes";
import { clipStartFrames } from "@/lib/reel/engine/timeline";

import { toReelClip, type LiveMediaItem } from "./items";
import { pacedTheme, videoWindowSec, type Surface } from "./pacing";

/** How many clips a window plans. Six is about fifteen seconds in a hand: long enough that a window
 *  boundary is rare, short enough that an arrival never waits more than a clip or two. */
export const DEFAULT_WINDOW_SIZE = 6;

/** What a viewer's controls change. Every field is a knob on `reel-view` / `reel-screen`. */
export type ReelLook = {
  /** A MOOD id. A treatment falls back to the default mood: the six treatments compose a finite set
   *  (a polaroid stack has a fixed number of cards) and belong to a cut, not to an endless loop. */
  styleId: string;
  surface: Surface;
  /** The board's pacing multiplier on top of the surface factor. */
  holdScale?: number;
  orientation?: Orientation;
  /** The live reel carries NO mark on any tier (the ruling); the knob exists for the harness. */
  watermark?: boolean;
  /** Whether a video plays its motion window. Until `reel-engine-video` lands this only changes the
   *  hold: a poster-only video holds like a photograph, a motion video holds its window. */
  includeVideos?: boolean;
};

export type ReelWindow = {
  /** Monotonic across the whole session, never reset (loop boundaries included). */
  index: number;
  loopIndex: number;
  /** This window's first clip as an index into its loop's take (== the plan's `indexOffset`). */
  startIndex: number;
  ids: string[];
  props: PlanProps;
  plan: ReelPlan;
  /** The frame the NEXT window takes over at: no transition in flight, the overlap clip on screen. */
  handoverFrame: number;
  /** The frame the next window resumes at, so the overlap clip keeps its phase across the swap. */
  handoverOffset: number;
  /** The take index of the overlap clip, or null when this window is too short to share one. */
  overlapIndex: number | null;
};

/** The mood a look actually plays (the live reel is moods only). */
export function resolveLiveStyleId(styleId: string | null | undefined): string {
  const entry = resolveStyleEntry(styleId);
  return entry.kind === "mood" ? entry.id : DEFAULT_STYLE_ID;
}

/** The theme a look plays: the mood's kit, scaled by the surface's one pacing factor. */
export function themeFor(look: ReelLook): ReelTheme {
  return pacedTheme(
    resolveTheme(resolveLiveStyleId(look.styleId)),
    look.surface,
    look.holdScale,
  );
}

/** The clips for a run of ids, read from the LATEST items (a missing id simply drops out). */
export function clipsFor(
  ids: readonly string[],
  itemFor: (id: string) => LiveMediaItem | undefined,
  look: ReelLook,
): { ids: string[]; clips: ReelClip[] } {
  const keptIds: string[] = [];
  const clips: ReelClip[] = [];
  const window = look.includeVideos
    ? videoWindowSec(look.surface, look.holdScale)
    : null;
  for (const id of ids) {
    const item = itemFor(id);
    if (!item) continue;
    keptIds.push(id);
    clips.push(toReelClip(item, { videoWindowSec: window }));
  }
  return { ids: keptIds, clips };
}

export type BuildWindowArgs = {
  index: number;
  loopIndex: number;
  startIndex: number;
  ids: readonly string[];
  itemFor: (id: string) => LiveMediaItem | undefined;
  /** The LOOP's seed (never a per-window one: see the header). */
  seed: number;
  look: ReelLook;
};

/** Plan one window. Null when nothing in `ids` still resolves to a drawable item. */
export function buildWindow(args: BuildWindowArgs): ReelWindow | null {
  const { ids, clips } = clipsFor(args.ids, args.itemFor, args.look);
  if (clips.length === 0) return null;

  const props: PlanProps = {
    clips,
    theme: themeFor(args.look),
    seed: args.seed,
    styleId: resolveLiveStyleId(args.look.styleId),
    orientation: args.look.orientation,
    watermark: args.look.watermark ?? false,
    indexOffset: args.startIndex,
  };
  const plan = planReel(props);
  const { handoverFrame, handoverOffset } = handoverOf(plan);

  return {
    index: args.index,
    loopIndex: args.loopIndex,
    startIndex: args.startIndex,
    ids,
    props,
    plan,
    handoverFrame,
    handoverOffset,
    overlapIndex:
      clips.length >= 2 ? args.startIndex + clips.length - 1 : null,
  };
}

/**
 * Where a window ends and the next begins.
 *
 * The overlap clip is the last one; its entering transition runs for `gaps[m-1]` frames from
 * `starts[m]`, and the first frame after that is the earliest one where the plans can be swapped
 * without compositing two of them. Earliest on purpose: the longer the reel waits, the more of the
 * overlap clip's hold is spent twice over in two plans that must agree about it.
 *
 * A window of one clip has nobody to share: it hands over at the end of its own hold and the next
 * window starts fresh at frame 0 (`overlapIndex` null tells the source so).
 */
export function handoverOf(plan: ReelPlan): {
  handoverFrame: number;
  handoverOffset: number;
} {
  const m = plan.clips.length - 1;
  if (m < 1) {
    return {
      handoverFrame: Math.max(0, plan.totalFrames - 1),
      handoverOffset: 0,
    };
  }
  const starts = clipStartFrames(plan);
  const offset = plan.gaps[m - 1]?.durationInFrames ?? 0;
  return { handoverFrame: starts[m] + offset, handoverOffset: offset };
}

/**
 * THE IMMEDIATE DROP. A host hiding a photograph must not watch it finish its hold on the wall, so
 * an id leaving the payload is cut from every planned window AND, when it is the clip on screen, the
 * reel cuts away on the next frame.
 *
 * The cutaway is an ordinary window with two deliberate changes: the theme's transition palette is
 * narrowed to the style's SHORTEST transition (a cut where the mood has one, its briefest fade
 * otherwise), and the player resumes at `resumeFrame` — the exact frame that transition begins. The
 * departing clip is therefore on screen for the length of one short transition and no longer, and
 * because the window is planned at the departing clip's own `indexOffset` its motion parameters do
 * not change underneath it while it leaves.
 */
export function buildCutaway(
  args: BuildWindowArgs,
): (ReelWindow & { resumeFrame: number }) | null {
  const { ids, clips } = clipsFor(args.ids, args.itemFor, args.look);
  if (clips.length === 0) return null;

  const props: PlanProps = {
    clips,
    theme: cutawayTheme(themeFor(args.look)),
    seed: args.seed,
    styleId: resolveLiveStyleId(args.look.styleId),
    orientation: args.look.orientation,
    watermark: args.look.watermark ?? false,
    indexOffset: args.startIndex,
  };
  const plan = planReel(props);
  const { handoverFrame, handoverOffset } = handoverOf(plan);
  const starts = clipStartFrames(plan);

  return {
    index: args.index,
    loopIndex: args.loopIndex,
    startIndex: args.startIndex,
    ids,
    props,
    plan,
    handoverFrame,
    handoverOffset,
    overlapIndex:
      clips.length >= 2 ? args.startIndex + clips.length - 1 : null,
    // With a successor, the first frame of the transition out; alone, the clip simply holds.
    resumeFrame: clips.length >= 2 ? starts[1] : 0,
  };
}

/** The style's shortest transition, as a one-entry palette with the hold jitter stilled. */
export function cutawayTheme(theme: ReelTheme): ReelTheme {
  const shortest = theme.transitions.reduce((best, spec) =>
    spec.durationSec < best.durationSec ? spec : best,
  );
  return { ...theme, transitions: [shortest], holdJitter: 0 };
}
