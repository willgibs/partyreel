/**
 * THE PER-EVENT BLOCK'S READS: the two questions the server asks for everyone else (which rows leave the
 * guest list, which events hold this account), read defensively off their jsonb, and the host's Blocked
 * list, whose restorable count must be the number let_back_in would move and nothing a hold could be read
 * from. (Whether one browser's ticket is blocked is `event_door_standing`'s now.)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/avatar-storage", () => ({
  getAvatarUrl: (id: string, marker: string | null) =>
    Promise.resolve(marker ? `https://cdn/avatars/${id}?v=${marker}` : null),
}));

type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {};
const rpcAnswers: Record<string, { data: unknown; error: unknown }> = {};
const rpcCalls: [string, Record<string, unknown>][] = [];
const reads: { client: "admin" | "host"; table: string }[] = [];

function builder(client: "admin" | "host", table: string) {
  reads.push({ client, table });
  let only: { column: string; values: Set<unknown> } | null = null;
  const eqs: [string, unknown][] = [];
  const b = {
    select: () => b,
    order: () => b,
    limit: () => b,
    gt: () => b,
    eq(column: string, value: unknown) {
      eqs.push([column, value]);
      return b;
    },
    in(column: string, values: unknown[]) {
      only = { column, values: new Set(values) };
      return b;
    },
    then(resolve: (value: unknown) => unknown) {
      const answer = tables[`${table}:error`];
      if (answer)
        return Promise.resolve({ data: null, error: answer[0] }).then(resolve);
      const filter = only;
      const data = (tables[table] ?? []).filter(
        (row) =>
          (!filter || filter.values.has(row[filter.column])) &&
          eqs.every(([c, v]) => row[c] === undefined || row[c] === v),
      );
      return Promise.resolve({ data, error: null }).then(resolve);
    },
  };
  return b;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => builder("admin", table),
    rpc: (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push([fn, args]);
      return Promise.resolve(
        rpcAnswers[fn] ?? {
          data: null,
          error: { code: "PGRST202", message: "no fn" },
        },
      );
    },
  }),
}));
let signedIn = true;
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({
    user: signedIn ? { id: "host-1" } : null,
    supabase: { from: (table: string) => builder("host", table) },
  }),
}));

const { getBlockedEventsFor, getBlockedGuestIds, getEventBlocks } =
  await import("@/lib/db/queries/event-blocks");

const EVENT = "event-1";
const AT = "2026-09-28T15:00:00.123456+00:00";
const format = {
  since: (iso: string) => `since ${iso}`,
  until: (iso: string) => `until ${iso}`,
};

beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k];
  for (const k of Object.keys(rpcAnswers)) delete rpcAnswers[k];
  rpcCalls.length = 0;
  reads.length = 0;
  signedIn = true;
});

// ★ RESHAPED ON PURPOSE (crumbs-15, 2026-09-29; scar kept: a broken read never impersonates "nobody is blocked").
// Three tests read "the runtime seam: the migration not yet applied reads as nothing blocked, loudly": the codes
// a missing table or function carried, and every question answering nothing blocked (the fail-OPEN answer) before
// the apply. The migration is applied and the seam went, so a missing object is a failure like any other, and
// what the third of them pinned, that anything but the missing-schema codes threw, now holds for all of them.
describe("★ any failure throws: a broken read never impersonates 'nobody is blocked'", () => {
  for (const code of ["42501", "42P01", "42883", "PGRST202", "PGRST205"]) {
    it(`code ${code}`, async () => {
      const failed = { data: null, error: { code, message: "failed" } };
      rpcAnswers.event_blocked_guest_ids = failed;
      rpcAnswers.blocked_events_for = failed;
      await expect(getBlockedGuestIds(EVENT)).rejects.toMatchObject({ code });
      await expect(getBlockedEventsFor("u1")).rejects.toMatchObject({ code });
      tables["event_blocks:error"] = [{ code, message: "failed" }];
      await expect(getEventBlocks(EVENT, format)).rejects.toMatchObject({
        code,
      });
    });
  }
});

describe("getBlockedGuestIds and getBlockedEventsFor read defensively", () => {
  it("keeps only string ids", async () => {
    rpcAnswers.event_blocked_guest_ids = {
      data: ["g1", 7, null, "g2"],
      error: null,
    };
    await expect(getBlockedGuestIds(EVENT)).resolves.toEqual(
      new Set(["g1", "g2"]),
    );
    rpcAnswers.event_blocked_guest_ids = { data: { g1: true }, error: null };
    await expect(getBlockedGuestIds(EVENT)).resolves.toEqual(new Set());
  });

  it("reads her events by id, each with only a literal true or a string", async () => {
    rpcAnswers.blocked_events_for = {
      data: {
        "e-1": { own: true, last_upload_at: AT, profile_eligible: true },
        "e-2": { own: "yes", last_upload_at: 5, profile_eligible: 1 },
        "e-3": null,
      },
      error: null,
    };
    const events = await getBlockedEventsFor("u1");
    expect(rpcCalls).toEqual([["blocked_events_for", { p_user_id: "u1" }]]);
    expect(Object.fromEntries(events)).toEqual({
      "e-1": { own: true, lastUploadAt: AT, profileEligible: true },
      "e-2": { own: false, lastUploadAt: null, profileEligible: false },
      "e-3": { own: false, lastUploadAt: null, profileEligible: false },
    });
    rpcAnswers.blocked_events_for = { data: [["e-1", {}]], error: null };
    await expect(getBlockedEventsFor("u1")).resolves.toEqual(new Map());
  });
});

describe("getEventBlocks: the host's Blocked list", () => {
  const removed = (over: Row = {}): Row => ({
    event_id: EVENT,
    status: "removed",
    removed_at: AT,
    removed_by_uploader: false,
    removed_by_admin: false,
    legal_hold_at: null,
    purge_at: "2026-10-28T15:00:00+00:00",
    ...over,
  });

  beforeEach(() => {
    tables.event_blocks = [
      {
        id: "b-sam",
        event_id: EVENT,
        user_id: "u-sam",
        email: "sam@example.com",
        guest_id: null,
        display_name: "Sam at the party",
        removed_media_ids: ["m1", "m2", "m3", "m4", "m5", "m6", "m7"],
        created_at: AT,
      },
      {
        id: "b-theo",
        event_id: EVENT,
        user_id: null,
        email: null,
        guest_id: "g-theo",
        display_name: "Theo",
        removed_media_ids: [],
        created_at: "2026-09-27T10:00:00+00:00",
      },
    ];
    tables.media = [
      // Standing: still in Deleted from this very removal.
      { id: "m1", ...removed() },
      // The same instant, written with a different precision and zone: still this removal.
      {
        id: "m2",
        ...removed({
          removed_at: "2026-09-28T17:00:00.123456+02:00",
          purge_at: "2026-10-20T00:00:00+00:00",
        }),
      },
      // Back in the album already (the host restored it by hand).
      { id: "m3", ...removed({ status: "approved", removed_at: null }) },
      // Withdrawn by its guest, an operator's takedown, held: none comes back, none is counted.
      { id: "m4", ...removed({ removed_by_uploader: true }) },
      { id: "m5", ...removed({ removed_by_admin: true }) },
      { id: "m6", ...removed({ legal_hold_at: "2026-09-28T16:00:00+00:00" }) },
      // Removed again later, by another act: not this block's to bring back.
      { id: "m7", ...removed({ removed_at: "2026-09-28T18:00:00+00:00" }) },
    ];
    tables.profiles = [
      { id: "u-sam", display_name: "Sam", avatar_updated_at: "v1" },
    ];
  });

  it("signed out: nothing, and nothing is read", async () => {
    signedIn = false;
    await expect(getEventBlocks(EVENT, format)).resolves.toEqual([]);
    expect(reads).toEqual([]);
  });

  it("★ the rows are the host's own read (RLS proves the event is theirs); only counts and faces are admin", async () => {
    await getEventBlocks(EVENT, format);
    expect(reads.filter((r) => r.table === "event_blocks")).toEqual([
      { client: "host", table: "event_blocks" },
    ]);
    expect(
      reads
        .filter((r) => r.client === "admin")
        .map((r) => r.table)
        .sort(),
    ).toEqual(["media", "profiles"]);
  });

  it("newest first; a confirmed guest by their profile and address, a typed name by its own words", async () => {
    const [sam, theo] = await getEventBlocks(EVENT, format);
    expect(sam).toMatchObject({
      id: "b-sam",
      name: "Sam",
      verified: true,
      email: "sam@example.com",
      avatarUrl: "https://cdn/avatars/u-sam?v=v1",
      since: `since ${AT}`,
    });
    expect(sam.seed).toEqual(expect.any(String));
    expect(sam.seed).not.toBe("u-sam");
    expect(theo).toEqual({
      id: "b-theo",
      name: "Theo",
      verified: false,
      email: null,
      avatarUrl: null,
      seed: null,
      since: "since 2026-09-27T10:00:00+00:00",
      restorable: 0,
      restorableUntil: null,
    });
  });

  it("★ counts what let_back_in would move: this removal's, still in Deleted, not withdrawn, taken down or held", async () => {
    const [sam] = await getEventBlocks(EVENT, format);
    expect(sam.restorable).toBe(2);
    // The first of the two to leave Deleted for good.
    expect(sam.restorableUntil).toBe("until 2026-10-20T00:00:00+00:00");
  });

  it("a held upload moves the number exactly as a withdrawn one does: a hold is never readable from it", async () => {
    const withHold = (await getEventBlocks(EVENT, format))[0].restorable;
    tables.media = tables.media.map((m) =>
      m.id === "m6"
        ? { ...m, legal_hold_at: null, removed_by_uploader: true }
        : m,
    );
    const withWithdrawal = (await getEventBlocks(EVENT, format))[0].restorable;
    expect(withHold).toBe(withWithdrawal);
  });
});
