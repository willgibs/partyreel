import { describe, expect, it } from "vitest";

import type { ReelClip, ReelProps } from "../../composition/reel-types";
import { resolveTheme } from "../../composition/themes";
import {
  FRAMED,
  framedCamera,
  framedDuration,
  framedPieceState,
  holdFrames,
  travelAt,
} from "./framed";

// PARITY PINS: sampled on 2026-07-08 from the REAL Remotion FramedGallery math
// (composition/treatments/framed-gallery.tsx run against remotion's interpolate/Easing at fps 24,
// seed 73, n 8, portrait 1080x1920 with the parity-harness fixture dims). If these fail, the canvas
// port has drifted from the Remotion player; fix the port, do not re-record the pins from the port.
const N = 8;
const SEED = 73;
const W = 1080;
const H = 1920;

// The harness fixtures' source dims (drive the frame aspect clamp).
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

describe("framedCamera (Remotion FramedGallery parity)", () => {
  type CPin = {
    frame: number;
    travel: number;
    camMain: number;
    p: number;
    spotA: number;
  };
  const PINS: CPin[] = [
    // The intro drift from -0.1 up to the first piece.
    { frame: 0, travel: -0.1, camMain: -119.04, p: 0.9, spotA: 0.194 },
    { frame: 8, travel: -0.020876, camMain: -24.850227, p: 0.979124, spotA: 0.20666 },
    { frame: 16, travel: 0, camMain: 0, p: 1, spotA: 0.21 },
    // Holding on piece 0 (travel pinned at the index through the hold).
    { frame: 43, travel: 0, camMain: 0, p: 1, spotA: 0.21 },
    // Mid-travel between pieces 0 and 1: the room dims between pieces.
    { frame: 50, travel: 0.600945, camMain: 715.365417, p: 0.600945, spotA: 0.146151 },
    { frame: 52, travel: 0.791245, camMain: 941.897735, p: 0.791245, spotA: 0.176599 },
    // Arrived at piece 1.
    { frame: 61, travel: 1, camMain: 1190.4, p: 1, spotA: 0.21 },
    // The final piece stays held through the outro.
    { frame: 397, travel: 7, camMain: 8332.8, p: 1, spotA: 0.21 },
  ];

  it("pins the hold cadence + duration (hold 27 at n 8, 398 frames; 86 at n 1)", () => {
    expect(holdFrames(8)).toBe(27);
    expect(framedDuration(8)).toBe(398);
    expect(framedDuration(1)).toBe(86);
  });

  for (const pin of PINS) {
    it(`matches at frame ${pin.frame}`, () => {
      const cam = framedCamera(pin.frame, N, W, H);
      expect(cam.travel).toBeCloseTo(pin.travel, 4);
      expect(cam.camMain).toBeCloseTo(pin.camMain, 3);
      expect(cam.p).toBeCloseTo(pin.p, 4);
      expect(cam.spotA).toBeCloseTo(pin.spotA, 4);
      expect(cam.soloPush).toBe(1); // the dolly case never pushes
    });
  }

  it("push-in replaces the dolly at n 1 (soloPush eases toward 1.05)", () => {
    const cam = framedCamera(40, 1, W, H);
    expect(cam.soloPush).toBeCloseTo(1.023964, 4);
    expect(cam.travel).toBe(0);
  });

  it("travelAt eases between holds on the pinned EASE_STEP curve", () => {
    const hold = holdFrames(N);
    expect(travelAt(43 + hold + 18, N, hold)).toBeCloseTo(1, 4);
  });
});

describe("framedPieceState (Remotion FramedGallery parity)", () => {
  it("matches piece 0 held (travel 0): wood molding, groove, full proximity", () => {
    const st = framedPieceState(0, 0, FIX[0], N, SEED, W, H);
    expect(st.material).toBe("wood");
    expect(st.aspect).toBeCloseTo(1.4, 6);
    expect(st.sizeFrac).toBeCloseTo(0.600121, 5);
    expect(st.frameW).toBeCloseTo(648.131053, 3);
    expect(st.frameH).toBeCloseTo(462.950752, 3);
    expect(st.moldFace).toBeCloseTo(22.357171, 4);
    expect(st.matSide).toBeCloseTo(78.364892, 4);
    expect(st.matBottom).toBeCloseTo(92.470572, 4);
    expect(st.hasGroove).toBe(true);
    expect(st.depthJ).toBeCloseTo(0.986312, 5);
    expect(st.crossJitter).toBeCloseTo(1.236083, 5);
    expect(st.pi).toBe(1);
    expect(st.brightness).toBeCloseTo(1.06, 6);
    expect(st.litA).toBeCloseTo(0.2, 6);
    expect(st.castMul).toBeCloseTo(1.3, 6);
    expect(st.leanScale).toBeCloseTo(1.025, 6);
    expect(st.left).toBeCloseTo(217.170557, 3);
    expect(st.top).toBeCloseTo(-231.475376, 3);
    expect(st.glassAngle).toBeCloseTo(122, 4);
    expect(st.cast).toEqual([
      {
        dx: 0,
        dy: 3.5555555555555554,
        blur: 5.333333333333333,
        color: "rgba(28,26,24,0.200)",
      },
      { dx: 0, dy: 15, blur: 23.3, color: "rgba(28,26,24,0.13)" },
      {
        dx: 0,
        dy: 33.2,
        blur: 44.7,
        spread: -7.8,
        color: "rgba(28,26,24,0.10)",
      },
      {
        dx: 7.111111111111111,
        dy: 14.222222222222221,
        blur: 32.4,
        spread: -10.4,
        color: "rgba(28,26,24,0.07)",
      },
    ]);
  });

  it("matches piece 1 approached mid-travel (travel 0.600945): the proximity ramp", () => {
    const st = framedPieceState(0.600945, 1, FIX[1], N, SEED, W, H);
    expect(st.material).toBe("black");
    expect(st.aspect).toBeCloseTo(0.7, 6); // the portrait fixture clamps at 0.7
    expect(st.frameW).toBeCloseTo(810.55088, 3);
    expect(st.frameH).toBeCloseTo(1157.929828, 3);
    expect(st.hasGroove).toBe(true);
    expect(st.pi).toBeCloseTo(0.693035, 4);
    expect(st.brightness).toBeCloseTo(0.998607, 4);
    expect(st.litA).toBeCloseTo(0.178512, 4);
    expect(st.castMul).toBeCloseTo(1.20791, 4);
    expect(st.leanScale).toBeCloseTo(1.017326, 4);
    expect(st.left).toBeCloseTo(143.686111, 3);
    expect(st.top).toBeCloseTo(611.435086, 3);
    expect(st.glassAngle).toBeCloseTo(123.197164, 4);
    expect(st.cast[0].color).toBe("rgba(28,26,24,0.179)");
    expect(st.cast[1]).toEqual({
      dx: 0,
      dy: 27,
      blur: 42,
      color: "rgba(28,26,24,0.13)",
    });
    expect(st.cast[2]).toEqual({
      dx: 0,
      dy: 59.9,
      blur: 86.8,
      spread: -13.9,
      color: "rgba(28,26,24,0.10)",
    });
  });

  it("matches piece 2 far from the dolly (travel 0): dimmed, grooveless", () => {
    // At travel 2 the dolly is ON piece 2; sample it from travel 0 instead for the dim end.
    const held = framedPieceState(2, 2, FIX[2], N, SEED, W, H);
    expect(held.material).toBe("wood");
    expect(held.sizeFrac).toBeCloseTo(0.691786, 5);
    expect(held.frameW).toBeCloseTo(747.129068, 3);
    expect(held.frameH).toBeCloseTo(533.66362, 3);
    expect(held.hasGroove).toBe(false);
    expect(held.left).toBeCloseTo(161.036906, 3);
    expect(held.top).toBeCloseTo(2113.96819, 3);
    const far = framedPieceState(0, 2, FIX[2], N, SEED, W, H);
    expect(far.pi).toBe(0); // |0 - 2| > 1.3 clamps to the dim floor
    expect(far.brightness).toBeCloseTo(0.86, 6);
    expect(far.leanScale).toBeCloseTo(1, 6);
    expect(far.glassAngle).toBeCloseTo(128, 4); // (2 - 0) * 3 clamps at +6
  });

  it("matches piece 1 in LANDSCAPE (the conceit rotated 90deg)", () => {
    const st = framedPieceState(1, 1, FIX[1], N, SEED, 1920, 1080);
    expect(st.sizeFrac).toBeCloseTo(0.631696, 5); // the landscape size band
    expect(st.frameW).toBeCloseTo(477.562414, 3);
    expect(st.frameH).toBeCloseTo(682.23202, 3);
    expect(st.moldFace).toBeCloseTo(23.18459, 4);
    expect(st.matSide).toBeCloseTo(80.099895, 4);
    expect(st.left).toBeCloseTo(951.618793, 3); // main axis -> left in landscape
    expect(st.top).toBeCloseTo(160.963979, 3);
    expect(st.cast[1]).toEqual({
      dx: 0,
      dy: 17.1,
      blur: 26.6,
      color: "rgba(28,26,24,0.13)",
    });
  });
});

const clips = (n: number): ReelClip[] =>
  Array.from({ length: n }, (_, i) => ({
    url: `u${i}`,
    type: "photo" as const,
  }));

const props = (n: number): ReelProps => ({
  clips: clips(n),
  theme: resolveTheme("editorial"), // the treatment's native theme (style-registry)
  seed: SEED,
  styleId: "framed",
});

describe("FRAMED (the engine style)", () => {
  it("pins the duration formula (INTRO + (n-1)*TRAVEL + n*hold + OUTRO)", () => {
    expect(FRAMED.duration(props(8))).toBe(398);
    expect(FRAMED.duration(props(1))).toBe(86);
  });

  it("declares no derived assets (fully procedural over the plain clips)", () => {
    expect(FRAMED.assetNeeds(props(8))).toEqual({
      washes: false,
      grain: false,
      haloFilter: null,
    });
  });
});
