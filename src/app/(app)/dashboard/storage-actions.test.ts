/**
 * THE SIZE LIST'S AND THE STORAGE CHART'S SERVER FUNCTIONS AT THEIR BOUNDARY: each is a public endpoint, so each
 * refuses what is not a list, a selection past the cap, a setting that is not one or a signed-out caller before
 * anything runs; a deletion for good goes one event at a time through the album's own Remove and then its own Delete
 * permanently, and names what it already did when a later event fails; Empty Deleted and the setting ride the
 * request's own client, so RLS and `auth.uid()` hold.
 *
 * ★ RESHAPED ON PURPOSE (trash-in-storage, 2026-10-03; scar kept: one event at a time, the events already done named,
 * a full selection refused in words, nothing before `getUser()`). The list's Remove to Deleted and its Undo retired:
 * Deleted counts in storage, so the act that frees room is Delete for good, which has no Undo.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/** The request's client, as far as the two chart acts reach it. */
const rpc = vi.fn();
const update = vi.fn();
const client = {
  rpc: (...a: unknown[]) => rpc(...a),
  from: (table: string) => ({
    update: (values: unknown) => ({
      eq: (column: string, value: unknown) => ({
        select: () => ({
          maybeSingle: () => update(table, values, column, value),
        }),
      }),
    }),
  }),
};

let user: { id: string } | null = { id: "host" };
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ supabase: client, user }),
}));

const readPage = vi.fn();
const readEvents = vi.fn();
vi.mock("@/lib/db/queries/storage-list", () => ({
  readStoragePage: (...a: unknown[]) => readPage(...a),
  readStorageEvents: (...a: unknown[]) => readEvents(...a),
  toStorageItems: async (rows: unknown[]) => rows,
}));
vi.mock("@/lib/db/queries/storage", () => ({
  readHostStorageSummary: async () => ({
    activeBytes: 42,
    deletedBytes: 8,
    systemBytes: 0,
    storedBytes: 50,
  }),
}));

const removeBulk = vi.fn();
const purgeNow = vi.fn();
vi.mock("@/lib/db/mutations/media", () => ({
  removeMediaBulk: (...a: unknown[]) => removeBulk(...a),
  purgeMediaNow: (...a: unknown[]) => purgeNow(...a),
}));

const captured: unknown[] = [];
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...a: unknown[]) => captured.push(a),
}));

import {
  deleteStorageItemsAction,
  emptyDeletedAction,
  readStorageListAction,
  setMakeRoomFromDeletedAction,
} from "./storage-actions";

const A = "10000000-0000-4000-8000-000000000001";
const B = "10000000-0000-4000-8000-000000000002";
const id = (n: number) =>
  `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

beforeEach(() => {
  user = { id: "host" };
  readPage.mockReset().mockResolvedValue({ rows: [], next: null });
  readEvents.mockReset().mockResolvedValue([]);
  removeBulk.mockReset().mockResolvedValue({ ok: true, data: { count: 1 } });
  purgeNow
    .mockReset()
    .mockImplementation(async (_event: string, ids: string[]) => ({
      ok: true,
      data: { purged: ids.length },
    }));
  rpc.mockReset().mockResolvedValue({
    data: { ok: true, items: 3, events: 1, freed_bytes: 900 },
    error: null,
  });
  update
    .mockReset()
    .mockResolvedValue({
      data: { make_room_from_deleted: false },
      error: null,
    });
  captured.length = 0;
});

describe("the read", () => {
  it("carries the overview only when asked: what she stores, and what of it is in Deleted", async () => {
    const first = await readStorageListAction({ withOverview: true });
    expect(first).toMatchObject({
      ok: true,
      overview: { storedBytes: 50, deletedBytes: 8 },
    });
    const next = await readStorageListAction({
      after: { bytes: 10, id: id(1) },
    });
    expect(next).toMatchObject({ ok: true, overview: null });
    expect(readEvents).toHaveBeenCalledTimes(1);
  });

  it("refuses a cursor that is not a size and an id", async () => {
    for (const ask of [
      { after: { bytes: 1.5, id: id(1) } },
      { after: { bytes: 1, id: "1),or(id.gt.0" } },
      { eventId: "not-an-id" },
    ]) {
      expect(await readStorageListAction(ask)).toMatchObject({
        ok: false,
        code: "validation",
      });
    }
    expect(readPage).not.toHaveBeenCalled();
  });

  it("refuses a signed-out caller", async () => {
    user = null;
    expect(await readStorageListAction({})).toMatchObject({
      ok: false,
      code: "unauthorized",
    });
  });

  it("says a failed read is a failure, never an empty account", async () => {
    readPage.mockRejectedValue(new Error("down"));
    expect(await readStorageListAction({ withOverview: true })).toMatchObject({
      ok: false,
      code: "unknown",
    });
    expect(captured).toHaveLength(1);
  });
});

describe("Delete for good", () => {
  it("goes one event at a time: the album's Remove, then its Delete permanently, for the same ids", async () => {
    const answer = await deleteStorageItemsAction([
      { id: id(1), eventId: A },
      { id: id(2), eventId: B },
      { id: id(3), eventId: A },
    ]);
    expect(answer).toEqual({ ok: true, deleted: 3 });
    expect(removeBulk.mock.calls).toEqual([
      [A, [id(1), id(3)]],
      [B, [id(2)]],
    ]);
    expect(purgeNow.mock.calls).toEqual([
      [A, [id(1), id(3)]],
      [B, [id(2)]],
    ]);
  });

  it("names the events already done when a later one fails to leave", async () => {
    removeBulk
      .mockResolvedValueOnce({ ok: true, data: { count: 1 } })
      .mockResolvedValueOnce({
        ok: false,
        code: "unknown",
        message: "Couldn't remove those items. Please try again.",
      });
    const answer = await deleteStorageItemsAction([
      { id: id(1), eventId: A },
      { id: id(2), eventId: B },
    ]);
    expect(answer).toMatchObject({ ok: false, deletedEvents: [A] });
  });

  it("says where an item is when its Delete permanently fails after its Remove: in Deleted", async () => {
    purgeNow.mockResolvedValueOnce({
      ok: false,
      code: "unknown",
      message: "Couldn't fully delete those items. Please try again.",
    });
    const answer = await deleteStorageItemsAction([{ id: id(1), eventId: A }]);
    expect(answer).toMatchObject({
      ok: false,
      deletedEvents: [],
      message: expect.stringMatching(/in Deleted/),
    });
    expect(captured).toHaveLength(1);
  });

  it("refuses a selection past the cap in words, and anything not a selection", async () => {
    const many = Array.from({ length: 2_001 }, (_, i) => ({
      id: id(i),
      eventId: A,
    }));
    expect(await deleteStorageItemsAction(many)).toMatchObject({
      ok: false,
      code: "validation",
      message: expect.stringMatching(/2,000/),
    });
    expect(
      await deleteStorageItemsAction([{ id: "x", eventId: A }]),
    ).toMatchObject({ ok: false, code: "validation" });
    expect(await deleteStorageItemsAction([])).toMatchObject({ ok: false });
    expect(removeBulk).not.toHaveBeenCalled();
    expect(purgeNow).not.toHaveBeenCalled();
  });

  it("refuses a signed-out caller before any write", async () => {
    user = null;
    expect(
      await deleteStorageItemsAction([{ id: id(1), eventId: A }]),
    ).toMatchObject({ ok: false, code: "unauthorized" });
    expect(removeBulk).not.toHaveBeenCalled();
  });
});

describe("Empty Deleted", () => {
  it("asks empty_deleted on her own client and answers what left", async () => {
    expect(await emptyDeletedAction()).toEqual({
      ok: true,
      items: 3,
      events: 1,
      freedBytes: 900,
    });
    expect(rpc).toHaveBeenCalledWith("empty_deleted");
  });

  it("says a refused or failed call is a failure, and reports it", async () => {
    rpc.mockResolvedValueOnce({
      data: { ok: false, reason: "unauthorized" },
      error: null,
    });
    expect(await emptyDeletedAction()).toMatchObject({
      ok: false,
      code: "unknown",
    });
    rpc.mockResolvedValueOnce({ data: null, error: { message: "down" } });
    expect(await emptyDeletedAction()).toMatchObject({ ok: false });
    expect(captured).toHaveLength(2);
  });

  it("refuses a signed-out caller before the call", async () => {
    user = null;
    expect(await emptyDeletedAction()).toMatchObject({
      ok: false,
      code: "unauthorized",
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("Make room from Deleted", () => {
  it("writes her own row and answers what the database holds", async () => {
    expect(await setMakeRoomFromDeletedAction(false)).toEqual({
      ok: true,
      on: false,
    });
    expect(update).toHaveBeenCalledWith(
      "profiles",
      { make_room_from_deleted: false },
      "id",
      "host",
    );
  });

  it("refuses what is not a setting, and a signed-out caller, before any write", async () => {
    expect(await setMakeRoomFromDeletedAction("off")).toMatchObject({
      ok: false,
      code: "validation",
    });
    user = null;
    expect(await setMakeRoomFromDeletedAction(true)).toMatchObject({
      ok: false,
      code: "unauthorized",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("says a write it cannot read back is a failure", async () => {
    update.mockResolvedValueOnce({ data: null, error: { message: "denied" } });
    expect(await setMakeRoomFromDeletedAction(true)).toMatchObject({
      ok: false,
      code: "unknown",
    });
  });
});
