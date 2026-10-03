import { describe, expect, it } from "vitest";

import type { GuestEventCardData } from "./guest-events";
import { buildHomeView, type DeletedEvent } from "./home-view";
import { homeContext, hostedEvent } from "./testing/home";

/**
 * THE DASHBOARD, COMPOSED (host-dashboard r1's wiring): the stage leads, the week holds every other party
 * near its date, and everything else groups by when, the stage's own event never drawn twice. What each
 * piece says is pinned in its own module; this pins how the page puts them together.
 */

const FRIDAY = "2026-10-02";
const ctx = homeContext(FRIDAY, { evening: true });

const guest = (over: Partial<GuestEventCardData> = {}): GuestEventCardData => ({
  eventId: "g1",
  lastUploadAt: "2026-08-15T12:00:00Z",
  href: "/e/qr-g1",
  name: "Priya & Sam's Wedding",
  dateLabel: "August 15, 2026",
  byline: "Hosted by Priya",
  coverUrl: "https://r2.test/g1.webp",
  accessible: true,
  passwordProtected: false,
  ...over,
});

const binned: DeletedEvent = {
  id: "d1",
  name: "Test event",
  date: null,
  dateLabel: "No date set",
  coverUrl: null,
  deletedAt: "2026-09-20T10:00:00Z",
  countdown: "Deletes in 18 days",
};

const build = (
  hosted: ReturnType<typeof hostedEvent>[],
  more: Partial<Parameters<typeof buildHomeView>[0]> = {},
) =>
  buildHomeView({
    ctx,
    hosted,
    guests: [],
    deleted: [],
    siteUrl: "https://partyreel.com",
    stageReads: null,
    ...more,
  });

describe("one event", () => {
  it("★ is the stage, and the page under it holds only everything else", () => {
    const view = build([hostedEvent({ id: "wedding", date: FRIDAY })], {
      guests: [guest()],
    });
    expect(view.stage?.event.id).toBe("wedding");
    expect(view.week).toEqual([]);
    expect(view.events.title).toBe("Everything else");
    expect(view.events.rows.map((r) => [r.kind, r.id])).toEqual([
      ["guest", "g1"],
    ]);
    expect(view.events.seasons.map((s) => s.id)).toEqual(["guest"]);
  });

  it("shares the stage's code by its permanent link", () => {
    const view = build([
      hostedEvent({ id: "wedding", qrToken: "tok-1", qrStyle: "rounded" }),
    ]);
    expect(view.stage?.share).toEqual({
      joinUrl: "https://partyreel.com/e/tok-1",
      qrStyle: "rounded",
    });
  });
});

describe("the stage's photographs", () => {
  it("are the live wall's own reads on its day, and its card's stills on any other", () => {
    const wedding = hostedEvent({
      id: "wedding",
      date: FRIDAY,
      stills: ["https://r2.test/a.webp", "https://r2.test/b.webp"],
    });
    const wall = Array.from({ length: 9 }, (_, i) => ({
      id: `m${i}`,
      url: `https://r2.test/m${i}.webp`,
    }));
    expect(
      build([wedding], {
        stageReads: { id: "wedding", photos: wall, guests: 23 },
      }).stage,
    ).toMatchObject({ photos: wall, guests: 23 });
    // A read for another event, or none, leaves the stills.
    const calm = build([wedding], {
      stageReads: { id: "someone-else", photos: wall, guests: 4 },
    }).stage;
    expect(calm?.photos.map((p) => p.url)).toEqual(wedding.stills);
    expect(calm?.guests).toBeNull();
  });
});

describe("a planner's week", () => {
  const events = [
    hostedEvent({ id: "tonight", date: FRIDAY, approved: 80 }),
    hostedEvent({ id: "tomorrow", date: "2026-10-03" }),
    hostedEvent({
      id: "sunday",
      date: "2026-10-04",
      ready: { opened: 0, guestsIn: 0 },
    }),
    hostedEvent({
      id: "last-week",
      date: "2026-09-26",
      approved: 418,
      pending: 18,
    }),
    hostedEvent({
      id: "june",
      date: "2026-06-01",
      approved: 90,
      acceptingUploads: false,
    }),
    hostedEvent({
      id: "old-queue",
      date: "2025-05-01",
      approved: 300,
      pending: 2,
    }),
  ];
  const view = build(events, { deleted: [binned] });

  it("leads with tonight's party and holds the rest of the week, nearest first", () => {
    expect(view.stage?.event.id).toBe("tonight");
    expect(
      view.week.map((c) => [c.id, c.when, c.item?.kind ?? c.quiet]),
    ).toEqual([
      ["tomorrow", "Tomorrow", "print"],
      ["sunday", "Sunday", "code"],
      ["last-week", "Sat, Sep 26", "review"],
    ]);
  });

  it("keeps a queue on a party long over off the week, and on its tile", () => {
    const old = view.events.rows.find((r) => r.id === "old-queue");
    expect(view.week.map((c) => c.id)).not.toContain("old-queue");
    expect(old?.marks?.state).toEqual({ tone: "waiting", text: "2 to review" });
    // A party long over, paused, says nothing at all.
    expect(view.events.rows.find((r) => r.id === "june")?.marks).toEqual({
      live: false,
      state: null,
    });
  });

  it("marks a week party's tile with its step, the stage's event drawn nowhere below it", () => {
    expect(
      view.events.rows.find((r) => r.id === "sunday")?.marks?.state,
    ).toEqual({
      tone: "setup",
      text: "Code never opened",
    });
    expect(view.events.rows.map((r) => r.id)).not.toContain("tonight");
  });

  it("groups everything else by when, the bin out of every group", () => {
    expect(view.events.seasons.map((s) => [s.label, s.ids])).toEqual([
      ["Coming up", ["tomorrow", "sunday"]],
      ["Just past", ["last-week"]],
      ["Earlier in 2026", ["june"]],
      ["2025", ["old-queue"]],
    ]);
    const bin = view.events.rows.find((r) => r.kind === "deleted");
    expect(bin).toMatchObject({
      id: "d1",
      seasonId: null,
      statusLabel: "Deletes in 18 days",
    });
  });
});

describe("a range of days on the page", () => {
  const events = [
    hostedEvent({ id: "tonight", date: FRIDAY, approved: 40 }),
    // A conference on its middle day, a weekend wedding ahead in the week, and a trip just past.
    hostedEvent({ id: "conference", date: "2026-10-01", endDate: "2026-10-03" }),
    hostedEvent({ id: "wedding", date: "2026-10-04", endDate: "2026-10-06" }),
    hostedEvent({
      id: "trip",
      date: "2026-09-10",
      endDate: "2026-09-27",
      approved: 212,
    }),
  ];
  const view = build(events, {
    deleted: [
      {
        ...binned,
        date: "2026-08-01",
        endDate: "2026-08-03",
        dateLabel: "August 1 to 3, 2026",
      },
    ],
  });

  it("★ says a range in the week by where it stands: its day of its days, its weekdays ahead, its dates behind", () => {
    expect(view.week.map((c) => [c.id, c.when, c.live])).toEqual([
      ["conference", "Day 2 of 3", true],
      ["wedding", "Sun to Tue", false],
      ["trip", "Sep 10 to 27", false],
    ]);
    // A range's face is its first day, as an invitation sets it.
    expect(view.week.find((c) => c.id === "wedding")?.face).toEqual({
      weekday: "Sun",
      month: "Oct",
      day: "4",
    });
  });

  it("says it on the tiles and on the bin's rows", () => {
    expect(view.events.rows.find((r) => r.id === "conference")?.when).toBe(
      "Day 2 of 3",
    );
    expect(view.events.rows.find((r) => r.id === "d1")?.when).toBe(
      "Aug 1 to 3",
    );
  });
});

describe("an account with no hosted event", () => {
  it("has no stage, and its events are its own", () => {
    const view = build([], { guests: [guest()] });
    expect(view.stage).toBeNull();
    expect(view.events.title).toBe("Your events");
    expect(view.hasAny).toBe(true);
  });

  it("has nothing at all to show a brand-new account, which meets the create teaser", () => {
    expect(build([]).hasAny).toBe(false);
    expect(build([], { deleted: [binned] }).hasAny).toBe(true);
  });

  it("orders the events it added to by its own newest upload", () => {
    const view = build([], {
      guests: [
        guest({ eventId: "older", lastUploadAt: "2026-01-01T00:00:00Z" }),
        guest({ eventId: "newer", lastUploadAt: "2026-09-01T00:00:00Z" }),
      ],
    });
    expect(view.events.seasons[0]?.ids).toEqual(["newer", "older"]);
  });
});
