/**
 * THE OPERATOR'S ALBUM DRILL-IN, ITS COUNTS COUNTED (the 1,000-row round, Will 2026-09-23), A PAGE AT A TIME
 * (crumbs-37).
 *
 * The drill-in read the album's media in one request and counted the statuses off that list, so past
 * PostgREST's 1,000 rows it showed a thousand items and said "1000 approved" of a 1,500-item album. Then it
 * read the album whole, and the page presigned every item. Against `fake-postgrest` (every read clamped at
 * 1,000), with a 2,500-item album: one page of `ALBUM_DRILL_IN_PAGE`, and the pages walked by their cursors
 * hold every item once, newest first through timestamp ties; each status is a HEAD count, and so is where a
 * page sits.
 */
import { describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));

let fake: FakePostgrest;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const { getAlbumForModeration } = await import("@/lib/db/queries/moderation");
const { ALBUM_DRILL_IN_PAGE } = await import("@/lib/moderation/album-pages");

const EVENT = "e0000000-0000-4000-8000-000000000001";
const uuid = (i: number) =>
  `m0000000-0000-4000-8000-${String(i).padStart(12, "0")}`;

const STATUSES = ["approved", "pending", "hidden", "removed"] as const;

function album(n: number): FakeRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: uuid(i),
    event_id: EVENT,
    type: i % 9 === 0 ? "video" : "photo",
    // 1,300 approved, then 700 pending, 300 hidden and 200 removed.
    status:
      i < 1300
        ? STATUSES[0]
        : i < 2000
          ? STATUSES[1]
          : i < 2300
            ? STATUSES[2]
            : STATUSES[3],
    // Every five items share a timestamp, so ties straddle the page boundaries.
    created_at: new Date(
      Date.parse("2026-09-23T12:00:00.000Z") - Math.floor(i / 5) * 1000,
    )
      .toISOString()
      .replace("Z", "000+00:00"),
    original_key: `k-${i}`,
  }));
}

describe("getAlbumForModeration", () => {
  // ★ RESHAPED ON PURPOSE (crumbs-37; scar kept: every item once, newest first through timestamp ties, past the
  // 1,000-row cap, and every status a HEAD count). The expired reason: "whole" meant one read of every item, and
  // the page then signed every one; the album is now read a page at a time, and the pages together are whole.
  it("★ reads ONE page of a 2,500-item album, and its cursors walk the album whole: every item once, newest first", async () => {
    const media = album(2500);
    fake = createFakePostgrest({
      tables: {
        events: [
          { id: EVENT, host_id: "host-1", name: "Big one", deleted_at: null },
        ],
        media: [
          ...media,
          { ...album(1)[0], id: uuid(99_999), event_id: "another-event" },
        ],
        profiles: [
          { id: "host-1", email: "host@example.com", display_name: "Maya" },
        ],
      },
    });

    const first = await getAlbumForModeration(EVENT);
    expect(first?.media).toHaveLength(ALBUM_DRILL_IN_PAGE);
    expect(first?.position).toBe(0);
    expect(first?.next).not.toBeNull();
    expect(first?.counts).toEqual({
      pending: 700,
      approved: 1300,
      hidden: 300,
      removed: 200,
    });
    expect(first?.hostLabel).toBe("Maya");
    // The newest page asks four HEAD counts and nothing about where it sits.
    expect(fake.requests.filter((r) => r.method === "HEAD")).toHaveLength(4);

    // The Older links, followed to the end.
    const walked = [...(first?.media ?? [])];
    const positions = [first?.position];
    let next = first?.next ?? null;
    while (next) {
      const page = await getAlbumForModeration(EVENT, next.at, next.id);
      positions.push(page?.position);
      walked.push(...(page?.media ?? []));
      next = page?.next ?? null;
    }
    expect(positions).toEqual([0, 500, 1000, 1500, 2000]);

    // Newest first, the id breaking each tie downward.
    const displayOrder = [...media]
      .sort((a, b) =>
        a.created_at === b.created_at
          ? String(b.id).localeCompare(String(a.id))
          : String(b.created_at).localeCompare(String(a.created_at)),
      )
      .map((m) => m.id);
    expect(walked.map((m) => m.id)).toEqual(displayOrder);
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });

  it("the oldest page names no older one; a page past the end holds nothing and says where it is", async () => {
    const media = album(2500);
    fake = createFakePostgrest({
      tables: {
        events: [
          { id: EVENT, host_id: "host-1", name: "Big one", deleted_at: null },
        ],
        media,
        profiles: [],
      },
    });
    const oldest = [...media].sort((a, b) =>
      a.created_at === b.created_at
        ? String(a.id).localeCompare(String(b.id))
        : String(a.created_at).localeCompare(String(b.created_at)),
    );
    // A cursor on the 501st-oldest item leaves exactly 500 older: the last page, and it says so.
    const at = oldest[500];
    const last = await getAlbumForModeration(
      EVENT,
      String(at.created_at),
      String(at.id),
    );
    expect(last?.media).toHaveLength(500);
    expect(last?.next).toBeNull();
    expect(last?.position).toBe(2000);
    // A cursor on the oldest item: nothing older, every item before this page.
    const past = await getAlbumForModeration(
      EVENT,
      String(oldest[0].created_at),
      String(oldest[0].id),
    );
    expect(past?.media).toEqual([]);
    expect(past?.next).toBeNull();
    expect(past?.position).toBe(2500);
  });

  // ★ ONE STATUS AT A TIME (crumbs-41, a board idea from crumbs-37): the album's 200 removed items are its oldest, so
  // unfiltered they sit four pages deep; narrowed, they are the first page, and every status pages the same keyset.
  it("★ narrows to one status, its oldest items on its first page, and pages it whole; the counts stay the album's", async () => {
    const media = album(2500);
    fake = createFakePostgrest({
      tables: {
        events: [
          { id: EVENT, host_id: "host-1", name: "Big one", deleted_at: null },
        ],
        media,
        profiles: [],
      },
    });
    const inDisplayOrder = (status: string) =>
      [...media]
        .filter((m) => m.status === status)
        .sort((a, b) =>
          a.created_at === b.created_at
            ? String(b.id).localeCompare(String(a.id))
            : String(b.created_at).localeCompare(String(a.created_at)),
        )
        .map((m) => m.id);

    const removed = await getAlbumForModeration(EVENT, null, null, "removed");
    expect(removed?.media.map((m) => m.id)).toEqual(inDisplayOrder("removed"));
    expect(removed?.media.every((m) => m.status === "removed")).toBe(true);
    expect(removed?.next).toBeNull();
    expect(removed?.counts).toEqual({
      pending: 700,
      approved: 1300,
      hidden: 300,
      removed: 200,
    });

    // The commonest status pages across several, every item once, each page's place counted within the status.
    const walked: string[] = [];
    const positions: number[] = [];
    let page = await getAlbumForModeration(EVENT, null, null, "approved");
    for (;;) {
      positions.push(page?.position ?? -1);
      walked.push(...(page?.media ?? []).map((m) => m.id));
      if (!page?.next) break;
      page = await getAlbumForModeration(
        EVENT,
        page.next.at,
        page.next.id,
        "approved",
      );
    }
    expect(positions).toEqual([0, 500, 1000]);
    expect(walked).toEqual(inDisplayOrder("approved"));
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });

  it("null for a deleted or missing album, and nothing else is read", async () => {
    fake = createFakePostgrest({ tables: { events: [], media: album(3) } });
    await expect(getAlbumForModeration(EVENT)).resolves.toBeNull();
    expect(fake.requests).toHaveLength(1);
  });

  it("throws when a count fails, never a confident zero", async () => {
    fake = createFakePostgrest({
      tables: {
        events: [{ id: EVENT, host_id: "host-1", name: "x", deleted_at: null }],
        profiles: [],
      },
    });
    await expect(getAlbumForModeration(EVENT)).rejects.toThrow(/admin album/);
  });
});
