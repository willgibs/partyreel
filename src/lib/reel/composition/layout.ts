import type { ReelClip, ReelProps } from "./reel-types";

// Pure timeline layout — shared by calculateMetadata (total duration), the <Player> (duration prop), and
// the component (per-clip placement), so the duration the composition reports always matches what it
// actually renders.
//
// Each clip is "active" for activeSec; consecutive clips OVERLAP by crossfadeSec (the next starts
// crossfadeSec before the previous's tail ends), and the incoming clip fades in over that overlap →
// a crossfade. Total = sum(active) + crossfadeSec (the last clip's held tail).

export type PlacedClip = ReelClip & {
  index: number;
  /** When the clip's sequence starts (seconds). */
  fromSec: number;
  /** The clip's active on-screen time before the next begins (seconds). */
  activeSec: number;
};

export type ReelLayout = {
  placed: PlacedClip[];
  totalSec: number;
};

export function layoutReel(props: ReelProps): ReelLayout {
  const { clips, theme } = props;
  let cursor = 0;
  const placed: PlacedClip[] = clips.map((clip, index) => {
    const activeSec =
      clip.type === "video"
        ? (clip.trimDurationSec ?? theme.photoHoldSec)
        : theme.photoHoldSec;
    const fromSec = cursor;
    cursor += activeSec;
    return { ...clip, index, fromSec, activeSec };
  });
  // The last clip lingers for one crossfade past its active time (a held ending; for inner clips that
  // tail is the overlap the next clip fades in over).
  const totalSec = cursor + theme.crossfadeSec;
  return { placed, totalSec };
}
