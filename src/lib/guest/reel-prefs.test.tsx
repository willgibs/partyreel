/**
 * THE VIEWER'S OWN REEL ON THEIR DEVICE: the Hold is absolute seconds on every mood (3 s by default,
 * and the viewer's to adjust), the style is per event and the videos switch starts off only for a
 * browser saving data, and storage that throws never breaks the reel.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { pacedTheme } from "@/lib/reel/live/pacing";
import { resolveTheme } from "@/lib/reel/engine/themes";

import {
  DEFAULT_HOLD_SEC,
  defaultIncludeVideos,
  HOLD_STEPS_SEC,
  holdLabel,
  holdScaleFor,
  liveMoods,
  nearestHoldStep,
  readHoldSec,
  readIncludeVideos,
  readStyleId,
  writeHoldSec,
  writeIncludeVideos,
  writeStyleId,
} from "./reel-prefs";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("the Hold", () => {
  it("offers both boards' steps with the 3 s default among them", () => {
    expect(HOLD_STEPS_SEC).toEqual([1, 1.5, 2.2, 3, 3.6, 5, 7]);
    expect(DEFAULT_HOLD_SEC).toBe(3);
    expect(holdLabel(3)).toBe("3 s");
    expect(holdLabel(1.5)).toBe("1.5 s");
  });

  it("means the same seconds on every mood (a factor per mood, never one factor for all)", () => {
    for (const mood of liveMoods()) {
      for (const seconds of HOLD_STEPS_SEC) {
        const theme = pacedTheme(
          resolveTheme(mood.id),
          "wall",
          holdScaleFor(seconds, mood.id),
        );
        expect(theme.photoHoldSec, `${mood.id} at ${seconds} s`).toBeCloseTo(
          seconds,
          5,
        );
      }
    }
  });

  it("snaps an odd stored value to the nearest step", () => {
    expect(nearestHoldStep(2.9)).toBe(3);
    expect(nearestHoldStep(100)).toBe(7);
    expect(nearestHoldStep(Number.NaN)).toBe(DEFAULT_HOLD_SEC);
  });

  it("keeps the viewer's choice on the device, the default before one", () => {
    expect(readHoldSec()).toBe(3);
    writeHoldSec(5);
    expect(readHoldSec()).toBe(5);
  });
});

describe("the style", () => {
  it("offers the eight moods and never a treatment", () => {
    const moods = liveMoods();
    expect(moods).toHaveLength(8);
    expect(moods.map((m) => m.id)).not.toContain("polaroid");
  });

  it("is kept per event, and a stale id is no choice at all", () => {
    writeStyleId("qr-a", "mono");
    expect(readStyleId("qr-a")).toBe("mono");
    expect(readStyleId("qr-b")).toBeNull();
    localStorage.setItem("pr_reel_style_qr-c", "polaroid");
    expect(readStyleId("qr-c")).toBeNull();
  });
});

describe("the videos switch", () => {
  it("starts on, and off for a browser that asks to save data", () => {
    expect(defaultIncludeVideos({})).toBe(true);
    expect(defaultIncludeVideos({ connection: { saveData: true } })).toBe(false);
    expect(defaultIncludeVideos({ connection: { saveData: false } })).toBe(
      true,
    );
  });

  it("remembers the viewer's own answer over the default", () => {
    writeIncludeVideos(false);
    expect(readIncludeVideos()).toBe(false);
    writeIncludeVideos(true);
    expect(readIncludeVideos()).toBe(true);
  });
});

describe("storage that throws", () => {
  it("reads the defaults and writes nothing, without throwing", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readHoldSec()).toBe(DEFAULT_HOLD_SEC);
    expect(readStyleId("qr")).toBeNull();
    expect(() => writeHoldSec(7)).not.toThrow();
    expect(() => writeStyleId("qr", "warm")).not.toThrow();
  });
});
