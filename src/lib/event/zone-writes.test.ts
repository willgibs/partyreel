/**
 * THE PARTY'S ZONE, AS THE HOST'S WRITES STORE IT (`createEvent`, `updateEvent`; event-zone): captured at birth, written
 * where a row has none with her next save of a time, and moved only by her chosen city. A recording fake stands in for
 * the query builder, because the write is the contract (which column rides which write, and when) and no type-check
 * verifies that.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEventSchema, updateEventSchema } from "@/lib/validation/event";

vi.mock("server-only", () => ({}));
const sentry = vi.hoisted(() => ({
  captureError: vi.fn(),
  captureWarning: vi.fn(),
}));
vi.mock("@/lib/observability/sentry", () => sentry);

type Call = {
  op: "insert" | "update" | "select";
  payload: Record<string, unknown> | undefined;
  filters: [string, string, unknown][];
};
const calls: Call[] = [];
/** The row the save's own write answers with: a test hands one with a zone or none (`select("*")` answers a column with no value as null). */
let row: Record<string, unknown> = { id: "event-1", time_zone: null };
/** What the fill (a write awaited with no `single`) answers. */
let fillError: { code: string; message: string } | null = null;

function eventsBuilder() {
  const call: Call = { op: "select", payload: undefined, filters: [] };
  calls.push(call);
  const builder = {
    insert(payload: Record<string, unknown>) {
      call.op = "insert";
      call.payload = payload;
      return builder;
    },
    update(payload: Record<string, unknown>) {
      call.op = "update";
      call.payload = payload;
      return builder;
    },
    select: () => builder,
    eq(column: string, value: unknown) {
      call.filters.push(["eq", column, value]);
      return builder;
    },
    is(column: string, value: unknown) {
      call.filters.push(["is", column, value]);
      return builder;
    },
    single: () => Promise.resolve({ data: row, error: null }),
    then(resolve: (v: { data: null; error: typeof fillError }) => unknown) {
      return Promise.resolve({ data: null, error: fillError }).then(resolve);
    },
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

const { createEvent, updateEvent } = await import("@/lib/db/mutations/events");

beforeEach(() => {
  calls.length = 0;
  row = { id: "event-1", time_zone: null };
  fillError = null;
  sentry.captureError.mockClear();
  sentry.captureWarning.mockClear();
});

describe("createEvent: the party's zone from birth is hers, captured", () => {
  it("stores the zone her browser named, as named", async () => {
    await createEvent(
      createEventSchema.parse({
        name: "Maya's 30th",
        captured_zone: "Asia/Kolkata",
      }),
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]!.payload).toMatchObject({
      name: "Maya's 30th",
      time_zone: "Asia/Kolkata",
    });
  });

  it("★ a zone the runtime cannot read is refused: stored as none, and said, never silent", async () => {
    const result = await createEvent(
      createEventSchema.parse({
        name: "Maya's 30th",
        captured_zone: "Etc/Unknown",
      }),
    );
    expect(result.ok).toBe(true);
    expect(calls[0]!.payload).not.toHaveProperty("time_zone");
    expect(sentry.captureWarning).toHaveBeenCalledWith(
      "other",
      expect.stringContaining("zone the server cannot read"),
      { seam: "create", zone: "Etc/Unknown" },
    );
  });

  it("a create that names no zone names no column", async () => {
    await createEvent(createEventSchema.parse({ name: "Maya's 30th" }));
    expect(calls[0]!.payload).not.toHaveProperty("time_zone");
    expect(sentry.captureWarning).not.toHaveBeenCalled();
  });
});

describe("updateEvent: a date edit never moves the party's zone; only the chosen city does", () => {
  it("★ a date saved from another zone, on a party that has one: the dates alone, and no second write", async () => {
    row = { id: "event-1", time_zone: "Pacific/Auckland" };
    const result = await updateEvent(
      "event-1",
      updateEventSchema.parse({
        event_date: "2026-10-10",
        captured_zone: "Europe/London",
      }),
    );
    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.payload).toEqual({ event_date: "2026-10-10" });
  });

  it("★ a party with no zone takes hers with its dates, written only where the row still has none", async () => {
    const result = await updateEvent(
      "event-1",
      updateEventSchema.parse({
        event_date: "2026-10-10",
        captured_zone: "Europe/London",
      }),
    );
    expect(calls).toHaveLength(2);
    expect(calls[0]!.payload).toEqual({ event_date: "2026-10-10" });
    expect(calls[1]).toEqual({
      op: "update",
      payload: { time_zone: "Europe/London" },
      filters: [
        ["eq", "id", "event-1"],
        ["is", "deleted_at", null],
        ["is", "time_zone", null],
      ],
    });
    expect(
      result.ok && (result.data as Record<string, unknown>).time_zone,
    ).toBe("Europe/London");
  });

  it("the chosen city moves the zone in the save itself, whatever was captured beside it", async () => {
    row = { id: "event-1", time_zone: "Europe/London" };
    await updateEvent(
      "event-1",
      updateEventSchema.parse({
        time_zone: "America/Mexico_City",
        captured_zone: "Europe/London",
      }),
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]!.payload).toEqual({ time_zone: "America/Mexico_City" });
  });

  it("a captured zone the runtime cannot read fills nothing, and is said", async () => {
    await updateEvent(
      "event-1",
      updateEventSchema.parse({
        event_date: "2026-10-10",
        captured_zone: "Etc/Unknown",
      }),
    );
    expect(calls).toHaveLength(1);
    expect(sentry.captureWarning).toHaveBeenCalledWith(
      "other",
      expect.stringContaining("zone the server cannot read"),
      { seam: "update", zone: "Etc/Unknown" },
    );
  });

  it("a fill that fails is reported, and never refuses the save that already landed", async () => {
    fillError = {
      code: "57014",
      message: "canceling statement due to statement timeout",
    };
    const result = await updateEvent(
      "event-1",
      updateEventSchema.parse({
        event_date: "2026-10-10",
        captured_zone: "Europe/London",
      }),
    );
    expect(result.ok).toBe(true);
    expect(sentry.captureError).toHaveBeenCalledWith("db", fillError, {
      seam: "event_zone_fill",
      eventId: "event-1",
    });
  });

  it("a save of anything else names no zone at all", async () => {
    await updateEvent(
      "event-1",
      updateEventSchema.parse({ qr_style: "rounded" }),
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]!.payload).toEqual({ qr_style: "rounded" });
  });
});
