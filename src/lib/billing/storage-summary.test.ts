/**
 * THE METER COUNTS EVERY ITEM, not the first page of them.
 *
 * PostgREST silently caps a response at `max_rows` (1000 here). The summary used
 * one unpaged select, so an account past a thousand items was undercounted, and the
 * storage guard reads this number to refuse a plan the host does not fit. The fake
 * below serves the host's rows in id order and CLAMPS every response to its own
 * max_rows (deliberately smaller than the loop's page), which is the exact trap:
 * a loop that stopped on a "short" page would read three rows and quit.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Row = {
  id: string;
  file_size_bytes: number;
  status: string;
  events: { deleted_at: string | null } | null;
};

let rows: Row[] = [];
let maxRows = 3;
let requests = 0;
let failWith: { message: string } | null = null;

/** A just-enough PostgREST builder: select(count) → order → limit → gt?, awaited. */
function fakeClient() {
  return {
    from() {
      let counted = false;
      let after: string | null = null;
      let limit = Infinity;
      const builder = {
        select(_cols: string, opts?: { count?: string }) {
          counted = opts?.count === "exact";
          return builder;
        },
        order() {
          return builder;
        },
        limit(n: number) {
          limit = n;
          return builder;
        },
        gt(_col: string, value: string) {
          after = value;
          return builder;
        },
        then(resolve: (value: unknown) => void) {
          requests += 1;
          if (failWith) {
            resolve({ data: null, error: failWith, count: null });
            return;
          }
          const sorted = [...rows].sort((a, b) => a.id.localeCompare(b.id));
          const tail = after
            ? sorted.filter((r) => r.id.localeCompare(after!) > 0)
            : sorted;
          resolve({
            data: tail.slice(0, Math.min(limit, maxRows)),
            error: null,
            count: counted ? rows.length : null,
          });
        },
      };
      return builder;
    },
  };
}

let signedIn = true;
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({
    supabase: fakeClient(),
    user: signedIn ? { id: "host-1" } : null,
  }),
}));

const { getHostStorageSummary, tallyStorageRows } =
  await import("@/lib/db/queries/storage");

const live: Row["events"] = { deleted_at: null };
const gone: Row["events"] = { deleted_at: "2026-09-01T00:00:00Z" };
function row(
  n: number,
  bytes: number,
  status = "approved",
  events: Row["events"] = live,
): Row {
  return {
    id: `m-${String(n).padStart(4, "0")}`,
    file_size_bytes: bytes,
    status,
    events,
  };
}

beforeEach(() => {
  rows = [];
  maxRows = 3;
  requests = 0;
  failWith = null;
  signedIn = true;
});

describe("the storage summary pages to exhaustion", () => {
  it("counts every row even when each response is clamped below the page size", async () => {
    rows = Array.from({ length: 10 }, (_, i) => row(i, 100));
    await expect(getHostStorageSummary()).resolves.toEqual({
      activeBytes: 1000,
      standbyBytes: 0,
    });
    // Four clamped pages of three, and it stops at the count rather than
    // spending a fifth request to discover an empty page.
    expect(requests).toBe(4);
  });

  it("answers a small account in ONE request", async () => {
    maxRows = 1000;
    rows = [row(1, 5), row(2, 7)];
    await expect(getHostStorageSummary()).resolves.toEqual({
      activeBytes: 12,
      standbyBytes: 0,
    });
    expect(requests).toBe(1);
  });

  it("splits active from Deleted by status and by the event's deletion", async () => {
    rows = [
      row(1, 10),
      row(2, 20, "removed"),
      row(3, 40, "approved", gone),
      row(4, 80, "hidden"),
    ];
    await expect(getHostStorageSummary()).resolves.toEqual({
      activeBytes: 90,
      standbyBytes: 60,
    });
  });

  it("throws on a failed read rather than reporting an empty account", async () => {
    // The guard would read a swallowed failure as "stores nothing" and sell
    // any size; a failed read must fail the request instead.
    failWith = { message: "boom" };
    await expect(getHostStorageSummary()).rejects.toEqual({ message: "boom" });
  });

  it("reads nothing for a signed-out caller", async () => {
    signedIn = false;
    await expect(getHostStorageSummary()).resolves.toEqual({
      activeBytes: 0,
      standbyBytes: 0,
    });
    expect(requests).toBe(0);
  });
});

describe("the per-page tally", () => {
  it("adds onto the running totals", () => {
    expect(
      tallyStorageRows({ activeBytes: 1, standbyBytes: 2 }, [row(1, 3)]),
    ).toEqual({ activeBytes: 4, standbyBytes: 2 });
  });
});
