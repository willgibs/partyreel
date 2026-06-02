import { describe, expect, it } from "vitest";

import {
  MIN_PASSWORD_LENGTH,
  changePasswordSchema,
  passwordField,
  setPasswordSchema,
  signInSchema,
} from "@/lib/validation/auth";

describe("auth validation", () => {
  it("pins MIN_PASSWORD_LENGTH to the Supabase dashboard setting (8)", () => {
    // Hand-synced pair: this MUST equal the Supabase "Minimum password length"
    // dashboard setting (Authentication → Sign In / Providers → Email). If you change
    // one, change the other.
    expect(MIN_PASSWORD_LENGTH).toBe(8);
  });

  describe("passwordField (create / set / change)", () => {
    it("rejects shorter than the minimum", () => {
      expect(passwordField.safeParse("Short1").success).toBe(false);
    });

    it("accepts exactly the minimum length", () => {
      expect(
        passwordField.safeParse("a".repeat(MIN_PASSWORD_LENGTH)).success,
      ).toBe(true);
    });

    it("accepts 72 chars but rejects 73 (bcrypt 72-byte truncation guard)", () => {
      expect(passwordField.safeParse("a".repeat(72)).success).toBe(true);
      expect(passwordField.safeParse("a".repeat(73)).success).toBe(false);
    });
  });

  describe("signInSchema", () => {
    it("requires a valid email and any non-empty password", () => {
      expect(
        signInSchema.safeParse({ email: "a@b.com", password: "x" }).success,
      ).toBe(true);
      expect(
        signInSchema.safeParse({ email: "nope", password: "x" }).success,
      ).toBe(false);
      expect(
        signInSchema.safeParse({ email: "a@b.com", password: "" }).success,
      ).toBe(false);
    });

    it("does NOT impose the length rule on sign-in (short/legacy passwords still log in)", () => {
      // Regression guard: applying passwordField to the GATE would lock out anyone whose
      // password is shorter than the current minimum. Sign-in stays min(1).
      expect(
        signInSchema.safeParse({ email: "a@b.com", password: "abc" }).success,
      ).toBe(true);
    });
  });

  describe("confirm matching", () => {
    it("setPasswordSchema flags a mismatch on the confirm field", () => {
      const r = setPasswordSchema.safeParse({
        password: "a".repeat(8),
        confirm: "b".repeat(8),
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0]?.path).toEqual(["confirm"]);
      }
    });

    it("setPasswordSchema accepts a matching confirm", () => {
      expect(
        setPasswordSchema.safeParse({
          password: "a".repeat(8),
          confirm: "a".repeat(8),
        }).success,
      ).toBe(true);
    });

    it("changePasswordSchema requires currentPassword and a matching confirm", () => {
      // Missing current password.
      expect(
        changePasswordSchema.safeParse({
          currentPassword: "",
          password: "a".repeat(8),
          confirm: "a".repeat(8),
        }).success,
      ).toBe(false);
      // Happy path.
      expect(
        changePasswordSchema.safeParse({
          currentPassword: "old-password",
          password: "a".repeat(8),
          confirm: "a".repeat(8),
        }).success,
      ).toBe(true);
      // Confirm mismatch.
      expect(
        changePasswordSchema.safeParse({
          currentPassword: "old-password",
          password: "a".repeat(8),
          confirm: "x".repeat(8),
        }).success,
      ).toBe(false);
    });
  });
});
