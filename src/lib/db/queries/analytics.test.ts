/**
 * AN EVENT'S SCAN AND VIEW TOTALS ARE ONE AGGREGATE (the 1,000-row round, Will 2026-09-23).
 *
 * The totals used to be summed in TypeScript from the per-day `link_stats` rows, two a day, so past
 * about 500 days PostgREST's 1,000-row cap stopped them growing. `event_link_totals(uuid)` sums them in
 * SQL and answers one jsonb. What is pinned: one request to that function with the event id, its
 * numbers read as numbers however large, and the best-effort surface (a failed read shows zeros and
 * never breaks the event page, as it always has).
 */
import { describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  FakeRpcError,
  type FakePostgrest,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));

let fake: FakePostgrest;
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => asSupabase(fake),
}));

const { getLinkStats } = await import("@/lib/db/queries/analytics");

describe("getLinkStats", () => {
  it("★ reads the lifetime totals from the aggregate in one request, past any row count", async () => {
    const calls: Record<string, unknown>[] = [];
    fake = createFakePostgrest({
      rpc: {
        event_link_totals: (args) => {
          calls.push(args);
          // Three years of daily traffic: far more day rows than one read could hold.
          return { qr_scans: 2190 * 40, album_views: 2190 * 95 };
        },
      },
    });

    await expect(getLinkStats("event-1")).resolves.toEqual({
      qrScans: 87_600,
      albumViews: 208_050,
    });
    expect(calls).toEqual([{ p_event_id: "event-1" }]);
    expect(fake.requests).toHaveLength(1);
  });

  it("reads zeros for an event with no traffic, or one that is not the caller's", async () => {
    fake = createFakePostgrest({
      rpc: { event_link_totals: () => ({ qr_scans: 0, album_views: 0 }) },
    });
    await expect(getLinkStats("event-1")).resolves.toEqual({
      qrScans: 0,
      albumViews: 0,
    });
  });

  it("stays best-effort: a failed read is zeros, never a broken event page", async () => {
    fake = createFakePostgrest({
      rpc: {
        event_link_totals: () => {
          throw new FakeRpcError("57014", "canceling statement");
        },
      },
    });
    await expect(getLinkStats("event-1")).resolves.toEqual({
      qrScans: 0,
      albumViews: 0,
    });
  });
});
