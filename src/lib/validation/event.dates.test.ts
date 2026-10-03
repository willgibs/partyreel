import { describe, expect, it } from "vitest";

import {
  createEventSchema,
  DATE_OUT_OF_RANGE,
  DATE_UNREADABLE,
  updateEventSchema,
} from "@/lib/validation/event";

/**
 * AN EVENT'S DATES REFUSE IN A HOST'S WORDS, AND NEVER ADMIT WHAT A COLUMN CANNOT HOLD (crumbs-59, red-team 47's NITs).
 * A malformed date used to come back as zod's stock "Invalid ISO date" ("Invalid input" for a number), words no host
 * ever meets from Settings (it sends a date field's own value) but a crafted request, a stale tab or a field's five-digit
 * year does; and a year the date field passes on its way to the one she types (0002, 0020, 0202) is no day an event may
 * name. The database's CHECK (`20261003200000`) holds the same line at the column: finite days only.
 */

/** The first issue a schema reports for an input, or null when it takes it. */
const issueOf = (
  schema: {
    safeParse: (input: unknown) => {
      success: boolean;
      error?: { issues: { message: string; path: PropertyKey[] }[] };
    };
  },
  input: unknown,
) => {
  const r = schema.safeParse(input);
  return r.success ? null : (r.error?.issues[0] ?? null);
};

describe("a date that cannot be read says so in words", () => {
  it("★ is never zod's stock line", () => {
    expect(DATE_UNREADABLE).toBe(
      "That doesn't look like a date. Pick one from the calendar.",
    );
    for (const event_date of [
      "2026-13-45",
      "2026-02-30",
      "next friday",
      "2026/10/02",
      "2026-10-04T23:00:00Z",
      "infinity",
      "-infinity",
      "20277-10-02",
      20261002,
      null,
      true,
    ]) {
      const issue = issueOf(updateEventSchema, { event_date });
      expect(issue?.message, String(event_date)).toBe(DATE_UNREADABLE);
      expect(issue?.path, String(event_date)).toEqual(["event_date"]);
    }
  });

  it("says it the same on the last day, and once (never two lines for one date)", () => {
    for (const event_end_date of ["next friday", "infinity", 5, null]) {
      const r = updateEventSchema.safeParse({
        event_date: "2026-10-02",
        event_end_date,
      });
      expect(r.success, String(event_end_date)).toBe(false);
      if (!r.success) {
        expect(
          r.error.issues.map((i) => i.message),
          String(event_end_date),
        ).toEqual([DATE_UNREADABLE]);
        expect(r.error.issues[0]?.path).toEqual(["event_end_date"]);
      }
    }
  });

  it("★ refuses Postgres's own infinity, in both directions, in the first day and the last", () => {
    for (const day of ["infinity", "-infinity", "Infinity", "+infinity"]) {
      expect(
        issueOf(updateEventSchema, { event_date: day })?.message,
        day,
      ).toBe(DATE_UNREADABLE);
      expect(
        issueOf(updateEventSchema, {
          event_date: "2026-10-02",
          event_end_date: day,
        })?.message,
        day,
      ).toBe(DATE_UNREADABLE);
      expect(
        issueOf(createEventSchema, {
          name: "Weekend",
          event_date: day,
        })?.message,
        day,
      ).toBe(DATE_UNREADABLE);
    }
  });
});

describe("a year outside the window is no day an event may name", () => {
  it("says the window in words", () => {
    expect(DATE_OUT_OF_RANGE).toBe("Pick a year from 1900 to 2100.");
  });

  it("★ refuses the years a date field passes while a year is typed, and the ones past either end", () => {
    for (const day of [
      "0002-10-02",
      "0020-10-02",
      "0202-10-02",
      "1899-12-31",
      "2101-01-01",
      "9999-12-31",
    ]) {
      const first = issueOf(updateEventSchema, { event_date: day });
      expect(first?.message, day).toBe(DATE_OUT_OF_RANGE);
      expect(first?.path, day).toEqual(["event_date"]);
      const last = issueOf(updateEventSchema, {
        event_date: "2026-10-02",
        event_end_date: day,
      });
      expect(last?.message, day).toBe(DATE_OUT_OF_RANGE);
      expect(last?.path, day).toEqual(["event_end_date"]);
    }
  });

  it("takes a year at either end of the window, a range across it, and a cleared pair", () => {
    for (const input of [
      { event_date: "1900-01-01" },
      { event_date: "2100-12-31" },
      { event_date: "2026-10-02", event_end_date: "2100-12-31" },
      { event_date: "1900-01-01", event_end_date: "1900-01-03" },
      { event_date: "", event_end_date: "" },
      { event_date: "" },
    ]) {
      expect(
        updateEventSchema.safeParse(input).success,
        JSON.stringify(input),
      ).toBe(true);
    }
  });

  it("holds a create to the same window", () => {
    expect(
      createEventSchema.safeParse({ name: "Weekend", event_date: "0202-10-02" })
        .success,
    ).toBe(false);
    expect(
      createEventSchema.safeParse({ name: "Weekend", event_date: "2026-10-02" })
        .success,
    ).toBe(true);
  });

  it("still puts a last day before its first in the words it always had", () => {
    expect(
      issueOf(updateEventSchema, {
        event_date: "2026-10-05",
        event_end_date: "2026-10-03",
      })?.message,
    ).toBe("The end date can't be before the event date.");
  });
});
