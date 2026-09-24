/**
 * THE ONE WAY BYTES LEAVE, on the clamping fake: R2 before the rows, never more than MAX_ROWS ids a
 * `purge_media_rows` call (M16), the freed bytes whole, and the hold question as one uuid[] per call.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_ROWS } from "@/lib/db/read-all";
import {
  createCronWorld,
  eventRow,
  mediaRow,
  uuidOf,
  type CronWorld,
} from "@/lib/lifecycle/testing/cron-fake";

const state = vi.hoisted(() => ({ world: null as CronWorld | null }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/r2/delete", () => ({
  deleteR2Objects: vi.fn(async (keys: string[]) => {
    state.world?.recordR2(keys);
    return { deleted: keys.length, errored: [] };
  }),
  listR2Objects: vi.fn(),
}));

const { mediaKeysOf, purgeMediaRows, readHeldEventIds, reclaimMedia } =
  await import("@/lib/lifecycle/reclaim");

function worldWith(mediaCount: number) {
  const events = [eventRow(uuidOf("e", 1), uuidOf("h", 1))];
  const media = Array.from({ length: mediaCount }, (_, i) =>
    mediaRow(uuidOf("m", i), events[0], { file_size_bytes: 10 }),
  );
  state.world = createCronWorld({ events, media });
  return state.world;
}

beforeEach(() => {
  state.world = null;
});

describe("purgeMediaRows", () => {
  it("never hands purge_media_rows more than MAX_ROWS ids, and sums every call's freed bytes", async () => {
    const world = worldWith(2_500);
    const ids = world.fake.tables.media.map((m) => String(m.id));
    const freed = await purgeMediaRows(world.client, ids);
    expect(world.purgeCallSizes).toEqual([MAX_ROWS, MAX_ROWS, 500]);
    expect(freed).toBe(25_000);
    expect(world.fake.tables.media).toHaveLength(0);
  });

  it("makes no call for an empty list", async () => {
    const world = worldWith(3);
    expect(await purgeMediaRows(world.client, [])).toBe(0);
    expect(world.purgeCallSizes).toEqual([]);
  });

  it("throws on a failed call rather than reporting zero freed", async () => {
    const world = worldWith(3);
    world.fake.functions.purge_media_rows = () => {
      throw new Error("the database is gone");
    };
    await expect(purgeMediaRows(world.client, ["x"])).rejects.toThrow(
      /purge_media_rows: the database is gone/,
    );
  });
});

describe("reclaimMedia", () => {
  it("deletes every object BEFORE the rows that name them, derived keys included", async () => {
    const world = worldWith(1_200);
    const rows = world.fake.tables.media.map((m) => ({
      id: String(m.id),
      original_key: String(m.original_key),
      preview_key: m.preview_key as string | null,
    }));
    const result = await reclaimMedia(world.client, rows, [
      "events/x/reel/reel.mp4",
    ]);
    expect(result).toEqual({
      media_rows: 1_200,
      r2_deleted: 2_401,
      r2_errored: 0,
      freed_bytes: 12_000,
    });
    // One R2 pass, then the purges.
    expect(world.log.map((entry) => entry.kind)).toEqual([
      "r2",
      "purge",
      "purge",
    ]);
    const [r2] = world.log;
    expect(r2.kind === "r2" && r2.keys).toEqual([
      ...mediaKeysOf(rows),
      "events/x/reel/reel.mp4",
    ]);
  });

  it("does not call the purge for an empty batch", async () => {
    const world = worldWith(0);
    const result = await reclaimMedia(
      world.client,
      [],
      ["events/x/reel/reel.mp4"],
    );
    expect(result.media_rows).toBe(0);
    expect(world.purgeCallSizes).toEqual([]);
  });
});

describe("readHeldEventIds", () => {
  it("answers which events hold anything, past 1,000 held rows, as one array", async () => {
    const a = eventRow(uuidOf("ea", 1), uuidOf("h", 1));
    const b = eventRow(uuidOf("eb", 1), uuidOf("h", 1));
    const c = eventRow(uuidOf("ec", 1), uuidOf("h", 1));
    const media = [
      // 1,500 held rows in one event, then ONE held row in a second: a read of held ROWS would stop
      // at 1,000 and never see the second event.
      ...Array.from({ length: 1_500 }, (_, i) =>
        mediaRow(uuidOf("ma", i), a, {
          legal_hold_at: "2026-09-01T00:00:00.000000+00:00",
        }),
      ),
      mediaRow(uuidOf("mb", 0), b, {
        legal_hold_at: "2026-09-01T00:00:00.000000+00:00",
      }),
      mediaRow(uuidOf("mc", 0), c),
    ];
    state.world = createCronWorld({ events: [a, b, c], media });
    const held = await readHeldEventIds(state.world.client, [
      String(a.id),
      String(b.id),
      String(c.id),
    ]);
    expect(held.sort()).toEqual([String(a.id), String(b.id)].sort());
  });

  it("asks at most MAX_ROWS events a call, in the POST body", async () => {
    const world = worldWith(0);
    const ids = Array.from({ length: 2_300 }, (_, i) => uuidOf("e", i));
    await readHeldEventIds(world.client, ids);
    expect(world.heldCalls.map((call) => call.length)).toEqual([
      MAX_ROWS,
      MAX_ROWS,
      300,
    ]);
    expect(world.fake.requests.every((r) => r.method === "POST")).toBe(true);
  });
});
