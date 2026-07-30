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
 * The SANITY band, applied even when `clamp` is off. width/height are declared
 * by the CLIENT at complete-upload and were unbounded, so a single crafted (or
 * simply corrupt) row could set `aspect-ratio: 1 / 100000000` and render a tile
 * kilometres tall, wrecking the album for everyone who opens it.
 *
 * Deliberately MUCH wider than the aesthetic clamp above, because natural
 * ratios are the gallery masonry's whole signature and must not be flattened:
 * 9:16 portrait (0.5625), 16:9 (1.78) and even a 6:1 panorama all pass through
 * untouched. This only catches declarations no real camera produces.
 */
export const MIN_SANE_RATIO = 1 / 6;
export const MAX_SANE_RATIO = 6;

// The ONE fixed aspect for the UNIFORM-grid surfaces (the Reel + the Review triage). A reel reads as
// an ordered SEQUENCE / storyboard (the eventual stitched highlight is portrait-first social format), so
// a portrait 4:5 frame fits people-centric party media + makes the drag-order legible, while `object-cover`
// crops a landscape source gracefully (vs 9:16, which would savage it). The Gallery keeps NATURAL ratios
// (the masonry "wow"). One source of truth so the uniform tile box + any geometry agree.
export const UNIFORM_TILE_ASPECT = "4 / 5";

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
  const ratio = dims.width / dims.height;
  // Negative/NaN/Infinity can arrive from a corrupt row; 1:1 is the same
  // answer we already give for dimension-less pre-measure-era rows.
  if (!Number.isFinite(ratio) || ratio <= 0) return "1 / 1";
  if (clamp)
    return `${Math.min(Math.max(ratio, MIN_TILE_RATIO), MAX_TILE_RATIO)}`;
  // Natural ratio preserved for everything plausible; only absurd declarations
  // are pulled back to the edge of the sanity band (object-cover then crops).
  if (ratio < MIN_SANE_RATIO) return `${MIN_SANE_RATIO}`;
  if (ratio > MAX_SANE_RATIO) return `${MAX_SANE_RATIO}`;
  return `${dims.width} / ${dims.height}`;
}
