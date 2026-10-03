import { describe, expect, it } from "vitest";

import {
  dateFace,
  dayOf,
  daysFrom,
  daysToEvent,
  isEvening,
  longDate,
  longDays,
  phaseOf,
  phaseOfEvent,
  spanOf,
  whenOf,
} from "./when";

/**
 * THE DASHBOARD'S CLOCK (host-dashboard r1's wiring): an event's day and phase on the viewer's own
 * calendar, and when, said in the fewest words that are still exact. Pinned at the edges that break a
 * naive version: a clock change, a year's turn, and the undated album Create makes by default.
 */

const FRIDAY = "2026-10-02";

describe("the days", () => {
  it("counts whole days by the date parts, across the clocks going back", () => {
    expect(daysFrom(FRIDAY, "2026-10-03")).toBe(1);
    expect(daysFrom(FRIDAY, "2026-09-26")).toBe(-6);
    // 25 October in Europe: a day is still a day.
    expect(daysFrom("2026-10-24", "2026-10-26")).toBe(2);
    // And a year's turn is one day, not a reset.
    expect(daysFrom("2026-12-31", "2027-01-01")).toBe(1);
  });

  it("puts a day in its phase: before, its own, the month after, and past", () => {
    expect(phaseOf("2026-10-02", FRIDAY)).toBe("live");
    expect(phaseOf("2026-10-03", FRIDAY)).toBe("before");
    expect(phaseOf("2026-09-02", FRIDAY)).toBe("after");
    expect(phaseOf("2026-09-01", FRIDAY)).toBe("past");
    expect(phaseOf(null, FRIDAY)).toBe("before");
  });
});

describe("an event's day", () => {
  it("is the date its host set, whatever its photographs say", () => {
    const e = {
      date: "2026-10-10",
      lastArrival: { at: "2026-10-02T20:00:00Z", day: FRIDAY },
    };
    expect(dayOf(e)).toBe("2026-10-10");
    expect(phaseOfEvent(e, FRIDAY)).toBe("before");
  });

  it("★ is the day its photographs last landed when nobody dated it, so a busy undated album is live", () => {
    const e = {
      date: null,
      lastArrival: { at: "2026-10-02T20:00:00Z", day: FRIDAY },
    };
    expect(dayOf(e)).toBe(FRIDAY);
    expect(phaseOfEvent(e, FRIDAY)).toBe("live");
    expect(phaseOfEvent(e, "2026-10-05")).toBe("after");
    expect(phaseOfEvent(e, "2027-01-05")).toBe("past");
  });

  it("is no day at all for an undated empty album: set up, waiting, never over", () => {
    const e = { date: null, lastArrival: null };
    expect(dayOf(e)).toBeNull();
    expect(phaseOfEvent(e, FRIDAY)).toBe("before");
  });
});

describe("when, in the fewest exact words", () => {
  it("names the near days, and Tonight only from the evening", () => {
    expect(whenOf(FRIDAY, FRIDAY)).toBe("Today");
    expect(whenOf(FRIDAY, FRIDAY, true)).toBe("Tonight");
    expect(whenOf("2026-10-03", FRIDAY)).toBe("Tomorrow");
    expect(whenOf("2026-10-01", FRIDAY)).toBe("Yesterday");
    expect(whenOf("2026-10-04", FRIDAY)).toBe("Sunday");
  });

  it("says a date for the week behind, where a weekday would read as the next one", () => {
    expect(whenOf("2026-09-26", FRIDAY)).toBe("Sat, Sep 26");
    expect(whenOf("2026-10-20", FRIDAY)).toBe("Tue, Oct 20");
  });

  it("drops the weekday past the month, and the day once a past year has turned", () => {
    expect(whenOf("2026-06-27", FRIDAY)).toBe("Jun 27");
    expect(whenOf("2025-06-07", FRIDAY)).toBe("Jun 2025");
  });

  it("keeps the day for a party to come in another year, where it still matters", () => {
    expect(whenOf("2027-01-09", FRIDAY)).toBe("Jan 9, 2027");
  });

  it("says an undated event has no date, never its photographs' day", () => {
    expect(whenOf(null, FRIDAY)).toBe("No date");
  });
});

describe("the day as a heading and a face say it", () => {
  it("heads the page with the day, and names a year that is not this one", () => {
    expect(longDate(FRIDAY)).toBe("Friday, October 2");
    expect(longDate(FRIDAY, FRIDAY)).toBe("Friday, October 2");
    expect(longDate("2026-10-02", "2027-10-02")).toBe(
      "Friday, October 2, 2026",
    );
  });

  it("sets a date face like an invitation", () => {
    expect(dateFace("2026-10-03")).toEqual({
      weekday: "Sat",
      month: "Oct",
      day: "3",
    });
  });

  it("turns today into tonight at five", () => {
    expect(isEvening(16)).toBe(false);
    expect(isEvening(17)).toBe(true);
    expect(isEvening(23)).toBe(true);
  });
});

/**
 * ★ A RANGE OF DAYS (lane `event-dates`, Will 2026-10-03): an event the host dated over several days is on its day
 * across the whole range, its month after counts from its last day, and its words say the range in the fewest that
 * are still exact. A range is a host's date, so it is never inferred: an undated album stays one day by its
 * photographs.
 */
describe("a range of days", () => {
  // A weekend wedding, Friday 2 October to Sunday 4 October.
  const WEDDING = { date: "2026-10-02", endDate: "2026-10-04", lastArrival: null };

  it("is one span by the host's dates, and one day by the photographs where she dated none", () => {
    expect(spanOf(WEDDING)).toEqual({ first: "2026-10-02", last: "2026-10-04" });
    expect(spanOf({ date: "2026-10-02", lastArrival: null })).toEqual({
      first: "2026-10-02",
      last: "2026-10-02",
    });
    expect(
      spanOf({
        date: null,
        endDate: "2026-10-04",
        lastArrival: { at: "2026-10-01T20:00:00Z", day: "2026-10-01" },
      }),
    ).toEqual({ first: "2026-10-01", last: "2026-10-01" });
    expect(spanOf({ date: null, lastArrival: null })).toBeNull();
  });

  it("★ is live on its first day, its middle and its last, and after from the day after it", () => {
    expect(phaseOfEvent(WEDDING, "2026-10-01")).toBe("before");
    expect(phaseOfEvent(WEDDING, "2026-10-02")).toBe("live");
    expect(phaseOfEvent(WEDDING, "2026-10-03")).toBe("live");
    expect(phaseOfEvent(WEDDING, "2026-10-04")).toBe("live");
    expect(phaseOfEvent(WEDDING, "2026-10-05")).toBe("after");
    // Its month after counts from its LAST day.
    expect(phaseOfEvent(WEDDING, "2026-11-03")).toBe("after");
    expect(phaseOfEvent(WEDDING, "2026-11-04")).toBe("past");
  });

  it("is so many days away: to its first day ahead, none on any day of it, from its last day behind", () => {
    expect(daysToEvent(WEDDING, "2026-09-30")).toBe(2);
    expect(daysToEvent(WEDDING, "2026-10-03")).toBe(0);
    expect(daysToEvent(WEDDING, "2026-10-04")).toBe(0);
    expect(daysToEvent(WEDDING, "2026-10-07")).toBe(-3);
    expect(daysToEvent({ date: null, lastArrival: null }, "2026-10-07")).toBeNull();
  });

  it("says where it stands on its days: Day 2 of 3", () => {
    expect(whenOf("2026-10-02", "2026-10-02", false, "2026-10-04")).toBe("Day 1 of 3");
    expect(whenOf("2026-10-02", "2026-10-03", true, "2026-10-04")).toBe("Day 2 of 3");
    expect(whenOf("2026-10-02", "2026-10-04", false, "2026-10-04")).toBe("Day 3 of 3");
  });

  it("says its weekdays inside the week ahead, its dates further off, and its month once a past year has turned", () => {
    // Seen on the Tuesday before.
    expect(whenOf("2026-10-02", "2026-09-29", false, "2026-10-04")).toBe("Fri to Sun");
    // Starting inside the week but running past it: the dates, since a weekday a week on would read as this one.
    expect(whenOf("2026-10-02", "2026-09-29", false, "2026-10-09")).toBe("Oct 2 to 9");
    expect(whenOf("2026-10-30", FRIDAY, false, "2026-11-02")).toBe("Oct 30 to Nov 2");
    expect(whenOf("2026-09-25", FRIDAY, false, "2026-09-27")).toBe("Sep 25 to 27");
    expect(whenOf("2027-01-09", FRIDAY, false, "2027-01-11")).toBe("Jan 9 to 11, 2027");
    expect(whenOf("2026-12-30", "2026-08-01", false, "2027-01-02")).toBe("Dec 30 to Jan 2");
    expect(whenOf("2025-06-06", FRIDAY, false, "2025-06-08")).toBe("Jun 2025");
  });

  it("is one day when its end is no later than its date, or unreadable", () => {
    expect(whenOf("2026-10-03", FRIDAY, false, "2026-10-03")).toBe("Tomorrow");
    expect(whenOf("2026-10-03", FRIDAY, false, "2026-10-01")).toBe("Tomorrow");
    expect(whenOf("2026-10-03", FRIDAY, false, null)).toBe("Tomorrow");
  });

  it("heads a stage with the whole range, and the years where they are not this one", () => {
    expect(longDays("2026-10-02", "2026-10-04", FRIDAY)).toBe(
      "Friday, October 2 to Sunday, October 4",
    );
    expect(longDays("2027-10-01", "2027-10-03", FRIDAY)).toBe(
      "Friday, October 1 to Sunday, October 3, 2027",
    );
    expect(longDays("2026-12-30", "2027-01-02", FRIDAY)).toBe(
      "Wednesday, December 30, 2026 to Saturday, January 2, 2027",
    );
    expect(longDays("2026-10-02", "2026-10-02", FRIDAY)).toBe("Friday, October 2");
  });
});
