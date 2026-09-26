/**
 * THE OPERATOR'S FIGURES ARE COUNTED, NEVER READ (the 1,000-row round, Will 2026-09-23: "Let's
 * ensure we will not face any of those issues here").
 *
 * The accounts, engagement and newsletter figures came from three unordered whole-table reads, each
 * cut at PostgREST's 1,000 rows, so every one went quietly wrong at the 1,001st account or stats
 * row. They come from `admin_metrics_snapshot()` now (one jsonb) and the content figures from HEAD
 * counts. Against `fake-postgrest` with 2,500 of everything: every figure reads 2,500 where 2,500
 * exist, the snapshot is asked for the pages' own windows, the home's fortnight and the metrics
 * page's thirty days are drawn from the same counts, and a failed or drifted read throws rather than
 * drawing zeros. Then the snapshot's SQL, read off its migration: the operator is never a customer.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  FakeRpcError,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/stripe/revenue", () => ({ getPlatformRevenue: async () => null }));

let fake: FakePostgrest;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const { getPlatformDbMetrics, getPlatformMetrics } = await import(
  "@/lib/db/queries/metrics"
);

const AS_OF = "2026-09-23T12:00:00.000000+00:00";

function snapshot(): Record<string, unknown> {
  return {
    as_of: AS_OF,
    window_days: 30,
    fortnight_days: 14,
    accounts: {
      total: 2500,
      new_in_window: 1300,
      active_in_window: 1800,
      new_in_fortnight: 700,
      new_in_prior_fortnight: 500,
      active_in_fortnight: 1600,
      active_in_prior_fortnight: 150,
      paid: 400,
      storage_used_bytes: 9_000_000_000_000,
      by_tier: { free: 1850, pro: 300, max: 100, event_pass: 250 },
      signups_by_day: { "2026-09-23": 40, "2026-09-10": 60, "2026-08-25": 90 },
    },
    engagement: {
      qr_scans: 120_000,
      album_views: 480_000,
      by_day: { "2026-09-23": { qr_scans: 500, album_views: 2000 } },
    },
    newsletter: {
      by_source: [
        { source: "footer", count: 1500 },
        { source: null, count: 600 },
        { source: " ", count: 400 },
      ],
    },
  };
}

const uuid = (prefix: string, i: number) =>
  `${prefix}0000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const recent = new Date(Date.now() - 3 * 86_400_000).toISOString();

function world(): FakePostgrest {
  const events: FakeRow[] = Array.from({ length: 2600 }, (_, i) => ({
    id: uuid("e", i),
    deleted_at: i < 2500 ? null : recent,
  }));
  const media: FakeRow[] = Array.from({ length: 2600 }, (_, i) => ({
    id: uuid("m", i),
    type: i % 5 === 0 ? "video" : "photo",
    status: i < 2500 ? "approved" : "removed",
    created_at: recent,
    events: { deleted_at: null },
  }));
  const newsletter: FakeRow[] = Array.from({ length: 2500 }, (_, i) => ({
    id: uuid("n", i),
    created_at: recent,
  }));
  const sent: FakeRow[] = Array.from({ length: 2500 }, (_, i) => ({
    id: uuid("s", i),
    sent_at: recent,
  }));
  return createFakePostgrest({
    tables: {
      events,
      media,
      newsletter_signups: newsletter,
      sent_emails: sent,
    },
    rpc: { admin_metrics_snapshot: () => snapshot() },
  });
}

describe("getPlatformDbMetrics", () => {
  it("★ every figure reads its whole count, past 1,000", async () => {
    fake = world();
    const m = await getPlatformDbMetrics();

    expect(m.content).toEqual({
      events: 2500,
      media: 2500,
      photos: 2000,
      videos: 500,
    });
    expect(m.uploads).toEqual({ total: 2500, recent: 2500, previous: 0 });
    expect(m.growth).toMatchObject({
      newsletterTotal: 2500,
      newsletterLast30: 2500,
      emailsLast30: 2500,
    });
    expect(m.accounts).toMatchObject({
      total: 2500,
      newLast30: 1300,
      activeLast30: 1800,
      paidSubscribers: 400,
      totalStorageBytes: 9_000_000_000_000,
      // The retired "max" folds into Pro, the one mapping in lib/constants/tiers.ts.
      tierMix: { free: 1850, pro: 400, event_pass: 250 },
      eventPassHolders: 250,
    });
    expect(m.engagement).toMatchObject({ linkVisits: 600_000 });
    // Blank and null sources merge into "direct".
    expect(m.growth.bySource).toEqual([
      { source: "footer", count: 1500 },
      { source: "direct", count: 1000 },
    ]);
    // Every list-shaped read is gone: only HEAD counts and the one function call.
    expect(
      fake.requests.every((r) => r.method === "HEAD" || r.target === "rpc"),
    ).toBe(true);
  });

  it("asks the snapshot for the pages' own windows, and draws both spans from its counts", async () => {
    fake = world();
    const calls: Record<string, unknown>[] = [];
    fake.functions.admin_metrics_snapshot = (args) => {
      calls.push(args);
      return snapshot();
    };

    const m = await getPlatformDbMetrics();

    expect(calls).toEqual([{ p_window_days: 30, p_fortnight_days: 14 }]);
    expect(m.asOf).toBe(AS_OF);
    // The metrics page's thirty days and the home's fourteen, on the database's clock.
    expect(m.accounts.signupTrend).toHaveLength(30);
    expect(m.accounts.signupTrend.at(-1)).toEqual({ day: "2026-09-23", count: 40 });
    expect(m.accounts.signupTrend[0]).toEqual({ day: "2026-08-25", count: 90 });
    expect(m.fortnight.signupTrend).toHaveLength(14);
    expect(m.fortnight.signupTrend.reduce((s, d) => s + d.count, 0)).toBe(100);
    expect(m.fortnight).toMatchObject({
      total: 2500,
      newAccounts: 700,
      newAccountsBefore: 500,
      active: 1600,
      activeBefore: 150,
      paid: 400,
    });
    expect(m.engagement.trend.at(-1)).toEqual({
      day: "2026-09-23",
      linkVisits: 2500,
    });
  });

  it("throws on a failed snapshot or a drifted one, never a page of zeros", async () => {
    fake = world();
    fake.functions.admin_metrics_snapshot = () => {
      throw new FakeRpcError("42501", "permission denied for function");
    };
    await expect(getPlatformDbMetrics()).rejects.toThrow(
      /admin metrics: snapshot/,
    );

    fake = world();
    fake.functions.admin_metrics_snapshot = () => ({ ...snapshot(), accounts: {} });
    await expect(getPlatformDbMetrics()).rejects.toThrow(
      /admin_metrics_snapshot/,
    );
  });

  it("throws on a failed head count, which would otherwise read as a confident zero", async () => {
    fake = world();
    delete fake.tables.sent_emails;
    await expect(getPlatformDbMetrics()).rejects.toThrow(
      /admin metrics: emails sent/,
    );
  });

  it("the metrics page's half adds revenue beside the same figures", async () => {
    fake = world();
    const m = await getPlatformMetrics();
    expect(m.revenue).toBeNull();
    expect(m.accounts.total).toBe(2500);
  });
});

/* ────────────────────────────────────────────────────────────────────────────
   THE SNAPSHOT'S SQL, read off the newest migration that defines it (Vitest has no Postgres): the
   keys the reducers parse are the keys it builds, and the operator is never a customer.
   ──────────────────────────────────────────────────────────────────────────── */
describe("admin_metrics_snapshot's definition", () => {
  function newestBody(): string {
    const dir = join(process.cwd(), "supabase", "migrations");
    const definition =
      /create\s+(?:or\s+replace\s+)?function\s+public\.admin_metrics_snapshot\s*\(/i;
    const newest = readdirSync(dir)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((file) => readFileSync(join(dir, file), "utf8"))
      .filter((sql) => definition.test(sql))
      .at(-1);
    if (!newest) throw new Error("No migration defines admin_metrics_snapshot.");
    const start = newest.search(definition);
    const open = newest.indexOf("$$", start);
    const close = newest.indexOf("$$", open + 2);
    return newest
      .slice(open + 2, close)
      .split("\n")
      .map((line) => line.replace(/--.*$/, ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  it("★ every accounts figure leaves out the operator", () => {
    const body = newestBody();
    const reads = body.match(/from public\.profiles p/g) ?? [];
    expect(reads.length).toBeGreaterThanOrEqual(3);
    expect(body.match(/where not p\.is_admin/g)?.length).toBe(reads.length);
  });

  it("builds every key the reducers parse", () => {
    const body = newestBody();
    for (const key of [
      "as_of",
      "window_days",
      "fortnight_days",
      "new_in_window",
      "active_in_window",
      "new_in_fortnight",
      "new_in_prior_fortnight",
      "active_in_fortnight",
      "active_in_prior_fortnight",
      "paid",
      "storage_used_bytes",
      "by_tier",
      "signups_by_day",
      "qr_scans",
      "album_views",
      "by_day",
      "by_source",
    ]) {
      expect(body, key).toContain(`'${key}'`);
    }
  });
});
