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
 * THE BAND A JUSTIFIED ROW CLAMPS TO (`album-rows.ts`). Much tighter than the
 * masonry's sanity band, because a row gives every photograph the SAME height:
 * a 6:1 panorama at the row's height is a ribbon six photographs wide, and a
 * 1:6 strip is a sliver. 1:2 keeps a 9:16 phone video whole (0.5625) and 2.4
 * keeps a 21:9 ultrawide whole; anything past either edge crops (the tile's
 * `object-cover`), which is what "extreme ratios clamp" means for rows.
 */
export const ROW_MIN_RATIO = 0.5;
export const ROW_MAX_RATIO = 2.4;

/**
 * THE RATIO A ROW LAYS A PHOTOGRAPH WITH NO DIMENSIONS AT: the same square
 * `tileAspect` gives a pre-measure-era row, so the two layouts agree about a
 * photograph nobody measured.
 */
export const ROW_FALLBACK_RATIO = 1;

/**
 * width/height -> the NUMBER a justified row lays a tile at. Missing, zero,
 * negative or non-finite dimensions take `ROW_FALLBACK_RATIO`; `clamp` is the
 * host's moderation band (the same one `tileAspect` clamps to), and without it
 * the row band above.
 */
export function rowRatio(
  dims: { width?: number | null; height?: number | null },
  clamp = false,
): number {
  if (!dims.width || !dims.height) return ROW_FALLBACK_RATIO;
  const ratio = dims.width / dims.height;
  if (!Number.isFinite(ratio) || ratio <= 0) return ROW_FALLBACK_RATIO;
  const [min, max] = clamp
    ? [MIN_TILE_RATIO, MAX_TILE_RATIO]
    : [ROW_MIN_RATIO, ROW_MAX_RATIO];
  return Math.min(Math.max(ratio, min), max);
}

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
