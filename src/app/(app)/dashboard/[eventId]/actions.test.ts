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

const revalidated: string[] = [];
let signedIn = true;
const getEvent = vi.fn();
const readHubReel = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidated.push(path),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: () => {} }) }));
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
    restoreMedia: async () => ok,
    setMediaStatus: async () => ok,
    setMediaStatusBulk: spy("setMediaStatusBulk"),
  };
});
vi.mock("@/lib/db/queries/events", () => ({
  getEvent: (...a: unknown[]) => getEvent(...a),
}));
vi.mock("@/lib/db/queries/album-host", () => ({
  readHostManifestPage: async () => ({ entries: [], next: null }),
}));
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  getLiveReelServerFacts: async () => ({ liveReelEnabled: true }),
}));
vi.mock("@/lib/event/host-album.server", () => ({
  readRestOfManifest: async (
    _s: unknown,
    _e: string,
    first: { entries: unknown[] },
  ) => first.entries,
  readHubReel: (...a: unknown[]) => readHubReel(...a),
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
};

beforeEach(() => {
  vi.clearAllMocks();
  calls.length = 0;
  revalidated.length = 0;
  signedIn = true;
  getEvent.mockResolvedValue({
    id: "e0000000-0000-4000-8000-000000000001",
    show_reel: true,
  });
  readHubReel.mockResolvedValue({
    state: "live",
    have: 2,
    stills: ["https://r2.test/a?sig"],
    stillIds: ["a"],
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
 * album is a client store now: its caller catches the store up instead. Review's two bulk verbs still
 * revalidate, because that room renders its queue on the server.
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

  it("Review's approve and hide still do", async () => {
    await actions.approveBulkAction("ev-1", ids(2));
    await actions.hideBulkAction("ev-1", ids(2));
    expect(revalidated).toEqual(["/dashboard/ev-1", "/dashboard/ev-1"]);
  });
});

describe("refreshHubReelAction", () => {
  const EVENT = "e0000000-0000-4000-8000-000000000001";

  it("answers the owner the card read off the album", async () => {
    expect(await actions.refreshHubReelAction(EVENT)).toEqual({
      ok: true,
      reel: {
        state: "live",
        have: 2,
        stills: ["https://r2.test/a?sig"],
        stillIds: ["a"],
      },
    });
  });

  it("refuses a malformed id, no session and anyone's event but the caller's, with no hint", async () => {
    expect(await actions.refreshHubReelAction("not-an-id")).toEqual({
      ok: false,
    });
    signedIn = false;
    expect(await actions.refreshHubReelAction(EVENT)).toEqual({ ok: false });
    signedIn = true;
    getEvent.mockResolvedValue(null);
    expect(await actions.refreshHubReelAction(EVENT)).toEqual({ ok: false });
    expect(readHubReel).not.toHaveBeenCalled();
  });
});
