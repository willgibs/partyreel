import { describe, expect, it } from "vitest";

import {
  dateFace,
  dayOf,
  daysFrom,
  isEvening,
  longDate,
  phaseOf,
  phaseOfEvent,
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
