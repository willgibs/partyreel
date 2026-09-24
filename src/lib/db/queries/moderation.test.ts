/**
 * THE OPERATOR'S ALBUM DRILL-IN IS WHOLE, ITS COUNTS COUNTED (the 1,000-row round, Will 2026-09-23).
 *
 * The drill-in read the album's media in one request and counted the statuses off that list, so past
 * PostgREST's 1,000 rows it showed a thousand items and said "1000 approved" of a 1,500-item album.
 * Against `fake-postgrest` (every read clamped at 1,000), with a 2,500-item album: every item comes
 * back once, newest first through timestamp ties, and each status is a HEAD count.
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
      i < 1300 ? STATUSES[0] : i < 2000 ? STATUSES[1] : i < 2300 ? STATUSES[2] : STATUSES[3],
    // Every five items share a timestamp, so ties straddle the page boundaries.
    created_at: new Date(Date.parse("2026-09-23T12:00:00.000Z") - Math.floor(i / 5) * 1000)
      .toISOString()
      .replace("Z", "000+00:00"),
    original_key: `k-${i}`,
  }));
}

describe("getAlbumForModeration", () => {
  it("★ reads a 2,500-item album whole, newest first, and counts every status", async () => {
    const media = album(2500);
    fake = createFakePostgrest({
      tables: {
        events: [{ id: EVENT, host_id: "host-1", name: "Big one", deleted_at: null }],
        media: [
          ...media,
          { ...album(1)[0], id: uuid(99_999), event_id: "another-event" },
        ],
        profiles: [{ id: "host-1", email: "host@example.com", display_name: "Maya" }],
      },
    });

    const detail = await getAlbumForModeration(EVENT);

    expect(detail?.media).toHaveLength(2500);
    expect(new Set(detail?.media.map((m) => m.id)).size).toBe(2500);
    // Newest first, the id breaking each tie downward.
    const displayOrder = [...media]
      .sort((a, b) =>
        a.created_at === b.created_at
          ? String(b.id).localeCompare(String(a.id))
          : String(b.created_at).localeCompare(String(a.created_at)),
      )
      .map((m) => m.id);
    expect(detail?.media.map((m) => m.id)).toEqual(displayOrder);
    expect(detail?.counts).toEqual({
      pending: 700,
      approved: 1300,
      hidden: 300,
      removed: 200,
    });
    expect(detail?.hostLabel).toBe("Maya");
    const heads = fake.requests.filter((r) => r.method === "HEAD");
    expect(heads).toHaveLength(4);
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
