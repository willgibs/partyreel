import { describe, expect, it, vi } from "vitest";

import {
  changeToEntry,
  parseAlbumRead,
  planAlbumSync,
  scopeTotal,
  scopeVersion,
  type AlbumChange,
  type AlbumRead,
} from "@/lib/events/album-sync";
import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  ENTRY_REEL,
} from "@/lib/events/album-wire";

const M = "00000000-0000-4000-8000-000000000001";

function change(over: Partial<AlbumChange> = {}): AlbumChange {
  return {
    mediaId: M,
    version: 7,
    status: "approved",
    type: "photo",
    width: 4,
    height: 3,
    durationSeconds: null,
    hasPreview: false,
    reelEligible: true,
    createdAt: 1790206284644108,
    guestId: null,
    ...over,
  };
}

function read(over: Partial<AlbumRead> = {}): AlbumRead {
  return {
    version: 9,
    albumMax: 7,
    attrVersion: 1,
    approved: 3,
    hidden: null,
    pending: null,
    changes: [],
    ...over,
  };
}

describe("parseAlbumRead: album_changes_since's jsonb, defensively", () => {
  it("reads the versions, the counts and each change", () => {
    const r = parseAlbumRead({
      version: 9,
      album_max: 7,
      attr_version: 1,
      approved: 3,
      hidden: null,
      pending: null,
      changes: [
        [
          M,
          7,
          "hidden",
          "video",
          4,
          3,
          12.5,
          true,
          false,
          1790206284644108,
          null,
        ],
      ],
    });
    expect(r).toMatchObject({
      version: 9,
      albumMax: 7,
      attrVersion: 1,
      approved: 3,
      hidden: null,
    });
    expect(r.changes[0]).toEqual(
      change({
        status: "hidden",
        type: "video",
        durationSeconds: 12.5,
        hasPreview: true,
        reelEligible: false,
      }),
    );
  });

  it("a purged item reads as gone (every field null)", () => {
    const r = parseAlbumRead({
      changes: [[M, 3, null, null, null, null, null, false, null, null, null]],
    });
    expect(r.changes[0]).toMatchObject({
      status: null,
      type: null,
      createdAt: null,
    });
  });

  it("throws on a malformed answer rather than dropping an id", () => {
    expect(() => parseAlbumRead(null)).toThrow();
    expect(() => parseAlbumRead([])).toThrow();
    expect(() => parseAlbumRead({ changes: [[42]] })).toThrow();
  });
});

describe("a change as the client applies it", () => {
  it("a guest's album is the approved items: anything else, or a purged row, is a removal", () => {
    expect(changeToEntry(change(), "album")).toEqual([
      M,
      4,
      3,
      ENTRY_REEL,
      1790206284644108,
    ]);
    for (const status of ["pending", "hidden", "removed", null] as const) {
      expect(changeToEntry(change({ status }), "album")).toBeNull();
    }
  });

  it("the host's album is everything but the bin, the status in the flags", () => {
    expect(
      changeToEntry(change({ status: "hidden" }), "host")![3] & ENTRY_HIDDEN,
    ).toBe(ENTRY_HIDDEN);
    expect(
      changeToEntry(change({ status: "pending" }), "host")![3] & ENTRY_PENDING,
    ).toBe(ENTRY_PENDING);
    expect(changeToEntry(change({ status: "removed" }), "host")).toBeNull();
  });

  it("each scope counts its own album and reads its own version", () => {
    const r = read({ approved: 3, hidden: 2, pending: 1 });
    expect(scopeTotal(r, "album")).toBe(3);
    expect(scopeTotal(r, "host")).toBe(6);
    expect(scopeVersion(r, "album")).toBe(7);
    expect(scopeVersion(r, "host")).toBe(9);
  });
});

describe("planAlbumSync: what a client holding `since` is sent", () => {
  const page = vi.fn(async () => ({ entries: [], next: null }));

  it("no version: the state is read FIRST (limit 0), then the first page", async () => {
    const order: string[] = [];
    const plan = await planAlbumSync({
      scope: "album",
      since: null,
      read: async (after, limit) => {
        order.push(`read ${after} ${limit}`);
        return read();
      },
      page: async () => {
        order.push("page");
        return { entries: [], next: null };
      },
    });
    expect(order).toEqual(["read 0 0", "page"]);
    expect(plan.part).toMatchObject({ kind: "manifest", v: 7, attr: 1 });
  });

  it("a version: the delta since it, asked with one more than the threshold", async () => {
    const r = vi.fn(async () =>
      read({ changes: [change(), change({ mediaId: "x", status: "hidden" })] }),
    );
    const plan = await planAlbumSync({
      scope: "album",
      since: 5,
      read: r,
      page,
      resyncAfter: 3,
    });
    expect(r).toHaveBeenCalledWith(5, 4);
    expect(plan.part).toMatchObject({
      kind: "delta",
      v: 7,
      upsert: [[M, 4, 3, ENTRY_REEL, 1790206284644108]],
      remove: ["x"],
    });
    expect(page).not.toHaveBeenCalled();
  });

  it("more changes than the threshold: a fresh manifest, versioned by the delta's own snapshot", async () => {
    const r = vi.fn(async () =>
      read({ changes: [change(), change(), change(), change()] }),
    );
    const plan = await planAlbumSync({
      scope: "album",
      since: 1,
      read: r,
      page,
      resyncAfter: 3,
    });
    expect(plan.part).toMatchObject({ kind: "manifest", v: 7 });
    expect(r).toHaveBeenCalledTimes(1);
  });

  it("a version above the server's: a fresh manifest", async () => {
    const plan = await planAlbumSync({
      scope: "host",
      since: 50,
      read: async () => read(),
      page,
    });
    expect(plan.part).toMatchObject({ kind: "manifest", v: 9 });
  });
});
