/**
 * THE STORAGE SUMS' NIGHTLY CHECK ON THE CLAMPING FAKE (storage-sums-signal): `storage_sums_drift` written over the
 * fake's own hosts as 20261006180000 defines its paging (the hosts after `p_after` in id order, `p_limit` a call, the
 * last one's id as `next_after` when the page is full), a host drifted by hand where the test says so (the drift a
 * rolled-back proof makes, never live data), and the sweep walking it: a whole pass in one run, a deadline that stops
 * it with its cursor and what it left, the next night carrying on, a drift named until a check reads her at parity, and
 * every drift failing the run with both figures on its row, one Sentry error and the day's one mail.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
} from "@/lib/db/testing/fake-postgrest";
import type { Deadline } from "@/lib/lifecycle/sweep-budget";
import type { StorageSumsState } from "@/lib/lifecycle/sweeps/storage-sums-state";

const calls = vi.hoisted(() => ({
  errors: [] as { error: unknown; extra?: Record<string, unknown> }[],
  mails: [] as Record<string, unknown>[],
  mailFails: false,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: {},
  serverEnv: { CONTACT_NOTIFY_EMAIL: "ops@example.com" },
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: vi.fn(
    (_area: string, error: unknown, extra?: Record<string, unknown>) => {
      calls.errors.push({ error, extra });
    },
  ),
  captureWarning: vi.fn(),
}));
vi.mock("@/lib/email/send", () => ({
  sendOnce: vi.fn(async (args: Record<string, unknown>) => {
    if (calls.mailFails) throw new Error("resend refused");
    calls.mails.push(args);
    return true;
  }),
}));

const { sweepStorageSums } =
  await import("@/lib/lifecycle/sweeps/storage-sums");
const { readStorageSumsState, storageSumsCounts } =
  await import("@/lib/lifecycle/sweeps/storage-sums-state");

const NOW = new Date("2026-10-07T04:01:00.000Z");
const host = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

type World = {
  fake: FakePostgrest;
  client: ReturnType<typeof asSupabase>;
  /** Each call's (p_after, p_limit), in order. */
  calls: { after: string | null; limit: number }[];
  /** Hosts whose sums the test knocked off by `by` bytes of her albums. */
  drifted: Map<string, number>;
};

/** `hosts` hosts; the ones in `drift` have albums the sums read `by` bytes off the walk. */
function world(hosts: number, drift: Record<number, number> = {}): World {
  const profiles = Array.from({ length: hosts }, (_, i) => ({
    id: host(i + 1),
  }));
  const drifted = new Map(
    Object.entries(drift).map(([n, by]) => [host(Number(n)), by] as const),
  );
  const seen: World["calls"] = [];
  const fake = createFakePostgrest({
    tables: { profiles },
    rpc: {
      storage_sums_drift: (args) => {
        const after = (args.p_after as string | undefined) ?? null;
        const limit = Math.min(Math.max(Number(args.p_limit ?? 100), 1), 1000);
        seen.push({ after, limit });
        const page = fake.tables.profiles
          .map((p) => p.id as string)
          .filter((id) => after === null || id > after)
          .sort()
          .slice(0, limit);
        return {
          checked: page.length,
          next_after: page.length >= limit ? page[page.length - 1] : null,
          drifted: page
            .filter((id) => drifted.has(id))
            .map((id) => ({
              host_id: id,
              summary: {
                active_bytes: 5_000 + drifted.get(id)!,
                standby_bytes: 40,
                system_bytes: 0,
              },
              walk: { active_bytes: 5_000, standby_bytes: 40, system_bytes: 0 },
              events: 1,
              total: true,
            })),
        };
      },
    },
  });
  return { fake, client: asSupabase(fake), calls: seen, drifted };
}

/** A deadline that passes once `calls` calls of the check have been made. */
function after(w: World, n: number): Deadline {
  return { at: 0, passed: () => w.calls.length >= n };
}

beforeEach(() => {
  calls.errors = [];
  calls.mails = [];
  calls.mailFails = false;
});

describe("sweepStorageSums", () => {
  it("checks every host in one run when it can, ends the pass, and closes clean on a quiet night", async () => {
    const w = world(5);
    const tally = await sweepStorageSums(w.client, NOW, { page: 2 });
    expect(w.calls).toEqual([
      { after: null, limit: 2 },
      { after: host(2), limit: 2 },
      { after: host(4), limit: 2 },
    ]);
    expect(tally).toEqual({
      checked: 5,
      drifted: 0,
      rows_failed: 0,
      pass_started_at: NOW.toISOString(),
      pass_checked: 5,
      pass_complete: true,
      last_pass_at: NOW.toISOString(),
      last_pass_checked: 5,
    });
    expect(calls.errors).toEqual([]);
    expect(calls.mails).toEqual([]);
  });

  it("★ fails the run on a drifted host, her two figures on its row, one Sentry error and the day's mail", async () => {
    const w = world(5, { 3: 12 });
    const tally = await sweepStorageSums(w.client, NOW, { page: 2 });
    expect(tally).toMatchObject({
      checked: 5,
      drifted: 1,
      rows_failed: 1,
      pass_complete: true,
    });
    expect(tally.rows_note).toMatch(/^1 host's storage sums differ/);
    // What the run row keeps (the runner's counts for this sweep): the flat tally and her finding whole.
    const counts = storageSumsCounts(tally) as Record<string, unknown>;
    expect(counts).not.toHaveProperty("rows_note");
    expect(counts.findings).toEqual([
      {
        host_id: host(3),
        summary_active: 5_012,
        summary_deleted: 40,
        summary_system: 0,
        walk_active: 5_000,
        walk_deleted: 40,
        walk_system: 0,
        events: 1,
        total: true,
        since: NOW.toISOString(),
      },
    ]);
    expect(calls.errors).toHaveLength(1);
    expect(calls.errors[0].extra).toMatchObject({
      sweep: "storage_sums",
      drifted: 1,
    });
    expect(calls.mails).toHaveLength(1);
    expect(calls.mails[0]).toMatchObject({
      kind: "storage_sums",
      dedupeKey: "storage-sums:2026-10-07",
      to: "ops@example.com",
    });
    expect(String(calls.mails[0].text)).toContain(host(3));
  });

  it("stops at its deadline with its cursor and what it left, and the next night carries the pass on", async () => {
    const w = world(5, { 5: 3 });
    const first = await sweepStorageSums(w.client, NOW, {
      page: 2,
      deadline: after(w, 1),
    });
    expect(first).toMatchObject({
      checked: 2,
      drifted: 0,
      pass_checked: 2,
      pass_complete: false,
      stopped_early: true,
      remaining: 3,
      resume_after: host(2),
    });
    expect(first).not.toHaveProperty("last_pass_at");

    const later = new Date("2026-10-08T04:01:00.000Z");
    const previous: StorageSumsState = readStorageSumsState(
      storageSumsCounts(first),
    );
    w.calls.length = 0;
    const second = await sweepStorageSums(w.client, later, {
      page: 2,
      previous,
    });
    expect(w.calls[0]).toEqual({ after: host(2), limit: 2 });
    expect(second).toMatchObject({
      checked: 3,
      drifted: 1,
      pass_started_at: NOW.toISOString(),
      pass_checked: 5,
      pass_complete: true,
      last_pass_at: later.toISOString(),
      last_pass_checked: 5,
    });
    expect(second).not.toHaveProperty("resume_after");
    expect(second).not.toHaveProperty("stopped_early");
  });

  it("stopped before its first call, it keeps the cursor it had and counts what is left", async () => {
    const w = world(4);
    const previous = readStorageSumsState({
      resume_after: host(1),
      pass_started_at: "2026-10-06T04:00:00.000Z",
      pass_checked: 1,
    });
    const tally = await sweepStorageSums(w.client, NOW, {
      page: 2,
      previous,
      deadline: { at: 0, passed: () => true },
    });
    expect(w.calls).toEqual([]);
    expect(tally).toMatchObject({
      checked: 0,
      pass_checked: 1,
      pass_started_at: "2026-10-06T04:00:00.000Z",
      stopped_early: true,
      remaining: 3,
      resume_after: host(1),
    });
  });

  it("★ names a drift until a check reads her at parity: the last run's hosts checked again first, however far the pass", async () => {
    const w = world(6, { 2: 7, 4: 9 });
    // Last night found hosts 2 and 4 drifted, and stopped after host 2.
    const previous = readStorageSumsState(
      storageSumsCounts({
        checked: 2,
        pass_checked: 2,
        pass_started_at: "2026-10-06T04:00:00.000Z",
        pass_complete: false,
        stopped_early: true,
        resume_after: host(2),
        findings: [
          { ...finding(host(2)), since: "2026-10-06T04:00:30.000Z" },
          { ...finding(host(4)), since: "2026-10-05T04:00:30.000Z" },
        ],
      }),
    );
    // Since then: host 4 was rebuilt (at parity now); host 2 still drifts.
    w.drifted.delete(host(4));
    // A deadline after the two re-checks and one page: the pass does not reach host 4 tonight.
    const tally = await sweepStorageSums(w.client, NOW, {
      page: 2,
      previous,
      deadline: after(w, 3),
    });
    expect(w.calls.slice(0, 2)).toEqual([
      { after: "00000000-0000-4000-8000-000000000001", limit: 1 },
      { after: "00000000-0000-4000-8000-000000000003", limit: 1 },
    ]);
    const counts = storageSumsCounts(tally) as Record<
      string,
      { host_id: string; since: string }[]
    >;
    expect(counts.findings.map((f) => [f.host_id, f.since])).toEqual([
      [host(2), "2026-10-06T04:00:30.000Z"],
    ]);
    expect(tally).toMatchObject({ drifted: 1, rows_failed: 1 });
  });

  it("drops a named host whose account is gone, and keeps one a deadline left unchecked as she was named", async () => {
    const w = world(3);
    const previous = readStorageSumsState(
      storageSumsCounts({
        checked: 1,
        pass_checked: 3,
        pass_complete: true,
        findings: [finding(host(9)), finding(host(1))],
      }),
    );
    const gone = await sweepStorageSums(w.client, NOW, { page: 5, previous });
    expect(gone).toMatchObject({ drifted: 0, rows_failed: 0 });

    const w2 = world(3);
    const unchecked = await sweepStorageSums(w2.client, NOW, {
      page: 5,
      previous: readStorageSumsState(
        storageSumsCounts({
          checked: 1,
          pass_checked: 3,
          findings: [finding(host(1))],
        }),
      ),
      deadline: { at: 0, passed: () => true },
    });
    expect(w2.calls).toEqual([]);
    expect(unchecked).toMatchObject({
      drifted: 1,
      rows_failed: 1,
      stopped_early: true,
    });
  });

  it("★ fails loudly on an answer it does not know, never reading it as a clean night", async () => {
    const w = world(2);
    w.fake.functions.storage_sums_drift = () => ({ checked: "lots" });
    await expect(sweepStorageSums(w.client, NOW)).rejects.toThrow(
      /checked is not a count/,
    );
  });

  it("fails the run when the check cannot be read at all", async () => {
    const w = world(2);
    delete w.fake.functions.storage_sums_drift;
    await expect(sweepStorageSums(w.client, NOW)).rejects.toThrow(
      /storage_sums_drift/,
    );
  });

  it("never costs the run its row when the mail cannot go: the mail's failure is its own Sentry event", async () => {
    calls.mailFails = true;
    const w = world(2, { 1: 1 });
    const tally = await sweepStorageSums(w.client, NOW);
    expect(tally).toMatchObject({ drifted: 1, rows_failed: 1 });
    expect(calls.errors.map((e) => e.extra?.phase ?? "drift")).toEqual([
      "drift",
      "drift_alert",
    ]);
  });
});

function finding(id: string) {
  return {
    host_id: id,
    summary_active: 5_009,
    summary_deleted: 40,
    summary_system: 0,
    walk_active: 5_000,
    walk_deleted: 40,
    walk_system: 0,
    events: 1,
    total: true,
    since: "2026-10-06T04:00:30.000Z",
  };
}
