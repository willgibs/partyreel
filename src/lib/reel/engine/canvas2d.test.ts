import { describe, expect, it } from "vitest";

import { probeCtxFilter, WATERMARK_MARGIN, watermarkLayout } from "./canvas2d";

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
