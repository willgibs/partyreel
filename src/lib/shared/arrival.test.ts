import { describe, expect, it } from "vitest";

import { arrivalMarks } from "@/lib/shared/arrival";

/**
 * WHICH IDS GLOW AND WHICH ONE SWEEPS (Will, `landing=sweep`, 2026-09-21: "This
 * should be consistent across guest and host arrival experiences. Would feel
 * weird for it to be handled differently on either.").
 *
 * FUNCTION ONLY, and the function is the whole grammar: nothing here reads a
 * duration, an opacity or a keyframe. What is held is the two rules that decide
 * which mark an id takes, because both are invisible in the source and both
 * shipped as bugs before they were rules — a guest's own photograph lit as a
 * stranger's arrival, and a batch of twelve stacking the shimmer up the gallery
 * (which is why Will banked it in the first place).
 *
 * The HOLD (`useArrivalMarks`) is deliberately not pinned here: it is timers and
 * a ledger, and what it guarantees — an id is lit once, ever — is a statement
 * about React re-renders rather than about the grammar.
 */
describe("your own never glows, it sweeps", () => {
  it("subtracts every id this device landed from the glowing set", () => {
    const marks = arrivalMarks({
      arrivals: ["mine", "hers", "his"],
      ownLandings: ["mine"],
    });
    expect(marks.arrived).toEqual(["hers", "his"]);
  });

  it("glows everything when this device has landed nothing", () => {
    expect(
      arrivalMarks({ arrivals: ["a", "b"], ownLandings: [] }).arrived,
    ).toEqual(["a", "b"]);
  });

  it("is empty on a still album", () => {
    const marks = arrivalMarks({ arrivals: [], ownLandings: [] });
    expect(marks.arrived).toEqual([]);
    expect(marks.landed).toBeNull();
  });
});

describe("only the newest of your own sweeps", () => {
  it("takes the head of the landings, never the batch", () => {
    // Newest first, which is the order the gallery prepends in.
    expect(
      arrivalMarks({ arrivals: [], ownLandings: ["third", "second", "first"] })
        .landed,
    ).toBe("third");
  });

  it("is null before anything of yours has landed", () => {
    expect(
      arrivalMarks({ arrivals: ["a"], ownLandings: [] }).landed,
    ).toBeNull();
  });

  it("never marks one id both ways", () => {
    const marks = arrivalMarks({
      arrivals: ["mine"],
      ownLandings: ["mine"],
    });
    expect(marks.landed).toBe("mine");
    expect(marks.arrived).not.toContain("mine");
  });
});
