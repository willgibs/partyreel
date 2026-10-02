import { describe, expect, it } from "vitest";

import { hostAt, JO_EVENT_COUNT } from "./fixtures";
import {
  bellItems,
  daysFrom,
  itemFor,
  itemsOf,
  momentEvent,
  pageItems,
  phaseOf,
  seasonsOf,
  weekEvents,
  whenOf,
} from "./model";

/**
 * The board's own answers, held: which event leads, what reaches the page by
 * each rule, and how forty events group. Every drawing reads these, so a
 * caption that disagrees with them is a drawing that is wrong.
 */

describe("the days", () => {
  it("counts whole days by the date parts", () => {
    expect(daysFrom("2026-10-02", "2026-10-03")).toBe(1);
    expect(daysFrom("2026-10-02", "2026-09-26")).toBe(-6);
    // Across the clocks going back (25 October in Europe) a day is still a day.
    expect(daysFrom("2026-10-24", "2026-10-26")).toBe(2);
  });

  it("puts an event in its phase", () => {
    expect(phaseOf("2026-10-02", "2026-10-02")).toBe("live");
    expect(phaseOf("2026-10-03", "2026-10-02")).toBe("before");
    expect(phaseOf("2026-09-02", "2026-10-02")).toBe("after");
    expect(phaseOf("2026-09-01", "2026-10-02")).toBe("past");
    expect(phaseOf(null, "2026-10-02")).toBe("before");
  });

  it("says when in the fewest exact words", () => {
    const t = "2026-10-02";
    expect(whenOf("2026-10-02", t)).toBe("Tonight");
    expect(whenOf("2026-10-02", t, false)).toBe("Today");
    expect(whenOf("2026-10-03", t)).toBe("Tomorrow");
    expect(whenOf("2026-10-04", t)).toBe("Sunday");
    expect(whenOf("2026-10-01", t, false)).toBe("Yesterday");
    // A weekday behind would read as the next one, so the past says its date.
    expect(whenOf("2026-09-26", t)).toBe("Sat, Sep 26");
    expect(whenOf("2026-06-27", t)).toBe("Jun 27");
    expect(whenOf("2025-06-07", t)).toBe("Jun 2025");
  });
});

describe("the hosts", () => {
  it("gives Jo forty events and Maya one", () => {
    expect(JO_EVENT_COUNT).toBe(40);
    expect(hostAt("jo", "night").events).toHaveLength(40);
    expect(hostAt("maya", "night").events).toHaveLength(1);
  });
});

describe("the moment", () => {
  it("leads with the party on its day", () => {
    expect(momentEvent(hostAt("maya", "night"))).toMatchObject({
      event: { id: "maya-30th" },
      phase: "live",
    });
    expect(momentEvent(hostAt("jo", "night"))).toMatchObject({
      event: { id: "jo-rehearsal" },
      phase: "live",
    });
    // The wedding is the morning after the rehearsal: its own day.
    expect(momentEvent(hostAt("jo", "after"))?.event.id).toBe("jo-wedding");
  });

  it("weighs tomorrow over last night, and a week ahead when nothing is nearer", () => {
    expect(momentEvent(hostAt("maya", "before"))).toMatchObject({
      event: { id: "maya-30th" },
      phase: "before",
    });
    expect(momentEvent(hostAt("maya", "after"))?.phase).toBe("after");
    // On the 25th: the gala tomorrow beats Leo's party six days gone.
    expect(momentEvent(hostAt("jo", "before"))?.event.id).toBe("jo-gala");
  });
});

describe("what needs her", () => {
  const jo = hostAt("jo", "night");

  it("ranks people at a door first, then the night's nearest setup", () => {
    const items = itemsOf(jo);
    expect(items.map((i) => `${i.kind}:${i.eventId}`).slice(0, 4)).toEqual([
      "door:jo-rehearsal",
      "print:jo-wedding",
      "code:jo-christening",
      "password:jo-offsite",
    ]);
    expect(items[0]?.line).toBe("2 people at the door");
  });

  it("never asks a finished party to reopen", () => {
    const spring = jo.events.find((e) => e.id === "jo-spring-arts")!;
    expect(spring.facts.acceptingUploads).toBe(false);
    expect(itemFor(spring, jo)).toBeNull();
  });

  it("keeps a late upload on an old party in the bell, out of the week", () => {
    const week = pageItems(jo, "week").map((i) => i.eventId);
    expect(week).not.toContain("jo-northwind");
    expect(week).not.toContain("jo-nye-grand");
    expect(bellItems(jo, "week").map((i) => i.eventId)).toContain(
      "jo-northwind",
    );
  });

  it("shows three at most under three, and the bell's first three are the page's", () => {
    const three = pageItems(jo, "three");
    expect(three).toHaveLength(3);
    expect(bellItems(jo, "three").slice(0, 3)).toEqual(three);
  });

  it("puts nothing on the page under bell, and everything in the bell", () => {
    expect(pageItems(jo, "bell")).toEqual([]);
    expect(bellItems(jo, "bell")).toHaveLength(itemsOf(jo).length);
  });

  it("holds the week to the parties within seven days either way", () => {
    expect(weekEvents(jo).map((e) => e.id)).toEqual([
      "jo-rehearsal",
      "jo-wedding",
      "jo-christening",
      "jo-sweet16",
      "jo-offsite",
      "jo-gala",
    ]);
  });
});

describe("the collection, by when", () => {
  it("groups forty into coming, just past, this year and the years before", () => {
    const seasons = seasonsOf(hostAt("jo", "night"));
    expect(seasons.map((s) => [s.label, s.events.length])).toEqual([
      ["Coming up", 6],
      ["Just past", 3],
      ["Earlier in 2026", 11],
      ["2025", 20],
    ]);
    expect(seasons[0]?.events[0]?.id).toBe("jo-rehearsal");
    expect(seasons.reduce((n, s) => n + s.events.length, 0)).toBe(40);
  });
});
