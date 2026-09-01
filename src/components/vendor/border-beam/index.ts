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
 * seventeen desynced oscillators plus a hue revolution (eighteen drivers in
 * all). This is a UI package with no runtime dependencies; copying it exactly
 * is both cheaper and more honest than approximating it.
 *
 * ★ DO NOT RESTYLE THESE FILES. Every deviation from upstream is marked
 * `PARTYREEL:`. There are TWO deviations in intent, across SEVEN in-body marked
 * sites plus this header in each file (11 marks in all, pinned exactly by
 * border-beam-vendor.test.ts):
 *   1. a "use client" directive, which Next 16 needs;
 *   2. one extra colorPalettes entry, so our own hues can be A/B'd against
 *      theirs from a single prop. That entry is what forces the other four
 *      marked sites: adding a fifth member to the colour union means the four
 *      `*Base`-rename-and-respread edits in styles.ts (340/486/550/649) are
 *      LOAD-BEARING under strict TS, since indexing a 4-key map with a 5-member
 *      union is TS7053. Do not "simplify" them back; the build fails.
 * A future upstream bump re-applies exactly those. Nothing else here is ours.
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
