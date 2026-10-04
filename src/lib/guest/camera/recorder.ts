/**
 * A CAMERA VIDEO, FILMED (Will's `video=hold`, `cost=one`): drawn from the live picture onto a canvas at 1080 on its
 * short side, with the microphone where she allowed it, written by the browser's own `MediaRecorder`, at most
 * `CAMERA_VIDEO_SECONDS` (`media/limits.ts`). Browser-only; the press that starts and stops it is `use-shutter-press.ts`'s.
 *
 * ★ DRAWN, NOT THE CAMERA'S OWN TRACK. The photo stream runs at the sensor's 12 MP (4032x3024 on his iPhone), past
 * the frame size an H.264 encoder takes, so the video is the picture redrawn at 1080 (`videoSize`): the same crop
 * she framed, mirrored as she saw it on the front camera, about 19 MB for a full thirty seconds at `VIDEO_BITS`. A
 * browser that cannot capture a canvas's stream records the camera's own track instead (`direct`), uncropped, at the
 * same asked bitrate.
 *
 * ★ IT ENDS ITSELF AT ITS LENGTH (`maxMs`, the camera video's bound in `media/limits.ts`, which `create_media` holds
 * with half a second's grace), so a held finger can never make a shot the server refuses.
 *
 * ★ ITS POSTER IS ITS FIRST FRAME, drawn as it starts, so the album's preview of it never waits on a seek into a
 * file the same browser has only just written (a WebM from `MediaRecorder` carries no duration to seek by).
 */
import {
  baseType,
  cropRect,
  recorderType,
  videoSize,
} from "@/lib/guest/camera/frame-math";
import { canvasJpeg, frameSize } from "@/lib/guest/camera/capture";

/**
 * The bitrate a camera video asks for: about 19 MB for thirty seconds at 1080, sharp for party footage. An encoder
 * takes it as a target, not a cap (`recorder.test.ts` holds a full clip at the ask under the smallest per-event file
 * cap a host may set).
 */
export const VIDEO_BITS = 5_000_000;
export const AUDIO_BITS = 128_000;

export type FilmedVideo = {
  blob: Blob;
  /** The base type the server accepts (`video/mp4` or `video/webm`). */
  type: string;
  seconds: number;
  poster: Blob | null;
};

export type Filming = {
  /** End it and keep it. */
  stop(): void;
  /** End it and keep nothing. */
  cancel(): void;
};

type CaptureCanvas = HTMLCanvasElement & {
  captureStream?: (frameRate?: number) => MediaStream;
};

type FrameVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

/** Whether this browser can film a camera video at all. */
export function canFilm(): boolean {
  return (
    typeof MediaRecorder !== "undefined" &&
    typeof MediaRecorder.isTypeSupported === "function" &&
    recorderType((t) => MediaRecorder.isTypeSupported(t)) !== null
  );
}

export function startFilming(input: {
  video: HTMLVideoElement;
  /** The camera's own picture, for a browser that cannot capture a canvas. */
  stream: MediaStream;
  aspect: number;
  mirror: boolean;
  audio: MediaStreamTrack | null;
  maxMs: number;
  /** The recorder is running: the clock starts here. */
  onStart: (at: number) => void;
  /** The video, or null where nothing usable was written (an error, a cancel). */
  onEnd: (video: FilmedVideo | null) => void;
}): Filming | null {
  const type = recorderType((t) => MediaRecorder.isTypeSupported(t));
  const size = frameSize(input.video);
  if (!type || !size) return null;

  const crop = cropRect(size.width, size.height, input.aspect);
  const out = videoSize(crop.sw, crop.sh);
  const canvas = document.createElement("canvas") as CaptureCanvas;
  canvas.width = out.width;
  canvas.height = out.height;
  const ctx = canvas.getContext("2d");
  const video = input.video as FrameVideo;

  let drawing = true;
  let handle = 0;
  const draw = () => {
    if (!drawing || !ctx) return;
    ctx.save();
    if (input.mirror) {
      ctx.translate(out.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(
      video,
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
    handle =
      typeof video.requestVideoFrameCallback === "function"
        ? video.requestVideoFrameCallback(draw)
        : requestAnimationFrame(draw);
  };
  const stopDrawing = () => {
    drawing = false;
    if (typeof video.cancelVideoFrameCallback === "function") {
      video.cancelVideoFrameCallback(handle);
    } else {
      cancelAnimationFrame(handle);
    }
  };

  const direct = typeof canvas.captureStream !== "function" || !ctx;
  const picture = direct
    ? input.stream.getVideoTracks()
    : canvas.captureStream!(30).getVideoTracks();
  if (!direct) draw();
  const tracks = [...picture, ...(input.audio ? [input.audio] : [])];

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(new MediaStream(tracks), {
      mimeType: type,
      videoBitsPerSecond: VIDEO_BITS,
      ...(input.audio ? { audioBitsPerSecond: AUDIO_BITS } : {}),
    });
  } catch {
    stopDrawing();
    return null;
  }

  const chunks: Blob[] = [];
  let startedAt = 0;
  let stoppedAt = 0;
  let keep = true;
  let ended = false;
  let limit = 0;
  let poster: Promise<Blob | null> = Promise.resolve(null);

  const finish = (result: FilmedVideo | null) => {
    if (ended) return;
    ended = true;
    window.clearTimeout(limit);
    stopDrawing();
    if (!direct) for (const track of picture) track.stop();
    input.onEnd(result);
  };

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  recorder.onstart = () => {
    startedAt = performance.now();
    input.onStart(Date.now());
    limit = window.setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, input.maxMs);
    // The first frame, as the album's preview of it (the head note).
    poster = direct
      ? Promise.resolve(null)
      : canvasJpeg(canvas, 0.85).catch(() => null);
  };
  recorder.onstop = () => {
    stoppedAt = stoppedAt || performance.now();
    if (!keep || chunks.length === 0 || startedAt === 0) {
      finish(null);
      return;
    }
    const kind = baseType(recorder.mimeType || type, type);
    const blob = new Blob(chunks, { type: kind });
    const seconds = Math.min(
      input.maxMs / 1000,
      Math.max(0, (stoppedAt - startedAt) / 1000),
    );
    void poster.then((p) => finish({ blob, type: kind, seconds, poster: p }));
  };
  recorder.onerror = () => {
    keep = false;
    if (recorder.state !== "inactive") recorder.stop();
    else finish(null);
  };

  try {
    // A slice a quarter second long, so a recorder cut short (the page hidden, the camera closed) still has its data.
    recorder.start(250);
  } catch {
    stopDrawing();
    return null;
  }

  const end = (keepIt: boolean) => {
    keep = keep && keepIt;
    stoppedAt = performance.now();
    if (recorder.state !== "inactive") recorder.stop();
    else finish(null);
  };
  return { stop: () => end(true), cancel: () => end(false) };
}
