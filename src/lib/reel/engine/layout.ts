import { FPS } from "./constants";
import type {
  ReelClip,
  ReelProps,
  SlideDir,
  TransitionKind,
} from "./reel-types";
import { seeded, seededPick } from "./seed";

// Pure timeline PLAN — the SINGLE source shared by the composition (Reel.tsx), the <Player> duration
// (reel-player.tsx), calculateMetadata (Root.tsx), and the length-cap (build-reel-props.ts). It seeds the
// whole "edit": per-clip hold + Ken-Burns motion, and per-gap transition (kind/direction/timing/length).
// Everything is deterministic (seeded), so the preview == the export, and a new seed = a fresh cut.
//
// TIMELINE MATH (TransitionSeries): clips render as sequences that OVERLAP by their transition duration,
// so total frames = Σ sequence frames − Σ transition frames. No Remotion import here (pure → the worker
// bundle + the server route can consume it).

const MIN_TRANSITION_FRAMES = 1;
// A near-instant "cut" (a 1-frame fade). Reads as a hard cut without breaking the Sequence/Transition
// alternation TransitionSeries requires.
const CUT_FRAMES = 2;

/**
 * ★ THE HOLD GUARD (the live reel, 2026-09-22). A clip's sequence must outlast the SUM of its two
 * adjacent transitions, not merely the longer one; this is the daylight it keeps past that sum.
 *
 * WHY THE SUM. Clip i-1 finishes exiting at start[i] + gap[i-1]; clip i+1 begins entering at
 * start[i] + dur[i] - gap[i]. Three clips are therefore on screen at once exactly when
 * dur[i] < gap[i-1] + gap[i]. timeline.ts's frameStateAt models TWO layers (top + under) and names
 * that condition as the thing to fix "BEFORE shipping a faster theme" — which is precisely what a
 * faster SURFACE is (live/pacing.ts scales the hold AND every transition by one factor). The old
 * clamp, max(adjacent) + 2, left the window open; the sum closes it by construction, so no surface
 * and mood pair can produce a frame the resolver would silently under-draw.
 *
 * It is a NO-OP for every shipped theme at every pacing (the tightest kit, Kinetic, holds ~28 frames
 * against a 10-frame gap sum), so no existing reel's pixels or length move. layout.test.ts pins both
 * halves: the guard binding on a pathological kit, and no mood x surface pair reaching three layers.
 */
const LAYER_GUARD_FRAMES = 2;

export type ClipMotion = {
  /** Pan unit vector (any direction) × the per-clip pan fraction of the frame. */
  panX: number;
  panY: number;
  panFrac: number;
  /** Zoom push over the hold (added to BASE_ZOOM). */
  zoomDelta: number;
  /** Scale-in punch on entry (0 = none). */
  punch: number;
};

export type PlannedClip = ReelClip & {
  index: number;
  /** The clip's sequence length in frames (its hold; transitions overlap into it). */
  durationInFrames: number;
  motion: ClipMotion;
};

export type PlannedGap = {
  kind: TransitionKind;
  dir?: SlideDir;
  timing: "spring" | "linear";
  durationInFrames: number;
};

export type ReelPlan = {
  fps: number;
  clips: PlannedClip[];
  /** One per gap between consecutive clips (length = clips.length − 1). */
  gaps: PlannedGap[];
  totalFrames: number;
  totalSec: number;
};

/**
 * ★ THE WINDOW OFFSET (the live reel, 2026-09-22). Props carrying `indexOffset: k` plan as the SLICE
 * of a longer reel starting at clip k: every seeded stream (hold jitter, Ken-Burns, which transition
 * and which direction) is drawn at k + the local index, so planning clips [k..k+n] gives byte-identical
 * gaps and motion to planning the whole take and slicing it. Absent (every shipped caller), it is 0
 * and nothing about this function changes.
 *
 * WHY IT EXISTS. The live reel plays in rolling WINDOWS that overlap by one clip, so that the plan
 * swap always lands mid-hold and two plans are never composited. Without an offset each window would
 * need its own seed, and the shared clip's Ken-Burns would be re-rolled underneath it: `baseZoom` is
 * `1 + 2 * panFrac + 0.015`, so a different seed changes the clip's SCALE even at local frame 0 —
 * roughly a 5% jump, every window, forever. With the offset the shared clip is the same clip in both
 * plans and the handover is invisible.
 *
 * WHY NOT A FIELD ON ReelProps: `reel-types.ts` belongs to the video lane this round. It is declared
 * here, as a structural extra the planner honours, and the tidy follow-up is to move the declaration
 * onto ReelProps once that file is free. `PlannedClip.index` stays LOCAL either way — it indexes
 * `assets.clips`, which is parallel to the props' own clip list.
 */
export type PlanProps = ReelProps & { indexOffset?: number };

/** Plan the whole reel deterministically from (clips, theme, seed [, indexOffset]). */
export function planReel(props: PlanProps): ReelPlan {
  const { clips, theme, seed } = props;
  const fps = FPS;
  const base = Math.max(0, Math.round(props.indexOffset ?? 0));

  // 1) Gaps first — a clip's sequence must be longer than its adjacent transitions, so we size them next.
  const gaps: PlannedGap[] = [];
  for (let i = 0; i < Math.max(0, clips.length - 1); i++) {
    const spec = seededPick(seed, base + i, 20, theme.transitions);
    const dir = spec.dirs ? seededPick(seed, base + i, 21, spec.dirs) : undefined;
    const durationInFrames =
      spec.kind === "cut"
        ? CUT_FRAMES
        : Math.max(MIN_TRANSITION_FRAMES, Math.round(spec.durationSec * fps));
    gaps.push({
      kind: spec.kind,
      dir,
      timing: spec.timing ?? "linear",
      durationInFrames,
    });
  }

  // 2) Clips — seeded hold (with pacing jitter) + Ken-Burns; clamp so the sequence outlasts its gaps.
  const plannedClips: PlannedClip[] = clips.map((clip, index) => {
    const baseHold =
      clip.type === "video"
        ? (clip.trimDurationSec ?? theme.photoHoldSec)
        : theme.photoHoldSec;
    const jitter = theme.holdJitter ?? 0;
    const holdSec =
      baseHold * (1 + (seeded(seed, base + index, 10) * 2 - 1) * jitter);
    let durationInFrames = Math.max(1, Math.round(holdSec * fps));
    // The hold guard: the SUM of both adjacent gaps (see LAYER_GUARD_FRAMES), never their max.
    const gapSum =
      (gaps[index - 1]?.durationInFrames ?? 0) +
      (gaps[index]?.durationInFrames ?? 0);
    durationInFrames = Math.max(durationInFrames, gapSum + LAYER_GUARD_FRAMES);

    const angle = seeded(seed, base + index, 1) * Math.PI * 2;
    const motion: ClipMotion = {
      panX: Math.cos(angle),
      panY: Math.sin(angle),
      panFrac: theme.kenBurns.pan * (0.55 + seeded(seed, base + index, 2) * 0.45),
      zoomDelta:
        theme.kenBurns.zoom * (0.6 + seeded(seed, base + index, 3) * 0.4),
      punch: theme.kenBurns.punch ?? 0,
    };
    return { ...clip, index, durationInFrames, motion };
  });

  const sumSeq = plannedClips.reduce((s, c) => s + c.durationInFrames, 0);
  const sumGap = gaps.reduce((s, g) => s + g.durationInFrames, 0);
  const totalFrames = Math.max(1, sumSeq - sumGap);
  return { fps, clips: plannedClips, gaps, totalFrames, totalSec: totalFrames / fps };
}
