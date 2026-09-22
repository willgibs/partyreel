import { describe, expect, it } from "vitest";

import { pacedTheme } from "@/lib/reel/live/pacing";

import { planReel } from "./layout";
import type { ReelClip } from "./reel-types";
import { THEME_CLASSIC } from "./reel-types";
import { THEME_IDS, THEME_PUNCHY, THEMES } from "./themes";
import { clipStartFrames } from "./timeline";

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

/**
 * THE HOLD GUARD, and the window offset (the live reel, 2026-09-22). Two properties, both pure:
 * a clip's sequence outlasts the SUM of its adjacent transitions (so `frameStateAt`'s two layers
 * can never be asked to hold three), and a plan with an `indexOffset` is the SLICE of the longer
 * plan it claims to be (which is what makes a window handover invisible).
 */
describe("the hold guard (no surface and mood pair reaches a third layer)", () => {
  /** The layers TransitionSeries would have on screen at an output frame. */
  const layersAt = (plan: ReturnType<typeof planReel>, frame: number) => {
    const starts = clipStartFrames(plan);
    return plan.clips.filter(
      (c, i) => frame >= starts[i] && frame < starts[i] + c.durationInFrames,
    ).length;
  };

  it("never draws three layers, for any mood at any surface pacing", () => {
    for (const themeId of THEME_IDS) {
      for (const surface of ["hand", "wall"] as const) {
        for (const scale of [0.25, 0.5, 1, 2]) {
          const theme = pacedTheme(THEMES[themeId], surface, scale);
          const plan = planReel({ clips: clips(8), theme, seed: 4242 });
          let worst = 0;
          for (let f = 0; f < plan.totalFrames; f++) {
            worst = Math.max(worst, layersAt(plan, f));
          }
          expect(worst, `${themeId}/${surface}/${scale}`).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it("binds where a pathological kit would have overlapped two transitions", () => {
    // A half-second hold between two 0.4s fades: the OLD clamp (max adjacent + 2) left 12 frames of
    // three-layer overlap; the sum clamp lifts the hold to 20 frames.
    const theme = {
      ...THEME_CLASSIC,
      photoHoldSec: 0.5,
      holdJitter: 0,
      transitions: [{ kind: "fade" as const, durationSec: 0.4, timing: "linear" as const }],
    };
    const plan = planReel({ clips: clips(4), theme, seed: 1 });
    plan.clips.forEach((clip, i) => {
      const sum =
        (plan.gaps[i - 1]?.durationInFrames ?? 0) +
        (plan.gaps[i]?.durationInFrames ?? 0);
      expect(clip.durationInFrames).toBeGreaterThanOrEqual(sum + 2);
    });
    // And the guarded plan draws at most two layers where the unguarded one drew three.
    let worst = 0;
    for (let f = 0; f < plan.totalFrames; f++) worst = Math.max(worst, layersAt(plan, f));
    expect(worst).toBe(2);
  });

  it("is a NO-OP for every shipped mood at either surface (no reel's length moves)", () => {
    for (const themeId of THEME_IDS) {
      for (const surface of ["hand", "wall"] as const) {
        const theme = pacedTheme(THEMES[themeId], surface);
        const plan = planReel({ clips: clips(10), theme, seed: 31 });
        plan.clips.forEach((clip, i) => {
          const sum =
            (plan.gaps[i - 1]?.durationInFrames ?? 0) +
            (plan.gaps[i]?.durationInFrames ?? 0);
          // The seeded hold already clears the sum on its own: the guard never had to intervene.
          expect(clip.durationInFrames, `${themeId}/${surface}/${i}`).toBeGreaterThan(sum + 2);
        });
      }
    }
  });
});

describe("indexOffset (the window's slice)", () => {
  it("plans exactly the slice of the longer reel it claims to be", () => {
    const all = clips(12);
    const whole = planReel({ clips: all, theme: THEME_CLASSIC, seed: 99 });
    const window = planReel({
      clips: all.slice(5, 10),
      theme: THEME_CLASSIC,
      seed: 99,
      indexOffset: 5,
    });
    window.clips.forEach((clip, i) => {
      expect(clip.motion).toEqual(whole.clips[5 + i].motion);
      // The LOCAL index is what indexes assets.clips; only the seeding is offset.
      expect(clip.index).toBe(i);
    });
    window.gaps.forEach((gap, i) => {
      expect(gap).toEqual(whole.gaps[5 + i]);
    });
  });

  it("makes the shared clip of two overlapping windows the SAME clip", () => {
    const all = clips(12);
    const a = planReel({ clips: all.slice(0, 6), theme: THEME_CLASSIC, seed: 8, indexOffset: 0 });
    const b = planReel({ clips: all.slice(5, 11), theme: THEME_CLASSIC, seed: 8, indexOffset: 5 });
    expect(b.clips[0].motion).toEqual(a.clips[5].motion);
  });

  it("absent, it changes nothing (the fixed composer's pixels are untouched)", () => {
    const withOut = planReel({ clips: clips(6), theme: THEME_PUNCHY, seed: 12 });
    const withZero = planReel({
      clips: clips(6),
      theme: THEME_PUNCHY,
      seed: 12,
      indexOffset: 0,
    });
    expect(JSON.stringify(withZero)).toBe(JSON.stringify(withOut));
  });
});
