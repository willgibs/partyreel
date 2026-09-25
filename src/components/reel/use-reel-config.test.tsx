/**
 * THE STUDIO'S REORDER SET IS THE WHOLE REEL, PAST 1,000 ITEMS (C4, the 1,000-row round, 2026-09-23).
 *
 * The filmstrip dock hands `reorder_reel` the controller's `membership`: every reel member found
 * among the room's items. `reorder_reel`'s set-equality guard refuses anything short of the full
 * membership as `stale`. The room's items were the album's newest 1,000 (one PostgREST read) and the
 * members a read cut the same way, so on a big album a member outside that window vanished from the
 * set and every drag reverted.
 *
 * The reads are whole (`listEventMedia` in lib/db/queries/media.test.ts, `listReelItems` in
 * lib/db/queries/reel.test.ts, both on the clamping fake), and the REAL controller, handed inputs of
 * that size with the reel's oldest members far outside the newest 1,000, yields the full set and
 * commits it (rendered below). (The room that fed it is a redirect to the live reel's view now, so
 * its source pin left with it.)
 */
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type GridMedia } from "@/components/app/media-grid";

const rpc = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ rpc, from: vi.fn() }),
}));
vi.mock("@/lib/reel/engine/encode", () => ({ encodeReel: vi.fn() }));
vi.mock("@/lib/reel/engine/support", () => ({
  probeEngineSupport: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/lib/reel/engine/encode-gate", () => ({
  shouldClientEncode: () => true,
}));

import { ReelProvider, useReel } from "./reel-provider";
import { useReelConfig } from "./use-reel-config";

const uuid = (i: number) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;

/** Every fifth photograph is hidden and every ninth held for review; the rest are approved. */
const statusOf = (i: number) =>
  i % 9 === 4 ? "pending" : i % 5 === 2 ? "hidden" : "approved";

/**
 * The room's items for a 2,500-photo album, newest first (row 2,499 the oldest), as the album slice
 * returns them: approved + hidden, the held ones in Review.
 */
const items: GridMedia[] = Array.from({ length: 2500 }, (_, i) => i)
  .filter((i) => statusOf(i) !== "pending")
  .map((i) => ({
    id: uuid(i),
    type: "photo" as const,
    url: `signed:${uuid(i)}`,
    status: statusOf(i) as GridMedia["status"],
    width: 1200,
    height: 800,
  }));

/** The reel: its first 1,300 slots are the album's OLDEST photographs, from row 2,499 upward. */
const reelIds = [...items]
  .reverse()
  .slice(0, 1300)
  .map((m) => m.id);

type Controller = ReturnType<typeof useReelConfig>;

function Probe({
  onReady,
}: {
  onReady: (c: Controller, reel: ReturnType<typeof useReel>) => void;
}) {
  const config = useReelConfig({
    eventId: "ev-1",
    items,
    reelConfig: null,
    watermark: false,
    tier: "pro",
  });
  onReady(config, useReel());
  return null;
}

describe("the Studio's reorder set", () => {
  it("is every one of the reel's 1,300 members, the album's oldest included, and commits whole", async () => {
    expect(items.length).toBeGreaterThan(1000);

    let config: Controller | null = null;
    let reel: ReturnType<typeof useReel> = null;
    render(
      <ReelProvider eventId="ev-1" initialReelIds={reelIds}>
        <Probe
          onReady={(c, r) => {
            config = c;
            reel = r;
          }}
        />
      </ReelProvider>,
    );

    const membership = config!.membership.map((m) => m.id);
    expect(membership).toEqual(reelIds);
    expect(membership[0]).toBe(uuid(2499));
    // Hidden members stay in the set (shown dimmed); the timeline that renders is approved-only.
    expect(config!.timeline.every((m) => m.status === "approved")).toBe(true);
    expect(config!.timeline.length).toBeLessThan(membership.length);

    // What the filmstrip hands reorder_reel after a drag: the full membership, reordered.
    rpc.mockResolvedValue({ data: { ok: true }, error: null });
    const reordered = [...membership.slice(1), membership[0]];
    await act(async () => {
      await reel!.reorder(reordered);
    });
    expect(rpc).toHaveBeenCalledWith("reorder_reel", {
      p_event_id: "ev-1",
      p_media_ids: reordered,
    });
    expect(reordered).toHaveLength(1300);
  });
});
