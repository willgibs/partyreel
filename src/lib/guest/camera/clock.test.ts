/**
 * THE FILMING CLOCK: the mark reads how long a video has rolled against its length, and the ring fills to that length;
 * both are drawn from the one constant (`CAMERA_VIDEO_SECONDS`), so the recorder that stops itself, the ring that fills
 * and the "0:30" that is read can never say three different lengths.
 */
import { describe, expect, it } from "vitest";

import {
  clockRead,
  filmingProgress,
  filmingRead,
} from "@/lib/guest/camera/clock";
import { CAMERA_VIDEO_SECONDS } from "@/lib/media/limits";

describe("clockRead", () => {
  it("is m:ss in whole seconds, never negative", () => {
    expect(clockRead(0)).toBe("0:00");
    expect(clockRead(7.9)).toBe("0:07");
    expect(clockRead(30)).toBe("0:30");
    expect(clockRead(65)).toBe("1:05");
    expect(clockRead(600)).toBe("10:00");
    expect(clockRead(-4)).toBe("0:00");
  });
});

describe("filmingRead", () => {
  it("reads against thirty seconds: the mark the camera draws as a video rolls", () => {
    expect(filmingRead(0)).toBe("0:00 of 0:30");
    expect(filmingRead(7_999)).toBe("0:07 of 0:30");
    expect(filmingRead(29_999)).toBe("0:29 of 0:30");
    expect(filmingRead(30_000)).toBe("0:30 of 0:30");
  });

  it("never reads past the clip's length, whatever the clock says after the recorder stopped itself", () => {
    expect(filmingRead(30_500)).toBe("0:30 of 0:30");
    expect(filmingRead(45_000)).toBe("0:30 of 0:30");
  });

  it("is the constant's length at its end, never a typed one", () => {
    const end = filmingRead(CAMERA_VIDEO_SECONDS * 1000);
    const [rolled, of] = end.split(" of ");
    expect(rolled).toBe(of);
  });
});

describe("filmingProgress", () => {
  it("fills the ring from nothing to full across the clip's length", () => {
    expect(filmingProgress(0)).toBe(0);
    expect(filmingProgress((CAMERA_VIDEO_SECONDS * 1000) / 2)).toBe(0.5);
    expect(filmingProgress(CAMERA_VIDEO_SECONDS * 1000)).toBe(1);
  });

  it("holds at full past the end and at nothing before the start", () => {
    expect(filmingProgress(CAMERA_VIDEO_SECONDS * 1000 + 5_000)).toBe(1);
    expect(filmingProgress(-200)).toBe(0);
  });

  it("steps by a fifth of a second's share of thirty seconds: a smooth ring on a 200 ms clock", () => {
    // The screen ticks every 200 ms; the ring moves by this much a tick (under a hundredth of its circle).
    expect(filmingProgress(200)).toBeLessThan(0.01);
    expect(filmingProgress(200)).toBeGreaterThan(0);
  });
});
