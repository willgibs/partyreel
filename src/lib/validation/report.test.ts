import { describe, expect, it } from "vitest";

import { reportSchema } from "@/lib/validation/report";

const UUID = "0a8b3c2d-1e4f-4a6b-8c9d-0e1f2a3b4c5d";

describe("reportSchema", () => {
  it("accepts a bare qr_token (event-level report, no item, no reason)", () => {
    expect(reportSchema.safeParse({ qr_token: "tok_abc" }).success).toBe(true);
  });

  it("requires a non-empty qr_token", () => {
    expect(reportSchema.safeParse({}).success).toBe(false);
    expect(reportSchema.safeParse({ qr_token: "" }).success).toBe(false);
    // Whitespace trims to empty → fails min(1).
    expect(reportSchema.safeParse({ qr_token: "   " }).success).toBe(false);
  });

  it("accepts an optional reason alongside a valid media_id", () => {
    expect(
      reportSchema.safeParse({
        qr_token: "tok",
        media_id: UUID,
        reason: "Inappropriate content",
      }).success,
    ).toBe(true);
  });

  it("rejects a non-uuid media_id", () => {
    expect(
      reportSchema.safeParse({ qr_token: "tok", media_id: "123" }).success,
    ).toBe(false);
  });

  it("caps reason at 2000 chars (mirrors the reports_reason_len DB check)", () => {
    expect(
      reportSchema.safeParse({ qr_token: "tok", reason: "x".repeat(2000) })
        .success,
    ).toBe(true);
    expect(
      reportSchema.safeParse({ qr_token: "tok", reason: "x".repeat(2001) })
        .success,
    ).toBe(false);
  });
});
