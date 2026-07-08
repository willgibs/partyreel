import { describe, expect, it } from "vitest";

import type { ReelClip, ReelProps } from "../../composition/reel-types";
import { resolveTheme } from "../../composition/themes";
import {
  dropInterval,
  place,
  SCATTERED,
  scatteredDuration,
  scatteredGroundShadow,
  scatteredPrintState,
  scatteredTimeline,
} from "./scattered";

// PARITY PINS: sampled on 2026-07-08 from the REAL Remotion ScatteredPrints math
// (composition/treatments/scattered-prints.tsx run against remotion's spring/interpolate/Easing at
// fps 24, seed 73, n 8, portrait 1080x1920 with the parity-harness fixture dims). If these fail,
// the canvas port has drifted from the Remotion player; fix the port, do not re-record the pins
// from the port.
const N = 8;
const SEED = 73;
const W = 1080;
const H = 1920;
const BASE = 1080;

// The harness fixtures' source dims (drive the print aspect clamp).
const FIX: Pick<ReelClip, "width" | "height">[] = [
  { width: 900, height: 600 },
  { width: 700, height: 1050 },
  { width: 900, height: 601 },
  { width: 900, height: 600 },
  { width: 800, height: 534 },
  { width: 900, height: 600 },
  { width: 900, height: 601 },
  { width: 900, height: 600 },
];

describe("scatteredTimeline (Remotion ScatteredPrints parity)", () => {
  type TPin = {
    frame: number;
    lift: number;
    heroFloat: number;
    heroPress: number;
    boardDim: number;
    boardScale: number;
    boardBlur: number;
  };
  const PINS: TPin[] = [
    {
      frame: 0,
      lift: 0,
      heroFloat: 0,
      heroPress: 0,
      boardDim: 1,
      boardScale: 1,
      boardBlur: 0,
    },
    {
      frame: 117,
      lift: 0,
      heroFloat: 0,
      heroPress: 0,
      boardDim: 1,
      boardScale: 1,
      boardBlur: 0,
    },
    // The wind-up press over the hero beat, before the lift releases.
    {
      frame: 147,
      lift: 0,
      heroFloat: 0,
      heroPress: 0.2,
      boardDim: 1,
      boardScale: 1,
      boardBlur: 0,
    },
    // Mid-lift: the board dims/recedes/softens while the press eases out.
    {
      frame: 167,
      lift: 0.877174,
      heroFloat: 0,
      heroPress: 0.122826,
      boardDim: 0.929826,
      boardScale: 0.986842,
      boardBlur: 2.463105,
    },
    {
      frame: 175,
      lift: 0.971779,
      heroFloat: 0,
      heroPress: 0.028221,
      boardDim: 0.922258,
      boardScale: 0.985423,
      boardBlur: 2.728756,
    },
    // Fully lifted: the hero float breathes in (eased from zero amplitude AND phase).
    {
      frame: 200,
      lift: 1,
      heroFloat: 0.078857,
      heroPress: 0,
      boardDim: 0.92,
      boardScale: 0.985,
      boardBlur: 2.808,
    },
    {
      frame: 216,
      lift: 1,
      heroFloat: 3.2207,
      heroPress: 0,
      boardDim: 0.92,
      boardScale: 0.985,
      boardBlur: 2.808,
    },
  ];

  it("pins the drop cadence + build end (di 17 at n 8, buildEnd 145)", () => {
    expect(dropInterval(8)).toBe(17);
    expect(scatteredTimeline(0, N, BASE).buildEnd).toBe(145);
  });

  for (const pin of PINS) {
    it(`matches at frame ${pin.frame}`, () => {
      const tl = scatteredTimeline(pin.frame, N, BASE);
      expect(tl.lift).toBeCloseTo(pin.lift, 4);
      expect(tl.heroFloat).toBeCloseTo(pin.heroFloat, 4);
      expect(tl.heroPress).toBeCloseTo(pin.heroPress, 4);
      expect(tl.boardDim).toBeCloseTo(pin.boardDim, 4);
      expect(tl.boardScale).toBeCloseTo(pin.boardScale, 4);
      expect(tl.boardBlur).toBeCloseTo(pin.boardBlur, 4);
    });
  }
});

describe("scatteredPrintState (Remotion ScatteredPrints parity)", () => {
  type PPin = {
    frame: number;
    i: number;
    lift: number;
    anticip: number;
    p: number;
    cx: number;
    cy: number;
    tx: number;
    ty: number;
    rot: number;
    sc: number;
    op: number;
    squash: number;
    mountW: number;
    mountH: number;
    photoW: number;
    photoH: number;
  };
  const PINS: PPin[] = [
    {
      frame: 0,
      i: 0,
      lift: 0,
      anticip: 0,
      p: 0,
      cx: 0.56698,
      cy: 0.455831,
      tx: 0,
      ty: -453.6,
      rot: -7.985813,
      sc: 1.1,
      op: 0,
      squash: 1,
      mountW: 596.14717,
      mountH: 452.659619,
      photoW: 554.924227,
      photoH: 396.374448,
    },
    {
      frame: 8,
      i: 0,
      lift: 0,
      anticip: 0,
      p: 1.005993,
      cx: 0.56698,
      cy: 0.455831,
      tx: 0,
      ty: 2.718548,
      rot: 4.086106,
      sc: 0.999401,
      op: 1,
      squash: 1,
      mountW: 596.14717,
      mountH: 452.659619,
      photoW: 554.924227,
      photoH: 396.374448,
    },
    {
      frame: 100,
      i: 5,
      lift: 0,
      anticip: 0,
      p: 1.001445,
      cx: 0.9,
      cy: 0.346104,
      tx: 0.156034,
      ty: 0.187241,
      rot: 7.031736,
      sc: 0.999856,
      op: 1,
      squash: 1,
      mountW: 564.559076,
      mountH: 428.674511,
      photoW: 525.520416,
      photoH: 375.371726,
    },
    {
      frame: 216,
      i: 3,
      lift: 0,
      anticip: 0,
      p: 1,
      cx: 0.710031,
      cy: 0.727716,
      tx: 0,
      ty: 0,
      rot: 8.216044,
      sc: 1,
      op: 1,
      squash: 1,
      mountW: 433.022217,
      mountH: 328.797455,
      photoW: 403.079192,
      photoH: 287.913708,
    },
    // The HERO at full lift: risen, straightened to level, grown to 1.18x, nudged toward center.
    {
      frame: 216,
      i: 7,
      lift: 1,
      anticip: 0,
      p: 1,
      cx: 0.5,
      cy: 0.46,
      tx: 0,
      ty: -54,
      rot: 0,
      sc: 1.18,
      op: 1,
      squash: 1,
      mountW: 682.2144,
      mountH: 518.0112,
      photoW: 635.04,
      photoH: 453.6,
    },
  ];

  for (const pin of PINS) {
    it(`matches at frame ${pin.frame}, print ${pin.i}${pin.lift ? " (hero lift)" : ""}`, () => {
      const st = scatteredPrintState(
        pin.frame,
        pin.i,
        FIX[pin.i],
        N,
        SEED,
        W,
        H,
        pin.lift,
        pin.anticip,
      );
      expect(st).not.toBeNull();
      expect(st!.p).toBeCloseTo(pin.p, 4);
      expect(st!.cx).toBeCloseTo(pin.cx, 4);
      expect(st!.cy).toBeCloseTo(pin.cy, 4);
      expect(st!.tx).toBeCloseTo(pin.tx, 4);
      expect(st!.ty).toBeCloseTo(pin.ty, 4);
      expect(st!.rot).toBeCloseTo(pin.rot, 4);
      expect(st!.sc).toBeCloseTo(pin.sc, 4);
      expect(st!.op).toBeCloseTo(pin.op, 4);
      expect(st!.squash).toBeCloseTo(pin.squash, 4);
      expect(st!.mountW).toBeCloseTo(pin.mountW, 3);
      expect(st!.mountH).toBeCloseTo(pin.mountH, 3);
      expect(st!.photoW).toBeCloseTo(pin.photoW, 3);
      expect(st!.photoH).toBeCloseTo(pin.photoH, 3);
    });
  }

  it("is null before a print's drop starts", () => {
    expect(scatteredPrintState(30, 2, FIX[2], N, SEED, W, H, 0, 0)).toBeNull();
  });

  it("reserves the hero a near-center, near-level slot", () => {
    const hero = place(N - 1, N, SEED, false);
    expect(hero.cx).toBe(0.5);
    expect(hero.cy).toBe(0.46);
    expect(Math.abs(hero.rot)).toBeLessThanOrEqual(3);
  });
});

// Structured pins for the 4-layer grounded shadow + the hero detach layer, generated from the
// verbatim Remotion groundShadow() string output (same formulas, same toFixed rounding).
describe("scatteredGroundShadow (lifting-paper physics parity)", () => {
  it("matches the settled-entry reference (ps 400, settleP 0.5, no lift)", () => {
    expect(scatteredGroundShadow(400, 0.5, 0, 1.05)).toEqual([
      { dx: 0, dy: 1.6, blur: 33.2, color: "rgba(46,30,12,0.300)" },
      { dx: 4, dy: 5.12, blur: 8.32, color: "rgba(50,32,12,0.22)" },
      { dx: 4, dy: 10.88, blur: 17.28, color: "rgba(52,32,10,0.210)" },
      { dx: 4, dy: 19.2, blur: 32, color: "rgba(48,30,10,0.189)" },
    ]);
  });

  it("matches the full-lift reference (ps 453.6, settled, lift 1): detached + spread", () => {
    expect(scatteredGroundShadow(453.6, 1, 1, 0.9)).toEqual([
      {
        dx: 0,
        dy: 1.8144000000000002,
        blur: 2.72,
        color: "rgba(46,30,12,0.050)",
      },
      { dx: 4.54, dy: 7.26, blur: 11.79, color: "rgba(50,32,12,0.22)" },
      { dx: 4.54, dy: 35.47, blur: 56.34, color: "rgba(52,32,10,0.180)" },
      { dx: 4.54, dy: 62.6, blur: 104.33, color: "rgba(48,30,10,0.162)" },
      { dx: 4.54, dy: 72.58, blur: 108.86, color: "rgba(40,26,8,0.160)" },
    ]);
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
  styleId: "scattered",
});

describe("SCATTERED (the engine style)", () => {
  it("pins the duration formula ((n-1) * di(n) + 116, the Remotion scatteredPrintsDuration)", () => {
    expect(scatteredDuration(8)).toBe(235);
    expect(scatteredDuration(1)).toBe(116);
    expect(SCATTERED.duration(props(8))).toBe(235);
  });

  it("declares no derived assets (fully procedural over the plain clips)", () => {
    expect(SCATTERED.assetNeeds(props(8))).toEqual({
      washes: false,
      grain: false,
      haloFilter: null,
    });
  });
});
