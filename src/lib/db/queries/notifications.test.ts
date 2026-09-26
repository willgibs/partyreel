/**
 * THE BELL COUNTS THE QUEUE THE CARDS COUNT (`reel-host`, Will 2026-09-25: `review=agree`).
 *
 * The bell's badge, the event card's "N to review" chip and Review's own header read one number:
 * pending media outside the bin on the host's LIVE events. Against `fake-postgrest`:
 *   - the head count joins the events and asks for live ones only, so a soft-deleted event's
 *     queue never reaches the badge (the old read counted every pending row the host could see);
 *   - a queue is broken down per event through the cards' own `event_card_stats`, so each row
 *     names its event, in the dashboard's order;
 *   - no queue, no breakdown: the common page load pays for one head count and nothing more;
 *   - a failed breakdown never takes a host page down: the bell falls back to one row.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  FakeRpcError,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) => `signed:${key}`,
}));

const HOST = "host-1";
let fake: FakePostgrest;

vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({
    supabase: asSupabase(fake),
    user: { id: HOST },
  }),
}));

const { getNotificationData } = await import("@/lib/db/queries/notifications");

const live = { host_id: HOST, deleted_at: null };

function pending(id: string, eventId: string, over: FakeRow = {}): FakeRow {
  return {
    id,
    event_id: eventId,
    status: "pending",
    removed_at: null,
    events: live,
    ...over,
  };
}

function event(id: string, name: string, createdAt: string): FakeRow {
  return {
    id,
    host_id: HOST,
    name,
    created_at: createdAt,
    deleted_at: null,
    event_password_hash: null,
  };
}

/** The cards' own counter over the fake's media, the way the SQL function answers. */
function cardStats(fake: FakePostgrest) {
  return (args: Record<string, unknown>) => {
    const ids = args.p_event_ids as string[];
    const out: Record<string, { approved: number; pending: number }> = {};
    for (const id of ids) {
      const rows = (fake.tables.media ?? []).filter(
        (m) => m.event_id === id && m.removed_at === null,
      );
      out[id] = {
        approved: rows.filter((m) => m.status === "approved").length,
        pending: rows.filter((m) => m.status === "pending").length,
      };
    }
    return out;
  };
}

beforeEach(() => {
  fake = createFakePostgrest({ tables: { media: [], events: [] } });
});

describe("the bell's review queue", () => {
  it("★ counts the live events' queue, and names each event holding one", async () => {
    fake = createFakePostgrest({
      tables: {
        media: [
          pending("m1", "wedding"),
          pending("m2", "wedding"),
          pending("m3", "wedding"),
          pending("m4", "ruby"),
          // A binned event's queue is not the host's to clear from the bell.
          pending("m5", "binned", {
            events: { host_id: HOST, deleted_at: "2026-09-20T00:00:00+00:00" },
          }),
        ],
        events: [
          event("ruby", "Ruby's 30th", "2026-09-24T00:00:00+00:00"),
          event("wedding", "Mia & Theo's wedding", "2026-09-10T00:00:00+00:00"),
        ],
      },
    });
    fake.functions.event_card_stats = cardStats(fake);

    const data = await getNotificationData();

    expect(data.pendingCount).toBe(4);
    // Newest event first, the dashboard's own order.
    expect(data.pendingByEvent).toEqual([
      { eventId: "ruby", eventName: "Ruby's 30th", pending: 1 },
      { eventId: "wedding", eventName: "Mia & Theo's wedding", pending: 3 },
    ]);
    const head = fake.requests.find(
      (r) => r.name === "media" && r.method === "HEAD",
    );
    expect(head?.filters).toEqual(
      expect.arrayContaining([
        { column: "events.deleted_at", op: "is", value: null },
        { column: "status", op: "eq", value: "pending" },
        { column: "removed_at", op: "is", value: null },
      ]),
    );
  });

  it("reads no breakdown when nothing waits, the common page load", async () => {
    fake = createFakePostgrest({
      tables: {
        media: [],
        events: [event("e1", "Quiet", "2026-09-24T00:00:00+00:00")],
      },
    });
    const data = await getNotificationData();
    expect(data.pendingCount).toBe(0);
    expect(data.pendingByEvent).toEqual([]);
    expect(fake.requests.some((r) => r.name === "event_card_stats")).toBe(
      false,
    );
    // The live events list (`listEvents`: deleted_at IS NULL) is never read for
    // the bell; the purge nudge's own read asks for binned events instead.
    const readsLiveEvents = fake.requests.some(
      (r) =>
        r.name === "events" &&
        r.filters.some((f) => f.column === "deleted_at" && f.op === "is"),
    );
    expect(readsLiveEvents).toBe(false);
  });

  it("falls back to one row when the breakdown fails, and keeps the page up", async () => {
    fake = createFakePostgrest({
      tables: {
        media: [pending("m1", "e1")],
        events: [event("e1", "Garden party", "2026-09-24T00:00:00+00:00")],
      },
      rpc: {
        event_card_stats: () => {
          throw new FakeRpcError("42501", "permission denied");
        },
      },
    });
    const data = await getNotificationData();
    expect(data.pendingCount).toBe(1);
    // Undefined, never []: the builder then draws its single row over the head count.
    expect(data.pendingByEvent).toBeUndefined();
  });
});
