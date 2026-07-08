import { describe, expect, it } from "vitest";

import type { ReelClip, ReelProps } from "../../composition/reel-types";
import { resolveTheme } from "../../composition/themes";
import {
  CARDDECK,
  cardDeckDuration,
  cardShadowLayers,
  cardState,
  deckGeometry,
  deckTimeline,
  restPose,
  sliverCount,
  sliverState,
} from "./carddeck";

// PARITY PINS: sampled on 2026-07-08 from the REAL Remotion CardDeck math
// (composition/treatments/card-deck.tsx run against remotion's spring/interpolate/Easing at fps 24,
// seed 73, n 8, portrait 1080x1920). If these fail, the canvas port has drifted from the Remotion
// player; fix the port, do not re-record the pins from the port.
const N = 8;
const SEED = 73;
const W = 1080;
const H = 1920;
const BASE = 1080;

describe("deckGeometry (Remotion CardDeck parity)", () => {
  it("matches the portrait card metrics", () => {
    const g = deckGeometry(W, H);
    expect(g.cardW).toBeCloseTo(669.6, 4);
    expect(g.cardH).toBeCloseTo(937.44, 4);
    expect(g.radius).toBeCloseTo(33.48, 4);
    expect(g.pad).toBeCloseTo(23.436, 4);
    expect(g.step).toBeCloseTo(21.6, 4);
    expect(g.cx).toBeCloseTo(205.2, 4);
    expect(g.cy).toBeCloseTo(491.28, 4);
  });

  it("swaps to wide cards in landscape from the one core", () => {
    const g = deckGeometry(1920, 1080);
    expect(g.cardW).toBeCloseTo(937.44, 4);
    expect(g.cardH).toBeCloseTo(669.6, 4);
  });
});

describe("deckTimeline (Remotion CardDeck parity)", () => {
  it("pins the duration formula ((n-1)*CYCLE + HOLD + TAIL)", () => {
    expect(cardDeckDuration(8)).toBe(320);
    expect(cardDeckDuration(1)).toBe(54);
  });

  it("matches the intro drop (f0 + f6)", () => {
    const t0 = deckTimeline(0, N, BASE, SEED);
    expect(t0.introP).toBe(0);
    expect(t0.introY).toBeCloseTo(-54, 4);
    expect(t0.inFlick).toBe(false);
    const t6 = deckTimeline(6, N, BASE, SEED);
    expect(t6.introP).toBeCloseTo(0.875, 5);
    expect(t6.introY).toBeCloseTo(-6.75, 4);
  });

  it("matches the flick wind-up (f27: press building, throw barely released)", () => {
    const tl = deckTimeline(27, N, BASE, SEED);
    expect(tl.c).toBe(0);
    expect(tl.inFlick).toBe(true);
    expect(tl.swipeFrame).toBe(1);
    expect(tl.wind).toBeCloseTo(0.333333, 4);
    expect(tl.go).toBeCloseTo(0, 4);
    expect(tl.sp).toBeCloseTo(0.189631, 4); // the promotion spring (raw remotion spring())
    expect(tl.throwDir).toBe(1);
    expect(tl.throwUp).toBeCloseTo(0.218918, 4);
  });

  it("matches the peak press (f29) and the mid-throw (f33, spring overshooting)", () => {
    const t29 = deckTimeline(29, N, BASE, SEED);
    expect(t29.wind).toBeCloseTo(0.977822, 4);
    expect(t29.go).toBeCloseTo(0.022178, 4);
    expect(t29.sp).toBeCloseTo(0.829505, 4);
    const t33 = deckTimeline(33, N, BASE, SEED);
    expect(t33.wind).toBeCloseTo(0.79231, 4);
    expect(t33.go).toBeCloseTo(0.20769, 4);
    expect(t33.sp).toBeCloseTo(1.055199, 4); // the overshoot IS the lively settle; never clamp
  });

  it("clamps the deal at the last card (f290/f319: c 7, resting, no flick)", () => {
    const tl = deckTimeline(319, N, BASE, SEED);
    expect(tl.c).toBe(7);
    expect(tl.inFlick).toBe(false);
    expect(tl.throwUp).toBeCloseTo(-0.061667, 4);
  });
});

describe("restPose + cardState (Remotion CardDeck parity)", () => {
  const geom = deckGeometry(W, H);

  it("matches the resting stack at f20 (hand-set tilts, sink + dim with depth)", () => {
    const tl = deckTimeline(20, N, BASE, SEED);
    const top = cardState(0, tl, geom, SEED, W, H);
    expect(top.tx).toBeCloseTo(20.064603, 4);
    expect(top.ty).toBeCloseTo(0, 4);
    expect(top.rot).toBeCloseTo(1.459704, 4);
    expect(top.scale).toBeCloseTo(1, 4);
    expect(top.bright).toBeCloseTo(1, 4);
    expect(top.op).toBeCloseTo(1, 4);
    expect(top.z).toBe(100);
    const d2 = cardState(2, tl, geom, SEED, W, H);
    expect(d2.tx).toBeCloseTo(-9.272656, 4);
    expect(d2.ty).toBeCloseTo(43.2, 4);
    expect(d2.rot).toBeCloseTo(1.995719, 4);
    expect(d2.scale).toBeCloseTo(0.91, 4);
    expect(d2.bright).toBeCloseTo(0.85, 4);
    expect(d2.op).toBeCloseTo(0.9, 4);
    const incoming = cardState(4, tl, geom, SEED, W, H);
    expect(incoming.op).toBe(0); // depth STACK+1 rests invisible (no pop when reached)
    expect(incoming.bright).toBeCloseTo(0.7, 4);
    expect(incoming.z).toBe(96);
  });

  it("matches the flying top card at f33 (whip, lift, motion blur, gloss sweep)", () => {
    const tl = deckTimeline(33, N, BASE, SEED);
    const st = cardState(0, tl, geom, SEED, W, H);
    expect(st.lift).toBeCloseTo(0.20769, 4);
    expect(st.blur).toBeCloseTo(13.1146, 3); // base*0.02*sin(go*pi)
    expect(st.bright).toBeCloseTo(1.012461, 4);
    expect(st.op).toBeCloseTo(1, 4); // fades only past go 0.5
    expect(st.glossAngle).toBeCloseTo(114.892925, 3);
    expect(st.glossA).toBeCloseTo(0.176615, 4);
    // The throw transform (accelerating toward the seeded corner).
    expect(st.tx).toBeCloseTo(271.286743, 3);
    expect(st.ty).toBeCloseTo(-33.263823, 3);
    expect(st.rot).toBeCloseTo(2.067341, 3);
    expect(st.scale).toBeCloseTo(0.992451, 4);
  });

  it("matches the promoting depth-1 card at f29 (spring lerp toward the top pose)", () => {
    const tl = deckTimeline(29, N, BASE, SEED);
    const st = cardState(1, tl, geom, SEED, W, H);
    expect(st.tx).toBeCloseTo(12.209069, 4);
    expect(st.ty).toBeCloseTo(3.682692, 4);
    expect(st.rot).toBeCloseTo(1.793218, 4);
    expect(st.scale).toBeCloseTo(0.992328, 4);
    expect(st.bright).toBeCloseTo(0.987213, 4);
    expect(st.op).toBeCloseTo(0.991475, 4);
  });

  it("restPose dims + sinks with depth (the verbatim pose table)", () => {
    const p = restPose(3, 4.421726 / 1.48, 24.03513 / 1.66, 21.6);
    expect(p.scale).toBeCloseTo(0.865, 6);
    expect(p.ty).toBeCloseTo(64.8, 6);
    expect(p.op).toBeCloseTo(0.85, 6);
  });
});

describe("cardShadowLayers + slivers (Remotion CardDeck parity)", () => {
  const geom = deckGeometry(W, H);

  it("matches the grounded shadow at rest and mid-lift (same toFixed rounding)", () => {
    expect(cardShadowLayers(21.6, BASE, 0)).toEqual([
      { dx: 0, dy: 10.8, blur: 19.4, color: "rgba(12,10,14,0.400)" },
      { dx: 0, dy: 6.5, blur: 15.1, color: "rgba(12,10,14,0.3)" },
    ]);
    expect(cardShadowLayers(21.6, BASE, 0.022178)[0]).toEqual({
      dx: 0,
      dy: 12,
      blur: 21.6,
      color: "rgba(12,10,14,0.396)",
    });
  });

  it("matches the sliver ride during the promotion (f29: effDepth eased by sp)", () => {
    const tl = deckTimeline(29, N, BASE, SEED);
    const sl = sliverState(0, tl, geom, SEED, W);
    expect(sl.effDepth).toBeCloseTo(3.170495, 4);
    expect(sl.left).toBeCloseTo(261.482543, 3);
    expect(sl.top).toBeCloseTo(559.762692, 3);
    expect(sl.w).toBeCloseTo(574.066644, 3);
    expect(sl.h).toBeCloseTo(36.72, 4);
    expect(sl.op).toBeCloseTo(0.9, 4);
    expect(sl.z).toBe(97); // rounds ABOVE the incoming depth-4 card mid-promotion
  });

  it("thins the deck as the reel deals through it", () => {
    expect(sliverCount(8, 0)).toBe(3);
    expect(sliverCount(8, 3)).toBe(0);
    expect(sliverCount(8, 7)).toBe(0);
  });
});

const clips = (n: number): ReelClip[] =>
  Array.from({ length: n }, (_, i) => ({
    url: `u${i}`,
    type: "photo" as const,
  }));

const props = (n: number): ReelProps => ({
  clips: clips(n),
  theme: resolveTheme("punchy"), // the treatment's native theme (style-registry)
  seed: SEED,
  styleId: "carddeck",
});

describe("CARDDECK (the engine style)", () => {
  it("pins the duration through the style contract", () => {
    expect(CARDDECK.duration(props(8))).toBe(320);
    expect(CARDDECK.duration(props(1))).toBe(54);
  });

  it("declares no derived assets (fully procedural over the plain clips)", () => {
    expect(CARDDECK.assetNeeds(props(8))).toEqual({
      washes: false,
      grain: false,
      haloFilter: null,
    });
  });
});
