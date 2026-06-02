/**
 * Pure crop math for the avatar cropper. The cropper shows the source image in a SQUARE
 * viewport (the circular mask is just a CSS overlay) and lets the user pan + zoom; this
 * function maps that on-screen frame back to a square region of SOURCE pixels, which the
 * component then draws onto a square output canvas. Pure (no DOM) so it unit-tests cleanly —
 * the `createImageBitmap` / canvas glue stays in the client component.
 *
 * Model (matches the component):
 *   - At zoom = 1 the image is scaled "cover" to fill the viewport, so the visible square is
 *     the largest centred square of the source: side = min(srcW, srcH).
 *   - Zooming in shrinks the captured square: side = min(srcW, srcH) / zoom.
 *   - Panning translates the image under the viewport; offset is in CSS px and is converted to
 *     source px via the on-screen display scale.
 *   - The result is clamped so the square never leaves the image bounds.
 */

/** Output is a square at this edge length. 512px is the "sharp & generous" target. */
export const AVATAR_OUTPUT_SIZE = 512;

/** webp encode quality for canvas.toBlob — high enough to stay crisp, low enough to stay light. */
export const AVATAR_WEBP_QUALITY = 0.9;

export type CropRect = { sx: number; sy: number; side: number };

function clamp(value: number, min: number, max: number): number {
  // max can be < min for a square exactly as large as the image (range collapses to [min,min]).
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

export function computeCropRect(input: {
  srcW: number;
  srcH: number;
  /** Square viewport edge length in CSS px. */
  viewport: number;
  /** >= 1 (1 = cover-fit, no zoom). Values below 1 are treated as 1. */
  zoom: number;
  /** Image pan within the viewport, CSS px (0 = centred). */
  offsetX: number;
  offsetY: number;
}): CropRect {
  const { srcW, srcH, viewport, offsetX, offsetY } = input;
  const zoom = Math.max(input.zoom, 1);

  const minEdge = Math.min(srcW, srcH);
  const side = minEdge / zoom;

  // On-screen px per source px at this zoom (cover-fit base * zoom).
  const displayScale = (viewport / minEdge) * zoom;

  // Viewport centre maps to the image centre, shifted opposite the pan.
  const cx = srcW / 2 - offsetX / displayScale;
  const cy = srcH / 2 - offsetY / displayScale;

  const sx = clamp(cx - side / 2, 0, srcW - side);
  const sy = clamp(cy - side / 2, 0, srcH - side);

  return { sx, sy, side };
}
