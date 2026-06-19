/**
 * Masonry tile aspect-ratio math (Phase 5 S2a) - pure, shared by the masonry
 * primitive (MasonryColumns) and any host grid that lays tiles out at natural
 * ratios. Kept OUT of the client masonry component so it stays node-unit
 * testable and reusable without pulling the lightbox/React graph in.
 */

// The ratio band for `clamp`: ~2:3 portrait to 3:2 landscape. Tighter than
// reality so a panorama / very tall shot can't dominate a moderation grid (the
// tile's object-cover crops the overflow rather than the tile stretching).
export const MIN_TILE_RATIO = 0.66;
export const MAX_TILE_RATIO = 1.5;

/**
 * width/height -> a CSS aspect-ratio value; "1 / 1" when dims are missing
 * (pre-measure-era rows). With `clamp`, the numeric ratio is bounded into the
 * browseable band above (returned as a single number, which `aspect-ratio`
 * reads as width/height).
 */
export function tileAspect(
  dims: { width?: number | null; height?: number | null },
  clamp = false,
): string {
  if (!dims.width || !dims.height) return "1 / 1";
  if (!clamp) return `${dims.width} / ${dims.height}`;
  const ratio = dims.width / dims.height;
  return `${Math.min(Math.max(ratio, MIN_TILE_RATIO), MAX_TILE_RATIO)}`;
}
