import { describe, expect, it } from "vitest";

import { measureSpringFrames, springTimingProgress, springValue } from "./spring";

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

// PARITY PINS: sampled from the REAL remotion spring({ frame, fps: 24, config }) on 2026-07-08 for
// the UNDERDAMPED treatment-entry configs (Polaroid's toss d14/s110/m0.8, Scattered's landing
// d17/s140/m0.8). These curves OVERSHOOT past 1 and settle — the bounce is the point; if these fail,
// fix the port, do not re-record the pins from the port itself.
const RAW_REF: { config: { damping: number; stiffness: number; mass: number }; values: number[] }[] =
  [
    {
      config: { damping: 14, stiffness: 110, mass: 0.8 },
      values: [
        0, 0.093171, 0.288792, 0.501321, 0.686689, 0.828156, 0.924942,
        0.984095, 1.015268, 1.027766, 1.02918, 1.025013, 1.018847, 1.012742,
        1.00768, 1.003962, 1.001511, 1.000077, 0.999373, 0.999138, 0.999167,
        0.99932, 0.999507, 0.999679, 0.999815, 0.999912, 0.999973, 1.000007,
        1.000022, 1.000026, 1.000023,
      ],
    },
    {
      config: { damping: 17, stiffness: 140, mass: 0.8 },
      values: [
        0, 0.112758, 0.333699, 0.555835, 0.734795, 0.86076, 0.940099,
        0.984606, 1.005993, 1.013638, 1.014111, 1.011532, 1.008201, 1.005214,
        1.002957, 1.001445, 1.000537, 1.000057, 0.999847, 0.999791, 0.999809,
        0.999854, 0.999901, 0.99994, 0.999968, 0.999986, 0.999996, 1.000001,
        1.000003, 1.000003, 1.000003,
      ],
    },
  ];

describe("springValue (the raw remotion spring port, treatment configs)", () => {
  for (const { config, values } of RAW_REF) {
    it(`matches remotion frame-for-frame at damping ${config.damping} / stiffness ${config.stiffness} / mass ${config.mass}`, () => {
      values.forEach((expected, frame) => {
        expect(springValue(frame, FPS, config)).toBeCloseTo(expected, 5);
      });
    });
  }

  it("overshoots 1 and settles back (underdamped; the treatments' bounce)", () => {
    const peak = Math.max(
      ...RAW_REF[0].values.map((_, f) =>
        springValue(f, FPS, RAW_REF[0].config),
      ),
    );
    expect(peak).toBeGreaterThan(1.02);
    expect(springValue(60, FPS, RAW_REF[0].config)).toBeCloseTo(1, 3);
  });
});
