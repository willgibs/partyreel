import { describe, expect, it } from "vitest";

import { albumPageHref, parseAlbumCursor } from "@/lib/moderation/album-pages";

const EVENT = "e0000000-0000-4000-8000-000000000001";
const ID = "a0000000-0000-4000-8000-000000000123";
const AT = "2026-09-23T12:00:00.123456+00:00";

describe("parseAlbumCursor", () => {
  it("reads a page's cursor: the raw timestamp and the id", () => {
    expect(parseAlbumCursor({ at: AT, id: ID })).toEqual({ at: AT, id: ID });
    expect(parseAlbumCursor({ at: "2026-09-23T12:00:00Z", id: ID })).toEqual({
      at: "2026-09-23T12:00:00Z",
      id: ID,
    });
  });

  it("reads the newest page from no cursor, half of one, or a repeated one", () => {
    expect(parseAlbumCursor(undefined)).toBeNull();
    expect(parseAlbumCursor({})).toBeNull();
    expect(parseAlbumCursor({ at: AT })).toBeNull();
    expect(parseAlbumCursor({ id: ID })).toBeNull();
    expect(parseAlbumCursor({ at: [AT, AT], id: ID })).toBeNull();
  });

  it("★ never lets anything but a timestamp and an id reach the read's filter", () => {
    for (const at of [
      "2026-09-23",
      "yesterday",
      `${AT},id.gt.0`,
      `${AT})`,
      "2026-09-23T12:00:00.1234567+00:00",
    ]) {
      expect(parseAlbumCursor({ at, id: ID }), at).toBeNull();
    }
    for (const id of ["not-a-uuid", `${ID},x`, "'"]) {
      expect(parseAlbumCursor({ at: AT, id }), id).toBeNull();
    }
  });
});

describe("albumPageHref", () => {
  it("is the album's own address for the newest page", () => {
    expect(albumPageHref(EVENT, null)).toBe(`/admin/albums/${EVENT}`);
  });

  it("carries an older page's cursor, the timestamp's + encoded, and reads back whole", () => {
    const href = albumPageHref(EVENT, { at: AT, id: ID });
    expect(href).toContain("%2B00%3A00");
    const url = new URL(href, "https://admin.partyreel.com");
    expect(url.pathname).toBe(`/admin/albums/${EVENT}`);
    expect(
      parseAlbumCursor(Object.fromEntries(url.searchParams.entries())),
    ).toEqual({ at: AT, id: ID });
  });
});
