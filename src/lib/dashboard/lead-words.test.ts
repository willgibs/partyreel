import { describe, expect, it } from "vitest";

import { hostedEvent } from "@/lib/dashboard/testing/home";

import { type Leadable, leadOf, type RuleId, RULES } from "./lead";
import { factOf, lineOf, nearWords, reasonOf, RULE_WORDS } from "./lead-words";

/**
 * WHAT THE STAGE SAYS OF WHY ITS EVENT LEADS (host-dashboard r4, `chooser=words`): the first line's reason, and each
 * rule's row ("Nia & Alex's Wedding · made yesterday"). The words are the board's, read off the lead each rule found, so
 * three rules agreeing on one event read as three reasons, and a rule that fell back never claims its own kind.
 */

const TODAY = "2026-11-10";

const NIA: Leadable[] = [
  hostedEvent({
    id: "wedding",
    name: "Nia & Alex's Wedding",
    createdAt: "2026-11-09T21:00:00Z",
    openedAt: "2026-11-09T21:05:00Z",
  }),
  hostedEvent({
    id: "engagement",
    name: "Our Engagement Party",
    createdAt: "2026-08-01T12:00:00Z",
    lastArrival: { at: "2026-09-26T20:00:00Z", day: "2026-09-26" },
  }),
];

const said = (events: Leadable[]) =>
  Object.fromEntries(
    RULES.map((rule) => [rule, lineOf(leadOf(events, TODAY, rule)!, TODAY)]),
  ) as Record<RuleId, string>;

/** A row's line as it reads, its no-break spaces as spaces. */
const plain = (line: string) => line.replace(/\u00a0/g, " ");

describe("a day either side of today", () => {
  it("says today, tomorrow, yesterday, and the days between in numbers", () => {
    expect(nearWords("2026-11-10", TODAY)).toBe("today");
    expect(nearWords("2026-11-11", TODAY)).toBe("tomorrow");
    expect(nearWords("2026-11-09", TODAY)).toBe("yesterday");
    expect(nearWords("2026-11-28", TODAY)).toBe("in 18 days");
    expect(nearWords("2026-10-31", TODAY)).toBe("10 days ago");
  });
});

describe("each rule's row", () => {
  it("★ says the fact each rule read, so agreeing rules read as separate reasons", () => {
    expect(
      Object.fromEntries(
        Object.entries(said(NIA)).map(([k, v]) => [k, plain(v)]),
      ),
    ).toEqual({
      newest: "Nia & Alex's Wedding · made yesterday",
      // Nothing of hers is dated, so Upcoming has no event of its own and says so.
      upcoming: "Nia & Alex's Wedding · nothing dated ahead",
      opened: "Nia & Alex's Wedding · opened last",
      photos: "Our Engagement Party · photos Sep 26",
    });
  });

  it("keeps the dot with the name and the fact whole, so a narrow row wraps between the two", () => {
    expect(said(NIA).opened).toBe(
      "Nia & Alex's Wedding\u00a0\u00b7 opened\u00a0last",
    );
  });

  it("names a rule that found none of its own kind, for each rule that can", () => {
    const bare: Leadable[] = [
      hostedEvent({ id: "a", name: "A", createdAt: "2026-11-09T00:00:00Z" }),
      hostedEvent({ id: "b", name: "B", createdAt: "2026-11-01T00:00:00Z" }),
    ];
    const lines = Object.fromEntries(
      Object.entries(said(bare)).map(([k, v]) => [k, plain(v)]),
    );
    expect(lines.upcoming).toBe("A · nothing dated ahead");
    expect(lines.opened).toBe("A · nothing opened yet");
    expect(lines.photos).toBe("A · no photos yet");
    expect(lines.newest).toBe("A · made yesterday");
  });

  it("says a party within a month by its day, and the soonest party by its own date", () => {
    const events: Leadable[] = [
      hostedEvent({
        id: "lunch",
        name: "Lunch",
        createdAt: "2026-10-20T00:00:00Z",
        date: "2026-11-12",
      }),
      hostedEvent({
        id: "holiday",
        name: "Holiday",
        createdAt: "2026-09-01T00:00:00Z",
        date: "2026-12-12",
      }),
    ];
    expect(factOf(leadOf(events, TODAY, "newest")!, TODAY)).toBe("in 2 days");
    // Production's own `whenOf`: the weekday inside a week, then the date.
    expect(factOf(leadOf(events, TODAY, "upcoming")!, TODAY)).toBe("Thursday");
    const later = events.filter((e) => e.id === "holiday");
    expect(factOf(leadOf(later, TODAY, "upcoming")!, TODAY)).toBe("Dec 12");
  });

  it("dates photographs by their day, and by their month once the year has turned", () => {
    const events: Leadable[] = [
      hostedEvent({
        id: "x",
        name: "X",
        createdAt: "2026-01-01T00:00:00Z",
        lastArrival: { at: "2026-11-09T12:00:00Z", day: "2026-11-09" },
      }),
      hostedEvent({ id: "y", name: "Y", createdAt: "2025-01-01T00:00:00Z" }),
    ];
    expect(factOf(leadOf(events, TODAY, "photos")!, TODAY)).toBe(
      "photos yesterday",
    );
    const old: Leadable[] = [
      hostedEvent({
        id: "x",
        name: "X",
        createdAt: "2025-01-01T00:00:00Z",
        lastArrival: { at: "2025-06-09T12:00:00Z", day: "2025-06-09" },
      }),
      hostedEvent({ id: "y", name: "Y", createdAt: "2025-02-01T00:00:00Z" }),
    ];
    expect(factOf(leadOf(old, TODAY, "photos")!, TODAY)).toBe(
      "photos Jun 2025",
    );
  });
});

describe("the stage's first words", () => {
  it("is the rule's own name while the rule found its own kind of event", () => {
    const events: Leadable[] = [
      hostedEvent({
        id: "a",
        createdAt: "2026-11-09T00:00:00Z",
        openedAt: "2026-11-09T01:00:00Z",
      }),
      hostedEvent({
        id: "b",
        createdAt: "2026-08-01T00:00:00Z",
        date: "2026-12-12",
        lastArrival: { at: "2026-09-26T20:00:00Z", day: "2026-09-26" },
      }),
    ];
    expect(reasonOf(leadOf(events, TODAY, "upcoming")!, TODAY)).toBe(
      "Your next party",
    );
    expect(reasonOf(leadOf(events, TODAY, "opened")!, TODAY)).toBe(
      "Where you left off",
    );
    expect(reasonOf(leadOf(events, TODAY, "photos")!, TODAY)).toBe(
      "Latest photos",
    );
    expect(reasonOf(leadOf(events, TODAY, "newest")!, TODAY)).toBe(
      "Your newest",
    );
  });

  it("★ is her newest where the rule fell back: the truth, never the rule's name", () => {
    const events: Leadable[] = [
      hostedEvent({ id: "a", createdAt: "2026-11-09T00:00:00Z" }),
      hostedEvent({ id: "b", createdAt: "2026-08-01T00:00:00Z" }),
    ];
    for (const rule of ["upcoming", "opened", "photos"] as const)
      expect(reasonOf(leadOf(events, TODAY, rule)!, TODAY), rule).toBe(
        "Your newest",
      );
  });

  it("is a near party's day under Newest, since being near is why it leads", () => {
    const events: Leadable[] = [
      hostedEvent({
        id: "soon",
        createdAt: "2026-05-01T00:00:00Z",
        date: "2026-11-28",
      }),
      hostedEvent({ id: "new", createdAt: "2026-11-09T00:00:00Z" }),
    ];
    expect(reasonOf(leadOf(events, TODAY, "newest")!, TODAY)).toBe(
      "In 18 days",
    );
    const tomorrow: Leadable[] = [
      hostedEvent({
        id: "t",
        createdAt: "2026-05-01T00:00:00Z",
        date: "2026-11-11",
      }),
      hostedEvent({ id: "new", createdAt: "2026-11-09T00:00:00Z" }),
    ];
    expect(reasonOf(leadOf(tomorrow, TODAY, "newest")!, TODAY)).toBe(
      "Tomorrow",
    );
  });

  it("★ says an undated album by its photographs, never by a day she did not set", () => {
    // Nothing is dated: the pancakes lead Newest because their photographs landed yesterday, and the stage says
    // "No date yet" of them, so the reason never claims a day for them.
    const events: Leadable[] = [
      hostedEvent({
        id: "pancakes",
        name: "Sunday pancakes",
        createdAt: "2026-11-08T09:00:00Z",
        lastArrival: { at: "2026-11-09T09:30:00Z", day: "2026-11-09" },
      }),
      hostedEvent({ id: "old", createdAt: "2026-02-01T00:00:00Z" }),
    ];
    const lead = leadOf(events, TODAY, "newest")!;
    expect(lead.event.id).toBe("pancakes");
    expect(lead.why).toBe("near");
    expect(reasonOf(lead, TODAY)).toBe("Photos yesterday");
    expect(factOf(lead, TODAY)).toBe("photos yesterday");
  });

  it("names the four rules in the words the chooser's rows share", () => {
    expect(RULE_WORDS).toEqual({
      newest: "Your newest",
      upcoming: "Your next party",
      opened: "Where you left off",
      photos: "Latest photos",
    });
  });
});
