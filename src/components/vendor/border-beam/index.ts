/*
 * Vendored from border-beam v1.4.0 (MIT) — https://github.com/Jakubantalik/Libraries
 *
 * MIT License. Copyright (c) 2026 Jakub Antalik. Full text in ./LICENSE.
 * The notice is retained here because MIT requires it in copies of the source;
 * user-facing credit belongs on the attributions page, not in the UI.
 *
 * ── WHY THIS IS VENDORED RATHER THAN REIMPLEMENTED ──
 * Three hand-ports of this effect were attempted and all three missed, in the
 * same direction each time: inferring the effect from computed styles and
 * screenshots, substituting our low-chroma five for its saturated palette, then
 * compensating with saturate() until it read as neon. The motion alone is
 * eighteen desynced oscillators plus a hue revolution. This is a UI package with
 * no runtime dependencies; copying it exactly is both cheaper and more honest
 * than approximating it.
 *
 * ★ DO NOT RESTYLE THESE FILES. The only deviations from upstream are marked
 * `PARTYREEL:` — a "use client" directive, and one extra colorPalettes entry so
 * our own hues can be A/B'd against theirs from a single prop.
 */
export { BorderBeam } from './BorderBeam';
export { default } from './BorderBeam';

export type {
  BorderBeamProps,
  BorderBeamSize,
  BorderBeamTheme,
  BorderBeamColorVariant,
  SizeConfig,
  ThemeColors,
} from './types';

export { sizePresets, sizeThemePresets, themeColors } from './styles';
