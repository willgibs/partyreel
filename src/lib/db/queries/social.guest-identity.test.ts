/**
 * THE GUEST LIST'S UNION, THE HOST'S CARD, THE ONE COUNT AND THE EVENTS YOU ADDED TO (the identity
 * reshape, 2026-09-21; guest by upload, 2026-09-22).
 *
 * Reads a guest's browser or a host's page will see the output of, so each is pinned on what it
 * SELECTS, how it FILTERS and what it refuses to return, not just on its happy path:
 *
 *   - `getEventGuestList` now lists named guests who proved no email, beside the profile cards.
 *     The rule that has to hold is wave 0's finding: an UNCONFIRMED account carries a `user_id`,
 *     so "has a user id" must never be what promotes someone into the profile half of the list.
 *   - `getHostCard` hands a guest four public fields off a `profiles` row whose neighbours are the
 *     host's email, tier and storage. The column list IS the allow-list, so the test reads it.
 *
 * A recording fake stands in for the query builder: the thing worth pinning is the exact
 * PostgREST shape, which no amount of type-checking verifies.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/r2/presign", () => ({ presignDownload: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/request-auth", () => ({ getRequestAuth: vi.fn() }));
vi.mock("@/lib/observability/sentry", () => ({ captureError: vi.fn() }));
vi.mock("@/lib/supabase/avatar-storage", () => ({
  getAvatarUrl: (id: string, marker: string | null) =>
    Promise.resolve(marker ? `https://cdn/avatars/${id}?v=${marker}` : null),
}));

type Row = Record<string, unknown>;

/** What each table answers, what each table was asked for, and every filter each query applied. */
const answers: Record<string, Row[]> = {};
const selected: Record<string, string> = {};
const filters: Record<string, [string, ...unknown[]][]> = {};

function builderFor(table: string) {
  const result = () => {
    const data = answers[table] ?? [];
    return { data, count: data.length, error: null };
  };
  const record =
    (method: string) =>
    (...args: unknown[]) => {
      (filters[table] ??= []).push([method, ...args]);
      return builder;
    };
  const builder = {
    select(columns: string) {
      selected[table] = columns;
      return builder;
    },
    eq: record("eq"),
    neq: record("neq"),
    in: record("in"),
    is: record("is"),
    not: record("not"),
    order: () => builder,
    range: () => builder,
    maybeSingle: () =>
      Promise.resolve({ data: result().data[0] ?? null, error: null }),
    then: (
      resolve: (value: { data: Row[]; count: number; error: null }) => unknown,
    ) => Promise.resolve(result()).then(resolve),
  };
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: (table: string) => builderFor(table) }),
}));

const { getRequestAuth } = await import("@/lib/supabase/request-auth");
const { presignDownload } = await import("@/lib/r2/presign");
const {
  getEventGuestList,
  getEventGuests,
  getHostCard,
  getMyAttendedEvents,
  getMyGuestEventCards,
} = await import("@/lib/db/queries/social");

const EVENT = "event-1";

beforeEach(() => {
  for (const key of Object.keys(answers)) delete answers[key];
  for (const key of Object.keys(selected)) delete selected[key];
  for (const key of Object.keys(filters)) delete filters[key];
  answers.events = [{ show_guest_list: true, host_id: "host-1" }];
  answers.media = [];
  answers.guests = [];
  answers.profiles = [];
});

describe("getEventGuestList: the host key still decides", () => {
  it("returns null when the key is off, whether or not unverified names are asked for", async () => {
    answers.events = [{ show_guest_list: false }];
    await expect(getEventGuestList(EVENT)).resolves.toBeNull();
    await expect(
      getEventGuestList(EVENT, { includeUnverified: true }),
    ).resolves.toBeNull();
  });
});

describe("getEventGuestList: who counts as verified", () => {
  beforeEach(() => {
    answers.guests = [
      // Proved an email: a profile card.
      {
        id: "g-verified",
        user_id: "u1",
        display_name: null,
        verified_at: "2026-09-21T15:00:00Z",
      },
      // ★ A user id and a typed name, and NOTHING proved. The row wave 0 warned about.
      {
        id: "g-unconfirmed",
        user_id: "u2",
        display_name: "Maya J.",
        verified_at: null,
      },
      // A name-only guest, no account at all.
      { id: "g-named", user_id: null, display_name: "Theo", verified_at: null },
      // Minted before the reshape: nothing to list.
      {
        id: "g-nameless",
        user_id: null,
        display_name: null,
        verified_at: null,
      },
    ];
    answers.media = [
      { guest_id: "g-verified" },
      { guest_id: "g-unconfirmed" },
      { guest_id: "g-named" },
      { guest_id: "g-nameless" },
    ];
    answers.profiles = [
      { id: "u1", display_name: "Alex", slug: "alex", avatar_updated_at: null },
    ];
  });

  it("★ an UNCONFIRMED account is never a profile card, even though it has a user_id", async () => {
    const list = await getEventGuestList(EVENT, { includeUnverified: true });
    expect(list?.filter((e) => !("kind" in e)).map((e) => e.id)).toEqual([
      "u1",
    ]);
  });

  it("appends the named-but-unproven AFTER the cards, one entry per guest row", async () => {
    const list = await getEventGuestList(EVENT, { includeUnverified: true });
    expect(list).toEqual([
      { id: "u1", displayName: "Alex", slug: "alex", avatarMarker: null },
      { kind: "unverified", id: "g-unconfirmed", displayName: "Maya J." },
      { kind: "unverified", id: "g-named", displayName: "Theo" },
    ]);
  });

  it("a nameless legacy row is listed by neither half", async () => {
    const list = await getEventGuestList(EVENT, { includeUnverified: true });
    expect(JSON.stringify(list)).not.toContain("g-nameless");
  });

  it("the DEFAULT is unchanged: profile cards only, so the host hub keeps its narrow list", async () => {
    const list = await getEventGuestList(EVENT);
    expect(list).toEqual([
      { id: "u1", displayName: "Alex", slug: "alex", avatarMarker: null },
    ]);
  });

  it("reads the identity columns the rule needs (they are admin-only, QA #41)", async () => {
    await getEventGuestList(EVENT, { includeUnverified: true });
    expect(selected.guests).toBe("id, user_id, display_name, verified_at");
  });

  /* ★ AND NOT ONE COLUMN MORE (the guest identity round, Will 2026-09-22). `guests` now carries
     `pending_email`: an address a guest TYPED at the door that nobody has proved. His ruling makes
     it inert — "there's no impersonation risk if the host can't see the attributed email of an
     unconfirmed account" — and this read feeds the host's OWN album page. It is outside the host's
     PostgREST column grant as a belt, but this query runs on the ADMIN client, which the grant does
     not bind, so the SELECT above is the only thing standing between the column and the host. */
  it("★ the guest-list SELECT carries no address of any kind", async () => {
    await getEventGuestList(EVENT, { includeUnverified: true });
    for (const forbidden of ["pending_email", "email"]) {
      expect(selected.guests, forbidden).not.toContain(forbidden);
    }
  });
});

describe("getEventGuestList: an approved photograph is still the price of a place", () => {
  it("leaves out a guest with nothing approved, verified or not", async () => {
    answers.guests = [
      {
        id: "g1",
        user_id: "u1",
        display_name: null,
        verified_at: "2026-09-21T15:00:00Z",
      },
      { id: "g2", user_id: null, display_name: "Theo", verified_at: null },
    ];
    answers.media = []; // nothing approved
    answers.profiles = [
      { id: "u1", display_name: "Alex", slug: null, avatar_updated_at: null },
    ];
    await expect(
      getEventGuestList(EVENT, { includeUnverified: true }),
    ).resolves.toEqual([]);
  });
});

/* ────────────────────────────────────────────────────────────────────────────
   THE MODULE-WIDE ADDRESS BAN (the guest identity round, 2026-09-22).

   Every read in queries/social.ts either feeds a public profile, a host surface or another guest's
   view; none of them is the guest's own menu, which is the ONLY place an unproved address is ever
   shown. A source-level pin is what holds that for the reads this fake does not exercise.
   ──────────────────────────────────────────────────────────────────────────── */
describe("queries/social.ts never reads the unproved address", () => {
  it("★ names `pending_email` nowhere outside a comment", () => {
    const code = readFileSync(
      join(process.cwd(), "src/lib/db/queries/social.ts"),
      "utf8",
    )
      .split("\n")
      .filter((line) => !/^\s*(\/\/|\/\*|\*)/.test(line))
      .join("\n");
    for (const forbidden of ["pending_email", "pendingEmail"]) {
      expect(code, forbidden).not.toContain(forbidden);
    }
  });
});

describe("getHostCard: four public fields and no fifth", () => {
  beforeEach(() => {
    answers.profiles = [
      {
        id: "host-1",
        slug: "will",
        display_name: "Will Gibson",
        avatar_updated_at: "2026-09-01T00:00:00Z",
      },
    ];
  });

  it("returns exactly id, slug, displayName and a resolved avatar url", async () => {
    await expect(getHostCard(EVENT)).resolves.toEqual({
      id: "host-1",
      slug: "will",
      displayName: "Will Gibson",
      avatarUrl: "https://cdn/avatars/host-1?v=2026-09-01T00:00:00Z",
    });
  });

  it("★ the SELECT is the allow-list: never a star, never the private columns", async () => {
    await getHostCard(EVENT);
    expect(selected.profiles).toBe("id, slug, display_name, avatar_updated_at");
    expect(selected.profiles).not.toContain("*");
    for (const secret of ["email", "tier", "storage", "stripe"]) {
      expect(selected.profiles).not.toContain(secret);
    }
  });

  it("null for a deleted event or a host with no profile row", async () => {
    answers.events = [];
    await expect(getHostCard(EVENT)).resolves.toBeNull();
    answers.events = [{ host_id: "host-1" }];
    answers.profiles = [];
    await expect(getHostCard(EVENT)).resolves.toBeNull();
  });
});

/* ────────────────────────────────────────────────────────────────────────────
   THE ONE COUNT (guest by upload, Will 2026-09-22: "Uploaded 1 photo? You're a guest."). The hub's
   Guests card, the hub's header, the album's header and the guest list all read `getEventGuests`,
   so what is pinned is HOW it reads (keyed on the event, never an id list that grows with the
   party) and WHO it returns. Who counts, row by row, is the pure resolver's own contract
   (lib/events/event-guests.test.ts).
   ──────────────────────────────────────────────────────────────────────────── */
describe("getEventGuests: two event-keyed reads, the host never counted", () => {
  beforeEach(() => {
    answers.guests = [
      {
        id: "g-host",
        user_id: "host-1",
        display_name: null,
        verified_at: "2026-09-21T15:00:00Z",
      },
      {
        id: "g-verified",
        user_id: "u1",
        display_name: null,
        verified_at: "2026-09-21T15:00:00Z",
      },
      { id: "g-named", user_id: null, display_name: "Theo", verified_at: null },
    ];
    answers.media = [
      { guest_id: "g-host" },
      { guest_id: "g-verified" },
      { guest_id: "g-named" },
    ];
  });

  it("★ keys both reads on the event, and never sends an id list that grows with the party", async () => {
    await getEventGuests(EVENT);
    expect(filters.media).toContainEqual(["eq", "event_id", EVENT]);
    expect(filters.media).toContainEqual(["eq", "status", "approved"]);
    expect(filters.guests).toContainEqual(["eq", "event_id", EVENT]);
    for (const table of ["media", "guests"]) {
      expect(
        (filters[table] ?? []).filter(([method]) => method === "in"),
        table,
      ).toEqual([]);
    }
  });

  it("returns the people, never the host, even through a row of their own", async () => {
    await expect(getEventGuests(EVENT)).resolves.toEqual({
      verifiedUserIds: ["u1"],
      unverifiedRows: [{ id: "g-named", displayName: "Theo" }],
    });
  });

  it("the guest list is the same people the count counts", async () => {
    answers.profiles = [
      { id: "u1", display_name: "Alex", slug: "alex", avatar_updated_at: null },
    ];
    const list = await getEventGuestList(EVENT, { includeUnverified: true });
    expect(list?.map((entry) => entry.id)).toEqual(["u1", "g-named"]);
  });

  it("a deleted or missing event has no guests", async () => {
    answers.events = [];
    await expect(getEventGuests(EVENT)).resolves.toEqual({
      verifiedUserIds: [],
      unverifiedRows: [],
    });
  });
});

/* ────────────────────────────────────────────────────────────────────────────
   THE EVENTS YOU ADDED TO (guest by upload, 2026-09-22: "uploading to an event is now effectively
   saving"). Both account lists read one set, the account's own live uploads: the dashboard's Guest
   cards take ANY live one, the profile switches take an APPROVED one on a PROVED row.
   ──────────────────────────────────────────────────────────────────────────── */
describe("the events you added to", () => {
  const ME = "me";

  beforeEach(() => {
    vi.mocked(getRequestAuth).mockResolvedValue({
      user: { id: ME },
      supabase: { from: (table: string) => builderFor(table) },
    } as unknown as Awaited<ReturnType<typeof getRequestAuth>>);
    vi.mocked(presignDownload).mockResolvedValue("https://cdn/signed");
  });

  it("signed out: nothing, and nothing is read", async () => {
    vi.mocked(getRequestAuth).mockResolvedValue({
      user: null,
      supabase: {},
    } as unknown as Awaited<ReturnType<typeof getRequestAuth>>);
    await expect(getMyGuestEventCards()).resolves.toEqual([]);
    await expect(getMyAttendedEvents()).resolves.toEqual([]);
    expect(filters.media).toBeUndefined();
  });

  it("★ reads the account's OWN live uploads in one query: its rows, anything but removed", async () => {
    answers.media = [];
    await getMyGuestEventCards();
    expect(selected.media).toContain("guests!media_guest_id_fkey!inner(");
    expect(filters.media).toContainEqual(["eq", "guests.user_id", ME]);
    expect(filters.media).toContainEqual(["neq", "status", "removed"]);
  });

  it("Guest cards: any live upload counts, hosted and deleted events stay out, masked, newest first", async () => {
    answers.media = [
      {
        event_id: "e-open",
        status: "approved",
        created_at: "2026-09-20T10:00:00Z",
        guests: { verified_at: null },
        original_key: "k-open",
      },
      {
        event_id: "e-pass",
        status: "pending",
        created_at: "2026-09-21T10:00:00Z",
        guests: { verified_at: null },
        original_key: "k-pass",
      },
      {
        event_id: "e-priv",
        status: "hidden",
        created_at: "2026-09-19T10:00:00Z",
        guests: { verified_at: null },
        original_key: "k-priv",
      },
    ];
    answers.events = [
      {
        id: "e-open",
        name: "Open party",
        event_date: null,
        visibility: "open",
        qr_token: "qo",
        host_id: "h1",
      },
      {
        id: "e-pass",
        name: "Password party",
        event_date: null,
        visibility: "password",
        qr_token: "qp",
        host_id: "h1",
      },
      {
        id: "e-priv",
        name: "Secret party",
        event_date: null,
        visibility: "private",
        qr_token: "qs",
        host_id: "h2",
      },
    ];
    answers.profiles = [{ id: "h1", display_name: "Maya" }];

    const cards = await getMyGuestEventCards();
    expect(filters.events).toContainEqual(["neq", "host_id", ME]);
    expect(filters.events).toContainEqual(["is", "deleted_at", null]);
    expect(cards.map((c) => c.eventId)).toEqual(["e-pass", "e-open", "e-priv"]);
    const [pass, open, priv] = cards;
    expect(open).toMatchObject({
      href: "/e/qo",
      coverUrl: "https://cdn/signed",
      byline: "Hosted by Maya",
    });
    expect(pass).toMatchObject({ href: "/e/qp", coverUrl: null, passwordProtected: true });
    expect(priv).toMatchObject({
      href: null,
      coverUrl: null,
      name: "Private event",
      byline: null,
    });
  });

  it("profile switches: only an APPROVED upload on a PROVED row can publish a line", async () => {
    answers.media = [
      {
        event_id: "e-yes",
        status: "approved",
        created_at: "2026-09-20T10:00:00Z",
        guests: { verified_at: "2026-09-20T09:00:00Z" },
      },
      {
        event_id: "e-typed-name",
        status: "approved",
        created_at: "2026-09-20T10:00:00Z",
        guests: { verified_at: null },
      },
      {
        event_id: "e-held",
        status: "pending",
        created_at: "2026-09-20T10:00:00Z",
        guests: { verified_at: "2026-09-20T09:00:00Z" },
      },
    ];
    answers.events = [];
    await getMyAttendedEvents();
    expect(filters.events).toContainEqual(["in", "id", ["e-yes"]]);
    expect(filters.events).toContainEqual(["neq", "host_id", ME]);
  });
});
