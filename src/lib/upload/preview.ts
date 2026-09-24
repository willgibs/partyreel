/**
 * CLIENT-SIDE preview generation (browser-only). The browser downscales each upload to a small WebP and
 * the uploader PUTs it as the reserved `preview` R2 variant (see uploader.ts) — so generation costs $0
 * and scales with the client, never an external transform fee. Tiles then serve this small preview while
 * the lightbox + Save keep the full-res original.
 *
 * Best-effort by construction: generatePreview NEVER throws and returns null on ANY skip/failure
 * (already-small original, decode error, OOM, an undecodable video codec, no `seeked`, a non-WebP encode
 * fallback). A null just means "no preview" — the tile serves the original (graceful), and a future
 * server-side backfill could fill the gap.
 */
import {
  PREVIEW_FORMAT,
  PREVIEW_QUALITY,
  previewTargetSize,
  shouldSkipPreview,
} from "@/lib/media/preview-size";

export type GeneratedPreview = { blob: Blob; ext: "webp" };

// Resolve true on the success event, false on "error" or a timeout (so a stuck decode/seek can never
// hang the upload). Listeners are one-shot + cleaned up.
function waitEvent(
  el: EventTarget,
  success: string,
  timeoutMs: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      el.removeEventListener(success, onOk);
      el.removeEventListener("error", onErr);
      resolve(ok);
    };
    const onOk = () => finish(true);
    const onErr = () => finish(false);
    el.addEventListener(success, onOk, { once: true });
    el.addEventListener("error", onErr, { once: true });
    setTimeout(() => finish(false), timeoutMs);
  });
}

// Draw a decoded source (ImageBitmap / <img> / <video>) onto a target-sized canvas and encode WebP.
// Prefers OffscreenCanvas (no DOM attach); returns null if the encode didn't actually produce WebP (a
// browser without canvas WebP support falls back to PNG → we'd be mislabeling, so we skip instead).
async function sourceToWebpBlob(
  source: CanvasImageSource,
  tw: number,
  th: number,
): Promise<Blob | null> {
  let blob: Blob | null = null;
  if (typeof OffscreenCanvas !== "undefined") {
    const c = new OffscreenCanvas(tw, th);
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(source, 0, 0, tw, th);
    blob = await c.convertToBlob({
      type: PREVIEW_FORMAT,
      quality: PREVIEW_QUALITY,
    });
  } else {
    const c = document.createElement("canvas");
    c.width = tw;
    c.height = th;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(source, 0, 0, tw, th);
    blob = await new Promise<Blob | null>((res) =>
      c.toBlob(res, PREVIEW_FORMAT, PREVIEW_QUALITY),
    );
  }
  if (!blob || blob.type !== PREVIEW_FORMAT || blob.size === 0) return null;
  return blob;
}

async function generatePhotoPreview(
  file: File,
  width: number,
  height: number,
): Promise<Blob | null> {
  if (shouldSkipPreview(width, height)) return null; // already small enough
  const { width: tw, height: th } = previewTargetSize(width, height);

  // Preferred: decode + downscale in one step (avoids decoding a 50MP photo into a full-res canvas →
  // the main OOM risk). If a browser can't decode a File via createImageBitmap (older Safari) or ignores
  // the resize options, we fall back to an <img> + canvas (drawImage still downsizes to tw x th).
  try {
    const bmp = await createImageBitmap(file, {
      resizeWidth: tw,
      resizeHeight: th,
      resizeQuality: "high",
    });
    const blob = await sourceToWebpBlob(bmp, tw, th);
    bmp.close();
    return blob;
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      const ok = await waitEvent(img, "load", 5000);
      if (!ok) return null;
      return await sourceToWebpBlob(img, tw, th);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

async function generateVideoPreview(
  file: File,
  measured: { width?: number; height?: number },
): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    if (!(await waitEvent(video, "loadedmetadata", 5000))) return null;
    const vw = video.videoWidth || measured.width || 0;
    const vh = video.videoHeight || measured.height || 0;
    if (!vw || !vh) return null;

    // Seek a touch in (~0.1s) — the first frame is often black (same rationale as videoPosterSrc's #t=0.1).
    const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    video.currentTime = Math.min(0.1, dur * 0.1);
    if (!(await waitEvent(video, "seeked", 3000))) return null;

    const { width: tw, height: th } = previewTargetSize(vw, vh);
    return await sourceToWebpBlob(video, tw, th);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * THE CUT'S POSTER, AS ITS PREVIEW (the live reel's cut seam, 2026-09-24). The on-device creator
 * already holds the frame it wants the album to show for a cut (it drew it), so `addCutToAlbum`
 * hands that image in rather than asking this module to seek into a freshly encoded video, which a
 * browser that just encoded it may still be unable to decode. It is re-encoded to the preview's own
 * WebP at the preview's own size, so the presigned PUT's content type and length bind exactly as
 * they do for every other preview. Null on any failure: the generated preview is then the fallback.
 */
export async function posterPreview(
  poster: Blob,
): Promise<GeneratedPreview | null> {
  try {
    const bmp = await createImageBitmap(poster);
    try {
      const { width: tw, height: th } = previewTargetSize(bmp.width, bmp.height);
      const blob = await sourceToWebpBlob(bmp, tw, th);
      return blob ? { blob, ext: "webp" } : null;
    } finally {
      bmp.close();
    }
  } catch {
    return null;
  }
}

/**
 * Generate a small WebP preview blob for an upload, or null (skip — the tile serves the original).
 * `measured` is the width/height/duration the uploader already read for the row (reused here).
 */
export async function generatePreview(
  file: File,
  kind: "photo" | "video",
  measured: { width?: number; height?: number },
): Promise<GeneratedPreview | null> {
  try {
    const blob =
      kind === "photo"
        ? await generatePhotoPreview(file, measured.width ?? 0, measured.height ?? 0)
        : await generateVideoPreview(file, measured);
    return blob ? { blob, ext: "webp" } : null;
  } catch {
    // Anything unexpected (OOM, a canvas/security error) → no preview; the original is what matters.
    return null;
  }
}
