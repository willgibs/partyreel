import { describe, expect, it } from "vitest";

import type { ReelClip, ReelProps } from "../../composition/reel-types";
import { resolveTheme } from "../../composition/themes";
import { PARALLAX, parallaxDuration, parallaxTimeline, slideLayout } from "./parallax";

// PARITY PINS: sampled on 2026-07-08 from the REAL Remotion LayeredParallax math
// (composition/treatments/layered-parallax.tsx run against remotion's interpolate/Easing at fps 24,
// seed 73, n 8, portrait 1080x1920 with the parity-harness fixture dims). If these fail, the canvas
// port has drifted from the Remotion player; fix the port, do not re-record the pins from the port.
const N = 8;
const SEED = 73;
const MAIN = 1920; // portrait 1080x1920 -> px() unit 1

describe("parallaxTimeline (Remotion LayeredParallax parity)", () => {
  it("pins the duration formula (INTRO + (n-1)*CYCLE + HOLD + TAIL)", () => {
    expect(parallaxDuration(8)).toBe(548);
    expect(parallaxDuration(1)).toBe(86);
  });

  it("matches the intro condense-in (f0 blurred + dark, f7 mid, f14 settled)", () => {
    const t0 = parallaxTimeline(0, N, MAIN);
    expect(t0.c).toBe(0);
    expect(t0.inTrans).toBe(false);
    expect(t0.cur.bgOp).toBe(0);
    expect(t0.cur.fgOp).toBe(0);
    expect(t0.cur.fgScale).toBeCloseTo(0.985, 5);
    expect(t0.cur.fgBlur).toBeCloseTo(9, 5);
    expect(t0.incoming).toBeNull();

    const t7 = parallaxTimeline(7, N, MAIN);
    expect(t7.cur.bgOp).toBeCloseTo(0.775561, 4);
    expect(t7.cur.fgOp).toBeCloseTo(0.775561, 4);
    expect(t7.cur.fgScale).toBeCloseTo(0.996633, 4);
    expect(t7.cur.fgBlur).toBeCloseTo(2.019948, 4);

    const t14 = parallaxTimeline(14, N, MAIN);
    expect(t14.cur.bgOp).toBe(1);
    expect(t14.cur.fgBlur).toBeCloseTo(0, 5);
    expect(t14.cur.u01).toBe(0);
  });

  it("matches the hold drift progress (f40: u01 continuous, fully present)", () => {
    const tl = parallaxTimeline(40, N, MAIN);
    expect(tl.c).toBe(0);
    expect(tl.inTrans).toBe(false);
    expect(tl.cur.u01).toBeCloseTo(0.393939, 4);
    expect(tl.cur.bgOp).toBe(1);
    expect(tl.cur.fgOp).toBe(1);
  });

  it("boundary: local === HOLD is still the hold (strict > in the source)", () => {
    const tl = parallaxTimeline(58, N, MAIN);
    expect(tl.inTrans).toBe(false);
    expect(tl.cur.u01).toBeCloseTo(0.666667, 4);
  });

  it("matches the staggered depth-dissolve mid-swap (f70: photo gone, colour lingering)", () => {
    const tl = parallaxTimeline(70, N, MAIN);
    expect(tl.inTrans).toBe(true);
    expect(tl.transFrac).toBeCloseTo(0.827109, 4);
    expect(tl.cur.u01).toBeCloseTo(0.848485, 4);
    expect(tl.cur.fgOp).toBe(0); // the outgoing photo leaves first
    expect(tl.cur.bgOp).toBeCloseTo(0.246987, 4); // its wash lingers
    expect(tl.cur.fgScale).toBeCloseTo(1.041355, 4);
    expect(tl.cur.fgBlur).toBeCloseTo(4.962653, 4);
    expect(tl.incoming).not.toBeNull();
    expect(tl.incoming!.bgOp).toBe(1); // the incoming wash LEADS (the room re-colors first)
    expect(tl.incoming!.fgOp).toBeCloseTo(0.753013, 4);
    expect(tl.incoming!.fgScale).toBeCloseTo(0.991355, 4);
    expect(tl.incoming!.fgBlur).toBeCloseTo(1.55602, 4);
    expect(tl.incoming!.u01).toBeCloseTo(-0.151515, 4); // raw: its own cycle starts at f80
  });

  it("matches the early swap window (f130 in cycle 1)", () => {
    const tl = parallaxTimeline(130, N, MAIN);
    expect(tl.c).toBe(1);
    expect(tl.transFrac).toBeCloseTo(0.293802, 4);
    expect(tl.cur.bgOp).toBe(1);
    expect(tl.cur.fgOp).toBeCloseTo(0.591942, 4);
    expect(tl.cur.fgBlur).toBeCloseTo(1.76281, 4);
    expect(tl.incoming!.bgOp).toBeCloseTo(0.473874, 4);
    expect(tl.incoming!.fgOp).toBe(0);
    expect(tl.incoming!.fgBlur).toBeCloseTo(6.355785, 4);
  });

  it("the swap resolves cleanly at the cycle boundary (f79 -> f80)", () => {
    const t79 = parallaxTimeline(79, N, MAIN);
    expect(t79.cur.bgOp).toBeCloseTo(0.001593, 4);
    expect(t79.incoming!.fgOp).toBeCloseTo(0.998407, 4);
    const t80 = parallaxTimeline(80, N, MAIN);
    expect(t80.c).toBe(1);
    expect(t80.inTrans).toBe(false);
    expect(t80.cur.bgOp).toBe(1); // c > 0 holds at full presence (no re-intro)
    expect(t80.cur.fgBlur).toBeCloseTo(0, 5);
  });

  it("the last photo holds through the tail (f540: no transition out)", () => {
    const tl = parallaxTimeline(540, N, MAIN);
    expect(tl.c).toBe(7);
    expect(tl.inTrans).toBe(false);
    expect(tl.cur.u01).toBeCloseTo(0.969697, 4);
    expect(tl.incoming).toBeNull();
  });
});

describe("slideLayout (Remotion LayeredParallax parity)", () => {
  it("matches the landscape fixture float + opposed drift (i0, u 0.3)", () => {
    const lay = slideLayout({ width: 900, height: 600 }, 0, 0.3, 1, SEED, 1080, 1920);
    expect(lay.cardW).toBeCloseTo(928.8, 3);
    expect(lay.cardH).toBeCloseTo(619.2, 3);
    expect(lay.bgScale).toBeCloseTo(1.208, 5);
    expect(lay.bgX).toBeCloseTo(-15.12, 4);
    expect(lay.bgY).toBeCloseTo(17.28, 4);
    expect(lay.fgSc).toBeCloseTo(1.015, 5);
    expect(lay.fgX).toBeCloseTo(5.184, 4);
    expect(lay.fgY).toBeCloseTo(-6.528, 4);
    expect(lay.fgRadius).toBeCloseTo(27.864, 4);
  });

  it("matches the portrait fixture (i1, u 0.55, mid-melt fgScale 0.97)", () => {
    const lay = slideLayout({ width: 700, height: 1050 }, 1, 0.55, 0.97, SEED, 1080, 1920);
    expect(lay.cardW).toBeCloseTo(928.8, 3);
    expect(lay.cardH).toBeCloseTo(1393.2, 3);
    expect(lay.bgScale).toBeCloseTo(1.248, 5);
    expect(lay.bgX).toBeCloseTo(3.78, 4);
    expect(lay.bgY).toBeCloseTo(-4.32, 4);
    expect(lay.fgSc).toBeCloseTo(0.996675, 5);
    expect(lay.fgX).toBeCloseTo(-1.296, 4);
    expect(lay.fgY).toBeCloseTo(1.632, 4);
    expect(lay.fgRadius).toBeCloseTo(41.796, 4);
  });

  it("matches a late-drift slide (i4, u 0.9, fgScale 1.02) + the landscape frame (i2)", () => {
    const l4 = slideLayout({ width: 800, height: 534 }, 4, 0.9, 1.02, SEED, 1080, 1920);
    expect(l4.cardH).toBeCloseTo(619.974, 3);
    expect(l4.bgScale).toBeCloseTo(1.304, 5);
    expect(l4.bgX).toBeCloseTo(30.24, 4);
    expect(l4.bgY).toBeCloseTo(34.56, 4);
    expect(l4.fgSc).toBeCloseTo(1.0659, 5);
    const l2 = slideLayout({ width: 900, height: 601 }, 2, 0.1, 1, SEED, 1920, 1080);
    expect(l2.cardW).toBeCloseTo(1293.843594, 3);
    expect(l2.cardH).toBeCloseTo(864, 3);
    expect(l2.bgX).toBeCloseTo(53.76, 4);
    expect(l2.fgSc).toBeCloseTo(1.005, 5);
    expect(l2.fgRadius).toBeCloseTo(38.88, 4);
  });
});

const clips = (n: number): ReelClip[] =>
  Array.from({ length: n }, (_, i) => ({
    url: `u${i}`,
    type: "photo" as const,
  }));

const props = (n: number): ReelProps => ({
  clips: clips(n),
  theme: resolveTheme("classic"), // the treatment's native theme (style-registry)
  seed: SEED,
  styleId: "parallax",
});

describe("PARALLAX (the engine style)", () => {
  it("pins the duration through the style contract", () => {
    expect(PARALLAX.duration(props(8))).toBe(548);
    expect(PARALLAX.duration(props(1))).toBe(86);
  });

  it("declares the washes (the far plane's downsample-chain blur, built once at load)", () => {
    expect(PARALLAX.assetNeeds(props(8))).toEqual({
      washes: true,
      grain: false,
      haloFilter: null,
    });
  });
});
