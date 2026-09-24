/**
 * SWEEP 3 ON THE CLAMPING FAKE (M17): the R2 page size pinned at MAX_ROWS, each page's thousand
 * candidate ids checked in chunks inside the URL budget, only the objects whose row is gone deleted,
 * and a listing the page cap or the deadline stops said to be stopped (it does not resume).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_ROWS } from "@/lib/db/read-all";
import type { Deadline } from "@/lib/lifecycle/sweep-budget";
import {
  createCronWorld,
  eventRow,
  everyRequestFits,
  mediaRow,
  uuidOf,
  type CronWorld,
} from "@/lib/lifecycle/testing/cron-fake";

type Listed = { key: string; size: number; lastModified: Date | null };

const state = vi.hoisted(() => ({
  world: null as CronWorld | null,
  objects: [] as Listed[],
  endless: false,
  listCalls: [] as { maxKeys?: number; continuationToken?: string }[],
  deleted: [] as string[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: {}, serverEnv: {} }));
vi.mock("@/lib/email/send", () => ({ sendOnce: vi.fn(async () => true) }));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: vi.fn(),
  captureWarning: vi.fn(),
}));
vi.mock("@/lib/r2/delete", () => ({
  deleteR2Objects: vi.fn(async (keys: string[]) => {
    state.deleted.push(...keys);
    return { deleted: keys.length, errored: [] };
  }),
  // S3's ListObjectsV2: at most `maxKeys` a page, a token while more remain.
  listR2Objects: vi.fn(
    async (params: { maxKeys?: number; continuationToken?: string }) => {
      state.listCalls.push(params);
      const size = params.maxKeys ?? 1000;
      const start = Number(params.continuationToken ?? 0);
      if (state.endless) {
        return {
          objects: state.objects.slice(0, size),
          nextToken: String(start + size),
        };
      }
      const objects = state.objects.slice(start, start + size);
      const next = start + size;
      return {
        objects,
        nextToken: next < state.objects.length ? String(next) : null,
      };
    },
  ),
}));

const { sweepOrphans, ORPHAN_LIST_PAGE, ORPHAN_PAGE_CAP } =
  await import("@/lib/lifecycle/sweeps/orphans");

const NOW = new Date("2026-09-23T04:00:00.000Z");
const OLD = new Date("2026-09-01T00:00:00.000Z");

function passesAfter(n: number): Deadline {
  let asked = 0;
  return { at: 0, passed: () => asked++ >= n };
}

/** 1,200 media items, two objects each (2,400 objects over three pages); 50 items have no row. */
function fixture() {
  const event = eventRow(uuidOf("e", 1), uuidOf("h", 1));
  const media = [];
  state.objects = [];
  for (let i = 0; i < 1_200; i++) {
    const id = uuidOf("m", i);
    const row = mediaRow(id, event);
    if (i % 24 !== 0) media.push(row); // 50 items lose their row: orphans
    state.objects.push(
      { key: String(row.original_key), size: 1, lastModified: OLD },
      { key: String(row.preview_key), size: 1, lastModified: OLD },
    );
  }
  state.world = createCronWorld({ events: [event], media });
  return state.world;
}

beforeEach(() => {
  state.world = null;
  state.objects = [];
  state.endless = false;
  state.listCalls = [];
  state.deleted = [];
});

describe("sweepOrphans", () => {
  it("pins the R2 page size, chunks every candidate check, and deletes only the orphans", async () => {
    const world = fixture();
    const tally = await sweepOrphans(world.client, NOW);
    expect(ORPHAN_LIST_PAGE).toBeLessThanOrEqual(MAX_ROWS);
    expect(state.listCalls.every((c) => c.maxKeys === ORPHAN_LIST_PAGE)).toBe(
      true,
    );
    expect(tally).toEqual({
      scanned_pages: 3,
      r2_deleted: 100,
      r2_errored: 0,
      objects_scanned: 2_400,
    });
    expect(state.deleted).toHaveLength(100);
    for (const key of state.deleted) {
      const n = Number(key.split("/")[3].slice(-12));
      expect(n % 24).toBe(0);
    }
    // A page of 1,000 objects is 500 candidate ids: four chunked reads, every URL inside the budget.
    const checks = world.fake.requests.filter(
      (r) => r.name === "media" && r.method === "GET",
    );
    expect(checks.length).toBeGreaterThan(3);
    expect(everyRequestFits(world.fake)).toBe(true);
  });

  it("leaves a young object alone, however orphaned", async () => {
    const world = fixture();
    state.objects = state.objects.map((o) => ({ ...o, lastModified: NOW }));
    const tally = await sweepOrphans(world.client, NOW);
    expect(tally.r2_deleted).toBe(0);
  });

  it("says it stopped when the page cap ends the listing", async () => {
    const world = fixture();
    state.endless = true;
    const tally = await sweepOrphans(world.client, NOW);
    expect(tally.scanned_pages).toBe(ORPHAN_PAGE_CAP);
    expect(tally.stopped_early).toBe(true);
    expect(tally.remaining).toBeUndefined();
    expect(tally.stopped_note).toMatch(/starts again from the top/);
  });

  it("says it stopped when the deadline ends the listing, even before the first page", async () => {
    const world = fixture();
    const one = await sweepOrphans(world.client, NOW, {
      deadline: passesAfter(1),
    });
    expect(one.scanned_pages).toBe(1);
    expect(one.stopped_early).toBe(true);
    const none = await sweepOrphans(world.client, NOW, {
      deadline: passesAfter(0),
    });
    expect(none.scanned_pages).toBe(0);
    expect(none.stopped_early).toBe(true);
  });
});
