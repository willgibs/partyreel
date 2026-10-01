import { describe, expect, it } from "vitest";

import {
  ALBUM_STATUSES,
  albumPageHref,
  albumStatusLabel,
  parseAlbumCursor,
  parseAlbumStatus,
} from "@/lib/moderation/album-pages";
import { ALBUM_FILTER_META } from "@/lib/moderation/operator-actions";

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

  it("★ keeps a status filter on every page of it, and reads back whole", () => {
    expect(albumPageHref(EVENT, null, "removed")).toBe(
      `/admin/albums/${EVENT}?status=removed`,
    );
    const url = new URL(
      albumPageHref(EVENT, { at: AT, id: ID }, "pending"),
      "https://admin.partyreel.com",
    );
    const params = Object.fromEntries(url.searchParams.entries());
    expect(parseAlbumStatus(params)).toBe("pending");
    expect(parseAlbumCursor(params)).toEqual({ at: AT, id: ID });
  });
});

/**
 * ★ THE DRILL-IN'S STATUS FILTER (crumbs-41, a board idea from crumbs-37): the Albums feed's own four words over one
 * album, and All for every status, removed included, as the drill-in always drew (the feed's Active leaves the removed
 * out, a different question, so it is never the drill-in's word).
 */
describe("parseAlbumStatus", () => {
  it("reads the feed's four statuses, in the feed's order and words", () => {
    expect(ALBUM_STATUSES).toEqual([
      "pending",
      "approved",
      "hidden",
      "removed",
    ]);
    for (const status of ALBUM_STATUSES) {
      expect(parseAlbumStatus({ status })).toBe(status);
      expect(albumStatusLabel(status)).toBe(ALBUM_FILTER_META[status].label);
    }
    expect(albumStatusLabel(null)).toBe("All");
  });

  it("★ reads anything else as every status: only the four words ever reach the read's filter", () => {
    for (const status of [
      undefined,
      "",
      "all",
      "Removed",
      "removed,approved",
      "deleted",
      ["removed", "pending"],
    ]) {
      expect(parseAlbumStatus({ status }), String(status)).toBeNull();
    }
    expect(parseAlbumStatus(undefined)).toBeNull();
  });
});
