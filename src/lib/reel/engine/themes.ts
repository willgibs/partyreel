// The MEDIA-FIRST mood kits — each a complete, distinct LOOK with ONE bespoke signature (the deep-polish
// craft): grade + transition palette + Ken-Burns + motion character + pacing + a signature touch, NOT a
// tint. The photos fill the frame; the EDIT + GRADE + ENERGY + SIGNATURE differentiate the moods, each
// tuned to an event vibe. The per-reel seed samples WITHIN a kit (transition per gap, pan/zoom, jitter), so
// same-kit reels still feel unique. `theme` is a TEXT id on highlight_reels, validated here (no DB enum →
// kits add freely; the catalog is built to grow). Tuned in the /design/reel lab + curated with Will.
//
// NOTE (transitional): the first three keep their legacy ids (classic/warm/punchy) so existing configs +
// the render-hash tests keep resolving; their LABELS are the polished mood names. Phase 2 formalizes the
// set as media-first `styleId`s alongside the stylized treatments.
import { type ReelTheme, THEME_CLASSIC } from "./reel-types";

/** FILM (casual weddings, reunions). A DISPOSABLE-CAMERA look: a slightly blown warm grade, heavy grain + a
 *  vignette, a touch of highlight bloom; STEADY motion (drift, no gate-weave → not shaky), with the
 *  occasional snapshot cut. Polished, not jittery — Cinematic's steadiness, disposable-grain character. */
export const THEME_WARM: ReelTheme = {
  grade: "sepia(0.2) saturate(1.14) contrast(1.05) brightness(1.09)",
  background: "#141008",
  photoHoldSec: 2.5,
  holdJitter: 0.1,
  transitions: [
    { kind: "fade", durationSec: 0.5, timing: "spring" },
    { kind: "cut", durationSec: 0, timing: "linear" },
    { kind: "fade", durationSec: 0.5, timing: "spring" },
  ],
  kenBurns: { zoom: 0.16, pan: 0.07 },
  motionStyle: "drift",
  overlays: ["grain", "vignette"],
  signature: { halation: 0.16 },
};

/** PULSE (club parties, DJ sets). Signature: a strobe flash on every hard cut + a rhythmic scale-pulse,
 *  over a saturated high-contrast grade with a zoom-punch. A hype/club visualizer. */
export const THEME_PUNCHY: ReelTheme = {
  grade: "saturate(1.42) contrast(1.18) brightness(1.02)",
  background: "#000000",
  photoHoldSec: 1.5,
  holdJitter: 0.16,
  // Cut-driven so the edit reads RHYTHMIC (the flash lands on each cut); just the occasional quick slide.
  transitions: [
    { kind: "cut", durationSec: 0, timing: "linear" },
    { kind: "cut", durationSec: 0, timing: "linear" },
    { kind: "slide", durationSec: 0.18, dirs: ["from-left", "from-right"], timing: "linear" },
  ],
  kenBurns: { zoom: 0.26, pan: 0.13, punch: 0.1 },
  motionStyle: "punch",
  overlays: [],
  signature: { flashOnCut: true, pulse: 0.012 },
};

/** KINETIC (sports, run clubs). Signature: whip-slides that carry a directional motion-blur + a strong
 *  motion-forward zoom-punch, over a bold contrast grade. A Nike-style athletic edit. */
export const THEME_KINETIC: ReelTheme = {
  grade: "saturate(1.16) contrast(1.26) brightness(1.0)",
  background: "#050505",
  photoHoldSec: 1.4,
  holdJitter: 0.18,
  transitions: [
    { kind: "slide", durationSec: 0.2, dirs: ["from-left", "from-right"], timing: "linear" },
    { kind: "slide", durationSec: 0.2, dirs: ["from-top", "from-bottom"], timing: "linear" },
    { kind: "cut", durationSec: 0, timing: "linear" },
  ],
  kenBurns: { zoom: 0.3, pan: 0.15, punch: 0.14 },
  motionStyle: "punch",
  overlays: [],
  signature: { whipBlur: true },
};

/** EDITORIAL (modern, brand, design events). Signature: each photo sits as a contained print within a thin
 *  margin on a paper card (a magazine spread), over a clean muted grade, with the gentlest drift + generous
 *  holds. A Kinfolk spread. */
export const THEME_EDITORIAL: ReelTheme = {
  grade: "saturate(0.92) contrast(1.04) brightness(1.04)",
  background: "#0c0c0d",
  photoHoldSec: 2.8,
  holdJitter: 0.05,
  transitions: [{ kind: "fade", durationSec: 0.7, timing: "spring" }],
  kenBurns: { zoom: 0.08, pan: 0.04 },
  motionStyle: "drift",
  overlays: [],
  signature: { inset: 0.08, paper: "#f2efe7" },
  // Mismatched media fits onto the paper card (the magazine spread), never crops.
  backdrop: "paper",
};

/** SUNSET (outdoor, festivals, golden hour). Signature: a warm highlight bloom + a slow light sweeping
 *  across, over a golden grade with an easy float. Bathed in golden-hour light. */
export const THEME_GOLDEN: ReelTheme = {
  grade: "sepia(0.3) saturate(1.18) contrast(1.0) brightness(1.06) hue-rotate(-10deg)",
  background: "#14100a",
  photoHoldSec: 2.6,
  holdJitter: 0.1,
  transitions: [
    { kind: "fade", durationSec: 0.65, timing: "spring" },
    { kind: "wipe", durationSec: 0.6, dirs: ["from-left", "from-right"], timing: "linear" },
  ],
  kenBurns: { zoom: 0.14, pan: 0.1 },
  motionStyle: "float",
  overlays: ["bloom", "lightsweep"],
};

/** NOIR (black-tie, documentary, artistic). Signature: silver-gelatin highlight halation + grain + a
 *  vignette, over a high-contrast black + white grade with an elegant slow Ken-Burns. Magnum photography. */
export const THEME_MONO: ReelTheme = {
  grade: "grayscale(1) contrast(1.2) brightness(1.04)",
  background: "#0a0a0a",
  photoHoldSec: 2.7,
  holdJitter: 0.08,
  transitions: [{ kind: "fade", durationSec: 0.6, timing: "spring" }],
  kenBurns: { zoom: 0.16, pan: 0.08 },
  motionStyle: "drift",
  overlays: ["grain", "vignette"],
  signature: { halation: 0.22 },
  // The focused-media-over-soft-blur look (Will liked it) — used as the negative space for mismatched media.
  backdrop: "blur",
};

/** FLOAT (romantic, intimate, showers). Signature: a soft bloom + a dreamy soft-focus edge falloff, over a
 *  pastel low-contrast grade with a slow sinusoidal float + long gentle holds. A soft-focus romance. */
export const THEME_DREAMY: ReelTheme = {
  grade: "saturate(1.02) contrast(0.9) brightness(1.1) sepia(0.06)",
  background: "#100e12",
  photoHoldSec: 2.9,
  holdJitter: 0.08,
  transitions: [{ kind: "fade", durationSec: 0.85, timing: "spring" }],
  kenBurns: { zoom: 0.12, pan: 0.09 },
  motionStyle: "float",
  overlays: ["bloom", "softedge"],
  // A soft blurred-fill negative space matches the dreamy softness for mismatched media.
  backdrop: "blur",
};

export const THEMES = {
  classic: THEME_CLASSIC,
  warm: THEME_WARM,
  punchy: THEME_PUNCHY,
  kinetic: THEME_KINETIC,
  editorial: THEME_EDITORIAL,
  golden: THEME_GOLDEN,
  mono: THEME_MONO,
  dreamy: THEME_DREAMY,
} as const;

export type ThemeId = keyof typeof THEMES;

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export const DEFAULT_THEME_ID: ThemeId = "classic";

export const THEME_LABELS: Record<ThemeId, string> = {
  classic: "Cinematic",
  warm: "Film",
  punchy: "Pulse",
  kinetic: "Kinetic",
  editorial: "Editorial",
  golden: "Sunset",
  mono: "Noir",
  dreamy: "Float",
};

/** Resolve a stored theme id to a kit, falling back to Cinematic for an unknown/legacy id. */
export function resolveTheme(themeId: string | null | undefined): ReelTheme {
  return THEMES[(themeId ?? "") as ThemeId] ?? THEME_CLASSIC;
}
