/**
 * SWEEP 5 ON THE CLAMPING FAKE (H9, H10): 1,300 candidates read whole, each account's active bytes
 * from the one aggregate (`host_storage_summary`), the auto-reduce candidates read largest first past
 * 1,000 and the soft-remove chunked inside the URL budget, and a deadline that leaves a resume cursor.
 *
 * ★ AND THE REDUCE PAGED UNDER THE DEADLINE (crumbs-37): it reads a lapsed host's active set largest first a
 * page at a time and stops reading once what is left fits; a deadline that passes between its pages stops it
 * there, the grace kept and no mail sent, and the next run starts AT that account and finishes it.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

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
}));

const { sweepOverCapacity } =
  await import("@/lib/lifecycle/sweeps/over-capacity");

const NOW = new Date("2026-09-23T04:00:00.000Z");
const MB = 1024 ** 2;
const GB = 1024 ** 3;
const CAP = 10_000; // an explicit cap, so a few thousand bytes is "over"

function passesAfter(n: number): Deadline {
  let asked = 0;
  return { at: 0, passed: () => asked++ >= n };
}

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
 * 1,295 candidates with nothing live, plus four that each take one branch: over with no grace, under
 * with a grace to clear, past their grace with 2,500 active items, and inside the reminder window.
 * Twenty accounts under the floor (the smallest plan's cap, Free's 100 MB) are no candidates at all.
 */
function fixture() {
  const profiles: FakeRow[] = [];
  for (let i = 0; i < 1_295; i++) profiles.push(account(uuidOf("a", i)));
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

  const events = [
    eventRow(uuidOf("e", 1), String(opens.id)),
    eventRow(uuidOf("e", 3), String(reduces.id)),
    eventRow(uuidOf("e", 4), String(reminded.id)),
  ];
  const media = [
    ...Array.from({ length: 20 }, (_, i) =>
      mediaRow(uuidOf("mo", i), events[0], { file_size_bytes: 1_000 }),
    ),
    // 2,500 active items: the reduce must see all of them to choose largest-first.
    ...Array.from({ length: 2_500 }, (_, i) =>
      mediaRow(uuidOf("mr", i), events[1], {
        file_size_bytes: 1_000 + (i % 7),
      }),
    ),
    ...Array.from({ length: 20 }, (_, i) =>
      mediaRow(uuidOf("mm", i), events[2], { file_size_bytes: 1_000 }),
    ),
  ];
  const world = createCronWorld({ profiles, events, media });
  state.world = world;
  return { world, opens, clears, reduces, reminded };
}

beforeEach(() => {
  state.world = null;
  state.sent = [];
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
    expect(first.resume_after).toMatch(/^[0-9a-f-]{36}$/);

    const summaries = () =>
      world.fake.requests.filter((r) => r.name === "host_storage_summary")
        .length;
    const before = summaries();
    const second = await sweepOverCapacity(world.client, NOW, {
      resumeAfter: first.resume_after,
    });
    expect(second.stopped_early).toBeUndefined();
    // Every candidate asked once more (pro accounts with an explicit cap are all capped).
    expect(summaries() - before).toBe(1_299);
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
    const world = createCronWorld({
      profiles: [lapsed],
      events: [event],
      media,
    });
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
    // Two quiet accounts before it and one after, so the cursor has somewhere to point.
    const quiet = (n: number) =>
      account(uuidOf("q", n), { storage_cap_bytes: 10 * GB });
    const lapsed = account(uuidOf("r", 1), {
      storage_grace_until: "2026-09-20T00:00:00.000000+00:00",
    });
    const after = account(uuidOf("t", 1), { storage_cap_bytes: 10 * GB });
    const event = eventRow(uuidOf("e", 8), String(lapsed.id));
    const media = Array.from({ length: 2_500 }, (_, i) =>
      mediaRow(uuidOf("rm", i), event, { file_size_bytes: 1_000 + (i % 7) }),
    );
    const world = createCronWorld({
      profiles: [quiet(1), quiet(2), lapsed, after],
      events: [event],
      media,
    });
    state.world = world;
    const active = () =>
      world.fake.tables.media.filter((m) => m.status !== "removed");

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
      resume_after: uuidOf("q", 2),
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
    const removed = world.fake.tables.media.filter(
      (m) => m.status === "removed",
    );
    const smallestRemoved = Math.min(
      ...removed.map((m) => Number(m.file_size_bytes)),
    );
    expect(
      active().every((m) => Number(m.file_size_bytes) <= smallestRemoved),
    ).toBe(true);
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
    const world = createCronWorld({
      profiles: [lapsed],
      events: [event],
      media: [mediaRow(uuidOf("mf", 1), event, { file_size_bytes: GB })],
    });
    state.world = world;

    const tally = await sweepOverCapacity(world.client, NOW);
    expect(tally).toMatchObject({ candidates: 1, grace_opened: 1 });
    expect(world.fake.tables.profiles[0].storage_grace_until).toBeTruthy();
    expect(state.sent.map((s) => s.kind)).toEqual(["over_cap_grace_start"]);
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
    const world = createCronWorld(
      { profiles: [host], events: [event], media: build(event) },
      { now: NOW },
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
