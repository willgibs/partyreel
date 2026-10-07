/**
 * THE DASHBOARD'S OWN READS (host-dashboard r1's wiring), against `fake-postgrest` (every read clamped
 * at 1,000, a URL past 8,000 characters failed), with fixtures past what one request can answer:
 *   - every one of 2,500 events gets its newest arrival, one row per event in chunks whose URLs stay
 *     under the limit, and the embed asks for the album alone (approved, outside the bin), newest first;
 *   - a day's arrivals are a HEAD count, so 2,500 read 2,500;
 *   - the stage's photographs are the newest drawable nine, each presigned once, never a key;
 *   - a link's opens are the hub's own number, and a read that fails leaves its event unsaid;
 *   - signed out, every read is empty.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));
const presigned: string[] = [];
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) => {
    presigned.push(key);
    return `signed:${key}`;
  },
}));

let fake: FakePostgrest;
let signedIn = true;
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({
    supabase: asSupabase(fake),
    user: signedIn ? { id: "host-1" } : null,
  }),
}));

const { countArrivalsSince, getLastArrivals, getOpenedCounts, getStagePhotos } =
  await import("@/lib/db/queries/dashboard");

const uuid = (prefix: string, i: number) =>
  `${prefix}0000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const pgTime = (minutesAgo: number) =>
  new Date(Date.parse("2026-10-02T21:00:00.000Z") - minutesAgo * 60_000)
    .toISOString()
    .replace("Z", "000+00:00");

beforeEach(() => {
  presigned.length = 0;
  signedIn = true;
});

describe("each event's newest arrival", () => {
  it("★ reaches every one of 2,500 events, in chunks whose URLs stay under the limit", async () => {
    const ids = Array.from({ length: 2500 }, (_, i) => uuid("e", i));
    const events = ids.map((id, i) => ({
      id,
      // What PostgREST's embed answers per event: its newest approved upload, or none.
      media: i % 10 === 0 ? [] : [{ created_at: pgTime(i) }],
    }));
    fake = createFakePostgrest({ tables: { events } });

    const last = await getLastArrivals(ids);

    expect(last.size).toBe(2250);
    expect(last.get(ids[1]!)).toBe(pgTime(1));
    expect(last.has(ids[0]!)).toBe(false);
    for (const chunk of fake.requests) {
      expect(chunk.failed).toBe(false);
      expect(chunk.urlLength).toBeLessThan(8000);
    }
  });

  it("asks the embed for the album alone, newest first, one an event", async () => {
    fake = createFakePostgrest({ tables: { events: [] } });
    await getLastArrivals([uuid("e", 0)]);
    const read = fake.requests[0];
    expect(read?.filters).toContainEqual({
      column: "media.or",
      op: "or",
      value: "and(status.eq.approved,removed_at.is.null)",
    });
    const url = decodeURIComponent(read?.url ?? "");
    expect(url).toContain("media.order=created_at.desc");
    expect(url).toContain("media.limit=1");
  });
});

describe("a day's arrivals", () => {
  it("are counted, never read: 2,500 read 2,500", async () => {
    const media: FakeRow[] = Array.from({ length: 2500 }, (_, i) => ({
      id: uuid("m", i),
      event_id: uuid("e", 0),
      status: "approved",
      removed_at: null,
      created_at: pgTime(i % 600),
    }));
    media.push(
      {
        id: "pending",
        event_id: uuid("e", 0),
        status: "pending",
        removed_at: null,
        created_at: pgTime(1),
      },
      {
        id: "binned",
        event_id: uuid("e", 0),
        status: "approved",
        removed_at: pgTime(1),
        created_at: pgTime(1),
      },
      {
        id: "old",
        event_id: uuid("e", 0),
        status: "approved",
        removed_at: null,
        created_at: pgTime(24 * 60),
      },
      {
        id: "elsewhere",
        event_id: uuid("e", 1),
        status: "approved",
        removed_at: null,
        created_at: pgTime(1),
      },
    );
    fake = createFakePostgrest({ tables: { media } });
    expect(await countArrivalsSince(uuid("e", 0), pgTime(600))).toBe(2500);
    expect(fake.requests.every((r) => r.method === "HEAD")).toBe(true);
  });
});

describe("the stage's photographs", () => {
  it("are the newest drawable nine, presigned once each, a preview before its original", async () => {
    const media: FakeRow[] = [
      ...Array.from({ length: 12 }, (_, i) => ({
        id: uuid("m", i),
        event_id: uuid("e", 0),
        type: "photo",
        status: "approved",
        removed_at: null,
        created_at: pgTime(i),
        preview_key: i % 2 ? `preview-${i}` : null,
        original_key: `original-${i}`,
      })),
      // A video with no poster draws nothing, a held one is not in the album yet, a binned one is gone.
      {
        id: "reel",
        event_id: uuid("e", 0),
        type: "video",
        status: "approved",
        removed_at: null,
        created_at: pgTime(0),
        preview_key: null,
        original_key: "clip",
      },
      {
        id: "held",
        event_id: uuid("e", 0),
        type: "photo",
        status: "pending",
        removed_at: null,
        created_at: pgTime(0),
        preview_key: null,
        original_key: "held",
      },
      {
        id: "binned",
        event_id: uuid("e", 0),
        type: "photo",
        status: "approved",
        removed_at: pgTime(0),
        created_at: pgTime(0),
        preview_key: null,
        original_key: "binned",
      },
    ];
    fake = createFakePostgrest({ tables: { media } });
    const photos = await getStagePhotos(uuid("e", 0), 9);
    expect(photos.map((p) => p.id)).toEqual(
      Array.from({ length: 9 }, (_, i) => uuid("m", i)),
    );
    expect(photos[0]?.url).toBe("signed:original-0");
    expect(photos[1]?.url).toBe("signed:preview-1");
    expect(presigned).toHaveLength(9);
  });

  /**
   * ★ HELD TO WHAT HER GUESTS SEE (crumbs-88): her own session is exempt from a disposable album's seal at every SQL home,
   * so the wall asked the seal's predicate itself, or it drew the very photographs the hub covers until the develop. The
   * rows below are the three the one predicate tells apart: sealed past now, sealed to a time already reached (the sweep
   * has not cleared it yet), and never sealed. The newest are the sealed ones, so a wall that took the newest nine
   * and then dropped the sealed would come back short.
   */
  describe("★ held to what her guests see: a row sealed past now is never drawn", () => {
    const row = (i: number, sealedUntil: string | null) => ({
      id: uuid("s", i),
      event_id: uuid("e", 0),
      type: "photo",
      status: "approved",
      removed_at: null,
      created_at: pgTime(i),
      preview_key: `preview-${i}`,
      original_key: `original-${i}`,
      sealed_until: sealedUntil,
    });
    const AHEAD = "2999-01-01T00:00:00+00:00";
    const REACHED = "2020-01-01T00:00:00+00:00";

    it("draws the nine newest of what is unsealed, skipping the sealed ones however new they are", async () => {
      fake = createFakePostgrest({
        tables: {
          media: [
            // The newest three wait for the develop, then twelve that never did and two whose time has come.
            row(0, AHEAD),
            row(1, AHEAD),
            row(2, AHEAD),
            ...Array.from({ length: 12 }, (_, i) =>
              row(3 + i, i % 5 === 4 ? REACHED : null),
            ),
          ],
        },
      });
      const photos = await getStagePhotos(uuid("e", 0), 9);
      expect(photos.map((p) => p.id)).toEqual(
        Array.from({ length: 9 }, (_, i) => uuid("s", 3 + i)),
      );
      expect(presigned).toHaveLength(9);
      expect(presigned.some((k) => /-(0|1|2)$/.test(k))).toBe(false);
    });

    it("draws nothing for a covered album whose every row waits: the stage stands on its code's plate", async () => {
      fake = createFakePostgrest({
        tables: { media: [row(0, AHEAD), row(1, AHEAD), row(2, AHEAD)] },
      });
      expect(await getStagePhotos(uuid("e", 0), 9)).toEqual([]);
      expect(presigned).toEqual([]);
    });

    it("asks the seal's own logic tree, an `or` beside the drawable one, which PostgREST ANDs", async () => {
      fake = createFakePostgrest({ tables: { media: [row(0, null)] } });
      await getStagePhotos(uuid("e", 0), 9);
      const ors = fake.requests
        .flatMap((r) => r.filters)
        .filter((f) => f.op === "or")
        .map((f) => String(f.value));
      expect(ors).toHaveLength(2);
      expect(
        ors.filter((t) =>
          /^sealed_until\.is\.null,sealed_until\.lte\..+$/.test(t),
        ),
      ).toHaveLength(1);
      expect(ors).toContain("type.eq.photo,preview_key.not.is.null");
    });
  });
});

describe("a link's opens", () => {
  it("are the hub's own number, scans and views, and a failed read leaves its event unsaid", async () => {
    fake = createFakePostgrest({
      rpc: {
        event_link_totals: ({ p_event_id }) => {
          if (p_event_id === "broken") throw new Error("boom");
          return p_event_id === "busy"
            ? { qr_scans: 12, album_views: 30 }
            : { qr_scans: 0, album_views: 0 };
        },
      },
    });
    const opened = await getOpenedCounts(["busy", "quiet", "broken"]);
    expect(opened.get("busy")).toBe(42);
    expect(opened.get("quiet")).toBe(0);
    expect(opened.has("broken")).toBe(false);
  });
});

describe("signed out", () => {
  it("reads nothing at all", async () => {
    signedIn = false;
    fake = createFakePostgrest({ tables: { events: [], media: [] } });
    expect(await getLastArrivals([uuid("e", 0)])).toEqual(new Map());
    expect(await countArrivalsSince(uuid("e", 0), pgTime(60))).toBe(0);
    expect(await getStagePhotos(uuid("e", 0), 9)).toEqual([]);
    expect(await getOpenedCounts(["e"])).toEqual(new Map());
    expect(fake.requests).toEqual([]);
  });
});
