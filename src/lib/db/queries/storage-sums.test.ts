/**
 * THE STORAGE SUMS' READS ON THE CLAMPING FAKE (storage-sums-signal): the check's call as the function is asked (no
 * `p_after` from the first host), the one-host check by the host just before hers, the count a stopped pass leaves,
 * the record read past a run that wrote none, the names the card gives, and every failed read thrown, never empty.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
} from "@/lib/db/testing/fake-postgrest";

const world = vi.hoisted(() => ({ fake: null as unknown }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(world.fake as FakePostgrest),
}));

const {
  countHostsAfter,
  readDriftPage,
  readHostLabels,
  readLatestStorageSumsCounts,
  recheckHost,
} = await import("@/lib/db/queries/storage-sums");

const HOST = "6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b";

function make(options: Parameters<typeof createFakePostgrest>[0] = {}) {
  const fake = createFakePostgrest(options);
  world.fake = fake;
  return { fake, client: asSupabase(fake) };
}

beforeEach(() => {
  world.fake = null;
});

describe("readDriftPage", () => {
  it("asks from the first host with no p_after, and after a host with it", async () => {
    const seen: Record<string, unknown>[] = [];
    const { client } = make({
      rpc: {
        storage_sums_drift: (args) => {
          seen.push(args);
          return { checked: 0, next_after: null, drifted: [] };
        },
      },
    });
    await readDriftPage(client, null, 50);
    await readDriftPage(client, HOST, 50);
    expect(seen).toEqual([{ p_limit: 50 }, { p_after: HOST, p_limit: 50 }]);
  });

  it("★ throws when the call fails, never reading a failure as a clean page", async () => {
    const { client } = make();
    await expect(readDriftPage(client, null, 50)).rejects.toThrow(
      /storage sums: storage_sums_drift/,
    );
  });
});

describe("recheckHost", () => {
  it("checks her alone, by the host just before her, and reads whom it checked", async () => {
    const seen: Record<string, unknown>[] = [];
    const { client, fake } = make({
      rpc: {
        storage_sums_drift: (args) => {
          seen.push(args);
          return { checked: 1, next_after: HOST, drifted: [] };
        },
      },
    });
    expect(await recheckHost(client, HOST)).toEqual({ kind: "parity" });
    expect(seen).toEqual([
      { p_after: "6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0a", p_limit: 1 },
    ]);
    // Her account gone: the call meets the next host, whose figures are not hers.
    fake.functions.storage_sums_drift = () => ({
      checked: 1,
      next_after: "7fffffff-0000-4000-8000-000000000000",
      drifted: [],
    });
    expect(await recheckHost(client, HOST)).toEqual({ kind: "gone" });
  });
});

describe("countHostsAfter", () => {
  it("counts the hosts a stopped pass has still to check", async () => {
    const { client } = make({
      tables: {
        profiles: [
          { id: "00000000-0000-4000-8000-000000000001" },
          { id: HOST },
          { id: "ffffffff-0000-4000-8000-000000000000" },
        ],
      },
    });
    expect(await countHostsAfter(client, HOST)).toBe(1);
    expect(await countHostsAfter(client, null)).toBe(3);
  });
});

describe("readLatestStorageSumsCounts", () => {
  it("★ reads the newest run that wrote a record, past a pause, one in flight and one that threw", async () => {
    make({
      tables: {
        job_runs: [
          {
            job: "storage_sums",
            status: "ok",
            started_at: "2026-10-05T04:00:00+00:00",
            counts: { checked: 1 },
          },
          {
            job: "storage_sums",
            status: "error",
            started_at: "2026-10-06T04:00:00+00:00",
            counts: { checked: 2 },
          },
          {
            job: "storage_sums",
            status: "error",
            started_at: "2026-10-07T04:00:00+00:00",
            counts: null,
          },
          {
            job: "storage_sums",
            status: "skipped",
            started_at: "2026-10-07T05:00:00+00:00",
            counts: null,
          },
          {
            job: "storage_sums",
            status: "running",
            started_at: "2026-10-07T06:00:00+00:00",
            counts: null,
          },
          {
            job: "purge_cron",
            status: "ok",
            started_at: "2026-10-08T04:00:00+00:00",
            counts: { checked: 9 },
          },
        ],
      },
    });
    expect(await readLatestStorageSumsCounts()).toEqual({ checked: 2 });
  });

  it("reads nothing before any run, and throws when it cannot read", async () => {
    make({ tables: { job_runs: [] } });
    expect(await readLatestStorageSumsCounts()).toBeNull();
    make();
    await expect(readLatestStorageSumsCounts()).rejects.toThrow(/the last run/);
  });
});

describe("readHostLabels", () => {
  it("names each host by her address, else her display name, and asks nothing for no ids", async () => {
    const { fake } = make({
      tables: {
        profiles: [
          { id: HOST, email: "willg97@gmail.com", display_name: "Will" },
          {
            id: "00000000-0000-4000-8000-000000000001",
            email: null,
            display_name: " Ana ",
          },
          {
            id: "00000000-0000-4000-8000-000000000002",
            email: null,
            display_name: null,
          },
        ],
      },
    });
    const names = await readHostLabels([
      HOST,
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002",
    ]);
    expect([...names]).toEqual([
      [HOST, "willg97@gmail.com"],
      ["00000000-0000-4000-8000-000000000001", "Ana"],
    ]);
    const before = fake.requests.length;
    expect((await readHostLabels([])).size).toBe(0);
    expect(fake.requests.length).toBe(before);
  });
});
