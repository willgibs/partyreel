// The reel's render dimensions + frame rate. ONE source so the live canvas player and the on-device
// WebCodecs export (one draw fn) can never drift. 24fps montage (the product shape: docs/systems/host-app.md, the reel section). The reel
// ships in two ORIENTATIONS the host toggles: portrait 9:16 (default) and landscape 16:9 — every style
// adapts to both from one core, so derive dims via reelDimensions(orientation), never hard-code a pair.
export const FPS = 24;

// Encode bitrates live HERE, not in encode.ts, so that reading one number can
// never drag the whole mp4 encoder into a bundle. support.ts needs
// DEFAULT_BITRATE to probe capability ON MOUNT, and while it imported that from
// encode.ts the encoder (mediabunny muxer + asset loader + the draw registry)
// was pulled into the host event page's FIRST-LOAD chunk set no matter how
// lazily the export path itself imported it. Constants are free; the encoder is
// not. Bitrate default 5 Mbps; the parity harness exposes 4/5/8.
export const ENCODE_BITRATES = [4_000_000, 5_000_000, 8_000_000] as const;
export const DEFAULT_BITRATE = 5_000_000;

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
