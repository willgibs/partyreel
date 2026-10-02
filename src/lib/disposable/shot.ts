/**
 * A CAMERA SHOT'S LIMITS, AS THE PRESIGN SAYS THEM: her roll's frames and its ceiling, and a video's ten seconds and
 * 128 MB. Refused before the bytes move, in the server's own sentences (the upload queue's failure sheet prints them as
 * they are); `create_media` holds the same lines on the R2-HEAD size and under the host's profiles lock, raising the
 * same words, which a parity test reads from its winning body (`roll.test.ts`). Pure, so the rule is unit-testable.
 */
import { rollRefusal, type RollCount } from "@/lib/disposable/roll";
import {
  CAMERA_VIDEO_GRACE_SECONDS,
  CAMERA_VIDEO_MAX_BYTES,
  CAMERA_VIDEO_SECONDS,
  type MediaKind,
} from "@/lib/media/limits";

export const CAMERA_VIDEO_TOO_LONG_MESSAGE = `This video is longer than the ${CAMERA_VIDEO_SECONDS} seconds a camera shot can be.`;
export const CAMERA_VIDEO_TOO_LARGE_MESSAGE = `This video exceeds the ${CAMERA_VIDEO_MAX_BYTES / 1024 ** 2} MB a camera shot can be.`;

export type ShotRefusal = {
  status: number;
  code: "roll_spent" | "too_long" | "too_large";
  message: string;
};

/**
 * Why a guest's upload to an album with its camera on is refused before it moves, or null. The order is the camera's:
 * a video that could never be a shot says so before the roll does (she can still take a photo), and the roll last.
 */
export function cameraShotRefusal(
  context: { capture?: string; roll?: RollCount | null },
  kind: MediaKind,
  upload: { size_bytes: number; duration_seconds?: number },
): ShotRefusal | null {
  if (context.capture !== "camera") return null;
  if (kind === "video") {
    if (
      upload.duration_seconds !== undefined &&
      upload.duration_seconds >
        CAMERA_VIDEO_SECONDS + CAMERA_VIDEO_GRACE_SECONDS
    ) {
      return {
        status: 422,
        code: "too_long",
        message: CAMERA_VIDEO_TOO_LONG_MESSAGE,
      };
    }
    if (upload.size_bytes > CAMERA_VIDEO_MAX_BYTES) {
      return {
        status: 422,
        code: "too_large",
        message: CAMERA_VIDEO_TOO_LARGE_MESSAGE,
      };
    }
  }
  const refused = rollRefusal(context.roll ?? null);
  return refused
    ? { status: 409, code: "roll_spent", message: refused }
    : null;
}
