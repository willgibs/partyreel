import { beforeEach, describe, expect, it, vi } from "vitest";

import { MEGABYTE } from "@/lib/constants/tiers";
import { MAX_ROWS } from "@/lib/db/read-all";
import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

/**
 * ★ THE OPERATOR'S CREDITS, THE READS (crumbs-92, X6): an account's live credits with the reason, the operator and the
 * moment of each; and the list's total a row. A read that fails says so with its words and never reads as "no credits"
 * (a credit unseen is a credit granted twice). Over the clamping fake, so a read that PostgREST would cut at 1,000 rows
 * is caught here.
 */

const state = vi.hoisted(() => ({ fake: null as unknown }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(state.fake as FakePostgrest),
}));

const { readAccountUploadsCredits, readLiveCreditBytes } =
  await import("@/lib/db/queries/uploads-credits");

const NOW = new Date("2026-10-08T12:00:00.000Z");
const HOST = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";
const OP = "0f1e2d3c-4b5a-4968-8776-655443322110";

let tables: Record<string, FakeRow[]>;

function seed(over: Partial<typeof tables> = {}, urlLengthLimit?: number) {
  tables = {
    uploads_credits: [
      {
        id: "c-new",
        host_id: HOST,
        bytes: 50 * MEGABYTE,
        window_ends_at: "2026-11-01T00:00:00+00:00",
        created_at: "2026-10-08T11:00:00+00:00",
        action_id: "a-new",
      },
      {
        id: "c-old",
        host_id: HOST,
        bytes: 100 * MEGABYTE,
        window_ends_at: "2026-11-01T00:00:00+00:00",
        created_at: "2026-10-02T09:00:00+00:00",
        action_id: "a-old",
      },
      {
        // The window ended last month: nothing now.
        id: "c-ended",
        host_id: HOST,
        bytes: 300 * MEGABYTE,
        window_ends_at: "2026-10-01T00:00:00+00:00",
        created_at: "2026-09-12T09:00:00+00:00",
        action_id: "a-ended",
      },
      {
        id: "c-theirs",
        host_id: OTHER,
        bytes: 10 * MEGABYTE,
        window_ends_at: "2026-11-01T00:00:00+00:00",
        created_at: "2026-10-05T09:00:00+00:00",
        action_id: "a-theirs",
      },
    ],
    admin_actions: [
      { id: "a-new", operator_id: OP, reason: "second lift, same night" },
      {
        id: "a-old",
        operator_id: OP,
        reason: "her wedding guests were refused",
      },
      { id: "a-ended", operator_id: OP, reason: "last month" },
      { id: "a-theirs", operator_id: null, reason: "another account's" },
    ],
    profiles: [{ id: OP, email: "hi@willgibs.com" }],
    ...over,
  };
  state.fake = createFakePostgrest({ tables, urlLengthLimit });
  return state.fake as FakePostgrest;
}

beforeEach(() => {
  seed();
});

describe("one account's live credits", () => {
  it("★ are the ones whose window has not ended, newest first, with who made each, when and why", async () => {
    const read = await readAccountUploadsCredits(HOST, NOW);
    expect(read).toEqual({
      ok: true,
      value: [
        {
          id: "c-new",
          bytes: 50 * MEGABYTE,
          windowEndsAt: "2026-11-01T00:00:00+00:00",
          grantedAt: "2026-10-08T11:00:00+00:00",
          reason: "second lift, same night",
          operator: "hi@willgibs.com",
        },
        {
          id: "c-old",
          bytes: 100 * MEGABYTE,
          windowEndsAt: "2026-11-01T00:00:00+00:00",
          grantedAt: "2026-10-02T09:00:00+00:00",
          reason: "her wedding guests were refused",
          operator: "hi@willgibs.com",
        },
      ],
    });
  });

  it("is an honest empty for an account that holds none, and asks nothing more", async () => {
    const fake = seed();
    expect(await readAccountUploadsCredits("nobody", NOW)).toEqual({
      ok: true,
      value: [],
    });
    expect(fake.requests.map((r) => r.name)).toEqual(["uploads_credits"]);
  });

  it("names no operator when her address cannot be read, and shows the credit all the same", async () => {
    seed({ profiles: [] });
    const read = await readAccountUploadsCredits(HOST, NOW);
    expect(read.ok && read.value.map((c) => c.operator)).toEqual([null, null]);
  });

  it("★ a failed read says why and is never an empty list", async () => {
    seed({}, 40);
    const read = await readAccountUploadsCredits(HOST, NOW);
    expect(read.ok).toBe(false);
    expect(!read.ok && read.message).toMatch(/fetch failed/);
  });

  it("★ a live credit whose log row cannot be read fails the read, rather than draw a clean one", async () => {
    seed({ admin_actions: [] });
    const read = await readAccountUploadsCredits(HOST, NOW);
    expect(read.ok).toBe(false);
    expect(!read.ok && read.message).toMatch(/without a log row/);
  });

  it("★ more live credits than the function ever allows is a failure, not a quietly cut list", async () => {
    const many: FakeRow[] = Array.from({ length: 60 }, (_, i) => ({
      id: `c${i}`,
      host_id: HOST,
      bytes: MEGABYTE,
      window_ends_at: "2026-11-01T00:00:00+00:00",
      created_at: `2026-10-08T10:${String(i).padStart(2, "0")}:00+00:00`,
      action_id: `a${i}`,
    }));
    seed({ uploads_credits: many });
    const read = await readAccountUploadsCredits(HOST, NOW);
    expect(read.ok).toBe(false);
    expect(!read.ok && read.message).toMatch(/refuses/);
  });

  it("asks for her live ones only, bounded", async () => {
    const fake = seed();
    await readAccountUploadsCredits(HOST, NOW);
    const first = fake.requests[0];
    expect(first.name).toBe("uploads_credits");
    expect(first.filters).toEqual(
      expect.arrayContaining([
        { column: "host_id", op: "eq", value: HOST },
        { column: "window_ends_at", op: "gt", value: NOW.toISOString() },
      ]),
    );
    expect(first.limit).not.toBeNull();
    expect(first.limit!).toBeLessThan(MAX_ROWS);
  });
});

describe("the list's total a row", () => {
  it("adds each account's live credits and leaves the others out", async () => {
    const read = await readLiveCreditBytes([HOST, OTHER, "nobody"], NOW);
    expect(read.ok).toBe(true);
    const totals = read.ok ? read.value : new Map();
    expect(totals.get(HOST)).toBe(150 * MEGABYTE);
    expect(totals.get(OTHER)).toBe(10 * MEGABYTE);
    expect(totals.has("nobody")).toBe(false);
  });

  it("asks nothing for an empty list", async () => {
    const fake = seed();
    const read = await readLiveCreditBytes([], NOW);
    expect(read).toEqual({ ok: true, value: new Map() });
    expect(fake.requests).toHaveLength(0);
  });

  it("★ chunks its ids so no request can reach the 1,000-row cut with every account at the most", async () => {
    const fake = seed();
    const ids = Array.from(
      { length: 450 },
      (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    );
    const read = await readLiveCreditBytes(ids, NOW);
    expect(read.ok).toBe(true);
    // At most ten live credits an account: a chunk of ids must hold fewer than MAX_ROWS / 10 of them.
    const sizes = fake.requests.map(
      (r) =>
        (r.filters.find((f) => f.column === "host_id")?.value as string[])
          .length,
    );
    expect(sizes.length).toBeGreaterThan(1);
    expect(Math.max(...sizes) * 10).toBeLessThan(MAX_ROWS);
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(450);
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });

  it("★ a failed read says why and is never a list of accounts with no credit", async () => {
    seed({}, 40);
    const read = await readLiveCreditBytes([HOST], NOW);
    expect(read.ok).toBe(false);
  });
});
