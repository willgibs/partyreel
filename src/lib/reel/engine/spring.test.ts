import { describe, expect, it } from "vitest";

import { measureSpringFrames, springTimingProgress } from "./spring";

// PARITY PINS: sampled from the REAL @remotion/transitions springTiming
// ({ durationInFrames, config: { damping: 200 } }) at fps 24 on 2026-07-03: exactly the timing the
// mood themes use for their "spring" gaps (Reel.tsx timingFor). If these fail, transition fades have
// drifted from the Remotion player; fix the port, do not re-record the pins from the port itself.
// 14 frames = Cinematic's 0.6s fade; 17 and 20 cover other themes' fade lengths.

const REF: Record<number, number[]> = {
  14: [
    0, 0.101222, 0.285077, 0.43321, 0.631283, 0.747425, 0.820809, 0.888291,
    0.927249, 0.95253, 0.96646, 0.980982, 0.988005, 0.991969, 0.995299,
  ],
  17: [
    0, 0.072921, 0.221067, 0.38149, 0.52658, 0.646862, 0.741572, 0.813649,
    0.867188, 0.906243, 0.93316, 0.95253, 0.96646, 0.976409, 0.983472, 0.988461,
    0.991969, 0.995299,
  ],
  20: [
    0, 0.054977, 0.13524, 0.285077, 0.43321, 0.559104, 0.657453, 0.737406,
    0.800852, 0.850296, 0.888291, 0.906448, 0.93316, 0.95253, 0.96646, 0.976107,
    0.982649, 0.987436, 0.990926, 0.993462, 0.995299,
  ],
};

const FPS = 24;

describe("springTimingProgress (the remotion springTiming port, damping 200)", () => {
  it("settles in 18 natural frames at fps 24 (remotion measureSpring parity)", () => {
    expect(
      measureSpringFrames(FPS, { damping: 200, mass: 1, stiffness: 100 }),
    ).toBe(18);
  });

  for (const [dur, values] of Object.entries(REF)) {
    it(`matches remotion frame-for-frame at durationInFrames ${dur}`, () => {
      const d = Number(dur);
      values.forEach((expected, frame) => {
        expect(springTimingProgress(frame, d, FPS)).toBeCloseTo(expected, 5);
      });
    });
  }

  it("returns 1 past the transition window (remotion's early exit)", () => {
    expect(springTimingProgress(15, 14, FPS)).toBe(1);
    expect(springTimingProgress(100, 14, FPS)).toBe(1);
  });

  it("is monotonic over the window (no overshoot at damping 200)", () => {
    let prev = -1;
    for (let f = 0; f <= 14; f++) {
      const v = springTimingProgress(f, 14, FPS);
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });
});
