// The starter theme kits (a "vibe" = a color grade + pacing + motion feel). v1 ships 3; the full
// per-kit motion vocabulary (transition sets, intro/outro) is a later design-lab slice. `theme` is
// stored as a TEXT id on highlight_reels and validated against THEMES here (no DB enum → new kits add
// freely). A per-reel seed samples WITHIN a kit, so same-kit reels still feel unique.
import { type ReelTheme, THEME_CLASSIC } from "./reel-types";

/** Sun-warmed, gentle, lingering — weddings, golden hour, family. */
export const THEME_WARM: ReelTheme = {
  grade: "sepia(0.15) saturate(1.15) contrast(1.05) brightness(1.02)",
  background: "#140f0c",
  photoHoldSec: 2.6,
  crossfadeSec: 0.6,
  kenBurnsZoom: 0.1,
};

/** High-energy, snappy, saturated — parties, clubs, hype. */
export const THEME_PUNCHY: ReelTheme = {
  grade: "saturate(1.3) contrast(1.12) brightness(1.02)",
  background: "#000000",
  photoHoldSec: 2.0,
  crossfadeSec: 0.35,
  kenBurnsZoom: 0.06,
};

export const THEMES = {
  classic: THEME_CLASSIC,
  warm: THEME_WARM,
  punchy: THEME_PUNCHY,
} as const;

export type ThemeId = keyof typeof THEMES;

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export const DEFAULT_THEME_ID: ThemeId = "classic";

export const THEME_LABELS: Record<ThemeId, string> = {
  classic: "Classic",
  warm: "Warm",
  punchy: "Punchy",
};

/** Resolve a stored theme id to a kit, falling back to Classic for an unknown/legacy id. */
export function resolveTheme(themeId: string | null | undefined): ReelTheme {
  return THEMES[(themeId ?? "") as ThemeId] ?? THEME_CLASSIC;
}
