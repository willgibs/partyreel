import { describe, expect, it } from "vitest";

import { itemFor, marksOf, quietLine, weekEvents } from "./attention";
import { homeContext, homeEvent } from "./testing/home";

/**
 * WHAT ASKS FOR A HOST'S ATTENTION (host-dashboard r1, `needs=week` and the carried `finished` call):
 * one item an event, the queues in every phase, setup only before the day, and nothing at all from a
 * party long over unless someone waits. Readiness is production's own function, so these pin which
 * item an event says and when, never what ready means.
 */

const FRIDAY = "2026-10-02";
const ctx = homeContext(FRIDAY);

describe("a party long over (the `finished` call)", () => {
  const over = homeEvent({
    date: "2026-06-12",
    approved: 340,
    acceptingUploads: false,
  });

  it("★ never asks to reopen: paused uploads after the party are how a host finishes one", () => {
    expect(itemFor(over, ctx)).toBeNull();
    // The month after too: a paused album is a finished party there as well.
    expect(itemFor({ ...over, date: "2026-09-30" }, ctx)).toBeNull();
  });

  it("speaks only when someone waits: at its door, then in its queue", () => {
    expect(itemFor({ ...over, waiting: 2, pending: 5 }, ctx)).toMatchObject({
      kind: "door",
      line: "2 people at the door",
      short: "2 at the door",
      tone: "waiting",
      to: "guests",
    });
    expect(itemFor({ ...over, pending: 1 }, ctx)).toMatchObject({
      kind: "review",
      line: "1 upload to review",
      short: "1 to review",
      to: "review",
    });
  });
});

describe("on the party's day", () => {
  const tonight = homeEvent({ date: FRIDAY, approved: 40, playable: 2 });

  it("asks for nothing when the room is filling and the reel plays", () => {
    expect(itemFor(tonight, ctx)).toBeNull();
  });

  it("says paused uploads and a reel one photo short, the queues first", () => {
    expect(itemFor({ ...tonight, acceptingUploads: false }, ctx)?.kind).toBe(
      "paused",
    );
    expect(itemFor({ ...tonight, approved: 1, playable: 1 }, ctx)?.kind).toBe(
      "reel",
    );
    expect(
      itemFor({ ...tonight, acceptingUploads: false, waiting: 1 }, ctx)?.kind,
    ).toBe("door");
  });

  it("is an undated album whose photographs are landing today, with the same asks", () => {
    const busy = homeEvent({
      approved: 40,
      playable: 2,
      acceptingUploads: false,
      lastArrival: { at: "2026-10-02T19:00:00Z", day: FRIDAY },
    });
    expect(itemFor(busy, ctx)?.kind).toBe("paused");
  });
});

describe("before the party's day", () => {
  const saturday = homeEvent({ date: "2026-10-03" });

  it("says the first essential readiness leaves undone, in readiness's own order", () => {
    expect(
      itemFor({ ...saturday, door: "password", hasPassword: false }, ctx),
    ).toMatchObject({ kind: "password", act: "Set it", to: "door" });
    expect(itemFor({ ...saturday, door: "private" }, ctx)?.kind).toBe(
      "door-shut",
    );
    expect(
      itemFor({ ...saturday, acceptingUploads: false }, ctx),
    ).toMatchObject({ kind: "adds", to: "adds" });
    expect(
      itemFor({ ...saturday, ready: { opened: 0, guestsIn: 0 } }, ctx),
    ).toMatchObject({ kind: "code", act: "Invite", to: "invite" });
  });

  it("then the code on paper the day before, and nothing further out", () => {
    expect(itemFor(saturday, ctx)).toMatchObject({
      kind: "print",
      to: "print",
    });
    expect(itemFor({ ...saturday, date: "2026-10-09" }, ctx)).toBeNull();
  });

  it("never says what is merely worth doing: the welcome and the first photos are the hub's", () => {
    expect(
      itemFor({ ...saturday, date: "2026-10-09", description: null }, ctx),
    ).toBeNull();
  });

  it("says no setup it has not read: unread readiness is never guessed", () => {
    expect(
      itemFor({ ...saturday, date: "2026-10-09", ready: null }, ctx),
    ).toBeNull();
  });

  it("leaves room to the ring: a full shelf is not an event's step", () => {
    const full = homeContext(FRIDAY, { storagePct: 100 });
    expect(itemFor({ ...saturday, date: "2026-10-09" }, full)).toBeNull();
    expect(quietLine({ ...saturday, date: "2026-10-09" }, full)).toBe(
      "Your storage is full",
    );
  });
});

describe("this week", () => {
  it("holds the dated parties within seven days either way, nearest first, ahead before behind", () => {
    const events = [
      homeEvent({ id: "far", date: "2026-10-20" }),
      homeEvent({ id: "yesterday", date: "2026-10-01" }),
      homeEvent({ id: "tomorrow", date: "2026-10-03" }),
      homeEvent({ id: "tonight", date: FRIDAY }),
      homeEvent({ id: "week-ago", date: "2026-09-25" }),
      homeEvent({ id: "undated" }),
      homeEvent({ id: "long-ago", date: "2026-06-01" }),
    ];
    expect(weekEvents(events, FRIDAY).map((e) => e.id)).toEqual([
      "tonight",
      "tomorrow",
      "yesterday",
      "week-ago",
    ]);
  });
});

describe("this week, with a range of days", () => {
  it("★ holds a range by its nearest day: on any day of it first, then by its first day ahead or its last behind", () => {
    const events = [
      // Started nine days ago, ends tomorrow: on its days, so in the week, first.
      homeEvent({ id: "festival", date: "2026-09-23", endDate: "2026-10-03" }),
      // Began ten days ago and ended six days ago: its last day is inside the week.
      homeEvent({ id: "retreat", date: "2026-09-22", endDate: "2026-09-26" }),
      // Its first day is nine days out, however long it runs: not this week.
      homeEvent({ id: "trip", date: "2026-10-11", endDate: "2026-10-25" }),
      homeEvent({ id: "tomorrow", date: "2026-10-03" }),
    ];
    expect(weekEvents(events, FRIDAY).map((e) => e.id)).toEqual([
      "festival",
      "tomorrow",
      "retreat",
    ]);
  });

  it("wears Live on any day of a range", () => {
    const weekend = homeEvent({ date: "2026-10-01", endDate: "2026-10-03" });
    expect(marksOf(weekend, ctx, true).live).toBe(true);
    expect(marksOf(weekend, homeContext("2026-10-04"), true).live).toBe(false);
  });
});

describe("a tile's marks", () => {
  it("wears Live on its day, and what waits on any event", () => {
    const old = homeEvent({ date: "2025-06-01", pending: 4 });
    expect(marksOf(old, ctx, false)).toEqual({
      live: false,
      state: { tone: "waiting", text: "4 to review" },
    });
    expect(marksOf(homeEvent({ date: FRIDAY }), ctx, true).live).toBe(true);
  });

  it("wears a step only while the week puts it on the page", () => {
    const soon = homeEvent({ date: "2026-10-04", door: "private" });
    expect(marksOf(soon, ctx, true).state).toEqual({
      tone: "setup",
      text: "Nobody can get in yet",
    });
    expect(marksOf(soon, ctx, false).state).toBeNull();
  });
});

describe("a quiet party in the week", () => {
  it("says Ready before its day, and its album's count after", () => {
    expect(quietLine(homeEvent({ date: "2026-10-05" }), ctx)).toBe(
      "Ready for guests",
    );
    expect(
      quietLine(homeEvent({ date: "2026-09-30", approved: 1240 }), ctx),
    ).toBe("1,240 in the album");
    expect(quietLine(homeEvent({ date: "2026-09-30" }), ctx)).toBe(
      "Nothing in the album yet",
    );
  });
});
