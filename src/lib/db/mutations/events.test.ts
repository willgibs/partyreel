/**
 * THE HOST'S EVENT WRITE PATCHES EXACTLY WHAT THE SAVE CARRIED.
 *
 * `updateEvent` writes every key that is defined, so the schema in front of it decides what a
 * save touches. A one-field save (the QR designer's `{ qr_style }`, the review room's
 * `{ moderation_mode }`) must reach the database as that one column: any other key in the patch
 * is a setting the host never moved (a password album opened, paused uploads reopened, held
 * uploads approved). A recording fake stands in for the query builder, because the PATCH is the
 * contract and no type-check verifies it.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateEventSchema } from "@/lib/validation/event";

vi.mock("server-only", () => ({}));

const patches: Record<string, unknown>[] = [];
const reads: string[] = [];
/** What the next write answers with: the database's own refusal, where a test hands one. */
let nextError: { code: string; message: string } | null = null;

function eventsBuilder() {
  const builder = {
    update(patch: Record<string, unknown>) {
      patches.push(patch);
      return builder;
    },
    select(columns: string) {
      reads.push(columns);
      return builder;
    },
    eq: () => builder,
    is: () => builder,
    single: () => {
      const error = nextError;
      nextError = null;
      return Promise.resolve(
        error
          ? { data: null, error }
          : { data: { id: "event-1" }, error: null },
      );
    },
    maybeSingle: () =>
      Promise.resolve({
        data: { event_password_hash: "$2b$hash" },
        error: null,
      }),
  };
  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        getUser: () =>
          Promise.resolve({ data: { user: { id: "host-1" } }, error: null }),
      },
      from: () => eventsBuilder(),
    }),
}));

const { updateEvent } = await import("@/lib/db/mutations/events");
const { APPROVAL_NEVER_WITH_A_DEVELOP } =
  await import("@/lib/disposable/album-style");

beforeEach(() => {
  patches.length = 0;
  reads.length = 0;
  nextError = null;
});

describe("updateEvent: the patch is the save, nothing more", () => {
  it("writes one column for a QR style save", async () => {
    const result = await updateEvent(
      "event-1",
      updateEventSchema.parse({ qr_style: "rounded" }),
    );
    expect(result.ok).toBe(true);
    expect(patches).toEqual([{ qr_style: "rounded" }]);
  });

  it("writes one column for the review room's switch", async () => {
    await updateEvent(
      "event-1",
      updateEventSchema.parse({ moderation_mode: "hold_for_approval" }),
    );
    expect(patches).toEqual([{ moderation_mode: "hold_for_approval" }]);
  });

  it("writes an empty patch for an empty save (it invents no setting)", async () => {
    await updateEvent("event-1", updateEventSchema.parse({}));
    expect(patches).toEqual([{}]);
  });

  it("writes every field a whole-form save sends, each as sent", async () => {
    await updateEvent(
      "event-1",
      updateEventSchema.parse({
        name: "Backyard party",
        description: "",
        event_date: "",
        visibility: "private",
        accepting_uploads: false,
        require_verified_email: false,
        require_upload_to_view: true,
        moderation_mode: "hold_for_approval",
        max_upload_bytes: null,
      }),
    );
    expect(patches).toEqual([
      {
        name: "Backyard party",
        description: null,
        event_date: null,
        // The one key that carries another: a cleared date takes its end with it (crumbs-59; the dates' own tests below).
        event_end_date: null,
        visibility: "private",
        accepting_uploads: false,
        require_verified_email: false,
        require_upload_to_view: true,
        moderation_mode: "hold_for_approval",
        max_upload_bytes: null,
      },
    ]);
  });
});

describe("updateEvent: the reel's defaults patch as sent", () => {
  it("writes each default alone, and null as null (back to the product's default)", async () => {
    await updateEvent("event-1", updateEventSchema.parse({ show_reel: false }));
    await updateEvent(
      "event-1",
      updateEventSchema.parse({ reel_style_id: "mono" }),
    );
    await updateEvent("event-1", updateEventSchema.parse({ reel_hold_sec: 5 }));
    await updateEvent(
      "event-1",
      updateEventSchema.parse({ reel_style_id: null, reel_hold_sec: null }),
    );
    expect(patches).toEqual([
      { show_reel: false },
      { reel_style_id: "mono" },
      { reel_hold_sec: 5 },
      { reel_style_id: null, reel_hold_sec: null },
    ]);
  });

  it("a whole-form save that never sent them writes none of them", async () => {
    await updateEvent(
      "event-1",
      updateEventSchema.parse({ name: "Backyard party", qr_style: "dots" }),
    );
    expect(patches).toEqual([{ name: "Backyard party", qr_style: "dots" }]);
  });
});

// HOW GUESTS ADD AND WHEN THE ALBUM DEVELOPS (20261002200000): the three-way "when everyone sees" is ONE save of two
// columns, so no half-state is ever stored; the database does the rest in that same save (the roll, the period, the
// rows' rewrite), so the write is the patch and nothing after it.
describe("updateEvent: the capture and the develop time", () => {
  it("writes the capture alone, and a develop answer's two columns together", async () => {
    await updateEvent(
      "event-1",
      updateEventSchema.parse({ capture: "camera" }),
    );
    const at = new Date(Date.now() + 86_400_000).toISOString();
    await updateEvent(
      "event-1",
      updateEventSchema.parse({ moderation_mode: "live", develops_at: at }),
    );
    await updateEvent(
      "event-1",
      updateEventSchema.parse({
        moderation_mode: "hold_for_approval",
        develops_at: null,
      }),
    );
    expect(patches).toEqual([
      { capture: "camera" },
      { moderation_mode: "live", develops_at: at },
      { moderation_mode: "hold_for_approval", develops_at: null },
    ]);
  });
});

// APPROVAL NEVER STANDS WITH A DEVELOP (the-wait r1, `both=never`; 20261003100000's CHECK): a save asking for both is
// refused in words before it is written, and a save that would leave the row holding both (one column sent, the other
// the row's own) is refused by the database's CHECK, read by its name, in the same words.
describe("updateEvent: approval never stands with a develop", () => {
  it("★ refuses a patch asking for both, in words, and writes nothing", async () => {
    const at = new Date(Date.now() + 86_400_000).toISOString();
    const result = await updateEvent(
      "event-1",
      updateEventSchema.parse({
        moderation_mode: "hold_for_approval",
        develops_at: at,
      }),
    );
    expect(result).toEqual({
      ok: false,
      code: "unknown",
      message: APPROVAL_NEVER_WITH_A_DEVELOP,
    });
    expect(patches).toEqual([]);
  });

  it("★ the database's refusal of the pair (the row's own develop time) reads as the same words", async () => {
    nextError = {
      code: "23514",
      message:
        'new row for relation "events" violates check constraint "events_approval_never_develops"',
    };
    const result = await updateEvent(
      "event-1",
      updateEventSchema.parse({ moderation_mode: "hold_for_approval" }),
    );
    expect(result).toEqual({
      ok: false,
      code: "unknown",
      message: APPROVAL_NEVER_WITH_A_DEVELOP,
    });
  });

  it("another CHECK's refusal stays the generic sentence (a refusal is read by its name, never guessed)", async () => {
    nextError = {
      code: "23514",
      message:
        'new row for relation "events" violates check constraint "events_roll_size_range"',
    };
    const result = await updateEvent(
      "event-1",
      updateEventSchema.parse({ capture: "camera" }),
    );
    expect(result).toEqual({
      ok: false,
      code: "unknown",
      message: "Couldn't save your changes. Please try again.",
    });
  });
});

// AN EVENT'S OPTIONAL END DATE (20261003120000): the last day travels with its first (the schema refuses one alone),
// a range said twice is stored as the one day it is, and the database's CHECK is read by its name, in words.
describe("updateEvent: the event's dates", () => {
  it("writes a range's two days together, and a date alone as the date alone", async () => {
    await updateEvent(
      "event-1",
      updateEventSchema.parse({
        event_date: "2026-10-03",
        event_end_date: "2026-10-05",
      }),
    );
    await updateEvent(
      "event-1",
      updateEventSchema.parse({ event_date: "2026-10-03" }),
    );
    expect(patches).toEqual([
      { event_date: "2026-10-03", event_end_date: "2026-10-05" },
      { event_date: "2026-10-03" },
    ]);
  });

  it("stores a range said twice as the one day it is, and a cleared pair as none", async () => {
    await updateEvent(
      "event-1",
      updateEventSchema.parse({
        event_date: "2026-10-03",
        event_end_date: "2026-10-03",
      }),
    );
    await updateEvent(
      "event-1",
      updateEventSchema.parse({ event_date: "", event_end_date: "" }),
    );
    expect(patches).toEqual([
      { event_date: "2026-10-03", event_end_date: null },
      { event_date: null, event_end_date: null },
    ]);
  });

  // red-team 47's NIT: a date cleared alone over a stored end (a stale page that never saw the end, or a crafted call) was
  // refused as "The end date can't be before the event date.", words about an end the host may not even be shown. An end
  // never stands alone, so the date's clearing carries it: the same write, never the CHECK's refusal.
  it("★ takes a cleared date's end with it, so a date cleared alone never meets the CHECK", async () => {
    await updateEvent("event-1", updateEventSchema.parse({ event_date: "" }));
    expect(patches).toEqual([{ event_date: null, event_end_date: null }]);
  });

  it("★ reads the database's refusal of a range by its name, in the schema's own words", async () => {
    nextError = {
      code: "23514",
      message:
        'new row for relation "events" violates check constraint "events_end_date_on_or_after"',
    };
    const result = await updateEvent(
      "event-1",
      updateEventSchema.parse({ event_date: "2026-10-09" }),
    );
    expect(result).toEqual({
      ok: false,
      code: "unknown",
      message: "The end date can't be before the event date.",
    });
  });
});
