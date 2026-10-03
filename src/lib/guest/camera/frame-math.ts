/**
 * THE CAMERA'S ARITHMETIC: what part of the phone's frame a shot keeps, how big a video is drawn, which way a still
 * is taken and which container a video is written in. Pure, so each rule is a unit test; `capture.ts` does the drawing.
 *
 * ★ A SHOT IS WHAT SHE FRAMED (`cropRect`). The live picture fills its box (`object-fit: cover`), so the box shows the
 * middle of the frame at the box's own shape; the shot keeps exactly that and nothing she could not see. On an iPhone
 * the box is the frame's own 3:4 (his line, 2026-10-02: the stream 4032x3024, drawn whole 3024x4032), so nothing is
 * cut; a phone whose stream is 16:9 loses the sides the screen never showed.
 *
 * ★ FULL SIZE, THE BEST WAY THE PHONE OFFERS (`stillPath`, Will's `price=full` and his phone line): the stream's own
 * frame where it is the camera's resolution (the iPhone: `takePhoto` gives the same 12.2 MP at three times the bytes),
 * and `ImageCapture.takePhoto` where the camera's still pipeline is clearly larger than the stream it previews (an
 * Android whose preview runs at 1080p).
 *
 * ★ A VIDEO IS DRAWN AT 1080 ON ITS SHORT SIDE (`videoSize`), never the photo stream's 12 MP: an H.264 encoder's
 * frame-size ceiling sits under 4032x3024, and ten seconds at 1080 is about 10 MB (the camera video's bound is 128 MB,
 * `media/limits.ts`).
 */

export type Rect = { sx: number; sy: number; sw: number; sh: number };

/** The middle of a `width` x `height` frame at `aspect` (width over height), as whole pixels. */
export function cropRect(width: number, height: number, aspect: number): Rect {
  if (!(width > 0 && height > 0) || !(aspect > 0)) {
    return { sx: 0, sy: 0, sw: Math.max(0, width), sh: Math.max(0, height) };
  }
  const frame = width / height;
  if (Math.abs(frame - aspect) < 0.005) {
    return { sx: 0, sy: 0, sw: width, sh: height };
  }
  if (frame > aspect) {
    const sw = Math.round(height * aspect);
    return { sx: Math.round((width - sw) / 2), sy: 0, sw, sh: height };
  }
  const sh = Math.round(width / aspect);
  return { sx: 0, sy: Math.round((height - sh) / 2), sw: width, sh };
}

/** The short side a camera video is drawn at. */
export const VIDEO_SHORT_SIDE = 1080;

/** A video's drawn size for a crop of `width` x `height`: 1080 on its short side, never larger than the crop. Even. */
export function videoSize(
  width: number,
  height: number,
  shortSide: number = VIDEO_SHORT_SIDE,
): { width: number; height: number } {
  const short = Math.min(width, height);
  const scale = short > shortSide ? shortSide / short : 1;
  const even = (n: number) => Math.max(2, Math.round((n * scale) / 2) * 2);
  return { width: even(width), height: even(height) };
}

/** A picture's size for the reel and her list: `long` px on its long side. */
export function thumbSize(
  width: number,
  height: number,
  long = 240,
): { width: number; height: number } {
  const scale = long / Math.max(width, height, 1);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** How much larger the still pipeline must be than the frame before it is worth its wait. */
export const TAKE_PHOTO_GAIN = 1.5;

/**
 * Which way the still is taken: the frame the preview already holds, or the camera's still pipeline where it is
 * clearly larger. `photoMax` is `getPhotoCapabilities()`'s largest image, or null where there is none.
 */
export function stillPath(input: {
  frame: { width: number; height: number };
  photoMax: { width: number; height: number } | null;
}): "frame" | "takePhoto" {
  const { frame, photoMax } = input;
  if (!photoMax || !(photoMax.width > 0 && photoMax.height > 0)) return "frame";
  const framePx = frame.width * frame.height;
  const photoPx = photoMax.width * photoMax.height;
  return framePx > 0 && photoPx >= framePx * TAKE_PHOTO_GAIN
    ? "takePhoto"
    : "frame";
}

/** Whether two pictures stand the same way (both upright, or both on their side). */
export function sameOrientation(
  a: { width: number; height: number },
  b: { width: number; height: number },
): boolean {
  return a.width >= a.height === b.width >= b.height;
}

/**
 * The container a video is written in: MP4 where the browser records it (Safari, and a recent Chrome), else WebM.
 * Both are albums' own types (`ACCEPTED_VIDEO_MIME`). The base type only: the codecs are the browser's choice, and the
 * file is typed with the base the server accepts.
 */
export const RECORDER_TYPES = ["video/mp4", "video/webm"] as const;

export function recorderType(
  isTypeSupported: (type: string) => boolean,
): (typeof RECORDER_TYPES)[number] | null {
  for (const type of RECORDER_TYPES) {
    try {
      if (isTypeSupported(type)) return type;
    } catch {
      // A browser that throws on the question cannot record that type.
    }
  }
  return null;
}

/** The type a recorder's own `mimeType` names, reduced to the base the server accepts ("video/mp4;codecs=..."). */
export function baseType(mime: string, fallback: string): string {
  const base = mime.split(";")[0]?.trim().toLowerCase();
  return base === "video/mp4" || base === "video/webm" ? base : fallback;
}

/** "shot-20261002-224107.jpg": a shot's file name, by when it was taken (the server derives the key's extension). */
export function shotName(
  takenAt: number,
  kind: "photo" | "video",
  type: string,
) {
  const d = new Date(takenAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const ext = kind === "photo" ? "jpg" : type === "video/mp4" ? "mp4" : "webm";
  return `shot-${stamp}.${ext}`;
}
