/**
 * THE SOCIAL READS REACH THEIR LAST ROW (the 1,000-row round, Will 2026-09-23: "Let's ensure we will
 * not face any of those issues here").
 *
 * Against `fake-postgrest`, which clamps every read at 1,000 rows and fails a URL past 8,000
 * characters exactly as the platform does, with fixtures past 2,000 rows:
 *   - the owner's follows, blocks and shown events read whole, newest first where the page shows an
 *     order, their profile cards hydrated in chunks of at most 150 ids;
 *   - the one count's two event-keyed reads (`getEventGuests`) read every approved upload and every
 *     guest row;
 *   - the events you added to (Guest cards, the profile switches) read every live upload and look up
 *     every event and host in chunks, and the covers ride `event_covers` in one request;
 *   - the public profile's attended covers re-prove their four gates over a thousand attended events
 *     without ever putting the set in one URL;
 *   - every cover is the small preview when there is one.
 * What each read returns, row by row, is `social.guest-identity.test.ts`' business; this is the size.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability/sentry", () => ({ captureError: () => {} }));
vi.mock("@/lib/supabase/avatar-storage", () => ({
  getAvatarUrl: async () => null,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => null }));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) => `signed:${key}`,
}));

const ME = "u0000000-0000-4000-8000-000000000001";
let fake: FakePostgrest;

vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ supabase: asSupabase(fake), user: { id: ME } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const {
  getEventGuests,
  getMyAttendedEvents,
  getMyBlocks,
  getMyFollowing,
  getMyGuestEventCards,
  getMyShownEventIds,
  getPublicProfileAttendedCoverUrls,
  getPublicProfileCoverUrls,
} = await import("@/lib/db/queries/social");

const uuid = (prefix: string, i: number) =>
  `${prefix}0000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const at = (secondsAgo: number) =>
  new Date(Date.parse("2026-09-23T12:00:00.000Z") - secondsAgo * 1000)
    .toISOString()
    .replace("Z", "000+00:00");

function profiles(n: number, prefix = "p"): FakeRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: uuid(prefix, i),
    display_name: `Person ${i}`,
    slug: null,
    avatar_updated_at: null,
    email: `person${i}@example.com`,
  }));
}

/** `event_covers` as the SQL answers it: the newest approved photo outside the bin per event. */
function covers(fakeDb: FakePostgrest) {
  return ({ p_event_ids }: Record<string, unknown>) => {
    const wanted = new Set(p_event_ids as string[]);
    const out: Record<string, { preview_key: string | null; original_key: string }> =
      {};
    const newest = [...(fakeDb.tables.media ?? [])].sort((a, b) =>
      String(b.created_at).localeCompare(String(a.created_at)),
    );
    for (const m of newest) {
      const id = m.event_id as string;
      if (!wanted.has(id) || out[id]) continue;
      if (m.status !== "approved" || m.type !== "photo" || m.removed_at) continue;
      out[id] = {
        preview_key: (m.preview_key as string | null) ?? null,
        original_key: m.original_key as string,
      };
    }
    return out;
  };
}

/** Every request stayed under the URL limit, and every id list under the chunk size. */
function expectChunked(requests: FakePostgrest["requests"]) {
  for (const request of requests) {
    expect(request.failed, request.url.slice(0, 80)).toBe(false);
    expect(request.urlLength).toBeLessThan(8000);
    for (const filter of request.filters.filter((f) => f.op === "in")) {
      expect((filter.value as unknown[]).length).toBeLessThanOrEqual(150);
    }
  }
}

beforeEach(() => {
  fake = createFakePostgrest();
});

describe("the owner's graph, read whole", () => {
  it("★ 2,500 follows come back newest first, every card hydrated in chunks", async () => {
    fake = createFakePostgrest({
      tables: {
        user_follows: Array.from({ length: 2500 }, (_, i) => ({
          follower_id: ME,
          followee_id: uuid("p", i),
          // Every four share a stamp, so ties straddle the page boundaries.
          created_at: at(100 + Math.floor(i / 4)),
        })),
        profiles: profiles(2500),
      },
    });

    const following = await getMyFollowing();

    expect(following).toHaveLength(2500);
    expect(new Set(following.map((f) => f.id)).size).toBe(2500);
    const stamps = following.map((f) => f.followedAt);
    expect([...stamps].sort().reverse()).toEqual(stamps);
    expect(JSON.stringify(following)).not.toContain("@example.com");
    expectChunked(fake.requests);
  });

  it("★ 2,200 blocks come back whole", async () => {
    fake = createFakePostgrest({
      tables: {
        user_blocks: Array.from({ length: 2200 }, (_, i) => ({
          blocker_id: ME,
          blocked_id: uuid("p", i),
          created_at: at(100 + i),
        })),
        profiles: profiles(2200),
      },
    });
    await expect(getMyBlocks()).resolves.toHaveLength(2200);
    expectChunked(fake.requests);
  });

  it("★ 2,500 shown events come back whole", async () => {
    fake = createFakePostgrest({
      tables: {
        profile_shown_events: [
          ...Array.from({ length: 2500 }, (_, i) => ({
            user_id: ME,
            event_id: uuid("e", i),
          })),
          { user_id: "someone-else", event_id: uuid("e", 9999) },
        ],
      },
    });
    const shown = await getMyShownEventIds();
    expect(shown).toHaveLength(2500);
    expect(shown).not.toContain(uuid("e", 9999));
  });
});

describe("getEventGuests: the one count, past the row cap", () => {
  it("★ reads 2,500 approved uploads and 2,500 guest rows, and counts every proved person", async () => {
    const EVENT = uuid("e", 1);
    fake = createFakePostgrest({
      tables: {
        events: [{ id: EVENT, host_id: "host-1", deleted_at: null }],
        media: Array.from({ length: 2500 }, (_, i) => ({
          id: uuid("m", i),
          event_id: EVENT,
          status: "approved",
          guest_id: uuid("g", i),
        })),
        guests: Array.from({ length: 2500 }, (_, i) => ({
          id: uuid("g", i),
          event_id: EVENT,
          user_id: i % 2 === 0 ? uuid("p", i) : null,
          display_name: i % 2 === 0 ? null : `Guest ${i}`,
          verified_at: i % 2 === 0 ? at(50) : null,
        })),
      },
    });

    const guests = await getEventGuests(EVENT);

    expect(guests.verifiedUserIds).toHaveLength(1250);
    expect(guests.unverifiedRows).toHaveLength(1250);
    expect(fake.requests.every((r) => r.filters.every((f) => f.op !== "in"))).toBe(true);
  });
});

describe("the events you added to, past the row cap", () => {
  /** 2,400 live uploads of mine across 1,200 events hosted by 300 people, every event open. */
  function world(): FakePostgrest {
    const db = createFakePostgrest({
      tables: {
        media: Array.from({ length: 2400 }, (_, i) => ({
          id: uuid("m", i),
          event_id: uuid("e", i % 1200),
          status: "approved",
          type: "photo",
          removed_at: null,
          created_at: at(1000 + i),
          preview_key: i % 2 === 0 ? `preview-${i % 1200}` : null,
          original_key: `original-${i % 1200}`,
          guests: { user_id: ME, verified_at: at(5000) },
        })),
        events: Array.from({ length: 1200 }, (_, i) => ({
          id: uuid("e", i),
          name: `Event ${i}`,
          event_date: null,
          visibility: "open",
          qr_token: `qr-${i}`,
          host_id: uuid("h", i % 300),
          deleted_at: null,
          show_guest_list: true,
          created_at: at(90_000 + i),
        })),
        profiles: profiles(300, "h"),
        profile_shown_events: Array.from({ length: 1200 }, (_, i) => ({
          user_id: ME,
          event_id: uuid("e", i),
        })),
      },
    });
    db.functions.event_covers = covers(db);
    return db;
  }

  it("★ Guest cards: 1,200 events, every host named, every cover, the covers in one request", async () => {
    fake = world();
    const cards = await getMyGuestEventCards();

    expect(cards).toHaveLength(1200);
    expect(cards.every((c) => c.byline?.startsWith("Hosted by Person"))).toBe(true);
    expect(cards.every((c) => c.coverUrl !== null)).toBe(true);
    // The newest upload per event decides its cover: uploads 0..1199 are the newest, the even ones
    // carry a preview.
    const covered = new Map(cards.map((c) => [c.eventId, c.coverUrl]));
    expect(covered.get(uuid("e", 0))).toBe("signed:preview-0");
    expect(covered.get(uuid("e", 1))).toBe("signed:original-1");
    expect(fake.requests.filter((r) => r.name === "event_covers")).toHaveLength(1);
    expectChunked(fake.requests);
  });

  it("★ the profile switches: 1,200 attended events, newest event first", async () => {
    fake = world();
    const attended = await getMyAttendedEvents();

    expect(attended).toHaveLength(1200);
    expect(attended[0].id).toBe(uuid("e", 0));
    expect(attended.at(-1)?.id).toBe(uuid("e", 1199));
    expect(attended.every((a) => a.shownOnProfile)).toBe(true);
    expectChunked(fake.requests);
  });

  it("★ the public profile's attended covers re-prove the gates over 1,000 events, no id list in one URL", async () => {
    fake = world();
    const events = Array.from({ length: 1000 }, (_, i) => ({
      id: uuid("e", i),
      name: `Event ${i}`,
      event_date: null,
    }));
    // One event is no longer open, one its owner never chose: both lose their cover.
    fake.tables.events[5].visibility = "password";
    fake.tables.profile_shown_events = fake.tables.profile_shown_events.filter(
      (row) => row.event_id !== uuid("e", 6),
    );

    const urls = await getPublicProfileAttendedCoverUrls(ME, events);

    expect(urls.size).toBe(998);
    expect(urls.has(uuid("e", 5))).toBe(false);
    expect(urls.has(uuid("e", 6))).toBe(false);
    expectChunked(fake.requests);
    // The owner's choices are read by the owner, never by an id list.
    for (const read of fake.requests.filter((r) => r.name === "profile_shown_events")) {
      expect(read.filters.some((f) => f.op === "in")).toBe(false);
    }
  });

  it("the hosted covers take the preview when there is one", async () => {
    fake = world();
    const urls = await getPublicProfileCoverUrls([
      {
        id: uuid("e", 0),
        name: "a",
        event_date: null,
        visibility: "open",
        qr_token: "q",
        custom_slug: null,
      },
      {
        id: uuid("e", 1),
        name: "b",
        event_date: null,
        visibility: "open",
        qr_token: "q",
        custom_slug: null,
      },
      {
        id: uuid("e", 2),
        name: "c",
        event_date: null,
        visibility: "private",
        qr_token: "q",
        custom_slug: null,
      },
    ]);
    expect([...urls]).toEqual([
      [uuid("e", 0), "signed:preview-0"],
      [uuid("e", 1), "signed:original-1"],
    ]);
  });
});
