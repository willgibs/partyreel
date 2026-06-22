// The reel render config — the inputProps the composition is parameterized by, shared by the
// @remotion/player preview AND renderMediaOnLambda. Spike shape; the real composer will mirror it
// (sourced from reel_items + media + the theme/seed the host picks).

export type ReelClip = {
  /** A presigned R2 GET URL (photo preview or original; video original). */
  url: string;
  type: "photo" | "video";
  /** Video only — the in-point (seconds into the source). */
  trimStartSec?: number;
  /** Video only — how long the clip plays in the reel (seconds). Photos use the theme/hold default. */
  trimDurationSec?: number;
};

export type ReelTheme = {
  /** CSS filter applied to every clip (the color grade). */
  grade: string;
  /** Letterbox/background behind clips. */
  background: string;
  /** Seconds each photo holds on screen. */
  photoHoldSec: number;
  /** Crossfade overlap between clips (seconds). */
  crossfadeSec: number;
  /** Ken-Burns zoom delta over a photo's hold (e.g. 0.08 = a slow 8% push-in). */
  kenBurnsZoom: number;
};

export type ReelProps = {
  clips: ReelClip[];
  theme: ReelTheme;
  /** Per-reel seed → deterministic per-shot variation (pan direction, zoom). Re-roll = a new seed. */
  seed: number;
};

/** One curated "vibe" kit. Spike ships a single theme; the real palette + the seed-sampling lands later. */
export const THEME_CLASSIC: ReelTheme = {
  grade: "saturate(1.08) contrast(1.04) brightness(1.01)",
  background: "#0a0a0a",
  photoHoldSec: 2.4,
  crossfadeSec: 0.5,
  kenBurnsZoom: 0.08,
};
