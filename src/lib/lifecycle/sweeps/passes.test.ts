/**
 * SWEEPS 4 AND 6 ON THE CLAMPING FAKE (H13, M15): both pass candidate lists read whole past 1,000,
 * one failing account isolated from the rest, and a deadline that stops a sweep leaving a cursor the
 * next run resumes after, so every candidate gets its turn.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FakeRow } from "@/lib/db/testing/fake-postgrest";
import type { Deadline } from "@/lib/lifecycle/sweep-budget";
import {
  createCronWorld,
  everyRequestFits,
  uuidOf,
  type CronWorld,
} from "@/lib/lifecycle/testing/cron-fake";

const state = vi.hoisted(() => ({
  world: null as CronWorld | null,
  recomputed: [] as string[],
  failFor: new Set<string>(),
  sent: [] as { kind: string; dedupeKey: string }[],
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
vi.mock("@/lib/db/mutations/event-passes", () => ({
  recomputePassEntitlement: vi.fn(async (id: string) => {
    state.recomputed.push(id);
    if (state.failFor.has(id)) throw new Error("recompute read: boom");
    return id.endsWith("7") ? "updated" : "unchanged";
  }),
}));
vi.mock("@/lib/email/send", () => ({
  sendOnce: vi.fn(async (input: { kind: string; dedupeKey: string }) => {
    state.sent.push({ kind: input.kind, dedupeKey: input.dedupeKey });
    return true;
  }),
}));

const { readPassCandidates, sweepExpiredPasses, sweepRenewalNudges } =
  await import("@/lib/lifecycle/sweeps/passes");

const NOW = new Date("2026-09-23T04:00:00.000Z");

function passesAfter(n: number): Deadline {
  let asked = 0;
  return { at: 0, passed: () => asked++ >= n };
}

/** 1,300 labelled holders, and 1,400 unconsumed passes: 700 of theirs, 700 of 700 other profiles. */
function passWorld() {
  const profiles: FakeRow[] = [];
  for (let i = 0; i < 1_300; i++) {
    profiles.push({ id: uuidOf("p", i), tier: "event_pass", email: null });
  }
  for (let i = 0; i < 20; i++) {
    profiles.push({ id: uuidOf("f", i), tier: "free", email: null });
  }
  const passes: FakeRow[] = [];
  for (let i = 0; i < 700; i++) {
    passes.push({
      id: uuidOf("x", i),
      profile_id: uuidOf("p", i),
      consumed_at: null,
    });
    passes.push({
      id: uuidOf("y", i),
      profile_id: uuidOf("q", i),
      consumed_at: null,
    });
  }
  // A consumed pass is no candidate.
  passes.push({
    id: uuidOf("z", 1),
    profile_id: uuidOf("r", 1),
    consumed_at: "2026-09-01T00:00:00.000000+00:00",
  });
  const world = createCronWorld({
    profiles,
    event_passes: passes,
    events: [],
    media: [],
  });
  state.world = world;
  return world;
}

beforeEach(() => {
  state.world = null;
  state.recomputed = [];
  state.failFor = new Set();
  state.sent = [];
});

describe("expired_passes", () => {
  it("reads both candidate lists whole: 1,300 holders plus 700 more pass owners", async () => {
    const world = passWorld();
    const ids = await readPassCandidates(world.client);
    expect(ids).toHaveLength(2_000);
    expect(ids).not.toContain(uuidOf("r", 1));
    expect(everyRequestFits(world.fake)).toBe(true);
  });

  it("recomputes every candidate, and one failing account never stops the loop", async () => {
    const world = passWorld();
    state.failFor.add(uuidOf("p", 3));
    const tally = await sweepExpiredPasses(world.client, NOW);
    expect(state.recomputed).toHaveLength(2_000);
    expect(tally).toMatchObject({
      candidates: 2_000,
      recomputed: 1_999,
      rows_failed: 1,
      rows_not_attempted: 0,
    });
    expect(tally.rows_note).toMatch(/1 accounts failed/);
    expect(tally.stopped_early).toBeUndefined();
    expect(tally.resume_after).toBeUndefined();
  });

  it("stops at its deadline with a cursor, and the next run resumes after it", async () => {
    const world = passWorld();
    const first = await sweepExpiredPasses(world.client, NOW, {
      deadline: passesAfter(500),
    });
    expect(first).toMatchObject({ stopped_early: true, remaining: 1_500 });
    expect(state.recomputed).toHaveLength(500);
    const cursor = first.resume_after;
    expect(cursor).toBe(state.recomputed[499]);

    state.recomputed = [];
    const second = await sweepExpiredPasses(world.client, NOW, {
      resumeAfter: cursor,
    });
    expect(second.stopped_early).toBeUndefined();
    // The whole list again, starting right after the cursor.
    expect(state.recomputed).toHaveLength(2_000);
    expect(state.recomputed[0] > (cursor as string)).toBe(true);
  });
});

describe("renewal_nudges", () => {
  it("nudges every holder whose pass expires inside the window, past 1,000", async () => {
    const profiles: FakeRow[] = [];
    for (let i = 0; i < 2_100; i++) {
      profiles.push({
        id: uuidOf("p", i),
        tier: "event_pass",
        email: `holder${i}@example.com`,
        tier_expires_at: "2026-09-30T00:00:00.000000+00:00",
      });
    }
    // Outside the window: expired already, and far off.
    profiles.push({
      id: uuidOf("o", 1),
      tier: "event_pass",
      email: "a@example.com",
      tier_expires_at: "2026-09-01T00:00:00.000000+00:00",
    });
    profiles.push({
      id: uuidOf("o", 2),
      tier: "event_pass",
      email: "b@example.com",
      tier_expires_at: "2026-12-01T00:00:00.000000+00:00",
    });
    const world = createCronWorld({ profiles, events: [], media: [] });
    state.world = world;

    const tally = await sweepRenewalNudges(world.client, NOW);
    expect(tally).toMatchObject({
      eligible: 2_100,
      nudged: 2_100,
      rows_failed: 0,
    });
    expect(new Set(state.sent.map((s) => s.dedupeKey)).size).toBe(2_100);
    expect(everyRequestFits(world.fake)).toBe(true);
  });
});
