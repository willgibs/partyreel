import { describe, expect, it } from "vitest";

import { arrivalMarks, newIds } from "@/lib/shared/arrival";

/**
 * WHICH IDS WAIT AT THE ALBUM'S DOOR AND WHICH STAND AT ONCE, under the one light (Will, `landing=sweep`,
 * 2026-09-21: "This should be consistent across guest and host arrival experiences. Would feel weird for it to be
 * handled differently on either."; guest-moments r1, `own=glow`: her own photograph wears the rim and wash anyone's
 * does).
 *
 * ★ RESHAPED ON PURPOSE (album-moments-wiring): this file pinned "your own never glows, it sweeps" and "only the
 * newest of your own sweeps". The sweep retired at Will's `own=glow`, and both of its reasons went with it: a guest's
 * own photograph lit as a stranger's arrival (it is one light for every arrival now, hers included) and a batch of
 * twelve stacking the shimmer up the gallery (there is no shimmer to stack). THE SCAR KEPT: hers is still taken out of
 * what waits at the door, because the poll hands her landing in as an arrival a beat after her tile already stood,
 * and held there like a stranger's it would vanish from the rows for the hold.
 *
 * FUNCTION ONLY, and the function is the whole grammar: nothing here reads a duration, an opacity or a keyframe.
 * The HOLD (`useArrivalMarks`) is deliberately not pinned here: it is timers and a ledger, and what it guarantees
 * (an id is lit once, ever) is a statement about React re-renders rather than about the grammar.
 */
describe("her own never waits at the door", () => {
  it("subtracts every id this device landed from what waits", () => {
    const marks = arrivalMarks({
      arrivals: ["mine", "hers", "his"],
      ownLandings: ["mine"],
    });
    expect(marks.arrived).toEqual(["hers", "his"]);
  });

  it("holds everything at the door when this device has landed nothing", () => {
    expect(
      arrivalMarks({ arrivals: ["a", "b"], ownLandings: [] }).arrived,
    ).toEqual(["a", "b"]);
  });

  it("is empty on a still album", () => {
    const marks = arrivalMarks({ arrivals: [], ownLandings: [] });
    expect(marks.arrived).toEqual([]);
    expect(marks.own).toEqual([]);
  });
});

describe("every one of hers stands and glows, the batch whole", () => {
  it("hands each of her landings to be lit at once, newest first, never only the newest", () => {
    // Newest first, which is the order the gallery prepends in. The retired sweep took the head alone.
    expect(
      arrivalMarks({ arrivals: [], ownLandings: ["third", "second", "first"] })
        .own,
    ).toEqual(["third", "second", "first"]);
  });

  it("names none before anything of hers has landed", () => {
    expect(arrivalMarks({ arrivals: ["a"], ownLandings: [] }).own).toEqual([]);
  });

  it("never names one id both ways", () => {
    const marks = arrivalMarks({
      arrivals: ["mine"],
      ownLandings: ["mine"],
    });
    expect(marks.own).toEqual(["mine"]);
    expect(marks.arrived).not.toContain("mine");
  });
});

/**
 * THE GRAMMAR'S FIRST SENTENCE, WRITTEN ONCE (crumbs-27): what arrived is "an id in this render that was not in
 * the last". Both albums read `newIds` (the host's grid over its own state, the guest's `newArrivalIds` over its
 * snapshots), each keeping its own seed rule where it belongs: the host's is the state its first render seeds, the
 * guest's is said in `newArrivalIds` (its snapshot is empty by design at a teaser and a locked page). Their own
 * pins are `host-media-grid.test.tsx` and `reconcile-album-items.test.ts`; this is the diff alone.
 */
describe("newIds: an id in this render that was not in the last", () => {
  it("is what is new, and nothing else", () => {
    expect(newIds(["a", "b"], ["c", "a", "b"])).toEqual(new Set(["c"]));
    expect(newIds(["a", "b"], ["a", "b"])).toEqual(new Set());
  });

  it("marks nothing when items only leave", () => {
    expect(newIds(["a", "b", "c"], ["a"])).toEqual(new Set());
  });

  it("catches a batch, not just the newest (ten at once after a shut laptop wakes up)", () => {
    expect(newIds(["a"], ["e", "d", "c", "b", "a"])).toEqual(
      new Set(["e", "d", "c", "b"]),
    );
  });

  it("is the pure sentence: with nothing in the last, everything in this one is new", () => {
    // The seed rule (the first render marks nothing) is each caller's own; this is only the diff.
    expect(newIds([], ["a", "b"])).toEqual(new Set(["a", "b"]));
    expect(newIds([], [])).toEqual(new Set());
  });

  it("keeps this render's order, and says each id once", () => {
    expect([...newIds(["a"], ["c", "b", "c", "a"])]).toEqual(["c", "b"]);
  });

  it("takes the last render as a set the caller already holds, without disturbing it", () => {
    const last = new Set(["a", "b"]);
    expect(newIds(last, ["b", "z"])).toEqual(new Set(["z"]));
    expect(last).toEqual(new Set(["a", "b"]));
  });
});
