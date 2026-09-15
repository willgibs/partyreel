import { describe, expect, it } from "vitest";

import { BRIDGE, BRIDGE_BY_ID, MIX_LICENSED } from "./bridge";
import { candidate, CANDIDATES } from "./candidates";
import {
  ASKS,
  BARRED,
  BARRED_IDS,
  BARRED_POSTS,
  IDS_TOTAL,
  IDS_UNDER_RULE,
  POSTS_EMPTY,
  POSTS_FILLED,
  POSTS_UNDER_RULE,
  ROUTE_SHIPS,
} from "./decision";

/**
 * THE DECISION, PINNED (the media-kit track, round three).
 *
 * ★ THIS SUITE EXISTS BECAUSE ROUND TWO'S BOARD WAS OPTIMISTIC BY EXACTLY WHAT
 * ITS OWN RULE TAKES AWAY. It printed "21 of 23 filled" and "all twelve fill
 * now", both true of the staged batch and neither true under ask 1, which bars a
 * recognisable face without a release. The smaller numbers are the ones a ruling
 * has to be made on, so they are derived from the batch here and asserted rather
 * than written into a paragraph that cannot be wrong out loud.
 *
 * The suite also guards the shape of the ruling surface itself: four asks, every
 * answer one word, every recommendation actually on offer, and a route table with
 * a row for every route the board can be switched to.
 */

describe("what the rule takes back", () => {
  it("the barred set is every staged frame with a recognisable face", () => {
    expect(BARRED.length).toBeGreaterThan(0);
    for (const c of BARRED) expect(c.people).toBe("identifiable");
    for (const c of CANDIDATES) {
      if (c.people === "identifiable") {
        expect(BARRED.map((b) => b.key)).toContain(c.key);
      }
    }
  });

  it("every barred frame carries a caution, so the board never shows one silently", () => {
    for (const c of BARRED) expect(c.caution).toBeTruthy();
  });

  it("the ids a licensed swap cannot legally fill are derived, not listed", () => {
    const computed = Object.entries(BRIDGE_BY_ID)
      .filter(([, key]) => candidate(key).people === "identifiable")
      .map(([id]) => id);
    expect(BARRED_IDS).toEqual(computed);
    expect(IDS_TOTAL).toBe(Object.keys(BRIDGE_BY_ID).length);
    expect(IDS_UNDER_RULE).toBe(IDS_TOTAL - BARRED_IDS.length);
    expect(IDS_UNDER_RULE).toBeLessThan(IDS_TOTAL);
  });

  it("the posts a licensed bridge cannot legally fill are derived too", () => {
    const computed = BRIDGE.filter(
      (p) => p.candidate && candidate(p.candidate).people === "identifiable",
    ).map((p) => p.slug);
    expect(BARRED_POSTS.map((p) => p.slug)).toEqual(computed);
    expect(POSTS_FILLED + POSTS_EMPTY).toBe(BRIDGE.length);
    expect(POSTS_UNDER_RULE).toBe(POSTS_FILLED - BARRED_POSTS.length);
    expect(POSTS_UNDER_RULE).toBeLessThan(POSTS_FILLED);
  });

  it("the Mix route ships nothing the rule forbids, which is its whole case", () => {
    for (const id of MIX_LICENSED) {
      expect(candidate(BRIDGE_BY_ID[id]).people).not.toBe("identifiable");
    }
    const mix = ROUTE_SHIPS.find((r) => r.route === "mix");
    const licensed = ROUTE_SHIPS.find((r) => r.route === "licensed");
    expect(mix?.legal).toBe(true);
    expect(licensed?.legal).toBe(false);
  });
});

describe("the ruling surface", () => {
  it("is four asks, and round two's fifth is folded into the route", () => {
    expect(ASKS).toHaveLength(4);
    expect(ASKS.map((a) => a.id)).toEqual(["rule", "sources", "route", "kit"]);
  });

  it("every answer is one word, so a ruling is four words", () => {
    for (const a of ASKS) {
      expect(a.options.length).toBeGreaterThanOrEqual(2);
      for (const o of a.options) {
        // "Strike one" is the one two-word answer: it names the act, and the
        // source struck comes from the list beside it.
        expect(o.split(" ").length).toBeLessThanOrEqual(2);
      }
    }
  });

  it("every recommendation is one of the options offered", () => {
    for (const a of ASKS) expect(a.options).toContain(a.recommend);
  });

  it("every ask points at a section of the board that argues it", () => {
    for (const a of ASKS) expect(a.href).toMatch(/^#mk-[a-z]+$/);
  });

  it("the route table covers every route the board can be switched to", () => {
    expect(ROUTE_SHIPS.map((r) => r.route).sort()).toEqual([
      "licensed",
      "mix",
      "ours",
    ]);
    // The recommendation leads the table, as it leads the toggle.
    expect(ROUTE_SHIPS[0].route).toBe("mix");
  });
});
