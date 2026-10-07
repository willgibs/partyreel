/**
 * THE PER-EVENT BLOCK'S READS: the two questions the server asks for everyone else (which rows leave the
 * guest list, which events hold this account), read defensively off their jsonb, and the host's Blocked
 * list, whose restorable count must be the number let_back_in would move and nothing a hold could be read
 * from. (Whether one browser's ticket is blocked is `event_door_standing`'s now.)
 */
import { createHash } from "node:crypto";

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
    /** One row or none, as PostgREST's `maybeSingle` answers. */
    maybeSingle() {
      return {
        then: (resolve: (value: unknown) => unknown) =>
          b.then((answer) => {
            const { data, error } = answer as {
              data: Row[] | null;
              error: unknown;
            };
            return resolve({ data: data?.[0] ?? null, error });
          }),
      };
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
    // Both were in before the block (each has a row past the door).
    tables.guests = [
      { id: "g-sam", event_id: EVENT, user_id: "u-sam", admission: "in" },
      { id: "g-theo", event_id: EVENT, user_id: null, admission: "in" },
    ];
    // A Public album: the door is read for everyone in the list now (crumbs-27), and Only me is what changes
    // where someone who was in lands, which this describe leaves to the landing tests below.
    tables.events = [{ id: EVENT, visibility: "open", gate: null }];
  });

  it("signed out: nothing, and nothing is read", async () => {
    signedIn = false;
    await expect(getEventBlocks(EVENT, format)).resolves.toEqual([]);
    expect(reads).toEqual([]);
  });

  // ★ RESHAPED ON PURPOSE (crumbs-17, build 23's NIT-3; scar kept: the block rows are the host's own
  // read, and the admin client reads only over the ids those rows returned): where each one stands at
  // the door joins the counts and the faces, since the words of Let back in depend on it.
  it("★ the rows are the host's own read (RLS proves the event is theirs); only counts, faces and standing are admin", async () => {
    await getEventBlocks(EVENT, format);
    expect(reads.filter((r) => r.table === "event_blocks")).toEqual([
      { client: "host", table: "event_blocks" },
    ]);
    expect(
      reads
        .filter((r) => r.client === "admin")
        .map((r) => r.table)
        .sort(),
    ).toEqual(["guests", "guests", "media", "profiles"]);
  });

  it("newest first; a confirmed guest by their profile and address, a typed name by its own words and her row's colour", async () => {
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
    // A typed name is her own guest ROW's colour (small-fixes: the one the Guests list gave her before the block),
    // hashed, never the raw row id and never the name; it is the colour `seedFor("g-theo")` is everywhere else.
    expect(theo.seed).toEqual(expect.any(String));
    expect(theo.seed).not.toBe("g-theo");
    expect(theo.seed).not.toBe("Theo");
    expect(theo.seed).toBe(createHash("sha256").update("g-theo").digest("hex"));
    expect(theo).toEqual({
      id: "b-theo",
      name: "Theo",
      verified: false,
      email: null,
      avatarUrl: null,
      seed: theo.seed,
      since: "since 2026-09-27T10:00:00+00:00",
      restorable: 0,
      restorableUntil: null,
      lands: "in",
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

describe("getEventBlocks: where Let back in leaves each one (build 23's NIT-3)", () => {
  const block = (over: Row): Row => ({
    event_id: EVENT,
    user_id: null,
    email: null,
    guest_id: null,
    display_name: null,
    removed_media_ids: [],
    created_at: AT,
    ...over,
  });

  beforeEach(() => {
    tables.media = [];
    tables.profiles = [];
    tables.event_blocks = [
      // Declined at the door: her only row waits.
      block({ id: "b-wren", user_id: "u-wren", email: "wren@example.com" }),
      // Was in, then blocked: her row is in.
      block({ id: "b-sam", user_id: "u-sam", email: "sam@example.com" }),
      // Declined at the door, but her address is on the invite list.
      block({ id: "b-lou", user_id: "u-lou", email: "lou@example.com" }),
    ];
    tables.guests = [
      {
        id: "g-wren",
        event_id: EVENT,
        user_id: "u-wren",
        admission: "waiting",
      },
      { id: "g-sam", event_id: EVENT, user_id: "u-sam", admission: "in" },
      { id: "g-lou", event_id: EVENT, user_id: "u-lou", admission: "waiting" },
    ];
    tables.event_invites = [{ event_id: EVENT, email: "lou@example.com" }];
  });

  const standing = async () =>
    Object.fromEntries(
      (await getEventBlocks(EVENT, format)).map((p) => [p.id, p.lands]),
    );

  // ★ RESHAPED ON PURPOSE (host-moments r1, `let-back=straight`; scar kept: a declined newcomer is never promised the
  // album as someone who was in is). The expired reason: "a declined newcomer goes back to the door". Her ask stands,
  // so the act is Let in, which answers it (`blockedLanding`, the rule's one home; this pins what the read hands it).
  it("★ a declined newcomer whose ask stands is Let in; someone who was in comes back in", async () => {
    tables.events = [{ id: EVENT, visibility: "private", gate: "approve" }];
    await expect(standing()).resolves.toEqual({
      "b-wren": "let_in",
      "b-sam": "in",
      "b-lou": "let_in",
    });
  });

  // ★ RESHAPED ON PURPOSE (host-moments r1; scar kept: the list, while it is the door, lets a listed one straight
  // in, and the door and the list are the host's own reads). A standing ask is Let in whoever the list names, so the
  // list decides only once the asks have ended.
  it("★ the invite list, while it is the door, lets a listed one straight in, as let_back_in does", async () => {
    tables.events = [{ id: EVENT, visibility: "private", gate: "invite" }];
    await expect(standing()).resolves.toEqual({
      "b-wren": "let_in",
      "b-sam": "in",
      "b-lou": "let_in",
    });
    // The door and the list are the host's own reads, never the admin client's.
    expect(
      reads
        .filter((r) => r.table === "events" || r.table === "event_invites")
        .map((r) => r.client),
    ).toEqual(["host", "host"]);
    // With the asks ended (a password trip, then the list again), the list decides: she is in by it, Wren may ask.
    tables.guests = tables.guests.filter((g) => g.admission === "in");
    await expect(standing()).resolves.toEqual({
      "b-wren": "door",
      "b-sam": "in",
      "b-lou": "in",
    });
  });

  it("★ a newcomer whose ask a password ended meets it like anyone new, never the album she was never in (crumbs-24)", async () => {
    // The password deleted her waiting row (20260929230000), so nothing of hers is left to read: she is
    // a newcomer by having no row past the door, not by a waiting row.
    tables.events = [{ id: EVENT, visibility: "password", gate: null }];
    tables.guests = tables.guests.filter((g) => g.admission === "in");
    await expect(standing()).resolves.toEqual({
      "b-wren": "password",
      "b-sam": "in",
      "b-lou": "password",
    });
  });

  it("after the password, the door as it stands decides: asks again, Public, or nobody new", async () => {
    tables.guests = tables.guests.filter((g) => g.admission === "in");
    tables.events = [{ id: EVENT, visibility: "private", gate: "approve" }];
    expect((await standing())["b-wren"]).toBe("door");
    tables.events = [{ id: EVENT, visibility: "open", gate: null }];
    expect((await standing())["b-wren"]).toBe("in");
    tables.events = [{ id: EVENT, visibility: "private", gate: "closed" }];
    expect((await standing())["b-wren"]).toBe("out");
    tables.events = [{ id: EVENT, visibility: "private", gate: null }];
    expect((await standing())["b-wren"]).toBe("out");
  });

  // ★ RESHAPED ON PURPOSE (crumbs-27; scar kept: the door is read once and only as the host's own read): "everyone was
  // in: the door is never read" held while nothing about the door could change what Let back in promises someone who
  // was in. Only me does (it shuts even the people already in), so the door is read for everyone in the list.
  it("everyone was in, at a door a gate keeps: they come back in, and the door is read once, as the host", async () => {
    tables.events = [{ id: EVENT, visibility: "password", gate: null }];
    tables.guests = tables.guests.map((g) => ({ ...g, admission: "in" }));
    await expect(standing()).resolves.toEqual({
      "b-wren": "in",
      "b-sam": "in",
      "b-lou": "in",
    });
    expect(
      reads.filter((r) => r.table === "events").map((r) => r.client),
    ).toEqual(["host"]);
  });

  // ★ RESHAPED ON PURPOSE (crumbs-30; scar kept: a newcomer keeps her own landing, never the one of someone who was
  // in): a newcomer's standing ask at Only me was "door", and the words promised a Let in that leaves her at a
  // closed album; it is her own Only me landing. ★ AND AGAIN (host-moments r1; scar kept): the expired reason is "at
  // the door": the act is the Let in now, into the album Only me keeps shut, said before the press.
  it("★ at Only me, someone who was in is told the album is closed until the host opens it; a newcomer keeps her own landing (crumbs-27)", async () => {
    tables.events = [{ id: EVENT, visibility: "private", gate: null }];
    await expect(standing()).resolves.toEqual({
      // Their ask still stands, and the press lets them in to the album Only me keeps shut.
      "b-wren": "let_in_only_me",
      "b-sam": "only_me",
      "b-lou": "let_in_only_me",
    });
    // Everyone in: every one of them lands on the closed album.
    tables.guests = tables.guests.map((g) => ({ ...g, admission: "in" }));
    await expect(standing()).resolves.toEqual({
      "b-wren": "only_me",
      "b-sam": "only_me",
      "b-lou": "only_me",
    });
  });

  it("the door is one read however many are in the list", async () => {
    tables.events = [{ id: EVENT, visibility: "private", gate: null }];
    await getEventBlocks(EVENT, format);
    expect(reads.filter((r) => r.table === "events")).toHaveLength(1);
  });
});
