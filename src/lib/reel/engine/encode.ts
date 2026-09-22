// The export pipeline: step the SAME drawReelFrame the live player runs, frame by frame, through
// WebCodecs h264 into an mp4 (mediabunny Output + CanvasSource). This is the spike's proven loop
// (30s reel: ~2.9s desktop, ~8.2s iPhone), productionized: bitrate as an option, progress callback,
// AbortSignal cancellation, and a Blob out. `await source.add()` is the load-bearing line: it applies
// encoder backpressure so the draw loop can never outrun WebCodecs (dropping it makes fast devices
// buffer unbounded frames).
//
// Bitrate defaults to 5 Mbps: the spike probed 8 (chosen then only to test the "saner than Lambda's
// 12 Mbps" question); the harness exposes 4/5/8 so Will can eyeball where quality plateaus for
// photo montages. Client-only module (DOM canvas + WebCodecs); never import it server-side.

import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
} from "mediabunny";

import { DEFAULT_BITRATE, FPS, reelDimensions } from "./constants";
import type { ReelProps } from "./reel-types";
import { loadReelAssets, type ReelAssets } from "./assets";
import {
  drawReelFrame,
  engineStyleDuration,
  makeDrawEnv,
  resolveEngineStyle,
} from "./registry";

// Moved to ./constants (a bitrate number must not drag the encoder into a
// bundle); re-exported so the dev parity harness + the budget parity test keep
// their existing import path.
export { ENCODE_BITRATES, DEFAULT_BITRATE } from "./constants";

export type EncodeReelOptions = {
  /** Target video bitrate in bps (default 5 Mbps). */
  bitrate?: number;
  /** 0..1, called every few frames. */
  onProgress?: (progress: number) => void;
  /** Abort mid-encode (throws an AbortError after cancelling the output). */
  signal?: AbortSignal;
  /** Reuse already-loaded assets (e.g. the player's); otherwise decoded fresh here. */
  assets?: ReelAssets;
  /** Capability-gap reports from the draw (deduplicated). */
  onReport?: (message: string) => void;
  /**
   * THE ASYNC SEAM FOR MOTION VIDEO (the reel round, 2026-09-22). Awaited ONCE before each
   * drawReelFrame, so a reel carrying video clips can pull the frames it is about to need through
   * the same range-window reader the live player uses, sequentially, while the draw itself stays
   * synchronous (registry.ts's ★ pooled-scratch invariant depends on that, and would break the
   * moment a draw awaited). Omitted — every reel without video — costs nothing: the loop below
   * never awaits it.
   *
   * It must RESOLVE, never reject: a window that will not land is a poster, not a failed export.
   * src/lib/reel/engine/video/prepare-frame.ts builds the one the cut's encoder passes.
   */
  prepareFrame?: (frame: number) => void | Promise<void>;
};

export type EncodedReel = {
  blob: Blob;
  totalFrames: number;
  /** Encode wall time in ms (the realtime ratio = duration / wall). */
  wallMs: number;
};

export async function encodeReel(
  props: ReelProps,
  options: EncodeReelOptions = {},
): Promise<EncodedReel> {
  const {
    bitrate = DEFAULT_BITRATE,
    onProgress,
    signal,
    onReport,
    prepareFrame,
  } = options;
  const { width, height } = reelDimensions(props.orientation);
  const totalFrames = engineStyleDuration(props.styleId, props);

  const assets =
    options.assets ??
    (await loadReelAssets(props.clips, {
      ...resolveEngineStyle(props.styleId).assetNeeds(props),
      frame: { width, height },
      signal,
    }));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable for the encode canvas");
  const env = makeDrawEnv(canvas, onReport);

  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  });
  const source = new CanvasSource(canvas, { codec: "avc", bitrate });
  output.addVideoTrack(source);
  await output.start();

  const started = performance.now();
  try {
    for (let f = 0; f < totalFrames; f += 1) {
      if (signal?.aborted) {
        throw new DOMException("reel encode aborted", "AbortError");
      }
      if (prepareFrame) await prepareFrame(f);
      drawReelFrame(ctx, f, props, assets, env);
      await source.add(f / FPS, 1 / FPS);
      if (f % 12 === 0) onProgress?.(f / totalFrames);
    }
    await output.finalize();
  } catch (err) {
    // Release the encoder/muxer before propagating (also the cancellation path).
    try {
      await output.cancel();
    } catch {
      // Already finalized/cancelled; the original error is the one that matters.
    }
    throw err;
  }

  onProgress?.(1);
  const buffer = (output.target as BufferTarget).buffer;
  if (!buffer) throw new Error("encode produced no buffer");
  return {
    blob: new Blob([buffer], { type: "video/mp4" }),
    totalFrames,
    wallMs: Math.round(performance.now() - started),
  };
}
