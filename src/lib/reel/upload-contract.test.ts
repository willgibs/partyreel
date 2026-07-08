import { describe, expect, it } from "vitest";

import { reelUploadBodySchema } from "./upload-contract";

const EVENT_ID = "2485e1e6-12b1-4d02-aee3-1e2bb5d38d4f";
const HASH = "a".repeat(64);

describe("reelUploadBodySchema (the /api/reel/upload wire contract)", () => {
  it("accepts each phase's valid shape", () => {
    expect(
      reelUploadBodySchema.safeParse({ phase: "begin", event_id: EVENT_ID })
        .success,
    ).toBe(true);
    expect(
      reelUploadBodySchema.safeParse({
        phase: "mint",
        event_id: EVENT_ID,
        hash: HASH,
        size_bytes: 19_000_000,
      }).success,
    ).toBe(true);
    expect(
      reelUploadBodySchema.safeParse({
        phase: "finalize",
        event_id: EVENT_ID,
        hash: HASH,
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown phase and a missing phase", () => {
    expect(
      reelUploadBodySchema.safeParse({ phase: "steal", event_id: EVENT_ID })
        .success,
    ).toBe(false);
    expect(reelUploadBodySchema.safeParse({ event_id: EVENT_ID }).success).toBe(
      false,
    );
  });

  it("rejects a non-uuid event id", () => {
    expect(
      reelUploadBodySchema.safeParse({ phase: "begin", event_id: "nope" })
        .success,
    ).toBe(false);
  });

  it("rejects a malformed hash (mint + finalize both)", () => {
    for (const hash of ["", "xyz", "A".repeat(64), "a".repeat(63)]) {
      expect(
        reelUploadBodySchema.safeParse({
          phase: "mint",
          event_id: EVENT_ID,
          hash,
          size_bytes: 1,
        }).success,
      ).toBe(false);
      expect(
        reelUploadBodySchema.safeParse({
          phase: "finalize",
          event_id: EVENT_ID,
          hash,
        }).success,
      ).toBe(false);
    }
  });

  it("rejects non-positive, fractional, and stringy sizes at mint", () => {
    for (const size_bytes of [0, -1, 1.5, "19000000", null]) {
      expect(
        reelUploadBodySchema.safeParse({
          phase: "mint",
          event_id: EVENT_ID,
          hash: HASH,
          size_bytes,
        }).success,
      ).toBe(false);
    }
  });

  it("mint requires size_bytes; begin tolerates extras being absent", () => {
    expect(
      reelUploadBodySchema.safeParse({
        phase: "mint",
        event_id: EVENT_ID,
        hash: HASH,
      }).success,
    ).toBe(false);
  });
});
