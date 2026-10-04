/**
 * THE FILMING CLOCK: what the camera says while a video rolls, drawn from the time it has rolled and the clip's one
 * length (`CAMERA_VIDEO_SECONDS`, `media/limits.ts`, which is also the recorder's `maxMs`). The mark's read and the
 * shutter's ring are these two functions, so neither is a template string inside the screen and both follow the one
 * constant. Pure, so each is a unit test.
 */
import { CAMERA_VIDEO_SECONDS } from "@/lib/media/limits";

/** Whole seconds as m:ss ("0:07", "1:05"); never negative. */
export function clockRead(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** The video's share of its length, 0 to 1, from the time it has rolled: the ring's fill. */
export function filmingProgress(elapsedMs: number): number {
  return Math.min(1, Math.max(0, elapsedMs / (CAMERA_VIDEO_SECONDS * 1000)));
}

/** The mark's read, how long it has rolled against how long it may ("0:07 of 0:30"), never past its length. */
export function filmingRead(elapsedMs: number): string {
  const rolled = Math.min(CAMERA_VIDEO_SECONDS, elapsedMs / 1000);
  return `${clockRead(rolled)} of ${clockRead(CAMERA_VIDEO_SECONDS)}`;
}
