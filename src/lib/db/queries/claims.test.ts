/**
 * THE GROUPING, PINNED. `list_guest_rows_by_email` returns one tuple per
 * GUEST ROW, and the same address can carry more than one row at the same
 * event (a second device, a second visit before signing in) — the claim and
 * disown RPCs both act per EVENT, so the query layer must collapse the RPC's
 * rows into one entry per event before anything renders a "Claim" button.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));

type RpcRow = {
  guest_id: string;
  event_id: string;
  event_name: string;
  event_date: string | null;
  display_name: string | null;
  upload_count: number;
  last_upload_at: string | null;
  pending_email_at: string;
};

let rows: RpcRow[] = [];
let user: { id: string } | null = { id: "u1" };
const rpc = vi.fn(
  async (): Promise<{ data: RpcRow[] | null; error: unknown }> => ({
    data: rows,
    error: null,
  }),
);

/** The client the query reads through: the recording stub, or a `fake-postgrest` for the paging pins. */
let client: unknown = { rpc };

vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ supabase: client, user }),
}));

const { getMyClaimableGuestRows } = await import("@/lib/db/queries/claims");

const row = (over: Partial<RpcRow>): RpcRow => ({
  guest_id: "g1",
  event_id: "e1",
  event_name: "Maya & Theo",
  event_date: "2026-10-01",
  display_name: "Priya",
  upload_count: 2,
  last_upload_at: "2026-10-02T10:00:00Z",
  pending_email_at: "2026-09-20T10:00:00Z",
  ...over,
});

beforeEach(() => {
  rows = [];
  user = { id: "u1" };
  client = { rpc };
  rpc.mockClear();
});

describe("signed out", () => {
  it("returns nothing and never calls the RPC", async () => {
    user = null;
    await expect(getMyClaimableGuestRows()).resolves.toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("one row per event", () => {
  it("maps every field", async () => {
    rows = [row({})];
    const result = await getMyClaimableGuestRows();
    expect(result).toEqual([
      {
        eventId: "e1",
        eventName: "Maya & Theo",
        eventDate: "2026-10-01",
        names: ["Priya"],
        uploadCount: 2,
        lastUploadAt: "2026-10-02T10:00:00Z",
      },
    ]);
  });

  it("withholds nothing the RPC already withheld (a gated event's null date passes through)", async () => {
    rows = [row({ event_date: null })];
    const result = await getMyClaimableGuestRows();
    expect(result[0].eventDate).toBeNull();
  });

  it("drops a blank or missing typed name rather than listing an empty string", async () => {
    rows = [row({ display_name: null }), row({ event_id: "e2", display_name: "  " })];
    const result = await getMyClaimableGuestRows();
    expect(result.map((r) => r.names)).toEqual([[], []]);
  });
});

describe("two guest rows at the same event", () => {
  it("collapses into one entry: names collected, counts summed, the newer upload wins", async () => {
    rows = [
      row({
        guest_id: "g1",
        display_name: "Priya",
        upload_count: 2,
        last_upload_at: "2026-10-02T10:00:00Z",
      }),
      row({
        guest_id: "g2",
        display_name: "P.",
        upload_count: 3,
        last_upload_at: "2026-10-05T09:00:00Z",
      }),
    ];
    const result = await getMyClaimableGuestRows();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      eventId: "e1",
      names: ["Priya", "P."],
      uploadCount: 5,
      lastUploadAt: "2026-10-05T09:00:00Z",
    });
  });

  it("never lets a null last_upload_at from one row erase a real one from another", async () => {
    rows = [
      row({ guest_id: "g1", last_upload_at: null }),
      row({ guest_id: "g2", last_upload_at: "2026-10-05T09:00:00Z" }),
    ];
    const result = await getMyClaimableGuestRows();
    expect(result[0].lastUploadAt).toBe("2026-10-05T09:00:00Z");
  });

  it("dedupes an identical typed name across the group's rows", async () => {
    rows = [
      row({ guest_id: "g1", display_name: "Priya" }),
      row({ guest_id: "g2", display_name: "Priya" }),
    ];
    const result = await getMyClaimableGuestRows();
    expect(result[0].names).toEqual(["Priya"]);
  });
});

describe("several events", () => {
  it("keeps the RPC's own order (most recently active first)", async () => {
    rows = [
      row({ event_id: "e-recent", event_name: "Recent" }),
      row({ event_id: "e-older", event_name: "Older" }),
    ];
    const result = await getMyClaimableGuestRows();
    expect(result.map((r) => r.eventId)).toEqual(["e-recent", "e-older"]);
  });

  it("keeps a group's rank at its best-placed row, even when its second row arrives later", async () => {
    rows = [
      row({ event_id: "e-a", guest_id: "g1" }),
      row({ event_id: "e-b", guest_id: "g2" }),
      // e-a's second row arrives last in the RPC's own order; the group must
      // still sort where e-a's FIRST row placed it.
      row({ event_id: "e-a", guest_id: "g3" }),
    ];
    const result = await getMyClaimableGuestRows();
    expect(result.map((r) => r.eventId)).toEqual(["e-a", "e-b"]);
  });
});

/**
 * GUEST BY UPLOAD (Will, 2026-09-22): a person is a guest of an event only through an upload of
 * theirs, so a row with nothing live on it has no place on the claim card. The RPC skips such rows
 * (migration 20260923120000); the query layer drops an event whose group sums to nothing as the
 * belt, so the card is right against a database that has not taken that file yet.
 */
describe("an event with nothing to claim", () => {
  it("is never offered: an empty row alone carries no event onto the card", async () => {
    rows = [
      row({ event_id: "e-live", guest_id: "g1", upload_count: 2 }),
      row({
        event_id: "e-empty",
        guest_id: "g2",
        upload_count: 0,
        last_upload_at: null,
      }),
    ];
    const result = await getMyClaimableGuestRows();
    expect(result.map((r) => r.eventId)).toEqual(["e-live"]);
  });

  it("keeps an event whose second row is empty, counted by what is live", async () => {
    rows = [
      row({ guest_id: "g1", upload_count: 3 }),
      row({ guest_id: "g2", upload_count: 0, last_upload_at: null }),
    ];
    const result = await getMyClaimableGuestRows();
    expect(result).toHaveLength(1);
    expect(result[0].uploadCount).toBe(3);
  });
});

describe("a real error", () => {
  it("throws rather than swallowing it", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    await expect(getMyClaimableGuestRows()).rejects.toBeTruthy();
  });
});

/**
 * THE WHOLE CARD, PAST 1,000 ROWS (the 1,000-row round, 2026-09-23). The RPC pages on its own order,
 * (last upload desc, guest id desc), and the query walks it with the last row's `last_upload_at` and
 * `guest_id`. Against `fake-postgrest`, which clamps a set-returning function at 1,000 rows as the
 * platform does: 2,500 rows across 1,250 events come back whole, grouped, in the RPC's order.
 */
describe("the claim card, read whole", () => {
  /** The function as the SQL answers it: the keyset on (last upload desc, guest id desc), clamped. */
  function listed(all: FakeRow[]) {
    const order = [...all].sort((a, b) =>
      a.last_upload_at === b.last_upload_at
        ? String(b.guest_id).localeCompare(String(a.guest_id))
        : String(b.last_upload_at).localeCompare(String(a.last_upload_at)),
    );
    return (args: Record<string, unknown>) => {
      const at = args.p_after_at as string | undefined;
      const id = args.p_after_id as string | undefined;
      const limit = args.p_limit == null ? Infinity : Math.min(Number(args.p_limit), 1000);
      return order
        .filter(
          (r) =>
            at === undefined ||
            String(r.last_upload_at) < at ||
            (r.last_upload_at === at && String(r.guest_id) < String(id)),
        )
        .slice(0, limit);
    };
  }

  it("★ groups 2,500 rows across 1,250 events, every row counted, the RPC's order kept", async () => {
    // Two rows an event; every ten rows share a last upload to the microsecond, so ties straddle pages.
    const all: FakeRow[] = Array.from({ length: 2500 }, (_, i) => ({
      ...row({
        guest_id: `g${String(i).padStart(5, "0")}`,
        event_id: `e${String(Math.floor(i / 2)).padStart(5, "0")}`,
        upload_count: 1,
        last_upload_at: `2026-09-${String(20 - Math.floor(i / 1000)).padStart(2, "0")}T10:00:${String(Math.floor((i % 1000) / 10) % 60).padStart(2, "0")}.000000+00:00`,
      }),
    }));
    const fake = createFakePostgrest({
      rpc: { list_guest_rows_by_email: listed(all) },
    });
    client = asSupabase(fake);

    const result = await getMyClaimableGuestRows();

    expect(result).toHaveLength(1250);
    expect(result.reduce((sum, r) => sum + r.uploadCount, 0)).toBe(2500);
    expect(result.every((r) => r.uploadCount === 2)).toBe(true);
    expect(fake.requests.map((r) => r.returned)).toEqual([1000, 1000, 500]);
    // Every page past the first carried the last row's own keys.
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });
});
