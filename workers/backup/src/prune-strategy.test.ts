import { describe, expect, it } from "vitest";

import {
  PRUNE_DELETE_CAP_PER_RUN,
  PRUNE_LOCK_MIN_AGE_MS,
  isPrunableAge,
  isRecognizedMediaKey,
  parseMediaIdFromKey,
  shouldDelete,
} from "./prune-strategy";

const NOW = Date.UTC(2026, 5, 7); // fixed reference instant (no Date.now() in tests)

describe("isPrunableAge", () => {
  it("is false for an object younger than the lock + margin window", () => {
    const justInside = new Date(NOW - (PRUNE_LOCK_MIN_AGE_MS - 1));
    expect(isPrunableAge(justInside, NOW)).toBe(false);
  });
  it("is true at or beyond the lock + margin window", () => {
    const atBoundary = new Date(NOW - PRUNE_LOCK_MIN_AGE_MS);
    const wellPast = new Date(NOW - PRUNE_LOCK_MIN_AGE_MS - 86_400_000);
    expect(isPrunableAge(atBoundary, NOW)).toBe(true);
    expect(isPrunableAge(wellPast, NOW)).toBe(true);
  });
  it("is false for a future-dated object (clock skew)", () => {
    expect(isPrunableAge(new Date(NOW + 86_400_000), NOW)).toBe(false);
  });
  it("uses a 36-day window (one day past the 35-day Bucket Lock)", () => {
    expect(PRUNE_LOCK_MIN_AGE_MS).toBe(36 * 24 * 60 * 60 * 1000);
  });
});

describe("parseMediaIdFromKey / isRecognizedMediaKey", () => {
  const uuid = "11111111-2222-4333-8444-555555555555";

  it("recognizes our event-media layout and returns the mediaId", () => {
    const valid = `events/${uuid}/photo/${uuid}/original.jpg`;
    expect(parseMediaIdFromKey(valid)).toBe(uuid);
    expect(isRecognizedMediaKey(valid)).toBe(true);
  });

  it("rejects keys that are not our layout (never delete the unrecognized)", () => {
    expect(parseMediaIdFromKey("avatars/user-1/avatar.webp")).toBeNull();
    expect(
      parseMediaIdFromKey(`events/${uuid}/photo/not-a-uuid/original.jpg`),
    ).toBeNull();
    expect(parseMediaIdFromKey(`events/${uuid}/photo/${uuid}`)).toBeNull(); // 4 segments
    expect(
      parseMediaIdFromKey(`other/${uuid}/photo/${uuid}/original.jpg`),
    ).toBeNull();
    expect(isRecognizedMediaKey("avatars/user-1/avatar.webp")).toBe(false);
  });
});

describe("shouldDelete", () => {
  it("only deletes in live mode (default-safe)", () => {
    expect(shouldDelete("live")).toBe(true);
    expect(shouldDelete("dryrun")).toBe(false);
    expect(shouldDelete(undefined)).toBe(false);
    expect(shouldDelete("")).toBe(false);
    expect(shouldDelete("LIVE")).toBe(false); // exact match only
  });
});

describe("PRUNE_DELETE_CAP_PER_RUN", () => {
  it("is a positive per-run delete cap", () => {
    expect(PRUNE_DELETE_CAP_PER_RUN).toBeGreaterThan(0);
  });
});
