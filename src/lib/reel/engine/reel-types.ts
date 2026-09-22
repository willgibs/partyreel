// The reel render config — the props the canvas engine is parameterized by, driving BOTH the live
// player AND the on-device WebCodecs export from one draw function. The real composer sources these from
// reel_items + media + the theme/seed the host picks (see src/lib/reel/build-reel-props.ts).

import type { Orientation } from "./constants";

export type ReelClip = {
  /** A presigned R2 GET URL: a photo's preview (or original), or a video's poster still. Empty ("") =
   *  nothing to draw → the engine's theme-color hold (a posterless video). */
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
  /**
   * Video only, and OPTIONAL everywhere — the live motion source for this clip (the reel round,
   * 2026-09-22). Absent (the default, and every server-built props) → the clip draws its poster
   * still exactly as before. Present → the renderer asks it for a decoded frame each draw and
   * falls back to the poster whenever it answers null. See ReelVideoSource.
   */
  video?: ReelVideoSource | null;
};

// --- Motion video in the live reel (the range-window reader's half of the contract) ------------------

/** What a decoded video frame can be blitted from. CanvasSink yields an HTMLCanvasElement in a DOM
 *  context and an OffscreenCanvas otherwise; ctx.drawImage takes either. */
export type ReelFrameImage = HTMLCanvasElement | OffscreenCanvas | ImageBitmap;

/** One decoded frame out of a clip's window ring. */
export type ReelVideoFrame = {
  image: ReelFrameImage;
  /** The frame's own pixel size. The decode is aspect-preserving, so this carries the source's
   *  aspect and the renderer's cover/contain rect lands exactly where the poster's did. */
  width: number;
  height: number;
  /** Clip-LOCAL seconds (0 = the window's first frame), never source seconds. */
  localSec: number;
};

/**
 * A clip's motion source: a pre-filled ring of decoded frames the draw reads SYNCHRONOUSLY.
 *
 * ★ WHY SYNCHRONOUS (do not weaken): drawReelFrame is contractually synchronous, and registry.ts's
 * pooled-scratch safety invariant depends on it — a draw that awaited could interleave with another
 * player's draw and both would paint the same pooled scratch canvas. So the async pump that fetches
 * byte ranges and decodes lives OUTSIDE the draw (src/lib/reel/engine/video/window-reader.ts) and
 * all the draw ever does is read the ring. `frameAt` returning null is a normal, expected answer
 * (videos off, over budget, undecodable, not ready yet): the renderer draws the poster.
 */
export type ReelVideoSource = {
  kind: "window";
  /** SYNCHRONOUS. The newest decoded frame at or before `localSec`, or null → draw the poster.
   *  Advances the ring's cursor, so callers ask in non-decreasing time order. */
  frameAt: (localSec: number) => ReelVideoFrame | null;
};

// --- The motion vocabulary (a theme = a distinct EDIT character, not a tint) -------------------------

/** The transition presentations a theme can sample. The richer shader presentations (dreamyZoom/
 *  crossZoom) are a later add. "cut" is a near-instant fade (Punchy's hard cut). */
export type TransitionKind =
  | "fade"
  | "cut"
  | "slide"
  | "wipe"
  | "flip"
  | "clockWipe";
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

/** Light/texture overlays layered over the whole reel (procedural/inline). The overlay drawing lives in
 *  the engine; these string unions stay HERE (pure, no DOM) so the server-side
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
 *  `overlays`. The engine draws them the same way for the live player and the export (one draw fn). */
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
  grade:
    "contrast(1.14) saturate(1.06) brightness(0.98) sepia(0.14) hue-rotate(-10deg)",
  background: "#07080a",
  photoHoldSec: 2.7,
  holdJitter: 0.05,
  transitions: [{ kind: "fade", durationSec: 0.6, timing: "spring" }],
  kenBurns: { zoom: 0.16, pan: 0.06 },
  // Signature: the held-then-push beat (freezeGo) + cinematic letterbox bars.
  motionStyle: "freezeGo",
  overlays: ["letterbox", "vignette"],
};
