/**
 * THE PACING's pins. One factor, three effects — and the property that makes it safe: scaling the
 * hold WITHOUT the transitions is what drives planReel's three-layer condition, so the whole edit
 * must move together.
 */
import { describe, expect, it } from "vitest";

import { planReel } from "@/lib/reel/engine/layout";
import type { ReelClip } from "@/lib/reel/engine/reel-types";
import { THEME_CLASSIC } from "@/lib/reel/engine/reel-types";
import { THEME_IDS, THEMES } from "@/lib/reel/engine/themes";

import {
  BASE_VIDEO_WINDOW_SEC,
  pacedTheme,
  pacingFactor,
  SURFACE_FACTORS,
  videoWindowSec,
} from "./pacing";

const clips = (n: number): ReelClip[] =>
  Array.from({ length: n }, (_, i) => ({
    url: `u${i}`,
    type: "photo" as const,
  }));

describe("pacing", () => {
  it("runs the hand faster than the wall", () => {
    expect(SURFACE_FACTORS.hand).toBeLessThan(SURFACE_FACTORS.wall);
    expect(pacingFactor("hand")).toBeLessThan(pacingFactor("wall"));
  });

  it("scales the hold, EVERY transition and the video window by the one factor", () => {
    const paced = pacedTheme(THEMES.warm, "hand");
    const factor = pacingFactor("hand");
    expect(paced.photoHoldSec).toBeCloseTo(THEMES.warm.photoHoldSec * factor);
    paced.transitions.forEach((spec, i) => {
      expect(spec.durationSec).toBeCloseTo(
        THEMES.warm.transitions[i].durationSec * factor,
      );
    });
    expect(videoWindowSec("hand")).toBeCloseTo(BASE_VIDEO_WINDOW_SEC * factor);
  });

  it("leaves the kit itself untouched (a viewer's knob never mutates a shared theme)", () => {
    const before = JSON.stringify(THEMES.punchy);
    pacedTheme(THEMES.punchy, "hand", 0.4);
    expect(JSON.stringify(THEMES.punchy)).toBe(before);
  });

  it("returns the kit as-is at factor 1 (the wall is the mood as designed)", () => {
    expect(pacedTheme(THEME_CLASSIC, "wall")).toBe(THEME_CLASSIC);
  });

  it("clamps the knob so the reel is never a strobe or a still", () => {
    expect(pacingFactor("wall", 0)).toBe(pacingFactor("wall", 0.25));
    expect(pacingFactor("wall", 99)).toBe(pacingFactor("wall", 6));
    // The Hold control's slowest step on the fastest mood (7 s over Kinetic's 1.4 s) is inside it.
    expect(pacingFactor("wall", 5)).toBe(5);
  });

  it("keeps the edit's proportions, so a faster surface stays a real reel", () => {
    // The ratio of a hold to its transitions is what a montage's rhythm IS. Scaling one alone would
    // either stop the reel getting faster (planReel's clamp swallows the difference) or drive it
    // into the three-layer frame. A "cut" is the one thing that does not scale: zero seconds times
    // anything is still a hard cut, and layout.ts gives it its two frames either way.
    const factor = pacingFactor("hand");
    for (const themeId of THEME_IDS) {
      const slow = planReel({
        clips: clips(6),
        theme: THEMES[themeId],
        seed: 5,
      });
      const fast = planReel({
        clips: clips(6),
        theme: pacedTheme(THEMES[themeId], "hand"),
        seed: 5,
      });
      expect(fast.totalFrames).toBeLessThan(slow.totalFrames);
      // Every hold scaled, within a frame of rounding.
      fast.clips.forEach((clip, i) => {
        expect(
          Math.abs(
            clip.durationInFrames - slow.clips[i].durationInFrames * factor,
          ),
          `${themeId} hold ${i}`,
        ).toBeLessThanOrEqual(1);
      });
      fast.gaps.forEach((gap, i) => {
        if (gap.kind === "cut") {
          expect(gap.durationInFrames).toBe(slow.gaps[i].durationInFrames);
          return;
        }
        expect(
          Math.abs(
            gap.durationInFrames - slow.gaps[i].durationInFrames * factor,
          ),
          `${themeId} gap ${i}`,
        ).toBeLessThanOrEqual(1);
      });
    }
  });
});
