/**
 * SWEEP 2 ON THE CLAMPING FAKE (H8): every due removed row reclaimed, oldest `purge_at` first across
 * page boundaries (ties broken by id on the composite cursor), a guest's withdrawal purged on its own
 * `purge_at`, a held row never touched, and a deadline that stops it reporting what is left.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_ROWS } from "@/lib/db/read-all";
import type { FakeRow } from "@/lib/db/testing/fake-postgrest";
import type { Deadline } from "@/lib/lifecycle/sweep-budget";
import {
  createCronWorld,
  eventRow,
  everyRequestFits,
  mediaRow,
  stamp,
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

const { sweepRemovedMedia } =
  await import("@/lib/lifecycle/sweeps/removed-media");

const NOW = new Date("2026-09-23T04:00:00.000Z");
const HELD = "2026-09-01T00:00:00.000000+00:00";

function passesAfter(n: number): Deadline {
  let asked = 0;
  return { at: 0, passed: () => asked++ >= n };
}

/**
 * 2,500 due rows whose `purge_at` runs AGAINST their id order (the newest id is the oldest due), with
 * a block of 30 sharing one `purge_at` across the first page boundary; 5 of them a guest's own
 * withdrawal. Beside them: 3 held due rows, 10 not yet due, and 20 live.
 */
function fixture() {
  const event = eventRow(uuidOf("e", 1), uuidOf("h", 1));
  const due: FakeRow[] = Array.from({ length: 2_500 }, (_, i) => {
    // Rank 0 is the oldest; ranks 985..1014 share one instant.
    const rank = 2_499 - i;
    const seconds = rank >= 985 && rank < 1_015 ? 985 : rank;
    return mediaRow(uuidOf("m", i), event, {
      status: "removed",
      removed_at: stamp(seconds),
      purge_at: stamp(seconds),
      removed_by_uploader: i % 500 === 0,
    });
  });
  const held = Array.from({ length: 3 }, (_, i) =>
    mediaRow(uuidOf("mh", i), event, {
      status: "removed",
      purge_at: stamp(1),
      legal_hold_at: HELD,
    }),
  );
  const notYet = Array.from({ length: 10 }, (_, i) =>
    mediaRow(uuidOf("mn", i), event, {
      status: "removed",
      purge_at: "2026-10-20T00:00:00.000000+00:00",
    }),
  );
  const live = Array.from({ length: 20 }, (_, i) =>
    mediaRow(uuidOf("ml", i), event),
  );
  const world = createCronWorld({
    events: [event],
    media: [...due, ...held, ...notYet, ...live],
  });
  state.world = world;
  return { world, due };
}

/** The ids in the order they were purged. */
function purgedOrder(world: CronWorld): string[] {
  return world.log.flatMap((entry) =>
    entry.kind === "purge" ? entry.ids : [],
  );
}

beforeEach(() => {
  state.world = null;
});

describe("sweepRemovedMedia", () => {
  it("reclaims every due row, oldest purge_at first across pages, and nothing else", async () => {
    const { world, due } = fixture();
    const handled = new Set<string>();
    const tally = await sweepRemovedMedia(world.client, NOW, handled);
    // ★ RESHAPED ON PURPOSE (triage-r2-wiring, 2026-09-29; scar kept: a held row is never touched). The three held
    // rows past their window are now DEFERRED (`defer_kept_due_media`: asked, so their bytes leave the host's
    // meter the night any other removal's would), and nothing of them is deleted.
    expect(tally).toEqual({
      media_rows: 2_500,
      // Reshaped by take-home-wiring (2026-10-03): a photograph's three stored copies each.
      r2_deleted: 7_500,
      r2_errored: 0,
      freed_bytes: 2_500_000,
      deferred: 3,
    });

    const expected = [...due]
      .sort((a, b) => {
        const pa = String(a.purge_at);
        const pb = String(b.purge_at);
        if (pa !== pb) return pa < pb ? -1 : 1;
        return String(a.id) < String(b.id) ? -1 : 1;
      })
      .map((m) => String(m.id));
    expect(purgedOrder(world)).toEqual(expected);
    expect(world.purgeCallSizes).toEqual([MAX_ROWS, MAX_ROWS, 500]);

    // Left: the held, the not-yet-due and the live rows. The withdrawals went with the rest.
    const left = world.fake.tables.media;
    expect(left).toHaveLength(33);
    expect(left.filter((m) => m.legal_hold_at === HELD)).toHaveLength(3);
    expect(handled.size).toBe(2_500);
    expect(everyRequestFits(world.fake)).toBe(true);
  });

  it("stops at its deadline with the due rows it left, counted, and the next run carries on", async () => {
    const { world } = fixture();
    const tally = await sweepRemovedMedia(world.client, NOW, new Set(), {
      deadline: passesAfter(1),
    });
    expect(tally).toMatchObject({
      media_rows: MAX_ROWS,
      stopped_early: true,
      remaining: 1_500,
    });
    const next = await sweepRemovedMedia(world.client, NOW, new Set());
    expect(next.media_rows).toBe(1_500);
    expect(next.stopped_early).toBeUndefined();
  });

  it("skips what an earlier sweep in the same run already handled", async () => {
    const { world, due } = fixture();
    const handled = new Set([String(due[0].id), String(due[1].id)]);
    const tally = await sweepRemovedMedia(world.client, NOW, handled);
    expect(tally.media_rows).toBe(2_498);
  });
});

/**
 * WHAT AN OPEN REPORT KEEPS (admin-triage r2, 20260929140000; Will: "an open report protects its item from every
 * permanent delete until the report closes"). The sweep asks `kept_media_ids` before a single object goes, marks
 * asked (`defer_kept_due_media`) a kept removal past its window so its bytes leave the host's meter the night any
 * other removal's would, and takes an asked row the night its keeper lets go, whatever its own window says.
 */
describe("sweepRemovedMedia: what an open report keeps", () => {
  function reportedWorld() {
    const event = eventRow(uuidOf("e", 2), uuidOf("h", 2));
    const reported = mediaRow(uuidOf("mr", 1), event, {
      status: "removed",
      removed_at: stamp(10),
      purge_at: stamp(10),
    });
    const other = mediaRow(uuidOf("mo", 1), event, {
      status: "removed",
      removed_at: stamp(11),
      purge_at: stamp(11),
    });
    const report = {
      id: "r1",
      status: "open",
      media_id: reported.id,
      event_id: event.id,
    };
    const world = createCronWorld({
      events: [event],
      media: [reported, other],
      reports: [report],
    });
    state.world = world;
    return { world, reported, other, report };
  }

  const r2Keys = (world: CronWorld) =>
    world.log.flatMap((entry) => (entry.kind === "r2" ? entry.keys : []));

  it("★ keeps a reported item past its window whole, off her meter, and takes it the night the report closes", async () => {
    const { world, reported, report } = reportedWorld();
    const first = await sweepRemovedMedia(world.client, NOW, new Set());
    expect(first).toMatchObject({ media_rows: 1, deferred: 1 });
    // Not one of its objects was deleted, and the batch asked before anything went.
    expect(r2Keys(world)).not.toContain(reported.original_key);
    expect(r2Keys(world)).not.toContain(reported.preview_key);
    expect(r2Keys(world)).not.toContain(reported.phone_key);
    expect(world.keptCalls.flat()).toContain(reported.id);
    const kept = world.fake.tables.media.find((m) => m.id === reported.id)!;
    expect(kept.purge_asked_at).toEqual(expect.any(String));

    report.status = "dismissed";
    const second = await sweepRemovedMedia(world.client, NOW, new Set());
    // Its bytes left her meter at the ask, so the purge frees nothing twice.
    expect(second).toMatchObject({ media_rows: 1, freed_bytes: 0 });
    expect(world.fake.tables.media).toHaveLength(0);
    expect(r2Keys(world)).toContain(reported.original_key);
    expect(r2Keys(world)).toContain(reported.phone_key);
  });

  it("★ an album report keeps every item of its album, and an asked row goes the night it closes, window or not", async () => {
    const event = eventRow(uuidOf("e", 3), uuidOf("h", 3));
    // Her Delete permanently on a kept row: asked, its own window still weeks away.
    const asked = mediaRow(uuidOf("ma", 1), event, {
      status: "removed",
      removed_at: stamp(20),
      purge_at: "2026-10-20T00:00:00.000000+00:00",
      purge_asked_at: "2026-09-22T00:00:00.000Z",
    });
    const due = mediaRow(uuidOf("md", 1), event, {
      status: "removed",
      removed_at: stamp(21),
      purge_at: stamp(21),
    });
    const album = {
      id: "r2",
      status: "open",
      media_id: null,
      event_id: event.id,
    };
    const world = createCronWorld({
      events: [event],
      media: [asked, due],
      reports: [album],
    });
    state.world = world;

    const first = await sweepRemovedMedia(world.client, NOW, new Set());
    expect(first).toMatchObject({ media_rows: 0, deferred: 1 });
    expect(world.fake.tables.media).toHaveLength(2);

    album.status = "actioned";
    const second = await sweepRemovedMedia(world.client, NOW, new Set());
    expect(second.media_rows).toBe(2);
    expect(world.fake.tables.media).toHaveLength(0);
  });

  it("never marks an operator's removal asked: it waits on its own window, already off her meter", async () => {
    const event = eventRow(uuidOf("e", 4), uuidOf("h", 4));
    const operator = mediaRow(uuidOf("mx", 1), event, {
      status: "removed",
      removed_by_admin: true,
      removed_at: stamp(30),
      purge_at: stamp(30),
    });
    const world = createCronWorld({
      events: [event],
      media: [operator],
      reports: [
        { id: "r3", status: "open", media_id: operator.id, event_id: event.id },
      ],
    });
    state.world = world;
    const tally = await sweepRemovedMedia(world.client, NOW, new Set());
    expect(tally.deferred).toBeUndefined();
    expect(operator.purge_asked_at).toBeNull();
    expect(world.fake.tables.media).toHaveLength(1);
  });
});
