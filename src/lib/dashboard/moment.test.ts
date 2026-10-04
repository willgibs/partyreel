import { describe, expect, it } from "vitest";

import { momentEvent } from "./moment";
import { homeEvent } from "./testing/home";

/**
 * ★ THE PARTY OF THE MOMENT (host-dashboard r1, `purpose=stage`, and the carried `busier` call): which
 * one event the stage leads with, at one event and at forty, dated or not. Each case is a real host's
 * day: a wedding tonight, a planner's crowded weekend, a year with nothing coming, and the undated
 * album Create makes by default.
 */

const FRIDAY = "2026-10-02";
const landed = (day: string, hour = 20) => ({
  at: `${day}T${String(hour).padStart(2, "0")}:00:00.000Z`,
  day,
});

describe("one event", () => {
  it("is always the stage, dated or not, before, on and after its day", () => {
    for (const e of [
      homeEvent({ date: "2026-10-30" }),
      homeEvent({ date: FRIDAY }),
      homeEvent({ date: "2025-01-01" }),
      homeEvent(),
    ]) {
      expect(momentEvent([e], FRIDAY)?.event.id).toBe(e.id);
    }
    expect(momentEvent([], FRIDAY)).toBeNull();
  });

  it("reads its phase off its day", () => {
    expect(momentEvent([homeEvent({ date: FRIDAY })], FRIDAY)?.phase).toBe(
      "live",
    );
    expect(
      momentEvent([homeEvent({ date: "2026-10-09" })], FRIDAY)?.phase,
    ).toBe("before");
  });
});

describe("the one on its day", () => {
  it("leads over a nearer-made event and over tomorrow's", () => {
    const events = [
      homeEvent({
        id: "tomorrow",
        date: "2026-10-03",
        createdAt: "2026-09-30T00:00:00Z",
      }),
      homeEvent({
        id: "tonight",
        date: FRIDAY,
        createdAt: "2026-01-01T00:00:00Z",
      }),
    ];
    expect(momentEvent(events, FRIDAY)?.event.id).toBe("tonight");
  });

  it("★ two on one night: the busier leads, people waiting first, then photographs landing", () => {
    const quiet = homeEvent({
      id: "quiet",
      date: FRIDAY,
      arrivals: { today: 80, lastHour: 5 },
      createdAt: "2026-09-30T00:00:00Z",
    });
    const door = homeEvent({
      id: "door",
      date: FRIDAY,
      waiting: 1,
      arrivals: { today: 3, lastHour: 0 },
    });
    expect(momentEvent([quiet, door], FRIDAY)?.event.id).toBe("door");
    const busy = homeEvent({
      id: "busy",
      date: FRIDAY,
      arrivals: { today: 120, lastHour: 2 },
    });
    expect(momentEvent([quiet, busy], FRIDAY)?.event.id).toBe("busy");
  });

  it("is an undated album landing today when no dated party has its day", () => {
    const events = [
      homeEvent({ id: "next-week", date: "2026-10-09" }),
      homeEvent({ id: "wedding", approved: 212, lastArrival: landed(FRIDAY) }),
    ];
    expect(momentEvent(events, FRIDAY)).toMatchObject({
      event: { id: "wedding" },
      phase: "live",
    });
  });

  it("is a dated party before an undated album that happens to land today", () => {
    const events = [
      homeEvent({ id: "album", approved: 3, lastArrival: landed(FRIDAY) }),
      homeEvent({ id: "tonight", date: FRIDAY }),
    ];
    expect(momentEvent(events, FRIDAY)?.event.id).toBe("tonight");
  });
});

describe("the nearest within the month", () => {
  it("weighs a day behind as a day and a half ahead: tomorrow beats last night", () => {
    const events = [
      homeEvent({ id: "last-night", date: "2026-10-01" }),
      homeEvent({ id: "tomorrow", date: "2026-10-03" }),
    ];
    expect(momentEvent(events, FRIDAY)?.event.id).toBe("tomorrow");
  });

  it("and last weekend's album beats a party three weeks out", () => {
    const events = [
      homeEvent({ id: "three-weeks", date: "2026-10-23" }),
      homeEvent({ id: "last-weekend", date: "2026-09-26" }),
    ];
    expect(momentEvent(events, FRIDAY)).toMatchObject({
      event: { id: "last-weekend" },
      phase: "after",
    });
  });

  it("places an undated album by the day its photographs last landed", () => {
    const events = [
      homeEvent({ id: "three-weeks", date: "2026-10-23" }),
      homeEvent({
        id: "undated",
        approved: 40,
        lastArrival: landed("2026-09-30"),
      }),
    ];
    expect(momentEvent(events, FRIDAY)?.event.id).toBe("undated");
  });
});

describe("with nothing near: lead=made", () => {
  /**
   * ★ ON A QUIET DAY THE NEWEST MADE LEADS (Will's lead=made, host-dashboard r2, 2026-10-03: "I think it makes sense
   * to default to the newest event here, generally expecting a host to continue preparing it"). These two cases are
   * the retired rule's own (the next party however far, then the latest activity), reshaped on purpose: the far party
   * and the late upload still stand here, and now the event she made last leads past both.
   */
  it("★ is the newest made, ahead of the next party however far", () => {
    const events = [
      homeEvent({
        id: "june",
        date: "2026-06-01",
        approved: 300,
        lastArrival: landed("2026-06-01"),
        createdAt: "2026-05-01T00:00:00Z",
      }),
      homeEvent({
        id: "december",
        date: "2026-12-31",
        createdAt: "2026-08-01T00:00:00Z",
      }),
      homeEvent({
        id: "launch",
        createdAt: "2026-09-27T00:00:00Z",
      }),
      homeEvent({
        id: "march",
        date: "2027-03-01",
        createdAt: "2026-07-01T00:00:00Z",
      }),
    ];
    expect(momentEvent(events, FRIDAY)).toMatchObject({
      event: { id: "launch" },
      phase: "before",
    });
  });

  it("★ is the newest made, ahead of the album a photograph last landed in", () => {
    const events = [
      homeEvent({
        id: "spring",
        date: "2026-04-01",
        approved: 90,
        lastArrival: landed("2026-04-02"),
        createdAt: "2026-03-01T00:00:00Z",
      }),
      homeEvent({
        id: "late-upload",
        date: "2025-12-31",
        approved: 500,
        lastArrival: landed("2026-07-14"),
        createdAt: "2025-12-01T00:00:00Z",
      }),
      homeEvent({ id: "undated-empty", createdAt: "2026-09-29T00:00:00Z" }),
    ];
    expect(momentEvent(events, FRIDAY)).toMatchObject({
      event: { id: "undated-empty" },
      phase: "before",
    });
  });

  it("is the newest made when no album holds a photograph and nothing is dated", () => {
    const events = [
      homeEvent({ id: "older", createdAt: "2026-08-01T00:00:00Z" }),
      homeEvent({ id: "newest", createdAt: "2026-09-29T00:00:00Z" }),
      homeEvent({ id: "middle", createdAt: "2026-09-01T00:00:00Z" }),
    ];
    expect(momentEvent(events, FRIDAY)).toMatchObject({
      event: { id: "newest" },
      phase: "before",
    });
  });

  it("never outranks a party on its day or within the month: time decides whenever it can", () => {
    const events = [
      homeEvent({ id: "made-today", createdAt: "2026-10-02T09:00:00Z" }),
      homeEvent({
        id: "three-weeks",
        date: "2026-10-23",
        createdAt: "2026-06-01T00:00:00Z",
      }),
    ];
    expect(momentEvent(events, FRIDAY)?.event.id).toBe("three-weeks");
  });
});

describe("a range of days", () => {
  it("★ leads on any day of it, as the one on its day", () => {
    const events = [
      homeEvent({ id: "tomorrow", date: "2026-10-03" }),
      homeEvent({
        id: "weekend",
        date: "2026-10-01",
        endDate: "2026-10-03",
        createdAt: "2026-01-01T00:00:00Z",
      }),
    ];
    expect(momentEvent(events, FRIDAY)).toMatchObject({
      event: { id: "weekend" },
      phase: "live",
    });
  });

  it("weighs from its last day once it is over: a weekend just ended beats a party two days out", () => {
    const events = [
      homeEvent({ id: "sunday", date: "2026-10-04" }),
      homeEvent({
        id: "conference",
        date: "2026-09-28",
        endDate: "2026-10-01",
      }),
    ];
    // The conference ended yesterday (a day behind weighs 1.5) where its first day was four days back (6).
    expect(momentEvent(events, FRIDAY)).toMatchObject({
      event: { id: "conference" },
      phase: "after",
    });
  });
});
