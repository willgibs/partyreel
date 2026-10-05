/**
 * SWEEP 7 ON THE CLAMPING FAKE (H11): 2,100 stale free events examined in keyset batches past 1,000,
 * the pre-filter dropping only events whose verdict is "none", a recent upload keeping an event, and
 * a deadline that stops the sweep leaving a cursor and a counted remainder the next run carries on.
 * And (crumbs-75) its kept removal notices retried first, under its deadline.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FakeRow } from "@/lib/db/testing/fake-postgrest";
import type { Deadline } from "@/lib/lifecycle/sweep-budget";
import {
  createCronWorld,
  everyRequestFits,
  mediaRow,
  uuidOf,
  type CronWorld,
} from "@/lib/lifecycle/testing/cron-fake";

const state = vi.hoisted(() => ({
  world: null as CronWorld | null,
  sent: [] as { kind: string; dedupeKey: string }[],
  /** What ran, in order: the retry, then the sweep's own sends. */
  order: [] as string[],
  retried: { notices_resent: 0, notices_failed: 0, notices_dropped: 0 },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: {}, serverEnv: {} }));
vi.mock("@/lib/site-url", () => ({
  getSiteUrl: async () => "https://partyreel.test",
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: vi.fn(),
  captureWarning: vi.fn(),
}));
vi.mock("@/lib/email/send", () => ({
  sendOnce: vi.fn(async (input: { kind: string; dedupeKey: string }) => {
    state.order.push("send");
    state.sent.push({ kind: input.kind, dedupeKey: input.dedupeKey });
    return true;
  }),
  retryParkedNotices: vi.fn(async () => {
    state.order.push("retry");
    return state.retried;
  }),
}));

const { retryParkedNotices } = await import("@/lib/email/send");

const { sweepInactiveFreeEvents } =
  await import("@/lib/lifecycle/sweeps/inactivity");

const NOW = new Date("2026-09-23T04:00:00.000Z");
const LONG_AGO = "2026-01-01T00:00:00.000000+00:00"; // past 180 days: remove
const WARN_AGE = "2026-04-01T00:00:00.000000+00:00"; // 175 days: warn
const RECENT = "2026-09-20T00:00:00.000000+00:00";

function passesAfter(n: number): Deadline {
  let asked = 0;
  return { at: 0, passed: () => asked++ >= n };
}

function event(
  id: string,
  stamp: string,
  host: { tier: string; last_active_at: string },
  over: Partial<FakeRow> = {},
): FakeRow {
  return {
    id,
    name: `Event ${id.slice(-4)}`,
    host_id: uuidOf("h", 1),
    created_at: stamp,
    updated_at: stamp,
    deleted_at: null,
    profiles: { email: "host@example.com", ...host },
    ...over,
  };
}

/**
 * 2,000 events to remove and 100 to warn, all of an idle free host; beside them an idle free host's
 * event with a recent upload (kept), an ACTIVE free host's old event, a Pro host's, a deleted one
 * and a recently touched one (none of them candidates).
 */
function fixture() {
  const idle = { tier: "free", last_active_at: LONG_AGO };
  const events: FakeRow[] = [
    ...Array.from({ length: 2_000 }, (_, i) =>
      event(uuidOf("r", i), LONG_AGO, idle),
    ),
    ...Array.from({ length: 100 }, (_, i) =>
      event(uuidOf("w", i), WARN_AGE, idle),
    ),
  ];
  const busy = event(uuidOf("k", 1), LONG_AGO, idle);
  const activeHost = event(uuidOf("k", 2), LONG_AGO, {
    tier: "free",
    last_active_at: RECENT,
  });
  const pro = event(uuidOf("k", 3), LONG_AGO, {
    tier: "pro",
    last_active_at: LONG_AGO,
  });
  const deleted = event(uuidOf("k", 4), LONG_AGO, idle, { deleted_at: RECENT });
  const touched = event(uuidOf("k", 5), RECENT, idle);
  events.push(busy, activeHost, pro, deleted, touched);
  const media = [mediaRow(uuidOf("m", 1), busy, { created_at: RECENT })];
  const world = createCronWorld({ events, media });
  state.world = world;
  return { world, busy, activeHost, pro, touched };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.world = null;
  state.sent = [];
  state.order = [];
  state.retried = { notices_resent: 0, notices_failed: 0, notices_dropped: 0 };
});

describe("sweepInactiveFreeEvents", () => {
  it("examines every stale free event past 1,000: removes, warns, and keeps the busy one", async () => {
    const { world, busy, activeHost, pro, touched } = fixture();
    const tally = await sweepInactiveFreeEvents(world.client, NOW);

    expect(tally).toMatchObject({
      // The pre-filter left out the active host's, the Pro host's, the deleted and the touched.
      candidates: 2_101,
      removed: 2_000,
      warned: 100,
      rows_failed: 0,
      rows_not_attempted: 0,
    });
    expect(tally.stopped_early).toBeUndefined();
    expect(tally.resume_after).toBeUndefined();

    const deletedNow = world.fake.tables.events.filter(
      (e) => e.deleted_at === NOW.toISOString(),
    );
    expect(deletedNow).toHaveLength(2_000);
    for (const kept of [busy, activeHost, pro, touched]) {
      expect(
        world.fake.tables.events.find((e) => e.id === kept.id)?.deleted_at,
      ).not.toBe(NOW.toISOString());
    }
    expect(
      state.sent.filter((s) => s.kind === "inactivity_removed"),
    ).toHaveLength(2_000);
    expect(
      state.sent.filter((s) => s.kind === "inactivity_warning"),
    ).toHaveLength(100);
    expect(everyRequestFits(world.fake)).toBe(true);
  });

  it("stops at its deadline with a cursor and a counted remainder, and the next run carries on", async () => {
    const { world } = fixture();
    // One ask before each batch and one before each event: 1,203 asks reach the busy event and
    // 1,200 to remove (the first batch is the busy event and 999 of them).
    const first = await sweepInactiveFreeEvents(world.client, NOW, {
      deadline: passesAfter(1_203),
    });
    expect(first.removed).toBe(1_200);
    expect(first.stopped_early).toBe(true);
    expect(first.resume_after).toBe(uuidOf("r", 1_199));
    // Candidates still standing after the cursor: 800 to remove and 100 to warn.
    expect(first.remaining).toBe(900);

    const second = await sweepInactiveFreeEvents(world.client, NOW, {
      resumeAfter: first.resume_after,
    });
    expect(second).toMatchObject({ removed: 800, warned: 100 });
    expect(second.stopped_early).toBeUndefined();
    expect(second.resume_after).toBeUndefined();
  });

  // ★ crumbs-75: the removal mail goes after the event has left the candidate list for good, so a send that failed
  // is kept and this sweep, its only sender, retries it, first, under its own switch and deadline.
  it("★ retries its kept removal notices first, under its deadline, and carries their tally without failing", async () => {
    const { world } = fixture();
    state.retried = {
      notices_resent: 2,
      notices_failed: 1,
      notices_dropped: 1,
    };
    const deadline = passesAfter(1_000_000);
    const tally = await sweepInactiveFreeEvents(world.client, NOW, {
      deadline,
    });

    expect(retryParkedNotices).toHaveBeenCalledTimes(1);
    const [args] = vi.mocked(retryParkedNotices).mock.calls[0];
    expect(args.kinds).toEqual(["inactivity_removed"]);
    expect(args.now).toBe(NOW);
    expect(typeof args.stopWhen).toBe("function");
    expect(state.order[0]).toBe("retry");
    // The retries' failures are the mail signal's: they ride the tally and fail no row.
    expect(tally).toMatchObject({
      notices_resent: 2,
      notices_failed: 1,
      notices_dropped: 1,
      rows_failed: 0,
    });
  });

  it("★ lets a kept removal notice go only while its event still sits in Deleted (never after she restored it)", async () => {
    const idle = { tier: "free", last_active_at: LONG_AGO };
    const removed = event(uuidOf("x", 1), LONG_AGO, idle, {
      deleted_at: RECENT,
    });
    // Back in her albums, and touched as she restored it (so tonight's sweep has nothing to say of it either).
    const restored = event(uuidOf("x", 2), RECENT, idle, {
      deleted_at: null,
    });
    const world = createCronWorld({ events: [removed, restored], media: [] });
    state.world = world;
    await sweepInactiveFreeEvents(world.client, NOW);

    const [args] = vi.mocked(retryParkedNotices).mock.calls[0];
    const ask = (dedupeKey: string) =>
      args.stillTrue?.({
        kind: "inactivity_removed",
        dedupeKey,
        profileId: uuidOf("h", 1),
      });
    expect(await ask(String(removed.id))).toBe(true);
    expect(await ask(String(restored.id))).toBe(false);
    // An event the purge has taken since is no more to tell of.
    expect(await ask(uuidOf("x", 3))).toBe(false);
    // An event that cannot be read is no answer: the retry keeps the notice and says so.
    delete (world.fake.tables as Record<string, unknown>).events;
    await expect(ask(String(removed.id))).rejects.toThrow(
      /a kept removal notice's event/,
    );
  });
});
