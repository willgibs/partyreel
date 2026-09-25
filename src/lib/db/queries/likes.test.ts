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

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({
    supabase: asSupabase(fake),
    user: signedIn ? { id: "host-1" } : null,
  }),
}));

const { getEventLikeCounts, parseLikeCounts, readMediaLikeCounts } =
  await import("@/lib/db/queries/likes");

const uuid = (i: number) =>
  `m0000000-0000-4000-8000-${String(i).padStart(12, "0")}`;

/** The function as the SQL answers it: liked media only, `media_id > p_after`, ascending, clamped. */
function likeCounts(liked: Map<string, number>) {
  return (args: Record<string, unknown>) => {
    const after = (args.p_after as string | undefined) ?? null;
    const limit =
      args.p_limit == null ? Infinity : Math.min(Number(args.p_limit), 1000);
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

/**
 * A WINDOW'S COUNTS (album-host-wiring): `media_like_counts` answers one jsonb for exactly the asked
 * ids of one event, on the service role after the caller's own ownership check, and an id nobody
 * liked is absent (0). One request whatever the window, never the event's whole liked set.
 */
describe("readMediaLikeCounts", () => {
  it("asks for exactly the window's ids in one call and reads the answer as a map", async () => {
    const asked: unknown[] = [];
    fake = createFakePostgrest({
      rpc: {
        media_like_counts: (args: Record<string, unknown>) => {
          asked.push(args);
          return { [uuid(1)]: 3, [uuid(2)]: 1 };
        },
      },
    });
    const counts = await readMediaLikeCounts("event-1", [
      uuid(1),
      uuid(2),
      uuid(3),
    ]);
    expect(asked).toEqual([
      { p_event_id: "event-1", p_media_ids: [uuid(1), uuid(2), uuid(3)] },
    ]);
    expect(counts.get(uuid(1))).toBe(3);
    expect(counts.get(uuid(3))).toBeUndefined();
  });

  it("asks nothing for an empty window", async () => {
    fake = createFakePostgrest({ rpc: {} });
    expect((await readMediaLikeCounts("event-1", [])).size).toBe(0);
    expect(fake.requests).toHaveLength(0);
  });

  it("throws a labelled error rather than reading a failure as nobody's likes", async () => {
    fake = createFakePostgrest({
      rpc: {
        media_like_counts: () => {
          throw new FakeRpcError("XX000", "boom");
        },
      },
    });
    await expect(readMediaLikeCounts("event-1", [uuid(1)])).rejects.toThrow(
      /likes: media like counts/,
    );
  });

  it("keeps only whole positive counts from whatever it is handed", () => {
    expect([
      ...parseLikeCounts({ a: 2, b: 0, c: -1, d: 1.5, e: "3", f: 4 }),
    ]).toEqual([
      ["a", 2],
      ["f", 4],
    ]);
    expect(parseLikeCounts(null).size).toBe(0);
    expect(parseLikeCounts([1, 2]).size).toBe(0);
  });
});
