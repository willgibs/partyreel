import { describe, expect, it } from "vitest";

import { nextStepForEvent, type NextStepEvent } from "./next-step";

/**
 * AN EVENT'S QUEUES, PINNED AS A RULE (home-wiring, 2026-09-20; the queue half of the dashboard's one
 * item per event since host-dashboard r1, `attention.ts`).
 *
 * Two things are contract here and neither is wording:
 *
 *   1. THE PRECEDENCE. Will's order is a queue waiting, then uploads paused,
 *      then a reel one photo short, then an event dated tomorrow. An event
 *      that matches several offers only the FIRST, because a host with four
 *      events and four steps each is back at the inbox this page replaced.
 *   2. "TOMORROW" IS TOMORROW IN THE HOST'S OWN CALENDAR. The date arithmetic
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
    // At none the event's own checklist speaks (the hub's head), and the step stays quiet.
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

describe("people at the door (the doors, event-settings r1)", () => {
  it("★ lead the queues: someone waiting at a held door outranks a held photograph", () => {
    const step = nextStepForEvent(
      { ...base, waiting: 2, pending: 7, acceptingUploads: false },
      TODAY,
    );
    expect(step?.kind).toBe("door");
    expect(step?.tone).toBe("waiting");
  });

  it("open the Guests room at its At the door", () => {
    const step = nextStepForEvent({ ...base, waiting: 1 }, TODAY);
    expect(step?.href).toBe("/dashboard/e1/guests#at-the-door");
    expect(step?.label).toContain(base.name);
  });

  it("an event with nobody at its door, or none read, steps as before", () => {
    expect(
      nextStepForEvent({ ...base, waiting: 0, pending: 3 }, TODAY)?.kind,
    ).toBe("review");
    expect(nextStepForEvent({ ...base, pending: 3 }, TODAY)?.kind).toBe(
      "review",
    );
  });
});
