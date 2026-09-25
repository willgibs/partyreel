/**
 * THE OWNER, AS EVERY GATE ON THE GUEST PAGE ASKS: the user from `getUser()`, then an EXPLICIT
 * `host_id` match on the RLS-scoped client, failing closed.
 *
 * The fake answers every read its filters match, which is the worst case the explicit match exists
 * for: the `events` SELECT policy also lets any signed-in viewer read an OPEN event's row, so an
 * id-only select would call every such viewer the owner.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));

/** The request's RLS-scoped client: the fake, with `auth.getUser()` answering `fake.user`. */
const db = vi.hoisted(() => ({ fake: null as FakePostgrest | null }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => asSupabase(db.fake as FakePostgrest),
}));

const { isEventOwner, isRequestOwner } =
  await import("@/lib/events/gallery-access-owner.server");

const EVENT = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const HOST = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const STRANGER = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function seed(user: { id: string } | null, urlLengthLimit?: number) {
  db.fake = createFakePostgrest({
    tables: {
      events: [
        { id: EVENT, host_id: HOST, visibility: "open" },
        { id: OTHER, host_id: STRANGER, visibility: "password" },
      ],
    },
    user,
    urlLengthLimit,
  });
}

const eventReads = () =>
  (db.fake?.requests ?? []).filter((r) => r.name === "events");

beforeEach(() => seed(null));

describe("isRequestOwner", () => {
  it("no session: not the owner, and no host read at all", async () => {
    expect(await isRequestOwner(EVENT)).toBe(false);
    expect(eventReads()).toEqual([]);
  });

  it("★ the event's host is its owner, matched on host_id", async () => {
    seed({ id: HOST });
    expect(await isRequestOwner(EVENT)).toBe(true);
    expect(eventReads()[0].filters).toEqual(
      expect.arrayContaining([
        { column: "id", op: "eq", value: EVENT },
        { column: "host_id", op: "eq", value: HOST },
      ]),
    );
  });

  it("★ a signed-in stranger is not, though the row itself is readable to them", async () => {
    seed({ id: STRANGER });
    expect(await isRequestOwner(EVENT)).toBe(false);
    // The row was never the question: the host_id match was.
    expect(eventReads()[0].filters).toContainEqual({
      column: "host_id",
      op: "eq",
      value: STRANGER,
    });
  });

  it("the host of one event is not the owner of another", async () => {
    seed({ id: HOST });
    expect(await isRequestOwner(OTHER)).toBe(false);
    seed({ id: STRANGER });
    expect(await isRequestOwner(OTHER)).toBe(true);
  });

  it("fails CLOSED on a failed host read, never a throw", async () => {
    // Every request past this length fails the way a dead connection does.
    seed({ id: HOST }, 10);
    await expect(isRequestOwner(EVENT)).resolves.toBe(false);
    expect(eventReads()[0].failed).toBe(true);
  });
});

describe("isEventOwner", () => {
  it("asks the caller's own client for exactly this event and this user", async () => {
    seed({ id: HOST });
    const client = asSupabase(db.fake as FakePostgrest);
    expect(await isEventOwner(EVENT, HOST, client)).toBe(true);
    expect(await isEventOwner(EVENT, STRANGER, client)).toBe(false);
  });
});
