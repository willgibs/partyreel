import { describe, expect, it } from "vitest";

import {
  signUnlockToken,
  unlockCookieName,
  verifyUnlockToken,
} from "@/lib/events/unlock-token";

const SECRET = "test-unlock-secret-please-rotate";
const EVENT = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";
const NOW = 1_700_000_000_000; // fixed ms so the tests are deterministic

describe("unlock-token", () => {
  it("names the cookie per event", () => {
    expect(unlockCookieName(EVENT)).toBe(`pr_unlock_${EVENT}`);
  });

  it("round-trips a freshly signed token", () => {
    const token = signUnlockToken(SECRET, EVENT, NOW + 60_000);
    expect(verifyUnlockToken(SECRET, EVENT, token, NOW)).toBe(true);
  });

  it("rejects a tampered MAC", () => {
    const token = signUnlockToken(SECRET, EVENT, NOW + 60_000);
    const last = token.at(-1);
    const tampered = token.slice(0, -1) + (last === "a" ? "b" : "a");
    expect(verifyUnlockToken(SECRET, EVENT, tampered, NOW)).toBe(false);
  });

  it("rejects a token minted for a different event (no cross-event replay)", () => {
    const token = signUnlockToken(SECRET, OTHER, NOW + 60_000);
    expect(verifyUnlockToken(SECRET, EVENT, token, NOW)).toBe(false);
  });

  it("rejects an expired token", () => {
    const token = signUnlockToken(SECRET, EVENT, NOW - 1);
    expect(verifyUnlockToken(SECRET, EVENT, token, NOW)).toBe(false);
  });

  it("rejects a forged exp extension (exp is inside the MAC)", () => {
    const token = signUnlockToken(SECRET, EVENT, NOW + 60_000);
    const [eid, , mac] = token.split(".");
    const forged = `${eid}.${NOW + 9_999_999}.${mac}`;
    expect(verifyUnlockToken(SECRET, EVENT, forged, NOW)).toBe(false);
  });

  it("fails closed on an empty secret, missing value, or malformed token", () => {
    const token = signUnlockToken(SECRET, EVENT, NOW + 60_000);
    expect(verifyUnlockToken("", EVENT, token, NOW)).toBe(false);
    expect(verifyUnlockToken(SECRET, EVENT, undefined, NOW)).toBe(false);
    expect(verifyUnlockToken(SECRET, EVENT, "not.a.valid.token", NOW)).toBe(
      false,
    );
    expect(verifyUnlockToken(SECRET, EVENT, "onlyonepart", NOW)).toBe(false);
  });

  it("rejects a token signed with a different secret", () => {
    const token = signUnlockToken("a-different-secret", EVENT, NOW + 60_000);
    expect(verifyUnlockToken(SECRET, EVENT, token, NOW)).toBe(false);
  });
});
