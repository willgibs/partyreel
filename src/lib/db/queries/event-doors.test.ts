/**
 * THE DOORS' READS (event-settings r1, migration 20260929120000), against an in-memory PostgREST: what each
 * one sends the database, how it reads the jsonb it gets back, and that a read which fails THROWS.
 *
 *  - `readDoorStanding` and `checkInAtDoor` send the event, the account only when there is one (the generated
 *    Args make both optional, so a signed-out caller's id is omitted, never sent as null) and each ticket
 *    once, and read the standing back defensively;
 *  - the host's numbers, queue, invite list and the pulse's waiting map read their jsonb the same way: only a
 *    real number is a count, only a well-formed row is a person or an address;
 *  - `readEventGates` names each gated album's gate, in chunks that stay under the URL limit;
 *  - ★ a failed read is an error, a missing function included: there is no "today's three doors" to fall back
 *    to any more (the seam went with the applied migration, crumbs-15, 2026-09-29), and nothing here invents
 *    an answer for a read that could not be made.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  FakeRpcError,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

let fake: FakePostgrest;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const {
  checkInAtDoor,
  getDoorCounts,
  getDoorQueue,
  getHostDoorWaiting,
  getInviteList,
  readDoorStanding,
  readEventGates,
} = await import("@/lib/db/queries/event-doors");

const EVENT = "11111111-1111-4111-8111-111111111111";
const HOST = "22222222-2222-4222-8222-222222222222";

/** A database whose one function answers as given, recording every call it gets. */
function answering(fn: string, answer: unknown) {
  const calls: Record<string, unknown>[] = [];
  fake = createFakePostgrest({
    rpc: {
      [fn]: (args) => {
        calls.push(args);
        return answer;
      },
    },
  });
  return calls;
}

/** A database whose one function fails with a code. */
function failing(fn: string, code: string) {
  fake = createFakePostgrest({
    rpc: {
      [fn]: () => {
        throw new FakeRpcError(code, "the read failed");
      },
    },
  });
}

/** The codes a missing function and a broken read carry: none of them reads as an answer. */
const FAILURES = ["PGRST202", "42883", "42P01", "57014"];

beforeEach(() => {
  fake = createFakePostgrest({});
});

describe("readDoorStanding and checkInAtDoor: who this request is at this door", () => {
  const STANDING = {
    found: true,
    door: "approve",
    waiting: true,
    confirmed: true,
  };

  it("★ send the event, the account, and each ticket once, and read the standing back", async () => {
    for (const [read, fn] of [
      [readDoorStanding, "event_door_standing"],
      [checkInAtDoor, "event_door_check_in"],
    ] as const) {
      const calls = answering(fn, STANDING);
      const standing = await read(EVENT, {
        userId: "user-1",
        tickets: ["t1", "t1", "t2"],
      });
      expect(calls).toEqual([
        { p_event_id: EVENT, p_user_id: "user-1", p_tickets: ["t1", "t2"] },
      ]);
      expect(standing).toEqual({
        found: true,
        door: "approve",
        host: false,
        blocked: false,
        wasIn: false,
        in: false,
        waiting: true,
        listed: false,
        confirmed: true,
      });
    }
  });

  it("★ send no account for a signed-out caller: omitted from the wire, never sent as null", async () => {
    for (const [read, fn] of [
      [readDoorStanding, "event_door_standing"],
      [checkInAtDoor, "event_door_check_in"],
    ] as const) {
      const calls = answering(fn, STANDING);
      await read(EVENT, { userId: null, tickets: [] });
      expect(calls[0].p_user_id).toBeUndefined();
      expect(JSON.parse(JSON.stringify(calls[0]))).toEqual({
        p_event_id: EVENT,
        p_tickets: [],
      });
    }
  });

  it("read a malformed answer as a stranger at a private album, never as someone let in", async () => {
    answering("event_door_standing", "not a standing");
    await expect(
      readDoorStanding(EVENT, { userId: "user-1", tickets: [] }),
    ).resolves.toMatchObject({
      found: false,
      door: "private",
      in: false,
      host: false,
    });
  });

  it.each(FAILURES)(
    "★ throw when the read fails (%s), and never answer for the door",
    async (code) => {
      failing("event_door_standing", code);
      await expect(
        readDoorStanding(EVENT, { userId: "user-1", tickets: [] }),
      ).rejects.toMatchObject({ code });
      failing("event_door_check_in", code);
      await expect(
        checkInAtDoor(EVENT, { userId: "user-1", tickets: [] }),
      ).rejects.toMatchObject({ code });
    },
  );
});

describe("getDoorCounts: the host's numbers", () => {
  it("reads each count off the jsonb, and only a real number is one", async () => {
    const calls = answering("event_door_counts", {
      in: 31,
      in_by_name: 4,
      waiting: 2,
      waiting_listed: 1,
      invited: 24,
      joined: "many",
    });
    await expect(getDoorCounts(EVENT)).resolves.toEqual({
      in: 31,
      inByName: 4,
      waiting: 2,
      waitingListed: 1,
      invited: 24,
      joined: 0,
    });
    expect(calls).toEqual([{ p_event_id: EVENT }]);
  });

  it("★ reads the invite list's count of who is waiting, and an answer from before its migration (no such key) as zero", async () => {
    // The key is `event_door_waiting_listed`'s (20260929233000): what choosing the list as the door would
    // let in. Until that migration is applied the answer has no such key, and the door menu says nothing
    // extra rather than a number it does not have.
    answering("event_door_counts", {
      in: 1,
      waiting: 2,
      invited: 3,
      joined: 0,
    });
    await expect(getDoorCounts(EVENT)).resolves.toMatchObject({
      waiting: 2,
      waitingListed: 0,
    });
    answering("event_door_counts", { waiting: 2, waiting_listed: 2 });
    await expect(getDoorCounts(EVENT)).resolves.toMatchObject({
      waiting: 2,
      waitingListed: 2,
    });
  });

  it("reads an answer with nothing in it as zeros", async () => {
    answering("event_door_counts", null);
    await expect(getDoorCounts(EVENT)).resolves.toEqual({
      in: 0,
      inByName: 0,
      waiting: 0,
      waitingListed: 0,
      invited: 0,
      joined: 0,
    });
  });

  it.each(FAILURES)("★ throws when the read fails (%s)", async (code) => {
    failing("event_door_counts", code);
    await expect(getDoorCounts(EVENT)).rejects.toMatchObject({ code });
  });
});

describe("getDoorQueue: who waits at the door", () => {
  it("reads each waiting newcomer, and leaves a malformed row out", async () => {
    answering("event_door_queue", {
      total: 3,
      people: [
        {
          guest_id: "g1",
          user_id: "u1",
          name: "Wren",
          email: "wren@example.com",
          asked_at: "2026-09-29T10:00:00+00:00",
          seen_at: "2026-09-29T10:00:30+00:00",
        },
        { guest_id: "g2", asked_at: "2026-09-29T10:05:00+00:00" },
        { guest_id: 7, asked_at: "2026-09-29T10:06:00+00:00" },
        { guest_id: "g4" },
        null,
      ],
    });
    await expect(getDoorQueue(EVENT)).resolves.toEqual({
      total: 3,
      people: [
        {
          guestId: "g1",
          userId: "u1",
          name: "Wren",
          email: "wren@example.com",
          askedAt: "2026-09-29T10:00:00+00:00",
          seenAt: "2026-09-29T10:00:30+00:00",
        },
        {
          guestId: "g2",
          userId: null,
          name: null,
          email: null,
          askedAt: "2026-09-29T10:05:00+00:00",
          seenAt: null,
        },
      ],
    });
  });

  it.each(FAILURES)("★ throws when the read fails (%s)", async (code) => {
    failing("event_door_queue", code);
    await expect(getDoorQueue(EVENT)).rejects.toMatchObject({ code });
  });
});

describe("getInviteList: the addresses the host invited", () => {
  it("reads each address with when it was added and whether she joined", async () => {
    answering("event_invite_list", [
      {
        email: "a@example.com",
        added_at: "2026-09-29T09:00:00+00:00",
        joined: true,
      },
      { email: "b@example.com", added_at: "2026-09-29T09:01:00+00:00" },
      { email: "c@example.com" },
      { added_at: "2026-09-29T09:03:00+00:00" },
    ]);
    await expect(getInviteList(EVENT)).resolves.toEqual([
      {
        email: "a@example.com",
        addedAt: "2026-09-29T09:00:00+00:00",
        joined: true,
      },
      {
        email: "b@example.com",
        addedAt: "2026-09-29T09:01:00+00:00",
        joined: false,
      },
    ]);
  });

  it("reads anything but a list as an empty one", async () => {
    answering("event_invite_list", { email: "a@example.com" });
    await expect(getInviteList(EVENT)).resolves.toEqual([]);
  });

  it.each(FAILURES)("★ throws when the read fails (%s)", async (code) => {
    failing("event_invite_list", code);
    await expect(getInviteList(EVENT)).rejects.toMatchObject({ code });
  });
});

describe("getHostDoorWaiting: who waits at each of a host's events", () => {
  it("keeps only the events someone waits at", async () => {
    const calls = answering("host_door_waiting", {
      "event-a": 3,
      "event-b": 0,
      "event-c": "two",
      "event-d": 1,
    });
    const waiting = await getHostDoorWaiting(HOST);
    expect(Object.fromEntries(waiting)).toEqual({ "event-a": 3, "event-d": 1 });
    expect(calls).toEqual([{ p_host_id: HOST }]);
  });

  it("reads anything but an object as nobody waiting", async () => {
    answering("host_door_waiting", [["event-a", 3]]);
    await expect(getHostDoorWaiting(HOST)).resolves.toEqual(new Map());
  });

  it.each(FAILURES)("★ throws when the read fails (%s)", async (code) => {
    failing("host_door_waiting", code);
    await expect(getHostDoorWaiting(HOST)).rejects.toMatchObject({ code });
  });
});

describe("readEventGates: which private albums keep a gate", () => {
  const uuid = (i: number) =>
    `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;

  it("asks nothing for no albums", async () => {
    fake = createFakePostgrest({ tables: { events: [] } });
    await expect(readEventGates([])).resolves.toEqual(new Map());
    expect(fake.requests).toHaveLength(0);
  });

  it("names each gated album's gate and leaves an Only me album out", async () => {
    fake = createFakePostgrest({
      tables: {
        events: [
          { id: "gated", gate: "approve" },
          { id: "invite", gate: "invite" },
          { id: "only-me", gate: null },
        ],
      },
    });
    const gates = await readEventGates(["gated", "invite", "only-me", "gone"]);
    expect(Object.fromEntries(gates)).toEqual({
      gated: "approve",
      invite: "invite",
    });
  });

  it("★ reads a big list in chunks that stay under the URL limit", async () => {
    const events: FakeRow[] = Array.from({ length: 2500 }, (_, i) => ({
      id: uuid(i),
      gate: i % 5 === 0 ? "closed" : null,
    }));
    fake = createFakePostgrest({ tables: { events } });
    const gates = await readEventGates(events.map((e) => String(e.id)));
    expect(gates.size).toBe(500);
    expect(fake.requests.length).toBeGreaterThan(1);
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
    expect(Math.max(...fake.requests.map((r) => r.urlLength))).toBeLessThan(
      8000,
    );
  });

  it("★ throws when the read fails, and never reads as no gate at all", async () => {
    fake = createFakePostgrest({ tables: {} });
    const from = fake.from.bind(fake);
    fake.from = (table: string) => from(table === "events" ? "gone" : table);
    await expect(readEventGates([EVENT])).rejects.toBeTruthy();
  });
});
