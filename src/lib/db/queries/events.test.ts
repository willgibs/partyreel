/**
 * THE HOST'S EVENT READS REACH THEIR LAST ROW (the 1,000-row round, Will 2026-09-23: "Let's ensure
 * we will not face any of those issues here").
 *
 * Run against `fake-postgrest`, which clamps every read at 1,000 rows and fails a URL past 8,000
 * characters exactly as the platform does, with fixtures past 2,000 rows:
 *   - `listEvents` and `listRecentlyDeletedEvents` read every event, each once, in their display
 *     order, through timestamp ties that straddle a page boundary;
 *   - `getEventCardStats` and `getEventCoverUrls` send every event id in ONE request's POST body
 *     (`event_card_stats` / `event_covers`), so no URL grows with the host's events, and a 1,500-item
 *     album counts 1,500;
 *   - the covers prefer the small preview and presign every key;
 *   - the two SQL functions' filters, read off the migration that defines them, keep the bin and a
 *     guest's own withdrawal out of the counts and the covers (delete-final: a withdrawal is gone
 *     everywhere for the host). The pins media.test.ts held over the old list reads live here now,
 *     where the definition does.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  FakeRpcError,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) => `signed:${key}`,
}));

const HOST = "host-1";
let fake: FakePostgrest;
let signedIn = true;

vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({
    supabase: asSupabase(fake),
    user: signedIn ? { id: HOST } : null,
  }),
}));

const {
  CARD_STILLS,
  getEventCardStats,
  getEventCardStills,
  getEventCoverUrls,
  getReelProgress,
  listEvents,
  listRecentlyDeletedEvents,
} = await import("@/lib/db/queries/events");

const NOW = Date.parse("2026-09-23T12:00:00.000Z");

/** A uuid-length id, so a URL measures as it would live. */
const uuid = (prefix: string, i: number) =>
  `${prefix}0000000-0000-4000-8000-${String(i).padStart(12, "0")}`;

/** The raw timestamp string Postgres returns, microseconds included, `seconds` before NOW. */
const pgTime = (secondsAgo: number) =>
  new Date(NOW - secondsAgo * 1000).toISOString().replace("Z", "000+00:00");

function event(i: number, over: FakeRow = {}): FakeRow {
  return {
    id: uuid("e", i),
    host_id: HOST,
    name: `Event ${i}`,
    // Every three events share a created_at, so ties straddle the page boundaries.
    created_at: pgTime(10_000 + Math.floor(i / 3)),
    deleted_at: null,
    purge_at: null,
    event_password_hash: i % 7 === 0 ? "$2a$10$hash" : null,
    ...over,
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  signedIn = true;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("listEvents: every live event, newest first", () => {
  it("★ reads 2,500 events whole, each once, in (created_at desc, id desc) order", async () => {
    const events = Array.from({ length: 2500 }, (_, i) => event(i));
    fake = createFakePostgrest({
      tables: {
        events: [...events, event(9000, { deleted_at: pgTime(5) })],
      },
    });

    const rows = await listEvents();

    expect(rows).toHaveLength(2500);
    expect(new Set(rows.map((r) => r.id)).size).toBe(2500);
    const expected = [...events]
      .sort((a, b) =>
        a.created_at === b.created_at
          ? String(b.id).localeCompare(String(a.id))
          : String(b.created_at).localeCompare(String(a.created_at)),
      )
      .map((e) => e.id);
    expect(rows.map((r) => r.id)).toEqual(expected);
    // Three keyset pages, none clipped, none failed.
    expect(fake.requests.map((r) => r.returned)).toEqual([1000, 1000, 500]);
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });

  it("never carries the password hash, only whether there is one", async () => {
    fake = createFakePostgrest({ tables: { events: [event(0), event(1)] } });
    const rows = await listEvents();
    for (const row of rows)
      expect(row).not.toHaveProperty("event_password_hash");
    expect(rows.find((r) => r.id === uuid("e", 0))?.has_password).toBe(true);
    expect(rows.find((r) => r.id === uuid("e", 1))?.has_password).toBe(false);
  });

  it("reads nothing for a signed-out caller", async () => {
    fake = createFakePostgrest({ tables: { events: [event(0)] } });
    signedIn = false;
    await expect(listEvents()).resolves.toEqual([]);
    expect(fake.requests).toEqual([]);
  });

  it("throws on a failed page rather than showing a shorter list", async () => {
    fake = createFakePostgrest({ tables: {} });
    await expect(listEvents()).rejects.toThrow(/dashboard: events/);
  });
});

describe("listRecentlyDeletedEvents: the whole bin, newest deletion first", () => {
  it("★ reads 2,200 binned events whole, and leaves out live events and ones past the window", async () => {
    const binned = Array.from({ length: 2200 }, (_, i) =>
      event(i, {
        // Ties again: every four share a deletion stamp. All inside the 30-day window.
        deleted_at: pgTime(3600 + Math.floor(i / 4)),
        purge_at: new Date(NOW + 20 * 86_400_000).toISOString(),
      }),
    );
    fake = createFakePostgrest({
      tables: {
        events: [
          ...binned,
          event(5000), // live
          event(5001, { deleted_at: pgTime(40 * 86_400) }), // past the window
        ],
      },
    });

    const rows = await listRecentlyDeletedEvents();

    expect(rows).toHaveLength(2200);
    expect(new Set(rows.map((r) => r.id)).size).toBe(2200);
    const stamps = rows.map((r) => r.deleted_at as string);
    expect([...stamps].sort().reverse()).toEqual(stamps);
    expect(rows[0].countdownDays).toBe(20);
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });
});

/** `event_card_stats` as the SQL answers it: every non-null input id, the host's live media counted. */
function cardStats(fakeDb: FakePostgrest) {
  return ({ p_event_ids }: Record<string, unknown>) => {
    const ids = [...new Set((p_event_ids as string[]).filter(Boolean))];
    const out: Record<string, { approved: number; pending: number }> = {};
    for (const id of ids) out[id] = { approved: 0, pending: 0 };
    for (const m of fakeDb.tables.media ?? []) {
      const slot = out[m.event_id as string];
      if (!slot || m.removed_at !== null) continue;
      if (m.status === "approved") slot.approved += 1;
      else if (m.status === "pending") slot.pending += 1;
    }
    return out;
  };
}

describe("getEventCardStats: the cards' counts, counted in SQL", () => {
  it("★ sends 2,500 event ids in one request's body, and counts a 1,500-item album whole", async () => {
    const ids = Array.from({ length: 2500 }, (_, i) => uuid("e", i));
    const media: FakeRow[] = [
      ...Array.from({ length: 1500 }, (_, i) => ({
        id: uuid("m", i),
        event_id: ids[0],
        status: "approved",
        removed_at: null,
      })),
      ...Array.from({ length: 20 }, (_, i) => ({
        id: uuid("p", i),
        event_id: ids[0],
        status: "pending",
        removed_at: null,
      })),
    ];
    fake = createFakePostgrest({ tables: { media } });
    fake.functions.event_card_stats = cardStats(fake);

    const stats = await getEventCardStats(ids);

    expect(stats.size).toBe(2500);
    expect(stats.get(ids[0])).toEqual({ approved: 1500, pending: 20 });
    expect(stats.get(ids[2499])).toEqual({ approved: 0, pending: 0 });
    expect(fake.requests).toHaveLength(1);
    expect(fake.requests[0]).toMatchObject({
      target: "rpc",
      name: "event_card_stats",
      method: "POST",
      failed: false,
    });
    expect(fake.requests[0].urlLength).toBeLessThan(200);
  });

  it("every asked-for event is present, with zeros, even one the function left out", async () => {
    fake = createFakePostgrest({ rpc: { event_card_stats: () => ({}) } });
    const stats = await getEventCardStats(["a", "b"]);
    expect([...stats]).toEqual([
      ["a", { approved: 0, pending: 0 }],
      ["b", { approved: 0, pending: 0 }],
    ]);
  });

  it("throws on a failed read or a shape it cannot read, never zeros", async () => {
    fake = createFakePostgrest({
      rpc: {
        event_card_stats: () => {
          throw new FakeRpcError("42501", "permission denied");
        },
      },
    });
    await expect(getEventCardStats(["a"])).rejects.toThrow(
      /dashboard: event card stats/,
    );
    fake = createFakePostgrest({
      rpc: { event_card_stats: () => ({ a: { approved: "7" } }) },
    });
    await expect(getEventCardStats(["a"])).rejects.toThrow(/event_card_stats/);
  });

  it("reads nothing for no events or a signed-out caller", async () => {
    fake = createFakePostgrest({ rpc: { event_card_stats: () => ({}) } });
    await expect(getEventCardStats([])).resolves.toEqual(new Map());
    signedIn = false;
    const stats = await getEventCardStats(["a"]);
    expect(stats.get("a")).toEqual({ approved: 0, pending: 0 });
    expect(fake.requests).toEqual([]);
  });
});

describe("getEventCoverUrls: one cover per event, in one request", () => {
  it("★ sends 2,500 ids in the body; every event with a photo gets its cover, the preview first", async () => {
    const ids = Array.from({ length: 2500 }, (_, i) => uuid("e", i));
    const covers: Record<string, unknown> = {};
    ids.forEach((id, i) => {
      if (i % 10 === 9) return; // one in ten has no approved photo: absent
      covers[id] = {
        preview_key: i % 2 === 0 ? `preview-${i}` : null,
        original_key: `original-${i}`,
      };
    });
    fake = createFakePostgrest({ rpc: { event_covers: () => covers } });

    const urls = await getEventCoverUrls(ids);

    expect(urls.size).toBe(2250);
    expect(urls.get(ids[0])).toBe("signed:preview-0");
    expect(urls.get(ids[1])).toBe("signed:original-1");
    expect(urls.has(ids[9])).toBe(false);
    expect(fake.requests).toHaveLength(1);
    expect(fake.requests[0]).toMatchObject({
      name: "event_covers",
      method: "POST",
      failed: false,
    });
  });

  it("throws on a failed read, never a page of missing covers", async () => {
    fake = createFakePostgrest({
      rpc: {
        event_covers: () => {
          throw new FakeRpcError("57014", "canceling statement");
        },
      },
    });
    await expect(getEventCoverUrls(["a"])).rejects.toThrow(
      /dashboard: event covers/,
    );
  });
});

/* ────────────────────────────────────────────────────────────────────────────
   THE DEFINITIONS, READ OFF THE MIGRATION THAT HOLDS THEM. The counts and covers are SQL now, so the
   rule that the bin and a guest's own withdrawal never reach a card is the functions' own WHERE.
   Text-parsed from the NEWEST migration defining each (Vitest has no Postgres), fail-closed.
   ──────────────────────────────────────────────────────────────────────────── */
function newestBody(fn: string): string {
  const dir = join(process.cwd(), "supabase", "migrations");
  const definition = new RegExp(
    `create\\s+(?:or\\s+replace\\s+)?function\\s+public\\.${fn}\\s*\\(`,
    "i",
  );
  const newest = readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => readFileSync(join(dir, file), "utf8"))
    .filter((sql) => definition.test(sql))
    .at(-1);
  if (!newest) throw new Error(`No migration defines public.${fn}.`);
  const start = newest.search(definition);
  const open = newest.indexOf("$$", start);
  const close = newest.indexOf("$$", open + 2);
  return newest
    .slice(open + 2, close)
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

describe("getEventCardStills: each hosted card's cover and the stills it dissolves through", () => {
  it("★ asks both functions once for every event, in the body, and leads each list with its cover", async () => {
    const ids = Array.from({ length: 2500 }, (_, i) => uuid("e", i));
    fake = createFakePostgrest({
      rpc: {
        event_covers: () => ({
          [ids[0]]: { preview_key: "p-new", original_key: "o-new" },
          [ids[1]]: { preview_key: null, original_key: "o-only" },
        }),
        event_stills: (args: Record<string, unknown>) => {
          // The card's own cap, asked of the function, which clamps it again in SQL.
          expect(args.p_per_event).toBe(CARD_STILLS);
          return {
            [ids[0]]: ["p-new", "p-2", "p-3", "p-4"],
            [ids[2]]: ["q-1"],
          };
        },
      },
    });

    const stills = await getEventCardStills(ids);

    // The cover once, then the others, capped: the cover's preview is never a second still.
    expect(stills.get(ids[0])).toEqual([
      "signed:p-new",
      "signed:p-2",
      "signed:p-3",
      "signed:p-4",
    ]);
    // A photo with no preview keeps its original as the cover, and nothing else to show.
    expect(stills.get(ids[1])).toEqual(["signed:o-only"]);
    // Stills with no cover still make a card's list.
    expect(stills.get(ids[2])).toEqual(["signed:q-1"]);
    // An event with no photo is absent: its card keeps the no-cover surface.
    expect(stills.has(ids[3])).toBe(false);
    expect(fake.requests.map((r) => r.name).sort()).toEqual([
      "event_covers",
      "event_stills",
    ]);
    for (const request of fake.requests) {
      expect(request.method).toBe("POST");
      expect(request.urlLength).toBeLessThan(200);
    }
  });

  it("throws on either failed read rather than showing cards with no covers", async () => {
    fake = createFakePostgrest({
      rpc: {
        event_covers: () => ({}),
        event_stills: () => {
          throw new FakeRpcError("42501", "permission denied");
        },
      },
    });
    await expect(getEventCardStills(["a"])).rejects.toThrow(
      /dashboard: event stills/,
    );
    fake = createFakePostgrest({
      rpc: {
        event_covers: () => ({}),
        event_stills: () => ({ a: "not a list" }),
      },
    });
    await expect(getEventCardStills(["a"])).rejects.toThrow(/event_stills/);
  });

  it("reads nothing for no events or a signed-out caller", async () => {
    fake = createFakePostgrest({
      rpc: { event_covers: () => ({}), event_stills: () => ({}) },
    });
    expect((await getEventCardStills([])).size).toBe(0);
    signedIn = false;
    expect((await getEventCardStills(["a"])).size).toBe(0);
    expect(fake.requests).toEqual([]);
  });
});

describe("getReelProgress: how far each event's live reel is, counted to two", () => {
  /** An event row with `n` playable media embedded, the way PostgREST answers the embed. */
  const withMedia = (i: number, n: number): FakeRow => ({
    id: uuid("e", i),
    media: Array.from({ length: n }, (_, k) => ({ id: uuid("m", i * 10 + k) })),
  });

  it("★ answers 2,500 events in chunks one row an event, each counted only to the minimum", async () => {
    const eventIds = Array.from({ length: 2500 }, (_, i) => uuid("e", i));
    fake = createFakePostgrest({
      tables: {
        // The fake answers the embed whole; the real one stops it at the limit asked for.
        events: eventIds.map((_, i) =>
          withMedia(i, i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 5),
        ),
      },
    });

    const progress = await getReelProgress(eventIds);

    expect(progress.size).toBe(2500);
    expect(progress.get(uuid("e", 0))).toBe(0);
    expect(progress.get(uuid("e", 1))).toBe(1);
    // Five that play reads as two: past the minimum, the state is all a caller needs.
    expect(progress.get(uuid("e", 2))).toBe(2);
    const chunks = fake.requests.filter((r) => r.name === "events");
    expect(chunks.length).toBeGreaterThanOrEqual(17);
    for (const chunk of chunks) {
      expect(chunk.failed).toBe(false);
      expect(chunk.urlLength).toBeLessThan(8000);
      expect(chunk.returned).toBeLessThanOrEqual(150);
    }
  });

  it("asks for exactly what the live reel plays, and never more than two of them", async () => {
    fake = createFakePostgrest({ tables: { events: [withMedia(0, 1)] } });
    await getReelProgress([uuid("e", 0)]);
    const read = fake.requests.find((r) => r.name === "events");
    // The guest's isReelEligible, spelled in SQL: approved outside the bin, not a clip added to
    // the album, and something drawable (a photo, or a video with its poster).
    expect(read?.filters).toContainEqual({
      column: "media.or",
      op: "or",
      value:
        "and(status.eq.approved,removed_at.is.null,reel_eligible.is.true,or(type.eq.photo,preview_key.not.is.null))",
    });
    expect(decodeURIComponent(read?.url ?? "")).toContain("media.limit=2");
  });

  it("every asked-for event is present, at zero where nothing came back", async () => {
    fake = createFakePostgrest({ tables: { events: [withMedia(1, 2)] } });
    const progress = await getReelProgress([uuid("e", 0), uuid("e", 1)]);
    expect(progress.get(uuid("e", 0))).toBe(0);
    expect(progress.get(uuid("e", 1))).toBe(2);
  });

  it("throws on a failed read rather than telling a host the reel has not started", async () => {
    fake = createFakePostgrest({ tables: {} });
    await expect(getReelProgress([uuid("e", 0)])).rejects.toThrow(
      /host: reel progress/,
    );
  });

  it("reads nothing for no events or a signed-out caller", async () => {
    fake = createFakePostgrest({ tables: { events: [withMedia(0, 2)] } });
    expect((await getReelProgress([])).size).toBe(0);
    signedIn = false;
    const progress = await getReelProgress([uuid("e", 0)]);
    expect(progress.get(uuid("e", 0))).toBe(0);
    expect(fake.requests).toEqual([]);
  });
});

describe("the card functions' definitions", () => {
  it("event_card_stats counts approved and pending only, outside the bin: a withdrawal (removed) never counts", () => {
    const body = newestBody("event_card_stats");
    expect(body).toContain("m.removed_at is null");
    expect(body).toContain("filter (where m.status = 'approved')");
    expect(body).toContain("filter (where m.status = 'pending')");
  });

  it("event_covers picks the newest approved photo outside the bin, the id breaking a tie", () => {
    const body = newestBody("event_covers");
    expect(body).toContain("m.status = 'approved'");
    expect(body).toContain("m.type = 'photo'");
    expect(body).toContain("m.removed_at is null");
    expect(body).toContain("order by m.event_id, m.created_at desc, m.id desc");
  });
});
