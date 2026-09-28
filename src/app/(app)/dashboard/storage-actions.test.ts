/**
 * THE SIZE LIST'S SERVER FUNCTIONS AT THEIR BOUNDARY: each is a public endpoint, so each refuses
 * what is not a list, a selection past the cap or a signed-out caller before anything runs; a
 * removal goes one event at a time through the album's own bulk remove and names what it already
 * did when a later event fails; an Undo restores each item through `restore_media` and names what
 * the plan had no room for.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let user: { id: string } | null = { id: "host" };
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ supabase: {}, user }),
}));

const readPage = vi.fn();
const readEvents = vi.fn();
vi.mock("@/lib/db/queries/storage-list", () => ({
  readStoragePage: (...a: unknown[]) => readPage(...a),
  readStorageEvents: (...a: unknown[]) => readEvents(...a),
  toStorageItems: async (rows: unknown[]) => rows,
}));
vi.mock("@/lib/db/queries/storage", () => ({
  readHostStorageSummary: async () => ({ activeBytes: 42, standbyBytes: 0 }),
}));

const removeBulk = vi.fn();
const restore = vi.fn();
vi.mock("@/lib/db/mutations/media", () => ({
  removeMediaBulk: (...a: unknown[]) => removeBulk(...a),
  restoreMedia: (...a: unknown[]) => restore(...a),
}));

const captured: unknown[] = [];
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...a: unknown[]) => captured.push(a),
}));

import {
  readStorageListAction,
  removeStorageItemsAction,
  restoreStorageItemsAction,
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
  restore.mockReset().mockResolvedValue({ ok: true, data: { id: "" } });
  captured.length = 0;
});

describe("the read", () => {
  it("carries the overview only when asked, and the storage guard's own figure", async () => {
    const first = await readStorageListAction({ withOverview: true });
    expect(first).toMatchObject({ ok: true, overview: { storedBytes: 42 } });
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

describe("the removal", () => {
  it("goes one event at a time through the album's bulk remove", async () => {
    const answer = await removeStorageItemsAction([
      { id: id(1), eventId: A },
      { id: id(2), eventId: B },
      { id: id(3), eventId: A },
    ]);
    expect(answer).toEqual({ ok: true, removed: 2 });
    expect(removeBulk.mock.calls).toEqual([
      [A, [id(1), id(3)]],
      [B, [id(2)]],
    ]);
  });

  it("names the events already done when a later one fails", async () => {
    removeBulk
      .mockResolvedValueOnce({ ok: true, data: { count: 1 } })
      .mockResolvedValueOnce({
        ok: false,
        code: "unknown",
        message: "Couldn't remove those items. Please try again.",
      });
    const answer = await removeStorageItemsAction([
      { id: id(1), eventId: A },
      { id: id(2), eventId: B },
    ]);
    expect(answer).toMatchObject({ ok: false, removedEvents: [A] });
  });

  it("refuses a selection past the cap in words, and anything not a selection", async () => {
    const many = Array.from({ length: 2_001 }, (_, i) => ({
      id: id(i),
      eventId: A,
    }));
    expect(await removeStorageItemsAction(many)).toMatchObject({
      ok: false,
      code: "validation",
      message: expect.stringMatching(/2,000/),
    });
    expect(
      await removeStorageItemsAction([{ id: "x", eventId: A }]),
    ).toMatchObject({ ok: false, code: "validation" });
    expect(await removeStorageItemsAction([])).toMatchObject({ ok: false });
    expect(removeBulk).not.toHaveBeenCalled();
  });

  it("refuses a signed-out caller before any write", async () => {
    user = null;
    expect(
      await removeStorageItemsAction([{ id: id(1), eventId: A }]),
    ).toMatchObject({ ok: false, code: "unauthorized" });
    expect(removeBulk).not.toHaveBeenCalled();
  });
});

describe("Undo's restore", () => {
  it("restores each through restore_media and names what had no room", async () => {
    restore.mockImplementation(async (mediaId: string) =>
      mediaId === id(2)
        ? {
            ok: false,
            code: "insufficient_space",
            message: "Free up 3 GB to restore this, or upgrade your plan.",
          }
        : { ok: true, data: { id: mediaId } },
    );
    const answer = await restoreStorageItemsAction([id(1), id(2), id(3)]);
    expect(answer).toMatchObject({ ok: true, refused: [id(2)] });
    if (!answer.ok) throw new Error("expected ok");
    expect(answer.restored.sort()).toEqual([id(1), id(3)]);
    expect(answer.message).toMatch(/Free up/);
    // A full plan is an expected refusal, not an incident.
    expect(captured).toHaveLength(0);
  });

  it("refuses a signed-out caller and anything not a list of ids", async () => {
    expect(await restoreStorageItemsAction(["nope"])).toMatchObject({
      ok: false,
      code: "validation",
    });
    user = null;
    expect(await restoreStorageItemsAction([id(1)])).toMatchObject({
      ok: false,
      code: "unauthorized",
    });
    expect(restore).not.toHaveBeenCalled();
  });
});
