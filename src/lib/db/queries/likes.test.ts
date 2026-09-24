/**
 * THE HOST'S LIKE COUNTS ARE WHOLE (the 1,000-row round, Will 2026-09-23: "Let's ensure we will not
 * face any of those issues here").
 *
 * `get_event_like_counts` used to answer one row per media of the event, liked or not, unordered, so
 * PostgREST's 1,000-row cap kept an arbitrary thousand and a liked photo past it read as unliked. It
 * now answers LIKED media only, paged on `media_id` (`20260924010000_row_cap_album.sql`). Against
 * `fake-postgrest` (every set-returning function clamped at 1,000), with 2,500 liked items: every
 * count comes back, through keyset pages that each ask for `p_limit`, and an item nobody liked is
 * absent, which every reader maps to 0.
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
let signedIn = true;

vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({
    supabase: asSupabase(fake),
    user: signedIn ? { id: "host-1" } : null,
  }),
}));

const { getEventLikeCounts } = await import("@/lib/db/queries/likes");

const uuid = (i: number) =>
  `m0000000-0000-4000-8000-${String(i).padStart(12, "0")}`;

/** The function as the SQL answers it: liked media only, `media_id > p_after`, ascending, clamped. */
function likeCounts(liked: Map<string, number>) {
  return (args: Record<string, unknown>) => {
    const after = (args.p_after as string | undefined) ?? null;
    const limit = args.p_limit == null ? Infinity : Math.min(Number(args.p_limit), 1000);
    return [...liked]
      .filter(([id]) => after === null || id > after)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(0, limit)
      .map(([media_id, like_count]) => ({ media_id, like_count }));
  };
}

describe("getEventLikeCounts", () => {
  it("★ reads 2,500 liked items whole, every page asking for p_limit", async () => {
    const liked = new Map(
      Array.from({ length: 2500 }, (_, i) => [uuid(i), (i % 5) + 1] as const),
    );
    fake = createFakePostgrest({
      rpc: { get_event_like_counts: likeCounts(liked) },
    });

    const counts = await getEventLikeCounts("event-1");

    expect(counts.size).toBe(2500);
    expect(counts.get(uuid(0))).toBe(1);
    expect(counts.get(uuid(2499))).toBe(5);
    expect(fake.requests.map((r) => r.returned)).toEqual([1000, 1000, 500]);
    expect(fake.requests.every((r) => r.method === "POST" && !r.failed)).toBe(
      true,
    );
  });

  it("an unliked item is absent (the readers default it to 0)", async () => {
    fake = createFakePostgrest({
      rpc: { get_event_like_counts: likeCounts(new Map([[uuid(3), 2]])) },
    });
    const counts = await getEventLikeCounts("event-1");
    expect([...counts]).toEqual([[uuid(3), 2]]);
    expect(counts.get(uuid(4)) ?? 0).toBe(0);
  });

  it("a signed-out caller reads nothing", async () => {
    fake = createFakePostgrest({
      rpc: { get_event_like_counts: likeCounts(new Map()) },
    });
    signedIn = false;
    await expect(getEventLikeCounts("event-1")).resolves.toEqual(new Map());
    expect(fake.requests).toEqual([]);
    signedIn = true;
  });

  it("throws on a failed page rather than showing fewer hearts", async () => {
    fake = createFakePostgrest({
      rpc: {
        get_event_like_counts: () => {
          throw new FakeRpcError("57014", "canceling statement");
        },
      },
    });
    await expect(getEventLikeCounts("event-1")).rejects.toThrow(
      /host: like counts/,
    );
  });
});
