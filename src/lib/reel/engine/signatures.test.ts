import { describe, expect, it } from "vitest";

import type { PlannedGap } from "./layout";
import { signatureFrameState } from "./signatures";

// Pins sampled from Reel.tsx's composition-signature block (the source the module ports verbatim):
// weave sin/cos phases, pulse 1 + sin(frame * 0.6) * amp, whip's mid-gap triangle, flash's /3 decay.

const gap = (durationInFrames: number): PlannedGap => ({
  kind: "slide",
  timing: "linear",
  durationInFrames,
});

describe("signatureFrameState", () => {
  it("is inert (identity transform, no blur/flash) without signature flags", () => {
    expect(signatureFrameState({}, 42, 7, [0, 80], [gap(4)])).toEqual({
      weaveX: 0,
      weaveY: 0,
      pulseScale: 1,
      whip: 0,
      flash: 0,
    });
  });

  it("pins the weave wander (sin/cos with the seeded phases)", () => {
    const s = signatureFrameState({ weave: 3 }, 10, 7, [0], []);
    expect(s.weaveX).toBeCloseTo(Math.sin(10 * 0.55 + 7) * 3, 12);
    expect(s.weaveY).toBeCloseTo(Math.cos(10 * 0.43 + 7 * 1.3) * 3, 12);
  });

  it("pins the Pulse scale-pulse (1 + sin(frame * 0.6) * amp)", () => {
    const s = signatureFrameState({ pulse: 0.012 }, 20, 7, [0], []);
    expect(s.pulseScale).toBeCloseTo(1 + Math.sin(12) * 0.012, 12);
    expect(
      signatureFrameState({ pulse: 0.012 }, 0, 7, [0], []).pulseScale,
    ).toBe(1);
  });

  it("whip peaks at 9px mid-gap and falls to 0 at the gap edges (Kinetic)", () => {
    const sig = { whipBlur: true };
    const starts = [0, 80];
    const gaps = [gap(4)];
    expect(signatureFrameState(sig, 80, 7, starts, gaps).whip).toBe(0); // d=0 edge
    expect(signatureFrameState(sig, 82, 7, starts, gaps).whip).toBe(9); // d=g/2 peak
    expect(signatureFrameState(sig, 81, 7, starts, gaps).whip).toBeCloseTo(
      4.5,
      12,
    );
    expect(signatureFrameState(sig, 84, 7, starts, gaps).whip).toBe(0); // d=g edge
    expect(signatureFrameState(sig, 85, 7, starts, gaps).whip).toBe(0); // outside
  });

  it("flash strobes each boundary: full at the cut frame, /3 decay, one frame of pre-roll", () => {
    const sig = { flashOnCut: true };
    const starts = [0, 50, 100];
    const gaps = [gap(2), gap(2)];
    expect(signatureFrameState(sig, 49, 7, starts, gaps).flash).toBeCloseTo(
      2 / 3,
      12,
    ); // d=-1
    expect(signatureFrameState(sig, 50, 7, starts, gaps).flash).toBe(1); // the cut
    expect(signatureFrameState(sig, 52, 7, starts, gaps).flash).toBeCloseTo(
      1 / 3,
      12,
    );
    expect(signatureFrameState(sig, 53, 7, starts, gaps).flash).toBe(0); // d=FL -> 1-3/3
    expect(signatureFrameState(sig, 54, 7, starts, gaps).flash).toBe(0); // outside
  });

  it("takes the max across overlapping boundaries (never additive)", () => {
    const sig = { flashOnCut: true };
    // Two starts a frame apart: frame 51 is d=1 from the first and d=0 from the second -> 1.
    expect(
      signatureFrameState(sig, 51, 7, [0, 50, 51], [gap(2), gap(2)]).flash,
    ).toBe(1);
  });
});
