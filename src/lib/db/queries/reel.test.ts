/**
 * Pins the reel MEMBERSHIP predicate (R3 Track A).
 *
 * `reel_items` rows outlive their media, so a raw read of the junction table returns GHOSTS - and
 * those ghosts silently inflated the section count and bricked drag-reorder (the client can only ever
 * send the ids it can SEE, while reorder_reel's set-equality guard compared against the inflated set).
 * The predicate is therefore part of the READ, and it is deliberately WIDER than the reel's render
 * identity: hidden items stay MEMBERS, only removed ones are dropped.
 *
 * A recording fake stands in for the query builder: the thing worth pinning is the exact PostgREST
 * shape (the FK-hinted inner join + the embedded-column filter), which no amount of type-checking
 * verifies and which a well-meaning refactor could quietly widen back to "select every row".
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Recorded = {
  table: string;
  select: string;
  calls: unknown[][];
};

const recorded: Recorded = { table: "", select: "", calls: [] };
let response: { data: unknown; error: unknown } = { data: [], error: null };

const builder = {
  select(columns: string) {
    recorded.select = columns;
    return builder;
  },
  eq(column: string, value: unknown) {
    recorded.calls.push(["eq", column, value]);
    return builder;
  },
  in(column: string, values: unknown) {
    recorded.calls.push(["in", column, values]);
    return builder;
  },
  order(column: string, opts: unknown) {
    recorded.calls.push(["order", column, opts]);
    return builder;
  },
  then<T>(
    onFulfilled: (value: typeof response) => T,
    onRejected?: (reason: unknown) => T,
  ) {
    return Promise.resolve(response).then(onFulfilled, onRejected);
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      recorded.table = table;
      return builder;
    },
  }),
}));

const { listReelItems } = await import("./reel");

beforeEach(() => {
  recorded.table = "";
  recorded.select = "";
  recorded.calls = [];
  response = { data: [], error: null };
});

describe("listReelItems", () => {
  it("inner-joins media and keeps ONLY the membership statuses", async () => {
    response = {
      data: [{ media_id: "m1" }, { media_id: "m2" }],
      error: null,
    };
    const ids = await listReelItems("evt-1");

    expect(recorded.table).toBe("reel_items");
    // !inner is what makes a ghost DISAPPEAR rather than come back with a null media; the FK hint
    // keeps the embed unambiguous now that reel_items relates to `events` too (PGRST201).
    expect(recorded.select).toBe(
      "media_id, media!reel_items_media_id_fkey!inner(status)",
    );
    expect(recorded.calls).toEqual([
      ["eq", "event_id", "evt-1"],
      ["in", "media.status", ["approved", "hidden"]],
      ["order", "position", { ascending: true }],
      ["order", "added_at", { ascending: true }],
    ]);
    expect(ids).toEqual(["m1", "m2"]);
  });

  it("keeps HIDDEN in the predicate and leaves removed/pending out", async () => {
    await listReelItems("evt-1");
    const statuses = recorded.calls.find((c) => c[0] === "in")?.[2] as string[];
    // Hidden items are still the host's curation (shown dimmed, un-hideable), so they must stay
    // members - approved-only membership would re-brick reorder for any reel containing one.
    expect(statuses).toContain("hidden");
    expect(statuses).toContain("approved");
    // ...while the render side (buildReelProps / the render hash / the guest RPC) is approved-only.
    // The divergence is deliberate: membership is what the host curates, not what plays.
    expect(statuses).not.toContain("removed");
    expect(statuses).not.toContain("pending");
  });

  it("orders by curated position, then add time", async () => {
    await listReelItems("evt-1");
    const orders = recorded.calls.filter((c) => c[0] === "order");
    expect(orders.map((c) => c[1])).toEqual(["position", "added_at"]);
  });

  it("returns [] on a query error instead of a partial list", async () => {
    response = { data: null, error: { message: "boom" } };
    expect(await listReelItems("evt-1")).toEqual([]);
  });
});
