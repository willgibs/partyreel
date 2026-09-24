/**
 * SWEEP 8 ON THE CLAMPING FAKE (H12): the hosts discovered through `standby_hosts` pages past 1,000,
 * only an over-budget host's bin read, and read WHOLE so eviction is oldest-first across all of it,
 * and delete-final's rule: a guest's own withdrawal never counts in the host's budget and is never
 * evicted by it (a host whose bin is only withdrawals is not even listed).
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

const { sweepStandbyBudget } =
  await import("@/lib/lifecycle/sweeps/standby-budget");

const NOW = new Date("2026-09-23T04:00:00.000Z");
const CAP = 5_000; // the budget is 1 x the cap
const HELD = "2026-09-01T00:00:00.000000+00:00";

function passesAfter(n: number): Deadline {
  let asked = 0;
  return { at: 0, passed: () => asked++ >= n };
}

function capped(id: string, cap: number | null = CAP): FakeRow {
  return { id, tier: "pro", storage_cap_bytes: cap };
}

function removed(
  id: string,
  event: FakeRow,
  seconds: number,
  over: Partial<FakeRow> = {},
) {
  return mediaRow(id, event, {
    status: "removed",
    removed_at: stamp(seconds),
    purge_at: "2026-10-30T00:00:00.000000+00:00",
    file_size_bytes: 10,
    ...over,
  });
}

/**
 * 1,200 hosts well inside their budget; host X over it with 2,500 host removals (the OLDEST at the
 * HIGHEST ids, so a bin read cut at 1,000 rows by id would miss them), 100 items of a deleted event,
 * 500 withdrawals, 50 system removals and 20 held; host Y with nothing but 1,000 withdrawals; host Z
 * unlimited.
 */
function fixture() {
  const profiles: FakeRow[] = [];
  const events: FakeRow[] = [];
  const media: FakeRow[] = [];
  for (let i = 0; i < 1_200; i++) {
    const host = uuidOf("a", i);
    profiles.push(capped(host));
    const e = eventRow(uuidOf("ea", i), host);
    events.push(e);
    media.push(removed(uuidOf("ma", i), e, 10));
  }
  const x = uuidOf("x", 1);
  const y = uuidOf("y", 1);
  const z = uuidOf("z", 1);
  profiles.push(capped(x), capped(y), capped(z, null));
  const xLive = eventRow(uuidOf("ex", 1), x);
  const xGone = eventRow(uuidOf("ex", 2), x, { deleted_at: stamp(100_000) });
  const yLive = eventRow(uuidOf("ey", 1), y);
  const zLive = eventRow(uuidOf("ez", 1), z);
  events.push(xLive, xGone, yLive, zLive);
  for (let i = 0; i < 2_500; i++) {
    media.push(removed(uuidOf("mx", i), xLive, 2_499 - i));
  }
  for (let i = 0; i < 100; i++) {
    media.push(mediaRow(uuidOf("mg", i), xGone, { file_size_bytes: 10 }));
  }
  for (let i = 0; i < 500; i++) {
    media.push(
      removed(uuidOf("mw", i), xLive, 0, { removed_by_uploader: true }),
    );
  }
  for (let i = 0; i < 50; i++) {
    media.push(removed(uuidOf("ms", i), xLive, 0, { removed_by_system: true }));
  }
  for (let i = 0; i < 20; i++) {
    media.push(removed(uuidOf("mh", i), xLive, 0, { legal_hold_at: HELD }));
  }
  for (let i = 0; i < 1_000; i++) {
    media.push(
      removed(uuidOf("my", i), yLive, 0, { removed_by_uploader: true }),
    );
  }
  for (let i = 0; i < 100; i++) {
    media.push(removed(uuidOf("mz", i), zLive, 0));
  }
  const world = createCronWorld({ profiles, events, media });
  state.world = world;
  return { world, x, y, z };
}

function evictedIds(world: CronWorld): string[] {
  return world.log.flatMap((entry) =>
    entry.kind === "purge" ? entry.ids : [],
  );
}

beforeEach(() => {
  state.world = null;
});

describe("sweepStandbyBudget", () => {
  it("finds every host past 1,000, evicts oldest-first across the WHOLE bin, and never a withdrawal", async () => {
    const { world } = fixture();
    const tally = await sweepStandbyBudget(world.client, NOW, new Set());

    // Listed: the 1,200 inside hosts, X and Z. Y (withdrawals only) has no standby bytes at all.
    expect(tally).toMatchObject({
      candidates: 1_202,
      over_budget: 1,
      media_rows: 2_100,
      freed_bytes: 21_000,
    });
    expect(tally.stopped_early).toBeUndefined();

    // The 2,100 OLDEST host removals of X: the highest ids, beyond any first thousand by id.
    const evicted = new Set(evictedIds(world));
    const expected = Array.from({ length: 2_100 }, (_, k) =>
      uuidOf("mx", 2_499 - k),
    );
    expect([...evicted].sort()).toEqual(expected.sort());

    const left = world.fake.tables.media;
    const count = (prefix: string) =>
      left.filter((m) => String(m.id).startsWith(uuidOf(prefix, 0).slice(0, 8)))
        .length;
    expect(count("mw")).toBe(500); // X's withdrawals: never counted, never evicted
    expect(count("my")).toBe(1_000); // Y's withdrawals
    expect(count("ms")).toBe(50);
    expect(count("mh")).toBe(20);
    expect(count("mz")).toBe(100); // Z is unlimited
    expect(count("mx")).toBe(400);
    expect(count("mg")).toBe(100);

    expect(Math.max(...world.purgeCallSizes)).toBeLessThanOrEqual(MAX_ROWS);
    expect(everyRequestFits(world.fake)).toBe(true);
  });

  it("stops at its deadline and says so; the next run carries on from the first host", async () => {
    const { world } = fixture();
    // One ask before each host page, one before each over-budget host: it stops before X.
    const first = await sweepStandbyBudget(world.client, NOW, new Set(), {
      deadline: passesAfter(2),
    });
    expect(first.stopped_early).toBe(true);
    expect(first.media_rows).toBe(0);
    const next = await sweepStandbyBudget(world.client, NOW, new Set());
    expect(next.media_rows).toBe(2_100);
  });
});
