/**
 * A FULL CAMERA CLIP AT THE RECORDER'S OWN ASK: the bitrate it requests, over the clip's length, is what a clip weighs
 * (an encoder's target, so a real clip lands near it) and what a host's per-event file cap, the byte bound and the
 * guest's weak party signal are measured against. The recorder itself is the browser's (`MediaRecorder`); what is pinned
 * here is the arithmetic of what it asks for.
 */
import { describe, expect, it } from "vitest";

import { AUDIO_BITS, VIDEO_BITS } from "@/lib/guest/camera/recorder";
import {
  CAMERA_VIDEO_GRACE_SECONDS,
  CAMERA_VIDEO_MAX_BYTES,
  CAMERA_VIDEO_SECONDS,
  MIN_UPLOAD_CAP_BYTES,
} from "@/lib/media/limits";

/** A clip that rolls to its length and its grace, video and sound, at the bitrates asked. */
const fullClipBytes =
  ((VIDEO_BITS + AUDIO_BITS) *
    (CAMERA_VIDEO_SECONDS + CAMERA_VIDEO_GRACE_SECONDS)) /
  8;

describe("a full camera clip at the recorder's own ask", () => {
  it("weighs about 19 MB: thirty seconds at about 5 Mbps", () => {
    expect(fullClipBytes).toBeGreaterThan(18_000_000);
    expect(fullClipBytes).toBeLessThan(20_000_000);
  });

  it("fits under the smallest per-event file cap a host may set, so her cap never refuses the camera's own clip", () => {
    expect(fullClipBytes).toBeLessThan(MIN_UPLOAD_CAP_BYTES);
  });

  it("is far under the byte bound, which only a client that lies about the length can reach", () => {
    expect(fullClipBytes * 10).toBeLessThan(CAMERA_VIDEO_MAX_BYTES);
  });
});
