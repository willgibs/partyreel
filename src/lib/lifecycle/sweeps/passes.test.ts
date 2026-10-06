/**
 * SWEEPS 4 AND 6 ON THE CLAMPING FAKE (H13, M15): both pass candidate lists read whole past 1,000,
 * one failing account isolated from the rest, and a deadline that stops a sweep leaving a cursor the
 * next run resumes after, so every candidate gets its turn. ★ Only the owners of a pass live or ahead
 * (credit-watch): an expired pass alone never makes a candidate again, and a recompute left alone
 * because a credited checkout's Pro plan is seconds behind is tallied. And the renewal nudge's switch
 * (`emails` r1): a holder who turned Event Pass reminders off is never mailed, and an unreadable switch
 * stops the sweep before any send.
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
  /** Accounts the recompute answers Pro pending for (a credited checkout's plan seconds behind). */
  pending: new Set<string>(),
  sent: [] as { kind: string; dedupeKey: string; to: string; text: string }[],
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
    if (state.pending.has(id)) return "skipped_pro_pending";
    return id.endsWith("7") ? "updated" : "unchanged";
  }),
}));
vi.mock("@/lib/email/send", () => ({
  sendOnce: vi.fn(
    async (input: {
      kind: string;
      dedupeKey: string;
      to: string;
      text: string;
    }) => {
      state.sent.push({
        kind: input.kind,
        dedupeKey: input.dedupeKey,
        to: input.to,
        text: input.text,
      });
      return true;
    },
  ),
}));

const { readPassCandidates, sweepExpiredPasses, sweepRenewalNudges } =
  await import("@/lib/lifecycle/sweeps/passes");

const NOW = new Date("2026-09-23T04:00:00.000Z");

function passesAfter(n: number): Deadline {
  let asked = 0;
  return { at: 0, passed: () => asked++ >= n };
}

/** Live through the run's night, a renewal's year still ahead, and one that ended months ago. */
const LIVE_UNTIL = "2027-03-01T00:00:00.000000+00:00";
const AHEAD_UNTIL = "2028-03-01T00:00:00.000000+00:00";
const ENDED_AT = "2026-05-01T00:00:00.000000+00:00";

/**
 * 1,300 labelled holders, and 1,400 unconsumed passes live or ahead: 700 of theirs, 700 of 700 other profiles (half
 * of those a renewal's year still to open). And the passes that make no candidate: consumed, and 900 long expired,
 * each the only pass of a profile that left the label long ago.
 */
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
      expires_at: LIVE_UNTIL,
    });
    passes.push({
      id: uuidOf("y", i),
      profile_id: uuidOf("q", i),
      consumed_at: null,
      expires_at: i % 2 === 0 ? LIVE_UNTIL : AHEAD_UNTIL,
    });
  }
  // A consumed pass is no candidate.
  passes.push({
    id: uuidOf("z", 1),
    profile_id: uuidOf("r", 1),
    consumed_at: "2026-09-01T00:00:00.000000+00:00",
    expires_at: LIVE_UNTIL,
  });
  // ★ Nor is a long-expired one (credit-watch): it stays unconsumed for good, and its owner, Free since the night it
  // ended, was recomputed every night for good.
  for (let i = 0; i < 900; i++) {
    passes.push({
      id: uuidOf("e", i),
      profile_id: uuidOf("g", i),
      consumed_at: null,
      expires_at: ENDED_AT,
    });
  }
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
  state.pending = new Set();
  state.sent = [];
});

describe("expired_passes", () => {
  it("reads both candidate lists whole: 1,300 holders plus 700 more owners of a pass live or ahead", async () => {
    const world = passWorld();
    const ids = await readPassCandidates(world.client, NOW);
    expect(ids).toHaveLength(2_000);
    expect(ids).not.toContain(uuidOf("r", 1));
    expect(everyRequestFits(world.fake)).toBe(true);
  });

  it("★ never the owner of long-expired passes alone, nor a pass that ended at the run's instant: the label carries the one recompute an expiry needs", async () => {
    const world = passWorld();
    // A pass ending exactly at the run's instant is spent (a window is live while start <= now < end).
    world.fake.tables.event_passes.push({
      id: uuidOf("e", 950),
      profile_id: uuidOf("g", 950),
      consumed_at: null,
      expires_at: "2026-09-23T04:00:00.000000+00:00",
    });
    // A labelled holder whose every pass ended: her label still makes her a candidate, for the move to Free.
    world.fake.tables.profiles.push({
      id: uuidOf("g", 1),
      tier: "event_pass",
      email: null,
    });
    const ids = await readPassCandidates(world.client, NOW);
    expect(ids).toHaveLength(2_001);
    expect(ids).toContain(uuidOf("g", 1));
    for (const i of [0, 2, 899, 950]) expect(ids).not.toContain(uuidOf("g", i));
    // The renewal's year still to open keeps its owner (a lapsed label comes back once it opens).
    expect(ids).toContain(uuidOf("q", 1));
    // The read asked the table for the passes live or ahead, not every unconsumed one.
    const read = world.fake.requests.filter((r) => r.name === "event_passes");
    expect(read.length).toBeGreaterThan(0);
    for (const request of read) {
      expect(request.filters).toContainEqual({
        column: "expires_at",
        op: "gt",
        value: NOW.toISOString(),
      });
    }
  });

  it("★ tallies the accounts left alone because a credited checkout's Pro plan is seconds behind", async () => {
    const world = passWorld();
    state.pending.add(uuidOf("p", 4));
    state.pending.add(uuidOf("q", 9));
    const tally = await sweepExpiredPasses(world.client, NOW);
    expect(tally).toMatchObject({
      candidates: 2_000,
      recomputed: 2_000,
      pro_pending: 2,
      rows_failed: 0,
    });
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
    const world = createCronWorld({
      profiles,
      notification_prefs: [],
      events: [],
      media: [],
    });
    state.world = world;

    const tally = await sweepRenewalNudges(world.client, NOW);
    expect(tally).toMatchObject({
      eligible: 2_100,
      nudged: 2_100,
      opted_out: 0,
      rows_failed: 0,
    });
    expect(new Set(state.sent.map((s) => s.dedupeKey)).size).toBe(2_100);
    // The switches are read in chunks too: 2,100 ids never ride one URL.
    expect(
      world.fake.requests.filter((r) => r.name === "notification_prefs").length,
    ).toBeGreaterThan(1);
    expect(everyRequestFits(world.fake)).toBe(true);
  });

  /** Three holders in the window: one with no row, one who left reminders on, one who turned them off. */
  function switchWorld(prefs: FakeRow[] | undefined) {
    const holder = (i: number): FakeRow => ({
      id: uuidOf("h", i),
      tier: "event_pass",
      email: `holder${i}@example.com`,
      tier_expires_at: "2026-09-30T00:00:00.000000+00:00",
    });
    const tables: Record<string, FakeRow[]> = {
      profiles: [holder(1), holder(2), holder(3)],
      events: [],
      media: [],
    };
    if (prefs) tables.notification_prefs = prefs;
    const world = createCronWorld(tables);
    state.world = world;
    return world;
  }

  it("never mails a holder who turned Event Pass reminders off, and counts them", async () => {
    const world = switchWorld([
      {
        user_id: uuidOf("h", 2),
        notify_pass_renewal: true,
        marketing_opt_in: false,
      },
      {
        user_id: uuidOf("h", 3),
        notify_pass_renewal: false,
        marketing_opt_in: true,
      },
    ]);
    const tally = await sweepRenewalNudges(world.client, NOW);
    expect(tally).toMatchObject({ eligible: 3, nudged: 2, opted_out: 1 });
    // No row is the default (on), exactly as the /account card shows it.
    expect(state.sent.map((s) => s.to).sort()).toEqual([
      "holder1@example.com",
      "holder2@example.com",
    ]);
  });

  it("stops before any send when the switches cannot be read", async () => {
    const world = switchWorld(undefined); // the table answers PGRST205, as a failed read would
    await expect(sweepRenewalNudges(world.client, NOW)).rejects.toThrow(
      /pass reminder switches/,
    );
    expect(state.sent).toEqual([]);
  });

  it("the mail's button starts the renewal and its foot lands on the switch", async () => {
    const world = switchWorld([]);
    await sweepRenewalNudges(world.client, NOW);
    expect(state.sent).toHaveLength(3);
    for (const mail of state.sent) {
      expect(mail.text).toContain(
        "Renew Event Pass: https://partyreel.test/account/renew",
      );
      expect(mail.text).toContain(
        "Unsubscribe from Event Pass reminders: https://partyreel.test/account#event-pass-reminders",
      );
    }
  });
});
