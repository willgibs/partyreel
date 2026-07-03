import { describe, expect, it } from "vitest";

import { planReel } from "../composition/layout";
import type { ReelClip, ReelProps } from "../composition/reel-types";
import { THEME_CLASSIC } from "../composition/reel-types";
import { resolveTheme } from "../composition/themes";
import { CINEMATIC } from "./styles/cinematic";
import {
  ENGINE_STYLES,
  engineStyleDuration,
  engineSupports,
  resolveEngineStyle,
} from "./registry";

const clips = (n: number): ReelClip[] =>
  Array.from({ length: n }, (_, i) => ({
    url: `u${i}`,
    type: "photo" as const,
  }));

const props: ReelProps = {
  clips: clips(5),
  theme: THEME_CLASSIC,
  seed: 7,
  styleId: "classic",
};

describe("the engine style registry", () => {
  it("registers Cinematic under its catalog styleId", () => {
    expect(ENGINE_STYLES.classic).toBe(CINEMATIC);
    expect(CINEMATIC.id).toBe("classic");
  });

  it("reports support only for ported styles", () => {
    expect(engineSupports("classic")).toBe(true);
    expect(engineSupports("warm")).toBe(false);
    expect(engineSupports("polaroid")).toBe(false);
    expect(engineSupports(undefined)).toBe(false);
  });

  it("falls back to Cinematic for unknown ids (mirroring resolveStyleEntry)", () => {
    expect(resolveEngineStyle("nope")).toBe(CINEMATIC);
    expect(resolveEngineStyle(undefined)).toBe(CINEMATIC);
  });

  it("every registered style satisfies the contract shape", () => {
    for (const [id, style] of Object.entries(ENGINE_STYLES)) {
      expect(style.id).toBe(id);
      expect(typeof style.duration).toBe("function");
      expect(typeof style.assetNeeds).toBe("function");
      expect(typeof style.draw).toBe("function");
      expect(style.duration(props)).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("Cinematic duration parity", () => {
  it("equals the planReel total (the same source styleDuration uses for a mood)", () => {
    expect(engineStyleDuration("classic", props)).toBe(
      planReel(props).totalFrames,
    );
  });

  it("stays >= 1 even with no clips", () => {
    expect(
      engineStyleDuration("classic", { ...props, clips: [] }),
    ).toBeGreaterThanOrEqual(1);
  });
});

describe("Cinematic asset needs", () => {
  it("skips washes for the theme backdrop, builds them for a blur backdrop", () => {
    expect(CINEMATIC.assetNeeds(props)).toEqual({ washes: false });
    const noir: ReelProps = {
      ...props,
      theme: resolveTheme("mono"),
      styleId: "mono",
    };
    expect(CINEMATIC.assetNeeds(noir)).toEqual({ washes: true });
  });
});

// The Cinematic kit values the canvas port was calibrated against. If someone retunes the kit
// (themes/reel-types), this trips so the canvas side gets re-graded in /design/reel-parity instead of
// silently diverging from what was signed off.
describe("Cinematic kit tripwire (grade-string parity with the Remotion theme)", () => {
  it("pins the THEME_CLASSIC values the port replicates", () => {
    expect(THEME_CLASSIC.grade).toBe(
      "contrast(1.14) saturate(1.06) brightness(0.98) sepia(0.14) hue-rotate(-10deg)",
    );
    expect(THEME_CLASSIC.background).toBe("#07080a");
    expect(THEME_CLASSIC.photoHoldSec).toBe(2.7);
    expect(THEME_CLASSIC.holdJitter).toBe(0.05);
    expect(THEME_CLASSIC.motionStyle).toBe("freezeGo");
    expect(THEME_CLASSIC.overlays).toEqual(["letterbox", "vignette"]);
    expect(THEME_CLASSIC.transitions).toEqual([
      { kind: "fade", durationSec: 0.6, timing: "spring" },
    ]);
    expect(THEME_CLASSIC.kenBurns).toEqual({ zoom: 0.16, pan: 0.06 });
    expect(THEME_CLASSIC.backdrop).toBeUndefined(); // defaults to "theme"
  });
});
