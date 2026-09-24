/**
 * THE HOST'S VIEW OF A CONFIRMED GUEST'S ADDRESS (Will, 2026-09-23: "only the host sees it").
 *
 * What is pinned is who can get an address out of this module and which address it is: the host alone (the module
 * proves it, whatever its caller did), a PROVED row's address alone (`verified_at` set, never `pending_email`), never
 * the host's own, only for the people the room lists, and every row read even past PostgREST's row cap. Then the
 * one pin no fake can hold: the Guests room is the only file in the tree that imports it.
 *
 * Two fakes: a recording builder that answers every row it holds WITHOUT applying the filters (so a row the database
 * would have dropped reaches the module, and the module's own check is what those cases exercise), and, for the row
 * cap, `fake-postgrest`, which clamps every read at 1,000 rows exactly as PostgREST does (the 1,000-row round,
 * 2026-09-23: the read pages on `id` through `readAllPages`, whose short page is the end only while the live
 * `max_rows` is at least 1,000, which `row-cap-policy.test.ts` pins).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));

type GuestRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  verified_at: string | null;
  pending_email?: string | null;
};

const HOST = "host-1";
const EVENT = "event-1";

let signedInAs: string | null = HOST;
let eventRow: { host_id: string } | null = { host_id: HOST };
let guests: GuestRow[] = [];
let maxRows = 1000;
let guestRequests = 0;
let guestSelects: string[] = [];
let guestFilters: [string, ...unknown[]][] = [];

function guestsBuilder() {
  let counted = false;
  let after: string | null = null;
  let limit = Infinity;
  const record =
    (method: string) =>
    (...args: unknown[]) => {
      guestFilters.push([method, ...args]);
      return builder;
    };
  const builder = {
    select(columns: string, opts?: { count?: string }) {
      guestSelects.push(columns);
      counted = opts?.count === "exact";
      return builder;
    },
    eq: record("eq"),
    neq: record("neq"),
    not: record("not"),
    order: () => builder,
    limit(n: number) {
      limit = n;
      return builder;
    },
    gt(_column: string, value: string) {
      after = value;
      return builder;
    },
    then(resolve: (value: unknown) => unknown) {
      guestRequests += 1;
      // The fake does NOT apply the filters: it answers every row it holds, so a row the database would have
      // dropped reaches the module, and the module's own check is what the tests below exercise.
      const sorted = [...guests].sort((a, b) => a.id.localeCompare(b.id));
      const tail = after
        ? sorted.filter((row) => row.id.localeCompare(after as string) > 0)
        : sorted;
      return Promise.resolve({
        data: tail.slice(0, Math.min(limit, maxRows)),
        error: null,
        count: counted ? guests.length : null,
      }).then(resolve);
    },
  };
  return builder;
}

function eventsBuilder() {
  const builder = {
    select: () => builder,
    eq: () => builder,
    is: () => builder,
    maybeSingle: () => Promise.resolve({ data: eventRow, error: null }),
  };
  return builder;
}

/** When set, the admin client is this instead of the recording builder (the row-cap cases). */
let adminOverride: unknown = null;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () =>
    adminOverride ?? {
      from: (table: string) =>
        table === "guests" ? guestsBuilder() : eventsBuilder(),
    },
}));

vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({
    supabase: {},
    user: signedInAs ? { id: signedInAs } : null,
  }),
}));

const { getConfirmedGuestAddresses } =
  await import("@/lib/db/queries/guest-addresses");

function row(
  n: number,
  userId: string | null,
  email: string | null,
  verifiedAt: string | null = "2026-09-20T10:00:00.000Z",
): GuestRow {
  return {
    id: `g-${String(n).padStart(4, "0")}`,
    user_id: userId,
    email,
    verified_at: verifiedAt,
  };
}

beforeEach(() => {
  adminOverride = null;
  signedInAs = HOST;
  eventRow = { host_id: HOST };
  guests = [];
  maxRows = 1000;
  guestRequests = 0;
  guestSelects = [];
  guestFilters = [];
});

describe("getConfirmedGuestAddresses: the host alone", () => {
  it("returns a confirmed guest's address keyed by their user id", async () => {
    guests = [
      row(1, "u1", "maya@example.com"),
      row(2, "u2", "theo@example.com"),
    ];
    await expect(
      getConfirmedGuestAddresses(EVENT, ["u1", "u2"]),
    ).resolves.toEqual(
      new Map([
        ["u1", "maya@example.com"],
        ["u2", "theo@example.com"],
      ]),
    );
  });

  it("★ a signed-in viewer who is not the host gets nothing, and `guests` is never read", async () => {
    guests = [row(1, "u1", "maya@example.com")];
    signedInAs = "someone-else";
    await expect(getConfirmedGuestAddresses(EVENT, ["u1"])).resolves.toEqual(
      new Map(),
    );
    expect(guestRequests).toBe(0);
  });

  it("★ a signed-out caller, or a deleted or missing event, gets nothing either", async () => {
    guests = [row(1, "u1", "maya@example.com")];
    signedInAs = null;
    await expect(getConfirmedGuestAddresses(EVENT, ["u1"])).resolves.toEqual(
      new Map(),
    );
    signedInAs = HOST;
    eventRow = null;
    await expect(getConfirmedGuestAddresses(EVENT, ["u1"])).resolves.toEqual(
      new Map(),
    );
    expect(guestRequests).toBe(0);
  });

  it("reads nothing at all when nobody is listed", async () => {
    await expect(getConfirmedGuestAddresses(EVENT, [])).resolves.toEqual(
      new Map(),
    );
    expect(guestRequests).toBe(0);
  });
});

describe("getConfirmedGuestAddresses: a PROVED address, and only the listed people's", () => {
  it("★ the SELECT names four columns and no other address", async () => {
    guests = [row(1, "u1", "maya@example.com")];
    await getConfirmedGuestAddresses(EVENT, ["u1"]);
    expect(guestSelects[0]).toBe("id, user_id, email, verified_at");
    for (const select of guestSelects) {
      expect(select).not.toContain("pending_email");
      expect(select).not.toContain("*");
    }
  });

  it("asks the database for proved rows with an address, at this event, never the host's", async () => {
    guests = [row(1, "u1", "maya@example.com")];
    await getConfirmedGuestAddresses(EVENT, ["u1"]);
    expect(guestFilters).toContainEqual(["eq", "event_id", EVENT]);
    expect(guestFilters).toContainEqual(["not", "verified_at", "is", null]);
    expect(guestFilters).toContainEqual(["not", "email", "is", null]);
    expect(guestFilters).toContainEqual(["not", "user_id", "is", null]);
    expect(guestFilters).toContainEqual(["neq", "user_id", HOST]);
  });

  it("★ and checks every row itself: an unproved row's address, the host's own and a blank one never leave", async () => {
    guests = [
      // An address on a row minted before its account confirmed (capture_guest_email can land one there).
      row(1, "u1", "unproved@example.com", null),
      // The host's own row at their own event.
      row(2, HOST, "host@example.com"),
      row(3, "u3", "   "),
      { ...row(4, "u4", null), pending_email: "typed@example.com" },
    ];
    const addresses = await getConfirmedGuestAddresses(EVENT, [
      "u1",
      HOST,
      "u3",
      "u4",
    ]);
    expect(addresses).toEqual(new Map());
    expect(JSON.stringify([...addresses])).not.toContain("typed@example.com");
  });

  it("leaves out a confirmed guest the room does not list", async () => {
    guests = [
      row(1, "u1", "maya@example.com"),
      row(2, "u2", "theo@example.com"),
    ];
    await expect(getConfirmedGuestAddresses(EVENT, ["u1"])).resolves.toEqual(
      new Map([["u1", "maya@example.com"]]),
    );
  });

  it("never sends the listed ids to the database: the read is keyed on the event", async () => {
    guests = [row(1, "u1", "maya@example.com")];
    await getConfirmedGuestAddresses(EVENT, ["u1"]);
    expect(guestFilters.filter(([method]) => method === "in")).toEqual([]);
  });

  it("one address per person: the newest proof wins", async () => {
    guests = [
      row(1, "u1", "old@example.com", "2026-09-01T10:00:00.000Z"),
      row(2, "u1", "new@example.com", "2026-09-20T10:00:00.000Z"),
      row(3, "u1", "older@example.com", "2026-08-01T10:00:00.000Z"),
    ];
    await expect(getConfirmedGuestAddresses(EVENT, ["u1"])).resolves.toEqual(
      new Map([["u1", "new@example.com"]]),
    );
  });
});

describe("getConfirmedGuestAddresses: every row, past the row cap", () => {
  it("★ reads 2,500 proved rows whole, in keyset pages that PostgREST's 1,000-row cap cannot cut", async () => {
    const rows = Array.from({ length: 2500 }, (_, i) => ({
      ...row(i, `u${i}`, `guest${i}@example.com`),
      event_id: EVENT,
    }));
    const fake = createFakePostgrest({
      tables: {
        events: [{ id: EVENT, host_id: HOST, deleted_at: null }],
        guests: [
          ...rows,
          // Filtered out by the database: unproved, the host's own, another event's.
          { ...row(9000, "u-x", "x@example.com", null), event_id: EVENT },
          { ...row(9001, HOST, "host@example.com"), event_id: EVENT },
          { ...row(9002, "u-y", "y@example.com"), event_id: "another-event" },
        ],
      },
    });
    adminOverride = asSupabase(fake);

    const addresses = await getConfirmedGuestAddresses(
      EVENT,
      rows.map((g) => g.user_id as string),
    );

    expect(addresses.size).toBe(2500);
    expect(addresses.get("u2499")).toBe("guest2499@example.com");
    const guestReads = fake.requests.filter((r) => r.name === "guests");
    expect(guestReads.map((r) => r.returned)).toEqual([1000, 1000, 500]);
    expect(guestReads.some((r) => r.filters.some((f) => f.op === "in"))).toBe(false);
  });

  it("answers an ordinary party in one request", async () => {
    guests = [row(1, "u1", "maya@example.com")];
    await getConfirmedGuestAddresses(EVENT, ["u1"]);
    expect(guestRequests).toBe(1);
  });
});

/* ────────────────────────────────────────────────────────────────────────────
   ONLY THE GUESTS ROOM IMPORTS THIS MODULE. The module proves the host itself, so a wrong importer would get
   nothing; this pin is the other half, so a guest-facing page never even asks. A new host surface that needs an
   address is a deliberate edit to the list below.
   ──────────────────────────────────────────────────────────────────────────── */
describe("where an address may go", () => {
  const SRC = join(process.cwd(), "src");
  const ALLOWED = ["src/app/(app)/dashboard/[eventId]/guests/page.tsx"];

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) return sourceFiles(full);
      return /\.(ts|tsx|mts|mjs)$/.test(entry) ? [full] : [];
    });
  }

  it("★ the Guests room is the only importer", () => {
    const importers = sourceFiles(SRC)
      .filter((file) => !file.endsWith("guest-addresses.test.ts"))
      .filter((file) =>
        /from\s+["'][^"']*queries\/guest-addresses["']/.test(
          readFileSync(file, "utf8"),
        ),
      )
      .map((file) => relative(process.cwd(), file));
    expect(importers).toEqual(ALLOWED);
  });
});
