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
  FakeRpcError,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

const state = vi.hoisted(() => ({
  fake: null as FakePostgrest | null,
  softDeleted: [] as string[],
  banned: [] as string[],
  captureError: vi.fn(),
  captureWarning: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: {}, serverEnv: {} }));
vi.mock("@/lib/r2/delete", () => ({
  deleteR2Objects: vi.fn(),
  listR2Objects: vi.fn(),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: state.captureError,
  captureWarning: state.captureWarning,
}));
vi.mock("@/lib/supabase/avatar-storage", () => ({
  removeAvatar: vi.fn(async () => undefined),
}));
vi.mock("@/lib/stripe/account-cancel", () => ({
  cancelSubscriptionsForDeletion: vi.fn(async () => ({ status: "none" })),
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

const {
  cancelAccountDeletion,
  countMyUploadsElsewhere,
  isOnNewsletterList,
  removeMyNewsletterSignup,
  requestAccountDeletion,
} = await import("@/lib/db/mutations/account");

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
  state.captureWarning.mockClear();
});

describe("requestAccountDeletion bins every live event", () => {
  it("the self arm reads the live events whole, past 1,000, and bins each one", async () => {
    const fake = world(1_200);
    const result = await requestAccountDeletion({
      userId: USER,
      actor: "self",
    });
    expect(result).toMatchObject({ ok: true, eventsBinned: 1_200 });
    // The stamp as it was stored: the done screen's purge time is reckoned from it.
    expect(result.ok && result.requestedAt).toBe(
      fake.tables.profiles[0].deletion_requested_at,
    );
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

/**
 * ★ THE PLAN GOES FIRST, EVERY SUBSCRIPTION OF IT (crumbs-41, from `hardening`): two Checkout tabs can leave a host
 * paying twice while the profile follows one, so the cancel is handed the customer itself, not only the subscription
 * the profile follows, and a cancel that fails stops the request before anything is destroyed.
 */
describe("requestAccountDeletion cancels every live subscription first", () => {
  it("★ hands the cancel the profile's customer and the subscription it follows", async () => {
    const fake = world(1);
    Object.assign(fake.tables.profiles[0], {
      stripe_customer_id: "cus_1",
      stripe_subscription_id: "sub_followed",
    });
    const { cancelSubscriptionsForDeletion } =
      await import("@/lib/stripe/account-cancel");
    vi.mocked(cancelSubscriptionsForDeletion).mockClear();
    await expect(
      requestAccountDeletion({ userId: USER, actor: "self" }),
    ).resolves.toMatchObject({ ok: true });
    expect(cancelSubscriptionsForDeletion).toHaveBeenCalledWith({
      customerId: "cus_1",
      subscriptionId: "sub_followed",
    });
  });

  it("★ a cancel that fails on any subscription stops the request before the stamp, and destroys nothing", async () => {
    const fake = world(2);
    Object.assign(fake.tables.profiles[0], { stripe_customer_id: "cus_1" });
    const { cancelSubscriptionsForDeletion } =
      await import("@/lib/stripe/account-cancel");
    vi.mocked(cancelSubscriptionsForDeletion).mockResolvedValueOnce({
      status: "failed",
      subscriptionId: "sub_second_tab",
      message: "Stripe is unreachable.",
    });
    await expect(
      requestAccountDeletion({ userId: USER, actor: "self" }),
    ).resolves.toMatchObject({ ok: false, code: "subscription" });
    expect(fake.tables.profiles[0].deletion_requested_at).toBeNull();
    expect(state.softDeleted).toEqual([]);
    expect(state.banned).toEqual([]);
  });
});

/**
 * ★ THE MARKETING SWITCH REMOVES WHAT IT READS (crumbs-33, from identity-email). The list stores an address lower
 * case and trimmed (capture_guest_email), and an email change now moves the account's row to its new address
 * (20261001110000). The switch reads and removes by the address the account holds, asked in the list's own form, so
 * the row it shows ON is the row its OFF takes away, whatever case the profile's copy is in.
 */
describe("the /account marketing switch and the list's form", () => {
  function switchWorld(profileEmail: string) {
    state.fake = createFakePostgrest({
      tables: {
        profiles: [{ id: USER, email: profileEmail }],
        newsletter_signups: [
          { id: "n-mine", email: "host@example.com" },
          { id: "n-other", email: "someone@example.com" },
        ],
      },
    });
    (state.fake as unknown as { auth: unknown }).auth = {
      getUser: async () => ({ data: { user: { id: USER } }, error: null }),
    };
    return state.fake;
  }

  it("★ reads the row ON, and takes exactly it off, when the profile's address is in another case", async () => {
    const fake = switchWorld(" Host@Example.COM ");
    expect(await isOnNewsletterList()).toBe(true);
    expect(await removeMyNewsletterSignup()).toEqual({ ok: true, removed: 1 });
    expect(fake.tables.newsletter_signups.map((r) => r.id)).toEqual([
      "n-other",
    ]);
    expect(await isOnNewsletterList()).toBe(false);
  });

  it("reads nothing for an account with no address, and removes nothing", async () => {
    const fake = switchWorld("");
    expect(await isOnNewsletterList()).toBe(false);
    expect(await removeMyNewsletterSignup()).toEqual({ ok: true, removed: 0 });
    expect(fake.tables.newsletter_signups).toHaveLength(2);
  });
});

/**
 * ★ HER UPLOADS IN OTHER PEOPLE'S ALBUMS (lp/account-exit). The dialog offers to take them out with
 * the account, off by default; the number it offers is counted on the server, and the removal is
 * her own `removeMyUpload`, each one, read whole past 1,000. It runs before the plan and before the
 * stamp, and anything left over refuses the whole request with nothing else touched.
 */
describe("requestAccountDeletion takes her uploads out of other albums, when she asks", () => {
  const THEIRS = { host_id: "someone-else", deleted_at: null };

  /** Her live uploads elsewhere (`mine`), and every row the predicate must leave alone. */
  function elsewhereWorld(
    mine: number,
    opts: { refuse?: (id: string) => boolean } = {},
  ) {
    const fake = world(1);
    const media: FakeRow[] = Array.from({ length: mine }, (_, i) => ({
      id: `30000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      type: i % 10 === 0 ? "video" : "photo",
      // Waiting in review and hidden by the host count too: each can still be shown.
      status: i % 3 === 0 ? "pending" : i % 3 === 1 ? "approved" : "hidden",
      guest_id: "g-verified",
      event_id: THEIR_EVENT,
      guests: { user_id: USER },
      events: THEIRS,
    }));
    media.push(
      // Already removed: not "there" any more.
      {
        id: "40000000-0000-4000-8000-000000000001",
        type: "photo",
        status: "removed",
        guest_id: "g-verified",
        event_id: THEIR_EVENT,
        guests: { user_id: USER },
        events: THEIRS,
      },
      // In an event its host binned: not hers to remove (remove_my_upload refuses it).
      {
        id: "40000000-0000-4000-8000-000000000002",
        type: "photo",
        status: "approved",
        guest_id: "g-verified",
        event_id: "binned-event",
        guests: { user_id: USER },
        events: {
          host_id: "someone-else",
          deleted_at: "2026-09-30T00:00:00.000000+00:00",
        },
      },
      // Her guest row in her OWN event: that is the host arm's, binned with the event.
      {
        id: "40000000-0000-4000-8000-000000000003",
        type: "photo",
        status: "approved",
        guest_id: "g-own",
        event_id: "her-event",
        guests: { user_id: USER },
        events: { host_id: USER, deleted_at: null },
      },
      // A stranger's upload beside hers.
      {
        id: "40000000-0000-4000-8000-000000000004",
        type: "photo",
        status: "approved",
        guest_id: "g-stranger",
        event_id: THEIR_EVENT,
        guests: { user_id: STRANGER },
        events: THEIRS,
      },
      // The host's own upload (no guest row at all).
      {
        id: "40000000-0000-4000-8000-000000000005",
        type: "photo",
        status: "approved",
        guest_id: null,
        event_id: THEIR_EVENT,
        guests: null,
        events: THEIRS,
      },
    );
    fake.tables.media = media;
    // Her own Delete, as remove_my_upload answers it: removed, or refused in transit.
    fake.functions.remove_my_upload = ({ p_media_id }) => {
      const id = String(p_media_id);
      if (opts.refuse?.(id))
        throw new FakeRpcError("57014", "canceling statement");
      const row = fake.tables.media.find((m) => m.id === id);
      if (!row) return { ok: false, reason: "not_found" };
      row.status = "removed";
      row.removed_by_uploader = true;
      return { ok: true };
    };
    return fake;
  }

  const left = (fake: FakePostgrest) =>
    fake.tables.media.filter((m) => m.status !== "removed").map((m) => m.id);

  it("counts what the choice offers: photos and videos, and nothing the predicate excludes", async () => {
    elsewhereWorld(25);
    await expect(countMyUploadsElsewhere()).resolves.toEqual({
      photos: 22,
      videos: 3,
    });
  });

  it("counts nothing for nobody signed in", async () => {
    const fake = elsewhereWorld(3);
    (fake.auth as { getUser: () => Promise<unknown> }).getUser = async () => ({
      data: { user: null },
      error: null,
    });
    await expect(countMyUploadsElsewhere()).resolves.toEqual({
      photos: 0,
      videos: 0,
    });
  });

  it("★ takes every one out, whole past 1,000, and touches no one else's", async () => {
    const fake = elsewhereWorld(1_200);
    const result = await requestAccountDeletion({
      userId: USER,
      actor: "self",
      removeUploadsElsewhere: true,
    });
    expect(result).toMatchObject({ ok: true, uploadsRemoved: 1_200 });
    // Left standing: the binned event's row, her own event's row, the stranger's and the host's.
    expect(left(fake).sort()).toEqual([
      "40000000-0000-4000-8000-000000000002",
      "40000000-0000-4000-8000-000000000003",
      "40000000-0000-4000-8000-000000000004",
      "40000000-0000-4000-8000-000000000005",
    ]);
    // Read by keyset inside the URL budget, and every removal her own RPC.
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
    expect(
      fake.requests.filter((r) => r.name === "remove_my_upload"),
    ).toHaveLength(1_200);
    expect(fake.tables.profiles[0].deletion_requested_at).not.toBeNull();
  });

  it("leaves them all where they are when she does not ask (off by default)", async () => {
    const fake = elsewhereWorld(5);
    await expect(
      requestAccountDeletion({ userId: USER, actor: "self" }),
    ).resolves.toMatchObject({ ok: true, uploadsRemoved: 0 });
    expect(left(fake)).toHaveLength(5 + 4);
    expect(
      fake.requests.filter((r) => r.name === "remove_my_upload"),
    ).toHaveLength(0);
  });

  it("★ one left over refuses the whole request: no plan cancelled, no stamp, no event binned, no ban", async () => {
    const stuck = "30000000-0000-4000-8000-000000000007";
    const fake = elsewhereWorld(12, { refuse: (id) => id === stuck });
    Object.assign(fake.tables.profiles[0], { stripe_customer_id: "cus_1" });
    const { cancelSubscriptionsForDeletion } =
      await import("@/lib/stripe/account-cancel");
    vi.mocked(cancelSubscriptionsForDeletion).mockClear();
    const result = await requestAccountDeletion({
      userId: USER,
      actor: "self",
      removeUploadsElsewhere: true,
    });
    expect(result).toMatchObject({ ok: false, code: "uploads" });
    expect(!result.ok && result.message).toMatch(/wasn.t deleted/);
    // Refused out loud, never in silence.
    expect(state.captureWarning).toHaveBeenCalledWith(
      "account",
      "account_deletion_uploads_left",
      { user_id: USER, left: 1 },
    );
    expect(left(fake)).toContain(stuck);
    expect(cancelSubscriptionsForDeletion).not.toHaveBeenCalled();
    expect(fake.tables.profiles[0].deletion_requested_at).toBeNull();
    expect(state.softDeleted).toEqual([]);
    expect(state.banned).toEqual([]);
    // A retry finds only what is left.
    fake.functions.remove_my_upload = ({ p_media_id }) => {
      const row = fake.tables.media.find((m) => m.id === String(p_media_id));
      if (row) row.status = "removed";
      return { ok: true };
    };
    fake.requests.length = 0;
    await expect(
      requestAccountDeletion({
        userId: USER,
        actor: "self",
        removeUploadsElsewhere: true,
      }),
    ).resolves.toMatchObject({ ok: true, uploadsRemoved: 1 });
  });

  it("★ comes before the plan, so a plan Stripe refuses says the account was not deleted, not that nothing was", async () => {
    const fake = elsewhereWorld(2);
    Object.assign(fake.tables.profiles[0], { stripe_customer_id: "cus_1" });
    const { cancelSubscriptionsForDeletion } =
      await import("@/lib/stripe/account-cancel");
    vi.mocked(cancelSubscriptionsForDeletion).mockImplementationOnce(
      async () => {
        // By the time the plan is asked about, the photos she asked to remove are out.
        expect(left(fake)).toHaveLength(4);
        return {
          status: "failed",
          subscriptionId: "sub_1",
          message: "Stripe is unreachable.",
        };
      },
    );
    const result = await requestAccountDeletion({
      userId: USER,
      actor: "self",
      removeUploadsElsewhere: true,
    });
    expect(result).toMatchObject({ ok: false, code: "subscription" });
    expect(!result.ok && result.message).toMatch(/your account wasn.t deleted/);
    expect(fake.tables.profiles[0].deletion_requested_at).toBeNull();
  });

  it("an account already queued is not touched again", async () => {
    const fake = elsewhereWorld(3);
    fake.tables.profiles[0].deletion_requested_at =
      "2026-10-02T12:00:00.000000+00:00";
    await expect(
      requestAccountDeletion({
        userId: USER,
        actor: "self",
        removeUploadsElsewhere: true,
      }),
    ).resolves.toMatchObject({
      ok: true,
      alreadyRequested: true,
      requestedAt: "2026-10-02T12:00:00.000000+00:00",
    });
    expect(left(fake)).toHaveLength(3 + 4);
  });
});

/**
 * ★ THE OPERATOR'S CANCEL DELETION (lp/account-exit; Will, 2026-10-03: the whole recovery from
 * /admin, no SQL). Before the purge, it lifts the ban, clears the stamp and puts the account's own
 * address back on the profile. The two halves of "being deleted" move together: a stamp that
 * will not clear puts the ban back. It never runs into a purge run under way.
 */
describe("cancelAccountDeletion", () => {
  const STAMP = "2026-10-02T12:00:00.000000+00:00";

  function cancelWorld(
    opts: {
      stamp?: string | null;
      run?: { status: string; started_at: string };
      authUser?: { id: string; email: string } | null;
    } = {},
  ) {
    const bans: string[] = [];
    const fake = createFakePostgrest({
      tables: {
        profiles: [
          {
            id: USER,
            email: null,
            display_name: null,
            deletion_requested_at:
              opts.stamp === undefined ? STAMP : opts.stamp,
          },
        ],
        job_runs: opts.run ? [{ job: "purge_cron", ...opts.run }] : [],
      },
    });
    state.fake = fake;
    const authUser =
      opts.authUser === undefined
        ? { id: USER, email: "host@example.com" }
        : opts.authUser;
    (fake as unknown as { auth: unknown }).auth = {
      admin: {
        getUserById: async () =>
          authUser
            ? { data: { user: authUser }, error: null }
            : {
                data: { user: null },
                error: { message: "User not found", status: 404 },
              },
        updateUserById: async (
          _id: string,
          attrs: { ban_duration?: string },
        ) => {
          bans.push(attrs.ban_duration ?? "");
          return { data: { user: authUser }, error: null };
        },
      },
    };
    return { fake, bans };
  }

  it("★ lifts the ban, clears the stamp and puts the account's address back", async () => {
    const { fake, bans } = cancelWorld();
    await expect(cancelAccountDeletion(USER)).resolves.toEqual({ ok: true });
    expect(bans).toEqual(["none"]);
    expect(fake.tables.profiles[0]).toMatchObject({
      deletion_requested_at: null,
      email: "host@example.com",
      // What the request took stays taken.
      display_name: null,
    });
  });

  it("refuses an account that is not being deleted, and changes nothing", async () => {
    const { bans } = cancelWorld({ stamp: null });
    await expect(cancelAccountDeletion(USER)).resolves.toMatchObject({
      ok: false,
      code: "not_requested",
    });
    expect(bans).toEqual([]);
  });

  it("refuses an account the purge already took", async () => {
    const { fake, bans } = cancelWorld();
    fake.tables.profiles.length = 0;
    await expect(cancelAccountDeletion(USER)).resolves.toMatchObject({
      ok: false,
      code: "not_found",
    });
    expect(bans).toEqual([]);
  });

  it("★ refuses while a purge run is under way, and goes ahead past a run that died long ago", async () => {
    const recent = new Date(Date.now() - 60_000).toISOString();
    const { fake, bans } = cancelWorld({
      run: { status: "running", started_at: recent },
    });
    await expect(cancelAccountDeletion(USER)).resolves.toMatchObject({
      ok: false,
      code: "purge_running",
    });
    expect(bans).toEqual([]);
    expect(fake.tables.profiles[0].deletion_requested_at).toBe(STAMP);

    const stale = new Date(Date.now() - 2 * 3_600_000).toISOString();
    cancelWorld({ run: { status: "running", started_at: stale } });
    await expect(cancelAccountDeletion(USER)).resolves.toEqual({ ok: true });
  });

  it("★ a stamp that will not clear puts the ban back: sign-in never stands while still queued", async () => {
    const { fake, bans } = cancelWorld();
    // The write lands on no row while the row is still stamped (a failed write, as it reads here).
    const original = fake.from.bind(fake);
    fake.from = (table: string) => {
      const query = original(table);
      if (table !== "profiles") return query;
      const update = query.update.bind(query);
      query.update = (values: FakeRow) =>
        update(values).eq("id", "nobody") as ReturnType<typeof update>;
      return query;
    };
    await expect(cancelAccountDeletion(USER)).resolves.toMatchObject({
      ok: false,
      code: "unknown",
    });
    expect(bans).toEqual(["none", "876000h"]);
    expect(fake.tables.profiles[0].deletion_requested_at).toBe(STAMP);
  });

  it("a second operator's cancellation that landed first is this one's success", async () => {
    const { fake, bans } = cancelWorld();
    const original = fake.from.bind(fake);
    fake.from = (table: string) => {
      const query = original(table);
      if (table !== "profiles") return query;
      const update = query.update.bind(query);
      query.update = (values: FakeRow) => {
        // The other operator's write, just ahead of this one.
        fake.tables.profiles[0].deletion_requested_at = null;
        return update(values);
      };
      return query;
    };
    await expect(cancelAccountDeletion(USER)).resolves.toEqual({ ok: true });
    expect(bans).toEqual(["none"]);
  });
});
