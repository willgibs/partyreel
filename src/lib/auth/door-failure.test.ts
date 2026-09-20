// @contract-for: src/lib/auth/door-failure.ts
import { describe, expect, it } from "vitest";

import {
  DOOR_FAILURE_KINDS,
  doorFailure,
  doorFailureKind,
  isRateLimited,
  retryAfterSeconds,
} from "@/lib/auth/door-failure";

/**
 * THE DOOR'S FAILURE TABLE (`failure=paths`, Will 2026-09-20).
 *
 * What is pinned here is FUNCTION, never look or wording: every kind offers
 * three ways out (the whole point of the ruling was that prose pointing at
 * affordances somewhere else was not enough), a `?error=` resolves to a kind
 * rather than being guessed at, and the two spellings still arriving from
 * elsewhere resolve rather than reading as "nothing happened".
 *
 * ★ AND THE ENUMERATION LINE IS PINNED AS FUNCTION, because it is one. The
 * password refusal must never name which of three things went wrong: a line
 * that says "wrong password", "no account" or "no password set" is an oracle
 * anyone can query for whether an address has a Partyreel account
 * (auth-accounts.md). A future edit that made it specific turns this red.
 */

describe("every failure names three ways out", () => {
  it("gives each kind a line and exactly three actions", () => {
    for (const kind of DOOR_FAILURE_KINDS) {
      const failure = doorFailure(kind);
      expect(failure.line.length, kind).toBeGreaterThan(0);
      expect(failure.actions, kind).toHaveLength(3);
      for (const action of failure.actions) {
        expect(action.label.length, `${kind}/${action.id}`).toBeGreaterThan(0);
      }
    }
  });

  it("never offers the same way out twice in one failure", () => {
    for (const kind of DOOR_FAILURE_KINDS) {
      const ids = doorFailure(kind).actions.map((a) => a.id);
      expect(new Set(ids).size, kind).toBe(3);
    }
  });

  it("keeps the password refusal generic", () => {
    const line = doorFailure("password_mismatch").line.toLowerCase();
    // Any of these would tell a stranger which of the three cases they hit.
    for (const leak of [
      "wrong password",
      "incorrect password",
      "no account",
      "not found",
      "no password",
      "unknown email",
    ]) {
      expect(line, leak).not.toContain(leak);
    }
  });
});

describe("the limiter's countdown", () => {
  it("counts in its label and stays unpressable", () => {
    const [wait] = doorFailure("rate_limited", 41).actions;
    expect(wait.id).toBe("wait");
    expect(wait.waiting).toBe(true);
    expect(wait.label).toContain("41");
  });

  it("falls back to a plain label when nobody named the seconds", () => {
    const [wait] = doorFailure("rate_limited").actions;
    expect(wait.waiting).toBe(true);
    expect(wait.label).not.toContain("0s");
  });

  it("only the limiter takes a countdown", () => {
    for (const action of doorFailure("wrong_code", 30).actions) {
      expect(action.waiting).toBeUndefined();
      expect(action.label).not.toContain("30");
    }
  });
});

describe("what a ?error= means", () => {
  it("passes every kind through by name", () => {
    for (const kind of DOOR_FAILURE_KINDS) {
      expect(doorFailureKind(kind)).toBe(kind);
    }
  });

  it("still understands the flag already sitting in mailboxes", () => {
    // Every magic-link email sent before this round bounces back with the old
    // spelling; it must land on the expired-link door, not on silence.
    expect(doorFailureKind("auth_callback")).toBe("expired_link");
  });

  it("maps Supabase's own refusals", () => {
    expect(doorFailureKind("otp_expired")).toBe("expired_link");
    expect(doorFailureKind("access_denied")).toBe("google_failed");
    expect(doorFailureKind("server_error")).toBe("send_failed");
  });

  it("treats anything else as nothing, so a typed query paints no scare", () => {
    expect(doorFailureKind(null)).toBeNull();
    expect(doorFailureKind("")).toBeNull();
    expect(doorFailureKind("your-account-is-banned")).toBeNull();
  });
});

describe("reading GoTrue's refusal", () => {
  it("reads a 429 as the limiter", () => {
    expect(isRateLimited({ status: 429 })).toBe(true);
    expect(isRateLimited({ code: "over_email_send_rate_limit" })).toBe(true);
    expect(
      isRateLimited({
        message: "For security purposes, you can only request this after 41 seconds.",
      }),
    ).toBe(true);
  });

  it("reads an ordinary failure as an ordinary failure", () => {
    expect(isRateLimited({ status: 500, message: "boom" })).toBe(false);
  });

  it("takes the seconds GoTrue names, and nothing else", () => {
    expect(
      retryAfterSeconds(
        "For security purposes, you can only request this after 41 seconds.",
      ),
    ).toBe(41);
    expect(retryAfterSeconds("Email rate limit exceeded")).toBeNull();
    expect(retryAfterSeconds(undefined)).toBeNull();
  });
});
