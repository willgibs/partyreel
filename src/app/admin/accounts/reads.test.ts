import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GIGABYTE, MEGABYTE } from "@/lib/constants/tiers";

/**
 * ★ WHAT THE OPERATOR'S ACCOUNT READS SAY, against a stubbed service-role client: a host's uploads are asked of
 * `uploads_used` WITH HER OWN TIER (the refusals' own question), her hour from the month's ledger row, and her Deleted
 * rides beside her albums. These tests live beside the pages because `queries/accounts.ts` is claimed as one file.
 */

const rpc = vi.fn();
const ledger = vi.hoisted(() => ({
  calls: [] as [string, unknown][],
  result: { data: null, error: null } as {
    data: Record<string, unknown> | null;
    error: unknown;
  },
}));

type Result = { data?: unknown; error?: unknown; count?: number | null };
const tables = vi.hoisted(() => ({ results: {} as Record<string, Result> }));

/** A chain that records `.eq()` filters on the ledger and resolves a table's canned result when awaited. */
function chain(table: string) {
  const c: Record<string, unknown> = {};
  for (const method of ["select", "is", "neq", "order", "limit"]) {
    c[method] = () => c;
  }
  c.eq = (column: string, value: unknown) => {
    if (table === "storage_ledger") ledger.calls.push([column, value]);
    return c;
  };
  c.maybeSingle = async () => tables.results[table];
  c.then = (resolve: (r: Result) => unknown) => resolve(tables.results[table]);
  return c;
}

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: {}, serverEnv: {} }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc, from: (table: string) => chain(table) }),
}));
const summary = vi.hoisted(() => ({
  value: {
    activeBytes: 0,
    deletedBytes: 0,
    systemBytes: 0,
    storedBytes: 0,
  },
}));
vi.mock("@/lib/db/queries/storage", () => ({
  readHostStorageSummary: async () => summary.value,
}));

const { getAccountDetail, readAccountHourUploads, readAccountUploads } =
  await import("@/lib/db/queries/accounts");

const HOST = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  rpc.mockReset();
  ledger.calls = [];
  tables.results = {};
});
afterEach(() => {
  vi.useRealTimers();
});

describe("a host's uploads against her allowance", () => {
  it("★ asks uploads_used with HER OWN tier, as the refusals do, and carries the Free allowance over a month", async () => {
    rpc.mockResolvedValue({ data: 212 * MEGABYTE, error: null });
    const uploads = await readAccountUploads({
      id: HOST,
      tier: "free",
      storage_cap_bytes: null,
    });
    expect(rpc).toHaveBeenCalledWith("uploads_used", {
      p_host_id: HOST,
      p_tier: "free",
    });
    expect(uploads).toEqual({
      window: "month",
      allowanceBytes: 300 * MEGABYTE,
      used: { ok: true, value: 212 * MEGABYTE },
    });
  });

  it("★ a pass holder is read over her pass's year, never the month's ledger: asked as event_pass, one pass's allowance per pass her room holds", async () => {
    rpc.mockResolvedValue({ data: 61 * GIGABYTE, error: null });
    const uploads = await readAccountUploads({
      id: HOST,
      tier: "event_pass",
      storage_cap_bytes: 50 * GIGABYTE, // two stacked passes' rooms
    });
    expect(rpc).toHaveBeenCalledWith("uploads_used", {
      p_host_id: HOST,
      p_tier: "event_pass",
    });
    expect(uploads.window).toBe("year");
    expect(uploads.allowanceBytes).toBe(100 * GIGABYTE);
    expect(uploads.used).toEqual({ ok: true, value: 61 * GIGABYTE });
  });

  it("a Pro's allowance is her size's, and the retired max is a Pro to both the SQL and the page", async () => {
    rpc.mockResolvedValue({ data: 0, error: null });
    const pro = await readAccountUploads({
      id: HOST,
      tier: "pro",
      storage_cap_bytes: 200 * GIGABYTE,
    });
    expect(pro.allowanceBytes).toBe(200 * GIGABYTE);
    expect(pro.window).toBe("month");

    const max = await readAccountUploads({
      id: HOST,
      tier: "max",
      storage_cap_bytes: 1024 * GIGABYTE,
    });
    expect(rpc).toHaveBeenLastCalledWith("uploads_used", {
      p_host_id: HOST,
      p_tier: "max",
    });
    expect(max.allowanceBytes).toBe(500 * GIGABYTE);
  });

  it("a Pro with no cap on record is unmetered (null), the SQL's fail-open", async () => {
    rpc.mockResolvedValue({ data: 5 * GIGABYTE, error: null });
    const uploads = await readAccountUploads({
      id: HOST,
      tier: "pro",
      storage_cap_bytes: null,
    });
    expect(uploads.allowanceBytes).toBeNull();
    expect(uploads.used).toEqual({ ok: true, value: 5 * GIGABYTE });
  });

  it("★ a failed read never throws and never reads as zero: it says why, and still carries the plan's number", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "permission denied for function uploads_used" },
    });
    const uploads = await readAccountUploads({
      id: HOST,
      tier: "free",
      storage_cap_bytes: null,
    });
    expect(uploads.used).toEqual({
      ok: false,
      message: "permission denied for function uploads_used",
    });
    expect(uploads.allowanceBytes).toBe(300 * MEGABYTE);
  });

  it("★ a thrown read (a dropped connection) is the same No reading, not a failed page", async () => {
    rpc.mockRejectedValue(new Error("fetch failed"));
    const uploads = await readAccountUploads({
      id: HOST,
      tier: "free",
      storage_cap_bytes: null,
    });
    expect(uploads.used).toEqual({ ok: false, message: "fetch failed" });
  });

  it("★ an answer that is not a size is a broken read, never an empty month", async () => {
    for (const data of [null, undefined, "12", Number.NaN, -1]) {
      rpc.mockResolvedValue({ data, error: null });
      const uploads = await readAccountUploads({
        id: HOST,
        tier: "free",
        storage_cap_bytes: null,
      });
      expect(uploads.used.ok, String(data)).toBe(false);
    }
  });
});

describe("a host's hour against the breaker", () => {
  const NOW = new Date("2026-10-04T22:30:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  it("★ reads this month's row for the host, and its tally when it is this clock hour's", async () => {
    tables.results.storage_ledger = {
      data: { hour_started_at: "2026-10-04T22:00:00+00:00", hour_uploads: 312 },
      error: null,
    };
    await expect(readAccountHourUploads(HOST)).resolves.toEqual({
      ok: true,
      value: 312,
    });
    expect(ledger.calls).toEqual([
      ["host_id", HOST],
      ["period", "2026-10"],
    ]);
  });

  it("an earlier hour's tally is not this hour's: the tally restarts with the next presign", async () => {
    tables.results.storage_ledger = {
      data: {
        hour_started_at: "2026-10-04T21:00:00+00:00",
        hour_uploads: 19_999,
      },
      error: null,
    };
    await expect(readAccountHourUploads(HOST)).resolves.toEqual({
      ok: true,
      value: 0,
    });
  });

  it("a row that never met a presign, and a month with no row, have taken nothing this hour", async () => {
    tables.results.storage_ledger = {
      data: { hour_started_at: null, hour_uploads: 0 },
      error: null,
    };
    await expect(readAccountHourUploads(HOST)).resolves.toEqual({
      ok: true,
      value: 0,
    });
    tables.results.storage_ledger = { data: null, error: null };
    await expect(readAccountHourUploads(HOST)).resolves.toEqual({
      ok: true,
      value: 0,
    });
  });

  it("keys the month in UTC, whatever the server's zone, so the last minutes of a month read that month's row", async () => {
    vi.setSystemTime(new Date("2026-10-31T23:59:30Z"));
    tables.results.storage_ledger = { data: null, error: null };
    await readAccountHourUploads(HOST);
    expect(ledger.calls).toContainEqual(["period", "2026-10"]);
    ledger.calls = [];
    vi.setSystemTime(new Date("2026-11-01T00:00:01Z"));
    await readAccountHourUploads(HOST);
    expect(ledger.calls).toContainEqual(["period", "2026-11"]);
  });

  it("★ a failed read is No reading, never a zero", async () => {
    tables.results.storage_ledger = {
      data: null,
      error: { message: "permission denied for table storage_ledger" },
    };
    await expect(readAccountHourUploads(HOST)).resolves.toEqual({
      ok: false,
      message: "permission denied for table storage_ledger",
    });
  });
});

describe("an account's stored bytes", () => {
  it("★ carries her Deleted beside her albums, and the total her plan's cap holds", async () => {
    tables.results.profiles = {
      data: {
        id: HOST,
        tier: "free",
        storage_cap_bytes: null,
        storage_used_bytes: 80 * MEGABYTE,
        stripe_customer_id: null,
        stripe_subscription_id: null,
      },
      error: null,
    };
    tables.results.media = { count: 7, error: null };
    tables.results.events = { count: 2, error: null };
    summary.value = {
      activeBytes: 60 * MEGABYTE,
      deletedBytes: 25 * MEGABYTE,
      systemBytes: 0,
      storedBytes: 85 * MEGABYTE,
    };
    const detail = await getAccountDetail(HOST);
    expect(detail).toMatchObject({
      activeBytes: 60 * MEGABYTE,
      deletedBytes: 25 * MEGABYTE,
      storedBytes: 85 * MEGABYTE,
      effectiveCapBytes: 100 * MEGABYTE,
      mediaCount: 7,
      eventCount: 2,
    });
  });

  it("an id that names no account reads null", async () => {
    tables.results.profiles = { data: null, error: null };
    tables.results.media = { count: 0, error: null };
    tables.results.events = { count: 0, error: null };
    await expect(getAccountDetail(HOST)).resolves.toBeNull();
  });
});
