// Capability probing for the canvas engine, exported so UI can gate on it BEFORE offering an export
// (the spike's lesson: probe canEncodeVideo up front; iPhone Safari and desktop Chrome both pass, but
// the answer must come from the device, not an assumption). ctx.filter is probed separately because a
// browser can encode fine while lacking canvas filters (grades are skipped + reported there).

import { canEncodeVideo, getEncodableVideoCodecs } from "mediabunny";

// DEFAULT_BITRATE comes from ./constants, NOT ./encode. Importing it from
// encode.ts made this module (which the composer runs on mount) a static edge
// to the whole mp4 encoder, so the encoder sat in the host event page's
// first-load chunks however lazily the export path imported it.
import {
  DEFAULT_BITRATE,
  type Orientation,
  reelDimensions,
} from "./constants";
import { detectCtxFilter } from "./canvas2d";

export type EngineSupport = {
  /** Can this browser WebCodecs-encode h264 at the reel's dimensions? Gates the export button. */
  canEncode: boolean;
  /** Every codec mediabunny reports encodable here (diagnostic). */
  codecs: string[];
  /** ctx.filter CSS-string support (false on Safari: grades skip + report, playback still works). */
  ctxFilter: boolean;
  offscreenCanvas: boolean;
};

export { detectCtxFilter };

export async function probeEngineSupport(
  orientation: Orientation | undefined = "portrait",
): Promise<EngineSupport> {
  const { width, height } = reelDimensions(orientation);
  const [canEncode, codecs] = await Promise.all([
    canEncodeVideo("avc", { width, height, bitrate: DEFAULT_BITRATE }),
    getEncodableVideoCodecs(),
  ]);
  return {
    canEncode,
    codecs,
    ctxFilter: detectCtxFilter(),
    offscreenCanvas: typeof OffscreenCanvas !== "undefined",
  };
}
