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

/** Plan the whole reel deterministically from (clips, theme, seed). */
export function planReel(props: ReelProps): ReelPlan {
  const { clips, theme, seed } = props;
  const fps = FPS;

  // 1) Gaps first — a clip's sequence must be longer than its adjacent transitions, so we size them next.
  const gaps: PlannedGap[] = [];
  for (let i = 0; i < Math.max(0, clips.length - 1); i++) {
    const spec = seededPick(seed, i, 20, theme.transitions);
    const dir = spec.dirs ? seededPick(seed, i, 21, spec.dirs) : undefined;
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
    const holdSec = baseHold * (1 + (seeded(seed, index, 10) * 2 - 1) * jitter);
    let durationInFrames = Math.max(1, Math.round(holdSec * fps));
    const adjGap = Math.max(
      gaps[index - 1]?.durationInFrames ?? 0,
      gaps[index]?.durationInFrames ?? 0,
    );
    durationInFrames = Math.max(durationInFrames, adjGap + 2);

    const angle = seeded(seed, index, 1) * Math.PI * 2;
    const motion: ClipMotion = {
      panX: Math.cos(angle),
      panY: Math.sin(angle),
      panFrac: theme.kenBurns.pan * (0.55 + seeded(seed, index, 2) * 0.45),
      zoomDelta: theme.kenBurns.zoom * (0.6 + seeded(seed, index, 3) * 0.4),
      punch: theme.kenBurns.punch ?? 0,
    };
    return { ...clip, index, durationInFrames, motion };
  });

  const sumSeq = plannedClips.reduce((s, c) => s + c.durationInFrames, 0);
  const sumGap = gaps.reduce((s, g) => s + g.durationInFrames, 0);
  const totalFrames = Math.max(1, sumSeq - sumGap);
  return { fps, clips: plannedClips, gaps, totalFrames, totalSec: totalFrames / fps };
}
