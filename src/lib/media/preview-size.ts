/**
 * Preview-variant sizing math — pure, browser-safe (no DOM), so it stays unit-testable in the node
 * Vitest project (mirrors tile-aspect.ts). The CLIENT generates a small WebP preview at upload (see
 * src/lib/upload/preview.ts) and serves it on TILES; the lightbox + Save keep the full-res original.
 */

/** Longest-edge target for a tile preview. A 3-up/4-up masonry tile on a high-DPR phone renders at
 *  roughly 180-360 CSS px → ~360-720 device px, so 640 stays crisp with headroom while keeping the
 *  WebP in the tens-of-KB range. Bigger erodes the bandwidth win; smaller softens on large/retina tiles. */
export const PREVIEW_MAX_EDGE = 640;
/** WebP: ~25-35% smaller than JPEG at equal quality, universal in the evergreen browsers the uploader
 *  runs in, and supported by canvas.toBlob / OffscreenCanvas.convertToBlob. */
export const PREVIEW_FORMAT = "image/webp";
/** WebP 0.75 is visually near-lossless at thumbnail scale while roughly halving bytes vs 0.9. */
export const PREVIEW_QUALITY = 0.75;

/** Server cap on the preview object size. A 640px WebP is ~20-100 KB, so 2 MB is generous headroom while
 *  BOUNDING the preview PUT: the preview presign binds content-length (like the original), so a client
 *  can't abuse the preview key to store an arbitrary-large object that evades the storage cap. The engine
 *  skips the preview presign (the original still uploads) when a client declares a preview larger than this. */
export const MAX_PREVIEW_BYTES = 2 * 1024 * 1024;

/**
 * The target {width,height} fitting within `maxEdge` on the LONGEST edge, preserving aspect, rounded to
 * ints (each clamped to >= 1). NEVER upscales (scale clamped to <= 1) — a "preview" of an already-small
 * original would be same-size-or-larger waste. Degenerate dims (0 / non-finite) fall back to a 1x1 box;
 * callers should use shouldSkipPreview first to bail entirely.
 */
export function previewTargetSize(
  width: number,
  height: number,
  maxEdge: number = PREVIEW_MAX_EDGE,
): { width: number; height: number } {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return { width: 1, height: 1 };
  }
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * True when a preview is pointless: the original's longest edge is already <= maxEdge (so a downscale
 * would be same-size-or-larger), or the dims are degenerate (can't decide → skip rather than generate
 * a junk preview). The caller returns null (no preview; the tile serves the original).
 */
export function shouldSkipPreview(
  width: number,
  height: number,
  maxEdge: number = PREVIEW_MAX_EDGE,
): boolean {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return true;
  }
  return Math.max(width, height) <= maxEdge;
}
