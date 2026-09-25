/**
 * THE ACCOUNT KINDS' GATE (`checkAccountAbuseRate`, the `email_change` kind), end to end against the
 * in-memory PostgREST: an `action_attempts` table and an `action_rate` handler that mirrors the live
 * SQL (`count(distinct scope_hash)` in the breadth window, `count(*)` of this scope in the scope window,
 * both for this kind and this requester key).
 *
 * What is pinned: six calls an hour per ACCOUNT, each counted BEFORE the work it authorizes, the seventh
 * refused with the window; another account (or the same one an hour on) untouched; no raw user id ever
 * stored; and an unreadable limiter refused, never waved through (it is the only bound on the abuse).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

const env = vi.hoisted(() => ({
  serverEnv: {
    UNLOCK_COOKIE_SECRET: "rate-limit-hash-secret" as string | undefined,
  },
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ serverEnv: env.serverEnv }));
vi.mock("@/lib/jobs/failure-log", () => ({
  recordSignalFailure: vi.fn(async () => {}),
}));

const sentry = vi.hoisted(() => ({
  captureError: vi.fn(),
  captureWarning: vi.fn(),
}));
vi.mock("@/lib/observability/sentry", () => sentry);

const db = vi.hoisted(() => ({ fake: null as FakePostgrest | null }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(db.fake as FakePostgrest),
}));

const { abuseHashes, accountAbuseHashes, checkAccountAbuseRate } =
  await import("@/lib/security/abuse-rate-limit-store");

/** The rows the table holds (the fake does not apply `created_at default now()`, so a missing one is now). */
function attempts(): FakeRow[] {
  return db.fake?.tables.action_attempts ?? [];
}
const createdAt = (row: FakeRow) =>
  typeof row.created_at === "string"
    ? row.created_at
    : new Date().toISOString();

function seed(rows: FakeRow[] = [], urlLengthLimit?: number) {
  db.fake = createFakePostgrest({
    tables: { action_attempts: rows },
    ...(urlLengthLimit ? { urlLengthLimit } : {}),
    rpc: {
      // public.action_rate, as the live function reads it.
      action_rate: (args) => {
        const mine = attempts().filter(
          (r) => r.kind === args.p_kind && r.ip_hash === args.p_ip_hash,
        );
        const breadth = mine.filter(
          (r) => createdAt(r) > String(args.p_breadth_since),
        );
        return {
          distinct_scopes: new Set(breadth.map((r) => r.scope_hash)).size,
          scope_hits: mine.filter(
            (r) =>
              createdAt(r) > String(args.p_scope_since) &&
              r.scope_hash === args.p_scope_hash,
          ).length,
        };
      },
    },
  });
}

beforeEach(() => {
  env.serverEnv.UNLOCK_COOKIE_SECRET = "rate-limit-hash-secret";
  sentry.captureError.mockClear();
  sentry.captureWarning.mockClear();
  seed();
});

describe("checkAccountAbuseRate (email_change)", () => {
  it("★ allows six calls an hour, counts each before the work, and refuses the seventh with the window", async () => {
    for (let call = 1; call <= 6; call++) {
      await expect(
        checkAccountAbuseRate("email_change", "user-1"),
      ).resolves.toEqual({ allowed: true });
      expect(attempts()).toHaveLength(call);
    }

    await expect(
      checkAccountAbuseRate("email_change", "user-1"),
    ).resolves.toEqual({
      allowed: false,
      reason: "rate_limited",
      retryAfterSec: 3600,
    });
    // A refused call spends nothing more.
    expect(attempts()).toHaveLength(6);
    expect(sentry.captureWarning).toHaveBeenCalledWith(
      "security",
      "account_rate_limited",
      { kind: "email_change" },
    );
  });

  it("keys on the account, never the network: another account's budget is untouched", async () => {
    for (let call = 0; call < 6; call++) {
      await checkAccountAbuseRate("email_change", "user-1");
    }
    await expect(
      checkAccountAbuseRate("email_change", "user-2"),
    ).resolves.toEqual({ allowed: true });
  });

  it("gives the budget back an hour on", async () => {
    const { ipHash, scopeHash } = accountAbuseHashes("email_change", "user-1");
    const past = new Date(Date.now() - 61 * 60_000).toISOString();
    seed(
      Array.from({ length: 6 }, () => ({
        kind: "email_change",
        ip_hash: ipHash,
        scope_hash: scopeHash,
        created_at: past,
      })),
    );
    await expect(
      checkAccountAbuseRate("email_change", "user-1"),
    ).resolves.toEqual({ allowed: true });
  });

  it("stores no raw user id, in a domain no IP hash can share", async () => {
    await checkAccountAbuseRate("email_change", "user-1");
    const [row] = attempts();
    expect(row.kind).toBe("email_change");
    expect(JSON.stringify(row)).not.toContain("user-1");
    expect(row.ip_hash).toMatch(/^[0-9a-f]{64}$/);
    // The same string as an IP hashes to a different requester key.
    expect(row.ip_hash).not.toBe(abuseHashes("user-1", "join", "").ipHash);
    // One constant scope per kind: the per-scope count IS the per-account count.
    expect(row.scope_hash).toBe(
      accountAbuseHashes("email_change", "someone-else").scopeHash,
    );
  });

  it("★ fails CLOSED when the limiter cannot answer, and says so as an error", async () => {
    seed([], 10); // every request fails, the way a dead connection does
    await expect(
      checkAccountAbuseRate("email_change", "user-1"),
    ).resolves.toEqual({
      allowed: false,
      reason: "unavailable",
      retryAfterSec: 60,
    });
    expect(sentry.captureError).toHaveBeenCalledWith(
      "security",
      expect.anything(),
      { kind: "email_change", phase: "rate_limit_fail_closed" },
    );
  });

  it("fails CLOSED without the hashing secret", async () => {
    env.serverEnv.UNLOCK_COOKIE_SECRET = undefined;
    await expect(
      checkAccountAbuseRate("email_change", "user-1"),
    ).resolves.toMatchObject({ allowed: false, reason: "unavailable" });
    expect(attempts()).toEqual([]);
  });
});
