import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE LIVE WALL'S ONE READ IS A PUBLIC ENDPOINT (host-dashboard r1, `arrivals=live`): the id is the
 * caller's word, so it answers only for the signed-in host's own live event (`getEvent`, RLS), reads the
 * door only after that proof, and a failure costs one refresh and says so, never the stage.
 */

vi.mock("server-only", () => ({}));
const reads = vi.hoisted(() => ({
  event: null as { id: string } | null,
  doorAsked: [] as string[],
  fail: false,
}));
vi.mock("@/lib/db/queries/events", () => ({
  getEvent: async (id: string) =>
    reads.event && reads.event.id === id ? reads.event : null,
  getEventCardStats: async (ids: string[]) =>
    new Map(ids.map((id) => [id, { approved: 143, pending: 4 }])),
}));
vi.mock("@/lib/db/queries/event-doors", () => ({
  getDoorCounts: async (id: string) => {
    reads.doorAsked.push(id);
    return { in: 10, waiting: 2 };
  },
}));
vi.mock("@/lib/db/queries/dashboard", () => ({
  getStagePhotos: async (_id: string, n: number) => {
    if (reads.fail) throw new Error("r2 down");
    return Array.from({ length: n }, (_, i) => ({ id: `m${i}`, url: `u${i}` }));
  },
  countArrivalsSince: async () => 32,
}));
const captureError = vi.hoisted(() => vi.fn());
vi.mock("@/lib/observability/sentry", () => ({ captureError }));

const { readStageLiveAction } = await import("./stage-action");

beforeEach(() => {
  reads.event = { id: "mine" };
  reads.doorAsked = [];
  reads.fail = false;
  captureError.mockClear();
});

describe("readStageLiveAction", () => {
  it("answers the host's own event: its newest nine, its counts, its door and its last hour", async () => {
    const live = await readStageLiveAction("mine");
    expect(live).toMatchObject({
      approved: 143,
      pending: 4,
      waiting: 2,
      lastHour: 32,
    });
    expect(live?.photos).toHaveLength(9);
  });

  it("★ answers nothing for an event that is not the host's, and never reads its door", async () => {
    expect(await readStageLiveAction("someone-elses")).toBeNull();
    expect(reads.doorAsked).toEqual([]);
  });

  it("answers nothing for anything that is not an id", async () => {
    expect(await readStageLiveAction(42)).toBeNull();
    expect(await readStageLiveAction({ id: "mine" })).toBeNull();
    expect(reads.doorAsked).toEqual([]);
  });

  it("costs one refresh when a read fails, and says so where failures are read", async () => {
    reads.fail = true;
    expect(await readStageLiveAction("mine")).toBeNull();
    expect(captureError).toHaveBeenCalledWith("db", expect.any(Error), {
      seam: "dashboard_stage_live",
    });
  });
});
