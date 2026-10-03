import { describe, expect, it } from "vitest";

import {
  accountDeletingLine,
  isBannedRedirect,
  isUserBanned,
} from "@/app/(auth)/account-deleting";

/**
 * A SIGN-IN THAT MEETS A DELETION'S BAN (lp/account-exit): GoTrue's `user_banned`, as each door
 * meets it, and the words. Pinned as GoTrue states it (its source, v2.197): the verify answers
 * `AuthApiError("User is banned", 403, "user_banned")` through auth-js, and a link or Google
 * redirect carries `error_code=user_banned` with `error_description=User is banned`.
 */

describe("recognising the ban", () => {
  it("★ reads GoTrue's code", () => {
    expect(
      isUserBanned({ code: "user_banned", message: "User is banned" }),
    ).toBe(true);
    expect(isUserBanned({ code: "user_banned" })).toBe(true);
  });

  it("reads the message only when no code came", () => {
    expect(isUserBanned({ message: "User is banned" })).toBe(true);
    // A code says what it is, whatever the message says.
    expect(
      isUserBanned({ code: "otp_expired", message: "User is banned" }),
    ).toBe(false);
  });

  it("is no other refusal", () => {
    for (const code of [
      "otp_expired",
      "invalid_credentials",
      "over_email_send_rate_limit",
      "signup_disabled",
    ]) {
      expect(isUserBanned({ code, message: "Token has expired" }), code).toBe(
        false,
      );
    }
    expect(isUserBanned({ message: "Token has expired or is invalid" })).toBe(
      false,
    );
    expect(isUserBanned(null)).toBe(false);
    expect(isUserBanned(undefined)).toBe(false);
  });

  it("reads a callback's query the same way", () => {
    expect(
      isBannedRedirect(
        new URLSearchParams(
          "error=access_denied&error_code=user_banned&error_description=User+is+banned",
        ),
      ),
    ).toBe(true);
    expect(
      isBannedRedirect(
        new URLSearchParams("error=access_denied&error_code=signup_disabled"),
      ),
    ).toBe(false);
    expect(isBannedRedirect(new URLSearchParams("error=access_denied"))).toBe(
      false,
    );
  });
});

describe("the words", () => {
  const TIME = "1:00\u00a0AM tomorrow";

  it("★ where GoTrue answered this browser, names the address and the time it can start fresh", () => {
    const line = accountDeletingLine(TIME, "maya@example.com");
    expect(line).toContain("maya@example.com");
    expect(line).toContain("still being erased");
    expect(line).toContain(`start fresh with this email after ${TIME}`);
  });

  it("★ where a URL brought her (/login), is conditional: it asserts nothing about any account", () => {
    const line = accountDeletingLine(TIME);
    expect(line).toMatch(/^If you deleted your account,/);
    expect(line).toContain(`after ${TIME}`);
    // No address, and no claim a forged link could aim at an account that is fine.
    expect(line).not.toMatch(/@/);
    expect(line).not.toMatch(/^Your account/);
  });

  it("never names a hold, a ban or a review: the one way out beside it is a contact line", () => {
    for (const line of [
      accountDeletingLine(TIME, "maya@example.com"),
      accountDeletingLine(TIME),
    ]) {
      expect(line).not.toMatch(/hold|held|ban|review|investigat|legal/i);
    }
  });
});
