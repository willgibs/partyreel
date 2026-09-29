/**
 * AN OPERATOR'S REMOVAL ACROSS THE PURGE (admin-triage r1, Will's `notice=deleted` note, 2026-09-28;
 * migration 20260928140000). The removal leaves the host's view at once, but its copy waits out its
 * own window (`purge_at`, the removal + 30 days), which is the operator's Undo and the runbook's time
 * to hold and preserve. So, on the clamping fake with the SQL functions modelled on that migration:
 *
 *  - the removed_media sweep takes it only once its purge_at passes, and never while it is held;
 *  - the standby budget never charges it to the host nor evicts it, however far over she is;
 *  - an expired event, or a deleted account's event, holding one inside its window is kept WHOLE,
 *    as a held event is, and goes once the window ends.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FakeRow } from "@/lib/db/testing/fake-postgrest";
import {
  createCronWorld,
  eventRow,
  mediaRow,
  stamp,
  uuidOf,
  type CronWorld,
} from "@/lib/lifecycle/testing/cron-fake";

const state = vi.hoisted(() => ({
  world: null as CronWorld | null,
  deletedUsers: [] as string[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: vi.fn(),
  captureWarning: vi.fn(),
}));
vi.mock("@/lib/supabase/avatar-storage", () => ({
  removeAvatar: vi.fn(async () => undefined),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => state.world!.client,
}));
vi.mock("@/lib/r2/delete", () => ({
  deleteR2Objects: vi.fn(async (keys: string[]) => {
    state.world?.recordR2(keys);
    return { deleted: keys.length, errored: [] };
  }),
  listR2Objects: vi.fn(),
}));

const { sweepRemovedMedia } =
  await import("@/lib/lifecycle/sweeps/removed-media");
const { sweepStandbyBudget } =
  await import("@/lib/lifecycle/sweeps/standby-budget");
const { sweepExpiredEvents } =
  await import("@/lib/lifecycle/sweeps/expired-events");
const { purgeAccount } = await import("@/lib/lifecycle/account-deletion");

const NOW = new Date("2026-09-23T04:00:00.000Z");
/** Removed three days ago: inside its window (purge_at three days short of 30 from now). */
const RECENT = "2026-09-20T04:00:00.000000+00:00";
const RECENT_PURGE = "2026-10-20T04:00:00.000000+00:00";
/** Removed 31 days ago: its window ended yesterday. */
const OLD = "2026-08-23T04:00:00.000000+00:00";
const OLD_PURGE = "2026-09-22T04:00:00.000000+00:00";
const HOST = uuidOf("h", 1);

function world(tables: Record<string, FakeRow[]>): CronWorld {
  tables.guests ??= [];
  const w = createCronWorld(tables, { now: NOW });
  (w.fake as unknown as { auth: unknown }).auth = {
    getUser: async () => ({ data: { user: null }, error: null }),
    admin: {
      deleteUser: async (id: string) => {
        state.deletedUsers.push(id);
        return { error: null };
      },
    },
  };
  state.world = w;
  return w;
}

/** An operator's removal of an item of `event`, removed at `removedAt` with its trigger-derived purge_at. */
function takedown(
  id: string,
  event: FakeRow,
  removedAt: string,
  purgeAt: string,
  over: Partial<FakeRow> = {},
): FakeRow {
  return mediaRow(id, event, {
    status: "removed",
    removed_at: removedAt,
    purge_at: purgeAt,
    removed_by_admin: true,
    file_size_bytes: 10,
    ...over,
  });
}

function objectsDeleted(w: CronWorld): Set<string> {
  return new Set(
    w.log.flatMap((entry) => (entry.kind === "r2" ? entry.keys : [])),
  );
}

beforeEach(() => {
  state.world = null;
  state.deletedUsers = [];
});

describe("the removed_media sweep", () => {
  it("★ takes an operator's removal only once its window ends, and never while it is held", async () => {
    const event = eventRow(uuidOf("e", 1), HOST);
    const inWindow = takedown(uuidOf("m", 1), event, RECENT, RECENT_PURGE);
    const due = takedown(uuidOf("m", 2), event, OLD, OLD_PURGE);
    const heldDue = takedown(uuidOf("m", 3), event, OLD, OLD_PURGE, {
      legal_hold_at: OLD,
    });
    const w = world({ events: [event], media: [inWindow, due, heldDue] });

    const tally = await sweepRemovedMedia(w.client, NOW, new Set());

    expect(tally.media_rows).toBe(1);
    expect(w.fake.tables.media.map((m) => m.id).sort()).toEqual(
      [inWindow.id, heldDue.id].sort(),
    );
    const gone = objectsDeleted(w);
    expect(gone.has(String(due.original_key))).toBe(true);
    // The held object, and the one still inside its window, are never touched.
    expect(gone.has(String(heldDue.original_key))).toBe(false);
    expect(gone.has(String(inWindow.original_key))).toBe(false);
  });
});

describe("the standby budget", () => {
  it("★ never charges an operator's removal to the host, and never evicts one, however far over she is", async () => {
    const event = eventRow(uuidOf("e", 1), HOST);
    const media: FakeRow[] = [];
    // Her own 20 removals, 10 bytes each: 200 against a budget of 100.
    for (let i = 0; i < 20; i++) {
      media.push(
        mediaRow(uuidOf("mo", i), event, {
          status: "removed",
          removed_at: stamp(1_000 + i),
          purge_at: RECENT_PURGE,
          file_size_bytes: 10,
        }),
      );
    }
    // 30 operator removals, OLDER than all of hers: an eviction by age would take these first.
    for (let i = 0; i < 30; i++) {
      media.push(takedown(uuidOf("mt", i), event, stamp(i), RECENT_PURGE));
    }
    const w = world({
      profiles: [{ id: HOST, tier: "pro", storage_cap_bytes: 100 }],
      events: [event],
      media,
    });

    const tally = await sweepStandbyBudget(w.client, NOW, new Set());

    // Only her own bytes count: 200 over a 100 budget, so her 10 oldest go, 100 bytes.
    expect(tally).toMatchObject({
      over_budget: 1,
      media_rows: 10,
      freed_bytes: 100,
    });
    const left = w.fake.tables.media;
    expect(left.filter((m) => m.removed_by_admin)).toHaveLength(30);
    expect(left.filter((m) => !m.removed_by_admin)).toHaveLength(10);
  });

  it("does not list a host whose only Deleted bytes are operator removals", async () => {
    const event = eventRow(uuidOf("e", 1), HOST);
    const w = world({
      profiles: [{ id: HOST, tier: "pro", storage_cap_bytes: 1 }],
      events: [event],
      media: [takedown(uuidOf("mt", 1), event, RECENT, RECENT_PURGE)],
    });
    const tally = await sweepStandbyBudget(w.client, NOW, new Set());
    expect(tally).toMatchObject({
      candidates: 0,
      over_budget: 0,
      media_rows: 0,
    });
  });
});

describe("event-level purges keep a takedown's event for its window", () => {
  const expired = { deleted_at: OLD, purge_at: OLD_PURGE };

  it("★ an expired event holding a takedown inside its window is kept whole, then goes", async () => {
    const kept = eventRow(uuidOf("ek", 1), HOST, expired);
    const free = eventRow(uuidOf("ef", 1), HOST, expired);
    const media = [
      takedown(uuidOf("mk", 1), kept, RECENT, RECENT_PURGE),
      mediaRow(uuidOf("mk", 2), kept),
      mediaRow(uuidOf("mf", 1), free),
    ];
    const w = world({ events: [kept, free], media });

    const tally = await sweepExpiredEvents(w.client, NOW, new Set());

    expect(tally).toMatchObject({ events: 1, hold_blocked_events: 1 });
    expect(w.fake.tables.events.map((e) => e.id)).toEqual([kept.id]);
    expect(w.fake.tables.media.map((m) => m.id).sort()).toEqual(
      [uuidOf("mk", 1), uuidOf("mk", 2)].sort(),
    );

    // Once the takedown's own window ends, nothing keeps the event.
    const later = createCronWorld(
      { events: [kept], media: w.fake.tables.media, guests: [] },
      { now: new Date("2026-10-21T04:00:00.000Z") },
    );
    state.world = later;
    const after = await sweepExpiredEvents(
      later.client,
      new Date("2026-10-21T04:00:00.000Z"),
      new Set(),
    );
    expect(after).toMatchObject({ events: 1, hold_blocked_events: 0 });
    expect(later.fake.tables.events).toHaveLength(0);
  });

  it("★ a deleted account keeps the event its takedown sits in, anonymised, until the window ends", async () => {
    const user = uuidOf("u", 1);
    const reported = eventRow(uuidOf("er", 1), user);
    const other = eventRow(uuidOf("eo", 1), user);
    const w = world({
      profiles: [
        {
          id: user,
          email: "host@example.com",
          display_name: "Host",
          slug: "host",
          avatar_updated_at: null,
          deletion_requested_at: RECENT,
        },
      ],
      events: [reported, other],
      media: [
        takedown(uuidOf("mr", 1), reported, RECENT, RECENT_PURGE),
        mediaRow(uuidOf("mo", 1), other),
      ],
    });

    const result = await purgeAccount(w.client, user);

    expect(result).toMatchObject({
      outcome: "held",
      hold_blocked_events: 1,
      events: 1,
    });
    expect(w.fake.tables.events.map((e) => e.id)).toEqual([reported.id]);
    expect(w.fake.tables.media.map((m) => m.id)).toEqual([uuidOf("mr", 1)]);
    expect(state.deletedUsers).toEqual([]);
    expect(
      objectsDeleted(w).has(
        `events/${String(reported.id)}/photo/${uuidOf("mr", 1)}/original.jpg`,
      ),
    ).toBe(false);
  });
});
