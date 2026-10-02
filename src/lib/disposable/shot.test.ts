/**
 * A CAMERA SHOT'S LIMITS AT THE PRESIGN (20261002200000): the friendly half of `create_media`'s lines, in its words.
 * Free uploads are untouched; a camera video says its own limit before the roll does; the roll, then its ceiling.
 */
import { describe, expect, it } from "vitest";

import { ROLL_RETAKES_SPENT_MESSAGE, rollSpentMessage } from "@/lib/disposable/roll";
import {
  CAMERA_VIDEO_TOO_LARGE_MESSAGE,
  CAMERA_VIDEO_TOO_LONG_MESSAGE,
  cameraShotRefusal,
} from "@/lib/disposable/shot";
import { CAMERA_VIDEO_MAX_BYTES } from "@/lib/media/limits";

const ROOM = { used: 3, cap: 24, taken: 3, ceiling: 72 };
const photo = { size_bytes: 4_000_000 };
const clip = (seconds: number, bytes = 40 * 1024 ** 2) => ({
  size_bytes: bytes,
  duration_seconds: seconds,
});

describe("cameraShotRefusal", () => {
  it("free uploads are never a camera's: no roll, no ten seconds", () => {
    expect(cameraShotRefusal({ capture: "upload", roll: null }, "video", clip(60))).toBeNull();
    expect(cameraShotRefusal({}, "video", clip(60, 900 * 1024 ** 2))).toBeNull();
  });

  it("a camera video: ten seconds and half a second's grace, then 128 MB", () => {
    const ctx = { capture: "camera", roll: ROOM };
    expect(cameraShotRefusal(ctx, "video", clip(10.4))).toBeNull();
    expect(cameraShotRefusal(ctx, "video", clip(10.6))).toEqual({
      status: 422,
      code: "too_long",
      message: CAMERA_VIDEO_TOO_LONG_MESSAGE,
    });
    expect(cameraShotRefusal(ctx, "video", clip(8, CAMERA_VIDEO_MAX_BYTES + 1))).toEqual({
      status: 422,
      code: "too_large",
      message: CAMERA_VIDEO_TOO_LARGE_MESSAGE,
    });
    // A clip that names no length is bounded by its bytes alone.
    expect(cameraShotRefusal(ctx, "video", { size_bytes: 1024 })).toBeNull();
  });

  it("★ the video's own limit speaks before the roll (she can still take a photo)", () => {
    const spent = { capture: "camera", roll: { ...ROOM, used: 24 } };
    expect(cameraShotRefusal(spent, "video", clip(30))?.code).toBe("too_long");
    expect(cameraShotRefusal(spent, "photo", photo)).toEqual({
      status: 409,
      code: "roll_spent",
      message: rollSpentMessage(24),
    });
  });

  it("the roll, at its own size, then the ceiling", () => {
    expect(cameraShotRefusal({ capture: "camera", roll: { used: 12, cap: 12, taken: 12, ceiling: 36 } }, "photo", photo)?.message).toBe(
      rollSpentMessage(12),
    );
    expect(cameraShotRefusal({ capture: "camera", roll: { ...ROOM, taken: 72 } }, "photo", photo)).toEqual({
      status: 409,
      code: "roll_spent",
      message: ROLL_RETAKES_SPENT_MESSAGE,
    });
    expect(cameraShotRefusal({ capture: "camera", roll: ROOM }, "photo", photo)).toBeNull();
    // A roll the read could not say: the presign lets it by, and create_media holds the line.
    expect(cameraShotRefusal({ capture: "camera", roll: null }, "photo", photo)).toBeNull();
  });
});
