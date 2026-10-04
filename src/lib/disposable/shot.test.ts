/**
 * A CAMERA SHOT'S LIMITS AT THE PRESIGN (20261002200000): the friendly half of `create_media`'s lines, in its words.
 * Free uploads are untouched; a camera video says its own limit before the roll does; the roll, then its ceiling.
 */
import { describe, expect, it } from "vitest";

import {
  ROLL_RETAKES_SPENT_MESSAGE,
  rollSpentMessage,
} from "@/lib/disposable/roll";
import {
  CAMERA_VIDEO_TOO_LARGE_MESSAGE,
  CAMERA_VIDEO_TOO_LONG_MESSAGE,
  cameraShotRefusal,
} from "@/lib/disposable/shot";
import {
  CAMERA_VIDEO_GRACE_SECONDS,
  CAMERA_VIDEO_MAX_BYTES,
  CAMERA_VIDEO_SECONDS,
} from "@/lib/media/limits";

const ROOM = { used: 3, cap: 24, taken: 3, ceiling: 72 };
const photo = { size_bytes: 4_000_000 };
const clip = (seconds: number, bytes = 40 * 1024 ** 2) => ({
  size_bytes: bytes,
  duration_seconds: seconds,
});

describe("cameraShotRefusal", () => {
  it("free uploads are never a camera's: no roll, no clip bounds", () => {
    expect(
      cameraShotRefusal({ capture: "upload", roll: null }, "video", clip(120)),
    ).toBeNull();
    expect(
      cameraShotRefusal({}, "video", clip(120, 900 * 1024 ** 2)),
    ).toBeNull();
  });

  // ★ RESHAPED ON PURPOSE (camera-clip: the clip runs to thirty seconds; scar kept: a clip is refused past its length
  // and its grace, then past its bytes, each in its own code; reason dropped: ten seconds and 128 MB, now read from
  // the constants, with the new lengths named beside them so a change of either is one deliberate edit here).
  it("a camera video: its length and half a second's grace, then its bytes", () => {
    const ctx = { capture: "camera", roll: ROOM };
    const longest = CAMERA_VIDEO_SECONDS + CAMERA_VIDEO_GRACE_SECONDS;
    // A 29 s clip, a full one, and one a few hundredths over (a recording measures so) all go.
    expect(cameraShotRefusal(ctx, "video", clip(29))).toBeNull();
    expect(
      cameraShotRefusal(ctx, "video", clip(CAMERA_VIDEO_SECONDS)),
    ).toBeNull();
    expect(cameraShotRefusal(ctx, "video", clip(longest))).toBeNull();
    // Past the grace it is too long, and 31 s is the case the brief names.
    expect(cameraShotRefusal(ctx, "video", clip(longest + 0.1))).toEqual({
      status: 422,
      code: "too_long",
      message: CAMERA_VIDEO_TOO_LONG_MESSAGE,
    });
    expect(cameraShotRefusal(ctx, "video", clip(31))?.code).toBe("too_long");
    // Its bytes: the bound itself goes, one byte past it does not.
    expect(
      cameraShotRefusal(ctx, "video", clip(8, CAMERA_VIDEO_MAX_BYTES)),
    ).toBeNull();
    expect(
      cameraShotRefusal(ctx, "video", clip(8, CAMERA_VIDEO_MAX_BYTES + 1)),
    ).toEqual({
      status: 422,
      code: "too_large",
      message: CAMERA_VIDEO_TOO_LARGE_MESSAGE,
    });
    // A clip that names no length is bounded by its bytes alone.
    expect(cameraShotRefusal(ctx, "video", { size_bytes: 1024 })).toBeNull();
  });

  it("says its two limits in the words the guest wrapper routes by, each with its own number", () => {
    // mapCheckViolation reads "exceeds" (too_large) and "longer than" (too_long), and a sentence naming the roll or a
    // verified email would be read ahead of them; the numbers are the constants', never a literal of this test.
    expect(CAMERA_VIDEO_TOO_LARGE_MESSAGE).toBe(
      `This video exceeds the ${CAMERA_VIDEO_MAX_BYTES / 1024 ** 2} MB a camera shot can be.`,
    );
    expect(CAMERA_VIDEO_TOO_LONG_MESSAGE).toBe(
      `This video is longer than the ${CAMERA_VIDEO_SECONDS} seconds a camera shot can be.`,
    );
    for (const word of [
      "roll",
      "verified email",
      "not accepting",
      "no longer exists",
      "does not belong",
    ]) {
      expect(CAMERA_VIDEO_TOO_LARGE_MESSAGE).not.toContain(word);
      expect(CAMERA_VIDEO_TOO_LONG_MESSAGE).not.toContain(word);
    }
    expect(CAMERA_VIDEO_TOO_LONG_MESSAGE).not.toContain("exceeds");
  });

  it("★ the video's own limit speaks before the roll (she can still take a photo)", () => {
    const spent = { capture: "camera", roll: { ...ROOM, used: 24 } };
    expect(
      cameraShotRefusal(spent, "video", clip(CAMERA_VIDEO_SECONDS + 5))?.code,
    ).toBe("too_long");
    expect(cameraShotRefusal(spent, "photo", photo)).toEqual({
      status: 409,
      code: "roll_spent",
      message: rollSpentMessage(24),
    });
  });

  it("the roll, at its own size, then the ceiling", () => {
    expect(
      cameraShotRefusal(
        {
          capture: "camera",
          roll: { used: 12, cap: 12, taken: 12, ceiling: 36 },
        },
        "photo",
        photo,
      )?.message,
    ).toBe(rollSpentMessage(12));
    expect(
      cameraShotRefusal(
        { capture: "camera", roll: { ...ROOM, taken: 72 } },
        "photo",
        photo,
      ),
    ).toEqual({
      status: 409,
      code: "roll_spent",
      message: ROLL_RETAKES_SPENT_MESSAGE,
    });
    expect(
      cameraShotRefusal({ capture: "camera", roll: ROOM }, "photo", photo),
    ).toBeNull();
    // A roll the read could not say: the presign lets it by, and create_media holds the line.
    expect(
      cameraShotRefusal({ capture: "camera", roll: null }, "photo", photo),
    ).toBeNull();
  });
});
