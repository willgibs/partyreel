/**
 * EVERY BULK VERB REFUSES A SELECTION PAST THE CAP, IN WORDS (M13, the 1,000-row round, 2026-09-23).
 *
 * The hub's bulk actions are Server Functions, public endpoints, and each took an id list of any
 * length. The writes behind them chunk their lists now, but an endpoint that loops over whatever it
 * is handed is a work amplifier, so each action checks its list at the boundary: at most
 * MAX_BULK_ITEMS (the export's 2,000) ids, each a uuid, refused with a sentence the host can act on
 * before any write runs.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: { fn: string; ids: unknown }[] = [];
const ok = { ok: true as const, data: { count: 0, purged: 0, id: "" } };
/** What `restoreMedia` answers: where `restore_media` landed the item. */
let restored: { ok: true; data: { id: string; status?: string } } = {
  ok: true,
  data: { id: "", status: "approved" },
};

const revalidated: string[] = [];
let signedIn = true;
const getEvent = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidated.push(path),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: () => {} }),
  headers: async () => new Headers({ "x-viewer-zone": "Europe/London" }),
}));
const readGuestsRoom = vi.fn();
vi.mock("@/app/(app)/dashboard/[eventId]/guests/room.server", () => ({
  readGuestsRoom: (...a: unknown[]) => readGuestsRoom(...a),
}));
vi.mock("@/app/(app)/dashboard/actions", () => ({}));
vi.mock("@/lib/db/mutations/media", () => {
  const spy = (fn: string) => async (_eventId: string, ids: unknown) => {
    calls.push({ fn, ids });
    return ok;
  };
  return {
    approveBulk: spy("approveBulk"),
    hideBulk: spy("hideBulk"),
    purgeMediaNow: spy("purgeMediaNow"),
    removeMedia: async () => ok,
    removeMediaBulk: spy("removeMediaBulk"),
    restoreEvent: async () => ok,
    restoreMedia: async () => restored,
    returnToReview: async (_eventId: string, ids: unknown, from: string) => {
      calls.push({ fn: `returnToReview:${from}`, ids });
      return ok;
    },
    setMediaStatus: async () => ok,
    setMediaStatusBulk: spy("setMediaStatusBulk"),
  };
});
vi.mock("@/lib/db/queries/events", () => ({
  getEvent: (...a: unknown[]) => getEvent(...a),
}));
const setEventDoor = vi.fn();
vi.mock("@/lib/db/mutations/event-doors", () => ({
  setEventDoor: (...a: unknown[]) => setEventDoor(...a),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: () => {},
  captureWarning: () => {},
}));
vi.mock("@/lib/r2/presign", () => ({ presignDownload: async () => "url" }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: signedIn ? { id: "host-1" } : null },
      }),
    },
  }),
}));

const actions = await import("./actions");

const uuid = (i: number) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const ids = (n: number) => Array.from({ length: n }, (_, i) => uuid(i));
/** Undo's action reads the event, so it is handed a real id (the other verbs take any). */
const EVENT_ID = "e0000000-0000-4000-8000-000000000001";

/** Each bulk verb, as the client calls it. */
const VERBS = {
  approveBulkAction: (list: unknown) =>
    actions.approveBulkAction("ev-1", list as string[]),
  hideBulkAction: (list: unknown) =>
    actions.hideBulkAction("ev-1", list as string[]),
  setMediaStatusBulkAction: (list: unknown) =>
    actions.setMediaStatusBulkAction("ev-1", list as string[], "hidden"),
  removeMediaBulkAction: (list: unknown) =>
    actions.removeMediaBulkAction("ev-1", list as string[]),
  purgeMediaNowAction: (list: unknown) =>
    actions.purgeMediaNowAction("ev-1", list as string[]),
  returnToReviewAction: (list: unknown) =>
    actions.returnToReviewAction(EVENT_ID, list as string[], "approved"),
};

beforeEach(() => {
  vi.clearAllMocks();
  calls.length = 0;
  revalidated.length = 0;
  signedIn = true;
  getEvent.mockResolvedValue({
    id: "e0000000-0000-4000-8000-000000000001",
    moderation_mode: "hold_for_approval",
  });
});

describe.each(Object.entries(VERBS))("%s", (_name, run) => {
  it("runs a selection of exactly 2,000", async () => {
    expect(await run(ids(2000))).toEqual({ ok: true });
    expect(calls).toHaveLength(1);
    expect((calls[0].ids as string[]).length).toBe(2000);
  });

  it("refuses 2,001 in words, before any write", async () => {
    expect(await run(ids(2001))).toEqual({
      ok: false,
      code: "validation",
      message: "Select up to 2,000 items at a time.",
    });
    expect(calls).toHaveLength(0);
  });

  it("refuses a list that is not uuids, or not a list", async () => {
    for (const bad of [["not-a-uuid"], "m1,m2", null, [7]]) {
      expect(await run(bad)).toMatchObject({ ok: false, code: "validation" });
    }
    expect(calls).toHaveLength(0);
  });
});

/**
 * THE ALBUM'S OWN WRITES NO LONGER RE-RENDER THE HUB (album-host-wiring). A revalidation from a
 * Server Function re-renders the calling page in the same round trip, and the hub is the page whose
 * album is a client store now: its caller catches the store up instead. ★ Review's verbs joined them
 * (curation-wiring): they used to revalidate because that room rendered its queue on the server,
 * which re-ran the room's whole page on every verdict (a page per key press, with the keyboard).
 * The room is a store over the host's album now, so its approve, reject and Undo revalidate nothing.
 */
describe("which writes revalidate the hub", () => {
  it("the album's hide, show, remove, restore and delete-forever do not", async () => {
    await actions.setMediaStatusAction("ev-1", uuid(1), "hidden");
    await actions.removeMediaAction("ev-1", uuid(1));
    await actions.setMediaStatusBulkAction("ev-1", ids(3), "approved");
    await actions.removeMediaBulkAction("ev-1", ids(3));
    await actions.restoreMediaAction("ev-1", uuid(1));
    await actions.purgeMediaNowAction("ev-1", ids(2));
    expect(revalidated).toEqual([]);
  });

  it("nor do Review's approve, reject and Undo", async () => {
    await actions.approveBulkAction("ev-1", ids(2));
    await actions.hideBulkAction("ev-1", ids(2));
    await actions.returnToReviewAction(EVENT_ID, ids(2), "hidden");
    expect(revalidated).toEqual([]);
  });
});

/**
 * UNDO ON A VERDICT'S TOAST (host-curation `undo=undo`) puts what the verdict decided back in the
 * queue: only from the two states a verdict lands in, and never into an event that stopped reviewing
 * (a live event holds no pending media), both refused in words before any write.
 */
describe("returnToReviewAction", () => {
  it("returns an approve's or a reject's items, naming the state they left", async () => {
    expect(
      await actions.returnToReviewAction(EVENT_ID, ids(2), "approved"),
    ).toEqual({ ok: true });
    expect(
      await actions.returnToReviewAction(EVENT_ID, ids(1), "hidden"),
    ).toEqual({ ok: true });
    expect(calls.map((c) => c.fn)).toEqual([
      "returnToReview:approved",
      "returnToReview:hidden",
    ]);
  });

  it("refuses any other state, a removed one included", async () => {
    for (const from of ["removed", "pending", "", "APPROVED"]) {
      expect(
        await actions.returnToReviewAction(EVENT_ID, ids(1), from),
      ).toMatchObject({ ok: false, code: "validation" });
    }
    expect(calls).toHaveLength(0);
  });

  it("refuses an event that no longer reviews, is not the caller's, or is no id at all, before any write", async () => {
    getEvent.mockResolvedValue({ id: EVENT_ID, moderation_mode: "live" });
    expect(
      await actions.returnToReviewAction(EVENT_ID, ids(1), "approved"),
    ).toEqual({
      ok: false,
      code: "validation",
      message:
        "Review is off for this event, so there's no queue to put them back in.",
    });
    getEvent.mockResolvedValue(null);
    expect(
      await actions.returnToReviewAction(EVENT_ID, ids(1), "approved"),
    ).toMatchObject({ ok: false, code: "validation" });
    getEvent.mockResolvedValue({
      id: EVENT_ID,
      moderation_mode: "hold_for_approval",
    });
    expect(
      await actions.returnToReviewAction("not-an-id", ids(1), "approved"),
    ).toMatchObject({ ok: false, code: "validation" });
    expect(calls).toHaveLength(0);
  });
});

/**
 * A RESTORE CARRIES WHERE IT LANDED THE ITEM to the bin, which words its toast from it (a ROADMAP
 * carry-over from `crumbs-8`: a hidden item was announced as "back in the album").
 */
describe("the restore's answer", () => {
  it("carries restore_media's status through, and none when it answered none", async () => {
    restored = { ok: true, data: { id: uuid(1), status: "hidden" } };
    await expect(actions.restoreMediaAction("ev-1", uuid(1))).resolves.toEqual({
      ok: true,
      status: "hidden",
    });
    restored = { ok: true, data: { id: uuid(1) } };
    await expect(
      actions.restoreMediaAction("ev-1", uuid(1)),
    ).resolves.toMatchObject({ ok: true, status: undefined });
  });
});

describe("the door, set (event-settings r1)", () => {
  const EVENT = "11111111-2222-4333-8444-555555555555";

  it("refuses a malformed event or an unknown door at the boundary, before any write", async () => {
    const { setEventDoorAction } =
      await import("@/app/(app)/dashboard/[eventId]/actions");
    setEventDoor.mockReset();
    for (const [eventId, door] of [
      ["not-a-uuid", "open"],
      [EVENT, "wide-open"],
      [EVENT, ""],
    ]) {
      expect(await setEventDoorAction(eventId, door)).toMatchObject({
        ok: false,
        code: "validation",
      });
    }
    expect(setEventDoor).not.toHaveBeenCalled();
  });

  it("writes the door, revalidates the hub and the dashboard, and says what came with it", async () => {
    const { setEventDoorAction } =
      await import("@/app/(app)/dashboard/[eventId]/actions");
    setEventDoor.mockResolvedValue({
      ok: true,
      data: { emailHeld: true, admitted: 0 },
    });
    revalidated.length = 0;
    expect(await setEventDoorAction(EVENT, "approve")).toEqual({
      ok: true,
      emailHeld: true,
      admitted: 0,
    });
    expect(setEventDoor).toHaveBeenLastCalledWith(EVENT, "approve");
    expect(revalidated).toEqual([`/dashboard/${EVENT}`, "/dashboard"]);
  });

  it("passes a refusal on in its own words, revalidating nothing", async () => {
    const { setEventDoorAction } =
      await import("@/app/(app)/dashboard/[eventId]/actions");
    setEventDoor.mockResolvedValue({
      ok: false,
      code: "no_password",
      message: "Set a password first, then it becomes the way in.",
    });
    revalidated.length = 0;
    expect(await setEventDoorAction(EVENT, "password")).toEqual({
      ok: false,
      code: "no_password",
      message: "Set a password first, then it becomes the way in.",
    });
    expect(revalidated).toEqual([]);
  });
});

describe("readGuestsRoomAction: the Guests room, read for a card that opened it in place (`rooms=over`)", () => {
  const EVENT = "e0000000-0000-4000-8000-000000000001";
  const ROOM = {
    readAt: 1,
    items: [],
    emails: [],
    atTheDoor: [],
    doorTotal: 0,
    invited: [],
    blocked: [],
  };

  it("★ reads the room only once the session and the event (RLS) have proved the host", async () => {
    readGuestsRoom.mockResolvedValue(ROOM);
    expect(await actions.readGuestsRoomAction(EVENT)).toEqual({
      ok: true,
      room: ROOM,
    });
    expect(getEvent).toHaveBeenCalledWith(EVENT);
    expect(readGuestsRoom).toHaveBeenCalledWith(EVENT, expect.any(String));
  });

  it("answers nothing, and reads nothing, for a malformed id, no session or an event that is not hers", async () => {
    expect(await actions.readGuestsRoomAction("not-an-id")).toEqual({
      ok: false,
    });
    expect(await actions.readGuestsRoomAction({ id: EVENT })).toEqual({
      ok: false,
    });
    signedIn = false;
    expect(await actions.readGuestsRoomAction(EVENT)).toEqual({ ok: false });
    signedIn = true;
    getEvent.mockResolvedValue(null);
    expect(await actions.readGuestsRoomAction(EVENT)).toEqual({ ok: false });
    expect(readGuestsRoom).not.toHaveBeenCalled();
  });

  it("a read that fails answers nothing, never the page's error", async () => {
    readGuestsRoom.mockRejectedValue(new Error("down"));
    expect(await actions.readGuestsRoomAction(EVENT)).toEqual({ ok: false });
  });

  it("writes nothing and revalidates nothing", async () => {
    readGuestsRoom.mockResolvedValue(ROOM);
    await actions.readGuestsRoomAction(EVENT);
    expect(revalidated).toEqual([]);
    expect(calls).toEqual([]);
  });
});
