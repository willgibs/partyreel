/**
 * MAKING THE FILE: the clip's encode on this device, and the still the album shows for it.
 *
 * The encode is the engine's own (`engine/encode.ts`: the SAME `drawReelFrame` the player runs,
 * stepped frame by frame through WebCodecs h264 into an mp4), so the file is exactly what the maker
 * watched. This module adds only what a clip needs around it:
 *
 * ★ A BACKGROUNDED TAB PAUSES (`wait=stack`). A phone that locks, or a maker who switches apps,
 * would otherwise leave the loop drawing into a throttled, possibly context-less canvas. The
 * encoder's async seam (`prepareFrame`, awaited once before each frame and never inside a draw)
 * holds the loop until the tab is visible again, and says so, so the stack can tell the maker.
 *
 * ★ THE ENCODER LOADS ON DEMAND. mediabunny's muxer and encoder are the heaviest thing the creator
 * touches, so they arrive with the first Make it (or the idle warm-up the creator starts on
 * mount), never with the creator's first paint.
 *
 * ★ THE POSTER IS DRAWN, NOT SEEKED. The album needs a still for the clip (`addClipToAlbum`'s
 * poster, `uploader.ts`'s preview). A browser that has only just encoded a video may still be unable
 * to decode it, and the engine can draw any frame on demand, so the poster is the clip's own frame,
 * drawn once at a small size.
 *
 * Client-only: a DOM canvas, WebCodecs, `document.visibilityState`.
 */
import { sharedBitmapCache } from "@/lib/reel/engine/asset-cache";
import { loadReelAssets } from "@/lib/reel/engine/assets";
import { FPS, reelDimensions } from "@/lib/reel/engine/constants";
import {
  drawReelFrame,
  engineStyleDuration,
  makeScaledDrawEnv,
  resolveEngineStyle,
} from "@/lib/reel/engine/registry";
import type { ReelProps } from "@/lib/reel/engine/reel-types";

/**
 * The frame a still of a clip shows: about 1.9 s in, past every look's opening transition, so it
 * carries the look's grade and its composition (the Studio's thumbs and the lab's stills agree).
 */
export const CLIP_STILL_FRAME = 45;

/** The album's poster is a preview, re-encoded to the preview's own size by the uploader. */
const POSTER_MAX_DIM = 960;

/** Warm the encoder's chunk while the maker is still choosing (idle, never on the first paint). */
export function preloadClipEncoder(): void {
  void import("@/lib/reel/engine/encode");
}

/** Resolves once the tab is visible again; rejects with an AbortError if the encode is cancelled. */
function untilVisible(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("clip encode aborted", "AbortError"));
      return;
    }
    const done = () => {
      document.removeEventListener("visibilitychange", onChange);
      signal.removeEventListener("abort", onAbort);
    };
    const onChange = () => {
      if (document.visibilityState !== "visible") return;
      done();
      resolve();
    };
    const onAbort = () => {
      done();
      reject(new DOMException("clip encode aborted", "AbortError"));
    };
    document.addEventListener("visibilitychange", onChange);
    signal.addEventListener("abort", onAbort);
  });
}

export type EncodedClip = {
  file: File;
  /** The clip's own frame for the album's tile; null when it would not draw (the uploader then
   *  generates one from the file). */
  poster: Blob | null;
  seconds: number;
};

/**
 * Encode a clip into a named mp4. `onProgress` reports 0..1 of the frames drawn; `onPaused` flips
 * while a hidden tab holds the loop. Cancelling (`signal`) rejects with an AbortError, and any other
 * failure (a lost GPU context, an encoder that gave up) rejects with the encoder's own error: the
 * creator lands on the finish with Retry and the picks kept either way.
 */
export async function encodeClip(
  props: ReelProps,
  opts: {
    filename: string;
    signal: AbortSignal;
    onProgress: (progress: number) => void;
    onPaused?: (paused: boolean) => void;
  },
): Promise<EncodedClip> {
  const { encodeReel } = await import("@/lib/reel/engine/encode");
  const encoded = await encodeReel(props, {
    signal: opts.signal,
    onProgress: opts.onProgress,
    prepareFrame: () => {
      if (document.visibilityState === "visible") return;
      opts.onPaused?.(true);
      return untilVisible(opts.signal).finally(() => opts.onPaused?.(false));
    },
  });
  const file = new File([encoded.blob], opts.filename, { type: "video/mp4" });
  const poster = await drawClipStill(props, CLIP_STILL_FRAME, POSTER_MAX_DIM);
  return { file, poster, seconds: encoded.totalFrames / FPS };
}

/**
 * One frame of a clip, drawn by the engine onto a small offscreen canvas, as a WebP blob. Never
 * throws: a capability gap or a still that would not decode answers null.
 */
export async function drawClipStill(
  props: ReelProps,
  frame: number,
  maxDim: number,
): Promise<Blob | null> {
  try {
    const composition = reelDimensions(props.orientation);
    const longest = Math.max(composition.width, composition.height);
    const ratio = Math.min(1, maxDim / longest);
    const w = Math.max(2, Math.round(composition.width * ratio));
    const h = Math.max(2, Math.round(composition.height * ratio));
    const assets = await loadReelAssets(props.clips, {
      ...resolveEngineStyle(props.styleId).assetNeeds(props),
      frame: { width: w, height: h },
      decode: sharedBitmapCache.decode,
    });
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const last = Math.max(0, engineStyleDuration(props.styleId, props) - 1);
    // The styles never learn they are small: the env reports composition space and one pre-scale
    // squeezes the draw onto the backing store (the player's thumb path).
    ctx.setTransform(w / composition.width, 0, 0, h / composition.height, 0, 0);
    drawReelFrame(
      ctx,
      Math.min(frame, last),
      props,
      assets,
      makeScaledDrawEnv(composition),
    );
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/webp", 0.86),
    );
  } catch {
    return null;
  }
}
