/**
 * THE HOME'S PULSE COUNTS EVERYTHING AND SHOWS EVERY EVENT (the 1,000-row round, Will 2026-09-23:
 * "Let's ensure we will not face any of those issues here").
 *
 * The pulse used to read the newest 240 approved rows across every event and derive all of it from
 * them: "N in the last hour" and "N today" could never say more than 240, and an event whose uploads
 * fell outside those 240 got no strip in the row view. Against `fake-postgrest` (every read clamped
 * at 1,000, a URL past 8,000 characters failed), with fixtures past 2,000 rows:
 *   - the two figures are HEAD counts over the whole set, so 2,500 uploads read 2,500;
 *   - the strip is the newest twelve, never a pending item, a withdrawal, the bin, a deleted event's
 *     or another host's;
 *   - every one of 2,500 events gets its own newest four, read one row per event in chunks whose
 *     URLs stay under the limit, and each tile is presigned once however many strips show it;
 *   - which events have a reel is read whole through the host's own events, never an id list.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const HOST = "host-1";
let fake: FakePostgrest;
let signedIn = true;

vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({
    supabase: asSupabase(fake),
    user: signedIn ? { id: HOST } : null,
  }),
}));

const { getEventsWithReels, getPulse } = await import("@/lib/db/queries/pulse");

const NOW = Date.parse("2026-09-23T20:00:00.000Z");
const START_OF_TODAY = Date.parse("2026-09-23T00:00:00.000Z");
const MIN = 60;
const HOUR = 60 * MIN;

const uuid = (prefix: string, i: number) =>
  `${prefix}0000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const pgTime = (secondsAgo: number) =>
  new Date(NOW - secondsAgo * 1000).toISOString().replace("Z", "000+00:00");

const liveEvent = { host_id: HOST, deleted_at: null };

function media(i: number, secondsAgo: number, over: FakeRow = {}): FakeRow {
  return {
    id: uuid("m", i),
    event_id: uuid("e", i % 300),
    type: "photo",
    status: "approved",
    removed_at: null,
    created_at: pgTime(secondsAgo),
    preview_key: `preview-${i}`,
    original_key: `original-${i}`,
    events: liveEvent,
    ...over,
  };
}

/** What must never reach the strip or a count, each one NEWER than every live upload. */
function outsiders(): FakeRow[] {
  return [
    media(90_000, 1, { status: "pending" }),
    media(90_001, 1, { status: "removed", removed_by_uploader: true }),
    media(90_002, 1, { removed_at: pgTime(1) }),
    media(90_003, 1, { events: { host_id: HOST, deleted_at: pgTime(5) } }),
    media(90_004, 1, { events: { host_id: "someone-else", deleted_at: null } }),
  ];
}

beforeEach(() => {
  presigned.length = 0;
  signedIn = true;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the arrivals: counted, never read", () => {
  it("★ 2,500 uploads in the last hour read 2,500, and the strip is the newest twelve", async () => {
    // 2,500 approved uploads in the last hour, a second apart, newest first by index.
    const live = Array.from({ length: 2500 }, (_, i) => media(i, 10 + i));
    fake = createFakePostgrest({
      tables: { media: [...live, ...outsiders()], events: [] },
    });

    const pulse = await getPulse([uuid("e", 0)], NOW, START_OF_TODAY);

    expect(pulse.window).toBe("hour");
    expect(pulse.caption).toBe("2500 in the last hour, across your events");
    expect(pulse.arrivals.map((t) => t.id)).toEqual(
      live.slice(0, 12).map((m) => m.id),
    );
    // Two HEAD counts, no rows read for them.
    const heads = fake.requests.filter((r) => r.method === "HEAD");
    expect(heads).toHaveLength(2);
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });

  it("widens to today with the whole day's count", async () => {
    const today = Array.from({ length: 1500 }, (_, i) =>
      media(i, 2 * HOUR + i),
    );
    fake = createFakePostgrest({
      tables: { media: [media(9999, 30 * MIN), ...today], events: [] },
    });

    const pulse = await getPulse([uuid("e", 0)], NOW, START_OF_TODAY);

    expect(pulse.window).toBe("today");
    expect(pulse.caption).toBe("1501 today, across your events");
  });

  it("dates the newest when neither window fills the strip", async () => {
    fake = createFakePostgrest({
      tables: { media: [media(0, 3 * 24 * HOUR)], events: [] },
    });
    const pulse = await getPulse([uuid("e", 0)], NOW, START_OF_TODAY);
    expect(pulse.window).toBe("recent");
    expect(pulse.caption).toBe("Newest, 3 days ago");
  });

  it("an album with nothing approved is the calm empty band, never a pending or withdrawn tile", async () => {
    fake = createFakePostgrest({
      tables: {
        media: outsiders().filter((m) => m.status !== "approved"),
        events: [],
      },
    });
    const pulse = await getPulse([uuid("e", 0)], NOW, START_OF_TODAY);
    expect(pulse.arrivals).toEqual([]);
    expect(pulse.caption).toBe("Nothing yet");
  });

  it("names the host through events!inner, never an event id list", async () => {
    fake = createFakePostgrest({ tables: { media: [media(0, 10)], events: [] } });
    await getPulse([uuid("e", 0)], NOW, START_OF_TODAY);
    for (const request of fake.requests.filter((r) => r.name === "media")) {
      expect(request.filters).toContainEqual({
        column: "events.host_id",
        op: "eq",
        value: HOST,
      });
      expect(request.filters.some((f) => f.op === "in")).toBe(false);
    }
  });
});

describe("the row view's strips: every event gets its own", () => {
  it("★ 2,500 events each get their newest four, in chunks whose URLs stay under the limit", async () => {
    const eventIds = Array.from({ length: 2500 }, (_, i) => uuid("e", i));
    const events = eventIds.map((id, i) => ({
      id,
      // What PostgREST's embed answers per event: its newest four approved, live media.
      media: Array.from({ length: 4 }, (_, k) => ({
        id: uuid("s", i * 4 + k),
        event_id: id,
        type: k === 3 ? "video" : "photo",
        created_at: pgTime(HOUR * (i + 1) + k),
        preview_key: k === 0 ? null : `strip-preview-${i}-${k}`,
        original_key: `strip-original-${i}-${k}`,
      })),
    }));
    // The newest upload overall is event 0's own strip head, so it is both an arrival and a tile.
    const head = { ...events[0].media[0], status: "approved", removed_at: null, events: liveEvent };
    fake = createFakePostgrest({ tables: { media: [head], events } });

    const pulse = await getPulse(eventIds, NOW, START_OF_TODAY);

    expect(pulse.newestByEvent.size).toBe(2500);
    for (const id of eventIds) expect(pulse.newestByEvent.get(id)).toHaveLength(4);
    expect(pulse.newestByEvent.get(eventIds[0])?.[0]).toEqual({
      id: uuid("s", 0),
      type: "photo",
      url: "signed:strip-original-0-0",
    });
    const chunks = fake.requests.filter((r) => r.name === "events");
    expect(chunks.length).toBeGreaterThanOrEqual(17);
    for (const chunk of chunks) {
      expect(chunk.failed).toBe(false);
      expect(chunk.urlLength).toBeLessThan(8000);
      expect(chunk.returned).toBeLessThanOrEqual(150);
    }
    // One presign per distinct tile, the head counted once though it is in two strips.
    expect(presigned).toHaveLength(10_000);
    expect(new Set(presigned).size).toBe(10_000);
  });

  it("each strip asks for approved uploads outside the bin, the newest four, so no withdrawal can show", async () => {
    fake = createFakePostgrest({ tables: { media: [media(0, 10)], events: [] } });
    await getPulse([uuid("e", 0)], NOW, START_OF_TODAY);
    const strip = fake.requests.find((r) => r.name === "events");
    // The embed's own filter: a withdrawal is `removed`, and the bin carries `removed_at`.
    expect(strip?.filters).toContainEqual({
      column: "media.or",
      op: "or",
      value: "and(status.eq.approved,removed_at.is.null)",
    });
    const url = decodeURIComponent(strip?.url ?? "");
    expect(url).toContain("media.order=created_at.desc,id.desc");
    expect(url).toContain("media.limit=4");
  });

  it("an event with nothing approved has no strip, and no other event loses its own", async () => {
    fake = createFakePostgrest({
      tables: {
        media: [media(0, 10)],
        events: [
          { id: uuid("e", 0), media: [] },
          {
            id: uuid("e", 1),
            media: [
              {
                id: uuid("s", 1),
                event_id: uuid("e", 1),
                type: "photo",
                created_at: pgTime(20),
                preview_key: null,
                original_key: "k",
              },
            ],
          },
        ],
      },
    });
    const pulse = await getPulse([uuid("e", 0), uuid("e", 1)], NOW, START_OF_TODAY);
    expect(pulse.newestByEvent.has(uuid("e", 0))).toBe(false);
    expect(pulse.newestByEvent.get(uuid("e", 1))).toHaveLength(1);
  });

  it("reads nothing for no events or a signed-out caller", async () => {
    fake = createFakePostgrest({ tables: { media: [media(0, 10)], events: [] } });
    await expect(getPulse([], NOW, START_OF_TODAY)).resolves.toMatchObject({
      caption: "Nothing yet",
    });
    signedIn = false;
    await getPulse([uuid("e", 0)], NOW, START_OF_TODAY);
    expect(fake.requests).toEqual([]);
  });

  it("throws when a read fails, rather than drawing a quiet home", async () => {
    fake = createFakePostgrest({ tables: { media: [media(0, 10)] } });
    await expect(getPulse([uuid("e", 0)], NOW, START_OF_TODAY)).rejects.toThrow(
      /dashboard: newest per event/,
    );
  });
});

describe("getEventsWithReels: read whole through the host's own events", () => {
  it("★ finds 2,500 reels across three pages, only the host's live events, no id list", async () => {
    const eventIds = Array.from({ length: 2600 }, (_, i) => uuid("e", i));
    const reels: FakeRow[] = eventIds.slice(0, 2500).map((id) => ({
      event_id: id,
      events: liveEvent,
    }));
    reels.push(
      { event_id: uuid("x", 1), events: { host_id: "someone-else", deleted_at: null } },
      { event_id: uuid("x", 2), events: { host_id: HOST, deleted_at: pgTime(5) } },
    );
    fake = createFakePostgrest({ tables: { highlight_reels: reels } });

    const withReels = await getEventsWithReels(eventIds);

    expect(withReels.size).toBe(2500);
    expect(withReels.has(eventIds[2599])).toBe(false);
    expect(fake.requests.map((r) => r.returned)).toEqual([1000, 1000, 500]);
    for (const request of fake.requests) {
      expect(request.filters.some((f) => f.op === "in")).toBe(false);
      expect(request.urlLength).toBeLessThan(1000);
    }
  });
});
