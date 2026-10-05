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
 *
 * ★ RESHAPED ON PURPOSE (crumbs-15, 2026-09-29; scar kept: the size of every read). These worlds left the block
 * functions (`event_blocked_guest_ids`, `blocked_events_for`) unregistered, and the runtime seam read a missing
 * function as "nobody is blocked". The migration is applied and the seam went, so a missing function is an
 * error like any other; each world now registers the function's honest answer, which is still nobody blocked.
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
  getRequestAuth: async () => ({
    supabase: asSupabase(fake),
    user: { id: ME },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const {
  countMyGuestEventCards,
  countWaitingGuestShots,
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
    const out: Record<
      string,
      { preview_key: string | null; original_key: string }
    > = {};
    const newest = [...(fakeDb.tables.media ?? [])].sort((a, b) =>
      String(b.created_at).localeCompare(String(a.created_at)),
    );
    for (const m of newest) {
      const id = m.event_id as string;
      if (!wanted.has(id) || out[id]) continue;
      if (m.status !== "approved" || m.type !== "photo" || m.removed_at)
        continue;
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
      rpc: { event_blocked_guest_ids: () => [] },
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
    expect(
      fake.requests.every((r) => r.filters.every((f) => f.op !== "in")),
    ).toBe(true);
  });

  // ★ THE DEVELOP (20261002200000): a guest whose only approved upload waits for the develop is nobody's guest yet,
  // on the hub as on the album; one whose upload developed by the clock is (its row reads visible at once).
  it("★ a sealed upload makes nobody a guest yet; a developed one does", async () => {
    const EVENT = uuid("e", 2);
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    const row = (n: number, sealed_until: string | null) => ({
      id: uuid("m", n),
      event_id: EVENT,
      status: "approved",
      guest_id: uuid("g", n),
      sealed_until,
    });
    fake = createFakePostgrest({
      rpc: { event_blocked_guest_ids: () => [] },
      tables: {
        events: [{ id: EVENT, host_id: "host-1", deleted_at: null }],
        media: [row(1, null), row(2, tomorrow), row(3, yesterday)],
        guests: [1, 2, 3].map((n) => ({
          id: uuid("g", n),
          event_id: EVENT,
          user_id: null,
          display_name: `Guest ${n}`,
          verified_at: null,
        })),
      },
    });

    const guests = await getEventGuests(EVENT);
    const names = guests.unverifiedRows.map((r) => r.displayName).sort();
    expect(names).toEqual(["Guest 1", "Guest 3"]);
  });
});

// ★ WHAT A SEALED ALBUM HOLDS FOR ITS GUESTS (crumbs-81): the one count `getEventGuests` cannot give, since a sealed
// upload makes nobody a guest yet. The Guests room says "Nobody has added photos yet" to a host whose guests have
// filled a roll, unless this number tells it otherwise.
describe("countWaitingGuestShots: the shots a sealed album holds for its guests", () => {
  const EVENT = uuid("e", 7);
  const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString();
  const yesterday = () => new Date(Date.now() - 86_400_000).toISOString();
  const shot = (n: number, over: Record<string, unknown> = {}) => ({
    id: uuid("m", n),
    event_id: EVENT,
    status: "approved",
    guest_id: uuid("g", n),
    sealed_until: tomorrow(),
    ...over,
  });

  it("★ counts a guest's approved shots still under their seal in this event, and nothing else", async () => {
    fake = createFakePostgrest({
      tables: {
        media: [
          shot(1),
          shot(2),
          // Open (never sealed) and developed by the clock (its seal passed, no write has cleared it yet): nobody waits.
          shot(3, { sealed_until: null }),
          shot(4, { sealed_until: yesterday() }),
          // Held, hidden and removed wait for the host, or for nothing: Review's, or nobody's.
          shot(5, { status: "pending" }),
          shot(6, { status: "hidden" }),
          shot(7, { status: "removed" }),
          // The host's own upload seals with everyone's and is no guest's.
          shot(8, { guest_id: null }),
          // Another event's.
          shot(9, { event_id: uuid("e", 8) }),
        ],
      },
    });
    await expect(countWaitingGuestShots(EVENT)).resolves.toBe(2);
  });

  it("★ is a head count, one request, no row or id travelling: a number rides out, never a shot", async () => {
    fake = createFakePostgrest({ tables: { media: [shot(1), shot(2)] } });
    await countWaitingGuestShots(EVENT);
    const reads = fake.requests.filter((r) => r.name === "media");
    expect(reads).toHaveLength(1);
    expect(reads[0].method).toBe("HEAD");
    expect(reads[0].returned).toBe(0);
    // Asked of the sealed rows themselves, null-safe (an unsealed row compares false), never a NOT of the visible one.
    expect(reads[0].filters).toEqual(
      expect.arrayContaining([
        { column: "event_id", op: "eq", value: EVENT },
        { column: "status", op: "eq", value: "approved" },
        { column: "sealed_until", op: "gt", value: expect.any(String) },
      ]),
    );
  });

  it("★ counts past PostgREST's 1,000-row cut: the count is the database's, not a page's", async () => {
    fake = createFakePostgrest({
      tables: {
        media: Array.from({ length: 2500 }, (_, i) => shot(i + 1)),
      },
    });
    await expect(countWaitingGuestShots(EVENT)).resolves.toBe(2500);
  });

  it("answers zero for an album nothing waits in", async () => {
    fake = createFakePostgrest({
      tables: { media: [shot(1, { sealed_until: null })] },
    });
    await expect(countWaitingGuestShots(EVENT)).resolves.toBe(0);
  });

  it("★ throws for a read that failed, never a confident zero (the room would say nobody had added a photo)", async () => {
    fake = createFakePostgrest({ tables: {} });
    await expect(countWaitingGuestShots(EVENT)).rejects.toThrow(
      /social: waiting guest shots/,
    );
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
    db.functions.blocked_events_for = () => ({});
    return db;
  }

  it("★ Guest cards: 1,200 events, every host named, every cover, the covers in one request", async () => {
    fake = world();
    const cards = await getMyGuestEventCards();

    expect(cards).toHaveLength(1200);
    expect(cards.every((c) => c.byline?.startsWith("Hosted by Person"))).toBe(
      true,
    );
    expect(cards.every((c) => c.coverUrl !== null)).toBe(true);
    // The newest upload per event decides its cover: uploads 0..1199 are the newest, the even ones
    // carry a preview.
    const covered = new Map(cards.map((c) => [c.eventId, c.coverUrl]));
    expect(covered.get(uuid("e", 0))).toBe("signed:preview-0");
    expect(covered.get(uuid("e", 1))).toBe("signed:original-1");
    expect(fake.requests.filter((r) => r.name === "event_covers")).toHaveLength(
      1,
    );
    expectChunked(fake.requests);
  });

  /**
   * ★ THE COUNT IS THE CARDS' NUMBER, COUNTED, NEVER BUILT (compute-reads). `/welcome` asks only whether the account
   * holds a Guest card, and built every card (its hosts, a covers request and a presign each, its gates) to read the
   * list's length. The count reads the same candidates and counts what the cards' own events read would keep, in the
   * database, with no card made.
   */
  it("★ counts the same 1,200 cards without making one: no host, cover or gate read for it", async () => {
    fake = world();
    const counted = await countMyGuestEventCards();
    expect(counted).toBe(1200);

    const names = fake.requests.map((r) => `${r.method} ${r.name}`);
    // The candidates (the uploads, the blocks) and the events counted in chunks; never a card's own reads.
    expect(names.filter((n) => n.includes("profiles"))).toEqual([]);
    expect(names.filter((n) => n.includes("event_covers"))).toEqual([]);
    const events = fake.requests.filter((r) => r.name === "events");
    expect(events.length).toBeGreaterThan(0);
    // Each is a head count: no event row travels for a number (so no gate is read either, which is a read of rows).
    expect(events.every((r) => r.method === "HEAD" && r.returned === 0)).toBe(
      true,
    );
    expectChunked(fake.requests);
  });

  it("★ and it is the list's length in every world: a hosted event, a deleted one and a blocked one's kept card", async () => {
    const db = world();
    // 10 of the events are hers (a guest's card is somebody else's album), 10 are deleted, and one that blocked
    // her keeps its card though her upload there is gone.
    for (let i = 0; i < 10; i++) db.tables.events[i].host_id = ME;
    for (let i = 10; i < 20; i++) db.tables.events[i].deleted_at = at(50);
    db.tables.events.push({
      id: uuid("e", 5000),
      name: "Blocked party",
      event_date: null,
      visibility: "private",
      qr_token: "qr-blocked",
      host_id: uuid("h", 1),
      deleted_at: null,
      show_guest_list: true,
      created_at: at(80_000),
    });
    db.functions.blocked_events_for = () => ({
      [uuid("e", 5000)]: {
        own: true,
        last_upload_at: at(2000),
        profile_eligible: false,
      },
    });
    fake = db;

    const cards = await getMyGuestEventCards();
    const counted = await countMyGuestEventCards();

    expect(cards).toHaveLength(1200 - 20 + 1);
    expect(counted).toBe(cards.length);
  });

  it("is zero, with no event counted, when the account holds no upload and no block", async () => {
    fake = createFakePostgrest({ tables: { media: [], events: [] } });
    fake.functions.blocked_events_for = () => ({});
    expect(await countMyGuestEventCards()).toBe(0);
    expect(fake.requests.filter((r) => r.name === "events")).toEqual([]);
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

    const { covers: urls, videoOnly } = await getPublicProfileAttendedCoverUrls(
      ME,
      events,
    );

    expect(urls.size).toBe(998);
    expect(urls.has(uuid("e", 5))).toBe(false);
    expect(urls.has(uuid("e", 6))).toBe(false);
    // A gate that dropped an event says nothing about what its album holds.
    expect(videoOnly.size).toBe(0);
    // The attended arm's covers are the small preview too, the original only without one.
    expect(urls.get(uuid("e", 0))).toBe("signed:preview-0");
    expect(urls.get(uuid("e", 1))).toBe("signed:original-1");
    expectChunked(fake.requests);
    // The owner's choices are read by the owner, never by an id list.
    for (const read of fake.requests.filter(
      (r) => r.name === "profile_shown_events",
    )) {
      expect(read.filters.some((f) => f.op === "in")).toBe(false);
    }
  });

  it("★ an attended party whose gates all hold and whose album is all video is named, never covered", async () => {
    fake = world();
    // Event 7's approved uploads become video: the owner is still a guest there (gate 4 holds), and
    // `event_covers` (photo only) leaves it out, so its card wears the all-video face.
    for (const m of fake.tables.media) {
      if (m.event_id === uuid("e", 7)) m.type = "video";
    }
    // Event 8 is all video too, but its owner never chose it: no gate holds, so nothing is said.
    for (const m of fake.tables.media) {
      if (m.event_id === uuid("e", 8)) m.type = "video";
    }
    fake.tables.profile_shown_events = fake.tables.profile_shown_events.filter(
      (row) => row.event_id !== uuid("e", 8),
    );
    const events = [7, 8, 9].map((i) => ({
      id: uuid("e", i),
      name: `Event ${i}`,
      event_date: null,
    }));

    const { covers: urls, videoOnly } = await getPublicProfileAttendedCoverUrls(
      ME,
      events,
    );

    expect([...videoOnly]).toEqual([uuid("e", 7)]);
    expect(urls.has(uuid("e", 7))).toBe(false);
    expect(urls.has(uuid("e", 8))).toBe(false);
    expect(urls.get(uuid("e", 9))).toBe("signed:original-9");
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
