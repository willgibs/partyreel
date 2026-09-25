import { describe, expect, it } from "vitest";

import { nextStepForEvent } from "./next-step";
import { calendarDayInZone, resolveViewerZone, serverZone } from "./viewer-day";

/**
 * THE VIEWER'S OWN CALENDAR DAY, PINNED AT THE EDGES THAT BREAK A NAIVE
 * IMPLEMENTATION (the 1,000-row round's follow-on, 2026-09-24): both 2026 US
 * DST days (the offset AT midnight can differ from the offset the caller is
 * standing in), a positive half-hour zone, the furthest-ahead and
 * furthest-behind real zones, and the exact evening-before scenario that
 * silently disappeared "Print the code" under the server's UTC clock.
 */

describe("resolveViewerZone", () => {
  it("takes a valid IANA zone from the header", () => {
    expect(resolveViewerZone("America/New_York", "UTC")).toBe(
      "America/New_York",
    );
  });

  it("falls back on a missing header", () => {
    expect(resolveViewerZone(null, "UTC")).toBe("UTC");
    expect(resolveViewerZone(undefined, "UTC")).toBe("UTC");
    expect(resolveViewerZone("", "UTC")).toBe("UTC");
  });

  it("falls back on a garbage header rather than throwing", () => {
    expect(resolveViewerZone("Not/AZone", "UTC")).toBe("UTC");
    expect(resolveViewerZone("hello there", "America/Chicago")).toBe(
      "America/Chicago",
    );
  });
});

describe("serverZone", () => {
  it("answers a real IANA zone Intl itself accepts", () => {
    const zone = serverZone();
    expect(
      () => new Intl.DateTimeFormat("en-US", { timeZone: zone }),
    ).not.toThrow();
  });
});

describe("calendarDayInZone", () => {
  const NY = "America/New_York";

  it("spring-forward, 2026-03-08: midnight is still EST, before the 2am jump to EDT", () => {
    // 15:00 UTC = 10:00 EDT (already sprung forward for the afternoon reading).
    const now = Date.UTC(2026, 2, 8, 15, 0, 0);
    const { today, startOfTodayMs } = calendarDayInZone(now, NY);
    expect(today).toBe("2026-03-08");
    // Local midnight on the transition day is still EST (UTC-5): 05:00 UTC.
    expect(startOfTodayMs).toBe(Date.UTC(2026, 2, 8, 5, 0, 0));
  });

  it("fall-back, 2026-11-01: midnight is still EDT, before the 2am repeat of 1am", () => {
    // 20:00 UTC = 15:00 EST (already fallen back for the afternoon reading).
    const now = Date.UTC(2026, 10, 1, 20, 0, 0);
    const { today, startOfTodayMs } = calendarDayInZone(now, NY);
    expect(today).toBe("2026-11-01");
    // Local midnight on the transition day is still EDT (UTC-4): 04:00 UTC.
    expect(startOfTodayMs).toBe(Date.UTC(2026, 10, 1, 4, 0, 0));
  });

  it("Kolkata (+5:30, no DST): a half-hour offset resolves exactly", () => {
    const now = Date.UTC(2026, 5, 15, 4, 30, 0); // 10:00 local
    const { today, startOfTodayMs } = calendarDayInZone(now, "Asia/Kolkata");
    expect(today).toBe("2026-06-15");
    expect(startOfTodayMs).toBe(Date.UTC(2026, 5, 14, 18, 30, 0));
  });

  it("Kiritimati (+14, no DST): the furthest-ahead zone on Earth", () => {
    const now = Date.UTC(2026, 5, 14, 20, 0, 0); // 10:00 local, next calendar day
    const { today, startOfTodayMs } = calendarDayInZone(
      now,
      "Pacific/Kiritimati",
    );
    expect(today).toBe("2026-06-15");
    expect(startOfTodayMs).toBe(Date.UTC(2026, 5, 14, 10, 0, 0));
  });

  it("Honolulu (-10, no DST): the furthest-behind common zone", () => {
    const now = Date.UTC(2026, 5, 15, 20, 0, 0); // 10:00 local
    const { today, startOfTodayMs } = calendarDayInZone(
      now,
      "Pacific/Honolulu",
    );
    expect(today).toBe("2026-06-15");
    expect(startOfTodayMs).toBe(Date.UTC(2026, 5, 15, 10, 0, 0));
  });
});

describe("the evening-before scenario: 'Print the code' must not disappear", () => {
  const NY = "America/New_York";
  const event = {
    id: "e1",
    name: "Rooftop Summer Party",
    pending: 0,
    acceptingUploads: true,
    showReel: true,
    reelItems: 2,
    eventDate: "2026-09-21",
  };

  it("21:00 in New York the evening before: the server's UTC day is already tomorrow", () => {
    // 21:00 EDT on the 20th is 01:00 UTC on the 21st — the event's own date.
    const now = Date.UTC(2026, 8, 21, 1, 0, 0);

    // The bug: reading "today" from the server's own UTC clock lands ON the
    // event's date, so `tomorrowOf` looks one day past it and the step never
    // fires — the one evening a host most wants to be told to print the code.
    const serverToday = new Date(now).toISOString().slice(0, 10);
    expect(serverToday).toBe(event.eventDate); // confirms the bug's premise
    expect(nextStepForEvent(event, serverToday)).toBeNull();

    // The fix: the viewer's own zone still reads the 20th at 9pm.
    const { today } = calendarDayInZone(now, NY);
    expect(today).toBe("2026-09-20");
    expect(nextStepForEvent(event, today)?.kind).toBe("print");
  });

  it("the same instant, read from Kolkata, is already the event's own day", () => {
    // The whole point of a PER-VIEWER day: one absolute instant, two
    // different calendar days. 01:00 UTC is 9pm-the-evening-before in New
    // York and already 6:30am on the event's OWN day in Kolkata, where
    // "the day before" has already passed — so nothing should fire there.
    const now = Date.UTC(2026, 8, 21, 1, 0, 0);
    const { today } = calendarDayInZone(now, "Asia/Kolkata");
    expect(today).toBe(event.eventDate);
    expect(nextStepForEvent(event, today)).toBeNull();
  });
});
