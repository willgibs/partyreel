/**
 * SWEEP 1 ON THE CLAMPING FAKE (M15, H14, H15): every expired event read by keyset, the hold decided
 * by one `held_event_ids` answer (1,500 held rows keep their event held), each batch's media reclaimed
 * whole in pages before its event row goes, every id list inside the URL budget, and a deadline that
 * stops the sweep mid-event leaving that event's rows for the next run.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_ROWS } from "@/lib/db/read-all";
import { reelOutputKey } from "@/lib/r2/keys";
import type { Deadline } from "@/lib/lifecycle/sweep-budget";
import {
  createCronWorld,
  eventRow,
  everyRequestFits,
  mediaRow,
  uuidOf,
  type CronWorld,
} from "@/lib/lifecycle/testing/cron-fake";
import type { FakeRow } from "@/lib/db/testing/fake-postgrest";

const state = vi.hoisted(() => ({ world: null as CronWorld | null }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/r2/delete", () => ({
  deleteR2Objects: vi.fn(async (keys: string[]) => {
    state.world?.recordR2(keys);
    return { deleted: keys.length, errored: [] };
  }),
  listR2Objects: vi.fn(),
}));

const { sweepExpiredEvents } =
  await import("@/lib/lifecycle/sweeps/expired-events");

const NOW = new Date("2026-09-23T04:00:00.000Z");
const PAST = "2026-09-01T00:00:00.000000+00:00";
const FUTURE = "2026-10-15T00:00:00.000000+00:00";
const HOST = uuidOf("h", 1);

/** A deadline that passes once `passed()` has been asked `n` times. */
function passesAfter(n: number): Deadline {
  let asked = 0;
  return { at: 0, passed: () => asked++ >= n };
}

type Fixture = {
  world: CronWorld;
  big: FakeRow;
  held: FakeRow;
  heldLater: FakeRow;
  notYet: FakeRow;
  live: FakeRow;
  empties: FakeRow[];
};

function fixture(): Fixture {
  const expired = {
    deleted_at: "2026-08-20T00:00:00.000000+00:00",
    purge_at: PAST,
  };
  // Ids chosen so the big event sorts FIRST and the two held events come after it.
  const big = eventRow(uuidOf("e0", 1), HOST, expired);
  const held = eventRow(uuidOf("e1", 1), HOST, expired);
  const heldLater = eventRow(uuidOf("e1", 2), HOST, expired);
  const notYet = eventRow(uuidOf("e2", 1), HOST, {
    deleted_at: "2026-09-20T00:00:00.000000+00:00",
    purge_at: FUTURE,
  });
  const live = eventRow(uuidOf("e3", 1), HOST);
  // 320 expired events with no media: three keyset batches of IN_CHUNK.
  const empties = Array.from({ length: 320 }, (_, i) =>
    eventRow(uuidOf("e4", i), HOST, expired),
  );
  const media = [
    // 2,500 media in one expired event: two and a half pages.
    ...Array.from({ length: 2_500 }, (_, i) =>
      mediaRow(uuidOf("m0", i), big, { file_size_bytes: 7 }),
    ),
    // 1,500 HELD rows and 10 unheld in the second: the whole event is kept.
    ...Array.from({ length: 1_500 }, (_, i) =>
      mediaRow(uuidOf("m1", i), held, { legal_hold_at: PAST }),
    ),
    ...Array.from({ length: 10 }, (_, i) => mediaRow(uuidOf("m2", i), held)),
    // One held row in a third event, AFTER all of those: a read of held rows cut at 1,000 never
    // reached it, and the event read as purgeable.
    mediaRow(uuidOf("m3", 0), heldLater, { legal_hold_at: PAST }),
    mediaRow(uuidOf("m4", 0), notYet),
    mediaRow(uuidOf("m5", 0), live),
  ];
  const world = createCronWorld({
    events: [big, held, heldLater, notYet, live, ...empties],
    media,
  });
  state.world = world;
  return { world, big, held, heldLater, notYet, live, empties };
}

beforeEach(() => {
  state.world = null;
});

describe("sweepExpiredEvents", () => {
  it("purges every expired event whole, keeps every held one whole, and fits every request", async () => {
    const { world, big, held, heldLater, notYet, live } = fixture();
    const handled = new Set<string>();
    const tally = await sweepExpiredEvents(world.client, NOW, handled);

    expect(tally).toEqual({
      events: 321,
      hold_blocked_events: 2,
      media_rows: 2_500,
      r2_deleted: 2 * 2_500 + 321, // original + preview each, and one reel key per purged event
      r2_errored: 0,
      freed_bytes: 2_500 * 7,
    });
    expect(tally.stopped_early).toBeUndefined();

    const eventIds = world.fake.tables.events.map((e) => e.id);
    expect(eventIds.sort()).toEqual(
      [held.id, heldLater.id, notYet.id, live.id].sort(),
    );
    const left = world.fake.tables.media;
    expect(left.filter((m) => m.event_id === big.id)).toHaveLength(0);
    expect(left.filter((m) => m.event_id === held.id)).toHaveLength(1_510);
    expect(left.filter((m) => m.event_id === heldLater.id)).toHaveLength(1);
    expect(handled.size).toBe(2_500);

    expect(everyRequestFits(world.fake)).toBe(true);
    expect(Math.max(...world.purgeCallSizes)).toBeLessThanOrEqual(MAX_ROWS);
  });

  it("deletes every object before the rows that name it, and the reel before the event row", async () => {
    const { world, big } = fixture();
    await sweepExpiredEvents(world.client, NOW, new Set());
    const deletedKeys = new Set<string>();
    for (const entry of world.log) {
      if (entry.kind === "r2") {
        for (const key of entry.keys) deletedKeys.add(key);
        continue;
      }
      for (const id of entry.ids) {
        expect(
          deletedKeys.has(`events/${String(big.id)}/photo/${id}/original.jpg`),
          `the object of ${id} is deleted before its row`,
        ).toBe(true);
      }
    }
    expect(deletedKeys.has(reelOutputKey(String(big.id)))).toBe(true);
  });

  it("stops at its deadline mid-event, leaves that event standing with its rest, and says how much is left", async () => {
    const { world, big } = fixture();
    // Asked once before the first event batch, once before each media page: it passes before the
    // big event's third page.
    const tally = await sweepExpiredEvents(world.client, NOW, new Set(), {
      deadline: passesAfter(3),
    });
    expect(tally.stopped_early).toBe(true);
    expect(tally.media_rows).toBe(2 * MAX_ROWS);
    expect(tally.events).toBe(0);
    // Every expired event is still waiting (the unfinished big one, the two held, the 320 empty).
    expect(tally.remaining).toBe(323);
    expect(world.fake.tables.events.some((e) => e.id === big.id)).toBe(true);
    expect(
      world.fake.tables.media.filter((m) => m.event_id === big.id),
    ).toHaveLength(500);

    // The next run carries on and finishes.
    const next = await sweepExpiredEvents(world.client, NOW, new Set());
    expect(next.events).toBe(321);
    expect(next.media_rows).toBe(500);
    expect(world.fake.tables.events.some((e) => e.id === big.id)).toBe(false);
  });

  it("keeps an event a hold reached WHILE the sweep ran, with its held row", async () => {
    const { world, big } = fixture();
    const purge = world.fake.functions.purge_media_rows;
    let calls = 0;
    world.fake.functions.purge_media_rows = (args) => {
      const answer = purge(args);
      // After the first page is purged, an operator holds one of the big event's remaining items.
      if (++calls === 1) {
        const target = world.fake.tables.media.find(
          (m) => m.event_id === big.id,
        );
        if (target) target.legal_hold_at = PAST;
      }
      return answer;
    };
    const tally = await sweepExpiredEvents(world.client, NOW, new Set());
    expect(world.fake.tables.events.some((e) => e.id === big.id)).toBe(true);
    const bigLeft = world.fake.tables.media.filter(
      (m) => m.event_id === big.id,
    );
    expect(bigLeft).toHaveLength(1);
    expect(bigLeft[0].legal_hold_at).toBe(PAST);
    expect(tally.hold_blocked_events).toBe(3);
    expect(tally.media_rows).toBe(2_499);
  });

  it("reports nothing to do when nothing has expired", async () => {
    const live = eventRow(uuidOf("e", 1), HOST);
    const world = createCronWorld({ events: [live], media: [] });
    state.world = world;
    expect(await sweepExpiredEvents(world.client, NOW, new Set())).toEqual({
      events: 0,
      hold_blocked_events: 0,
      media_rows: 0,
      r2_deleted: 0,
      r2_errored: 0,
      freed_bytes: 0,
    });
  });
});
