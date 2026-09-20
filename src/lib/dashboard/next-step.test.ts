// @contract-for: src/lib/dashboard/next-step.ts
import { describe, expect, it } from "vitest";

import {
  nextStepForEvent,
  resolveNextSteps,
  type NextStepEvent,
} from "./next-step";

/**
 * THE PULSE'S FIRST BAND, PINNED AS A RULE (home-wiring, 2026-09-20).
 *
 * Three things are contract here and none of them is wording:
 *
 *   1. THE PRECEDENCE. Will's order is a queue waiting, then uploads paused,
 *      then a live event with no reel, then an event dated tomorrow. An event
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

const base: NextStepEvent = {
  id: "e1",
  name: "Rooftop Summer Party",
  pending: 0,
  items: 40,
  acceptingUploads: true,
  hasReel: true,
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
        hasReel: false,
        eventDate: "2026-09-21",
      },
      TODAY,
    );
    expect(step?.kind).toBe("review");
  });

  it("falls to paused uploads once the queue is clear", () => {
    const step = nextStepForEvent(
      { ...base, acceptingUploads: false, hasReel: false },
      TODAY,
    );
    expect(step?.kind).toBe("paused");
  });

  it("offers the reel only for a live album that has something to cut", () => {
    expect(
      nextStepForEvent({ ...base, hasReel: false }, TODAY)?.kind,
    ).toBe("reel");
    // An album with no photographs in it cannot be cut into a reel, and a step
    // the host cannot take is worse than no step at all.
    expect(
      nextStepForEvent({ ...base, hasReel: false, items: 0 }, TODAY),
    ).toBeNull();
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

  it("links the reel step at the reel, not at the event", () => {
    const step = nextStepForEvent({ ...base, hasReel: false }, TODAY);
    expect(step?.href).toBe("/dashboard/e1/reel");
  });
});

describe("the band as a whole", () => {
  const two: NextStepEvent[] = [
    { ...base, id: "a", name: "A", pending: 3 },
    { ...base, id: "b", name: "B", hasReel: false },
  ];

  it("gives each event exactly one step, in the order it was handed them", () => {
    const steps = resolveNextSteps({ events: two, storagePct: 10, today: TODAY });
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
