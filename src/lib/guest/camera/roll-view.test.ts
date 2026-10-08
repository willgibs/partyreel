/**
 * THE CAMERA'S COUNT IS THE SERVER'S, KEPT UP BETWEEN TWO READS: the server's `{used, cap, taken, ceiling}` plus the
 * shots this camera took since its last read began, the sentence the next shot would meet in the server's own words,
 * and her re-shoots: the take-backs that can still free a frame under the ceiling, her roll plus 3.
 */
import { describe, expect, it } from "vitest";

import {
  ROLL_RESHOOTS,
  ROLL_RESHOOTS_SPENT_MESSAGE,
  ROLL_SHOTS,
  rollCeiling,
  rollSpentMessage,
} from "@/lib/disposable/roll";

import { rollView } from "./roll-view";

/** The server's answer for a roll of `cap`, its ceiling the roll plus 3. */
const answer = (used: number, taken: number, cap = 24) => ({
  used,
  cap,
  taken,
  ceiling: rollCeiling(cap),
});

describe("rollView", () => {
  it("reads a full roll before the server has answered, at the event's size, its 3 re-shoots whole", () => {
    expect(rollView({ server: null, rollSize: 12, pending: 0 })).toEqual({
      cap: 12,
      used: 0,
      held: 0,
      left: 12,
      frame: 1,
      refusal: null,
      ceilingReached: false,
      reshoots: ROLL_RESHOOTS,
      allowance: ROLL_RESHOOTS,
      removalFrees: true,
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

  it("steps down by the shots taken since the read, the instant they are taken, and a shot spends no re-shoot", () => {
    const server = answer(6, 6);
    expect(rollView({ server, rollSize: 24, pending: 0 })).toMatchObject({
      used: 6,
      left: 18,
      frame: 7,
      reshoots: 3,
    });
    expect(rollView({ server, rollSize: 24, pending: 2 })).toMatchObject({
      used: 8,
      left: 16,
      frame: 9,
      reshoots: 3,
    });
  });

  it("ends at the roll's size in the server's own sentence, and never counts past it", () => {
    const spent = rollView({
      server: answer(23, 23),
      rollSize: 24,
      pending: 3,
    });
    expect(spent).toMatchObject({ used: 24, held: 24, left: 0, frame: 24 });
    expect(spent.removalFrees).toBe(true);
    expect(spent.refusal).toBe(rollSpentMessage(24));
    expect(spent.ceilingReached).toBe(false);
  });

  // ★ RESHAPED ON PURPOSE (camera-wiring; scar kept: the ceiling's own words with frames still free; reason dropped:
  // three rolls' worth, and the count said 14 left beside a stopped shutter). The count is what she can still take.
  it("says the ceiling's words when every re-shoot is spent with frames still free, and counts none left", () => {
    const view = rollView({
      server: answer(10, rollCeiling(24)),
      rollSize: 24,
      pending: 0,
    });
    expect(view.left).toBe(0);
    expect(view.refusal).toBe(ROLL_RESHOOTS_SPENT_MESSAGE);
    expect(view.ceilingReached).toBe(true);
    expect(view.reshoots).toBe(0);
    expect(view.removalFrees).toBe(false);
  });

  it("counts a shot past the read against the ceiling too", () => {
    const server = answer(3, 26);
    expect(rollView({ server, rollSize: 24, pending: 0 })).toMatchObject({
      refusal: null,
      left: 1,
    });
    expect(rollView({ server, rollSize: 24, pending: 1 }).refusal).toBe(
      ROLL_RESHOOTS_SPENT_MESSAGE,
    );
  });

  // ★ RESHAPED ON PURPOSE (camera-wiring; scar kept: the roll's sentence is the truer one; reason dropped: with
  // three rolls' worth the roll's end still offered "Remove a shot" past the ceiling, freeing nothing).
  it("reads the roll first when both are spent, and no take-back frees a frame then", () => {
    const view = rollView({
      server: answer(24, rollCeiling(24)),
      rollSize: 24,
      pending: 0,
    });
    expect(view.refusal).toBe(rollSpentMessage(24));
    expect(view.ceilingReached).toBe(false);
    expect(view.reshoots).toBe(0);
    expect(view.removalFrees).toBe(false);
  });

  it("takes the server's size over the event's where they differ (a host who changed the roll mid-party)", () => {
    expect(
      rollView({ server: answer(2, 2, 10), rollSize: 24, pending: 0 }),
    ).toMatchObject({ cap: 10, left: 8, reshoots: 3 });
  });

  it("★ holds what she shot when the host made the roll smaller after (red-team 56's LOW): no frame freed by one removal", () => {
    // Two of hers, and the roll now 1: she holds two, the roll is spent, and removing one leaves it spent.
    const server = answer(2, 2, 1);
    const view = rollView({ server, rollSize: 1, pending: 0 });
    expect(view).toMatchObject({ cap: 1, used: 1, held: 2, left: 0 });
    expect(view.refusal).toBe(rollSpentMessage(1));
    expect(view.removalFrees).toBe(false);
    // One removed: one held, a roll of 1 spent, and now a removal would free its frame.
    expect(
      rollView({ server: { ...server, used: 1 }, rollSize: 1, pending: 0 })
        .removalFrees,
    ).toBe(true);
  });
});

describe("her 3 re-shoots (guest-moments r1's `limit=three`)", () => {
  it("★ each take-back frees one frame and spends one re-shoot; the fourth frees none, and the roll ends at 27 of 24", () => {
    const seen: number[] = [];
    let used = 24;
    let taken = 24;
    const read = () => {
      const v = rollView({
        server: answer(used, taken),
        rollSize: 24,
        pending: 0,
      });
      seen.push(v.reshoots);
      return v;
    };
    expect(read()).toMatchObject({ left: 0, reshoots: 3, removalFrees: true });
    for (let i = 0; i < 3; i++) {
      used -= 1; // she takes one back: its frame is free
      expect(read()).toMatchObject({ left: 1, refusal: null });
      used += 1; // and shoots again into it
      taken += 1;
      read();
    }
    expect(taken).toBe(27);
    expect(read()).toMatchObject({
      left: 0,
      reshoots: 0,
      removalFrees: false,
      refusal: rollSpentMessage(24),
    });
    // The fourth take-back leaves a frame no shot may fill: the ceiling's own words.
    used -= 1;
    expect(read()).toMatchObject({
      left: 0,
      ceilingReached: true,
      refusal: ROLL_RESHOOTS_SPENT_MESSAGE,
    });
    expect(seen).toEqual([3, 2, 2, 1, 1, 0, 0, 0, 0]);
  });

  it("a take-back of a shot taken since the read spends its re-shoot at once: the ledger keeps every shot she took", () => {
    // The server last counted 5; this camera took 2 since, and she took one of those back.
    const server = answer(5, 5);
    expect(
      rollView({ server, rollSize: 24, pending: 1, taken: 2 }),
    ).toMatchObject({ used: 6, left: 18, reshoots: 2 });
    // Counted as if it was never taken, the re-shoot would stand until the next read.
    expect(rollView({ server, rollSize: 24, pending: 1 }).reshoots).toBe(3);
  });

  it("a frame the host freed counts only as far as the ceiling lets her fill it", () => {
    // The host removed 5 of her 24: 5 frames free, but 3 shots under the ceiling, and no take-back frees another.
    const view = rollView({ server: answer(19, 24), rollSize: 24, pending: 0 });
    expect(view).toMatchObject({ left: 3, reshoots: 0, removalFrees: false });
    expect(
      rollView({ server: answer(22, 27), rollSize: 24, pending: 0 }),
    ).toMatchObject({ left: 0, ceilingReached: true });
  });

  it("names the server's own allowance, whatever this camera's constant says (an older server's three rolls)", () => {
    expect(
      rollView({
        server: { used: 6, cap: 24, taken: 6, ceiling: 72 },
        rollSize: 24,
        pending: 0,
      }),
    ).toMatchObject({ allowance: 48, reshoots: 48 });
    expect(rollView({ server: null, rollSize: 1, pending: 0 }).allowance).toBe(
      ROLL_RESHOOTS,
    );
  });
  it("★ a roll_spent refusal no read has answered spends the roll at once: no frame is offered that the server just refused", () => {
    // The camera thought two frames were left (another phone of hers used them): the refusal is the server's count.
    const server = answer(21, 21);
    expect(rollView({ server, rollSize: 24, pending: 0 })).toMatchObject({
      used: 21,
      left: 3,
      refusal: null,
    });
    const refused = rollView({
      server,
      rollSize: 24,
      pending: 0,
      refused: true,
    });
    expect(refused).toMatchObject({
      used: 24,
      held: 24,
      left: 0,
      frame: 24,
      refusal: rollSpentMessage(24),
    });
    // Before any read has answered at all (a camera first opened in a dead zone), it spends the roll at the event's size.
    expect(
      rollView({ server: null, rollSize: 12, pending: 0, refused: true }),
    ).toMatchObject({ used: 12, left: 0, refusal: rollSpentMessage(12) });
    // Absent or false is the count as it was.
    expect(
      rollView({ server, rollSize: 24, pending: 0, refused: false }),
    ).toEqual(rollView({ server, rollSize: 24, pending: 0 }));
  });
});
