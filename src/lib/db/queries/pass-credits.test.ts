/**
 * ★ A STUCK CREDIT, ONE RULE IN TWO FORMS (credit-watch): the PostgREST filters the Accounts list and the jobs signal
 * ask the table with (`stuckFilter`) find exactly the claims the pure rule judges stuck (`stuckKind`), at every edge:
 * the hour, a lease ending this instant, a null lease, a live lease, a grant just in, a credit done, a released claim
 * with and without a grant beside it. Run on the PostgREST fake, whose filters are PostgREST's own grammar, so a filter
 * that drifted from the rule fails here rather than as a stuck credit nobody sees.
 *
 * And the operator's reads around it: the list's count and its oldest-first rows with each account, her own claims for
 * her page, one claim for the Retry; a failed read is `ok: false` with its words, never "none stuck".
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { settleKind, stuckKind } from "@/lib/billing/passes-stuck";
import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

const state = vi.hoisted(() => ({ fake: null as FakePostgrest | null }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(state.fake!),
}));

const {
  readAccountPassCredits,
  readCreditsToSettle,
  readPassCredit,
  readStuckPassCredits,
  STUCK_LIST_LIMIT,
} = await import("@/lib/db/queries/pass-credits");

const NOW = Date.parse("2026-10-05T12:00:00.000Z");
const MIN = 60_000;
// ★ The fixture's instants share the filters' own format (`toISOString`), so the fake's string comparison is the
// instant's comparison at the very edges this file is about (Postgres compares the instants themselves).
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const ahead = (ms: number) => new Date(NOW + ms).toISOString();

const HOST = "44444444-4444-4444-8444-444444444444";
const OTHER = "55555555-5555-4555-8555-555555555555";

let n = 0;
function claim(name: string, over: Record<string, unknown> = {}): FakeRow {
  n += 1;
  return {
    stripe_session_id: `cs_test_${name}`,
    profile_id: HOST,
    credit_cents: 1000 + n,
    pass_ids: ["00000000-0000-4000-8000-00000000000a"],
    claimed_until: ago(50 * MIN),
    balance_transaction_id: null,
    granted_at: null,
    converted_at: null,
    converted_count: null,
    released_at: null,
    created_at: ago(30 * MIN),
    profiles: { email: "host@example.com", display_name: "Hosta" },
    ...over,
  };
}

/** Every edge of the rule, each named for what it is. */
function edges(): FakeRow[] {
  return [
    claim("ungranted_past_hour", {
      created_at: ago(61 * MIN),
      claimed_until: ago(51 * MIN),
    }),
    claim("ungranted_at_hour", {
      created_at: ago(60 * MIN),
      claimed_until: ago(50 * MIN),
    }),
    claim("ungranted_leased", {
      created_at: ago(3 * 60 * MIN),
      claimed_until: ahead(2 * MIN),
    }),
    claim("ungranted_lease_ends_now", {
      created_at: ago(3 * 60 * MIN),
      claimed_until: ago(0),
    }),
    claim("ungranted_null_lease", {
      created_at: ago(2 * 60 * MIN),
      claimed_until: null,
    }),
    claim("ungranted_under_hour", {
      created_at: ago(20 * MIN),
      claimed_until: ago(10 * MIN),
    }),
    claim("granted_past_hour", {
      created_at: ago(5 * 60 * MIN),
      claimed_until: null,
      balance_transaction_id: "cbtxn_a",
      granted_at: ago(4 * 60 * MIN),
    }),
    claim("granted_at_hour", {
      created_at: ago(61 * MIN),
      claimed_until: null,
      balance_transaction_id: "cbtxn_b",
      granted_at: ago(60 * MIN),
    }),
    claim("granted_moments_ago", {
      created_at: ago(2 * 60 * MIN),
      claimed_until: null,
      balance_transaction_id: "cbtxn_c",
      granted_at: ago(MIN),
    }),
    claim("converted", {
      created_at: ago(5 * 60 * MIN),
      claimed_until: null,
      balance_transaction_id: "cbtxn_d",
      granted_at: ago(5 * 60 * MIN),
      converted_at: ago(5 * 60 * MIN),
      converted_count: 1,
    }),
    claim("released", {
      created_at: ago(5 * 60 * MIN),
      claimed_until: null,
      released_at: ago(4 * 60 * MIN),
    }),
    claim("released_granted", {
      created_at: ago(5 * 60 * MIN),
      claimed_until: null,
      balance_transaction_id: "cbtxn_e",
      granted_at: ago(4 * 60 * MIN),
      released_at: ago(4 * 60 * MIN),
    }),
  ];
}

beforeEach(() => {
  state.fake = null;
  n = 0;
});

describe("the stuck rule's two forms", () => {
  it("★ the table's filters find exactly the claims the pure rule judges stuck, at every edge", async () => {
    const rows = edges();
    state.fake = createFakePostgrest({ tables: { pass_credits: rows } });
    const read = await readStuckPassCredits(NOW);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    const judged = rows
      .filter((row) => stuckKind(row as never, NOW) !== null)
      .map((row) => row.stripe_session_id)
      .sort();
    expect(judged).toEqual([
      "cs_test_granted_past_hour",
      "cs_test_ungranted_lease_ends_now",
      "cs_test_ungranted_null_lease",
      "cs_test_ungranted_past_hour",
    ]);
    expect(read.value.rows.map((row) => row.stripe_session_id).sort()).toEqual(
      judged,
    );
    expect(read.value.total).toBe(judged.length);
    // Each says which half it is, the same as the rule.
    for (const row of read.value.rows) {
      expect(row.kind).toBe(stuckKind(row, NOW));
    }
  });

  it("lists the oldest owing first, each with the account it is owed to, and counts past what it lists", async () => {
    const rows: FakeRow[] = [
      claim("granted_long_ago", {
        created_at: ago(9 * 60 * MIN),
        claimed_until: null,
        balance_transaction_id: "cbtxn_x",
        granted_at: ago(8 * 60 * MIN),
      }),
      claim("claimed_longer_ago", {
        created_at: ago(10 * 60 * MIN),
        profile_id: OTHER,
        profiles: { email: "other@example.com", display_name: null },
      }),
      claim("claimed_recently", { created_at: ago(2 * 60 * MIN) }),
    ];
    for (let i = 0; i < STUCK_LIST_LIMIT + 5; i++) {
      rows.push(claim(`many_${i}`, { created_at: ago((3 * 60 + i) * MIN) }));
    }
    state.fake = createFakePostgrest({ tables: { pass_credits: rows } });
    const read = await readStuckPassCredits(NOW);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.value.total).toBe(STUCK_LIST_LIMIT + 8);
    expect(read.value.rows).toHaveLength(STUCK_LIST_LIMIT);
    expect(read.value.rows[0]).toMatchObject({
      stripe_session_id: "cs_test_claimed_longer_ago",
      profile_id: OTHER,
      kind: "never_granted",
      since: ago(10 * 60 * MIN),
      email: "other@example.com",
      displayName: null,
    });
    expect(read.value.rows[1]).toMatchObject({
      stripe_session_id: "cs_test_granted_long_ago",
      kind: "never_converted",
      since: ago(8 * 60 * MIN),
      displayName: "Hosta",
    });
    const sinces = read.value.rows.map((row) => Date.parse(row.since));
    expect([...sinces].sort((a, b) => a - b)).toEqual(sinces);
    // The embed stays its own fields, never a stray key on the claim.
    expect(read.value.rows[0]).not.toHaveProperty("profiles");
  });

  it("★ a read that fails is No reading with its words, never none stuck", async () => {
    state.fake = createFakePostgrest({ tables: {} });
    const read = await readStuckPassCredits(NOW);
    expect(read.ok).toBe(false);
    if (read.ok) return;
    expect(read.message).toMatch(/stuck credits/);
  });
});

describe("the credits only Stripe can settle, one rule in two forms (credit-watch's red-team)", () => {
  const DAY = 24 * 60 * MIN;

  function settleEdges(): FakeRow[] {
    return [
      claim("twice_recent", {
        created_at: ago(3 * DAY),
        claimed_until: null,
        balance_transaction_id: "cbtxn_t1",
        granted_at: ago(2 * DAY),
        released_at: ago(2 * DAY),
      }),
      claim("twice_stale", {
        created_at: ago(40 * DAY),
        claimed_until: null,
        balance_transaction_id: "cbtxn_t2",
        granted_at: ago(31 * DAY),
        released_at: ago(31 * DAY),
      }),
      claim("released_ungranted", {
        created_at: ago(3 * DAY),
        claimed_until: null,
        released_at: ago(2 * DAY),
      }),
      claim("converted_none", {
        created_at: ago(DAY),
        claimed_until: null,
        balance_transaction_id: "cbtxn_n",
        granted_at: ago(DAY),
        converted_at: ago(DAY),
        converted_count: 0,
        profiles: { email: "none@example.com", display_name: "Nona" },
      }),
      claim("converted_two", {
        created_at: ago(DAY),
        claimed_until: null,
        balance_transaction_id: "cbtxn_c",
        granted_at: ago(DAY),
        converted_at: ago(DAY),
        converted_count: 2,
      }),
      claim("stuck", {
        created_at: ago(5 * 60 * MIN),
        claimed_until: ago(4 * 60 * MIN),
      }),
    ];
  }

  it("★ the table's filters find exactly the claims the pure rule says wait on Stripe, newest first, each with its account", async () => {
    const rows = settleEdges();
    state.fake = createFakePostgrest({ tables: { pass_credits: rows } });
    const read = await readCreditsToSettle(NOW);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    const judged = rows
      .filter((row) => settleKind(row as never, NOW) !== null)
      .map((row) => row.stripe_session_id)
      .sort();
    expect(judged).toEqual(["cs_test_converted_none", "cs_test_twice_recent"]);
    expect(read.value.rows.map((row) => row.stripe_session_id).sort()).toEqual(
      judged,
    );
    expect(read.value.total).toBe(2);
    // Newest first: the conversion of none (a day ago), then the release (two days ago).
    expect(read.value.rows.map((row) => row.kind)).toEqual([
      "converted_none",
      "granted_twice",
    ]);
    expect(read.value.rows[0]).toMatchObject({
      since: ago(DAY),
      displayName: "Nona",
      email: "none@example.com",
    });
  });

  it("a read that fails is No reading with its words, never nothing to settle", async () => {
    state.fake = createFakePostgrest({ tables: {} });
    const read = await readCreditsToSettle(NOW);
    expect(read).toMatchObject({ ok: false });
    if (read.ok) return;
    expect(read.message).toMatch(/settle in Stripe/);
  });
});

describe("her claims, and one claim", () => {
  it("reads her claims newest first, never another account's", async () => {
    state.fake = createFakePostgrest({
      tables: {
        pass_credits: [
          claim("older", { created_at: ago(9 * 60 * MIN) }),
          claim("newer", { created_at: ago(MIN) }),
          claim("theirs", { profile_id: OTHER }),
        ],
      },
    });
    const read = await readAccountPassCredits(HOST);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.value.map((row) => row.stripe_session_id)).toEqual([
      "cs_test_newer",
      "cs_test_older",
    ]);
  });

  it("a failed read of hers is No reading with its words", async () => {
    state.fake = createFakePostgrest({ tables: {} });
    const read = await readAccountPassCredits(HOST);
    expect(read).toMatchObject({ ok: false });
  });

  it("finds one claim by its checkout, null when none, and throws on a failed read (the Retry refuses then)", async () => {
    state.fake = createFakePostgrest({
      tables: { pass_credits: [claim("one"), claim("two")] },
    });
    await expect(readPassCredit("cs_test_two")).resolves.toMatchObject({
      stripe_session_id: "cs_test_two",
      profile_id: HOST,
    });
    await expect(readPassCredit("cs_test_none")).resolves.toBeNull();
    state.fake = createFakePostgrest({ tables: {} });
    await expect(readPassCredit("cs_test_one")).rejects.toThrow(/a credit/);
  });
});
