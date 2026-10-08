/**
 * A CREATE'S RETRY RETURNS THE EVENT THE FIRST TRY MADE (20261007120000, `events.create_key`; lane crumbs-88).
 *
 * Create is held as failed when its answer is lost after the server made the event, and its Try again used to make a second
 * one (a Free host's one event spent on a duplicate). The wizard sends one key with every try of a Create, and
 * `createEvent` asks for the key's event BEFORE it inserts, and once more ON ANY REFUSAL of a keyed insert (a retry that
 * raced the first try's commit meets the cap or the index, and the event that won is the answer). What fails silently: a
 * retry that inserts again, a read that is not hers, a cap refusal said over an event she made, a failed read taken for "no
 * event" (which makes the duplicate), a key that rides a Create that sent none, and a key spent on an event she has since
 * deleted (the index spans it, so this Create must go on keyless).
 *
 * The database's half (the index refuses the duplicate, the cap answers before it, a key is hers alone, the grant is
 * insert only) is the migration's own rolled-back check, at the foot of `20261007120000_event_create_key.sql`. A recording
 * fake stands in for the query builder, since what each statement names is the contract.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEventSchema } from "@/lib/validation/event";

vi.mock("server-only", () => ({}));
const captureError = vi.hoisted(() => vi.fn());
const captureWarning = vi.hoisted(() => vi.fn());
vi.mock("@/lib/observability/sentry", () => ({
  captureError,
  captureWarning,
}));

type Row = Record<string, unknown>;

const HOST = "host-1";
const KEY = "c2c20000-0000-4000-8000-0000000000a1";
const FIRST: Row = {
  id: "evt-first",
  host_id: HOST,
  name: "Maya's 30th",
  qr_token: "7f3a9c2e5b8d4f1a9e6c3b7d2a5f8e1c",
  qr_style: "classic",
  create_key: KEY,
  deleted_at: null,
};

/** What the fake database holds and what was asked of it, reset before each test. */
const db = {
  rows: [] as Row[],
  inserts: [] as Row[],
  reads: [] as Record<string, unknown>[],
  /** The error the Nth keyed read answers (1 is the first), standing in for a dropped line or a database that is down. */
  readError: null as { at: number; code: string; message: string } | null,
  /** What the insert answers: a refusal (and, for a race, the first try's row landing as it refuses) or the row. */
  onInsert: null as
    | null
    | ((row: Row) => { code: string; message: string } | null),
};

function table() {
  const filters: Record<string, unknown> = {};
  let inserted: Row | null = null;
  const builder = {
    insert(row: Row) {
      db.inserts.push(row);
      inserted = row;
      return builder;
    },
    select: () => builder,
    eq(column: string, value: unknown) {
      filters[column] = value;
      return builder;
    },
    single() {
      const row = inserted!;
      const error = db.onInsert?.(row) ?? null;
      if (error) return Promise.resolve({ data: null, error });
      const made = { id: "evt-new", qr_token: "new-token", ...row };
      db.rows.push(made);
      return Promise.resolve({ data: made, error: null });
    },
    maybeSingle() {
      db.reads.push({ ...filters });
      if (db.readError?.at === db.reads.length) {
        const { code, message } = db.readError;
        return Promise.resolve({ data: null, error: { code, message } });
      }
      const found =
        db.rows.find((row) =>
          Object.entries(filters).every(
            ([column, value]) => row[column] === value,
          ),
        ) ?? null;
      return Promise.resolve({ data: found, error: null });
    },
  };
  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        getUser: () =>
          Promise.resolve({ data: { user: { id: HOST } }, error: null }),
      },
      from: () => table(),
    }),
}));

const { createEvent } = await import("@/lib/db/mutations/events");

const VALUES = createEventSchema.parse({ name: "Maya's 30th" });
const CAP = {
  code: "23514",
  message:
    "Event limit reached for the free plan (max 1 event(s)). Delete an event or upgrade.",
};
const DUPLICATE = {
  code: "23505",
  message:
    'duplicate key value violates unique constraint "events_host_create_key_unique"',
};

beforeEach(() => {
  db.rows = [];
  db.inserts = [];
  db.reads = [];
  db.readError = null;
  db.onInsert = null;
  captureError.mockClear();
  captureWarning.mockClear();
});

describe("a retry whose first try landed", () => {
  it("★ is handed the first try's event and inserts nothing: the plan's limit is never asked of it", async () => {
    db.rows = [FIRST];
    // Were it asked, the Free host's cap would refuse a second event over the one that stands.
    db.onInsert = () => CAP;
    const result = await createEvent(VALUES, KEY);
    expect(result).toEqual({ ok: true, data: FIRST });
    expect(db.inserts).toEqual([]);
  });

  it("reads only her own event under the key: her id and the key, and no other filter", async () => {
    db.rows = [FIRST];
    await createEvent(VALUES, KEY);
    expect(db.reads).toEqual([{ host_id: HOST, create_key: KEY }]);
  });

  it("★ never hands her another host's event, whatever key she sends (the read names her own id)", async () => {
    db.rows = [{ ...FIRST, host_id: "someone-else" }];
    const result = await createEvent(VALUES, KEY);
    expect(result).toMatchObject({ ok: true });
    // Hers is a new event: the other host's row was never returned, and the key rode the insert.
    expect(db.inserts).toHaveLength(1);
    expect((result as { data: Row }).data.host_id).toBe(HOST);
  });
});

describe("a Create under a key nothing holds yet", () => {
  it("★ inserts once with the key on the row, and answers the event it made", async () => {
    const result = await createEvent(VALUES, KEY);
    expect(db.inserts).toHaveLength(1);
    expect(db.inserts[0]).toMatchObject({
      host_id: HOST,
      name: "Maya's 30th",
      create_key: KEY,
    });
    expect(result).toMatchObject({ ok: true, data: { id: "evt-new" } });
  });

  it("★ an event spent on a deleted one: the key stays on that row, so this Create goes on keyless", async () => {
    db.rows = [{ ...FIRST, deleted_at: "2026-10-07T10:00:00+00:00" }];
    const result = await createEvent(VALUES, KEY);
    expect(result).toMatchObject({ ok: true, data: { id: "evt-new" } });
    expect(db.inserts).toHaveLength(1);
    // No key on the row: the index would refuse a second one, and she deleted the first.
    expect(db.inserts[0]).not.toHaveProperty("create_key");
    // And a refusal then has no key's event to ask for again.
    db.inserts = [];
    db.reads = [];
    db.onInsert = () => CAP;
    await createEvent(VALUES, KEY);
    expect(db.reads).toHaveLength(1);
  });
});

describe("a retry that raced the first try's commit", () => {
  // The cap reads the host's profile row first (`enforce_event_limit`), so a second insert waits for the first to commit and
  // then counts it; a host with room meets the unique index (23505) instead. Either way the first try's event exists by the
  // time the refusal comes, and it is the answer.
  it.each([
    ["the cap (a Free host at her one event)", CAP],
    ["the unique index (a host with room)", DUPLICATE],
  ])(
    "★ is handed the winner's event when %s refuses the insert, never a refusal over an event she made",
    async (_name, refusal) => {
      db.onInsert = (row) => {
        // The first try lands between this Create's read and its insert.
        db.rows.push({ ...FIRST, ...row });
        return refusal;
      };
      const result = await createEvent(VALUES, KEY);
      expect(result).toMatchObject({ ok: true, data: { id: "evt-first" } });
      // Asked before the insert, and again on the refusal.
      expect(db.reads).toHaveLength(2);
      expect(db.inserts).toHaveLength(1);
    },
  );

  it("still says the plan's limit where no event stands under the key (the cap is the cap)", async () => {
    db.onInsert = () => CAP;
    const result = await createEvent(VALUES, KEY);
    expect(result).toMatchObject({ ok: false, code: "limit_reached" });
  });

  it("answers the catch-all where the refusal is nothing named, and says so where failures are read", async () => {
    db.onInsert = () => ({ code: "PGRST204", message: "no such column" });
    const result = await createEvent(VALUES, KEY);
    expect(result).toMatchObject({
      ok: false,
      code: "unknown",
      message: "Couldn't create the event. Please try again.",
    });
    expect(captureError).toHaveBeenCalledWith("db", expect.anything(), {
      seam: "create_event",
    });
  });
});

describe("a read that fails", () => {
  it("★ is never taken for 'no event': a Create that cannot tell whether its first try landed makes no second", async () => {
    db.readError = { at: 1, code: "08006", message: "connection failure" };
    const result = await createEvent(VALUES, KEY);
    expect(result).toMatchObject({ ok: false, code: "unknown" });
    expect(db.inserts).toEqual([]);
    expect(captureError).toHaveBeenCalledWith("db", expect.anything(), {
      seam: "create_key_read",
    });
  });

  it("does not hide a refusal behind the second read's own failure: the refusal is still answered, and the failure said", async () => {
    // The first read answers (no event yet); the one after the refusal fails.
    db.readError = { at: 2, code: "08006", message: "down" };
    db.onInsert = () => CAP;
    const result = await createEvent(VALUES, KEY);
    expect(result).toMatchObject({ ok: false, code: "limit_reached" });
    expect(captureError).toHaveBeenCalledWith("db", expect.anything(), {
      seam: "create_key_read",
    });
  });
});

describe("a Create that sends no key (a build before this one, a specimen)", () => {
  it("★ is the create it always was: no read, and no key column on the insert", async () => {
    const result = await createEvent(VALUES);
    expect(db.reads).toEqual([]);
    expect(db.inserts).toHaveLength(1);
    expect(db.inserts[0]).not.toHaveProperty("create_key");
    expect(result).toMatchObject({ ok: true });
  });

  it("makes a second event for a second Create, as it always did (a key is the only thing that joins two tries)", async () => {
    await createEvent(VALUES);
    await createEvent(VALUES);
    expect(db.inserts).toHaveLength(2);
  });
});
