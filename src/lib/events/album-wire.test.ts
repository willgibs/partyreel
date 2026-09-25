import { describe, expect, it } from "vitest";

import {
  compareEntries,
  cursorOf,
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  ENTRY_PREVIEW,
  ENTRY_REEL,
  ENTRY_VIDEO,
  isAlbumId,
  isAlbumVersion,
  isApprovedEntry,
  microsToTimestamp,
  parseCursor,
  timestampToMicros,
  toManifestEntry,
  type ManifestEntry,
} from "@/lib/events/album-wire";

describe("microsecond time: exact both ways", () => {
  it("reads PostgREST's timestamp to the microsecond", () => {
    // 2026-09-23T23:31:24Z is 1790206284 s.
    expect(timestampToMicros("2026-09-23T23:31:24.644108+00:00")).toBe(
      1790206284644108,
    );
  });

  it("reads every shape Postgres prints: space, short offset, trimmed or absent fraction, Z", () => {
    const want = 1790206284644100;
    expect(timestampToMicros("2026-09-23 23:31:24.6441+00")).toBe(want);
    expect(timestampToMicros("2026-09-23T23:31:24.6441Z")).toBe(want);
    expect(timestampToMicros("2026-09-24T01:31:24.6441+02:00")).toBe(want);
    expect(timestampToMicros("2026-09-23T18:01:24.6441-0530")).toBe(want);
    expect(timestampToMicros("2026-09-23T23:31:24+00:00")).toBe(
      1790206284000000,
    );
  });

  it("never rounds through a Date: two timestamps a microsecond apart stay a microsecond apart", () => {
    expect(
      timestampToMicros("2026-09-23T23:31:24.000002+00:00") -
        timestampToMicros("2026-09-23T23:31:24.000001+00:00"),
    ).toBe(1);
  });

  it("refuses anything that is not a timestamp", () => {
    for (const bad of ["", "yesterday", "2026-09-23", "2026-13-45T99:99:99Z"]) {
      expect(() => timestampToMicros(bad), bad).toThrow(RangeError);
    }
  });

  it("writes microseconds back as the six-digit UTC string a PostgREST filter takes", () => {
    expect(microsToTimestamp(1790206284644108)).toBe(
      "2026-09-23T23:31:24.644108Z",
    );
    expect(microsToTimestamp(1790206284000001)).toBe(
      "2026-09-23T23:31:24.000001Z",
    );
    const t = timestampToMicros("2026-09-23T23:31:24.644108+00:00");
    expect(timestampToMicros(microsToTimestamp(t))).toBe(t);
    expect(() => microsToTimestamp(1.5)).toThrow(RangeError);
  });
});

describe("a manifest entry", () => {
  const base = {
    id: "0f000000-0000-4000-8000-000000000001",
    type: "photo" as const,
    width: 4032,
    height: 3024,
    duration_seconds: null,
    has_preview: true,
    reel_eligible: true,
    created_at: "2026-09-23T23:31:24.644108+00:00",
  };

  it("is five numbers and an id for a photo: no key, no link, no status", () => {
    expect(toManifestEntry(base, "album")).toEqual([
      base.id,
      4032,
      3024,
      ENTRY_PREVIEW | ENTRY_REEL,
      1790206284644108,
    ]);
  });

  it("adds the duration, to the millisecond, for a video that has one", () => {
    expect(
      toManifestEntry(
        {
          ...base,
          type: "video",
          duration_seconds: 12.3456789,
          has_preview: false,
        },
        "album",
      ),
    ).toEqual([
      base.id,
      4032,
      3024,
      ENTRY_VIDEO | ENTRY_REEL,
      1790206284644108,
      12.346,
    ]);
  });

  it("reads an unmeasured upload as 0 by 0 (the grid's square) and a clip as not for the reel", () => {
    const e = toManifestEntry(
      { ...base, width: null, height: -3, reel_eligible: false },
      "album",
    );
    expect(e.slice(1, 4)).toEqual([0, 0, ENTRY_PREVIEW]);
  });

  it("an absent reel_eligible reads as eligible, like every reader of the column", () => {
    expect(
      toManifestEntry({ ...base, reel_eligible: null }, "album")[3] &
        ENTRY_REEL,
    ).toBe(ENTRY_REEL);
  });

  it("takes microseconds as they come from SQL, and the same entry from either read", () => {
    expect(
      toManifestEntry({ ...base, created_at: 1790206284644108 }, "album"),
    ).toEqual(toManifestEntry(base, "album"));
  });

  it("carries the status only in the host's scope", () => {
    expect(
      toManifestEntry({ ...base, status: "hidden" }, "host")[3] & ENTRY_HIDDEN,
    ).toBe(ENTRY_HIDDEN);
    expect(
      toManifestEntry({ ...base, status: "pending" }, "host")[3] &
        ENTRY_PENDING,
    ).toBe(ENTRY_PENDING);
    expect(
      toManifestEntry({ ...base, status: "hidden" }, "album")[3] &
        (ENTRY_HIDDEN | ENTRY_PENDING),
    ).toBe(0);
    expect(
      isApprovedEntry(toManifestEntry({ ...base, status: "hidden" }, "host")),
    ).toBe(false);
    expect(
      isApprovedEntry(toManifestEntry({ ...base, status: "approved" }, "host")),
    ).toBe(true);
  });
});

describe("the album's order: (t desc, id desc), the server's own", () => {
  const e = (id: string, t: number): ManifestEntry => [id, 1, 1, 0, t];
  const a = "0a000000-0000-4000-8000-000000000000";
  const b = "0b000000-0000-4000-8000-000000000000";

  it("newest first", () => {
    expect(compareEntries(e(a, 2), e(b, 1))).toBeLessThan(0);
    expect(compareEntries(e(a, 1), e(b, 2))).toBeGreaterThan(0);
  });

  it("a tie on the microsecond falls to the larger id first, as uuid bytes order in Postgres", () => {
    expect(compareEntries(e(b, 5), e(a, 5))).toBeLessThan(0);
    expect(compareEntries(e(a, 5), e(a, 5))).toBe(0);
  });

  it("compares an entry against a cursor the same way", () => {
    expect(compareEntries(e(a, 5), cursorOf(e(b, 5)))).toBeGreaterThan(0);
    expect(compareEntries(cursorOf(e(b, 5)), e(a, 5))).toBeLessThan(0);
  });
});

describe("what the routes accept off the wire", () => {
  it("an id is a lowercase canonical uuid", () => {
    expect(isAlbumId("0f000000-0000-4000-8000-000000000001")).toBe(true);
    expect(isAlbumId("0F000000-0000-4000-8000-000000000001")).toBe(false);
    expect(isAlbumId("events/x")).toBe(false);
    expect(isAlbumId(42)).toBe(false);
  });

  it("a cursor is [safe integer, id]", () => {
    const id = "0f000000-0000-4000-8000-000000000001";
    expect(parseCursor([1790206284644108, id])).toEqual([1790206284644108, id]);
    expect(parseCursor([1.5, id])).toBeNull();
    expect(parseCursor([1, "nope"])).toBeNull();
    expect(parseCursor({ t: 1, id })).toBeNull();
    expect(parseCursor([1, id, 3])).toBeNull();
  });

  it("a version is a whole number from zero", () => {
    expect(isAlbumVersion(0)).toBe(true);
    expect(isAlbumVersion(12)).toBe(true);
    expect(isAlbumVersion(-1)).toBe(false);
    expect(isAlbumVersion(1.5)).toBe(false);
    expect(isAlbumVersion("3")).toBe(false);
  });
});
