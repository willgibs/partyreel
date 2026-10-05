import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GIGABYTE, MEGABYTE } from "@/lib/constants/tiers";

/**
 * ★ WHAT THE OPERATOR'S ACCOUNT READS SAY, against a stubbed service-role client: every listed host's uploads in one
 * `uploads_windows` read (each figure `uploads_used` asked with HER OWN tier, the refusals' own question, and a lapsed
 * pass said as one), her hour from the month's ledger row, and her Deleted beside her albums.
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

const {
  getAccountDetail,
  readAccountHourUploads,
  readAccountsUploads,
  readAccountUploads,
} = await import("@/lib/db/queries/accounts");

const HOST = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  rpc.mockReset();
  ledger.calls = [];
  tables.results = {};
});
afterEach(() => {
  vi.useRealTimers();
});

/** One `uploads_windows` row as PostgREST answers it: the plan it was asked with, its figure, and a lapse if one. */
function windowRow(
  hostId: string,
  usedBytes: unknown,
  lapsedAt: string | null | undefined = undefined,
  plan: { tier?: unknown; cap?: unknown; converted?: boolean } = {},
) {
  return {
    host_id: hostId,
    tier: plan.tier ?? "free",
    storage_cap_bytes: plan.cap ?? null,
    used_bytes: usedBytes,
    pass_lapsed: lapsedAt !== undefined,
    pass_lapsed_at: lapsedAt ?? null,
    pass_converted: plan.converted ?? false,
  };
}

/**
 * Answer `uploads_windows` the way the SQL does over a canned set of rows: only the asked ids, in id order, after the
 * keyset cursor, at most `p_limit` and never more than PostgREST's 1,000.
 */
function answerWindows(rows: ReturnType<typeof windowRow>[]) {
  rpc.mockImplementation(
    async (name: string, args: Record<string, unknown>) => {
      if (name !== "uploads_windows") {
        return { data: null, error: { message: `unexpected rpc ${name}` } };
      }
      const asked = new Set(args.p_host_ids as string[]);
      const after = (args.p_after_id as string | null) ?? null;
      const limit = Math.min(Number(args.p_limit ?? 1000), 1000);
      const data = rows
        .filter(
          (r) => asked.has(r.host_id) && (after === null || r.host_id > after),
        )
        .sort((a, b) => (a.host_id < b.host_id ? -1 : 1))
        .slice(0, limit);
      return { data, error: null };
    },
  );
}

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

/** A listed account as the read takes it. */
type Listed = Parameters<typeof readAccountsUploads>[0][number];

describe("every listed host's uploads against her allowance, in one read", () => {
  it("★ reads the whole page's hosts in ONE call (it was one uploads_used call a row), each in the order asked", async () => {
    const profiles: Listed[] = Array.from({ length: 50 }, (_, i) => ({
      id: id(50 - i), // listed newest-active first, never in id order
      tier: "free",
      storage_cap_bytes: null,
    }));
    answerWindows(profiles.map((p, i) => windowRow(p.id, i * MEGABYTE)));
    const uploads = await readAccountsUploads(profiles);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0]![0]).toBe("uploads_windows");
    expect(rpc.mock.calls[0]![1]).toMatchObject({
      p_after_id: null,
      p_limit: 1000,
    });
    expect([...(rpc.mock.calls[0]![1].p_host_ids as string[])].sort()).toEqual(
      profiles.map((p) => p.id).sort(),
    );
    expect(uploads).toHaveLength(50);
    uploads.forEach((u, i) => {
      expect(u.used).toEqual({ ok: true, value: i * MEGABYTE });
      expect(u.lapsed).toBeNull();
    });
  });

  it("★ carries each host's own window and allowance: Free's month, a stack's year, a Pro's size, the retired max a Pro", async () => {
    const profiles: Listed[] = [
      { id: id(1), tier: "free", storage_cap_bytes: null },
      { id: id(2), tier: "event_pass", storage_cap_bytes: 50 * GIGABYTE }, // two stacked passes' rooms
      { id: id(3), tier: "pro", storage_cap_bytes: 200 * GIGABYTE },
      { id: id(4), tier: "max", storage_cap_bytes: 1024 * GIGABYTE },
      { id: id(5), tier: "pro", storage_cap_bytes: null },
    ];
    answerWindows([
      windowRow(id(1), 212 * MEGABYTE),
      windowRow(id(2), 61 * GIGABYTE, undefined, {
        tier: "event_pass",
        cap: 50 * GIGABYTE,
      }),
      windowRow(id(3), 0, undefined, { tier: "pro", cap: 200 * GIGABYTE }),
      windowRow(id(4), 0, undefined, { tier: "max", cap: 1024 * GIGABYTE }),
      windowRow(id(5), 5 * GIGABYTE, undefined, { tier: "pro", cap: null }),
    ]);
    const [free, pass, pro, max, unmetered] =
      await readAccountsUploads(profiles);
    expect(free).toEqual({
      window: "month",
      allowanceBytes: 300 * MEGABYTE,
      used: { ok: true, value: 212 * MEGABYTE },
      lapsed: null,
    });
    expect(pass).toMatchObject({
      window: "year",
      allowanceBytes: 100 * GIGABYTE,
      used: { ok: true, value: 61 * GIGABYTE },
    });
    expect(pro).toMatchObject({
      window: "month",
      allowanceBytes: 200 * GIGABYTE,
    });
    expect(max!.allowanceBytes).toBe(500 * GIGABYTE);
    // A Pro with no cap on record is unmetered (null), the SQL's fail-open.
    expect(unmetered).toMatchObject({
      allowanceBytes: null,
      used: { ok: true, value: 5 * GIGABYTE },
    });
  });

  it("★ a lapsed pass reads lapsed, with when her pass ended and how, never a calm 0 B", async () => {
    const pass = { tier: "event_pass", cap: 25 * GIGABYTE };
    answerWindows([
      windowRow(id(1), 0, "2026-10-03T14:00:00+00:00", pass),
      windowRow(id(2), 0, null, pass), // lapsed, no pass of hers ever live
      windowRow(id(3), 0, "2026-10-05T09:30:00+00:00", {
        ...pass,
        converted: true,
      }),
    ]);
    const [ended, neverLive, converted] = await readAccountsUploads([
      { id: id(1), tier: "event_pass", storage_cap_bytes: 25 * GIGABYTE },
      { id: id(2), tier: "event_pass", storage_cap_bytes: null },
      { id: id(3), tier: "event_pass", storage_cap_bytes: 25 * GIGABYTE },
    ]);
    expect(ended!.lapsed).toEqual({
      since: "2026-10-03T14:00:00+00:00",
      converted: false,
    });
    expect(ended!.used).toEqual({ ok: true, value: 0 });
    expect(neverLive!.lapsed).toEqual({ since: null, converted: false });
    // Her passes became Pro credit and her Pro plan has not landed: refused too, and said so.
    expect(converted!.lapsed).toEqual({
      since: "2026-10-05T09:30:00+00:00",
      converted: true,
    });
  });

  it("★ holds each figure to the plan it was read with, never to a plan the list read a moment before", async () => {
    // The list read a lapsed pass; the nightly recompute moved her to Free before this read, which answers Free's
    // month. The row says Free's month against Free's allowance, never that figure against a pass's year.
    answerWindows([windowRow(id(1), 120 * MEGABYTE)]);
    const [moved] = await readAccountsUploads([
      { id: id(1), tier: "event_pass", storage_cap_bytes: 25 * GIGABYTE },
    ]);
    expect(moved).toEqual({
      window: "month",
      allowanceBytes: 300 * MEGABYTE,
      used: { ok: true, value: 120 * MEGABYTE },
      lapsed: null,
    });
  });

  it("pages past 1,000 hosts on the keyset, so no host is cut at PostgREST's cap", async () => {
    const profiles: Listed[] = Array.from({ length: 2300 }, (_, i) => ({
      id: id(i + 1),
      tier: "free",
      storage_cap_bytes: null,
    }));
    answerWindows(profiles.map((p) => windowRow(p.id, 7)));
    const uploads = await readAccountsUploads(profiles);
    expect(rpc).toHaveBeenCalledTimes(3);
    expect(rpc.mock.calls.map((c) => c[1].p_after_id)).toEqual([
      null,
      id(1000),
      id(2000),
    ]);
    expect(uploads.every((u) => u.used.ok && u.used.value === 7)).toBe(true);
  });

  it("asks nothing for an empty list", async () => {
    await expect(readAccountsUploads([])).resolves.toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("★ a failed read never throws and never reads as zero: every row says why, and still carries its plan's number", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        code: "PGRST202",
        message:
          "Could not find the function public.uploads_windows(p_after_id, p_host_ids, p_limit) in the schema cache",
      },
    });
    const uploads = await readAccountsUploads([
      { id: id(1), tier: "free", storage_cap_bytes: null },
      { id: id(2), tier: "event_pass", storage_cap_bytes: null },
    ]);
    for (const u of uploads) {
      expect(u.used.ok).toBe(false);
      expect(u.used.ok ? "" : u.used.message).toMatch(
        /^accounts: uploads windows: Could not find the function/,
      );
      expect(u.lapsed).toBeNull();
    }
    expect(uploads[0]!.allowanceBytes).toBe(300 * MEGABYTE);
  });

  it("★ a thrown read (a dropped connection) is the same No reading, not a failed page", async () => {
    rpc.mockRejectedValue(new Error("fetch failed"));
    const [uploads] = await readAccountsUploads([
      { id: id(1), tier: "free", storage_cap_bytes: null },
    ]);
    expect(uploads!.used).toEqual({ ok: false, message: "fetch failed" });
  });

  it("★ an account the read did not answer (deleted since the list) is No reading for its row alone", async () => {
    answerWindows([windowRow(id(1), 3 * MEGABYTE)]);
    const [found, gone] = await readAccountsUploads([
      { id: id(1), tier: "free", storage_cap_bytes: null },
      { id: id(2), tier: "free", storage_cap_bytes: null },
    ]);
    expect(found!.used).toEqual({ ok: true, value: 3 * MEGABYTE });
    expect(gone!.used.ok).toBe(false);
  });

  it("★ an answer that is not a size, or no lapsed flag, is a broken read, never an empty month", async () => {
    for (const used of [null, undefined, "12", Number.NaN, -1]) {
      rpc.mockReset();
      answerWindows([windowRow(id(1), used)]);
      const [uploads] = await readAccountsUploads([
        { id: id(1), tier: "free", storage_cap_bytes: null },
      ]);
      expect(uploads!.used.ok, String(used)).toBe(false);
    }
    for (const broken of [
      { pass_lapsed: "yes" },
      { tier: null },
      { tier: 7 },
      { storage_cap_bytes: "lots" },
      { storage_cap_bytes: Number.NaN },
    ]) {
      rpc.mockReset();
      answerWindows([{ ...windowRow(id(1), 0), ...broken } as never]);
      const [uploads] = await readAccountsUploads([
        { id: id(1), tier: "event_pass", storage_cap_bytes: null },
      ]);
      expect(uploads!.used.ok, JSON.stringify(broken)).toBe(false);
      // A row it cannot read keeps the list's own plan beside its No reading.
      expect(uploads!.window, JSON.stringify(broken)).toBe("year");
    }
  });

  it("the account's page asks the same read for its one host", async () => {
    answerWindows([
      windowRow(id(9), 1, "2026-10-01T00:00:00+00:00", {
        tier: "event_pass",
        cap: 25 * GIGABYTE,
      }),
    ]);
    const uploads = await readAccountUploads({
      id: id(9),
      tier: "event_pass",
      storage_cap_bytes: 25 * GIGABYTE,
    });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0]![1].p_host_ids).toEqual([id(9)]);
    expect(uploads.lapsed).toEqual({
      since: "2026-10-01T00:00:00+00:00",
      converted: false,
    });
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
