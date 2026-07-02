// The reel render config — the inputProps the composition is parameterized by, shared by the
// @remotion/player preview AND renderMediaOnLambda. The real composer sources these from reel_items +
// media + the theme/seed the host picks (see src/lib/reel/build-reel-props.ts).

import type { Orientation } from "./constants";

export type ReelClip = {
  /** A presigned R2 GET URL (photo preview or original; video original, or its poster in posterMode). */
  url: string;
  type: "photo" | "video";
  /** Source pixel dimensions — drive the cover-vs-fit framing (mismatched-orientation media is fit, not
   *  cropped). Unknown → cover (the safe default). */
  width?: number;
  height?: number;
  /** Video only — the in-point (seconds into the source). */
  trimStartSec?: number;
  /** Video only — how long the clip plays in the reel (seconds). Photos use the theme/hold default. */
  trimDurationSec?: number;
};

// --- The motion vocabulary (a theme = a distinct EDIT character, not a tint) -------------------------

/** The transition presentations a theme can sample. CSS-based (reliable in the browser AND Lambda's
 *  headless Chrome). The richer shader presentations (dreamyZoom/crossZoom) are a later, export-verified
 *  add. "cut" is a near-instant fade (Punchy's hard cut). */
export type TransitionKind = "fade" | "cut" | "slide" | "wipe" | "flip" | "clockWipe";
export type SlideDir = "from-left" | "from-right" | "from-top" | "from-bottom";

/** One option in a theme's transition palette; the per-reel seed samples one per gap (→ variety). */
export type TransitionSpec = {
  kind: TransitionKind;
  /** Directions to sample from (directional presentations: slide / wipe / flip). */
  dirs?: SlideDir[];
  /** Transition length (seconds). */
  durationSec: number;
  /** Timing curve: "spring" (soft settle) or "linear" (mechanical/snappy). */
  timing?: "spring" | "linear";
};

/** Ken-Burns intensity for a theme (a FRACTION of the frame, so it reads the same at any resolution). */
export type KenBurnsKit = {
  /** Max zoom push over a clip's hold (e.g. 0.2 = up to +20%). */
  zoom: number;
  /** Max pan as a fraction of the frame width (e.g. 0.12 = up to 12%). */
  pan: number;
  /** Optional scale-in "punch" on a clip's entry (0 = none; e.g. 0.08 = an 8% snap-in). */
  punch?: number;
};

/** Light/texture overlays layered over the whole reel (procedural/inline → WYSIWYG in Lambda). The
 *  components live in effects.tsx; these string unions stay HERE (pure, no remotion) so the server-side
 *  build-reel-props can import ReelTheme without dragging the runtime in. */
export type OverlayKind =
  | "grain"
  | "vignette"
  | "lightleak"
  | "flares"
  | "letterbox"
  | "colorwash"
  // Per-mood SIGNATURE overlays (the deep-polish set; tasteful, one-per-look, not a stackable palette):
  | "bloom" // soft warm highlight halation that breathes (Film, Sunset)
  | "lightsweep" // a slow warm light sweeping across (Sunset)
  | "softedge"; // a dreamy soft-focus edge falloff (Float)

/** Seeded particle fields (heavier; ~30-50 animated nodes). */
export type ParticleKind = "confetti" | "bokeh" | "sparkle";

/** Anything composable into a theme's `overlays` array (a texture overlay OR a particle field). */
export type EffectKind = OverlayKind | ParticleKind;

/** Per-clip Ken-Burns CHARACTER — drift (gentle linear), punch (snap zoom-in), float (sinusoidal sway +
 *  tiny rotation), freezeGo (hold, then move). */
export type MotionStyle = "drift" | "punch" | "float" | "freezeGo";

/** The per-mood SIGNATURE — one deliberate craft touch beyond grade + motion that makes a look read as its
 *  own film. Composition-level (weave / flashOnCut / pulse) + clip-level (halation / inset); the
 *  overlay-based signatures (letterbox / bloom / lightsweep / softedge / grain / vignette) ride in
 *  `overlays`. All CSS/SVG/inline → renders identically in the player and Lambda (WYSIWYG). */
export type ReelSignature = {
  /** A faint gate weave (max px of seeded horizontal/vertical wander) — Film. */
  weave?: number;
  /** A brief bright flash at each clip boundary (a cut strobe) — Pulse. */
  flashOnCut?: boolean;
  /** A subtle global scale-pulse amplitude (e.g. 0.012) — Pulse. */
  pulse?: number;
  /** Per-clip highlight halation: a blurred bright-pass of the clip, screen-blended (0-1) — Film / Noir. */
  halation?: number;
  /** Whip motion-blur on directional transitions (the slide carries a blur) — Kinetic. */
  whipBlur?: boolean;
  /** Editorial inset: render each clip contained within a margin (fraction of the frame) on a paper card. */
  inset?: number;
  /** The paper backdrop behind an inset clip (Editorial). */
  paper?: string;
};

/** What fills the designed negative space when a clip is FIT (doesn't fill the frame) — each style's own
 *  way: the themed background, a paper card, or a soft blurred-fill of the media (the Noir look). */
export type ClipBackdrop = "theme" | "paper" | "blur" | "none";

export type ReelTheme = {
  /** CSS filter applied to every clip (the color grade). */
  grade: string;
  /** Background behind clips (and during transitions). */
  background: string;
  /** Base seconds each photo holds on screen (videos use their trimDurationSec). */
  photoHoldSec: number;
  /** ± hold jitter fraction — a seeded pacing variation (e.g. 0.12 = up to ±12%). */
  holdJitter?: number;
  /** The transition palette the seed samples per gap (≥ 1). */
  transitions: TransitionSpec[];
  /** Ken-Burns motion intensity. */
  kenBurns: KenBurnsKit;
  /** The Ken-Burns motion character (defaults to "drift"). */
  motionStyle?: MotionStyle;
  /** Overlays + particle fields for this theme's character. */
  overlays?: EffectKind[];
  /** The per-mood signature (one deliberate craft touch) — see ReelSignature. */
  signature?: ReelSignature;
  /** How this style fills the designed negative space for FIT (mismatched-orientation) media. Default
   *  "theme" (the themed background). */
  backdrop?: ClipBackdrop;
};

export type ReelProps = {
  clips: ReelClip[];
  theme: ReelTheme;
  /** Per-reel seed → deterministic motion, transitions + pacing. Re-roll (a new seed) = a fresh cut. */
  seed: number;
  /** Output orientation — portrait 9:16 (default) or landscape 16:9; every style adapts to both. */
  orientation?: Orientation;
  /**
   * The catalog style — a media-first mood id (=== its themeId) or a stylized treatment id. Drives which
   * composition the StyleDispatch renders + the per-style duration. Resolved via the pure style-registry;
   * unknown/missing falls back to the default mood (Cinematic). Folded into the render hash so each style
   * exports distinctly. `theme` is already resolved from this upstream (in build-reel-props).
   */
  styleId?: string;
  /**
   * Player-only: render video clips as their POSTER still (an <Img>) instead of decoding the mp4. The
   * in-browser @remotion/player hits R2 CORS on <Video> fetches (headless-Chrome/browser), so the live
   * preview shows clips by their poster (the spec's v1 behavior). The Lambda export leaves this false →
   * real <Video>. Additive + defaulted false, so the export path is byte-identical.
   */
  posterMode?: boolean;
  /**
   * Free-tier export lever: stamp a small "partyreel.com" wordmark over the reel (the corner-logo
   * upgrade nudge + free marketing; the spec's free-vs-Pro differentiator). The render service derives
   * this from the host's tier server-side (Free → true); the composer mirrors it in the live player so
   * a Free host sees exactly what they'll download. Additive + defaulted false (no mark for Pro).
   */
  watermark?: boolean;
};

/** The default media-first kit (CINEMATIC — formal weddings, galas): a subtle teal-warm film grade, a
 *  slow elegant push-in, soft spring dissolves, a faint vignette. Also the resolveTheme fallback. The
 *  rest of the mood kits live in themes.ts; a per-reel seed samples within a kit (motion + transition +
 *  pacing variety). NOTE (transitional): the id stays `classic` while the label is "Cinematic" until
 *  Phase 2 formalizes these as media-first style ids. */
export const THEME_CLASSIC: ReelTheme = {
  grade: "contrast(1.14) saturate(1.06) brightness(0.98) sepia(0.14) hue-rotate(-10deg)",
  background: "#07080a",
  photoHoldSec: 2.7,
  holdJitter: 0.05,
  transitions: [{ kind: "fade", durationSec: 0.6, timing: "spring" }],
  kenBurns: { zoom: 0.16, pan: 0.06 },
  // Signature: the held-then-push beat (freezeGo) + cinematic letterbox bars.
  motionStyle: "freezeGo",
  overlays: ["letterbox", "vignette"],
};
