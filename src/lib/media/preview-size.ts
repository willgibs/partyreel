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

/* ── the phone-size copy (take-home r1, `save=light`, Will 2026-10-03) ───────────────────────── */

/**
 * THE PHONE-SIZE COPY: every new photograph's second derivative, made in the uploader's browser beside
 * its preview (`upload/preview.ts`) and PUT as the reserved `phone` variant (`r2/keys.ts`). It is what a
 * guest's Save puts into Photos and what a host's Phone size takes home: sharp in any post and on any
 * phone, about a fifth of an original's bytes (the board's carried `size`). Videos stay as taken.
 *
 * ★ NEVER METERED, SO CAPPED TWICE. Like the preview it is not counted against the host's storage (his
 * rule: "every single image action matters", and a phone copy is ours to make, not hers to pay for),
 * so an unbounded one at its server-built key would be storage nobody pays for. Its PUT binds
 * content-length (presign), and it must fit BOTH caps: 4 MB, and half its original's bytes, checked at
 * presign on the declared sizes and again at complete on the HEAD's (`phoneCopyFits`), and a third time
 * in `create_media*`. A photograph that cannot make one (already phone size, an undecodable HEIC, a
 * copy that came out heavier than half) simply has none, and its original serves everywhere instead.
 */
export const PHONE_MAX_EDGE = 2048;
/** JPEG: what every phone's Photos, every post and every share sheet takes without a second thought. */
export const PHONE_FORMAT = "image/jpeg";
/** The encoder's quality: near the camera's own look at 2048 px, about a fifth of a 12 MP original. */
export const PHONE_QUALITY = 0.82;
/** The copy's own ceiling, whatever its original weighs (mirrored by `create_media*`'s `c_max_phone_bytes`). */
export const MAX_PHONE_BYTES = 4 * 1024 * 1024;

/** The phone copy's pixels: the long side brought to 2048, never upscaled. */
export function phoneTargetSize(
  width: number,
  height: number,
): { width: number; height: number } {
  return previewTargetSize(width, height, PHONE_MAX_EDGE);
}

/** True when a photograph is already phone size (or its dims cannot be read): its original serves. */
export function shouldSkipPhoneCopy(width: number, height: number): boolean {
  return shouldSkipPreview(width, height, PHONE_MAX_EDGE);
}

/**
 * Whether a phone copy of `phoneBytes` may stand beside an original of `originalBytes`: a whole, positive
 * size, at most 4 MB, and at most half the original. The one rule the browser, the presign, the complete
 * and the database all apply (the last in its own words).
 */
export function phoneCopyFits(
  phoneBytes: number,
  originalBytes: number,
): boolean {
  return (
    Number.isInteger(phoneBytes) &&
    phoneBytes > 0 &&
    phoneBytes <= MAX_PHONE_BYTES &&
    Number.isFinite(originalBytes) &&
    phoneBytes * 2 <= originalBytes
  );
}
