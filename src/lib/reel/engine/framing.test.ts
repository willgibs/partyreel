import { describe, expect, it } from "vitest";

import { reelDimensions } from "./constants";
import { fitClip } from "./framing";

const PORTRAIT = { w: 1080, h: 1920 };
const LANDSCAPE = { w: 1920, h: 1080 };

describe("fitClip", () => {
  it("covers when media + reel share an orientation", () => {
    expect(fitClip(1080, 1920, PORTRAIT.w, PORTRAIT.h)).toBe("cover"); // portrait in portrait
    expect(fitClip(1920, 1080, LANDSCAPE.w, LANDSCAPE.h)).toBe("cover"); // landscape in landscape
    expect(fitClip(1600, 1100, LANDSCAPE.w, LANDSCAPE.h)).toBe("cover");
  });

  it("fits (leaves designed space) when media mismatches the reel orientation", () => {
    expect(fitClip(1080, 1920, LANDSCAPE.w, LANDSCAPE.h)).toBe("fit"); // portrait photo, landscape reel
    expect(fitClip(1920, 1080, PORTRAIT.w, PORTRAIT.h)).toBe("fit"); // landscape photo, portrait reel
  });

  it("covers square-ish media in either orientation (it crops cleanly)", () => {
    expect(fitClip(1200, 1200, PORTRAIT.w, PORTRAIT.h)).toBe("cover");
    expect(fitClip(1200, 1200, LANDSCAPE.w, LANDSCAPE.h)).toBe("cover");
    expect(fitClip(1080, 1100, LANDSCAPE.w, LANDSCAPE.h)).toBe("cover"); // within the square tolerance
  });

  it("covers when media dimensions are unknown (the safe default)", () => {
    expect(fitClip(undefined, undefined, PORTRAIT.w, PORTRAIT.h)).toBe("cover");
    expect(fitClip(0, 0, LANDSCAPE.w, LANDSCAPE.h)).toBe("cover");
  });
});

describe("reelDimensions", () => {
  it("maps orientation to dimensions, defaulting to portrait", () => {
    expect(reelDimensions("portrait")).toEqual({ width: 1080, height: 1920 });
    expect(reelDimensions("landscape")).toEqual({ width: 1920, height: 1080 });
    expect(reelDimensions(undefined)).toEqual({ width: 1080, height: 1920 });
    expect(reelDimensions(null)).toEqual({ width: 1080, height: 1920 });
  });
});
