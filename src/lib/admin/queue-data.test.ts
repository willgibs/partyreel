import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE QUEUE'S AGES (the 1,000-row round, 2026-09-23). "Oldest waiting" is one row per inbox, ordered
 * oldest first, where it used to be the last row of a whole newest-first list that PostgREST cut at
 * 1,000 (so the "oldest" was merely the thousandth newest). And a failed read is an error: the reads
 * used to swallow a failure into an empty list, which drew the row with no age and no word.
 */

vi.mock("server-only", () => ({}));

const health = { readable: true, unhealthy: [], heartbeatAgeMs: 0 };
vi.mock("@/lib/admin/pending", () => ({
  readPendingWork: async () => ({
    support: 3,
    applicants: 2,
    reports: 1,
    jobs: 0,
    health,
  }),
}));

let supportAt: () => Promise<string | null>;
vi.mock("@/lib/db/queries/support", () => ({
  oldestContactAt: () => supportAt(),
}));
vi.mock("@/lib/db/queries/applications", () => ({
  oldestApplicationAt: async () => "2026-09-20T12:00:00.000000+00:00",
}));
vi.mock("@/lib/db/queries/reports", () => ({
  oldestOpenReportAt: async () => null,
}));

const { readOperatorQueue } = await import("@/lib/admin/queue-data");

const NOW = Date.parse("2026-09-23T12:00:00.000Z");

beforeEach(() => {
  supportAt = async () => "2026-09-22T12:00:00.000000+00:00";
});

describe("readOperatorQueue", () => {
  it("dates each inbox by its oldest waiting row, and a count with nothing dated stays undated", async () => {
    const items = await readOperatorQueue(NOW);
    const byKind = Object.fromEntries(items.map((i) => [i.kind, i]));
    expect(byKind.support.waitedMs).toBe(86_400_000);
    expect(byKind.applicants.waitedMs).toBe(3 * 86_400_000);
    expect(byKind.reports.waitedMs).toBeNull();
  });

  it("★ a failed read rejects rather than drawing a row with no age", async () => {
    supportAt = async () => {
      throw new Error("admin support: oldest waiting: boom");
    };
    await expect(readOperatorQueue(NOW)).rejects.toThrow(/oldest waiting/);
  });
});
