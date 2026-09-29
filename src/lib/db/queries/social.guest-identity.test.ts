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
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

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

/** What each table answers, what each table was asked for (the last SELECT, and every one), and every filter each
 *  query applied. */
const answers: Record<string, Row[]> = {};
const selected: Record<string, string> = {};
const selects: Record<string, string[]> = {};
const filters: Record<string, [string, ...unknown[]][]> = {};

function builderFor(table: string) {
  // `.in()` is the one filter the fake APPLIES (every other is only recorded): a batched read is only proved to
  // merge its batches if each batch answers its own rows and nothing else.
  let only: { column: string; values: Set<unknown> } | null = null;
  const result = () => {
    const all = answers[table] ?? [];
    const filter = only;
    const data = filter
      ? all.filter((row) => filter.values.has(row[filter.column]))
      : all;
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
      (selects[table] ??= []).push(columns);
      return builder;
    },
    eq: record("eq"),
    neq: record("neq"),
    in(column: string, values: unknown[]) {
      (filters[table] ??= []).push(["in", column, values]);
      only = { column, values: new Set(values) };
      return builder;
    },
    is: record("is"),
    not: record("not"),
    or: record("or"),
    limit: () => builder,
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

/**
 * `event_covers` as the SQL answers it, from the media the fake holds: the first approved photo outside
 * the bin per asked-for event (the covers ride the function since the 1,000-row round, 2026-09-23).
 */
function coversFor(eventIds: string[]) {
  const out: Record<
    string,
    { preview_key: string | null; original_key: string }
  > = {};
  for (const m of answers.media ?? []) {
    const id = m.event_id as string;
    if (!eventIds.includes(id) || out[id]) continue;
    if (
      m.status !== "approved" ||
      (m.type ?? "photo") !== "photo" ||
      m.removed_at
    )
      continue;
    out[id] = {
      preview_key: (m.preview_key as string | undefined) ?? null,
      original_key: (m.original_key as string | undefined) ?? "key",
    };
  }
  return out;
}

/**
 * What the per-event block's SQL answers (migration 20260928120000): the guest rows a block holds at
 * the event, and the events that hold the signed-in account, as her own lists read them. Empty by
 * default: nobody is blocked.
 */
const blocks = {
  rows: new Set<string>(),
  events: {} as Record<
    string,
    { own: boolean; last_upload_at: string | null; profile_eligible: boolean }
  >,
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => builderFor(table),
    rpc: (fn: string, args: { p_event_ids: string[] }) =>
      Promise.resolve(
        fn === "event_covers"
          ? { data: coversFor(args.p_event_ids), error: null }
          : fn === "event_blocked_guest_ids"
            ? { data: [...blocks.rows], error: null }
            : fn === "blocked_events_for"
              ? { data: blocks.events, error: null }
              : {
                  data: null,
                  error: { message: `no function ${fn}`, code: "PGRST202" },
                },
      ),
  }),
}));

const { getRequestAuth } = await import("@/lib/supabase/request-auth");
const { presignDownload } = await import("@/lib/r2/presign");
const {
  getEventGuestList,
  getEventGuests,
  getHostCard,
  getMyAttendedEventPicks,
  getMyAttendedEvents,
  getMyBlocks,
  getMyFollowing,
  getMyGuestEventCards,
} = await import("@/lib/db/queries/social");

const EVENT = "event-1";

beforeEach(() => {
  for (const key of Object.keys(answers)) delete answers[key];
  for (const key of Object.keys(selected)) delete selected[key];
  for (const key of Object.keys(selects)) delete selects[key];
  for (const key of Object.keys(filters)) delete filters[key];
  answers.events = [{ host_id: "host-1" }];
  answers.media = [];
  answers.guests = [];
  answers.profiles = [];
  blocks.rows = new Set();
  blocks.events = {};
});

describe("getEventGuestList: always on (Will, event-safety `room=always`)", () => {
  // ★ Reshaped: this pinned "the host key still decides" (null while `show_guest_list` was off). The
  // key is retired ("Always on for everyone"), so the pin is now that nothing reads it and the list
  // lists whatever the column holds.
  it("lists its guests whatever the retired column holds, and never reads it", async () => {
    answers.events = [{ show_guest_list: false, host_id: "host-1" }];
    answers.guests = [
      { id: "g-named", user_id: null, display_name: "Theo", verified_at: null },
    ];
    answers.media = [{ guest_id: "g-named" }];
    await expect(
      getEventGuestList(EVENT, { includeUnverified: true }),
    ).resolves.toEqual([
      { kind: "unverified", id: "g-named", displayName: "Theo" },
    ]);
    for (const columns of selects.events ?? []) {
      expect(columns).not.toContain("show_guest_list");
    }
  });
});

describe("the retired key is read and written by nothing (Will, `room=always`)", () => {
  /** Every source file under a directory, recursively. */
  function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) return sources(full);
      return /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)
        ? [full]
        : [];
    });
  }

  it("★ no code in the tree names `show_guest_list` or `showGuestList` outside a comment", () => {
    // The generated types keep the column until the contract migration drops it, and the Library's
    // gallery fixture is a whole `events` row of those types, so both still spell it.
    const allowed = new Set([
      "src/lib/db/types.ts",
      "src/app/(dev)/design/sandbox/gallery-fixtures.ts",
    ]);
    const naming = sources(join(process.cwd(), "src"))
      .map((file) => relative(process.cwd(), file))
      .filter((file) => !allowed.has(file))
      .filter((file) => {
        const code = readFileSync(join(process.cwd(), file), "utf8")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        return /show_guest_list|showGuestList/.test(code);
      });
    expect(naming).toEqual([]);
  });
});

describe("a person the host blocked is on no list and in no count (the per-event block)", () => {
  beforeEach(() => {
    answers.guests = [
      {
        id: "g-verified",
        user_id: "u1",
        display_name: null,
        verified_at: "2026-09-21T15:00:00Z",
      },
      { id: "g-named", user_id: null, display_name: "Theo", verified_at: null },
    ];
    answers.media = [{ guest_id: "g-verified" }, { guest_id: "g-named" }];
    answers.profiles = [
      { id: "u1", display_name: "Alex", slug: "alex", avatar_updated_at: null },
    ];
  });

  it("the rows a block holds leave before the rows become people, even with a photograph approved", async () => {
    blocks.rows = new Set(["g-named"]);
    await expect(
      getEventGuestList(EVENT, { includeUnverified: true }),
    ).resolves.toEqual([
      { id: "u1", displayName: "Alex", slug: "alex", avatarMarker: null },
    ]);
    const guests = await getEventGuests(EVENT);
    expect(guests.unverifiedRows).toEqual([]);
    expect(guests.verifiedUserIds).toEqual(["u1"]);
  });

  it("a blocked confirmed guest leaves the count too", async () => {
    blocks.rows = new Set(["g-verified"]);
    const guests = await getEventGuests(EVENT);
    expect(guests.verifiedUserIds).toEqual([]);
    expect(guests.unverifiedRows).toEqual([
      { id: "g-named", displayName: "Theo" },
    ]);
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
     `pending_email`: an address a guest TYPED at the door that nobody has proved. It is kept
     inert — "there's no impersonation risk if the host can't see the attributed email of an
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

  /* ★ NOR A CONFIRMED ONE (Will, 2026-09-23: "Guests should not see other confirmed guests' emails, making them
     more comfortable knowing only the host sees it"). The host's one list of addresses is queries/guest-addresses.ts,
     read by the Guests room alone; this module feeds the guest album and public profiles, so it never names an
     address column or the credit's address field in its code. Whole words: `require_verified_email` is a switch,
     not an address, and passes. */
  it("★ names `email` and `uploaderEmail` nowhere outside a comment either", () => {
    const code = readFileSync(
      join(process.cwd(), "src/lib/db/queries/social.ts"),
      "utf8",
    )
      .split("\n")
      .filter((line) => !/^\s*(\/\/|\/\*|\*)/.test(line))
      .join("\n");
    for (const forbidden of [/\bemail\b/i, /\buploaderEmail\b/]) {
      expect(code, String(forbidden)).not.toMatch(forbidden);
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
    expect(pass).toMatchObject({
      href: "/e/qp",
      coverUrl: null,
      passwordProtected: true,
    });
    expect(priv).toMatchObject({
      href: null,
      coverUrl: null,
      name: "Private event",
      byline: null,
    });
  });

  /**
   * ★ A GATE NEVER LOCKS HER CARD (the doors, event-settings r1). A gated album is stored private,
   * with its gate; read without the gate, every Guest card went dark the moment its host chose "only
   * people already in" after the party, while the album still opened for her. A card is for someone
   * past the door, so it stays named and linked, never pictured; a block still locks it.
   */
  describe("★ a gated album's card and tile stay named and linked, never pictured", () => {
    const GATED = {
      id: "e-gated",
      name: "After party",
      event_date: null,
      visibility: "private",
      gate: "closed",
      qr_token: "qg",
      host_id: "h1",
      created_at: "2026-09-20T08:00:00Z",
    };
    const ONLY_ME = {
      id: "e-only-me",
      name: "Secret party",
      event_date: null,
      visibility: "private",
      gate: null,
      qr_token: "qs",
      host_id: "h1",
      created_at: "2026-09-19T08:00:00Z",
    };

    beforeEach(() => {
      answers.events = [GATED, ONLY_ME];
      answers.profiles = [{ id: "h1", display_name: "Maya" }];
      answers.media = [
        {
          event_id: "e-gated",
          status: "approved",
          created_at: "2026-09-20T10:00:00Z",
          guests: { verified_at: "2026-09-20T09:00:00Z" },
          original_key: "k-gated",
        },
        {
          event_id: "e-only-me",
          status: "approved",
          created_at: "2026-09-19T10:00:00Z",
          guests: { verified_at: "2026-09-19T09:00:00Z" },
          original_key: "k-only-me",
        },
      ];
      blocks.events = {};
      vi.mocked(presignDownload).mockClear();
    });

    it("the Guest card opens its album; Only me's stays blank and locked", async () => {
      const cards = await getMyGuestEventCards();
      const gated = cards.find((c) => c.eventId === "e-gated");
      const onlyMe = cards.find((c) => c.eventId === "e-only-me");
      expect(gated).toMatchObject({
        href: "/e/qg",
        name: "After party",
        byline: "Hosted by Maya",
        coverUrl: null,
        accessible: true,
        passwordProtected: false,
      });
      expect(onlyMe).toMatchObject({
        href: null,
        name: "Private event",
        accessible: false,
      });
      // The gate is read for the private albums alone, and no cover is presigned behind a door.
      expect(selects.events).toContain("id, gate");
      expect(presignDownload).not.toHaveBeenCalled();
    });

    it("the picker's tile is named and unlocked, with no cover", async () => {
      answers.profile_shown_events = [];
      const picks = await getMyAttendedEventPicks();
      expect(picks.find((p) => p.id === "e-gated")).toEqual({
        id: "e-gated",
        name: "After party",
        shownOnProfile: false,
        coverUrl: null,
        locked: false,
      });
      expect(picks.find((p) => p.id === "e-only-me")).toMatchObject({
        locked: true,
      });
    });

    it("a block still locks a gated album's card, in the private album's words", async () => {
      blocks.events = {
        "e-gated": {
          own: true,
          last_upload_at: "2026-09-21T10:00:00Z",
          profile_eligible: true,
        },
      };
      const cards = await getMyGuestEventCards();
      expect(cards.find((c) => c.eventId === "e-gated")).toMatchObject({
        href: null,
        name: "Private event",
        accessible: false,
      });
    });
  });

  /**
   * ★ THE BLOCK IS INVISIBLE ON HER OWN DASHBOARD (the Orchestrator's finding from the locked-door
   * board, beside the door's own pin in `album-viewer.server.test.ts`): a private album's card stays and
   * says so, its uploads still live, while a block moves hers to Deleted, so a card that vanished, or
   * read any other way, would tell her what the door hides.
   */
  describe("★ a blocked event's Guest card reads exactly as a private album's", () => {
    const PRIVATE_ALBUM = {
      id: "e-priv",
      name: "Secret party",
      event_date: "2026-09-20",
      visibility: "private",
      qr_token: "qs",
      host_id: "h1",
    };
    const BLOCKED_THERE = {
      id: "e-blocked",
      name: "Open party",
      event_date: "2026-09-19",
      visibility: "open",
      qr_token: "qo",
      host_id: "h1",
    };
    /** A card less the two fields that name which event and when: what she reads on it. */
    const face = ({
      eventId: _e,
      lastUploadAt: _l,
      ...rest
    }: Record<string, unknown>) => rest;

    beforeEach(() => {
      answers.events = [PRIVATE_ALBUM, BLOCKED_THERE];
      answers.profiles = [{ id: "h1", display_name: "Maya" }];
      vi.mocked(presignDownload).mockClear();
    });

    it("stays with no live upload left (the block moved them all to Deleted), in the private album's words", async () => {
      // Her one upload at the private album is live; every one of hers at the blocked album is in Deleted.
      answers.media = [
        {
          event_id: "e-priv",
          status: "approved",
          created_at: "2026-09-20T10:00:00Z",
          guests: { verified_at: null },
          original_key: "k-priv",
        },
      ];
      blocks.events = {
        "e-blocked": {
          own: true,
          last_upload_at: "2026-09-21T10:00:00Z",
          profile_eligible: true,
        },
      };

      const cards = await getMyGuestEventCards();
      // The block keeps the card's place: the newest upload it removed.
      expect(cards.map((c) => [c.eventId, c.lastUploadAt])).toEqual([
        ["e-blocked", "2026-09-21T10:00:00Z"],
        ["e-priv", "2026-09-20T10:00:00Z"],
      ]);
      const [blocked, privateAlbum] = cards;
      expect(blocked).toMatchObject({
        href: null,
        name: "Private event",
        dateLabel: "The host made this event private",
        byline: null,
        coverUrl: null,
        accessible: false,
        passwordProtected: false,
      });
      expect(face(blocked)).toEqual(face(privateAlbum));
    });

    it("an upload the host restored while the block stands changes nothing, and no cover is presigned", async () => {
      answers.media = [
        {
          event_id: "e-blocked",
          status: "approved",
          created_at: "2026-09-18T10:00:00Z",
          guests: { verified_at: null },
          original_key: "k-restored",
        },
        {
          event_id: "e-priv",
          status: "approved",
          created_at: "2026-09-20T10:00:00Z",
          guests: { verified_at: null },
          original_key: "k-priv",
        },
      ];
      blocks.events = {
        "e-blocked": {
          own: true,
          last_upload_at: "2026-09-21T10:00:00Z",
          profile_eligible: true,
        },
      };

      const cards = await getMyGuestEventCards();
      const blocked = cards.find((c) => c.eventId === "e-blocked");
      const privateAlbum = cards.find((c) => c.eventId === "e-priv");
      expect(blocked && face(blocked)).toEqual(
        privateAlbum && face(privateAlbum),
      );
      // The open album has a photograph to cover it with, and the block keeps it from ever being read.
      expect(presignDownload).not.toHaveBeenCalled();
    });

    it("a block on her address alone (never her account's history there) adds no card", async () => {
      blocks.events = {
        "e-blocked": {
          own: false,
          last_upload_at: null,
          profile_eligible: false,
        },
      };
      await expect(getMyGuestEventCards()).resolves.toEqual([]);
    });

    it("her profile picker keeps the blocked event's tile, locked and nameless like a private album's", async () => {
      blocks.events = {
        "e-blocked": {
          own: true,
          last_upload_at: "2026-09-21T10:00:00Z",
          profile_eligible: true,
        },
      };
      answers.media = [
        {
          event_id: "e-priv",
          status: "approved",
          created_at: "2026-09-20T10:00:00Z",
          guests: { verified_at: "2026-09-20T09:00:00Z" },
        },
      ];
      answers.profile_shown_events = [{ event_id: "e-blocked" }];

      const picks = await getMyAttendedEventPicks();
      const blocked = picks.find((p) => p.id === "e-blocked");
      const privateAlbum = picks.find((p) => p.id === "e-priv");
      expect(blocked).toEqual({
        id: "e-blocked",
        name: "Private event",
        shownOnProfile: true,
        coverUrl: null,
        locked: true,
      });
      expect(privateAlbum).toMatchObject({
        name: "Private event",
        coverUrl: null,
        locked: true,
      });
      expect(presignDownload).not.toHaveBeenCalled();
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

/* ────────────────────────────────────────────────────────────────────────────
   THE PROFILE CARDS, IN BATCHES (a party with several hundred confirmed guests is several hundred ids, and one
   `.in()` of them rides a URL that grows with the party and is answered short past PostgREST's row cap).
   ──────────────────────────────────────────────────────────────────────────── */
describe("getProfileCards: in batches, into one map", () => {
  const ME = "me";

  it("★ 400 confirmed guests hydrate in three reads of at most 150, and all 400 come back", async () => {
    const ids = Array.from({ length: 400 }, (_, i) => `u${i}`);
    answers.guests = ids.map((id, i) => ({
      id: `g${i}`,
      user_id: id,
      display_name: null,
      verified_at: "2026-09-21T15:00:00Z",
    }));
    answers.media = ids.map((_, i) => ({ guest_id: `g${i}` }));
    answers.profiles = ids.map((id) => ({
      id,
      display_name: `Guest ${id}`,
      slug: null,
      avatar_updated_at: null,
    }));

    const list = await getEventGuestList(EVENT);

    const reads = (filters.profiles ?? []).filter(
      ([method]) => method === "in",
    );
    expect(reads).toHaveLength(3);
    for (const [, column, batch] of reads) {
      expect(column).toBe("id");
      expect((batch as string[]).length).toBeLessThanOrEqual(150);
    }
    const asked = reads.flatMap(([, , batch]) => batch as string[]);
    expect(asked).toHaveLength(400);
    expect(new Set(asked)).toEqual(new Set(ids));
    expect(list).toHaveLength(400);
  });

  it("reads a repeated id once", async () => {
    vi.mocked(getRequestAuth).mockResolvedValue({
      user: { id: ME },
      supabase: { from: (table: string) => builderFor(table) },
    } as unknown as Awaited<ReturnType<typeof getRequestAuth>>);
    answers.user_follows = [
      { followee_id: "u1", created_at: "2026-09-20T10:00:00Z" },
      { followee_id: "u1", created_at: "2026-09-19T10:00:00Z" },
      { followee_id: "u2", created_at: "2026-09-18T10:00:00Z" },
    ];
    answers.profiles = [
      { id: "u1", display_name: "Alex", slug: "alex", avatar_updated_at: null },
      { id: "u2", display_name: "Theo", slug: null, avatar_updated_at: null },
    ];
    await getMyFollowing();
    const reads = (filters.profiles ?? []).filter(
      ([method]) => method === "in",
    );
    expect(reads).toEqual([["in", "id", ["u1", "u2"]]]);
  });

  it("★ reads exactly the four public card columns, never the account's email beside them", async () => {
    answers.guests = [
      {
        id: "g1",
        user_id: "u1",
        display_name: null,
        verified_at: "2026-09-21T15:00:00Z",
      },
    ];
    answers.media = [{ guest_id: "g1" }];
    answers.profiles = [
      { id: "u1", display_name: "Alex", slug: "alex", avatar_updated_at: null },
    ];
    await getEventGuestList(EVENT);
    expect(selects.profiles).toEqual([
      "id, display_name, slug, avatar_updated_at",
    ]);
  });
});

/* ────────────────────────────────────────────────────────────────────────────
   NO ADDRESS IN ANY OUTPUT (Will, 2026-09-23: "only the host sees it"). The fake answers every row it holds with
   the addresses planted beside the columns each read asks for, the way a `select("*")` or a spread row would carry
   them, so a read that ever passed a row through whole fails here by name.
   ──────────────────────────────────────────────────────────────────────────── */
describe("queries/social.ts: no address leaves in any output", () => {
  const ME = "me";
  const PLANTED = [
    "proved@example.com",
    "typed@example.com",
    "account@example.com",
  ];

  beforeEach(() => {
    vi.mocked(getRequestAuth).mockResolvedValue({
      user: { id: ME },
      supabase: { from: (table: string) => builderFor(table) },
    } as unknown as Awaited<ReturnType<typeof getRequestAuth>>);
    vi.mocked(presignDownload).mockResolvedValue("https://cdn/signed");

    const guestRow = {
      email: "proved@example.com",
      pending_email: "typed@example.com",
    };
    answers.events = [
      {
        id: "e1",
        name: "The party",
        event_date: null,
        visibility: "open",
        qr_token: "q1",
        custom_slug: null,
        host_id: "host-1",
        show_guest_list: true,
        created_at: "2026-09-01T00:00:00Z",
      },
    ];
    answers.guests = [
      {
        id: "g-verified",
        user_id: "u1",
        display_name: null,
        verified_at: "2026-09-21T15:00:00Z",
        ...guestRow,
      },
      {
        id: "g-named",
        user_id: null,
        display_name: "Theo",
        verified_at: null,
        ...guestRow,
      },
    ];
    answers.media = [
      {
        guest_id: "g-verified",
        event_id: "e1",
        status: "approved",
        type: "photo",
        created_at: "2026-09-21T16:00:00Z",
        original_key: "k1",
        guests: { verified_at: "2026-09-21T15:00:00Z", ...guestRow },
      },
      {
        guest_id: "g-named",
        event_id: "e1",
        status: "approved",
        type: "photo",
        created_at: "2026-09-21T17:00:00Z",
        original_key: "k2",
        guests: { verified_at: null, ...guestRow },
      },
    ];
    answers.profiles = [
      {
        id: "u1",
        display_name: "Alex",
        slug: "alex",
        avatar_updated_at: null,
        email: "account@example.com",
      },
      {
        id: "host-1",
        display_name: "Will",
        slug: "will",
        avatar_updated_at: null,
        email: "account@example.com",
      },
    ];
    answers.user_follows = [
      {
        followee_id: "host-1",
        follower_id: "u1",
        created_at: "2026-09-20T10:00:00Z",
      },
    ];
    answers.user_blocks = [
      { blocked_id: "u1", created_at: "2026-09-20T10:00:00Z" },
    ];
    answers.profile_shown_events = [{ event_id: "e1" }];
  });

  it("★ every read a guest or a public page renders carries none of the planted addresses, under any key", async () => {
    const outputs: Record<string, unknown> = {
      guestList: await getEventGuestList(EVENT),
      guestListWithUnverified: await getEventGuestList(EVENT, {
        includeUnverified: true,
      }),
      eventGuests: await getEventGuests(EVENT),
      hostCard: await getHostCard(EVENT),
      following: await getMyFollowing(),
      blocks: await getMyBlocks(),
      guestCards: await getMyGuestEventCards(),
      attended: await getMyAttendedEvents(),
    };
    // A canary for the fake itself: the reads really did return people and events to inspect.
    expect(JSON.stringify(outputs)).toContain("Alex");

    for (const [read, output] of Object.entries(outputs)) {
      const json = JSON.stringify(output, (_key, value) =>
        value instanceof Map ? [...value] : value,
      );
      for (const address of PLANTED) {
        expect(json, `${read} carried ${address}`).not.toContain(address);
      }
      expect(json, `${read} carried an address key`).not.toMatch(
        /"(email|uploaderEmail|pending_email|pendingEmail)"/,
      );
    }
  });
});

/* ────────────────────────────────────────────────────────────────────────────
   THE PUBLIC PROFILE'S RPC (the anon `get_public_profile`, readable by anyone with a handle). Text-parsed from the
   NEWEST migration that defines it, so a redefinition is read the day it lands, and fail-closed: a body this parser
   cannot find fails rather than passes.
   ──────────────────────────────────────────────────────────────────────────── */
describe("get_public_profile: no address in the payload, no address read", () => {
  const MIGRATIONS = join(process.cwd(), "supabase", "migrations");
  const DEFINITION =
    /create\s+(?:or\s+replace\s+)?function\s+public\.get_public_profile\s*\(/i;

  function newestBody(): { file: string; body: string } {
    const hits = readdirSync(MIGRATIONS)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((file) => ({
        file,
        sql: readFileSync(join(MIGRATIONS, file), "utf8"),
      }))
      .filter(({ sql }) => DEFINITION.test(sql));
    const newest = hits.at(-1);
    if (!newest) throw new Error("No migration defines get_public_profile.");
    const start = newest.sql.search(DEFINITION);
    const open = newest.sql.indexOf("$$", start);
    const close = newest.sql.indexOf("$$", open + 2);
    if (open < 0 || close < 0) {
      throw new Error(
        `Cannot read get_public_profile's body in ${newest.file}.`,
      );
    }
    // The body without its `--` comments, which quote the rules they hold and name columns in prose.
    const body = newest.sql
      .slice(open + 2, close)
      .split("\n")
      .map((line) => line.replace(/--.*$/, ""))
      .join("\n");
    return { file: newest.file, body };
  }

  it("found a definition with a payload to read (a canary for the parser)", () => {
    const { body } = newestBody();
    expect(body).toContain("jsonb_build_object");
    expect(body).toContain("'display_name'");
  });

  it("★ no key of the payload names an address", () => {
    const { file, body } = newestBody();
    const literals = [...body.matchAll(/'([^']*)'/g)].map(([, text]) => text);
    expect(literals.length).toBeGreaterThan(0);
    for (const literal of literals) {
      expect(literal, `${file}: '${literal}'`).not.toMatch(/mail/i);
    }
  });

  it("★ reads no address column: the only email-named identifiers are the confirmation stamp and the host's switch", () => {
    const { file, body } = newestBody();
    const code = body.replace(/'[^']*'/g, "''");
    const named = new Set(
      [...code.matchAll(/\b\w*email\w*\b/gi)].map(([name]) =>
        name.toLowerCase(),
      ),
    );
    for (const name of named) {
      expect(
        ["email_confirmed_at", "require_verified_email"],
        `${file} reads ${name}`,
      ).toContain(name);
    }
  });
});

/* ────────────────────────────────────────────────────────────────────────────
   ONLY THE GUESTS ROOM HANDS `GuestList` AN ADDRESS. The album renders the same component for every guest who can
   open it, so the prop that carries addresses must never ride there: read off every `<GuestList` in the tree,
   braces balanced, so a spread counts as a way in too.
   ──────────────────────────────────────────────────────────────────────────── */
describe("the album never passes `emails` to GuestList", () => {
  const ROOM = "src/app/(app)/dashboard/[eventId]/guests/page.tsx";
  const ALBUM = "src/app/(guest)/e/[token]/page.tsx";

  function files(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) return files(full);
      return entry.endsWith(".tsx") ? [full] : [];
    });
  }

  /** The attribute text of every `<GuestList ...>` opening tag in a source file (never `<GuestListCard` and kin). */
  function guestListTags(source: string): string[] {
    const tags: string[] = [];
    for (const match of source.matchAll(/<GuestList(?![\w$])/g)) {
      const start = (match.index ?? 0) + match[0].length;
      let depth = 0;
      let end = start;
      for (; end < source.length; end++) {
        const c = source[end];
        if (c === "{") depth++;
        else if (c === "}") depth--;
        else if (c === ">" && depth === 0) break;
      }
      tags.push(source.slice(start, end));
    }
    return tags;
  }

  it("★ the album page's GuestList carries no `emails`, and no spread that could", () => {
    const source = readFileSync(join(process.cwd(), ALBUM), "utf8");
    for (const tag of guestListTags(source)) {
      expect(tag).not.toMatch(/\bemails\b/);
      expect(tag).not.toContain("{...");
    }
  });

  it("★ and no file in the tree but the Guests room passes it", () => {
    const passing = files(join(process.cwd(), "src"))
      .filter((file) => !file.endsWith(".test.tsx"))
      .filter((file) =>
        guestListTags(readFileSync(file, "utf8")).some(
          (tag) => /\bemails\b/.test(tag) || tag.includes("{..."),
        ),
      )
      .map((file) => relative(process.cwd(), file));
    expect(passing).toEqual([ROOM]);
  });

  it("★ Block rides the same one room: no file but the Guests room passes `blockFrom`", () => {
    const passing = files(join(process.cwd(), "src"))
      .filter((file) => !file.endsWith(".test.tsx"))
      .filter((file) =>
        guestListTags(readFileSync(file, "utf8")).some((tag) =>
          /\bblockFrom\b/.test(tag),
        ),
      )
      .map((file) => relative(process.cwd(), file));
    expect(passing).toEqual([ROOM]);
  });

  it("★ and the credit's look (with its Block) is mounted by the host's two pages alone", () => {
    const mounting = files(join(process.cwd(), "src"))
      .filter((file) => !file.endsWith(".test.tsx"))
      .filter((file) =>
        /<HostCreditLookProvider\b/.test(readFileSync(file, "utf8")),
      )
      .map((file) => relative(process.cwd(), file))
      .sort();
    expect(mounting).toEqual([
      "src/app/(app)/dashboard/[eventId]/page.tsx",
      "src/app/(app)/dashboard/[eventId]/review/page.tsx",
    ]);
  });
});
