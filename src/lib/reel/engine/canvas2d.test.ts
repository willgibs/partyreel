import { describe, expect, it } from "vitest";

import { probeCtxFilter } from "./canvas2d";

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
