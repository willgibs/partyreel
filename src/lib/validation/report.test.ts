import { describe, expect, it } from "vitest";

import { REPORT_KINDS } from "@/lib/reports/kinds";
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

  // The kind is the album form's (admin-triage r2, `harm=kinds`): one of its six, and only on an album report.
  it("takes each of the form's kinds, and no other word", () => {
    for (const kind of REPORT_KINDS) {
      expect(reportSchema.safeParse({ qr_token: "tok", kind }).success).toBe(
        true,
      );
    }
    expect(
      reportSchema.safeParse({ qr_token: "tok", kind: "spam" }).success,
    ).toBe(false);
  });

  it("names a kind only on an album report (the person form asks none)", () => {
    expect(
      reportSchema.safeParse({ profile_id: UUID, kind: "child" }).success,
    ).toBe(false);
  });

  it("★ never carries a reporter: whatever the body says of one is dropped", () => {
    const parsed = reportSchema.safeParse({
      qr_token: "tok",
      kind: "child",
      reporter_email: "someone@example.com",
      reporter_user_id: UUID,
    });
    expect(parsed.success).toBe(true);
    expect(Object.keys(parsed.data ?? {}).sort()).toEqual(["kind", "qr_token"]);
  });
});

/**
 * THE PERSON ARM (`block=report`, Will 2026-09-19): `Report this person` on a profile sends a
 * `profile_id` and no token, its authority the signed-in viewer the route re-verifies. A body names
 * exactly one subject, so the operator's queue never receives a report it cannot file: both subjects
 * at once, neither, and an album's item riding a person are each refused by the schema itself, before
 * the route reads a session or spends a rate-limit slot.
 */
describe("reportSchema, the person arm", () => {
  const OTHER = "1b9c4d3e-2f50-4b7c-9d0e-1f2a3b4c5d6e";

  it("accepts a bare profile_id: a person report with no token and no reason", () => {
    const parsed = reportSchema.safeParse({ profile_id: UUID });
    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({ profile_id: UUID });
  });

  it("accepts the dialog's optional reason beside the person, trimmed", () => {
    const parsed = reportSchema.safeParse({
      profile_id: UUID,
      reason: "  Sending unwanted messages  ",
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.reason).toBe("Sending unwanted messages");
  });

  it("rejects a profile_id that is not a uuid", () => {
    expect(reportSchema.safeParse({ profile_id: "willg" }).success).toBe(false);
    expect(reportSchema.safeParse({ profile_id: "" }).success).toBe(false);
  });

  it("refuses both subjects in one body: an album and a person", () => {
    const parsed = reportSchema.safeParse({
      qr_token: "tok",
      profile_id: UUID,
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map((i) => i.message)).toContain(
      "Report an album or a person, not both.",
    );
    // An album's item does not make the pair any more fileable.
    expect(
      reportSchema.safeParse({
        qr_token: "tok",
        profile_id: UUID,
        media_id: OTHER,
      }).success,
    ).toBe(false);
  });

  it("refuses neither subject: a reason alone names nobody", () => {
    for (const body of [
      {},
      { reason: "Something is wrong" },
      { kind: "spam" },
    ]) {
      expect(reportSchema.safeParse(body).success, JSON.stringify(body)).toBe(
        false,
      );
    }
    // Neither refine passes a body whose only subject is blank: the token trims to nothing.
    const parsed = reportSchema.safeParse({ reason: "Something is wrong" });
    expect(parsed.error?.issues.map((i) => i.message)).toContain(
      "Report an album or a person, not both.",
    );
  });

  it("refuses a media_id riding a person: a cross-subject reference no event can check", () => {
    const parsed = reportSchema.safeParse({
      profile_id: UUID,
      media_id: OTHER,
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map((i) => i.message)).toEqual([
      "An item report needs its event link.",
    ]);
  });

  it("★ never carries a reporter on a person report either", () => {
    const parsed = reportSchema.safeParse({
      profile_id: UUID,
      reporter_email: "someone@example.com",
      reporter_user_id: OTHER,
    });
    expect(parsed.success).toBe(true);
    expect(Object.keys(parsed.data ?? {})).toEqual(["profile_id"]);
  });
});
