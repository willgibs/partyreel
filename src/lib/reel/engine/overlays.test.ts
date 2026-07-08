import { describe, expect, it } from "vitest";

import { bloomAlpha, lightsweepX } from "./overlays";

// Pins sampled from the effects.tsx source expressions (the Remotion side of the parity pair):
// bloom `0.1 + 0.05 * (0.5 + 0.5 * Math.sin(t * PI * 2))`, lightsweep `-15 + t * 130`. If someone
// retunes the DOM overlay, these trip so the canvas twin gets retuned in the same change.

describe("bloomAlpha", () => {
  it("breathes 0.1..0.15 over the reel with the sin phase of effects.tsx", () => {
    expect(bloomAlpha(0)).toBeCloseTo(0.125, 12);
    expect(bloomAlpha(0.25)).toBeCloseTo(0.15, 12); // sin peak
    expect(bloomAlpha(0.5)).toBeCloseTo(0.125, 12);
    expect(bloomAlpha(0.75)).toBeCloseTo(0.1, 12); // sin trough
    expect(bloomAlpha(1)).toBeCloseTo(0.125, 12);
  });
});

describe("lightsweepX", () => {
  it("sweeps -15% -> 115% linearly across the reel", () => {
    expect(lightsweepX(0)).toBe(-15);
    expect(lightsweepX(0.5)).toBe(50);
    expect(lightsweepX(1)).toBe(115);
  });
});
