import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  signUnlockToken,
  unlockCookieName,
  verifyUnlockToken,
} from "@/lib/events/unlock-token";

// (Reshaped when the token was bound to the password version: every call names its claim, the
// event AND the password state, where it used to name the event alone. Each case below keeps its
// original meaning; the version cases after them are new.)

const SECRET = "test-unlock-secret-please-rotate";
const EVENT = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";
const NOW = 1_700_000_000_000; // fixed ms so the tests are deterministic
const V1 = "a".repeat(64); // a password version, as unlock-cookie.ts derives one
const V2 = "b".repeat(64); // the same event after its password changed

const claim = { eventId: EVENT, passwordVersion: V1 };

describe("unlock-token", () => {
  it("names the cookie per event", () => {
    expect(unlockCookieName(EVENT)).toBe(`pr_unlock_${EVENT}`);
  });

  it("round-trips a freshly signed token", () => {
    const token = signUnlockToken(SECRET, claim, NOW + 60_000);
    expect(verifyUnlockToken(SECRET, claim, token, NOW)).toBe(true);
  });

  it("rejects a tampered MAC", () => {
    const token = signUnlockToken(SECRET, claim, NOW + 60_000);
    const last = token.at(-1);
    const tampered = token.slice(0, -1) + (last === "a" ? "b" : "a");
    expect(verifyUnlockToken(SECRET, claim, tampered, NOW)).toBe(false);
  });

  it("rejects a token minted for a different event (no cross-event replay)", () => {
    const token = signUnlockToken(
      SECRET,
      { eventId: OTHER, passwordVersion: V1 },
      NOW + 60_000,
    );
    expect(verifyUnlockToken(SECRET, claim, token, NOW)).toBe(false);
  });

  it("rejects an expired token", () => {
    const token = signUnlockToken(SECRET, claim, NOW - 1);
    expect(verifyUnlockToken(SECRET, claim, token, NOW)).toBe(false);
  });

  it("rejects a forged exp extension (exp is inside the MAC)", () => {
    const token = signUnlockToken(SECRET, claim, NOW + 60_000);
    const [eid, , mac] = token.split(".");
    const forged = `${eid}.${NOW + 9_999_999}.${mac}`;
    expect(verifyUnlockToken(SECRET, claim, forged, NOW)).toBe(false);
  });

  it("fails closed on an empty secret, missing value, or malformed token", () => {
    const token = signUnlockToken(SECRET, claim, NOW + 60_000);
    expect(verifyUnlockToken("", claim, token, NOW)).toBe(false);
    expect(verifyUnlockToken(SECRET, claim, undefined, NOW)).toBe(false);
    expect(verifyUnlockToken(SECRET, claim, "not.a.valid.token", NOW)).toBe(
      false,
    );
    expect(verifyUnlockToken(SECRET, claim, "onlyonepart", NOW)).toBe(false);
  });

  it("rejects a token signed with a different secret", () => {
    const token = signUnlockToken("a-different-secret", claim, NOW + 60_000);
    expect(verifyUnlockToken(SECRET, claim, token, NOW)).toBe(false);
  });
});

/**
 * ★ A TOKEN ANSWERS TO THE PASSWORD IT WAS EARNED UNDER. The version rides inside the MAC and
 * nowhere in the cookie, so a changed password (a new version) refuses every outstanding token,
 * and the cookie still says nothing about the password state.
 */
describe("unlock-token: the password version", () => {
  it("★ refuses a token earned under the previous password", () => {
    const token = signUnlockToken(SECRET, claim, NOW + 60_000);
    expect(
      verifyUnlockToken(
        SECRET,
        { eventId: EVENT, passwordVersion: V2 },
        token,
        NOW,
      ),
    ).toBe(false);
  });

  it("★ refuses a token signed before the version existed (the {eid,exp} MAC)", () => {
    const exp = NOW + 60_000;
    const body = `${EVENT}.${exp}`;
    const legacy = `${body}.${createHmac("sha256", SECRET).update(body).digest("hex")}`;
    expect(verifyUnlockToken(SECRET, claim, legacy, NOW)).toBe(false);
  });

  it("carries the version nowhere in the cookie", () => {
    const token = signUnlockToken(SECRET, claim, NOW + 60_000);
    expect(token).not.toContain(V1);
    expect(token.split(".")).toHaveLength(3);
    // Two versions, same event and expiry: only the MAC differs.
    const other = signUnlockToken(
      SECRET,
      { eventId: EVENT, passwordVersion: V2 },
      NOW + 60_000,
    );
    expect(other.split(".").slice(0, 2)).toEqual(token.split(".").slice(0, 2));
    expect(other).not.toBe(token);
  });

  it("fails closed on an empty version, and refuses to mint under one", () => {
    const token = signUnlockToken(SECRET, claim, NOW + 60_000);
    expect(
      verifyUnlockToken(
        SECRET,
        { eventId: EVENT, passwordVersion: "" },
        token,
        NOW,
      ),
    ).toBe(false);
    expect(() =>
      signUnlockToken(
        SECRET,
        { eventId: EVENT, passwordVersion: "" },
        NOW + 60_000,
      ),
    ).toThrow(/password version/);
  });
});
