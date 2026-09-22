import { describe, expect, it } from "vitest";

import { pacedTheme } from "@/lib/reel/live/pacing";

import { reelDimensions } from "./constants";
import { planReel } from "./layout";
import type { ReelClip, ReelProps } from "./reel-types";
import { THEME_CLASSIC } from "./reel-types";
import { THEME_IDS, THEME_PUNCHY, THEMES } from "./themes";
import {
  clipStartFrames,
  frameStateAt,
  gapProgress,
  planFor,
} from "./timeline";

const clips = (n: number): ReelClip[] =>
  Array.from({ length: n }, (_, i) => ({
    url: `u${i}`,
    type: "photo" as const,
  }));

const props = (n: number, seed = 7): ReelProps => ({
  clips: clips(n),
  theme: THEME_CLASSIC,
  seed,
  styleId: "classic",
});

describe("planFor (the memoized plan)", () => {
  it("returns the planReel plan and caches it per props object", () => {
    const p = props(5);
    const a = planFor(p);
    expect(JSON.stringify(a)).toBe(JSON.stringify(planReel(p)));
    expect(planFor(p)).toBe(a); // identity: no re-plan inside the frame loop
  });
});

describe("clipStartFrames (the TransitionSeries overlap accounting)", () => {
  it("advances each start by the previous clip's duration minus the overlapping gap", () => {
    const plan = planFor(props(4));
    const starts = clipStartFrames(plan);
    expect(starts[0]).toBe(0);
    for (let i = 1; i < starts.length; i++) {
      expect(starts[i]).toBe(
        starts[i - 1] +
          plan.clips[i - 1].durationInFrames -
          plan.gaps[i - 1].durationInFrames,
      );
    }
    // The final clip ends exactly at totalFrames.
    const last = plan.clips.length - 1;
    expect(starts[last] + plan.clips[last].durationInFrames).toBe(
      plan.totalFrames,
    );
  });
});

describe("frameStateAt (which layers are on screen)", () => {
  it("shows a single layer outside transition windows", () => {
    const plan = planFor(props(3));
    const state = frameStateAt(plan, 0);
    expect(state.top.clipIndex).toBe(0);
    expect(state.top.localFrame).toBe(0);
    expect(state.under).toBeNull();
    expect(state.transition).toBeNull();
  });

  it("overlaps both clips through a gap window, with the entering clip on top", () => {
    const plan = planFor(props(3));
    const starts = clipStartFrames(plan);
    const gap = plan.gaps[0];

    // First frame of the window: progress 0 (the fade has not begun).
    const enter = frameStateAt(plan, starts[1]);
    expect(enter.top.clipIndex).toBe(1);
    expect(enter.top.localFrame).toBe(0);
    expect(enter.under?.clipIndex).toBe(0);
    expect(enter.under?.localFrame).toBe(starts[1] - starts[0]);
    expect(enter.transition?.gapIndex).toBe(0);
    expect(enter.transition?.progress).toBe(0);

    // Last frame of the window: still transitioning, nearly done.
    const late = frameStateAt(plan, starts[1] + gap.durationInFrames - 1);
    expect(late.transition).not.toBeNull();
    expect(late.transition!.progress).toBeGreaterThan(0.9);
    expect(late.transition!.progress).toBeLessThan(1);

    // First frame past the window: single layer again.
    const after = frameStateAt(plan, starts[1] + gap.durationInFrames);
    expect(after.under).toBeNull();
    expect(after.transition).toBeNull();
    expect(after.top.clipIndex).toBe(1);
  });

  it("clamps frames past the end onto the last clip", () => {
    const plan = planFor(props(3));
    const state = frameStateAt(plan, plan.totalFrames + 50);
    expect(state.top.clipIndex).toBe(2);
    expect(state.under).toBeNull();
  });

  it("is deterministic for the same plan and frame", () => {
    const plan = planFor(props(5, 42));
    expect(JSON.stringify(frameStateAt(plan, 37))).toBe(
      JSON.stringify(frameStateAt(plan, 37)),
    );
  });

  it("handles a single-clip reel (no gaps at all)", () => {
    const plan = planFor(props(1));
    const state = frameStateAt(plan, 10);
    expect(state.top.clipIndex).toBe(0);
    expect(state.under).toBeNull();
    expect(state.transition).toBeNull();
  });
});

describe("gapProgress (the timing curves)", () => {
  it("linear timing ramps localFrame / durationInFrames (a 2-frame cut: 0 then 0.5)", () => {
    const cut = {
      kind: "cut" as const,
      timing: "linear" as const,
      durationInFrames: 2,
    };
    expect(gapProgress(cut, 0, 24)).toBe(0);
    expect(gapProgress(cut, 1, 24)).toBe(0.5);
  });

  it("spring timing starts at 0 and never exceeds 1", () => {
    const fade = {
      kind: "fade" as const,
      timing: "spring" as const,
      durationInFrames: 14,
    };
    expect(gapProgress(fade, 0, 24)).toBe(0);
    for (let f = 0; f <= 14; f++) {
      const v = gapProgress(fade, f, 24);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("covers a multi-kind palette (Punchy) without gaps escaping their windows", () => {
    const plan = planFor({
      clips: clips(6),
      theme: THEME_PUNCHY,
      seed: 9,
      styleId: "punchy",
    });
    for (let f = 0; f < plan.totalFrames; f++) {
      const state = frameStateAt(plan, f);
      if (state.transition) {
        expect(state.under).not.toBeNull();
        expect(state.transition.progress).toBeGreaterThanOrEqual(0);
        expect(state.transition.progress).toBeLessThanOrEqual(1);
      } else {
        expect(state.under).toBeNull();
      }
    }
  });
});

describe("orientation dimensions (one code path, never hard-coded)", () => {
  it("portrait is 1080x1920 and landscape is 1920x1080", () => {
    expect(reelDimensions("portrait")).toEqual({ width: 1080, height: 1920 });
    expect(reelDimensions("landscape")).toEqual({ width: 1920, height: 1080 });
    expect(reelDimensions(undefined)).toEqual({ width: 1080, height: 1920 });
  });
});

/**
 * THE TWO-LAYER MODEL IS NOW COMPLETE (the live reel, 2026-09-22). frameStateAt resolves at most a
 * top and an under; with planReel's hold guard clamping every hold to the SUM of its adjacent gaps,
 * that is not an approximation any more but the whole truth, for every mood at either surface
 * pacing. The pin compares the resolver's answer against the sequences that are genuinely live.
 */
describe("frameStateAt against the true live set (every mood, either surface)", () => {
  it("reports exactly the layers TransitionSeries would render", () => {
    for (const themeId of THEME_IDS) {
      for (const surface of ["hand", "wall"] as const) {
        const theme = pacedTheme(THEMES[themeId], surface);
        const plan = planReel({
          clips: clips(7),
          theme,
          seed: 515,
          styleId: themeId,
        });
        const starts = clipStartFrames(plan);
        for (let f = 0; f < plan.totalFrames; f++) {
          const live = plan.clips
            .map((c, i) => ({
              i,
              start: starts[i],
              end: starts[i] + c.durationInFrames,
            }))
            .filter((c) => f >= c.start && f < c.end)
            .map((c) => c.i);
          const state = frameStateAt(plan, f);
          const drawn = state.under
            ? [state.under.clipIndex, state.top.clipIndex]
            : [state.top.clipIndex];
          expect(drawn, `${themeId}/${surface}@${f}`).toEqual(live);
        }
      }
    }
  });
});
