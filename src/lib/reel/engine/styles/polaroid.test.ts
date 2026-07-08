import { describe, expect, it } from "vitest";

import type { ReelClip, ReelProps } from "../../composition/reel-types";
import { resolveTheme } from "../../composition/themes";
import { POLAROID, polaroidDuration, polaroidPrintState } from "./polaroid";

// PARITY PINS: sampled on 2026-07-08 from the REAL Remotion PolaroidStack math
// (composition/treatments/polaroid-stack.tsx run against remotion's spring/interpolate at fps 24,
// seed 73, n 8, portrait 1080x1920 — the parity-harness defaults). If these fail, the canvas port
// has drifted from the Remotion player; fix the port, do not re-record the pins from the port.
const N = 8;
const SEED = 73;
const W = 1080;
const H = 1920;

type Pin = {
  frame: number;
  i: number;
  p: number;
  tx: number;
  ty: number;
  rot: number;
  sc: number;
  op: number;
  squashY: number;
  dev: number;
  kb: number;
  zLift: number;
};

const PINS: Pin[] = [
  // i0 drops from above: off-screen at frame 0, mid-flight overshoot spin by frame 10.
  {
    frame: 0,
    i: 0,
    p: 0,
    tx: 0,
    ty: -2304,
    rot: -17.985813,
    sc: 1.12,
    op: 0,
    squashY: 1,
    dev: 0,
    kb: 1.02,
    zLift: 0.45,
  },
  {
    frame: 4,
    i: 0,
    p: 0.686689,
    tx: 5.568975,
    ty: -697.023314,
    rot: -2.878649,
    sc: 1.037597,
    op: 1,
    squashY: 1,
    dev: 0,
    kb: 1.022424,
    zLift: 0.45,
  },
  {
    frame: 10,
    i: 0,
    p: 1.02918,
    tx: 8.346537,
    ty: 104.466502,
    rot: 4.656145,
    sc: 0.996498,
    op: 1,
    squashY: 1,
    dev: 0.075758,
    kb: 1.026061,
    zLift: 0.45,
  },
  // i1 slides in from the left edge (the ~40% slide-in toss variant).
  {
    frame: 26,
    i: 1,
    p: 0.686689,
    tx: -347.887561,
    ty: -68.461565,
    rot: 0.41405,
    sc: 1.046491,
    op: 1,
    squashY: 1,
    dev: 0,
    kb: 1.022424,
    zLift: 0.528571,
  },
  {
    frame: 40,
    i: 1,
    p: 0.999373,
    tx: -63.698096,
    ty: 5.277066,
    rot: 4.791623,
    sc: 1.008647,
    op: 1,
    squashY: 1,
    dev: 0.378788,
    kb: 1.030909,
    zLift: 0.528571,
  },
  {
    frame: 60,
    i: 2,
    p: 1.001511,
    tx: -13.470993,
    ty: 7.68104,
    rot: 4.190982,
    sc: 1.016958,
    op: 1,
    squashY: 1,
    dev: 0.30303,
    kb: 1.029697,
    zLift: 0.607143,
  },
  // i5 at its exact dropStart (local 0): present but not yet visible.
  {
    frame: 110,
    i: 5,
    p: 0,
    tx: -972,
    ty: -230.4,
    rot: -6.950927,
    sc: 1.168,
    op: 0,
    squashY: 1,
    dev: 0,
    kb: 1.02,
    zLift: 0.842857,
  },
  // i7 (the top print) at its dropStart and fully settled on the reel's last frame.
  {
    frame: 154,
    i: 7,
    p: 0,
    tx: 972,
    ty: -230.4,
    rot: 21.242231,
    sc: 1.1872,
    op: 0,
    squashY: 1,
    dev: 0,
    kb: 1.02,
    zLift: 1,
  },
  {
    frame: 221,
    i: 7,
    p: 1,
    tx: 69.19186,
    ty: -126.958979,
    rot: 7.242231,
    sc: 1.06,
    op: 1,
    squashY: 1,
    dev: 1,
    kb: 1.06,
    zLift: 1,
  },
];

describe("polaroidPrintState (Remotion PolaroidStack parity)", () => {
  for (const pin of PINS) {
    it(`matches at frame ${pin.frame}, print ${pin.i}`, () => {
      const st = polaroidPrintState(pin.frame, pin.i, N, SEED, W, H);
      expect(st).not.toBeNull();
      expect(st!.p).toBeCloseTo(pin.p, 4);
      expect(st!.tx).toBeCloseTo(pin.tx, 4);
      expect(st!.ty).toBeCloseTo(pin.ty, 4);
      expect(st!.rot).toBeCloseTo(pin.rot, 4);
      expect(st!.sc).toBeCloseTo(pin.sc, 4);
      expect(st!.op).toBeCloseTo(pin.op, 4);
      expect(st!.squashY).toBeCloseTo(pin.squashY, 4);
      expect(st!.dev).toBeCloseTo(pin.dev, 4);
      expect(st!.kb).toBeCloseTo(pin.kb, 4);
      expect(st!.zLift).toBeCloseTo(pin.zLift, 4);
    });
  }

  it("is null before a print's drop starts", () => {
    expect(polaroidPrintState(10, 3, N, SEED, W, H)).toBeNull();
    expect(polaroidPrintState(153, 7, N, SEED, W, H)).toBeNull();
  });

  it("lands the develop-in fully within a print's on-screen life", () => {
    const st = polaroidPrintState(7 * 22 + 8 + 27, 7, N, SEED, W, H);
    expect(st!.dev).toBeCloseTo(1, 5);
  });
});

const clips = (n: number): ReelClip[] =>
  Array.from({ length: n }, (_, i) => ({
    url: `u${i}`,
    type: "photo" as const,
  }));

const props = (n: number): ReelProps => ({
  clips: clips(n),
  theme: resolveTheme("warm"), // the treatment's native theme (style-registry)
  seed: SEED,
  styleId: "polaroid",
});

describe("POLAROID (the engine style)", () => {
  it("pins the duration formula (n * 22 + 46, the Remotion polaroidStackDuration)", () => {
    expect(polaroidDuration(8)).toBe(222);
    expect(polaroidDuration(1)).toBe(68);
    expect(polaroidDuration(0)).toBe(46);
    expect(POLAROID.duration(props(8))).toBe(222);
  });

  it("declares no derived assets (fully procedural over the plain clips)", () => {
    expect(POLAROID.assetNeeds(props(8))).toEqual({
      washes: false,
      grain: false,
      haloFilter: null,
    });
  });
});
