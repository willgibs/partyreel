/**
 * N1, THE SELF-SERVICE DELETION'S EVENTS, on the clamping PostgREST fake: every live event of an
 * account past 1,000 is binned (one read cut at 1,000 left the rest live on an account that had asked
 * to be deleted), and the operator arm's count comes from its write's answer, which is not capped.
 *
 * AND THE GUEST ROWS (lp/identity-email): the request takes the account's addresses and typed name
 * off its rows in other hosts' events before it anonymises the profile, and a scrub that fails costs
 * neither the anonymisation nor the ban (the sweep repeats it before deleteUser).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

const state = vi.hoisted(() => ({
  fake: null as FakePostgrest | null,
  softDeleted: [] as string[],
  banned: [] as string[],
  captureError: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: {}, serverEnv: {} }));
vi.mock("@/lib/r2/delete", () => ({
  deleteR2Objects: vi.fn(),
  listR2Objects: vi.fn(),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: state.captureError,
  captureWarning: vi.fn(),
}));
vi.mock("@/lib/supabase/avatar-storage", () => ({
  removeAvatar: vi.fn(async () => undefined),
}));
vi.mock("@/lib/stripe/account-cancel", () => ({
  cancelSubscriptionForDeletion: vi.fn(async () => ({ status: "none" })),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(state.fake!),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => asSupabase(state.fake!),
}));
vi.mock("@/lib/db/mutations/events", () => ({
  // The host path, stamped the way it stamps: the event leaves the live set.
  softDeleteEvent: vi.fn(async (id: string) => {
    state.softDeleted.push(id);
    const row = state.fake!.tables.events.find((e) => e.id === id);
    if (row) row.deleted_at = "2026-09-23T04:00:00.000000+00:00";
    return { ok: true, data: { id } };
  }),
}));

const { requestAccountDeletion } = await import("@/lib/db/mutations/account");

const USER = "0a1b2c3d-4e5f-4061-8273-8495a6b7c8d9";
const STRANGER = "9f8e7d6c-5b4a-4938-8271-605f4e3d2c1b";
const THEIR_EVENT = "20000000-0000-4000-8000-000000000001";
const CONFIRMED = "2026-09-01T00:00:00.000000+00:00";

/** The account's rows in someone else's event, and a stranger's row beside them. */
function guestRows(): FakeRow[] {
  return [
    {
      id: "g-verified",
      event_id: THEIR_EVENT,
      user_id: USER,
      email: "host@example.com",
      pending_email: null,
      pending_email_at: null,
      display_name: null,
      verified_at: CONFIRMED,
    },
    {
      id: "g-typed",
      event_id: THEIR_EVENT,
      user_id: USER,
      email: null,
      pending_email: "typed@example.com",
      pending_email_at: CONFIRMED,
      display_name: "Typed",
      verified_at: null,
    },
    {
      id: "g-stranger",
      event_id: THEIR_EVENT,
      user_id: STRANGER,
      email: "stranger@example.com",
      pending_email: null,
      pending_email_at: null,
      display_name: null,
      verified_at: CONFIRMED,
    },
  ];
}

function world(liveEvents: number, opts: { noGuests?: boolean } = {}) {
  const events: FakeRow[] = Array.from({ length: liveEvents }, (_, i) => ({
    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    host_id: USER,
    deleted_at: null,
  }));
  // One already in the bin, and another host's event.
  events.push(
    {
      id: "10000000-0000-4000-8000-000000000001",
      host_id: USER,
      deleted_at: "2026-09-01T00:00:00.000000+00:00",
    },
    {
      id: THEIR_EVENT,
      host_id: "someone-else",
      deleted_at: null,
    },
  );
  const tables: Record<string, FakeRow[]> = {
    profiles: [
      {
        id: USER,
        email: "host@example.com",
        display_name: "Host",
        slug: "host",
        avatar_updated_at: null,
        stripe_subscription_id: null,
        deletion_requested_at: null,
      },
    ],
    events,
    newsletter_signups: [{ id: "n1", email: "host@example.com" }],
  };
  // Left out, the fake answers the scrub with PGRST205: a failed write.
  if (!opts.noGuests) tables.guests = guestRows();
  state.fake = createFakePostgrest({ tables });
  (state.fake as unknown as { auth: unknown }).auth = {
    getUser: async () => ({ data: { user: { id: USER } }, error: null }),
    admin: {
      updateUserById: async (id: string) => {
        state.banned.push(id);
        return { error: null };
      },
    },
  };
  return state.fake;
}

beforeEach(() => {
  state.fake = null;
  state.softDeleted = [];
  state.banned = [];
  state.captureError.mockClear();
});

describe("requestAccountDeletion bins every live event", () => {
  it("the self arm reads the live events whole, past 1,000, and bins each one", async () => {
    const fake = world(1_200);
    const result = await requestAccountDeletion({
      userId: USER,
      actor: "self",
    });
    expect(result).toMatchObject({ ok: true, eventsBinned: 1_200 });
    expect(state.softDeleted).toHaveLength(1_200);
    expect(new Set(state.softDeleted).size).toBe(1_200);
    // The read paged by keyset inside the URL budget: no request failed.
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
    expect(
      fake.requests.filter((r) => r.name === "events" && r.method === "GET")
        .length,
    ).toBe(2);
  });

  it("the operator arm counts from its write's answer, whole", async () => {
    const fake = world(1_200);
    const result = await requestAccountDeletion({
      userId: USER,
      actor: "operator",
    });
    expect(result).toMatchObject({ ok: true, eventsBinned: 1_200 });
    const stillLive = fake.tables.events.filter(
      (e) => e.host_id === USER && e.deleted_at === null,
    );
    expect(stillLive).toHaveLength(0);
  });
});

describe("requestAccountDeletion takes the address with it (lp/identity-email)", () => {
  it("scrubs the account's guest rows in other hosts' events, keeps their proof, and spares a stranger", async () => {
    const fake = world(1);
    const result = await requestAccountDeletion({
      userId: USER,
      actor: "self",
    });
    expect(result).toMatchObject({ ok: true });
    const byId = new Map(fake.tables.guests.map((g) => [g.id, g]));
    expect(byId.get("g-verified")).toMatchObject({
      email: null,
      verified_at: CONFIRMED,
    });
    expect(byId.get("g-typed")).toMatchObject({
      pending_email: null,
      pending_email_at: null,
      display_name: null,
    });
    expect(byId.get("g-stranger")).toMatchObject({
      email: "stranger@example.com",
    });
    // And the profile goes anonymous after it, the auth user banned.
    expect(fake.tables.profiles[0]).toMatchObject({
      email: null,
      display_name: null,
    });
    expect(state.banned).toEqual([USER]);
  });

  it("★ a failed scrub is captured and costs neither the anonymisation nor the ban", async () => {
    const fake = world(1, { noGuests: true });
    const result = await requestAccountDeletion({
      userId: USER,
      actor: "self",
    });
    expect(result).toMatchObject({ ok: true });
    expect(fake.tables.profiles[0]).toMatchObject({
      email: null,
      display_name: null,
    });
    expect(state.banned).toEqual([USER]);
    const steps = state.captureError.mock.calls.map(
      (call) => (call[2] as { step?: string } | undefined)?.step,
    );
    expect(steps).toContain("account_deletion_scrub");
  });
});
