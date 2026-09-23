/**
 * @contract-for: src/lib/db/queries/claims.ts
 *
 * THE GROUPING, PINNED. `list_guest_rows_by_email` returns one tuple per
 * GUEST ROW, and the same address can carry more than one row at the same
 * event (a second device, a second visit before signing in) — the claim and
 * disown RPCs both act per EVENT, so the query layer must collapse the RPC's
 * rows into one entry per event before anything renders a "Claim" button.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ supabase: { rpc }, user }),
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
