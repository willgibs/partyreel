/**
 * THE REEL'S ONE DEFAULTS WRITE REFUSES EVERYONE BUT THE HOST, AND EVERYTHING BUT A LOOK OR A STEP.
 *
 * `setReelDefaults` serves the view's "Set for everyone" and Settings' Highlight reel section. It
 * runs here through the real `updateEvent` over a recording fake of the user's Supabase client, so
 * what is pinned is the whole path: the input refusals come before any session is read, a missing
 * session is refused before any write, and a write that RLS matches to no row (anyone else's event,
 * or a deleted one) is refused rather than reported saved. The rows RLS matches are the database's
 * to decide, proved by the rolled-back check in 20260925100000_reel_host_defaults.sql.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const EVENT_ID = "5d0f0f6e-2b1a-4c1e-9a55-1f2d3c4b5a69";

type Row = {
  id: string;
  show_reel: boolean;
  reel_style_id: string | null;
  reel_hold_sec: number | null;
};

const state: {
  user: { id: string } | null;
  // What the update's `.single()` answers: the updated row, or PostgREST's no-row refusal.
  answer: { data: Row | null; error: { code: string; message: string } | null };
  clients: number;
  patches: Record<string, unknown>[];
  filters: [string, string, unknown][];
} = {
  user: null,
  answer: { data: null, error: null },
  clients: 0,
  patches: [],
  filters: [],
};

function eventsBuilder() {
  const builder = {
    update(patch: Record<string, unknown>) {
      state.patches.push(patch);
      return builder;
    },
    eq(column: string, value: unknown) {
      state.filters.push(["eq", column, value]);
      return builder;
    },
    is(column: string, value: unknown) {
      state.filters.push(["is", column, value]);
      return builder;
    },
    select: () => builder,
    single: () => Promise.resolve(state.answer),
  };
  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => {
    state.clients += 1;
    return Promise.resolve({
      auth: {
        getUser: () =>
          Promise.resolve({ data: { user: state.user }, error: null }),
      },
      from: (table: string) => {
        expect(table).toBe("events");
        return eventsBuilder();
      },
    });
  },
}));

const { setReelDefaults } = await import("@/lib/reel/defaults-action");

/** The row the host's update returns: the columns as the save left them. */
function savedRow(overrides: Partial<Row> = {}): Row {
  return {
    id: EVENT_ID,
    show_reel: true,
    reel_style_id: null,
    reel_hold_sec: null,
    ...overrides,
  };
}

beforeEach(() => {
  state.user = { id: "host-1" };
  state.answer = { data: savedRow(), error: null };
  state.clients = 0;
  state.patches = [];
  state.filters = [];
});

describe("setReelDefaults: the refusals", () => {
  it("refuses a signed-out caller before any write", async () => {
    state.user = null;
    const result = await setReelDefaults({ eventId: EVENT_ID, holdSec: 5 });
    expect(result).toMatchObject({ ok: false, code: "unauthorized" });
    expect(state.patches).toEqual([]);
  });

  it("refuses anyone else's event: RLS matches no row, and nothing reads as saved", async () => {
    // PostgREST's answer to `.single()` over an update that matched no row.
    state.answer = {
      data: null,
      error: {
        code: "PGRST116",
        message: "JSON object requested, multiple (or no) rows returned",
      },
    };
    state.user = { id: "another-host" };
    const result = await setReelDefaults({
      eventId: EVENT_ID,
      styleId: "mono",
    });
    expect(result).toMatchObject({ ok: false, code: "unknown" });
    // The write was scoped to that one live event and left the owner check to RLS.
    expect(state.filters).toEqual([
      ["eq", "id", EVENT_ID],
      ["is", "deleted_at", null],
    ]);
  });

  it("refuses an unknown look, a treatment included, before a session is read", async () => {
    for (const styleId of ["neon", "polaroid", "", "Classic"]) {
      const result = await setReelDefaults({ eventId: EVENT_ID, styleId });
      expect(result, styleId).toMatchObject({ ok: false, code: "validation" });
    }
    expect(state.clients).toBe(0);
    expect(state.patches).toEqual([]);
  });

  it("refuses a hold off the steps, never rounding it onto one", async () => {
    for (const holdSec of [2.5, 0, -1, 0.5, 30, 1e9, NaN, Infinity]) {
      const result = await setReelDefaults({ eventId: EVENT_ID, holdSec });
      expect(result, String(holdSec)).toMatchObject({
        ok: false,
        code: "validation",
      });
    }
    expect(state.clients).toBe(0);
  });

  it("refuses what a hostile client sends in place of the types", async () => {
    for (const input of [
      { eventId: "event-1", holdSec: 3 },
      { eventId: EVENT_ID, holdSec: "3" },
      { eventId: EVENT_ID, showReel: "false" },
      { eventId: EVENT_ID, styleId: 7 },
      null,
      "classic",
    ]) {
      const result = await setReelDefaults(input as never);
      expect(result, JSON.stringify(input)).toMatchObject({
        ok: false,
        code: "validation",
      });
    }
    expect(state.clients).toBe(0);
  });

  it("refuses a call that sets nothing", async () => {
    const result = await setReelDefaults({ eventId: EVENT_ID });
    expect(result).toEqual({
      ok: false,
      code: "validation",
      message: "Nothing to save.",
    });
    expect(state.clients).toBe(0);
  });
});

describe("setReelDefaults: the host's saves", () => {
  it("writes the one column a pick sets, and answers what the row now holds", async () => {
    state.answer = { data: savedRow({ reel_hold_sec: 2.2 }), error: null };
    const result = await setReelDefaults({ eventId: EVENT_ID, holdSec: 2.2 });
    expect(state.patches).toEqual([{ reel_hold_sec: 2.2 }]);
    expect(result).toEqual({
      ok: true,
      defaults: { showReel: true, styleId: null, holdSec: 2.2 },
    });
  });

  it("maps each field to its column, and null hands a setting back to the default", async () => {
    await setReelDefaults({ eventId: EVENT_ID, showReel: false });
    await setReelDefaults({ eventId: EVENT_ID, styleId: "golden" });
    await setReelDefaults({ eventId: EVENT_ID, styleId: null, holdSec: null });
    expect(state.patches).toEqual([
      { show_reel: false },
      { reel_style_id: "golden" },
      { reel_style_id: null, reel_hold_sec: null },
    ]);
  });

  it("can never carry another setting: every other key is dropped before the write", async () => {
    await setReelDefaults({
      eventId: EVENT_ID,
      holdSec: 7,
      visibility: "open",
      moderation_mode: "live",
      accepting_uploads: true,
      reel_style_id: "noir",
    } as never);
    expect(state.patches).toEqual([{ reel_hold_sec: 7 }]);
  });
});
