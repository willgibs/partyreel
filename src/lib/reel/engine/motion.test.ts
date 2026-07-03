import { describe, expect, it } from "vitest";

import type { ClipMotion } from "../composition/layout";
import { computeMotion, dampForFit } from "./motion";

// Behavior pins for the computeMotion port (source of truth: Reel.tsx computeMotion). Endpoint values
// are asserted from the FORMULAS' closed forms; the eased mid-curve values ride on the easing parity
// pins in easing.test.ts (same EASE instance).

const W = 1080;

const m: ClipMotion = {
  panX: 0.6,
  panY: -0.8,
  panFrac: 0.05,
  zoomDelta: 0.1,
  punch: 0.08,
};
const baseZoom = 1 + 2 * m.panFrac + 0.015;
const panPx = m.panFrac * W;

describe("computeMotion: freezeGo (Cinematic's beat)", () => {
  it("holds perfectly still through the first 45% of the clip", () => {
    for (const frame of [0, 10, 26]) {
      const mv = computeMotion("freezeGo", frame, 60, m, W); // p <= 0.45 up to frame 27
      expect(mv.scale).toBeCloseTo(baseZoom, 10);
      // toBeCloseTo, not toBe: go * negative pan lands on -0 during the hold.
      expect(mv.tx).toBeCloseTo(0, 10);
      expect(mv.ty).toBeCloseTo(0, 10);
      expect(mv.rotate).toBe(0);
    }
  });

  it("lands the full push at the end of the hold", () => {
    const mv = computeMotion("freezeGo", 60, 60, m, W);
    expect(mv.scale).toBeCloseTo(baseZoom + m.zoomDelta, 10);
    expect(mv.tx).toBeCloseTo(m.panX * panPx, 10);
    expect(mv.ty).toBeCloseTo(m.panY * panPx, 10);
  });

  it("moves monotonically once the go begins (EASE never overshoots)", () => {
    let prev = baseZoom - 1e-9;
    for (let f = 0; f <= 60; f++) {
      const mv = computeMotion("freezeGo", f, 60, m, W);
      expect(mv.scale).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = mv.scale;
    }
  });
});

describe("computeMotion: punch", () => {
  it("snaps in from 1 + max(punch, 0.12) at entry", () => {
    const mv = computeMotion("punch", 0, 48, m, W);
    expect(mv.scale).toBeCloseTo(baseZoom * (1 + Math.max(m.punch, 0.12)), 10);
  });

  it("ends on the half-strength drift with the damped 0.4x pan", () => {
    const mv = computeMotion("punch", 48, 48, m, W);
    expect(mv.scale).toBeCloseTo(baseZoom + m.zoomDelta * 0.5, 10);
    expect(mv.tx).toBeCloseTo(m.panX * panPx * 0.4, 10);
    expect(mv.ty).toBeCloseTo(m.panY * panPx * 0.4, 10);
  });
});

describe("computeMotion: drift (the default)", () => {
  it("applies the optional entry punch multiplicatively at frame 0", () => {
    const mv = computeMotion("drift", 0, 48, m, W);
    expect(mv.scale).toBeCloseTo(baseZoom * (1 + m.punch!), 10);
  });

  it("pans linearly to the full seeded vector", () => {
    const half = computeMotion("drift", 24, 48, { ...m, punch: 0 }, W);
    expect(half.tx).toBeCloseTo((m.panX * panPx) / 2, 10);
    const end = computeMotion("drift", 48, 48, { ...m, punch: 0 }, W);
    expect(end.scale).toBeCloseTo(baseZoom + m.zoomDelta, 10);
    expect(end.tx).toBeCloseTo(m.panX * panPx, 10);
  });
});

describe("computeMotion: float", () => {
  it("sways within the pan budget and rotates at most half a degree", () => {
    for (let f = 0; f <= 70; f += 7) {
      const mv = computeMotion("float", f, 70, m, W);
      expect(Math.abs(mv.tx)).toBeLessThanOrEqual(
        Math.abs(m.panX * panPx) + 1e-9,
      );
      expect(Math.abs(mv.ty)).toBeLessThanOrEqual(
        Math.abs(m.panY * panPx) + 1e-9,
      );
      expect(Math.abs(mv.rotate)).toBeLessThanOrEqual(0.5);
    }
  });

  it("zooms linearly from baseZoom to baseZoom + zoomDelta", () => {
    expect(computeMotion("float", 0, 70, m, W).scale).toBeCloseTo(baseZoom, 10);
    expect(computeMotion("float", 70, 70, m, W).scale).toBeCloseTo(
      baseZoom + m.zoomDelta,
      10,
    );
  });
});

describe("dampForFit (clip-media's contained-photo breathe)", () => {
  it("keeps 22% of the zoom and zeroes pan and rotation", () => {
    const damped = dampForFit({ scale: 1.2, tx: 30, ty: -12, rotate: 0.4 });
    expect(damped.scale).toBeCloseTo(1 + 0.2 * 0.22, 10);
    expect(damped.tx).toBe(0);
    expect(damped.ty).toBe(0);
    expect(damped.rotate).toBe(0);
  });
});
