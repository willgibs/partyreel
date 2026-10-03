import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  daysBetween,
  EARLIEST_EVENT_DAY,
  endForNewStart,
  FIRST_EVENT_YEAR,
  isSaneDay,
  LAST_EVENT_YEAR,
  LATEST_EVENT_DAY,
  shiftDay,
} from "@/lib/events/dates";

/**
 * AN EVENT'S DAYS, THE WINDOW A DATE FIELD MAY SAVE AND THE DAYS A YEAR UNDER A HUNDRED STILL COUNTS (crumbs-59, red-team
 * 47's MEDIUM). Chrome's date field fires a COMPLETE date on every keystroke of a year typed digit by digit: 0002, 0020,
 * 0202, then 2027. The field no longer saves those (`event-page.test.tsx`), and the one rule that would still let one
 * through is here: a year outside the window is never a day an event may name, however it got to the save.
 */

describe("the window an event's days may name", () => {
  it("is a century either side of the product: 1900 to 2100, both ends in", () => {
    expect(FIRST_EVENT_YEAR).toBe(1900);
    expect(LAST_EVENT_YEAR).toBe(2100);
    expect(EARLIEST_EVENT_DAY).toBe("1900-01-01");
    expect(LATEST_EVENT_DAY).toBe("2100-12-31");
    for (const day of [
      "1900-01-01",
      "1999-12-31",
      "2026-10-02",
      "2028-02-29",
      "2100-12-31",
    ]) {
      expect(isSaneDay(day), day).toBe(true);
    }
  });

  it("★ refuses every year a keystroke passes on its way to one, and the ones a slip makes after it", () => {
    for (const day of [
      // 2027, typed a digit at a time.
      "0002-10-02",
      "0020-10-02",
      "0202-10-02",
      // The century's own edges, one day out.
      "1899-12-31",
      "2101-01-01",
      // Five digits of year (a stray key past the fourth), which no `YYYY-MM-DD` reads.
      "20277-10-02",
      "275760-09-13",
    ]) {
      expect(isSaneDay(day), day).toBe(false);
    }
  });

  it("refuses what is no calendar day at all: Postgres's own infinity, a time, a word, a day the month never had, nothing", () => {
    for (const day of [
      "infinity",
      "-infinity",
      "2026-10-02T23:00:00Z",
      "next friday",
      "2026/10/02",
      "2026-02-30",
      "2027-02-29",
      "2026-13-01",
      "",
    ]) {
      expect(isSaneDay(day), day).toBe(false);
    }
    for (const value of [null, undefined, 20261002, {}, []]) {
      expect(isSaneDay(value), String(value)).toBe(false);
    }
  });
});

describe("a day is counted from its own parts, whatever the year", () => {
  // `Date.UTC` reads a year from 0 to 99 as 1900 to 1999, so "0002-10-02" was counted as 1902: a day in a field mid-keystroke
  // measured the range from the wrong century. The parts are the year they say.
  it("★ counts and moves a day in a year under a hundred as the year it says", () => {
    // The years 50 to 149: 24 leap years (100 is a century not divisible by 400), the Gregorian calendar run backwards.
    expect(daysBetween("0050-01-01", "0150-01-01")).toBe(36_524);
    // Year 0 is a leap year (divisible by 400); the year 1900 it was once read as is not.
    expect(daysBetween("0000-02-28", "0000-03-01")).toBe(2);
    expect(daysBetween("0002-10-02", "0003-10-02")).toBe(365);
    expect(shiftDay("0002-10-02", 3)).toBe("0002-10-05");
    expect(shiftDay("0099-12-31", 1)).toBe("0100-01-01");
    // 2,024 years of 365 days and the 491 leap days between them.
    expect(daysBetween("0002-10-02", "2026-10-02")).toBe(739_251);
  });

  it("keeps the dates it always counted", () => {
    expect(daysBetween("2026-10-30", "2026-11-02")).toBe(3);
    expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDay("1900-03-01", -1)).toBe("1900-02-28");
  });
});

/**
 * ★ A RANGE KEEPS ITS LENGTH WHEREVER ITS FIRST DAY GOES (crumbs-61, red-team 48's LOW). The rule had a second arm: an end
 * still after the new first day stayed ("a host moving her first day earlier keeps her Sunday"), however far the day had
 * moved, so a start retyped a YEAR earlier (2027-10-05 to 09, the year corrected to 2026) saved 2026-10-05 to 2027-10-09, a
 * range of 369 days that every guest surface then printed. RESHAPED ON PURPOSE: the scar kept is crumbs-59's (the end
 * follows the day it was SAVED from, never a stop on the way); the expired reason is the arm that kept an end where it
 * stood, which a day earlier or a year earlier could not tell apart.
 */
describe("a range follows its first day by the length it was last saved with", () => {
  it("★ is the same weekend a year on, never a range a millennium long", () => {
    // The ledger's own walk: October 2 to 4 with the year typed to 2027. The end moves with the day it was saved from.
    expect(endForNewStart("2027-10-02", "2026-10-02", "2026-10-04")).toBe(
      "2027-10-04",
    );
    // And the day typed as 12: three days, as it was.
    expect(endForNewStart("2026-10-12", "2026-10-02", "2026-10-04")).toBe(
      "2026-10-14",
    );
  });

  it("★ is the same range a year EARLIER too, never one 369 days long (red-team 48's own walk)", () => {
    // L: 2027-10-05 to 09, the start's year retyped 2026 and finished. The end used to stay in 2027.
    expect(endForNewStart("2026-10-05", "2027-10-05", "2027-10-09")).toBe(
      "2026-10-09",
    );
    // The same walk the other way, so the two directions are one rule.
    expect(endForNewStart("2027-10-05", "2026-10-05", "2026-10-09")).toBe(
      "2027-10-09",
    );
  });

  it("keeps the length in both directions, a day or a year, across a month, a year's turn and a leap day", () => {
    // Friday 2 to Sunday 4: a day earlier, inside the range, onto its own last day, a week on.
    for (const [next, end] of [
      ["2026-10-01", "2026-10-03"],
      ["2026-10-03", "2026-10-05"],
      ["2026-10-04", "2026-10-06"],
      ["2026-10-09", "2026-10-11"],
    ] as const) {
      expect(endForNewStart(next, "2026-10-02", "2026-10-04"), next).toBe(end);
      // Whatever the move, the length is what it was.
      expect(daysBetween(next, end), next).toBe(2);
    }
    expect(endForNewStart("2026-12-30", "2026-10-05", "2026-10-09")).toBe(
      "2027-01-03",
    );
    expect(endForNewStart("2028-02-27", "2027-10-05", "2027-10-09")).toBe(
      "2028-03-02",
    );
  });

  it("a cleared date takes its end with it, and an end never stands alone: one day stays one day", () => {
    expect(endForNewStart("", "2026-10-02", "2026-10-04")).toBe("");
    expect(endForNewStart("2026-10-09", "2026-10-02", "")).toBe("");
    // An end with no first day saved is no range at all (`eventDays`' own reading).
    expect(endForNewStart("2026-10-09", "", "2026-10-04")).toBe("");
    // An end that is no later than its first day reads as one day, and a moved day makes no range of it.
    expect(endForNewStart("2026-10-09", "2026-10-04", "2026-10-04")).toBe("");
    expect(endForNewStart("2026-10-09", "2026-10-04", "2026-10-02")).toBe("");
  });
});

/**
 * ★ THE CHECK STAYS FINITE (20261003200000, red-team 47's NIT). `events_end_date_on_or_after` admitted Postgres's own
 * `'infinity'` (it is on or after every date), and a `date` column holds one by a raw write; every reader fell back to one
 * day, and the app's schema never sent one. The migration says it in the database too: the end finite inside its CHECK, the
 * first day finite beside it. The rolled-back check at its foot proves it live; this holds the file's own statements.
 */
describe("the migration that keeps an event's days finite (20261003200000)", () => {
  const FILE = "20261003200000_event_dates_finite.sql";
  /** The file's executable SQL: line comments stripped (prose is not a statement), whitespace collapsed. */
  const executable = () =>
    readFileSync(
      join(__dirname, "..", "..", "..", "supabase", "migrations", FILE),
      "utf8",
    )
      .replace(/--[^\n]*/g, "")
      .replace(/\s+/g, " ");

  it("re-says the CHECK in its own name with the end finite, and puts the first day's under one beside it", () => {
    const sql = executable();
    expect(sql).toContain(
      "alter table public.events drop constraint events_end_date_on_or_after, add constraint events_end_date_on_or_after check (event_end_date is null or (event_date is not null and isfinite(event_end_date) and event_end_date >= event_date));",
    );
    expect(sql).toContain(
      "alter table public.events add constraint events_event_date_finite check (event_date is null or isfinite(event_date));",
    );
  });

  it("changes nothing else: no grant, no function, no column, no row", () => {
    expect(executable()).not.toMatch(
      /\b(grant|revoke|create function|create or replace|add column|drop column|update public|insert into public|delete from)\b/,
    );
  });
});
