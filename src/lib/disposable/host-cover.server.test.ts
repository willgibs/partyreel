/**
 * THE ROWS A SWITCH PUT IN THE ROLL, READ FOR HER COVER (red-team 46's MEDIUM): an album going from approving each to a
 * develop time approves its held photographs and seals them with it, after they were created, so her manifest (which
 * never sees the seal) reads them as seen. The page reads them off the rows: approved, sealed now, created before the
 * period began, on that event alone, whole (a switch can put more than a page of them in the roll), and only while a
 * develop time is ahead. A failed read answers none, captured: the cover reads as it did, never a thrown page.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));
const captureError = vi.hoisted(() => vi.fn());
vi.mock("@/lib/observability/sentry", () => ({ captureError }));
// The album's keyset helpers, without the module's own server client (and its env) behind them.
vi.mock("@/lib/db/queries/guest-events", () => ({
  albumCursorOf: (row: { created_at: string; id: string }) => ({
    at: row.created_at,
    id: row.id,
  }),
  olderThan: (after: { at: string; id: string }) =>
    `created_at.lt.${after.at},and(created_at.eq.${after.at},id.lt.${after.id})`,
}));

const { readJoinedIds } = await import("@/lib/disposable/host-cover.server");

const NOW = Date.parse("2026-10-03T12:00:00.000Z");
const AHEAD = "2026-10-04T13:00:00+00:00";
const PAST = "2026-10-03T09:00:00+00:00";
const SEALED_FROM = "2026-10-03T11:40:19.739+00:00";
type Facts = {
  id: string;
  develops_at: string | null;
  sealed_from: string | null;
};
const EVENT: Facts = {
  id: "e1",
  develops_at: AHEAD,
  sealed_from: SEALED_FROM,
};

/** One of the event's rows: the shape the switch leaves held photographs in, unless told otherwise. */
const row = (id: string, over: Partial<FakeRow> = {}): FakeRow => ({
  id,
  event_id: "e1",
  status: "approved",
  sealed_until: AHEAD,
  created_at: "2026-10-03T11:25:00.000001+00:00",
  ...over,
});

function read(rows: FakeRow[], event: Facts = EVENT, urlLengthLimit?: number) {
  const fake = createFakePostgrest({
    tables: { media: rows },
    ...(urlLengthLimit ? { urlLengthLimit } : {}),
  });
  return { fake, ids: readJoinedIds(asSupabase(fake), event, NOW) };
}

beforeEach(() => {
  captureError.mockClear();
});

describe("readJoinedIds: the approved rows sealed for the develop that were created before its period", () => {
  it("★ answers the held photographs the switch put in the roll, and none of what her guests already saw", async () => {
    const { ids } = read([
      row("joined-1"),
      row("joined-2", { created_at: "2026-10-03T11:30:00.5+00:00" }),
      // Approved by her before the switch: her guests saw it and see it still (no seal).
      row("seen", { sealed_until: null }),
      // A seal that has already passed is no seal.
      row("opened", { sealed_until: PAST }),
      // Added since the period began: the period's own rule counts these, never this read.
      row("period", { created_at: "2026-10-03T11:50:00.000001+00:00" }),
      // Held, hidden and taken back are not approved; another event's rows are not hers.
      row("held", { status: "pending" }),
      row("hidden", { status: "hidden" }),
      row("removed", { status: "removed" }),
      row("elsewhere", { event_id: "e2" }),
    ]);
    expect((await ids).sort()).toEqual(["joined-1", "joined-2"]);
  });

  it("★ reads them whole: a switch can put more than a page of them in the roll", async () => {
    const many = Array.from({ length: 2_300 }, (_, i) =>
      row(`j${String(i).padStart(5, "0")}`, {
        created_at: `2026-10-03T10:${String(i % 60).padStart(2, "0")}:00.${String(i + 1).padStart(6, "0")}+00:00`,
      }),
    );
    const { fake, ids } = read(many);
    expect(await ids).toHaveLength(2_300);
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
    expect(fake.requests.length).toBeGreaterThan(1);
  });

  it("reads nothing where no develop time is ahead, or no period was stamped: the cover is not standing", async () => {
    const standing: Facts[] = [
      { id: "e1", develops_at: null, sealed_from: SEALED_FROM },
      { id: "e1", develops_at: PAST, sealed_from: SEALED_FROM },
      { id: "e1", develops_at: AHEAD, sealed_from: null },
    ];
    for (const event of standing) {
      const { fake, ids } = read([row("joined-1")], event);
      expect(await ids).toEqual([]);
      expect(fake.requests).toHaveLength(0);
    }
  });

  it("a failed read answers none, and is captured (never a thrown page)", async () => {
    const { ids } = read([row("joined-1")], EVENT, 10);
    expect(await ids).toEqual([]);
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError.mock.calls[0]![2]).toMatchObject({
      seam: "hub_cover_joined",
      eventId: "e1",
    });
  });
});
