/**
 * A SHOT, TAKEN: the photograph at full size, and the small picture the reel shows the instant the shutter fires.
 * Browser drawing only; what to keep and which way to take it is `frame-math.ts`'s.
 *
 * ★ THE MOMENT IS THE TAP'S. The small picture is drawn from the live picture synchronously inside the shutter's own
 * handler (`drawThumb`), so the reel's frame freezes on the very moment she pressed; the full photograph is drawn in
 * the same tick (`drawFrame`) and only its JPEG encoding waits, which `canvas.toBlob` does from a copy taken at the
 * call, so the next shot may draw over the canvas at once.
 *
 * ★ JPEG AT 0.92 (his phone line: a 12.2 MP frame is 2.6 MB at 0.92, where `takePhoto` handed 7.6 MB for the same
 * pixels and the phone's own camera 2.9 MB). A canvas carries no EXIF, so no location ever rides a shot.
 *
 * ★ A FRONT-CAMERA SHOT IS KEPT AS SHE SAW IT (`mirror`), the way the iPhone's camera keeps a selfie by default.
 */
import {
  cropRect,
  sameOrientation,
  thumbSize,
  type Rect,
} from "@/lib/guest/camera/frame-math";
import type { StillCapture } from "@/lib/guest/camera/stream";

export const JPEG_QUALITY = 0.92;

/** The live picture's own size, or null before its first frame. */
export function frameSize(
  video: HTMLVideoElement,
): { width: number; height: number } | null {
  const width = video.videoWidth;
  const height = video.videoHeight;
  return width > 0 && height > 0 ? { width, height } : null;
}

function drawCrop(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  crop: Rect,
  out: { width: number; height: number },
  mirror: boolean,
) {
  ctx.save();
  if (mirror) {
    ctx.translate(out.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(
    source,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    out.width,
    out.height,
  );
  ctx.restore();
}

/**
 * The frame she is looking at, at full size, onto `canvas` (one canvas a camera, reused: `toBlob` copies at the
 * call). False before the picture has a frame.
 */
export function drawFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  aspect: number,
  mirror: boolean,
): boolean {
  const size = frameSize(video);
  const ctx = size ? canvas.getContext("2d") : null;
  if (!size || !ctx) return false;
  const crop = cropRect(size.width, size.height, aspect);
  canvas.width = crop.sw;
  canvas.height = crop.sh;
  drawCrop(ctx, video, crop, { width: crop.sw, height: crop.sh }, mirror);
  return true;
}

/** The small picture of this very moment, drawn now onto a canvas of its own (the reel's frozen frame). */
export function drawThumb(
  video: HTMLVideoElement,
  aspect: number,
  mirror: boolean,
): HTMLCanvasElement | null {
  const size = frameSize(video);
  if (!size) return null;
  const crop = cropRect(size.width, size.height, aspect);
  const out = thumbSize(crop.sw, crop.sh);
  const canvas = document.createElement("canvas");
  canvas.width = out.width;
  canvas.height = out.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  drawCrop(ctx, video, crop, out, mirror);
  return canvas;
}

/** A canvas as a JPEG; rejects where the browser hands back nothing. */
export function canvasJpeg(
  canvas: HTMLCanvasElement,
  quality: number = JPEG_QUALITY,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("the frame did not encode")),
      "image/jpeg",
      quality,
    );
  });
}

/**
 * THE STILL PIPELINE'S PHOTOGRAPH, kept to what she framed: taken at its largest, cropped to the box's shape and
 * mirrored like the frame. Null where it fails or comes back on its side (an Android camera's still can arrive in the
 * sensor's orientation; the frame she framed is then the truer picture, and `album-camera.tsx` encodes that instead).
 */
export async function pipelineStill(input: {
  capture: StillCapture;
  limits: { width: number; height: number; flash: boolean };
  flash: boolean;
  frame: { width: number; height: number };
  aspect: number;
  mirror: boolean;
}): Promise<Blob | null> {
  try {
    const blob = await input.capture.takePhoto({
      imageWidth: input.limits.width,
      imageHeight: input.limits.height,
      ...(input.limits.flash
        ? { fillLightMode: input.flash ? "flash" : "off" }
        : {}),
    });
    const bitmap = await createImageBitmap(blob);
    try {
      if (!sameOrientation(bitmap, input.frame)) return null;
      const crop = cropRect(bitmap.width, bitmap.height, input.aspect);
      const canvas = document.createElement("canvas");
      canvas.width = crop.sw;
      canvas.height = crop.sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      drawCrop(
        ctx,
        bitmap,
        crop,
        { width: crop.sw, height: crop.sh },
        input.mirror,
      );
      const jpeg = await canvasJpeg(canvas);
      canvas.width = 0;
      canvas.height = 0;
      return jpeg;
    } finally {
      bitmap.close();
    }
  } catch {
    return null;
  }
}
