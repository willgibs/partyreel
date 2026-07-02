// The media-fit policy (pure, no remotion → server-safe + unit-tested). Will's rule: media whose
// orientation MATCHES the reel fills the frame (cover); media that MISMATCHES is FIT (contained, leaving the
// style's designed negative space) rather than zoom-cropped — better honest space than a bad crop. A
// near-square tolerance keeps roughly-square media on cover in either orientation (it crops cleanly).

export type FitMode = "cover" | "fit";

// Aspect ratios within this band of 1:1 count as "square enough" to always cover (a clean center crop).
const SQUARE_LOW = 0.82;
const SQUARE_HIGH = 1.22;

function isPortrait(w: number, h: number): boolean {
  return h > w;
}

/**
 * Decide how a clip sits in the reel frame. Unknown media dimensions → cover (the safe legacy default).
 * Square-ish media → cover. Otherwise: cover when the media + reel share an orientation, fit when they
 * don't (the portrait-photo-in-a-landscape-reel case, and vice versa).
 */
export function fitClip(
  mediaW: number | undefined,
  mediaH: number | undefined,
  reelW: number,
  reelH: number,
): FitMode {
  if (!mediaW || !mediaH || mediaW <= 0 || mediaH <= 0) return "cover";
  const aspect = mediaW / mediaH;
  if (aspect >= SQUARE_LOW && aspect <= SQUARE_HIGH) return "cover";
  return isPortrait(mediaW, mediaH) === isPortrait(reelW, reelH) ? "cover" : "fit";
}
