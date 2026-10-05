/**
 * THE CAMERA'S COUNT IS THE SERVER'S, KEPT UP BETWEEN TWO READS: the server's `{used, cap, taken, ceiling}` plus the
 * shots this camera took since its last read began, and the sentence the next shot would meet in the server's own words.
 */
import { describe, expect, it } from "vitest";

import {
  ROLL_RETAKES,
  ROLL_RETAKES_SPENT_MESSAGE,
  ROLL_SHOTS,
  rollSpentMessage,
} from "@/lib/disposable/roll";

import { rollView } from "./roll-view";

describe("rollView", () => {
  it("reads a full roll before the server has answered, at the event's size", () => {
    expect(rollView({ server: null, rollSize: 12, pending: 0 })).toEqual({
      cap: 12,
      used: 0,
      left: 12,
      frame: 1,
      refusal: null,
      ceilingReached: false,
    });
    // ★ RESHAPED ON PURPOSE (settings-wiring, 20261005190000; scar kept: no size named, or one past the host's bounds, is
    // the product's roll; reason dropped: 24 was the most a host could name, so 99 read as 24). Any count to 99 is hers.
    expect(rollView({ server: null, rollSize: null, pending: 0 }).cap).toBe(
      ROLL_SHOTS,
    );
    expect(rollView({ server: null, rollSize: 99, pending: 0 }).cap).toBe(99);
    expect(rollView({ server: null, rollSize: 50, pending: 0 }).cap).toBe(50);
    for (const past of [0, 100, 12.5]) {
      expect(rollView({ server: null, rollSize: past, pending: 0 }).cap).toBe(
        ROLL_SHOTS,
      );
    }
  });

  it("steps down by the shots taken since the read, the instant they are taken", () => {
    const server = { used: 6, cap: 24, taken: 6, ceiling: 72 };
    expect(rollView({ server, rollSize: 24, pending: 0 })).toMatchObject({
      used: 6,
      left: 18,
      frame: 7,
    });
    expect(rollView({ server, rollSize: 24, pending: 2 })).toMatchObject({
      used: 8,
      left: 16,
      frame: 9,
    });
  });

  it("ends at the roll's size in the server's own sentence, and never counts past it", () => {
    const server = { used: 23, cap: 24, taken: 23, ceiling: 72 };
    const spent = rollView({ server, rollSize: 24, pending: 3 });
    expect(spent).toMatchObject({ used: 24, left: 0, frame: 24 });
    expect(spent.refusal).toBe(rollSpentMessage(24));
    expect(spent.ceilingReached).toBe(false);
  });

  it("says the ceiling's words when every retake is spent with frames still free", () => {
    const server = {
      used: 10,
      cap: 24,
      taken: 24 * ROLL_RETAKES,
      ceiling: 24 * ROLL_RETAKES,
    };
    const view = rollView({ server, rollSize: 24, pending: 0 });
    expect(view.left).toBe(14);
    expect(view.refusal).toBe(ROLL_RETAKES_SPENT_MESSAGE);
    expect(view.ceilingReached).toBe(true);
  });

  it("counts a shot past the read against the ceiling too", () => {
    const server = { used: 3, cap: 24, taken: 71, ceiling: 72 };
    expect(rollView({ server, rollSize: 24, pending: 0 }).refusal).toBeNull();
    expect(rollView({ server, rollSize: 24, pending: 1 }).refusal).toBe(
      ROLL_RETAKES_SPENT_MESSAGE,
    );
  });

  it("reads the roll first when both are spent (the roll's sentence is the truer one)", () => {
    const server = { used: 24, cap: 24, taken: 72, ceiling: 72 };
    const view = rollView({ server, rollSize: 24, pending: 0 });
    expect(view.refusal).toBe(rollSpentMessage(24));
    expect(view.ceilingReached).toBe(false);
  });

  it("takes the server's size over the event's where they differ (a host who changed the roll mid-party)", () => {
    const server = { used: 2, cap: 10, taken: 2, ceiling: 30 };
    expect(rollView({ server, rollSize: 24, pending: 0 })).toMatchObject({
      cap: 10,
      left: 8,
    });
  });
});
