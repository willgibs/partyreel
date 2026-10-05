import { describe, expect, it } from "vitest";

import { hostedEvent } from "@/lib/dashboard/testing/home";

import {
  DEFAULT_RULE,
  hasChoice,
  LEAD_KEY,
  leadFrom,
  leadOf,
  leadsOf,
  resolveRule,
  RULES,
  withLead,
} from "./lead";
import { momentEvent } from "./moment";

/**
 * WHAT LEADS THE STAGE UNDER EACH RULE (host-dashboard r4, `chooser=words`), on a quiet Tuesday: nothing is on its day,
 * so each rule leads with its own event. Pinned: Newest IS the moment (a host who never chooses meets the stage she
 * always met), each other rule picks the event its sentence says and falls back to her newest when it finds none, a
 * party on its own day leads under every rule, and a tie always goes to the event made last.
 */

const TODAY = "2026-11-10";

/** A host with three events and none dated: a wedding made last night (empty), an engagement party, an old party. */
const NIA = [
  hostedEvent({
    id: "wedding",
    name: "Nia & Alex's Wedding",
    createdAt: "2026-11-09T21:00:00Z",
  }),
  hostedEvent({
    id: "engagement",
    name: "Our Engagement Party",
    createdAt: "2026-08-01T12:00:00Z",
    lastArrival: { at: "2026-09-26T20:00:00Z", day: "2026-09-26" },
    openedAt: "2026-10-01T09:00:00Z",
  }),
  hostedEvent({
    id: "old",
    name: "Old party",
    createdAt: "2026-05-01T12:00:00Z",
    date: "2026-05-30",
    lastArrival: { at: "2026-05-30T23:00:00Z", day: "2026-05-30" },
  }),
];

/** Forty-ish events' worth of variety in six: a party in two days, one soon after, a holiday, one opened, one with photos. */
const JO = [
  hostedEvent({
    id: "launch",
    name: "Spring launch",
    createdAt: "2026-11-05T12:00:00Z",
  }),
  hostedEvent({
    id: "lunch",
    name: "Team lunch",
    createdAt: "2026-10-20T12:00:00Z",
    date: "2026-11-12",
  }),
  hostedEvent({
    id: "holiday",
    name: "Holiday party",
    createdAt: "2026-09-01T12:00:00Z",
    date: "2026-12-12",
  }),
  hostedEvent({
    id: "offsite",
    name: "Offsite",
    createdAt: "2026-07-01T12:00:00Z",
    date: "2026-10-30",
    lastArrival: { at: "2026-11-02T18:00:00Z", day: "2026-11-02" },
  }),
  hostedEvent({
    id: "wedding-b",
    name: "The Okafor wedding",
    createdAt: "2026-04-01T12:00:00Z",
    date: "2026-04-18",
    openedAt: "2026-11-09T08:00:00Z",
  }),
];

const lead = (events: typeof NIA, rule: (typeof RULES)[number]) =>
  leadOf(events, TODAY, rule)!;

describe("Newest, the default", () => {
  it("★ is the moment: the same event for every host and every day, so a host who never chooses meets her old stage", () => {
    for (const events of [NIA, JO, [NIA[0]!], [...NIA, ...JO]]) {
      expect(lead(events, "newest").event.id).toBe(
        momentEvent(events, TODAY)!.event.id,
      );
    }
    expect(DEFAULT_RULE).toBe("newest");
  });

  it("leads with the event she made last when nothing is within a month, and says it was made", () => {
    const l = lead(NIA, "newest");
    expect(l.event.id).toBe("wedding");
    expect(l.why).toBe("made");
    expect(l.fellBack).toBe(false);
    expect(l.day).toBe("2026-11-09");
  });

  it("leads with a party within a month, said by its day, over her newest", () => {
    // Team lunch is two days out and JO's newest is the launch, made five days ago.
    const l = lead(JO, "newest");
    expect(l.event.id).toBe("lunch");
    expect(l.why).toBe("near");
    expect(l.day).toBe("2026-11-12");
  });

  it("measures a range by its nearest day: ahead by its first, behind by its last", () => {
    const ahead = hostedEvent({
      id: "ahead",
      createdAt: "2026-06-01T12:00:00Z",
      date: "2026-11-20",
      endDate: "2026-11-22",
    });
    const behind = hostedEvent({
      id: "behind",
      createdAt: "2026-05-01T12:00:00Z",
      date: "2026-10-12",
      endDate: "2026-10-14",
    });
    expect(lead([ahead], "newest").day).toBe("2026-11-20");
    expect(lead([behind], "newest").day).toBe("2026-10-14");
    // 27 days since it ended: still within the month; at 31 it is not, and her newest leads.
    expect(lead([behind], "newest").why).toBe("near");
    const older = hostedEvent({
      id: "older",
      createdAt: "2026-05-01T12:00:00Z",
      date: "2026-10-08",
      endDate: "2026-10-10",
    });
    expect(lead([older], "newest").why).toBe("made");
  });

  it("reads the day an event was made in the viewer's zone, never the server's", () => {
    const made = hostedEvent({
      id: "late",
      createdAt: "2026-11-10T03:00:00Z",
    });
    // 03:00 UTC on the 10th is still the 9th for a viewer in California.
    const west = (iso: string) =>
      iso.startsWith("2026-11-10T03") ? "2026-11-09" : iso.slice(0, 10);
    expect(leadOf([made], TODAY, "newest")!.day).toBe("2026-11-10");
    expect(leadOf([made], TODAY, "newest", west)!.day).toBe("2026-11-09");
  });
});

describe("Upcoming", () => {
  it("leads with the soonest dated party ahead, however far", () => {
    const l = lead(JO, "upcoming");
    expect(l.event.id).toBe("lunch");
    expect(l.why).toBe("next");
    expect(l.fellBack).toBe(false);
    expect(l.day).toBe("2026-11-12");
    // With the lunch gone, the holiday is the soonest by its date.
    const later = JO.filter((e) => e.id !== "lunch");
    expect(lead(later, "upcoming").event.id).toBe("holiday");
  });

  it("falls back to her newest, and says nothing was dated ahead", () => {
    const l = lead(NIA, "upcoming");
    expect(l.event.id).toBe("wedding");
    expect(l.fellBack).toBe(true);
    expect(l.why).toBe("made");
  });

  it("never counts a party that has already begun or happened", () => {
    const past = [
      hostedEvent({
        id: "a",
        date: "2026-11-09",
        createdAt: "2026-10-01T00:00:00Z",
      }),
      hostedEvent({
        id: "b",
        date: "2026-10-01",
        createdAt: "2026-10-02T00:00:00Z",
      }),
    ];
    expect(lead(past, "upcoming").fellBack).toBe(true);
  });

  it("sends a tie on the date to the event made last", () => {
    const same = [
      hostedEvent({
        id: "first",
        date: "2026-12-01",
        createdAt: "2026-09-01T00:00:00Z",
      }),
      hostedEvent({
        id: "second",
        date: "2026-12-01",
        createdAt: "2026-09-02T00:00:00Z",
      }),
    ];
    expect(lead(same, "upcoming").event.id).toBe("second");
    expect(lead([...same].reverse(), "upcoming").event.id).toBe("second");
  });
});

describe("Where you left off (opened)", () => {
  it("leads with the event she was in last", () => {
    const l = lead(JO, "opened");
    expect(l.event.id).toBe("wedding-b");
    expect(l.why).toBe("opened");
    expect(l.day).toBeNull();
    expect(lead(NIA, "opened").event.id).toBe("engagement");
  });

  it("falls back to her newest while she has opened nothing", () => {
    const none = NIA.map((e) => ({ ...e, openedAt: null }));
    const l = lead(none, "opened");
    expect(l.event.id).toBe("wedding");
    expect(l.fellBack).toBe(true);
  });

  it("goes by the instant she opened it, not the order she holds them in", () => {
    const events = [
      hostedEvent({
        id: "a",
        createdAt: "2026-09-03T00:00:00Z",
        openedAt: "2026-11-01T10:00:00Z",
      }),
      hostedEvent({
        id: "b",
        createdAt: "2026-09-02T00:00:00Z",
        openedAt: "2026-11-01T10:00:01Z",
      }),
      hostedEvent({
        id: "c",
        createdAt: "2026-09-01T00:00:00Z",
        openedAt: null,
      }),
    ];
    expect(lead(events, "opened").event.id).toBe("b");
  });
});

describe("Latest photos", () => {
  it("leads with the album photographs last landed in, said by that day", () => {
    const l = lead(JO, "photos");
    expect(l.event.id).toBe("offsite");
    expect(l.why).toBe("photos");
    expect(l.day).toBe("2026-11-02");
    expect(lead(NIA, "photos").event.id).toBe("engagement");
  });

  it("falls back to her newest while no album holds a photograph", () => {
    const bare = NIA.map((e) => ({ ...e, lastArrival: null }));
    const l = lead(bare, "photos");
    expect(l.event.id).toBe("wedding");
    expect(l.fellBack).toBe(true);
  });
});

describe("a party on its own day", () => {
  it("★ leads under every rule, and nothing is left to choose", () => {
    const tonight = hostedEvent({
      id: "tonight",
      name: "Tonight",
      createdAt: "2026-10-01T00:00:00Z",
      date: TODAY,
    });
    const events = [...JO, tonight];
    for (const rule of RULES) {
      const l = lead(events, rule);
      expect(l.event.id, rule).toBe("tonight");
      expect(l.why).toBe("live");
      expect(l.phase).toBe("live");
    }
    expect(hasChoice(events, TODAY)).toBe(false);
  });

  it("includes an undated album whose photographs are landing today", () => {
    const landing = hostedEvent({
      id: "landing",
      createdAt: "2026-10-01T00:00:00Z",
      lastArrival: { at: "2026-11-10T09:00:00Z", day: TODAY },
    });
    expect(lead([...NIA, landing], "photos").why).toBe("live");
    expect(hasChoice([...NIA, landing], TODAY)).toBe(false);
  });
});

describe("whether there is a choice", () => {
  it("is when she has more than one event and none is on its day", () => {
    expect(hasChoice(NIA, TODAY)).toBe(true);
    expect(hasChoice(JO, TODAY)).toBe(true);
  });

  it("is not for one event, or none: there is nothing to lead instead", () => {
    expect(hasChoice([NIA[0]!], TODAY)).toBe(false);
    expect(hasChoice([], TODAY)).toBe(false);
    expect(leadOf([], TODAY, "newest")).toBeNull();
    expect(leadsOf([], TODAY)).toBeNull();
  });
});

describe("what all four rules lead with, together", () => {
  it("gives Jo's quiet day four different stages, one a rule", () => {
    const leads = leadsOf(JO, TODAY)!;
    expect(
      Object.fromEntries(RULES.map((r) => [r, leads[r].event.id])),
    ).toEqual({
      newest: "lunch",
      upcoming: "lunch",
      opened: "wedding-b",
      photos: "offsite",
    });
  });

  it("is deterministic: the same events in another order lead the same way", () => {
    const a = leadsOf(JO, TODAY)!;
    const b = leadsOf([...JO].reverse(), TODAY)!;
    for (const r of RULES) expect(b[r].event.id).toBe(a[r].event.id);
  });
});

describe("what her account keeps of the rule", () => {
  it("narrows a stranger to the default, whatever was written", () => {
    expect(resolveRule("upcoming")).toBe("upcoming");
    for (const forged of [
      "",
      "UPCOMING",
      "photos ",
      null,
      undefined,
      3,
      {},
      ["opened"],
    ])
      expect(resolveRule(forged)).toBe("newest");
  });

  it("reads the rule from the column's own key, beside the Display's, and nothing else", () => {
    expect(leadFrom({ layout: "table", [LEAD_KEY]: "photos" })).toBe("photos");
    expect(leadFrom({ layout: "table" })).toBe("newest");
    for (const wrong of [null, undefined, "photos", 3, [], [LEAD_KEY]])
      expect(leadFrom(wrong)).toBe("newest");
  });

  it("keeps it sparse: the default is no key, and the Display's keys are never touched", () => {
    const display = { layout: "table", sort: "date" };
    expect(withLead(display, "upcoming")).toEqual({
      ...display,
      lead: "upcoming",
    });
    expect(withLead({ ...display, lead: "upcoming" }, "newest")).toEqual(
      display,
    );
    expect(withLead({ ...display, lead: "upcoming" }, "photos")).toEqual({
      ...display,
      lead: "photos",
    });
    expect(withLead({}, "newest")).toEqual({});
  });
});
