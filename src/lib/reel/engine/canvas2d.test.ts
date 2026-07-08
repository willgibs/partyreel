import { describe, expect, it } from "vitest";

import {
  applyBrightPass,
  HALO_BLUR_FACTORS,
  probeCtxFilter,
  WATERMARK_MARGIN,
  watermarkLayout,
} from "./canvas2d";

// Pins for the ctx.filter support probe (detectCtxFilter's pure core). The regression these guard:
// a naive assign-then-readback probe returns TRUE on browsers with NO filter IDL attribute, because
// the assignment creates a plain JS expando that reads back verbatim. probeCtxFilter must check
// property EXISTENCE first, then that a valid value sticks.

describe("probeCtxFilter", () => {
  it("returns false when the context has no filter attribute (the Safari expando trap)", () => {
    // A context class with NO filter accessor: assignment would create an own expando property
    // that reads back "blur(2px)", which fooled the readback-only probe into returning true.
    class NoFilterCtx {}
    const ctx = new NoFilterCtx() as { filter?: string };
    expect(probeCtxFilter(ctx)).toBe(false);
    // And the probe must not have "polyfilled" support by leaving an expando behind that would
    // flip a later existence check.
    expect(Object.prototype.hasOwnProperty.call(ctx, "filter")).toBe(false);
  });

  it("returns true when the filter IDL attribute exists and accepts a valid filter string", () => {
    // Spec behavior: the attribute lives on the prototype and keeps a parseable value.
    class WithFilterCtx {
      private f = "none";
      get filter(): string {
        return this.f;
      }
      set filter(v: string) {
        if (typeof v === "string" && v.includes("(")) this.f = v;
      }
    }
    expect(probeCtxFilter(new WithFilterCtx())).toBe(true);
  });

  it("returns false when the attribute exists but rejects the value (readback stays none)", () => {
    class RejectingCtx {
      get filter(): string {
        return "none";
      }
      set filter(_v: string) {
        // parses + drops everything: support is advertised but non-functional
      }
    }
    expect(probeCtxFilter(new RejectingCtx())).toBe(false);
  });
});

// Pins for the bottom-right watermark lockup (the T1 redesign of the old centered
// pill). Two invariants: the safe margin holds on BOTH edges in BOTH orientations,
// and the lockup height comes from the text LINE BOX, not ink extents (the
// ink-metrics version undersized the old pill ~10%; a parity-review catch kept as
// the rule so mark/text optical centering stays stable across fonts).

describe("watermarkLayout", () => {
  const text = { textW: 200, lineAscent: 30, lineDescent: 8 };
  const lockup = { ...text, markSize: 30, gap: 12 };

  it.each([
    ["portrait", 1080, 1920],
    ["landscape", 1920, 1080],
  ])("respects the safe margin bottom-right in %s", (_o, w, h) => {
    const l = watermarkLayout({ w, h, ...lockup });
    expect(l.x + l.lockupW).toBe(w - WATERMARK_MARGIN);
    expect(l.centerY + l.lockupH / 2).toBe(h - WATERMARK_MARGIN);
  });

  it("sizes the lockup from the line box when it exceeds the mark", () => {
    const l = watermarkLayout({ w: 1080, h: 1920, ...lockup });
    expect(l.lockupH).toBe(38); // 30 + 8 line box, not the 30px mark
    expect(l.lockupW).toBe(30 + 12 + 200);
  });

  it("lets a taller mark govern the lockup height (the badge variant)", () => {
    const l = watermarkLayout({
      w: 1080,
      h: 1920,
      ...text,
      markSize: 44,
      gap: 11,
    });
    expect(l.lockupH).toBe(44);
  });
});

// Pins for the halation bright-pass (the Safari path of buildHalo; ctx.filter browsers get the same
// chain natively). Expected values are CSS-filter-spec math for
// brightness(0.5) -> contrast(2.4) -> saturate(1.15), each stage clamped, mirroring clip-media.tsx's
// halation Img filter (minus the theme grade, consistently absent where the media grade is skipped).
// The design invariant they encode: pure white peaks at ~mid-gray while mids/shadows crush to BLACK,
// so the screen blend blooms only from genuine highlights (the old halation wash-out bug stays dead).

describe("applyBrightPass", () => {
  it("crushes mids/shadows to black and peaks white at mid-gray (spec-math pins)", () => {
    const data = new Uint8ClampedArray(
      [
        [255, 255, 255], // pure white -> the bloom peak (~127.5 pre-round)
        [200, 180, 160], // a bright warm highlight survives, dimmed
        [128, 128, 128], // mid-gray -> black (below the contrast knee)
        [240, 200, 120], // a golden highlight keeps its hue ordering
        [0, 0, 0], // black stays black
      ].flatMap((p) => [...p, 255]),
    );
    applyBrightPass(data);
    expect(Array.from(data)).toEqual([
      128, 127, 128, 255, 65, 37, 9, 255, 0, 0, 0, 255, 116, 61, 0, 255, 0, 0,
      0, 255,
    ]);
  });

  it("keeps alpha untouched", () => {
    const data = new Uint8ClampedArray([255, 255, 255, 77]);
    applyBrightPass(data);
    expect(data[3]).toBe(77);
  });
});

describe("halo blur chain", () => {
  it("downsamples to the blur(18px) class (0.5 color pass x 0.5 x 0.64 = 1/6.25 => ~18px)", () => {
    const total = 0.5 * HALO_BLUR_FACTORS.reduce((a, f) => a * f, 1);
    // Radius calibration from the spike: ~2.9px per unit of upscale; 1/total = 6.25 => ~18.1px.
    expect(1 / total).toBeCloseTo(6.25, 10);
    expect(2.9 / total).toBeGreaterThan(17);
    expect(2.9 / total).toBeLessThan(19);
  });
});
