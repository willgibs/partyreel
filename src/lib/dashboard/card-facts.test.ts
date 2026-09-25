import { describe, expect, it } from "vitest";

import { cardStillKeys, parseEventStills } from "./card-facts";

/**
 * THE CARDS' STILLS, FROM THE JSONB TO THE LIST A CARD DISSOLVES THROUGH (`reel-host`, his `pulse`
 * note). What is contract: a shape the cards cannot read fails loudly (never "no stills"); the
 * card's cover leads, since the card paints it before any script; one photograph is never two
 * stills (a cover's preview and original are the same photo); and the list stops at its cap.
 */

describe("parseEventStills", () => {
  it("reads each event's preview keys, newest first, and leaves an event with none absent", () => {
    const stills = parseEventStills({ e1: ["p3", "p2", "p1"], e2: ["q1"] });
    expect(stills.get("e1")).toEqual(["p3", "p2", "p1"]);
    expect(stills.get("e2")).toEqual(["q1"]);
    expect(stills.has("e3")).toBe(false);
    expect(parseEventStills(null).size).toBe(0);
  });

  it("refuses a shape it cannot read rather than drawing no stills", () => {
    expect(() => parseEventStills({ e1: "p1" })).toThrow(/event_stills/);
    expect(() => parseEventStills({ e1: [""] })).toThrow(/event_stills/);
    expect(() => parseEventStills([["p1"]])).toThrow(/event_stills/);
  });
});

describe("cardStillKeys", () => {
  const cover = { previewKey: "p3", originalKey: "o3" };

  it("leads with the cover the card paints, then the newest others", () => {
    expect(cardStillKeys(cover, ["p3", "p2", "p1"], 4)).toEqual([
      "p3",
      "p2",
      "p1",
    ]);
  });

  it("never shows the cover's photograph twice, by either of its keys", () => {
    // A cover with no preview draws its original; the still list may still carry nothing of it.
    expect(
      cardStillKeys({ previewKey: null, originalKey: "o9" }, ["p8", "p7"], 4),
    ).toEqual(["o9", "p8", "p7"]);
    expect(cardStillKeys(cover, ["o3", "p3", "p2"], 4)).toEqual(["p3", "p2"]);
  });

  it("stops at the cap", () => {
    expect(cardStillKeys(cover, ["p2", "p1", "p0", "px"], 3)).toEqual([
      "p3",
      "p2",
      "p1",
    ]);
  });

  it("stands on stills alone when an event has no cover, and on nothing when it has neither", () => {
    expect(cardStillKeys(undefined, ["p2", "p1"], 4)).toEqual(["p2", "p1"]);
    expect(cardStillKeys(undefined, undefined, 4)).toEqual([]);
  });
});
