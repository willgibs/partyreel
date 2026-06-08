import { describe, expect, it } from "vitest";

import { estimatePasswordStrength } from "./password-strength";

describe("estimatePasswordStrength (soft guidance, not a gate)", () => {
  it("empty -> no score, no label (the meter renders nothing)", () => {
    expect(estimatePasswordStrength("")).toEqual({ score: 0, label: "" });
  });

  it("a short password can never read above Weak, whatever the variety", () => {
    // 4-char event-password floor, full variety -> still Weak (length dominates).
    expect(estimatePasswordStrength("ab1!").label).toBe("Weak");
    expect(estimatePasswordStrength("aB3$").score).toBeLessThanOrEqual(1);
  });

  it("8 chars, no variety -> Weak; 8 chars with variety -> Fair", () => {
    expect(estimatePasswordStrength("aaaaaaaa").label).toBe("Weak");
    expect(estimatePasswordStrength("Abcd123!").label).toBe("Fair");
  });

  it("12 chars with variety -> Good", () => {
    expect(estimatePasswordStrength("Abcd1234!xyz").label).toBe("Good");
  });

  it("16+ chars with variety -> Strong (max)", () => {
    const r = estimatePasswordStrength("Abcd1234!xyzWXYZ");
    expect(r.label).toBe("Strong");
    expect(r.score).toBe(4);
  });

  it("a long passphrase (length alone) reads strong even without symbols", () => {
    // length 8/12/16 tiers = 3 points; one extra class pair keeps it honest.
    expect(estimatePasswordStrength("correcthorsebatterystaple").score).toBe(3);
  });
});
