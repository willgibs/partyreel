import { describe, expect, it } from "vitest";

import { planReel } from "./layout";
import type { ReelClip } from "./reel-types";
import { THEME_CLASSIC } from "./reel-types";
import { THEME_PUNCHY } from "./themes";

const clips = (n: number): ReelClip[] =>
  Array.from({ length: n }, (_, i) => ({ url: `u${i}`, type: "photo" as const }));

describe("planReel (the timeline single-source)", () => {
  it("is fully deterministic for the same (clips, theme, seed)", () => {
    const a = planReel({ clips: clips(5), theme: THEME_CLASSIC, seed: 7 });
    const b = planReel({ clips: clips(5), theme: THEME_CLASSIC, seed: 7 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("a new seed re-rolls a different take (shuffle is real)", () => {
    const a = planReel({ clips: clips(6), theme: THEME_PUNCHY, seed: 7 });
    const b = planReel({ clips: clips(6), theme: THEME_PUNCHY, seed: 8 });
    // motion changes...
    expect(JSON.stringify(a.clips.map((c) => c.motion))).not.toBe(
      JSON.stringify(b.clips.map((c) => c.motion)),
    );
    // ...and so do the transitions (Punchy has a multi-entry palette).
    expect(JSON.stringify(a.gaps)).not.toBe(JSON.stringify(b.gaps));
  });

  it("totalFrames = Σ sequence frames − Σ transition frames (the TransitionSeries overlap)", () => {
    const p = planReel({ clips: clips(4), theme: THEME_CLASSIC, seed: 3 });
    const sumSeq = p.clips.reduce((s, c) => s + c.durationInFrames, 0);
    const sumGap = p.gaps.reduce((s, g) => s + g.durationInFrames, 0);
    expect(p.totalFrames).toBe(sumSeq - sumGap);
    expect(p.gaps.length).toBe(p.clips.length - 1);
    expect(p.totalSec).toBeCloseTo(p.totalFrames / p.fps);
  });

  it("each sequence outlasts its adjacent transitions (TransitionSeries requires it)", () => {
    const p = planReel({ clips: clips(7), theme: THEME_PUNCHY, seed: 99 });
    p.clips.forEach((c, i) => {
      const adj = Math.max(
        p.gaps[i - 1]?.durationInFrames ?? 0,
        p.gaps[i]?.durationInFrames ?? 0,
      );
      expect(c.durationInFrames).toBeGreaterThan(adj);
    });
  });

  it("handles 0 and 1 clip without gaps", () => {
    expect(planReel({ clips: [], theme: THEME_CLASSIC, seed: 1 }).gaps).toHaveLength(0);
    const one = planReel({ clips: clips(1), theme: THEME_CLASSIC, seed: 1 });
    expect(one.gaps).toHaveLength(0);
    expect(one.totalFrames).toBe(one.clips[0].durationInFrames);
  });

  it("a video clip uses its trimDurationSec for the hold", () => {
    const p = planReel({
      clips: [{ url: "v", type: "video", trimDurationSec: 5 }],
      theme: THEME_CLASSIC,
      seed: 1,
    });
    // 5s × 24fps = 120 frames (no jitter on a single clip's base, ± the seeded jitter).
    expect(p.clips[0].durationInFrames).toBeGreaterThan(100);
  });
});
