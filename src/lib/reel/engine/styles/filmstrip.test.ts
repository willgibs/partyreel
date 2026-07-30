import { describe, expect, it } from "vitest";

import type { ReelClip, ReelProps } from "../reel-types";
import { resolveTheme } from "../themes";
import { cubicBezier } from "../easing";
import {
  FILMSTRIP,
  filmStripDuration,
  filmStripState,
  perfGlow,
  stripPosition,
} from "./filmstrip";

// PARITY PINS: sampled on 2026-07-08 from the REAL Remotion FilmStrip math
// (composition/treatments/film-strip.tsx run against remotion's interpolate/Easing at seed 73, n 8,
// portrait 1080x1920 — the parity-harness defaults). If these fail, the canvas port has drifted from
// the Remotion player; fix the port, do not re-record the pins from the port.
const N = 8;
const SEED = 73;
const W = 1080;
const H = 1920;

type Pin = {
  frame: number;
  pos: number;
  blurAmt: number;
  flick: number;
  offset: number;
};

const PINS: Pin[] = [
  { frame: 0, pos: 0, blurAmt: 0, flick: 0.932929, offset: 460.8 },
  { frame: 15, pos: 0, blurAmt: 0, flick: 0.961416, offset: 460.8 },
  // The pull: eased advance + the sine-capped motion blur (peak 17.28px at mid-pull, main 1920).
  {
    frame: 31,
    pos: 0.00904,
    blurAmt: 4.472393,
    flick: 0.947135,
    offset: 451.774628,
  },
  {
    frame: 36,
    pos: 0.796097,
    blurAmt: 17.28,
    flick: 0.99267,
    offset: -334.023206,
  },
  {
    frame: 41,
    pos: 0.996917,
    blurAmt: 4.472393,
    flick: 0.991399,
    offset: -534.521759,
  },
  { frame: 42, pos: 1, blurAmt: 0, flick: 0.997817, offset: -537.6 },
  { frame: 100, pos: 2, blurAmt: 0, flick: 0.951568, offset: -1536 },
  { frame: 175, pos: 4, blurAmt: 0, flick: 0.96739, offset: -3532.8 },
  // The last frame holds (pos clamps at n-1, no blur past the final pull).
  { frame: 300, pos: 7, blurAmt: 0, flick: 0.990039, offset: -6528 },
  { frame: 320, pos: 7, blurAmt: 0, flick: 0.948144, offset: -6528 },
];

describe("filmStripState (Remotion FilmStrip parity)", () => {
  for (const pin of PINS) {
    it(`matches at frame ${pin.frame}`, () => {
      const st = filmStripState(pin.frame, N, SEED, W, H);
      expect(st.pos).toBeCloseTo(pin.pos, 4);
      expect(st.blurAmt).toBeCloseTo(pin.blurAmt, 4);
      expect(st.flick).toBeCloseTo(pin.flick, 4);
      expect(st.offset).toBeCloseTo(pin.offset, 4);
    });
  }

  it("holds crisp between pulls (the intermittent movement, not a smooth scroll)", () => {
    for (let f = 43; f <= 72; f++) {
      const st = filmStripState(f, N, SEED, W, H);
      expect(st.pos).toBe(1);
      expect(st.blurAmt).toBe(0);
    }
  });

  it("pins the gate-boosted perf bloom (i 2, k 1, e 0 at the gate, frame 100)", () => {
    const st = filmStripState(100, N, SEED, W, H);
    const cellMain = 1920 * 0.52;
    const mainCoord = st.offset + 2 * cellMain;
    const mp = ((1 + 0.5) / 4) * cellMain;
    const distGate = Math.abs(mainCoord + mp - 1920 / 2);
    expect(perfGlow(SEED, 2, 1, 0, distGate, 1920)).toBeCloseTo(0.572165, 5);
  });
});

// The mechanical pull-down curve, pinned against remotion's Easing.bezier(0.55, 0, 0.1, 1)
// (sampled 2026-07-08). stripPosition rides this curve over the ADVANCE window.
describe("the EASE_PULL bezier (remotion Easing parity)", () => {
  const REF: [number, number][] = [
    [0, 0],
    [0.05, 0.003031],
    [0.1, 0.013523],
    [0.2, 0.0716],
    [0.3, 0.248082],
    [0.4, 0.601467],
    [0.5, 0.796097],
    [0.6, 0.893724],
    [0.7, 0.948806],
    [0.8, 0.979932],
    [0.9, 0.995488],
    [0.95, 0.998924],
    [1, 1],
  ];

  it("matches remotion sample-for-sample", () => {
    const pull = cubicBezier(0.55, 0, 0.1, 1);
    for (const [x, expected] of REF) {
      expect(pull(x)).toBeCloseTo(expected, 5);
    }
  });

  it("drives stripPosition's mid-pull value", () => {
    // frame 36 = HOLD + 6 of 12 advance frames into cycle 0 -> 0 + pull(0.5).
    expect(stripPosition(36, N)).toBeCloseTo(0.796097, 5);
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
  styleId: "filmstrip",
});

describe("FILMSTRIP (the engine style)", () => {
  it("pins the duration formula ((n-1) * 42 + 30 + 26, the Remotion filmStripDuration)", () => {
    expect(filmStripDuration(8)).toBe(350);
    expect(filmStripDuration(1)).toBe(56);
    expect(filmStripDuration(0)).toBe(14); // (n-1) underflow still >= 1, like the source
    expect(FILMSTRIP.duration(props(8))).toBe(350);
  });

  it("declares no derived assets (fully procedural over the plain clips)", () => {
    expect(FILMSTRIP.assetNeeds(props(8))).toEqual({
      washes: false,
      grain: false,
      haloFilter: null,
    });
  });
});
