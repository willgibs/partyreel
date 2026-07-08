// Asset loading for the canvas engine: every ReelClip url is decoded ONCE (createImageBitmap where
// available, HTMLImageElement fallback), and any derived per-clip artifacts the style declares (the
// pre-blurred washes) are built ONCE here too. WHY decode-once: the draw loop runs 24-60x/s live and
// flat-out during encode; any per-frame decode or blur would dominate the frame budget and wreck the
// spike's proven encode ratios. The frame loop only ever does scaled draws of what this module built.
//
// v1 scope note: the engine renders STILLS (photos + video posters). A video clip's url is already its
// poster in posterMode (build-reel-props), so everything here is an image; real video decode is the
// later Pro-trim slice. An EMPTY url (a posterless video) loads as null and draws as the theme-color
// hold, exactly like the Remotion ClipLayer. A FAILED load also becomes null + a failure count:
// graceful hold, never a crash.
//
// CORS: canvas readback (the encode) requires CORS-clean pixels. R2 presigned GETs and same-origin
// fixtures are fine; a tainting source (e.g. picsum in the old lab) would throw at encode time, which
// is why the parity harness feeds local /design fixtures.

import type { ReelClip } from "../composition/reel-types";
import {
  buildHalo,
  buildWash,
  detectCtxFilter,
  GRAIN_TILE_URI,
  sourceSize,
  type CanvasImage,
} from "./canvas2d";

export type ClipAsset = {
  image: CanvasImage;
  /** Intrinsic pixel size (used for cover/contain placement; fitClip uses the CLIP's declared dims). */
  width: number;
  height: number;
  /** The pre-blurred backdrop wash (only built when the style's assetNeeds asked for washes). */
  wash: HTMLCanvasElement | null;
  /** The pre-built halation halo: grade + bright-pass + blur, PHOTOS only (only when haloFilter set). */
  halo: HTMLCanvasElement | null;
};

export type ReelAssets = {
  /** Parallel to props.clips; null = nothing to draw (empty url or failed load) -> theme-color hold. */
  clips: (ClipAsset | null)[];
  /** How many non-empty urls failed to load (surfaced by the player/harness, not thrown). */
  failures: number;
  /** The feTurbulence grain tile (only decoded when the style's overlays include "grain"). */
  grain: CanvasImage | null;
};

async function decodeOne(
  url: string,
  signal?: AbortSignal,
): Promise<CanvasImage> {
  // Preferred: fetch + createImageBitmap (off-main-thread decode, works for same-origin + CORS-open
  // hosts like the presigned R2 urls).
  if (typeof createImageBitmap === "function") {
    try {
      const res = await fetch(url, { mode: "cors", signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await createImageBitmap(await res.blob());
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      // Fall through to the <img> path (some hosts reject fetch CORS but allow crossOrigin images).
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image load failed: ${url}`));
    img.src = url;
  });
}

export async function loadReelAssets(
  clips: ReelClip[],
  opts: {
    washes: boolean;
    /** Decode the feTurbulence grain tile (styles whose overlays include "grain"). */
    grain?: boolean;
    /** Build per-clip halation halos with this color chain (styles with signature.halation). */
    haloFilter?: string | null;
    signal?: AbortSignal;
  } = { washes: false },
): Promise<ReelAssets> {
  // Dedupe by url: the same media can appear twice (cover hoist edge cases); decode it once.
  const byUrl = new Map<string, Promise<CanvasImage>>();
  let failures = 0;

  // The grain tile decodes in parallel with the clips; a failure is a graceful null (the draw
  // reports + skips grain), never a crash.
  const grainPromise = opts.grain
    ? decodeOne(GRAIN_TILE_URI, opts.signal).catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") throw err;
        return null;
      })
    : Promise.resolve(null);

  const results = await Promise.all(
    clips.map(async (clip): Promise<ClipAsset | null> => {
      if (!clip.url) return null;
      let promise = byUrl.get(clip.url);
      if (!promise) {
        promise = decodeOne(clip.url, opts.signal);
        byUrl.set(clip.url, promise);
      }
      try {
        const image = await promise;
        const { w, h } = sourceSize(image);
        return { image, width: w, height: h, wash: null, halo: null };
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") throw err;
        failures += 1;
        return null;
      }
    }),
  );

  if (opts.washes) {
    // Build each unique image's wash once, then share it across clips with the same url.
    const washByImage = new Map<CanvasImage, HTMLCanvasElement>();
    for (const asset of results) {
      if (!asset) continue;
      let wash = washByImage.get(asset.image);
      if (!wash) {
        wash = buildWash(asset.image);
        washByImage.set(asset.image, wash);
      }
      asset.wash = wash;
    }
  }

  if (opts.haloFilter) {
    // Halation is photo-only (clip-media renders no halation Img for videos, even in posterMode),
    // so halos are keyed per (image, photo) and shared across same-url clips like the washes.
    const filterOk = detectCtxFilter();
    const haloByImage = new Map<CanvasImage, HTMLCanvasElement>();
    results.forEach((asset, i) => {
      if (!asset || clips[i].type !== "photo") return;
      let halo = haloByImage.get(asset.image);
      if (!halo) {
        halo = buildHalo(asset.image, opts.haloFilter!, filterOk);
        haloByImage.set(asset.image, halo);
      }
      asset.halo = halo;
    });
  }

  return { clips: results, failures, grain: await grainPromise };
}
