/**
 * SWEEP 5 ON THE CLAMPING FAKE (H9, H10): 1,300 candidates read whole, each account's active bytes
 * from the one aggregate (`host_storage_summary`), the auto-reduce candidates read largest first past
 * 1,000 and the soft-remove chunked inside the URL budget, and a deadline that leaves a resume cursor.
 *
 * ★ AND THE REDUCE PAGED UNDER THE DEADLINE (crumbs-37): it reads a lapsed host's active set largest first a
 * page at a time and stops reading once what is left fits; a deadline that passes between its pages stops it
 * there, the grace kept and no mail sent, and the next run starts AT that account and finishes it.
 *
 * ★ AND THE CANDIDATES EXACT (crumbs-75): one SQL read a page (`over_capacity_candidates`, answered here over the
 * world's own tables as its SQL answers: a grace standing, or a meter past her own line and what she keeps past it
 * too) hands over exactly the accounts there is something to do for, each with her summary, so no account costs a
 * call of its own; and the sweep's two one-time notices a send failed on are retried first.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { defaultCapForTier, toBillingTier } from "@/lib/constants/tiers";
import type { FakeRow } from "@/lib/db/testing/fake-postgrest";
import type { Deadline } from "@/lib/lifecycle/sweep-budget";
import {
  createCronWorld,
  eventRow,
  everyRequestFits,
  mediaRow,
  uuidOf,
  type CronWorld,
} from "@/lib/lifecycle/testing/cron-fake";

const state = vi.hoisted(() => ({
  world: null as CronWorld | null,
  sent: [] as { kind: string; profileId?: string }[],
  retried: { notices_resent: 0, notices_failed: 0, notices_dropped: 0 },
  /** Every candidate read's arguments, in order. */
  candidateArgs: [] as { p_after: unknown; p_limit: unknown }[],
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
vi.mock("@/lib/supabase/request-auth", () => ({ getRequestAuth: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => state.world!.client,
}));
vi.mock("@/lib/email/send", () => ({
  sendOnce: vi.fn(async (input: { kind: string; profileId?: string }) => {
    state.sent.push({ kind: input.kind, profileId: input.profileId });
    return true;
  }),
  retryParkedNotices: vi.fn(async () => state.retried),
}));

const { retryParkedNotices, sendOnce } = await import("@/lib/email/send");
const { CANDIDATE_PAGE, graceNoticeStillTrue, sweepOverCapacity } =
  await import("@/lib/lifecycle/sweeps/over-capacity");
type OverCapCandidate =
  import("@/lib/lifecycle/sweeps/over-capacity").OverCapCandidate;

const NOW = new Date("2026-09-23T04:00:00.000Z");
const MB = 1024 ** 2;
const GB = 1024 ** 3;
const CAP = 10_000; // an explicit cap, so a few thousand bytes is "over"
/** A grace far from its deadline (and from its reminder): an account in it is examined and left be. */
const FAR_GRACE = "2026-12-30T00:00:00.000000+00:00";

function passesAfter(n: number): Deadline {
  let asked = 0;
  return { at: 0, passed: () => asked++ >= n };
}

/**
 * `over_capacity_candidates` (20261005060000) over the world's own tables, as its SQL answers: a grace standing, or a
 * meter past her own write line (her cap, else her tier's default, plus a tenth) AND what she keeps past it too, each
 * with the summary she was judged on; keyset on id, `p_limit` clamped to 1,000. The SQL itself is proved live by the
 * migration's rolled-back check; this lets the sweep's paging and every branch run whole on the fake.
 */
function withCandidates(world: CronWorld): CronWorld {
  const summary = world.fake.functions.host_storage_summary;
  state.candidateArgs = [];
  world.fake.functions.over_capacity_candidates = (args) => {
    state.candidateArgs.push({ p_after: args.p_after, p_limit: args.p_limit });
    const after = (args.p_after as string | null) ?? null;
    const limit =
      args.p_limit == null ? null : Math.min(Number(args.p_limit), 1_000);
    const out: FakeRow[] = [];
    const profiles = [...(world.fake.tables.profiles ?? [])].sort((a, b) =>
      String(a.id) < String(b.id) ? -1 : 1,
    );
    for (const p of profiles) {
      if (limit !== null && out.length >= limit) break;
      if (after !== null && String(p.id) <= after) continue;
      const cap =
        p.storage_cap_bytes == null
          ? defaultCapForTier(toBillingTier(String(p.tier)))
          : Number(p.storage_cap_bytes);
      const grace = p.storage_grace_until != null;
      const line = cap === null ? null : cap + Math.floor(cap / 10);
      if (!grace && (line === null || Number(p.storage_used_bytes) <= line)) {
        continue;
      }
      const [s] = summary({ p_host_id: p.id }) as FakeRow[];
      const kept =
        Number(s.active_bytes) +
        Number(s.standby_bytes) -
        Number(s.system_bytes);
      if (!grace && kept <= (line as number)) continue;
      out.push({
        id: p.id,
        email: p.email,
        tier: p.tier,
        storage_cap_bytes: p.storage_cap_bytes,
        storage_grace_until: p.storage_grace_until,
        active_bytes: s.active_bytes,
        deleted_bytes: s.standby_bytes,
        system_bytes: s.system_bytes,
      });
    }
    return out;
  };
  return world;
}

/** The candidate read's requests, in order, as the fake saw them. */
const candidateRequests = (world: CronWorld) =>
  world.fake.requests.filter(
    (r) => r.target === "rpc" && r.name === "over_capacity_candidates",
  );

function account(id: string, over: Partial<FakeRow> = {}): FakeRow {
  return {
    id,
    email: `${id}@example.com`,
    tier: "pro",
    storage_cap_bytes: CAP,
    storage_used_bytes: 3 * GB,
    storage_grace_until: null,
    ...over,
  };
}

/**
 * 1,295 candidates in a grace far from its end, each keeping past her line (examined, and left be), plus four that
 * each take one branch: over with no grace, under with a grace to clear, past their grace with 2,500 active items,
 * and inside the reminder window. Twenty accounts whose meter passes their line while they keep nothing are no
 * candidates at all: the summary decides, never the meter alone.
 */
function fixture() {
  const profiles: FakeRow[] = [];
  const events: FakeRow[] = [];
  const media: FakeRow[] = [];
  for (let i = 0; i < 1_295; i++) {
    const host = account(uuidOf("a", i), { storage_grace_until: FAR_GRACE });
    const event = eventRow(uuidOf("ea", i), String(host.id));
    profiles.push(host);
    events.push(event);
    media.push(mediaRow(uuidOf("ma", i), event, { file_size_bytes: 2 * CAP }));
  }
  for (let i = 0; i < 20; i++) {
    profiles.push(account(uuidOf("s", i), { storage_used_bytes: 50 * MB }));
  }
  const opens = account(uuidOf("b", 1));
  const clears = account(uuidOf("b", 2), {
    storage_grace_until: "2026-10-30T00:00:00.000000+00:00",
  });
  const reduces = account(uuidOf("b", 3), {
    storage_grace_until: "2026-09-20T00:00:00.000000+00:00",
  });
  const reminded = account(uuidOf("b", 4), {
    storage_grace_until: "2026-09-26T00:00:00.000000+00:00",
  });
  profiles.push(opens, clears, reduces, reminded);

  const branchEvents = [
    eventRow(uuidOf("e", 1), String(opens.id)),
    eventRow(uuidOf("e", 3), String(reduces.id)),
    eventRow(uuidOf("e", 4), String(reminded.id)),
  ];
  events.push(...branchEvents);
  media.push(
    ...Array.from({ length: 20 }, (_, i) =>
      mediaRow(uuidOf("mo", i), branchEvents[0], { file_size_bytes: 1_000 }),
    ),
    // 2,500 active items: the reduce must see all of them to choose largest-first.
    ...Array.from({ length: 2_500 }, (_, i) =>
      mediaRow(uuidOf("mr", i), branchEvents[1], {
        file_size_bytes: 1_000 + (i % 7),
      }),
    ),
    ...Array.from({ length: 20 }, (_, i) =>
      mediaRow(uuidOf("mm", i), branchEvents[2], { file_size_bytes: 1_000 }),
    ),
  );
  const world = withCandidates(createCronWorld({ profiles, events, media }));
  state.world = world;
  return { world, opens, clears, reduces, reminded };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.world = null;
  state.sent = [];
  state.retried = { notices_resent: 0, notices_failed: 0, notices_dropped: 0 };
});

describe("sweepOverCapacity", () => {
  it("examines every candidate past 1,000 and takes each branch on the aggregate's bytes", async () => {
    const { world, opens, clears, reduces, reminded } = fixture();
    const tally = await sweepOverCapacity(world.client, NOW);

    expect(tally).toMatchObject({
      candidates: 1_299,
      grace_opened: 1,
      cleared: 1,
      reduced: 1,
      reminded: 1,
      rows_failed: 0,
      rows_not_attempted: 0,
    });
    expect(tally.stopped_early).toBeUndefined();

    const byId = new Map(world.fake.tables.profiles.map((p) => [p.id, p]));
    expect(byId.get(opens.id)?.storage_grace_until).toBeTruthy();
    expect(byId.get(clears.id)?.storage_grace_until).toBeNull();
    expect(byId.get(reduces.id)?.storage_grace_until).toBeNull();
    expect(byId.get(reminded.id)?.storage_grace_until).toBe(
      "2026-09-26T00:00:00.000000+00:00",
    );
    expect(state.sent.map((s) => s.kind).sort()).toEqual(
      ["over_cap_grace_start", "over_cap_reduced", "over_cap_reminder"].sort(),
    );

    // ★ crumbs-75: the candidates came in pages of CANDIDATE_PAGE, past 1,000, each page after the last one's id,
    // and no account cost a summary call of its own.
    const calls = state.candidateArgs;
    expect(calls).toHaveLength(Math.ceil(1_299 / CANDIDATE_PAGE));
    expect(candidateRequests(world)).toHaveLength(calls.length);
    expect(calls.every((c) => c.p_limit === CANDIDATE_PAGE)).toBe(true);
    expect(calls[0].p_after).toBeNull();
    expect(calls[1].p_after).toBe(uuidOf("a", CANDIDATE_PAGE - 1));
    expect(
      world.fake.requests.filter((r) => r.name === "host_storage_summary"),
    ).toHaveLength(0);
  });

  // ★ RESHAPED ON PURPOSE (crumbs-37; scar kept: the choice is over the whole active set, largest first, and
  // every write fits the URL). The expired reason: the reduce no longer READS the whole set first; it reads it
  // largest first a page at a time, which chooses the same items.
  it("auto-reduces across the whole active set, largest first, in chunks that fit the URL", async () => {
    const { world, reduces } = fixture();
    await sweepOverCapacity(world.client, NOW);

    const active = world.fake.tables.media.filter(
      (m) =>
        (m.events as FakeRow).host_id === reduces.id && m.status !== "removed",
    );
    const removed = world.fake.tables.media.filter(
      (m) =>
        (m.events as FakeRow).host_id === reduces.id && m.status === "removed",
    );
    // What is left fits under the cap, and nothing more than needed was removed.
    const activeBytes = active.reduce(
      (s, m) => s + Number(m.file_size_bytes),
      0,
    );
    expect(activeBytes).toBeLessThanOrEqual(CAP);
    expect(activeBytes).toBeGreaterThan(CAP - 1_007);
    expect(removed.length).toBeGreaterThan(2_480);
    expect(removed.every((m) => m.removed_by_system === true)).toBe(true);
    // The largest were the ones removed: every survivor is no bigger than any removed item.
    const smallestRemoved = Math.min(
      ...removed.map((m) => Number(m.file_size_bytes)),
    );
    expect(
      active.every((m) => Number(m.file_size_bytes) <= smallestRemoved),
    ).toBe(true);

    const writes = world.fake.requests.filter(
      (r) => r.name === "media" && r.method === "PATCH",
    );
    expect(writes.length).toBeGreaterThan(15);
    expect(everyRequestFits(world.fake)).toBe(true);
  });

  it("stops at its deadline with a cursor, and resumes after it", async () => {
    const { world } = fixture();
    const first = await sweepOverCapacity(world.client, NOW, {
      deadline: passesAfter(300),
    });
    expect(first).toMatchObject({ stopped_early: true, remaining: 999 });
    expect(first.resume_after).toBe(uuidOf("a", 299));
    // Nothing of the four the first run never reached was touched.
    expect(state.sent).toEqual([]);

    // ★ RESHAPED ON PURPOSE (crumbs-75; scar kept: the next run resumes after the cursor and examines every
    // candidate in turn). The expired reason: each account was counted by its own summary call, and the summaries
    // now arrive with the candidates; the deadline's own asks count the accounts examined instead.
    let asked = 0;
    const counting: Deadline = { at: 0, passed: () => (asked++, false) };
    const second = await sweepOverCapacity(world.client, NOW, {
      resumeAfter: first.resume_after,
      deadline: counting,
    });
    expect(second).toMatchObject({ candidates: 1_299, reduced: 1 });
    expect(second.stopped_early).toBeUndefined();
    expect(second.resume_after).toBeUndefined();
    // One ask before each of the 1,299 accounts, plus one before each page of the one reduce (three pages).
    expect(asked).toBe(1_299 + 3);
  });

  it("★ reads only the pages it needs: a reduce its first page settles reads one page of a 2,500-item set", async () => {
    const lapsed = account(uuidOf("p", 1), {
      storage_grace_until: "2026-09-20T00:00:00.000000+00:00",
    });
    const event = eventRow(uuidOf("e", 7), String(lapsed.id));
    // Five 1 MB items over 2,495 of a kilobyte (7.5 MB, past a 3 MB cap and its write headroom): the five
    // removals bring it under, and they are the first page's first five.
    const media = [
      ...Array.from({ length: 5 }, (_, i) =>
        mediaRow(uuidOf("pb", i), event, { file_size_bytes: 1_000_000 }),
      ),
      ...Array.from({ length: 2_495 }, (_, i) =>
        mediaRow(uuidOf("ps", i), event, { file_size_bytes: 1_000 }),
      ),
    ];
    lapsed.storage_cap_bytes = 3_000_000;
    const world = withCandidates(
      createCronWorld({
        profiles: [lapsed],
        events: [event],
        media,
      }),
    );
    state.world = world;

    const tally = await sweepOverCapacity(world.client, NOW);

    expect(tally).toMatchObject({ reduced: 1, items_reduced: 5 });
    const removed = world.fake.tables.media.filter(
      (m) => m.status === "removed",
    );
    expect(removed.map((m) => m.id).sort()).toEqual(
      Array.from({ length: 5 }, (_, i) => uuidOf("pb", i)),
    );
    // One page of the active set, never the three a whole read takes.
    const reads = world.fake.requests.filter(
      (r) => r.name === "media" && r.method === "GET",
    );
    expect(reads).toHaveLength(1);
    expect(state.sent.map((s) => s.kind)).toEqual(["over_cap_reduced"]);
  });

  it("★ a deadline between its pages stops the reduce there: grace kept, no mail, the account left, and the next run starts AT it and finishes", async () => {
    // Two quiet candidates before it and one after, so the cursor has somewhere to point: each keeps past her line in
    // a grace far from its end, so the sweep examines her and leaves her be.
    const quietEvents: FakeRow[] = [];
    const quietMedia: FakeRow[] = [];
    const quiet = (prefix: string) => {
      const host = account(uuidOf(prefix, 1), {
        storage_grace_until: FAR_GRACE,
      });
      const event = eventRow(uuidOf(`e${prefix}`, 1), String(host.id));
      quietEvents.push(event);
      quietMedia.push(
        mediaRow(uuidOf(`m${prefix}`, 1), event, { file_size_bytes: 2 * CAP }),
      );
      return host;
    };
    const q1 = quiet("q");
    const q2 = quiet("qq");
    const lapsed = account(uuidOf("r", 1), {
      storage_grace_until: "2026-09-20T00:00:00.000000+00:00",
    });
    const after = quiet("t");
    const event = eventRow(uuidOf("e", 8), String(lapsed.id));
    const media = Array.from({ length: 2_500 }, (_, i) =>
      mediaRow(uuidOf("rm", i), event, { file_size_bytes: 1_000 + (i % 7) }),
    );
    const world = withCandidates(
      createCronWorld({
        profiles: [q1, q2, lapsed, after],
        events: [...quietEvents, event],
        media: [...quietMedia, ...media],
      }),
    );
    state.world = world;
    // r1's own items (the quiet candidates' are not hers).
    const hers = () =>
      world.fake.tables.media.filter((m) => m.event_id === event.id);
    const active = () => hers().filter((m) => m.status !== "removed");

    // Asked before each account (q1, q2, r1), then before each page of r1's reduce: the second page is refused.
    const first = await sweepOverCapacity(world.client, NOW, {
      deadline: passesAfter(4),
    });
    expect(first).toMatchObject({
      reduced: 0,
      items_reduced: 1_000,
      stopped_early: true,
      // r1 part way, and t1 never reached.
      remaining: 2,
      // The candidate before r1: the next run starts AT it.
      resume_after: q2.id,
    });
    expect(active()).toHaveLength(1_500);
    expect(
      world.fake.tables.profiles.find((p) => p.id === lapsed.id)
        ?.storage_grace_until,
    ).toBe("2026-09-20T00:00:00.000000+00:00");
    expect(state.sent).toEqual([]);

    const second = await sweepOverCapacity(world.client, NOW, {
      resumeAfter: first.resume_after,
    });
    expect(second.reduced).toBe(1);
    expect(second.stopped_early).toBeUndefined();
    expect(second.resume_after).toBeUndefined();
    const left = active().reduce((s, m) => s + Number(m.file_size_bytes), 0);
    expect(left).toBeLessThanOrEqual(CAP);
    expect(left).toBeGreaterThan(CAP - 1_007);
    expect(
      world.fake.tables.profiles.find((p) => p.id === lapsed.id)
        ?.storage_grace_until,
    ).toBeNull();
    expect(state.sent.map((s) => s.kind)).toEqual(["over_cap_reduced"]);
    // Across the two runs, exactly the whole-set choice: every survivor no bigger than any removed item.
    const removed = hers().filter((m) => m.status === "removed");
    const smallestRemoved = Math.min(
      ...removed.map((m) => Number(m.file_size_bytes)),
    );
    expect(
      active().every((m) => Number(m.file_size_bytes) <= smallestRemoved),
    ).toBe(true);
    // The quiet candidates were examined and left be, in both runs.
    expect(
      world.fake.tables.media.filter(
        (m) => m.event_id !== event.id && m.status === "removed",
      ),
    ).toEqual([]);
  });

  // The free/pro shift (2026-09-28): the floor was a typed 2 GB, Free's old cap. At Free's 100 MB a
  // host who cancels Pro storing 1 GB sat under that literal: never a candidate, so no grace, no
  // email and no reduce, and a free account kept ten times its room for good.
  it("opens a grace window for a lapsed host between Free's cap and the old 2 GB floor", async () => {
    const lapsed = account(uuidOf("f", 1), {
      tier: "free",
      storage_cap_bytes: null, // the webhook's downgrade: Free's tiers.ts default applies
      storage_used_bytes: GB,
    });
    const event = eventRow(uuidOf("e", 9), String(lapsed.id));
    const world = withCandidates(
      createCronWorld({
        profiles: [lapsed],
        events: [event],
        media: [mediaRow(uuidOf("mf", 1), event, { file_size_bytes: GB })],
      }),
    );
    state.world = world;

    const tally = await sweepOverCapacity(world.client, NOW);
    expect(tally).toMatchObject({ candidates: 1, grace_opened: 1 });
    expect(world.fake.tables.profiles[0].storage_grace_until).toBeTruthy();
    expect(state.sent.map((s) => s.kind)).toEqual(["over_cap_grace_start"]);
  });

  // ★ crumbs-75: every paying host stores past Free's 100 MB, so the old floor made every one a candidate, each with a
  // summary call of its own, and past a few hundred a night's share reached only some. The read now answers exactly
  // the accounts there is something to do for.
  it("★ reads exactly the accounts there is something to do for, and no account costs a call of its own", async () => {
    const profiles: FakeRow[] = [];
    const events: FakeRow[] = [];
    const media: FakeRow[] = [];
    const host = (
      prefix: string,
      over: Partial<FakeRow>,
      bytes: number | null,
    ) => {
      const p = account(uuidOf(prefix, 1), over);
      profiles.push(p);
      if (bytes !== null) {
        const e = eventRow(uuidOf(`e${prefix}`, 1), String(p.id));
        events.push(e);
        media.push(
          mediaRow(uuidOf(`m${prefix}`, 1), e, { file_size_bytes: bytes }),
        );
      }
      return p;
    };
    // 300 paying hosts well inside their plan, each storing far past Free's 100 MB: the old floor's candidates.
    for (let i = 0; i < 300; i++) {
      const p = account(uuidOf("pa", i), { storage_cap_bytes: 50 * GB });
      const e = eventRow(uuidOf("epa", i), String(p.id));
      profiles.push(p);
      events.push(e);
      media.push(mediaRow(uuidOf("mpa", i), e, { file_size_bytes: 200 * MB }));
    }
    const over = host("ov", {}, 2 * CAP);
    // Inside the tenth over her cap: exactly where the product admits uploads, never a candidate.
    host("hd", {}, CAP + CAP / 10);
    const inGrace = host("gr", { storage_grace_until: FAR_GRACE }, null);
    // A meter far past a tiny cap with nothing kept: the summary decides, never the meter alone.
    host("mt", { storage_cap_bytes: 1, storage_used_bytes: 10 * GB }, null);
    // Pro with no cap on record yet: unlimited, never over.
    host("ul", { storage_cap_bytes: null }, 10 * GB);
    // A downgrade to Free keeps her plan's default cap.
    const freed = host(
      "fr",
      { tier: "free", storage_cap_bytes: null },
      200 * MB,
    );
    const world = withCandidates(createCronWorld({ profiles, events, media }));
    state.world = world;

    const tally = await sweepOverCapacity(world.client, NOW);
    expect(tally).toMatchObject({
      candidates: 3,
      grace_opened: 2,
      cleared: 1,
      rows_failed: 0,
    });
    const byId = new Map(world.fake.tables.profiles.map((p) => [p.id, p]));
    expect(byId.get(over.id)?.storage_grace_until).toBeTruthy();
    expect(byId.get(freed.id)?.storage_grace_until).toBeTruthy();
    expect(byId.get(inGrace.id)?.storage_grace_until).toBeNull();
    expect(state.sent.map((s) => s.profileId).sort()).toEqual(
      [over.id, freed.id].sort(),
    );
    // One read, and no summary call of the sweep's own for any of the 306 accounts.
    expect(candidateRequests(world)).toHaveLength(1);
    expect(
      world.fake.requests.filter((r) => r.name === "host_storage_summary"),
    ).toHaveLength(0);
  });

  // ★ crumbs-75: the grace's start and the reduce are mailed after the state moved, so a send that failed is kept and
  // this sweep, their only sender, retries them before any mail of its own, under its own switch and deadline.
  it("★ retries its two kept notices before its own mail, under its deadline, and carries their tally without failing", async () => {
    const { world } = fixture();
    state.retried = {
      notices_resent: 1,
      notices_failed: 2,
      notices_dropped: 0,
    };
    const tally = await sweepOverCapacity(world.client, NOW);

    expect(retryParkedNotices).toHaveBeenCalledTimes(1);
    const [args] = vi.mocked(retryParkedNotices).mock.calls[0];
    expect(args.kinds).toEqual(["over_cap_grace_start", "over_cap_reduced"]);
    expect(args.now).toBe(NOW);
    expect(typeof args.stopWhen).toBe("function");
    // Before any of the run's own mail.
    expect(
      vi.mocked(retryParkedNotices).mock.invocationCallOrder[0],
    ).toBeLessThan(Math.min(...vi.mocked(sendOnce).mock.invocationCallOrder));
    expect(tally).toMatchObject({
      notices_resent: 1,
      notices_failed: 2,
      notices_dropped: 0,
      rows_failed: 0,
    });
  });

  // ★ A late grace-start must still be so: "you are over your plan" to a host who upgraded the day after is a wrong
  // mail. The retry asks this run's own candidate read, before the run clears what it clears.
  it("★ announces a kept grace's start only while that very grace stands and she still keeps past her line", async () => {
    const { world, reminded, clears, opens } = fixture();
    await sweepOverCapacity(world.client, NOW);
    const [args] = vi.mocked(retryParkedNotices).mock.calls[0];
    const ask = (
      kind: Parameters<NonNullable<typeof args.stillTrue>>[0]["kind"],
      profileId: unknown,
      at: string,
    ) =>
      args.stillTrue?.({
        kind,
        dedupeKey: `${String(profileId)}:${new Date(at).toISOString()}`,
        profileId: String(profileId),
      });
    // In a grace and keeping 20,000 past an 11,000 line: still so.
    expect(
      await ask(
        "over_cap_grace_start",
        reminded.id,
        "2026-09-26T00:00:00.000000+00:00",
      ),
    ).toBe(true);
    // A grace other than the one announced (a later one opened since): not this notice's.
    expect(
      await ask(
        "over_cap_grace_start",
        reminded.id,
        "2026-09-27T00:00:00.000000+00:00",
      ),
    ).toBe(false);
    // In a grace but keeping nothing (she freed room for good; this run clears it): no longer so.
    expect(
      await ask(
        "over_cap_grace_start",
        clears.id,
        "2026-10-30T00:00:00.000000+00:00",
      ),
    ).toBe(false);
    // No grace on the read at all (this run's read came before it opened one): nothing to announce late.
    expect(
      await ask("over_cap_grace_start", opens.id, "2026-11-07T04:00:00.000Z"),
    ).toBe(false);
    // The reduce's notice says what was done, so it always goes.
    expect(
      await ask(
        "over_cap_reduced",
        clears.id,
        "2026-10-30T00:00:00.000000+00:00",
      ),
    ).toBe(true);
  });
});

describe("graceNoticeStillTrue", () => {
  const G = "2026-10-30T04:00:00.123+00:00";
  const host = (over: Partial<OverCapCandidate>): OverCapCandidate => ({
    id: "11111111-1111-4111-8111-111111111111",
    email: "h@example.com",
    tier: "pro",
    storage_cap_bytes: CAP,
    storage_grace_until: G,
    active_bytes: 2 * CAP,
    deleted_bytes: 0,
    system_bytes: 0,
    ...over,
  });
  const key = (c: OverCapCandidate, at = G) => ({
    dedupeKey: `${c.id}:${new Date(at).toISOString()}`,
    profileId: c.id,
  });

  it("reads the grace it announced to the millisecond, as the sweep keyed it", () => {
    const c = host({});
    expect(graceNoticeStillTrue(key(c), [c])).toBe(true);
    expect(graceNoticeStillTrue(key(c, "2026-10-30T04:00:00.124Z"), [c])).toBe(
      false,
    );
  });

  it("judges what she keeps, the reduce's own removals left out, against her write line", () => {
    // 11,000 of her own on a 10,000 cap: inside the tenth, so no longer over.
    expect(
      graceNoticeStillTrue(key(host({ active_bytes: 11_000 })), [
        host({ active_bytes: 11_000 }),
      ]),
    ).toBe(false);
    // Over only by the system's removals: not hers to be told about.
    const reduced = host({
      active_bytes: 9_000,
      deleted_bytes: 5_000,
      system_bytes: 5_000,
    });
    expect(graceNoticeStillTrue(key(reduced), [reduced])).toBe(false);
    // Her own Deleted counts.
    const deleted = host({ active_bytes: 9_000, deleted_bytes: 5_000 });
    expect(graceNoticeStillTrue(key(deleted), [deleted])).toBe(true);
  });

  it("never announces a grace that cleared, an unlimited plan, or an account not on the read", () => {
    const c = host({});
    expect(
      graceNoticeStillTrue(key(c), [host({ storage_grace_until: null })]),
    ).toBe(false);
    expect(
      graceNoticeStillTrue(key(c), [host({ storage_cap_bytes: null })]),
    ).toBe(false);
    expect(graceNoticeStillTrue(key(c), [])).toBe(false);
  });
});

/**
 * ★ DELETED COUNTS (trash-in-storage, Will 2026-10-03): the grace reads what she keeps by choice, her albums and her
 * own Deleted, never the reduce's own removals waiting out their window; at the deadline her own Deleted leaves for
 * good first, oldest first, and only what it cannot cover moves her largest files. Each case is one host on the
 * world's clock (NOW), so every removal sits inside its 30 days.
 */
describe("Deleted counts in what she keeps", () => {
  const HOST = uuidOf("h", 1);
  /** A removal `days` before NOW, inside the window. */
  const daysAgo = (days: number) =>
    new Date(NOW.getTime() - days * 86_400_000).toISOString();

  function oneHost(
    build: (event: FakeRow) => FakeRow[],
    over: Partial<FakeRow> = {},
  ) {
    const host = account(HOST, over);
    const event = eventRow(uuidOf("e", 7), HOST);
    const world = withCandidates(
      createCronWorld(
        { profiles: [host], events: [event], media: build(event) },
        { now: NOW },
      ),
    );
    state.world = world;
    return world;
  }
  const mine = (world: CronWorld) => world.fake.tables.media;
  const PAST_GRACE = {
    storage_grace_until: "2026-09-20T00:00:00.000000+00:00",
  };

  it("★ opens a grace on her own Deleted: under the cap in her albums, over it with what she deleted", async () => {
    // 6,000 in her albums and 6,000 in her Deleted on a 10,000 cap: she stores 12,000, past its 10% line.
    const world = oneHost((event) => [
      ...Array.from({ length: 6 }, (_, i) =>
        mediaRow(uuidOf("ma", i), event, { file_size_bytes: 1_000 }),
      ),
      ...Array.from({ length: 6 }, (_, i) =>
        mediaRow(uuidOf("md", i), event, {
          status: "removed",
          removed_at: daysAgo(3),
          file_size_bytes: 1_000,
        }),
      ),
    ]);
    const tally = await sweepOverCapacity(world.client, NOW);
    expect(tally).toMatchObject({ grace_opened: 1, cleared: 0 });
    expect(state.sent.map((s) => s.kind)).toEqual(["over_cap_grace_start"]);
  });

  it("★ never re-opens a grace on the reduce's own removals waiting out their window", async () => {
    // 10,000 in her albums at the cap, and 5,000 the last reduce moved to Deleted: what she keeps fits.
    const world = oneHost((event) => [
      ...Array.from({ length: 10 }, (_, i) =>
        mediaRow(uuidOf("ma", i), event, { file_size_bytes: 1_000 }),
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        mediaRow(uuidOf("ms", i), event, {
          status: "removed",
          removed_at: daysAgo(2),
          removed_by_system: true,
          file_size_bytes: 1_000,
        }),
      ),
    ]);
    const tally = await sweepOverCapacity(world.client, NOW);
    expect(tally).toMatchObject({ grace_opened: 0, cleared: 0 });
    expect(state.sent).toEqual([]);
  });

  it("★ at the deadline, her own Deleted leaves first, oldest first, and nothing she kept is touched while it covers the overage", async () => {
    // 6,000 kept in her albums and 6,000 in her Deleted (the oldest first), and 3,000 of the system's older still.
    const world = oneHost(
      (event) => [
        ...Array.from({ length: 6 }, (_, i) =>
          mediaRow(uuidOf("ma", i), event, { file_size_bytes: 1_000 }),
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          mediaRow(uuidOf("md", i), event, {
            status: "removed",
            removed_at: daysAgo(10 - i),
            file_size_bytes: 1_000,
          }),
        ),
        ...Array.from({ length: 3 }, (_, i) =>
          mediaRow(uuidOf("ms", i), event, {
            status: "removed",
            removed_at: daysAgo(20),
            removed_by_system: true,
            file_size_bytes: 1_000,
          }),
        ),
      ],
      PAST_GRACE,
    );
    const tally = await sweepOverCapacity(world.client, NOW);
    // 12,000 kept against 10,000: the two oldest of hers leave, and nothing more.
    expect(tally).toMatchObject({
      reduced: 1,
      deleted_left: 2,
      items_reduced: 0,
    });
    const asked = mine(world).filter((m) => m.purge_asked_at != null);
    expect(asked.map((m) => m.id).sort()).toEqual(
      [uuidOf("md", 0), uuidOf("md", 1)].sort(),
    );
    // Nothing she kept moved, and the system's removals (older than hers) stayed for their window.
    expect(mine(world).filter((m) => m.status !== "removed")).toHaveLength(6);
    expect(
      mine(world).filter(
        (m) => m.removed_by_system && m.purge_asked_at != null,
      ),
    ).toHaveLength(0);
    expect(world.fake.tables.profiles[0].storage_grace_until).toBeNull();
    expect(state.sent.map((s) => s.kind)).toEqual(["over_cap_reduced"]);
  });

  // ★ The Advisor's Q23: every PostgREST call runs under an 8 s statement_timeout, so a large Deleted leaves a batch
  // a call (`LEAVE_DELETED_BATCH`), the deadline asked before each, never in one statement that rolls back.
  const bigDeleted = (event: FakeRow) => [
    // 9,000 in her albums and 2,500 removals of 10 bytes: 34,000 against 10,000, so 24,000 must leave (2,400 items).
    ...Array.from({ length: 9 }, (_, i) =>
      mediaRow(uuidOf("ma", i), event, { file_size_bytes: 1_000 }),
    ),
    ...Array.from({ length: 2_500 }, (_, i) =>
      mediaRow(uuidOf("md", i), event, {
        status: "removed",
        removed_at: new Date(
          NOW.getTime() - 20 * 86_400_000 + i * 1_000,
        ).toISOString(),
        file_size_bytes: 10,
      }),
    ),
  ];
  const leaveCalls = (world: CronWorld) =>
    world.fake.requests.filter(
      (r) => r.target === "rpc" && r.name === "leave_deleted",
    ).length;

  it("★ leaves a large Deleted a batch a call, oldest first, until the overage is covered", async () => {
    const world = oneHost(bigDeleted, PAST_GRACE);
    const tally = await sweepOverCapacity(world.client, NOW);
    expect(tally).toMatchObject({
      reduced: 1,
      deleted_left: 2_400,
      items_reduced: 0,
    });
    expect(leaveCalls(world)).toBe(2);
    // The oldest 2,400 went; the newest 100 stayed.
    const asked = new Set(
      mine(world)
        .filter((m) => m.purge_asked_at != null)
        .map((m) => m.id),
    );
    expect(asked.size).toBe(2_400);
    expect(asked.has(uuidOf("md", 0))).toBe(true);
    expect(asked.has(uuidOf("md", 2_499))).toBe(false);
    expect(state.sent.map((s) => s.kind)).toEqual(["over_cap_reduced"]);
  });

  it("★ a deadline between its batches stops there: grace kept, no mail, and the next run finishes", async () => {
    const world = oneHost(bigDeleted, PAST_GRACE);
    // Asked before the account, then before each batch: the second batch is refused.
    const first = await sweepOverCapacity(world.client, NOW, {
      deadline: passesAfter(2),
    });
    expect(first).toMatchObject({
      reduced: 0,
      deleted_left: 2_000,
      stopped_early: true,
    });
    expect(world.fake.tables.profiles[0].storage_grace_until).toBe(
      PAST_GRACE.storage_grace_until,
    );
    expect(state.sent).toEqual([]);

    // She still keeps 14,000 (2,000 of her 10-byte removals left): the next run starts at her and finishes.
    const second = await sweepOverCapacity(world.client, NOW, {
      resumeAfter: first.resume_after,
    });
    expect(second).toMatchObject({ reduced: 1, deleted_left: 400 });
    expect(world.fake.tables.profiles[0].storage_grace_until).toBeNull();
    expect(state.sent.map((s) => s.kind)).toEqual(["over_cap_reduced"]);
  });

  it("★ finishes a due reduce inside the headroom rather than clearing it half done", async () => {
    // A run stopped part way left her at 10,500: inside the write line (11,000), still over the cap (10,000).
    const world = oneHost(
      (event) => [
        ...Array.from({ length: 10 }, (_, i) =>
          mediaRow(uuidOf("ma", i), event, { file_size_bytes: 1_000 }),
        ),
        mediaRow(uuidOf("md", 0), event, {
          status: "removed",
          removed_at: daysAgo(5),
          file_size_bytes: 500,
        }),
      ],
      PAST_GRACE,
    );
    const tally = await sweepOverCapacity(world.client, NOW);
    expect(tally).toMatchObject({ reduced: 1, cleared: 0, deleted_left: 1 });
    expect(world.fake.tables.profiles[0].storage_grace_until).toBeNull();
    expect(state.sent.map((s) => s.kind)).toEqual(["over_cap_reduced"]);
  });

  it("★ when her own Deleted cannot cover it, all of it leaves and then her largest files move", async () => {
    // 12,000 in her albums (one 3,000 file) and 1,000 in her Deleted: 13,000 against 10,000.
    const world = oneHost(
      (event) => [
        mediaRow(uuidOf("mb", 0), event, { file_size_bytes: 3_000 }),
        ...Array.from({ length: 9 }, (_, i) =>
          mediaRow(uuidOf("ma", i), event, { file_size_bytes: 1_000 }),
        ),
        mediaRow(uuidOf("md", 0), event, {
          status: "removed",
          removed_at: daysAgo(4),
          file_size_bytes: 1_000,
        }),
      ],
      PAST_GRACE,
    );
    const tally = await sweepOverCapacity(world.client, NOW);
    expect(tally).toMatchObject({
      reduced: 1,
      deleted_left: 1,
      items_reduced: 1,
    });
    // Her Deleted left for good; the 3,000 file moved to Deleted as the system's, recoverable for its window.
    expect(
      mine(world).find((m) => m.id === uuidOf("md", 0))?.purge_asked_at,
    ).toBeTruthy();
    const moved = mine(world).find((m) => m.id === uuidOf("mb", 0));
    expect(moved).toMatchObject({ status: "removed", removed_by_system: true });
    expect(moved?.purge_asked_at ?? null).toBeNull();
    expect(state.sent.map((s) => s.kind)).toEqual(["over_cap_reduced"]);
  });
});
