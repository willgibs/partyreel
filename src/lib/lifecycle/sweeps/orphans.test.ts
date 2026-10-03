/**
 * SWEEP 3 ON THE CLAMPING FAKE (M17): the R2 page size pinned at MAX_ROWS, each page's thousand
 * candidate ids checked in chunks inside the URL budget, only the objects whose row is gone deleted,
 * and a listing the page cap or the deadline stops said to be stopped. It RESUMES (backup-prune,
 * 2026-10-03): the position it stopped at rides the purge run's row, and its next run lists after it,
 * so an abandoned upload past the first 20,000 keys is reached; the reshaped "it does not resume" test
 * is gone with the behaviour it pinned.
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

type ListParams = {
  maxKeys?: number;
  continuationToken?: string;
  startAfter?: string;
};

const state = vi.hoisted(() => ({
  world: null as CronWorld | null,
  objects: [] as Listed[],
  endless: false,
  listCalls: [] as ListParams[],
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
  // S3's ListObjectsV2: at most `maxKeys` a page in key order, after `StartAfter` when it is given, a token
  // while more remain.
  listR2Objects: vi.fn(async (params: ListParams) => {
    state.listCalls.push(params);
    const size = params.maxKeys ?? 1000;
    if (state.endless) {
      // A bucket longer than any run reaches: young objects (never candidates) as far as it is listed.
      const from =
        params.startAfter !== undefined
          ? Number(params.startAfter.split("/")[3].slice(-12)) + 1
          : Number(params.continuationToken ?? 0);
      return {
        objects: Array.from({ length: size }, (_, i) => ({
          key: `events/${uuidOf("e", 9)}/photo/${uuidOf("y", from + i)}/original.jpg`,
          size: 1,
          lastModified: new Date("2026-09-23T04:00:00.000Z"),
        })),
        nextToken: String(from + size),
      };
    }
    const sorted = [...state.objects].sort((a, b) =>
      a.key < b.key ? -1 : a.key > b.key ? 1 : 0,
    );
    let start = Number(params.continuationToken ?? 0);
    if (params.startAfter !== undefined) {
      const at = sorted.findIndex((o) => o.key > params.startAfter!);
      start = at === -1 ? sorted.length : at;
    }
    const objects = sorted.slice(start, start + size);
    const next = start + size;
    return {
      objects,
      nextToken: next < sorted.length ? String(next) : null,
    };
  }),
}));

const { sweepOrphans, readOrphanCursor, ORPHAN_LIST_PAGE, ORPHAN_PAGE_CAP } =
  await import("@/lib/lifecycle/sweeps/orphans");
const { captureWarning } = await import("@/lib/observability/sentry");

const NOW = new Date("2026-09-23T04:00:00.000Z");
const OLD = new Date("2026-09-01T00:00:00.000Z");

function passesAfter(n: number): Deadline {
  let asked = 0;
  return { at: 0, passed: () => asked++ >= n };
}

/** 1,200 media items, two objects each (2,400 objects over three pages); 50 items have no row. */
function fixture(jobRuns: Record<string, unknown>[] = []) {
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
  state.world = createCronWorld({ events: [event], media, job_runs: jobRuns });
  return state.world;
}

/** The key of item `n`'s `variant` in the fixture's one event. */
function keyOf(n: number, variant = "original.jpg"): string {
  return `events/${uuidOf("e", 1)}/photo/${uuidOf("m", n)}/${variant}`;
}

/** A finished purge run's row, the orphan sweep's tally nested in it as the route stores it. */
function purgeRun(
  minutesAgo: number,
  orphans: unknown,
  status = "ok",
): Record<string, unknown> {
  const at = new Date(NOW.getTime() - minutesAgo * 60_000).toISOString();
  return {
    id: uuidOf("r", minutesAgo),
    job: "purge_cron",
    status,
    started_at: at.replace("Z", "000+00:00"),
    counts: orphans === undefined ? { develop: { developed: 0 } } : { orphans },
  };
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
      resume_after: null, // the listing reached the end: the next run starts at the head
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
    expect(tally.stopped_note).toMatch(
      /carries on from where this one stopped/,
    );
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

describe("the orphan sweep's cursor", () => {
  it("carries on where the last run stopped, never from the top, and reaches every orphan once", async () => {
    const world = fixture();
    const first = await sweepOrphans(world.client, NOW, {
      deadline: passesAfter(1),
      resumeAfter: null,
    });
    expect(first.scanned_pages).toBe(1);
    expect(first.resume_after).toBe(lastListedKey(1));
    const firstDeleted = [...state.deleted];
    state.listCalls = [];
    const second = await sweepOrphans(world.client, NOW, {
      resumeAfter: first.resume_after as string,
    });
    expect(state.listCalls[0].startAfter).toBe(first.resume_after);
    expect(second.resume_after).toBeNull();
    expect(second.scanned_pages).toBe(2);
    const all = [...state.deleted];
    expect(new Set(all).size).toBe(all.length);
    expect(all).toHaveLength(100);
    expect(firstDeleted.length).toBeGreaterThan(0);
  });

  it("reaches an orphan past the first twenty pages: the next run lists on from the last", async () => {
    fixture();
    state.endless = true;
    const world = state.world!;
    const first = await sweepOrphans(world.client, NOW, { resumeAfter: null });
    expect(first.scanned_pages).toBe(ORPHAN_PAGE_CAP);
    const position = first.resume_after as string;
    expect(position).toBe(
      `events/${uuidOf("e", 9)}/photo/${uuidOf("y", ORPHAN_PAGE_CAP * ORPHAN_LIST_PAGE - 1)}/original.jpg`,
    );
    state.listCalls = [];
    await sweepOrphans(world.client, NOW, { resumeAfter: position });
    expect(state.listCalls[0].startAfter).toBe(position);
  });

  it("reads its own cursor from the purge's last run when the route passes none", async () => {
    const world = fixture([
      purgeRun(60 * 24, {
        scanned_pages: 1,
        resume_after: keyOf(299, "preview.webp"),
      }),
      purgeRun(60 * 48, { scanned_pages: 1, resume_after: keyOf(9) }),
    ]);
    await sweepOrphans(world.client, NOW);
    expect(state.listCalls[0].startAfter).toBe(keyOf(299, "preview.webp"));
  });

  it("keeps its cursor where the run began when the breaker trips", async () => {
    fixture();
    // Every row gone: the table is empty, so the breaker refuses the delete.
    const empty = createCronWorld({ events: [], media: [] });
    const start = keyOf(99, "preview.webp");
    const tally = await sweepOrphans(empty.client, NOW, {
      resumeAfter: start,
    });
    expect(tally.breaker_tripped).toBe(true);
    expect(tally.r2_deleted).toBe(0);
    expect(tally.resume_after).toBe(start);
  });
});

describe("readOrphanCursor", () => {
  it("takes the latest finished run that carried a position, past a night the sweep failed or was paused", async () => {
    const world = fixture([
      purgeRun(10, { error: true }, "error"),
      purgeRun(20, { skipped: "paused" }),
      purgeRun(30, undefined),
      purgeRun(40, { scanned_pages: 20, resume_after: keyOf(7) }),
      purgeRun(50, { scanned_pages: 20, resume_after: keyOf(3) }),
    ]);
    expect(await readOrphanCursor(world.client)).toBe(keyOf(7));
  });

  it("reads a pass that reached the end as the head", async () => {
    const world = fixture([
      purgeRun(10, { scanned_pages: 3, resume_after: null }),
      purgeRun(20, { scanned_pages: 20, resume_after: keyOf(7) }),
    ]);
    expect(await readOrphanCursor(world.client)).toBeNull();
  });

  it("reads a position that is not one as the head: it re-examines, it never skips", async () => {
    for (const bad of [
      42,
      "avatars/u/avatar.webp",
      "",
      `events/${"x".repeat(2000)}`,
    ]) {
      const world = fixture([purgeRun(10, { resume_after: bad })]);
      expect(await readOrphanCursor(world.client), String(bad)).toBeNull();
    }
  });

  it("reads no history as the head", async () => {
    const world = fixture();
    expect(await readOrphanCursor(world.client)).toBeNull();
  });

  it("never reads a running or skipped run's row, nor another job's", async () => {
    const world = fixture([
      { ...purgeRun(5, { resume_after: keyOf(1) }), status: "running" },
      { ...purgeRun(6, { resume_after: keyOf(2) }), status: "skipped" },
      { ...purgeRun(7, { resume_after: keyOf(3) }), job: "purge_orphans" },
      purgeRun(8, { resume_after: keyOf(4) }),
    ]);
    expect(await readOrphanCursor(world.client)).toBe(keyOf(4));
  });

  it("starts from the head, and says so, when its cursor cannot be read", async () => {
    const world = fixture([purgeRun(10, { resume_after: keyOf(7) })]);
    const unreadable = new Proxy(world.client, {
      get(target, prop, receiver) {
        if (prop !== "from") return Reflect.get(target, prop, receiver);
        return (table: string) => {
          if (table === "job_runs") throw new Error("job_runs unreachable");
          return target.from(table as never);
        };
      },
    });
    vi.mocked(captureWarning).mockClear();
    const tally = await sweepOrphans(unreadable, NOW);
    expect(state.listCalls[0].startAfter).toBeUndefined();
    expect(tally.r2_deleted).toBe(100);
    expect(vi.mocked(captureWarning)).toHaveBeenCalledWith(
      "cron",
      "sweep_cursor_unreadable",
      expect.objectContaining({ sweep: "orphans" }),
    );
  });
});

/** The last key the fixture's `page`th page (1-based) holds. */
function lastListedKey(page: number): string {
  const sorted = [...state.objects].map((o) => o.key).sort();
  return sorted[page * ORPHAN_LIST_PAGE - 1];
}
