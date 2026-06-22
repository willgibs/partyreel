// The reel render config — the inputProps the composition is parameterized by, shared by the
// @remotion/player preview AND renderMediaOnLambda. The real composer sources these from reel_items +
// media + the theme/seed the host picks (see src/lib/reel/build-reel-props.ts).

export type ReelClip = {
  /** A presigned R2 GET URL (photo preview or original; video original, or its poster in posterMode). */
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
  /**
   * Player-only: render video clips as their POSTER still (an <Img>) instead of decoding the mp4. The
   * in-browser @remotion/player hits R2 CORS on <Video> fetches (headless-Chrome/browser), so the live
   * preview shows clips by their poster (the spec's v1 behavior). The Lambda export leaves this false →
   * real <Video>. Additive + defaulted false, so the export path is byte-identical.
   */
  posterMode?: boolean;
};

/** The base "vibe" kit. The palette of kits lives in themes.ts; a per-reel seed samples within a kit. */
export const THEME_CLASSIC: ReelTheme = {
  grade: "saturate(1.08) contrast(1.04) brightness(1.01)",
  background: "#0a0a0a",
  photoHoldSec: 2.4,
  crossfadeSec: 0.5,
  kenBurnsZoom: 0.08,
};
