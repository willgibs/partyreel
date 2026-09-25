import { describe, expect, it } from "vitest";

import {
  foldNextSteps,
  nextStepForEvent,
  resolveNextSteps,
  type NextStep,
  type NextStepEvent,
} from "./next-step";

/**
 * THE PULSE'S FIRST BAND, PINNED AS A RULE (home-wiring, 2026-09-20).
 *
 * Three things are contract here and none of them is wording:
 *
 *   1. THE PRECEDENCE. Will's order is a queue waiting, then uploads paused,
 *      then a reel one photo short, then an event dated tomorrow. An event
 *      that matches several offers only the FIRST, because a host with four
 *      events and four steps each is back at the inbox this page replaced.
 *   2. ONE STEP PER EVENT, AND THE STORAGE STEP LAST. The shelf is not a party
 *      and must not push a waiting queue down the row.
 *   3. "TOMORROW" IS TOMORROW IN THE HOST'S OWN CALENDAR. The date arithmetic
 *      is the part that silently breaks for anyone west of UTC, so it is
 *      pinned with a year boundary, where a naive implementation is wrong.
 *
 * The LABELS are precedent, not contract: a test that pinned copy would make
 * every future wording ruling a red build (design law: never pin copy).
 */

// A settled event: open, caught up, its reel live.
const base: NextStepEvent = {
  id: "e1",
  name: "Rooftop Summer Party",
  pending: 0,
  acceptingUploads: true,
  showReel: true,
  liveReelEnabled: true,
  reelItems: 2,
  eventDate: null,
};

const TODAY = "2026-09-20";

describe("the next best step, per event", () => {
  it("offers nothing for an event that wants nothing", () => {
    expect(nextStepForEvent(base, TODAY)).toBeNull();
  });

  it("puts a waiting queue first, above every other claim on the host", () => {
    const step = nextStepForEvent(
      {
        ...base,
        pending: 7,
        acceptingUploads: false,
        reelItems: 1,
        eventDate: "2026-09-21",
      },
      TODAY,
    );
    expect(step?.kind).toBe("review");
  });

  it("falls to paused uploads once the queue is clear", () => {
    const step = nextStepForEvent(
      { ...base, acceptingUploads: false, reelItems: 1 },
      TODAY,
    );
    expect(step?.kind).toBe("paused");
  });

  it("says the reel is one photo short, and only then", () => {
    // Reshaped with the live reel (reel-host-wiring, `pulse=band`): the stored
    // reel's "Make the reel" is gone, since the live reel makes itself from the
    // second photo. The step is the photo that starts it.
    expect(nextStepForEvent({ ...base, reelItems: 1 }, TODAY)?.kind).toBe(
      "reel",
    );
    // At two it plays, and the step leaves.
    expect(nextStepForEvent({ ...base, reelItems: 2 }, TODAY)).toBeNull();
    // At none the event's own launch list speaks, and the band stays quiet.
    expect(nextStepForEvent({ ...base, reelItems: 0 }, TODAY)).toBeNull();
  });

  it("never waits on a reel the host turned off", () => {
    expect(
      nextStepForEvent({ ...base, showReel: false, reelItems: 1 }, TODAY),
    ).toBeNull();
  });

  it("never waits on a reel the platform lever paused, even with the switch on", () => {
    expect(
      nextStepForEvent(
        { ...base, liveReelEnabled: false, reelItems: 1 },
        TODAY,
      ),
    ).toBeNull();
  });

  it("names the event, since a host has several", () => {
    const step = nextStepForEvent({ ...base, reelItems: 1 }, TODAY);
    expect(step?.label).toContain(base.name);
  });

  it("offers the code the day before, and not on the day or after", () => {
    const dated = (eventDate: string) =>
      nextStepForEvent({ ...base, eventDate }, TODAY)?.kind ?? null;
    expect(dated("2026-09-21")).toBe("print");
    expect(dated("2026-09-20")).toBeNull();
    expect(dated("2026-09-22")).toBeNull();
  });

  it("crosses a year boundary without losing a day", () => {
    const step = nextStepForEvent(
      { ...base, eventDate: "2027-01-01" },
      "2026-12-31",
    );
    expect(step?.kind).toBe("print");
  });

  it("links the reel step at the event's page, where the Reel card and Add photos sit", () => {
    // The Studio's route is a redirect now; the step lands where the photo is added.
    const step = nextStepForEvent({ ...base, reelItems: 1 }, TODAY);
    expect(step?.href).toBe("/dashboard/e1");
  });
});

describe("the band as a whole", () => {
  const two: NextStepEvent[] = [
    { ...base, id: "a", name: "A", pending: 3 },
    { ...base, id: "b", name: "B", reelItems: 1 },
  ];

  it("gives each event exactly one step, in the order it was handed them", () => {
    const steps = resolveNextSteps({
      events: two,
      storagePct: 10,
      today: TODAY,
    });
    expect(steps.map((s) => s.eventId)).toEqual(["a", "b"]);
  });

  it("adds the storage step last, and only over the threshold", () => {
    expect(
      resolveNextSteps({ events: two, storagePct: 85, today: TODAY }),
    ).toHaveLength(2);
    const over = resolveNextSteps({
      events: two,
      storagePct: 91,
      today: TODAY,
    });
    expect(over).toHaveLength(3);
    expect(over.at(-1)?.kind).toBe("storage");
    expect(over.at(-1)?.eventId).toBeNull();
  });

  it("returns an empty band for a settled host rather than inventing work", () => {
    // The BAND renders a calm line in this case; the RULE must not manufacture
    // a step to avoid it, or the page starts nagging hosts who are up to date.
    expect(
      resolveNextSteps({ events: [base], storagePct: 3, today: TODAY }),
    ).toEqual([]);
  });
});

describe("the band's fold (`busy=collapsed`, app-shape round two, 2026-09-20)", () => {
  const step = (over: Partial<NextStep>): NextStep => ({
    kind: "review",
    eventId: null,
    label: "step",
    short: "step",
    href: "/dashboard",
    tone: "quiet",
    ...over,
  });

  // Maya's Saturday, stress-tested: two queues waiting, a shelf at 96%, and
  // three quiet suggestions — six steps, the whole reason the fold exists.
  const busy: NextStep[] = [
    step({ eventId: "wedding", label: "A", tone: "waiting" }),
    step({ eventId: "trivia", label: "B", tone: "waiting" }),
    step({ eventId: "rooftop", label: "C", tone: "quiet", kind: "reel" }),
    step({ eventId: "sixtieth", label: "D", tone: "quiet", kind: "paused" }),
    step({ eventId: "bonfire", label: "E", tone: "quiet", kind: "print" }),
    step({ eventId: null, label: "F", tone: "warning", kind: "storage" }),
  ];

  it("ranks a waiting queue over a full shelf over a quiet suggestion", () => {
    const { head, rest } = foldNextSteps(busy);
    // The two waiting queues, then the storage warning: exactly Will's picture
    // ("12 waiting…", "5 waiting…", "96% of your storage used", "+3 more").
    expect(head.map((s) => s.label)).toEqual(["A", "B", "F"]);
    expect(rest.map((s) => s.label)).toEqual(["C", "D", "E"]);
  });

  it("keeps two steps of the same tone in their own order rather than re-ranking them", () => {
    const sameTone = [
      step({ eventId: "w", label: "W", tone: "waiting" }),
      step({ eventId: "x", label: "X", tone: "waiting" }),
      step({ eventId: "y", label: "Y", tone: "waiting" }),
      step({ eventId: "z", label: "Z", tone: "waiting" }),
    ];
    const { head, rest } = foldNextSteps(sameTone);
    expect(head.map((s) => s.label)).toEqual(["W", "X", "Y"]);
    expect(rest.map((s) => s.label)).toEqual(["Z"]);
  });

  it("folds nothing when the band already fits", () => {
    const { head, rest } = foldNextSteps(busy.slice(0, 3));
    expect(head).toHaveLength(3);
    expect(rest).toEqual([]);
  });

  it("never re-ranks a band that already fits, even out of tone order", () => {
    // A quiet suggestion from the newer event, then a waiting queue from an
    // older one: today's order, untouched, because nothing here needs to
    // fold. Tone only enters once folding is real (`empty`/`first` stay
    // exactly as they render today, which is this case).
    const two = [
      step({ eventId: "new", label: "Newer", tone: "quiet" }),
      step({ eventId: "old", label: "Older", tone: "waiting" }),
    ];
    const { head, rest } = foldNextSteps(two);
    expect(head.map((s) => s.label)).toEqual(["Newer", "Older"]);
    expect(rest).toEqual([]);
  });

  it("folds nothing on an empty band either", () => {
    expect(foldNextSteps([])).toEqual({ head: [], rest: [] });
  });
});

describe("the storage step's door", () => {
  it("names no route, so the band opens the plan sheet in place rather than leaving the app", () => {
    // Every pricing door in the host app opens the plan sheet
    // (`gated-sites.test.ts`); this step used to be the one that left for the
    // marketing page, because its door was a path in a pure rule no scan read.
    const [shelf] = resolveNextSteps({
      events: [],
      storagePct: 91,
      today: TODAY,
    });
    expect(shelf?.kind).toBe("storage");
    expect(shelf?.href).toBeNull();
  });
});
