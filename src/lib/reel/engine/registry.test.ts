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

  it("reports support for every registered style and nothing else", () => {
    for (const id of Object.keys(ENGINE_STYLES)) {
      expect(engineSupports(id)).toBe(true);
    }
    expect(engineSupports("nope")).toBe(false); // not a catalog style
    expect(engineSupports(undefined)).toBe(false);
  });

  it("pins the ported style set (ALL 14 catalog styles: 8 moods + 6 treatments)", () => {
    expect(Object.keys(ENGINE_STYLES).sort()).toEqual([
      "carddeck",
      "classic",
      "dreamy",
      "editorial",
      "filmstrip",
      "framed",
      "golden",
      "kinetic",
      "mono",
      "parallax",
      "polaroid",
      "punchy",
      "scattered",
      "warm",
    ]);
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

describe("mood asset needs (per theme)", () => {
  it("Cinematic needs nothing derived (theme backdrop, no grain, no halation)", () => {
    expect(CINEMATIC.assetNeeds(props)).toEqual({
      washes: false,
      grain: false,
      haloFilter: null,
    });
  });

  it("Noir needs the full derived set: blur-backdrop washes, the grain tile, halation halos", () => {
    const noir: ReelProps = {
      ...props,
      theme: resolveTheme("mono"),
      styleId: "mono",
    };
    // The halo chain = the theme grade + clip-media's bright-pass, blur handled by the downsample.
    expect(ENGINE_STYLES.mono.assetNeeds(noir)).toEqual({
      washes: true,
      grain: true,
      haloFilter:
        "grayscale(1) contrast(1.2) brightness(1.04) brightness(0.5) contrast(2.4) saturate(1.15)",
    });
  });

  it("Film needs grain + halos but NO washes (theme backdrop, not blur)", () => {
    const film: ReelProps = {
      ...props,
      theme: resolveTheme("warm"),
      styleId: "warm",
    };
    expect(ENGINE_STYLES.warm.assetNeeds(film)).toEqual({
      washes: false,
      grain: true,
      haloFilter:
        "sepia(0.2) saturate(1.14) contrast(1.05) brightness(1.09) brightness(0.5) contrast(2.4) saturate(1.15)",
    });
  });

  it("Float needs washes only (blur backdrop; bloom/softedge are procedural overlays)", () => {
    const float: ReelProps = {
      ...props,
      theme: resolveTheme("dreamy"),
      styleId: "dreamy",
    };
    expect(ENGINE_STYLES.dreamy.assetNeeds(float)).toEqual({
      washes: true,
      grain: false,
      haloFilter: null,
    });
  });

  it("Sunset needs nothing derived (theme backdrop; bloom/lightsweep are procedural)", () => {
    const sunset: ReelProps = {
      ...props,
      theme: resolveTheme("golden"),
      styleId: "golden",
    };
    expect(ENGINE_STYLES.golden.assetNeeds(sunset)).toEqual({
      washes: false,
      grain: false,
      haloFilter: null,
    });
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
