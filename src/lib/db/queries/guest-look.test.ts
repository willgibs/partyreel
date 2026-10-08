import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

/**
 * A PERSON'S PHOTOGRAPHS, AND WHAT THE ROOM SAYS OF EACH (guests-room r1): the reads behind the Guests room's counts and
 * its quiet fold, and behind the card's strip and See all. What is pinned is who may read (the host proves herself; a
 * stranger reads nothing, and `guests` is never touched for her), whom a person is (an account once, however many
 * tickets; a typed ticket alone; a photograph's sender), what is shown (approved and visible, never held, hidden or
 * sealed), and that every read reaches its last row.
 */

vi.mock("server-only", () => ({}));

const world = vi.hoisted(() => ({
  admin: null as unknown,
  rls: null as unknown,
  user: null as { id: string } | null,
  blocked: new Set<string>(),
  barred: new Set<string>(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => world.admin,
}));
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ supabase: world.rls, user: world.user }),
}));
vi.mock("@/lib/db/queries/event-blocks", () => ({
  getBlockedGuestIds: async () => world.blocked,
}));
vi.mock("@/lib/db/queries/social", () => ({
  getBlockedAmong: async (_viewer: string, ids: readonly string[]) =>
    new Set(ids.filter((id) => world.barred.has(id))),
}));

const {
  readAlbumLook,
  readHostGuestFacts,
  readHostLook,
  readHostRelations,
  readLookPage,
  readQuietCards,
  resolveLookRows,
} = await import("./guest-look");

const HOST = "00000000-0000-4000-8000-0000000000aa";
const EVENT = "00000000-0000-4000-8000-0000000000e1";
const OTHER_EVENT = "00000000-0000-4000-8000-0000000000e2";

/** A timestamp in the raw shape Postgres returns, `n` minutes past six. */
const at = (n: number) =>
  `2026-10-03T18:${String(n).padStart(2, "0")}:00.000000+00:00`;

/** One ticket. */
const ticket = (over: FakeRow): FakeRow => ({
  event_id: EVENT,
  user_id: null,
  verified_at: null,
  admission: "in",
  display_name: null,
  ...over,
});

let n = 0;
/** One upload, approved and visible unless it says otherwise. */
const shot = (guestId: string | null, over: FakeRow = {}): FakeRow => {
  n += 1;
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    event_id: EVENT,
    guest_id: guestId,
    type: "photo",
    status: "approved",
    sealed_until: null,
    width: 4,
    height: 3,
    duration_seconds: null,
    created_at: at(n % 60),
    ...over,
  };
};

let admin: FakePostgrest;
let rls: FakePostgrest;

function seed(tables: { guests?: FakeRow[]; media?: FakeRow[] }) {
  const events = [
    { id: EVENT, host_id: HOST, deleted_at: null },
    { id: OTHER_EVENT, host_id: "someone-else", deleted_at: null },
  ];
  admin = createFakePostgrest({
    tables: {
      events,
      guests: tables.guests ?? [],
      media: tables.media ?? [],
      profiles: [],
      user_follows: [],
    },
  });
  // The host's own RLS read: her event's rows, and nobody else's.
  rls = createFakePostgrest({
    tables: {
      media: (tables.media ?? []).filter((m) => m.event_id === EVENT),
      user_follows: [],
    },
  });
  world.admin = asSupabase(admin);
  world.rls = asSupabase(rls);
}

beforeEach(() => {
  n = 0;
  world.user = { id: HOST };
  world.blocked = new Set();
  world.barred = new Set();
  seed({});
});

describe("readHostGuestFacts: what the room says of each person", () => {
  it("★ a signed-in viewer who is not the host gets nothing, and `guests` is never read", async () => {
    seed({ guests: [ticket({ id: "g1", display_name: "Sam" })] });
    world.user = { id: "a-stranger" };
    const facts = await readHostGuestFacts(EVENT);
    expect(facts.added.size).toBe(0);
    expect(facts.quiet).toEqual({ accounts: [], rows: [] });
    expect(admin.requests.some((r) => r.name === "guests")).toBe(false);
    expect(rls.requests).toHaveLength(0);
  });

  it("signed out, or another host's event: nothing either", async () => {
    world.user = null;
    expect((await readHostGuestFacts(EVENT)).added.size).toBe(0);
    world.user = { id: HOST };
    expect((await readHostGuestFacts(OTHER_EVENT)).added.size).toBe(0);
  });

  it("★ counts a confirmed guest once across her tickets, a typed name by its own ticket, by kind, since the first", async () => {
    seed({
      guests: [
        ticket({ id: "t-ana-1", user_id: "u-ana", verified_at: at(1) }),
        ticket({ id: "t-ana-2", user_id: "u-ana", verified_at: at(2) }),
        ticket({ id: "t-sam", display_name: "Sam" }),
      ],
      media: [
        shot("t-ana-1", { created_at: at(30) }),
        shot("t-ana-2", { created_at: at(10), type: "video" }),
        shot("t-ana-2", { created_at: at(40) }),
        shot("t-sam", { created_at: at(20) }),
      ],
    });
    const { added } = await readHostGuestFacts(EVENT);
    expect(added.get("u-ana")).toEqual({
      photos: 2,
      videos: 1,
      firstAt: at(10),
    });
    expect(added.get("t-sam")).toEqual({
      photos: 1,
      videos: 0,
      firstAt: at(20),
    });
    expect(added.has("t-ana-1")).toBe(false);
  });

  it("★ counts only what the album shows: never held, hidden, removed or sealed", async () => {
    seed({
      guests: [ticket({ id: "t-sam", display_name: "Sam" })],
      media: [
        shot("t-sam"),
        shot("t-sam", { status: "pending" }),
        shot("t-sam", { status: "hidden" }),
        shot("t-sam", { status: "removed" }),
        shot("t-sam", { sealed_until: "2999-01-01T00:00:00.000000+00:00" }),
        // A seal whose time has passed has developed: shown.
        shot("t-sam", { sealed_until: "2001-01-01T00:00:00.000000+00:00" }),
      ],
    });
    const { added } = await readHostGuestFacts(EVENT);
    expect(added.get("t-sam")?.photos).toBe(2);
  });

  it("leaves out the host's own tickets and the ones a block holds", async () => {
    world.blocked = new Set(["t-blocked"]);
    seed({
      guests: [
        ticket({ id: "t-host", user_id: HOST, verified_at: at(1) }),
        ticket({ id: "t-blocked", display_name: "Ray" }),
      ],
      media: [shot("t-host"), shot("t-blocked")],
    });
    const facts = await readHostGuestFacts(EVENT);
    expect(facts.added.size).toBe(0);
    expect(facts.quiet).toEqual({ accounts: [], rows: [] });
  });

  it("★ holds the people in with nothing the album shows: an account once, a named typed ticket, never a nameless one", async () => {
    world.blocked = new Set(["t-blocked"]);
    seed({
      guests: [
        // In, nothing added: let in at the door, confirmed on two phones.
        ticket({ id: "t-dev-1", user_id: "u-dev", verified_at: at(1) }),
        ticket({ id: "t-dev-2", user_id: "u-dev", verified_at: at(2) }),
        // In with a typed name, nothing added.
        ticket({ id: "t-nina", display_name: " Nina " }),
        // A nameless ticket names nobody.
        ticket({ id: "t-nameless" }),
        // Still at the door: At the door's, not this fold's.
        ticket({
          id: "t-waiting",
          user_id: "u-tom",
          verified_at: at(3),
          admission: "waiting",
        }),
        // A typed ticket of someone proved here is that person's.
        ticket({ id: "t-ana-typed", user_id: "u-ana", display_name: "Ana" }),
        ticket({ id: "t-ana", user_id: "u-ana", verified_at: at(4) }),
        // Only held uploads: nothing the album shows, so in with nothing yet.
        ticket({ id: "t-held", display_name: "Held" }),
        // The host's own ticket, and a blocked one.
        ticket({ id: "t-host", user_id: HOST, verified_at: at(5) }),
        ticket({ id: "t-blocked", display_name: "Ray" }),
      ],
      media: [shot("t-ana"), shot("t-held", { status: "pending" })],
    });
    const { quiet } = await readHostGuestFacts(EVENT);
    expect(quiet.accounts).toEqual(["u-dev"]);
    // In the tickets' own order (the room sorts them by name).
    expect(quiet.rows).toEqual([
      { guestId: "t-held", name: "Held" },
      { guestId: "t-nina", name: "Nina" },
    ]);
  });

  it("★ reads a big party's album and tickets whole, past PostgREST's 1,000-row cut", async () => {
    const guests = Array.from({ length: 1500 }, (_, i) =>
      ticket({ id: `t-${String(i).padStart(5, "0")}`, display_name: `G${i}` }),
    );
    const media = Array.from({ length: 2500 }, (_, i) =>
      shot(`t-${String(i % 1500).padStart(5, "0")}`),
    );
    seed({ guests, media });
    const { added } = await readHostGuestFacts(EVENT);
    const total = [...added.values()].reduce((s, a) => s + a.photos, 0);
    expect(total).toBe(2500);
    expect(added.size).toBe(1500);
    expect(rls.requests.every((r) => !r.failed)).toBe(true);
  });
});

describe("resolveLookRows: whose tickets a name stands for", () => {
  beforeEach(() => {
    seed({
      guests: [
        ticket({ id: "t-ana-1", user_id: "u-ana", verified_at: at(1) }),
        ticket({ id: "t-ana-2", user_id: "u-ana", verified_at: at(2) }),
        // Her typed ticket from before she proved it: no part of her account's photographs here.
        ticket({ id: "t-ana-typed", user_id: "u-ana", display_name: "Ana" }),
        ticket({ id: "t-sam", display_name: "Sam" }),
        ticket({ id: "t-host", user_id: HOST, verified_at: at(3) }),
        ticket({ id: "t-elsewhere", event_id: OTHER_EVENT, display_name: "X" }),
      ],
      media: [
        shot("t-ana-1", { id: "00000000-0000-4000-8000-0000000000m1" }),
        shot(null, { id: "00000000-0000-4000-8000-0000000000m2" }),
      ],
    });
  });

  it.each([
    [
      "an account: its proved tickets",
      { kind: "account", userId: "u-ana" },
      ["t-ana-1", "t-ana-2"],
    ],
    ["a typed ticket: itself", { kind: "row", guestId: "t-sam" }, ["t-sam"]],
    [
      "a proved ticket: its account's proved tickets",
      { kind: "row", guestId: "t-ana-2" },
      ["t-ana-1", "t-ana-2"],
    ],
    [
      "a photograph: its sender's",
      { kind: "media", mediaId: "00000000-0000-4000-8000-0000000000m1" },
      ["t-ana-1", "t-ana-2"],
    ],
  ] as const)("%s", async (_label, who, rows) => {
    expect(await resolveLookRows(EVENT, who, HOST)).toEqual(rows);
  });

  it.each([
    ["the host's own account", { kind: "account", userId: HOST }],
    ["the host's own ticket", { kind: "row", guestId: "t-host" }],
    [
      "the host's own upload (no ticket)",
      { kind: "media", mediaId: "00000000-0000-4000-8000-0000000000m2" },
    ],
    ["another event's ticket", { kind: "row", guestId: "t-elsewhere" }],
    ["an account with no ticket here", { kind: "account", userId: "u-nobody" }],
  ] as const)("is nobody's here: %s", async (_label, who) => {
    expect(await resolveLookRows(EVENT, who, HOST)).toBeNull();
  });
});

describe("readLookPage: a page of their photographs", () => {
  it("★ newest first, by kind, a page at a time, the cursor resuming exactly where it left", async () => {
    const media = Array.from({ length: 30 }, (_, i) =>
      shot(i % 2 ? "t-a" : "t-b", {
        created_at: at(i),
        type: i === 7 ? "video" : "photo",
      }),
    );
    // Two at one instant: the id decides, the page's own order.
    media.push(shot("t-a", { created_at: at(29) }));
    seed({ media });
    const first = await readLookPage(asSupabase(admin), EVENT, ["t-a", "t-b"], {
      after: null,
      limit: 24,
    });
    expect(first.photos).toBe(30);
    expect(first.videos).toBe(1);
    expect(first.rows).toHaveLength(24);
    expect(first.next).not.toBeNull();
    const second = await readLookPage(
      asSupabase(admin),
      EVENT,
      ["t-a", "t-b"],
      {
        after: first.next,
        limit: 24,
      },
    );
    expect(second.rows).toHaveLength(7);
    expect(second.next).toBeNull();
    const ids = [...first.rows, ...second.rows].map((r) => r.id);
    expect(new Set(ids).size).toBe(31);
    // Newest first throughout.
    const times = [...first.rows, ...second.rows].map((r) => r.createdAt);
    expect([...times].sort().reverse()).toEqual(times);
  });

  it("shows only what the album shows of theirs", async () => {
    seed({
      media: [
        shot("t-a"),
        shot("t-a", { status: "hidden" }),
        shot("t-a", { sealed_until: "2999-01-01T00:00:00.000000+00:00" }),
        shot("t-other"),
      ],
    });
    const page = await readLookPage(asSupabase(admin), EVENT, ["t-a"], {
      after: null,
      limit: 4,
    });
    expect(page.rows).toHaveLength(1);
    expect(page.photos).toBe(1);
  });
});

describe("readHostLook: the host's look at one person", () => {
  beforeEach(() => {
    seed({
      guests: [ticket({ id: "t-sam", display_name: "Sam" })],
      media: [shot("t-sam"), shot("t-sam")],
    });
  });

  it("reads her own event's person on her own RLS read", async () => {
    const look = await readHostLook(
      { kind: "row", guestId: "t-sam" },
      { after: null, limit: 4 },
    );
    expect(look?.eventId).toBe(EVENT);
    expect(look?.rows).toHaveLength(2);
    expect(rls.requests.length).toBeGreaterThan(0);
  });

  it("★ a stranger's look at her guest reads nothing, the photographs never asked", async () => {
    world.user = { id: "a-stranger" };
    expect(
      await readHostLook(
        { kind: "account", eventId: EVENT, userId: "u-ana" },
        { after: null, limit: 4 },
      ),
    ).toBeNull();
    expect(rls.requests).toHaveLength(0);
  });

  it("an unknown ticket or photograph names no event, and reads nothing", async () => {
    expect(
      await readHostLook(
        { kind: "row", guestId: "t-unknown" },
        { after: null, limit: 4 },
      ),
    ).toBeNull();
    expect(
      await readHostLook(
        { kind: "media", mediaId: "00000000-0000-4000-8000-00000000dead" },
        { after: null, limit: 4 },
      ),
    ).toBeNull();
  });
});

describe("readAlbumLook: a guest's look at another guest", () => {
  it("reads what the album shows of theirs; the host is nobody's guest", async () => {
    seed({
      guests: [
        ticket({ id: "t-sam", display_name: "Sam" }),
        ticket({ id: "t-host", user_id: HOST, verified_at: at(1) }),
      ],
      media: [shot("t-sam"), shot("t-host")],
    });
    const sam = await readAlbumLook(
      EVENT,
      { kind: "row", guestId: "t-sam" },
      { after: null, limit: 4 },
    );
    expect(sam?.rows).toHaveLength(1);
    expect(
      await readAlbumLook(
        EVENT,
        { kind: "account", userId: HOST },
        { after: null, limit: 4 },
      ),
    ).toBeNull();
  });
});

describe("the room's people: their cards and her relations", () => {
  it("★ reads exactly the four public card columns, never the account's email beside them", async () => {
    admin.tables.profiles = [
      {
        id: "u-dev",
        display_name: "Dev",
        slug: null,
        avatar_updated_at: null,
        email: "dev@example.com",
      },
    ];
    const cards = await readQuietCards(["u-dev"]);
    expect(cards).toEqual([
      { id: "u-dev", displayName: "Dev", slug: null, avatarMarker: null },
    ]);
    const read = admin.requests.find((r) => r.name === "profiles");
    expect(decodeURIComponent(read?.url ?? "")).toContain(
      "select=id,display_name,slug,avatar_updated_at",
    );
    expect(JSON.stringify(cards)).not.toContain("dev@example.com");
  });

  it("answers whom she follows and whom a block parts from her, only of the ids asked", async () => {
    rls.tables.user_follows = [
      { follower_id: HOST, followee_id: "u-a" },
      { follower_id: HOST, followee_id: "u-not-asked" },
      { follower_id: "someone", followee_id: "u-b" },
    ];
    world.barred = new Set(["u-b", "u-not-asked"]);
    expect(await readHostRelations(["u-a", "u-b"])).toEqual({
      following: ["u-a"],
      barred: ["u-b"],
    });
    world.user = null;
    expect(await readHostRelations(["u-a"])).toEqual({
      following: [],
      barred: [],
    });
  });
});
