/**
 * THE PHONE'S CAMERA, ASKED FOR AND LET GO. The browser half of the album's camera: `getUserMedia` for the picture,
 * the torch where the camera has one, the microphone only while she films, and the still pipeline's size where the
 * browser offers `ImageCapture`. No React here; `album-camera.tsx` decides when.
 *
 * ★ THE PICTURE AT THE CAMERA'S FULL SIZE (his phone line, 2026-10-02: iOS 26 answers 4032x3024 at 30 fps). The ask
 * names the 12 MP sensor's shape as `ideal`, never `exact`, so a phone or a laptop that cannot reach it answers its
 * nearest; an `OverconstrainedError` (a browser that refuses even the ideal) is asked again with the facing alone.
 *
 * ★ NO SOUND IS ASKED FOR WITH THE PICTURE. The microphone is asked the first time she holds the shutter to film
 * (`openMicrophone`), and its track is stopped the moment the video ends, so the phone's microphone light is on only
 * while she films (the brief: "the microphone asked only then").
 */

export type Facing = "environment" | "user";

function constraintsFor(
  facing: Facing,
  sized: boolean,
): MediaStreamConstraints {
  return {
    audio: false,
    video: sized
      ? {
          facingMode: { ideal: facing },
          width: { ideal: 4032 },
          height: { ideal: 3024 },
          frameRate: { ideal: 30 },
        }
      : { facingMode: { ideal: facing } },
  };
}

/** The camera's picture, facing `facing`. Throws what `getUserMedia` throws (`access.ts` reads it). */
export async function openCamera(facing: Facing): Promise<MediaStream> {
  const media = navigator.mediaDevices;
  try {
    return await media.getUserMedia(constraintsFor(facing, true));
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    if (name !== "OverconstrainedError") throw error;
    return media.getUserMedia(constraintsFor(facing, false));
  }
}

/** Let the camera go: every track stopped, so the phone's camera light goes out. */
export function stopStream(stream: MediaStream | null | undefined): void {
  for (const track of stream?.getTracks() ?? []) track.stop();
}

/** How many cameras the phone has (front and back), once a picture is live (labels and counts need the grant). */
export async function cameraCount(): Promise<number> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === "videoinput").length;
  } catch {
    return 1;
  }
}

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };

/** Whether this camera has a torch the page may light (Android's rear camera, today). */
export function hasTorch(track: MediaStreamTrack | null | undefined): boolean {
  if (!track || typeof track.getCapabilities !== "function") return false;
  try {
    return (track.getCapabilities() as TorchCapabilities).torch === true;
  } catch {
    return false;
  }
}

/** Light or put out the torch; false when the camera refused. */
export async function setTorch(
  track: MediaStreamTrack | null | undefined,
  on: boolean,
): Promise<boolean> {
  if (!track) return false;
  try {
    await track.applyConstraints({
      advanced: [{ torch: on } as MediaTrackConstraintSet],
    });
    return true;
  } catch {
    return false;
  }
}

/** Where the microphone stands without asking: `granted`, `denied`, `prompt`, or `unknown` where none can say. */
export async function microphoneState(): Promise<
  "granted" | "denied" | "prompt" | "unknown"
> {
  try {
    const status = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return status.state;
  } catch {
    return "unknown";
  }
}

/** The microphone's track for one video. Throws what `getUserMedia` throws. */
export async function openMicrophone(): Promise<MediaStreamTrack | null> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false },
    video: false,
  });
  return stream.getAudioTracks()[0] ?? null;
}

/** The slice of `ImageCapture` the camera reads (the browser's own type is absent from the DOM lib). */
export type StillCapture = {
  takePhoto(settings?: {
    imageWidth?: number;
    imageHeight?: number;
    fillLightMode?: string;
  }): Promise<Blob>;
  getPhotoCapabilities(): Promise<{
    imageWidth?: { max?: number };
    imageHeight?: { max?: number };
    fillLightMode?: string[];
  }>;
};

type StillCaptureCtor = new (track: MediaStreamTrack) => StillCapture;

/** The still pipeline for `track`, where the browser has one. */
export function stillCaptureFor(
  track: MediaStreamTrack | null | undefined,
): StillCapture | null {
  const Ctor = (globalThis as { ImageCapture?: StillCaptureCtor }).ImageCapture;
  if (!track || typeof Ctor !== "function") return null;
  try {
    return new Ctor(track);
  } catch {
    return null;
  }
}

/** The still pipeline's largest picture, and whether it can fire a flash; null where it answers nothing usable. */
export async function stillLimits(capture: StillCapture | null): Promise<{
  width: number;
  height: number;
  flash: boolean;
} | null> {
  if (!capture) return null;
  try {
    const caps = await capture.getPhotoCapabilities();
    const width = caps.imageWidth?.max ?? 0;
    const height = caps.imageHeight?.max ?? 0;
    if (!(width > 0 && height > 0)) return null;
    return {
      width,
      height,
      flash: (caps.fillLightMode ?? []).includes("flash"),
    };
  } catch {
    return null;
  }
}
