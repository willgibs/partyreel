/**
 * THE SIZE LIST'S READS, ON THE CLAMPING POSTGREST FAKE (read-all.ts): a page is largest first
 * across her live events, pages by `(size, id)` without skipping or repeating a tie, filters to one
 * event, and never reaches another host's media, a removed item or a deleted event; the totals
 * behind the filter are read WHOLE, however far past 1,000 rows an album grows; and each item
 * leaves presigned and credited, the host's own as hers, never with an address.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));

const attribution = vi.fn();
vi.mock("@/lib/db/queries/album-state", () => ({
  readAlbumAttribution: (...args: unknown[]) => attribution(...args),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) => `https://r2.test/${key}`,
}));

import {
  readStorageEvents,
  readStoragePage,
  toStorageItems,
} from "./storage-list";

const HOST = "00000000-0000-4000-8000-000000000001";
const OTHER = "00000000-0000-4000-8000-000000000002";
const WEDDING = "10000000-0000-4000-8000-000000000001";
const PARTY = "10000000-0000-4000-8000-000000000002";
const GONE = "10000000-0000-4000-8000-000000000003";
const THEIRS = "10000000-0000-4000-8000-000000000004";

const EVENTS: Record<string, { host_id: string; deleted_at: string | null }> = {
  [WEDDING]: { host_id: HOST, deleted_at: null },
  [PARTY]: { host_id: HOST, deleted_at: null },
  [GONE]: { host_id: HOST, deleted_at: "2026-09-01T00:00:00+00:00" },
  [THEIRS]: { host_id: OTHER, deleted_at: null },
};

/** A uuid whose order follows `n`, so a test can read ties by id. */
const idOf = (n: number) =>
  `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function media(
  n: number,
  eventId: string,
  bytes: number,
  over: Partial<FakeRow> = {},
): FakeRow {
  return {
    id: idOf(n),
    event_id: eventId,
    type: "photo",
    file_size_bytes: bytes,
    duration_seconds: null,
    created_at: "2026-06-14T18:00:00.000000+00:00",
    guest_id: null,
    original_key: `k/${n}`,
    preview_key: null,
    status: "approved",
    events: EVENTS[eventId],
    ...over,
  };
}

function fakeWith(rows: FakeRow[]) {
  return createFakePostgrest({
    tables: {
      media: rows,
      events: [
        { id: WEDDING, name: "Maya & Theo", ...EVENTS[WEDDING] },
        { id: PARTY, name: "Ivy turns one", ...EVENTS[PARTY] },
        { id: GONE, name: "Deleted", ...EVENTS[GONE] },
        { id: THEIRS, name: "Someone else's", ...EVENTS[THEIRS] },
      ],
    },
  });
}

beforeEach(() => {
  attribution.mockReset();
});

describe("a page of what she stores", () => {
  it("is largest first across her live events, and nothing else", async () => {
    const fake = fakeWith([
      media(1, WEDDING, 500),
      media(2, PARTY, 900),
      media(3, WEDDING, 700, { status: "removed" }),
      media(4, GONE, 9_000),
      media(5, THEIRS, 8_000),
      media(6, PARTY, 100, { status: "pending" }),
      media(7, WEDDING, 300, { status: "hidden" }),
    ]);
    const { rows, next } = await readStoragePage(asSupabase(fake), HOST, {});
    // Pending and hidden items count against the cap (status <> 'removed'), so they are here.
    expect(rows.map((r) => r.file_size_bytes)).toEqual([900, 500, 300, 100]);
    expect(next).toBeNull();
  });

  it("pages by size and id without skipping or repeating a tie", async () => {
    const rows = Array.from({ length: 7 }, (_, i) =>
      media(i + 1, WEDDING, i < 5 ? 1_000 : 50),
    );
    const fake = fakeWith(rows);
    const seen: string[] = [];
    let after = null;
    for (let i = 0; i < 5; i++) {
      const page = await readStoragePage(asSupabase(fake), HOST, {
        after,
        limit: 3,
      });
      seen.push(...page.rows.map((r) => r.id));
      if (!page.next) break;
      after = page.next;
    }
    expect(seen).toHaveLength(7);
    expect(new Set(seen).size).toBe(7);
    // Within the tie, the id decides, descending.
    expect(seen.slice(0, 5)).toEqual([5, 4, 3, 2, 1].map(idOf));
  });

  it("filters to one event", async () => {
    const fake = fakeWith([
      media(1, WEDDING, 500),
      media(2, PARTY, 900),
      media(3, PARTY, 200),
    ]);
    const { rows } = await readStoragePage(asSupabase(fake), HOST, {
      eventId: PARTY,
    });
    expect(rows.map((r) => r.id)).toEqual([idOf(2), idOf(3)]);
  });

  it("refuses a cursor or an event id that is not what it claims", async () => {
    const fake = fakeWith([]);
    await expect(
      readStoragePage(asSupabase(fake), HOST, {
        after: { bytes: 1, id: "1),or(id.gt.0" },
      }),
    ).rejects.toThrow(RangeError);
    await expect(
      readStoragePage(asSupabase(fake), HOST, {
        after: { bytes: -1, id: idOf(1) },
      }),
    ).rejects.toThrow(RangeError);
    await expect(
      readStoragePage(asSupabase(fake), HOST, { eventId: "not-an-id" }),
    ).rejects.toThrow(RangeError);
  });
});

describe("the totals behind the filter", () => {
  it("are read whole past 1,000 rows, heaviest event first", async () => {
    const rows = [
      ...Array.from({ length: 2_400 }, (_, i) => media(i + 1, WEDDING, 10)),
      ...Array.from({ length: 30 }, (_, i) => media(5_000 + i, PARTY, 1_000)),
      media(9_000, GONE, 1),
      media(9_001, THEIRS, 1),
      media(9_002, WEDDING, 7, { status: "removed" }),
    ];
    const fake = fakeWith(rows);
    const events = await readStorageEvents(asSupabase(fake), HOST);
    expect(events).toEqual([
      { id: PARTY, name: "Ivy turns one", bytes: 30_000, count: 30 },
      { id: WEDDING, name: "Maya & Theo", bytes: 24_000, count: 2_400 },
    ]);
    // Every page came back whole: nothing was clipped at the platform's 1,000.
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });

  it("lists an event only while it holds something", async () => {
    const fake = fakeWith([media(1, WEDDING, 5)]);
    const events = await readStorageEvents(asSupabase(fake), HOST);
    expect(events.map((e) => e.id)).toEqual([WEDDING]);
  });
});

describe("an item as the list draws it", () => {
  it("is presigned, and credited: hers as the host's, a guest's by the one rule, no address", async () => {
    attribution.mockResolvedValue(
      new Map([
        [
          idOf(2),
          {
            displayName: "Sam",
            email: null,
            isHost: false,
            isVerified: false,
          },
        ],
      ]),
    );
    const items = await toStorageItems([
      {
        id: idOf(1),
        event_id: WEDDING,
        type: "video",
        file_size_bytes: 900,
        duration_seconds: 42,
        created_at: "2026-06-14T18:00:00.000000+00:00",
        guest_id: null,
        original_key: "k/1",
        preview_key: "k/1-preview",
      },
      {
        id: idOf(2),
        event_id: WEDDING,
        type: "photo",
        file_size_bytes: 400,
        duration_seconds: null,
        created_at: "2026-06-14T18:00:00.000000+00:00",
        guest_id: "30000000-0000-4000-8000-000000000001",
        original_key: "k/2",
        preview_key: null,
      },
    ]);
    expect(items[0]).toMatchObject({
      url: "https://r2.test/k/1",
      previewUrl: "https://r2.test/k/1-preview",
      by: { isHost: true },
    });
    expect(items[1]).toMatchObject({
      previewUrl: null,
      by: { name: "Sam", isHost: false, isVerified: false },
    });
    // Attribution was asked for the guest's item alone, and never with the address.
    expect(attribution).toHaveBeenCalledTimes(1);
    expect(attribution).toHaveBeenCalledWith(WEDDING, [idOf(2)], {
      withEmail: false,
    });
    // Nothing on an item is a raw key.
    expect(JSON.stringify(items)).not.toMatch(/"k\/\d/);
  });
});
