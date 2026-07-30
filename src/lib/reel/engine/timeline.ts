// The canvas engine's TIMELINE resolver. It deliberately does NOT re-implement the edit plan: planReel
// (composition/layout.ts) stays the single source for holds, gaps, Ken-Burns seeding, and total length,
// so the engine can never drift from the Remotion composition, the player duration, or the
// build-reel-props length cap (which all consume the same plan; the cap's prefix-determinism invariant
// lives there too). What the engine DOES need, and Remotion's <TransitionSeries> did implicitly, is the
// inverse mapping: for an output frame, WHICH clips are on screen, at what local frame, and how far
// through the transition between them. That is this module.
//
// TransitionSeries math being replicated (verified against @remotion/transitions/TransitionSeries.js):
// - clip i's sequence starts at start[i] = sum over j<i of (dur[j] - gap[j]) (gaps OVERLAP into clips).
// - during gap i's window [start[i+1], start[i+1] + gapFrames[i]) BOTH clips render: the exiting clip
//   i below (full opacity for fade), the entering clip i+1 on top with the timing curve's progress.
// - the entering clip's progress frame is its own local frame (frame - start[i+1]).
//
// Pure module: no DOM, no remotion, no React. Unit-tested in timeline.test.ts.

import {
  planReel,
  type PlannedGap,
  type ReelPlan,
} from "./layout";
import type { ReelProps } from "./reel-types";
import { springTimingProgress } from "./spring";

/** One on-screen clip layer at a given output frame. */
export type LayerState = {
  clipIndex: number;
  /** The frame within the clip's own sequence (drives its Ken-Burns motion). */
  localFrame: number;
};

/** The transition in flight at a given output frame (absent outside gap windows). */
export type ActiveTransition = {
  gapIndex: number;
  gap: PlannedGap;
  /** The timing curve's eased progress, 0..1 (the fade alpha for fade/cut gaps). */
  progress: number;
};

export type FrameState = {
  /** The entering/current clip, drawn LAST (on top). */
  top: LayerState;
  /** The exiting clip below it, present only during a transition window. */
  under: LayerState | null;
  transition: ActiveTransition | null;
};

// planReel is pure-per-props, but the engine samples it every frame (24-60x/s); memoize per props
// object (the composer memoizes ReelProps, so identity is stable between renders).
const planCache = new WeakMap<ReelProps, ReelPlan>();

/** The (memoized) edit plan for a ReelProps. */
export function planFor(props: ReelProps): ReelPlan {
  const cached = planCache.get(props);
  if (cached) return cached;
  const plan = planReel(props);
  planCache.set(props, plan);
  return plan;
}

/** Output-timeline start frame of each clip's sequence (gaps overlap, so starts advance by dur - gap). */
export function clipStartFrames(plan: ReelPlan): number[] {
  const starts: number[] = [];
  let acc = 0;
  plan.clips.forEach((clip, i) => {
    if (i > 0)
      acc +=
        plan.clips[i - 1].durationInFrames - plan.gaps[i - 1].durationInFrames;
    starts.push(acc);
  });
  return starts;
}

/** The eased progress of a gap at a local frame (frame - the entering clip's start). */
export function gapProgress(
  gap: PlannedGap,
  localFrame: number,
  fps: number,
): number {
  if (gap.timing === "spring") {
    return springTimingProgress(localFrame, gap.durationInFrames, fps);
  }
  // linearTiming: interpolate(frame, [0, dur], [0, 1]) clamped.
  const p = gap.durationInFrames > 0 ? localFrame / gap.durationInFrames : 1;
  return Math.min(1, Math.max(0, p));
}

/**
 * Resolve an output frame to its on-screen layers + transition state.
 *
 * KNOWN LIMIT (latent, unreachable with current themes): this models at most TWO layers
 * (top + under). Remotion's TransitionSeries can have THREE sequences on screen when a clip is
 * shorter than the sum of its two adjacent gaps (clip i-1 still exiting while clip i+1 already
 * enters). planReel clamps holds to max(adjacent gap)+2 and every real theme keeps clips far
 * longer than their gap sum, so no pixel diverges today. If a future theme or the Pro TRIM slice
 * introduces holds shorter than two adjacent transition durations, this needs a third layer (or
 * a planReel guard) BEFORE shipping that theme.
 */
export function frameStateAt(plan: ReelPlan, frame: number): FrameState {
  const starts = clipStartFrames(plan);
  const n = plan.clips.length;
  if (n === 0) {
    return {
      top: { clipIndex: 0, localFrame: 0 },
      under: null,
      transition: null,
    };
  }

  // The top clip: the last sequence that has started (clamped into the reel for out-of-range frames).
  let i = n - 1;
  for (let k = 1; k < n; k++) {
    if (frame < starts[k]) {
      i = k - 1;
      break;
    }
  }

  const top: LayerState = {
    clipIndex: i,
    localFrame: Math.max(0, frame - starts[i]),
  };

  // Inside gap (i-1)'s window the previous clip is still exiting underneath.
  if (i > 0) {
    const gap = plan.gaps[i - 1];
    const local = frame - starts[i];
    if (local >= 0 && local < gap.durationInFrames) {
      return {
        top,
        under: { clipIndex: i - 1, localFrame: frame - starts[i - 1] },
        transition: {
          gapIndex: i - 1,
          gap,
          progress: gapProgress(gap, local, plan.fps),
        },
      };
    }
  }

  return { top, under: null, transition: null };
}
