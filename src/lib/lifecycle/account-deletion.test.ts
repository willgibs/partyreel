import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_ROWS } from "@/lib/db/read-all";
import type { FakeRow } from "@/lib/db/testing/fake-postgrest";
import type { Deadline } from "@/lib/lifecycle/sweep-budget";
import {
  createCronWorld,
  eventRow,
  everyRequestFits,
  mediaRow,
  uuidOf,
  type CronWorld,
} from "@/lib/lifecycle/testing/cron-fake";

/**
 * Account-deletion invariants, pinned TWO ways.
 *
 * Against the SOURCE TEXT, for the orderings and write scopes a runtime test cannot see from outside:
 *   - anonymising through an entitlement column would break "the Stripe webhook is the SOLE writer of
 *     tier / storage_cap_bytes" (billing-caps.md);
 *   - building an R2 key list before the legal-hold check would destroy held evidence, because every
 *     delete is R2-FIRST and the SQL guard saves only the row (trust-safety-forensics.md);
 *   - deleting the auth user before the media would FK-cascade the key rows away and orphan the
 *     objects forever;
 *   - stamping the request before the Stripe cancellation would delete an account that keeps getting
 *     billed.
 *
 * And AT RUNTIME on the clamping PostgREST fake (the 1,000-row round): an account past a thousand
 * media rows and past a thousand events is purged whole, a held event (1,500 held rows) keeps the
 * account standing, the queue past its old 100-account limit drains in one run behind held accounts,
 * and a deadline that catches an account mid-purge leaves its rows and its auth user for the next run.
 */

const ROOT = process.cwd();
const SWEEP = join(ROOT, "src/lib/lifecycle/account-deletion.ts");
const REQUEST = join(ROOT, "src/lib/db/mutations/account.ts");

const sweepSrc = readFileSync(SWEEP, "utf8");
const requestSrc = readFileSync(REQUEST, "utf8");

/** The columns only the Stripe webhook / the service layer may ever write. */
const ENTITLEMENT_COLUMNS = [
  "tier",
  "storage_cap_bytes",
  "storage_used_bytes",
  "storage_grace_until",
  "stripe_customer_id",
  "stripe_subscription_id",
  "stripe_event_created_at",
  "event_slots",
  "tier_expires_at",
  "is_admin",
];

function anonymisePatchLiteral(): string {
  const match = sweepSrc.match(
    /export const ANONYMISED_PROFILE_PATCH = \{([\s\S]*?)\} as const;/,
  );
  expect(match, "ANONYMISED_PROFILE_PATCH literal not found").toBeTruthy();
  return match![1];
}

describe("the anonymisation patch", () => {
  it("clears exactly the identity columns", () => {
    const keys = [...anonymisePatchLiteral().matchAll(/^\s*(\w+):/gm)].map(
      (m) => m[1],
    );
    expect(keys.sort()).toEqual(
      ["avatar_updated_at", "display_name", "email", "slug"].sort(),
    );
  });

  it("sets every one of them to null (an anonymisation, not a rename)", () => {
    const values = [...anonymisePatchLiteral().matchAll(/^\s*\w+:\s*(\w+),/gm)];
    expect(values.length).toBeGreaterThan(0);
    for (const [, value] of values) expect(value).toBe("null");
  });

  it("never touches an entitlement column", () => {
    const literal = anonymisePatchLiteral();
    for (const column of ENTITLEMENT_COLUMNS) {
      expect(literal, `${column} must stay the webhook's to write`).not.toMatch(
        new RegExp(`\\b${column}\\b`),
      );
    }
  });

  it("is the single source both halves write", () => {
    // The request path imports it rather than restating the columns, so the two
    // can never drift into anonymising different things.
    expect(requestSrc).toContain("ANONYMISED_PROFILE_PATCH");
    expect(requestSrc).not.toMatch(/display_name:\s*null/);
  });
});

/**
 * The sweep's own body, so an ordering pin can never accidentally match a
 * helper defined above it.
 */
function sweepBody(): string {
  const start = sweepSrc.indexOf("export async function purgeAccount");
  const end = sweepSrc.indexOf("/** A position in the deletion queue");
  expect(start, "purgeAccount not found").toBeGreaterThan(-1);
  expect(end, "the sweep body has no end marker").toBeGreaterThan(start);
  return sweepSrc.slice(start, end);
}

describe("the sweep's destruction order (source text)", () => {
  const body = sweepBody();
  const partition = body.indexOf("partitionEventsByHold(");
  const heldRead = body.indexOf("readHeldEventIds(");
  const holdFilter = body.indexOf('.filter("legal_hold_at", "is", null)');
  const reclaim = body.indexOf("reclaimMedia(");
  const recheck = body.indexOf("readHeldEventIds(admin, chunk)");
  const eventDelete = body.search(/\.from\("events"\)\s*\.delete\(\)/);
  const authDelete = body.indexOf("auth.admin.deleteUser(");

  it("finds every step it means to order", () => {
    for (const [name, at] of Object.entries({
      partition,
      heldRead,
      holdFilter,
      reclaim,
      recheck,
      eventDelete,
      authDelete,
    })) {
      expect(at, `${name} not found in the sweep`).toBeGreaterThan(-1);
    }
  });

  it("decides legal holds before it builds any R2 key list, and reads no held row", () => {
    expect(heldRead).toBeLessThan(reclaim);
    expect(partition).toBeLessThan(reclaim);
    expect(holdFilter).toBeLessThan(reclaim);
  });

  it("reclaims the media (R2 first, inside reclaimMedia) before the event rows go", () => {
    expect(reclaim).toBeLessThan(eventDelete);
  });

  it("asks the holds again right before the event rows go", () => {
    expect(recheck).toBeGreaterThan(reclaim);
    expect(recheck).toBeLessThan(eventDelete);
    expect(body).toMatch(
      /\.in\(\s*"id",\s*chunk\.filter\(\(id\) => !stillHeld\.has\(id\)\)/,
    );
  });

  it("deletes the auth user last of all, after an honest count", () => {
    expect(eventDelete).toBeLessThan(authDelete);
    const remaining = body.indexOf("mustCount(");
    expect(remaining).toBeGreaterThan(-1);
    expect(remaining).toBeLessThan(authDelete);
    expect(body).toMatch(/if \(remaining > 0\)/);
  });

  it("keeps the account whole when a hold blocks an event", () => {
    expect(body).toContain("const { purgeable, blocked }");
  });

  it("scrubs the guest rows in the re-anonymise, before anything is deleted and before the profile", () => {
    // lp/identity-email: a failed scrub throws out of reanonymise, which runs first, so the purge
    // stops before an R2 delete, an event delete or deleteUser. It is also the only pass that
    // reaches a HELD account, which never gets as far as the BEFORE DELETE trigger.
    const reanonymiseCall = body.indexOf("await reanonymise(admin, userId)");
    expect(reanonymiseCall).toBeGreaterThan(-1);
    expect(reanonymiseCall).toBeLessThan(reclaim);
    expect(reanonymiseCall).toBeLessThan(authDelete);
    const helper = sweepSrc.slice(
      sweepSrc.indexOf("async function reanonymise("),
      sweepSrc.indexOf("/** EVERY event the account hosts"),
    );
    const scrub = helper.indexOf("scrubAccountGuestRows(admin, userId)");
    expect(scrub).toBeGreaterThan(-1);
    expect(scrub).toBeLessThan(
      helper.indexOf(".update(ANONYMISED_PROFILE_PATCH)"),
    );
  });
});

describe("the guest-row scrub (source text)", () => {
  function patchLiteral(): string {
    const match = sweepSrc.match(
      /export const SCRUBBED_GUEST_PATCH = \{([\s\S]*?)\} as const;/,
    );
    expect(match, "SCRUBBED_GUEST_PATCH literal not found").toBeTruthy();
    return match![1];
  }

  it("clears the two addresses, the stamp and a typed name, never the proof or the link", () => {
    const keys = [...patchLiteral().matchAll(/^\s*(\w+):\s*null,/gm)].map(
      (m) => m[1],
    );
    expect(keys.sort()).toEqual(
      ["display_name", "email", "pending_email", "pending_email_at"].sort(),
    );
    // `verified_at` is why a deleted account's row writes for nobody; `user_id` is the FK's.
    expect(patchLiteral()).not.toMatch(/verified_at|user_id/);
  });

  it("clears what the BEFORE DELETE trigger clears, so the app scrub and the database net agree", () => {
    const sql = readFileSync(
      join(ROOT, "supabase/migrations/20260926200000_identity.sql"),
      "utf8",
    );
    const fn = sql.slice(
      sql.indexOf(
        "create or replace function public.scrub_account_guest_rows()",
      ),
    );
    const set = fn.slice(fn.indexOf("set email = null"), fn.indexOf("where"));
    for (const column of [
      "email",
      "pending_email",
      "pending_email_at",
      "display_name",
    ]) {
      expect(set, column).toMatch(new RegExp(`\\b${column} = null`));
    }
  });
});

describe("the request path's order", () => {
  const cancel = requestSrc.indexOf("cancelSubscriptionForDeletion(");
  const abort = requestSrc.indexOf('subscription.status === "failed"');
  const stamp = requestSrc.indexOf("deletion_requested_at: new Date()");
  const bin = requestSrc.indexOf("binHostedEvents(");
  const newsletter = requestSrc.indexOf(
    "deleteNewsletterSignups(profile.email)",
  );
  const anonymise = requestSrc.indexOf(".update(ANONYMISED_PROFILE_PATCH)");
  const ban = requestSrc.indexOf("banAuthUser(");
  const scrub = requestSrc.indexOf(
    "await scrubAccountGuestRows(admin, userId)",
  );

  it("finds every step it means to order", () => {
    for (const [name, at] of Object.entries({
      cancel,
      abort,
      stamp,
      bin,
      newsletter,
      anonymise,
      ban,
      scrub,
    })) {
      expect(at, `${name} not found in the request path`).toBeGreaterThan(-1);
    }
  });

  it("cancels the plan, and refuses the deletion, before anything is destroyed", () => {
    expect(cancel).toBeLessThan(stamp);
    expect(abort).toBeLessThan(stamp);
    expect(requestSrc).toMatch(/code: "subscription"/);
  });

  it("stamps the request before the destructive steps, so the sweep can finish it", () => {
    expect(stamp).toBeLessThan(bin);
    expect(stamp).toBeLessThan(anonymise);
  });

  it("removes the newsletter address before the anonymisation nulls it", () => {
    expect(newsletter).toBeLessThan(anonymise);
  });

  it("scrubs the guest rows after the stamp and before the anonymisation", () => {
    expect(scrub).toBeGreaterThan(stamp);
    expect(scrub).toBeLessThan(anonymise);
  });

  it("locks the auth user out between the request and the sweep", () => {
    expect(requestSrc).toContain("ban_duration");
    expect(ban).toBeGreaterThan(stamp);
  });

  it("never takes an email address from the caller", () => {
    // Both newsletter paths read the address from the caller's own profile row,
    // so the removal can only ever unsubscribe the caller themselves.
    expect(requestSrc).not.toMatch(/deleteNewsletterSignups\(\s*email\s*\)/);
    expect(requestSrc).toContain("deleteNewsletterSignups(profile?.email)");
  });
});

/* ──────────────────────────── at runtime, on the fake ──────────────────────────── */

const state = vi.hoisted(() => ({
  world: null as CronWorld | null,
  deletedUsers: [] as string[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: vi.fn(),
  captureWarning: vi.fn(),
}));
vi.mock("@/lib/supabase/avatar-storage", () => ({
  removeAvatar: vi.fn(async () => undefined),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => state.world!.client,
}));
vi.mock("@/lib/r2/delete", () => ({
  deleteR2Objects: vi.fn(async (keys: string[]) => {
    state.world?.recordR2(keys);
    return { deleted: keys.length, errored: [] };
  }),
  listR2Objects: vi.fn(),
}));

const { getAccountDeletionState, purgeAccount, sweepDeletedAccounts } =
  await import("@/lib/lifecycle/account-deletion");

const HELD = "2026-09-01T00:00:00.000000+00:00";
const NOW = new Date("2026-09-23T04:00:00.000Z");

function passesAfter(n: number): Deadline {
  let asked = 0;
  return { at: 0, passed: () => asked++ >= n };
}

/**
 * The fake world, with `auth.admin.deleteUser` recording who was deleted. `guests` defaults to empty
 * (the re-anonymise scrubs it on every account); `noGuests` leaves the table out, so the fake answers
 * the scrub with PGRST205, a failed write.
 */
function world(
  tables: Record<string, FakeRow[]>,
  opts: { noGuests?: boolean } = {},
): CronWorld {
  if (!opts.noGuests) tables.guests ??= [];
  const w = createCronWorld(tables);
  (w.fake as unknown as { auth: unknown }).auth = {
    getUser: async () => ({ data: { user: null }, error: null }),
    admin: {
      deleteUser: async (id: string) => {
        state.deletedUsers.push(id);
        return { error: null };
      },
    },
  };
  state.world = w;
  return w;
}

function profile(id: string, requestedAt: string | null = null): FakeRow {
  return {
    id,
    email: `${id}@example.com`,
    display_name: "Someone",
    slug: id.slice(0, 8),
    avatar_updated_at: null,
    deletion_requested_at: requestedAt,
  };
}

beforeEach(() => {
  state.world = null;
  state.deletedUsers = [];
});

describe("purgeAccount on the clamping fake", () => {
  it("purges every unheld event whole, keeps a held event whole, and keeps the held account", async () => {
    const user = uuidOf("u", 1);
    const a = eventRow(uuidOf("ea", 1), user);
    const b = eventRow(uuidOf("eb", 1), user);
    const c = eventRow(uuidOf("ec", 1), user, { deleted_at: HELD });
    const media = [
      ...Array.from({ length: 2_500 }, (_, i) => mediaRow(uuidOf("ma", i), a)),
      ...Array.from({ length: 1_500 }, (_, i) =>
        mediaRow(uuidOf("mb", i), b, { legal_hold_at: HELD }),
      ),
      ...Array.from({ length: 5 }, (_, i) => mediaRow(uuidOf("mc", i), b)),
      ...Array.from({ length: 1_200 }, (_, i) => mediaRow(uuidOf("md", i), c)),
    ];
    const w = world({
      profiles: [profile(user, HELD)],
      events: [a, b, c],
      media,
    });
    const handled = new Set<string>();

    const result = await purgeAccount(w.client, user, handled);

    expect(result).toMatchObject({
      outcome: "held",
      events: 2,
      hold_blocked_events: 1,
      media_rows: 3_700,
    });
    expect(w.fake.tables.events.map((e) => e.id)).toEqual([b.id]);
    expect(w.fake.tables.media).toHaveLength(1_505);
    expect(state.deletedUsers).toEqual([]);
    expect(handled.size).toBe(3_700);
    // The profile is anonymised all the same.
    expect(w.fake.tables.profiles[0]).toMatchObject({
      email: null,
      display_name: null,
      slug: null,
    });
    expect(Math.max(...w.purgeCallSizes)).toBeLessThanOrEqual(MAX_ROWS);
    expect(everyRequestFits(w.fake)).toBe(true);
  });

  it("purges an account of 1,200 events (past one read) and deletes the auth user last", async () => {
    const user = uuidOf("u", 2);
    const events = Array.from({ length: 1_200 }, (_, i) =>
      eventRow(uuidOf("e", i), user, { deleted_at: HELD }),
    );
    const media = events.flatMap((e, i) => [
      mediaRow(uuidOf("m", 2 * i), e),
      mediaRow(uuidOf("m", 2 * i + 1), e),
    ]);
    const w = world({ profiles: [profile(user, HELD)], events, media });

    const result = await purgeAccount(w.client, user);

    expect(result).toMatchObject({
      outcome: "deleted",
      events: 1_200,
      hold_blocked_events: 0,
      media_rows: 2_400,
    });
    expect(w.fake.tables.events).toHaveLength(0);
    expect(w.fake.tables.media).toHaveLength(0);
    expect(state.deletedUsers).toEqual([user]);
    expect(everyRequestFits(w.fake)).toBe(true);
  });

  it("stops at its deadline mid-purge: the events and the auth user wait for the next run", async () => {
    const user = uuidOf("u", 3);
    const e = eventRow(uuidOf("e", 1), user);
    const media = Array.from({ length: 2_500 }, (_, i) =>
      mediaRow(uuidOf("m", i), e),
    );
    const w = world({ profiles: [profile(user, HELD)], events: [e], media });

    const result = await purgeAccount(
      w.client,
      user,
      undefined,
      passesAfter(1),
    );

    expect(result).toMatchObject({
      outcome: "unfinished",
      events: 0,
      media_rows: MAX_ROWS,
    });
    expect(w.fake.tables.events).toHaveLength(1);
    expect(w.fake.tables.media).toHaveLength(1_500);
    expect(state.deletedUsers).toEqual([]);

    const again = await purgeAccount(w.client, user);
    expect(again).toMatchObject({ outcome: "deleted", media_rows: 1_500 });
    expect(state.deletedUsers).toEqual([user]);
  });
});

describe("the guest-row scrub on the clamping fake (lp/identity-email)", () => {
  const OTHER_EVENT = uuidOf("oe", 1);

  /** A guest row at another host's event: `who` owns it; `over` sets the identity columns. */
  function guestRow(id: string, who: string | null, over: FakeRow): FakeRow {
    return {
      id,
      event_id: OTHER_EVENT,
      user_id: who,
      email: null,
      pending_email: null,
      pending_email_at: null,
      display_name: null,
      verified_at: null,
      ...over,
    };
  }

  it("takes the addresses and a typed name off the account's rows, keeps the proof, and leaves others alone", async () => {
    const user = uuidOf("u", 40);
    const bystander = uuidOf("u", 41);
    const guests = [
      guestRow(uuidOf("g", 1), user, {
        email: "gone@example.com",
        verified_at: HELD,
      }),
      guestRow(uuidOf("g", 2), user, {
        display_name: "Typed Name",
        pending_email: "typed@example.com",
        pending_email_at: HELD,
      }),
      // Already clean: not counted, not rewritten.
      guestRow(uuidOf("g", 3), user, { verified_at: HELD }),
      guestRow(uuidOf("g", 4), bystander, {
        email: "stays@example.com",
        verified_at: HELD,
      }),
      // A name-only guest with no account keeps what they typed.
      guestRow(uuidOf("g", 5), null, {
        display_name: "Maya",
        pending_email: "maya@example.com",
        pending_email_at: HELD,
      }),
    ];
    const w = world({ profiles: [profile(user, HELD)], guests });

    const result = await purgeAccount(w.client, user);

    expect(result).toMatchObject({
      outcome: "deleted",
      guest_rows_scrubbed: 2,
    });
    const [verified, typed, clean, other, nameOnly] = w.fake.tables.guests;
    expect(verified).toMatchObject({ email: null, verified_at: HELD });
    expect(typed).toMatchObject({
      display_name: null,
      pending_email: null,
      pending_email_at: null,
    });
    expect(clean).toMatchObject({ verified_at: HELD });
    expect(other).toMatchObject({ email: "stays@example.com" });
    expect(nameOnly).toMatchObject({
      display_name: "Maya",
      pending_email: "maya@example.com",
    });
    // ONE write keyed on the account, whatever it joined: no id list rides the URL.
    const writes = w.fake.requests.filter(
      (r) => r.name === "guests" && r.method === "PATCH",
    );
    expect(writes).toHaveLength(1);
    expect(writes[0].filters).toContainEqual({
      column: "user_id",
      op: "eq",
      value: user,
    });
  });

  it("is a quiet zero on the next run of a held account", async () => {
    const user = uuidOf("u", 42);
    const e = eventRow(uuidOf("e", 42), user, { deleted_at: HELD });
    const w = world({
      profiles: [profile(user, HELD)],
      events: [e],
      media: [mediaRow(uuidOf("m", 42), e, { legal_hold_at: HELD })],
      guests: [
        guestRow(uuidOf("g", 42), user, {
          email: "gone@example.com",
          verified_at: HELD,
        }),
      ],
    });

    expect(await purgeAccount(w.client, user)).toMatchObject({
      outcome: "held",
      guest_rows_scrubbed: 1,
    });
    expect(await purgeAccount(w.client, user)).toMatchObject({
      outcome: "held",
      guest_rows_scrubbed: 0,
    });
  });

  it("★ a failed scrub stops the purge before anything is deleted, deleteUser included", async () => {
    const user = uuidOf("u", 43);
    const e = eventRow(uuidOf("e", 43), user, { deleted_at: HELD });
    const w = world(
      {
        profiles: [profile(user, HELD)],
        events: [e],
        media: [mediaRow(uuidOf("m", 43), e)],
      },
      { noGuests: true },
    );

    await expect(purgeAccount(w.client, user)).rejects.toThrow(
      /scrubAccountGuestRows/,
    );
    expect(state.deletedUsers).toEqual([]);
    expect(w.fake.tables.events).toHaveLength(1);
    expect(w.fake.tables.media).toHaveLength(1);
    expect(w.log).toEqual([]);
  });

  it("the sweep reports every scrubbed row in its tally, for the run's /admin detail", async () => {
    const a = uuidOf("u", 44);
    const b = uuidOf("u", 45);
    const w = world({
      profiles: [profile(a, HELD), profile(b, HELD)],
      guests: [
        guestRow(uuidOf("g", 44), a, {
          email: "a@example.com",
          verified_at: HELD,
        }),
        guestRow(uuidOf("g", 45), b, {
          email: "b@example.com",
          verified_at: HELD,
        }),
        guestRow(uuidOf("g", 46), b, { display_name: "B typed" }),
      ],
    });

    const result = await sweepDeletedAccounts(w.client, NOW, new Set());

    expect(result).toMatchObject({
      accounts: 2,
      accounts_deleted: 2,
      guest_rows_scrubbed: 3,
      rows_failed: 0,
    });
  });
});

describe("sweepDeletedAccounts on the clamping fake", () => {
  /** 250 stamped accounts, oldest first; the first 120 hold evidence, so they never leave the queue. */
  function queue() {
    const profiles: FakeRow[] = [];
    const events: FakeRow[] = [];
    const media: FakeRow[] = [];
    for (let i = 0; i < 250; i++) {
      const id = uuidOf("u", i);
      profiles.push(
        profile(
          id,
          `2026-09-${String(1 + (i % 20)).padStart(2, "0")}T00:00:00.000000+00:00`,
        ),
      );
      if (i < 120) {
        const e = eventRow(uuidOf("e", i), id, { deleted_at: HELD });
        events.push(e);
        media.push(mediaRow(uuidOf("m", i), e, { legal_hold_at: HELD }));
      }
    }
    // Two accounts that never asked to be deleted.
    profiles.push(profile(uuidOf("k", 1)), profile(uuidOf("k", 2)));
    return world({ profiles, events, media });
  }

  it("works the whole queue in one run, past its old limit and behind held accounts", async () => {
    const w = queue();
    const result = await sweepDeletedAccounts(w.client, NOW, new Set());
    expect(result).toMatchObject({
      accounts: 250,
      accounts_deleted: 130,
      accounts_held: 120,
      accounts_unfinished: 0,
      rows_failed: 0,
    });
    expect(result.stopped_early).toBeUndefined();
    expect(state.deletedUsers).toHaveLength(130);
    expect(everyRequestFits(w.fake)).toBe(true);
  });

  it("stops at its deadline and says how many accounts it left", async () => {
    const w = queue();
    // One ask before the first queue page, then one per account: it stops after 40 accounts.
    const result = await sweepDeletedAccounts(w.client, NOW, new Set(), {
      deadline: passesAfter(41),
    });
    expect(result.accounts).toBe(40);
    expect(result.stopped_early).toBe(true);
    expect(result.remaining).toBe(210);
  });

  it("reports not_provisioned before the deletion column exists", async () => {
    const w = world({ profiles: [], events: [], media: [] });
    // The fake answers an unknown table with PGRST205, one of the missing-schema codes.
    delete (w.fake.tables as Record<string, unknown>).profiles;
    const result = await sweepDeletedAccounts(w.client, NOW);
    expect(result.skipped).toBe("not_provisioned");
  });
});

describe("getAccountDeletionState on the clamping fake", () => {
  it("counts every event and names a held one past 1,000 held rows", async () => {
    const user = uuidOf("u", 9);
    const events = Array.from({ length: 1_200 }, (_, i) =>
      eventRow(uuidOf("e", i), user),
    );
    const media = Array.from({ length: 1_500 }, (_, i) =>
      mediaRow(uuidOf("m", i), events[1_199], { legal_hold_at: HELD }),
    );
    world({ profiles: [profile(user, HELD)], events, media });

    expect(await getAccountDeletionState(user)).toEqual({
      requestedAt: HELD,
      eventCount: 1_200,
      heldEventCount: 1,
    });
  });
});
