// The reel's render dimensions + frame rate. ONE source so the live canvas player and the on-device
// WebCodecs export (one draw fn) can never drift. 24fps montage (see docs/specs/reel-v1.md). The reel
// ships in two ORIENTATIONS the host toggles: portrait 9:16 (default) and landscape 16:9 — every style
// adapts to both from one core, so derive dims via reelDimensions(orientation), never hard-code a pair.
export const FPS = 24;

// Portrait 9:16 (the default; REEL_WIDTH/REEL_HEIGHT stay the portrait pair for back-compat).
export const REEL_WIDTH = 1080;
export const REEL_HEIGHT = 1920;

// Landscape 16:9.
export const REEL_LANDSCAPE_WIDTH = 1920;
export const REEL_LANDSCAPE_HEIGHT = 1080;

export type Orientation = "portrait" | "landscape";

export const DEFAULT_ORIENTATION: Orientation = "portrait";

/** The render dimensions for an orientation (defaults to portrait for an unknown/missing value). */
export function reelDimensions(orientation: Orientation | undefined | null): {
  width: number;
  height: number;
} {
  return orientation === "landscape"
    ? { width: REEL_LANDSCAPE_WIDTH, height: REEL_LANDSCAPE_HEIGHT }
    : { width: REEL_WIDTH, height: REEL_HEIGHT };
}
