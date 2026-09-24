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

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: () => {} }) }));
vi.mock("@/app/(app)/dashboard/actions", () => ({}));
vi.mock("@/lib/db/mutations/media", () => {
  const spy = (fn: string) => async (_eventId: string, ids: unknown) => {
    calls.push({ fn, ids });
    return ok;
  };
  return {
    approveAllPending: async () => ok,
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
vi.mock("@/lib/db/queries/media", () => ({
  listRecentlyDeletedMedia: async () => [],
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: () => {},
  captureWarning: () => {},
}));
vi.mock("@/lib/r2/presign", () => ({ presignDownload: async () => "url" }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "host-1" } } }) },
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
  calls.length = 0;
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
