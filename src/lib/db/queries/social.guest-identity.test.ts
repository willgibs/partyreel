/**
 * THE GUEST LIST'S UNION AND THE HOST'S CARD (the identity reshape, 2026-09-21).
 *
 * Two reads a guest's browser will see the output of, so both are pinned on what they SELECT and
 * on what they refuse to return, not just on their happy path:
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

/** What each table answers, and what each table was asked for. */
const answers: Record<string, Row[]> = {};
const selected: Record<string, string> = {};

function builderFor(table: string) {
  const result = () => ({ data: answers[table] ?? [], error: null });
  const builder = {
    select(columns: string) {
      selected[table] = columns;
      return builder;
    },
    eq: () => builder,
    in: () => builder,
    is: () => builder,
    not: () => builder,
    order: () => builder,
    maybeSingle: () =>
      Promise.resolve({ data: result().data[0] ?? null, error: null }),
    then: (resolve: (value: { data: Row[]; error: null }) => unknown) =>
      Promise.resolve(result()).then(resolve),
  };
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: (table: string) => builderFor(table) }),
}));

const { getEventGuestList, getHostCard } =
  await import("@/lib/db/queries/social");

const EVENT = "event-1";

beforeEach(() => {
  for (const key of Object.keys(answers)) delete answers[key];
  for (const key of Object.keys(selected)) delete selected[key];
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
