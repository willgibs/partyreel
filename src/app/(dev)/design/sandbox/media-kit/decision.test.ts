import { describe, expect, it } from "vitest";

import {
  BRIDGE,
  BRIDGE_BY_ID,
  MIX_LICENSED,
  routeOutcome,
  routeOutcomeForId,
} from "./bridge";
import { candidate, CANDIDATES } from "./candidates";
import {
  BARRED,
  BARRED_IDS,
  BARRED_POSTS,
  IDS_TOTAL,
  IDS_UNDER_RULE,
  MIX_IDS,
  MIX_POSTS,
  POSTS_EMPTY,
  POSTS_FILLED,
  POSTS_UNDER_RULE,
  ROUTE_SHIPS,
} from "./decision";
import {
  CLIPS_IF_LICENSED,
  HARD_FRAMES,
  ISTOCK_FRAME,
  TOTAL,
  UNSPLASH_MONTH,
} from "./plan";
import { MEDIA_KIT } from "./spec";
import { MASTERS } from "./shoot";
import { WEBSUMMIT_CC } from "./sources";

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
    // MIX_LICENSED is candidate keys; reading it as manifest ids is the bug
    // bridge.test.ts pins, and would check the wrong photographs here.
    for (const key of MIX_LICENSED) {
      expect(candidate(key).people, key).not.toBe("identifiable");
    }
    const mix = ROUTE_SHIPS.find((r) => r.route === "mix");
    const licensed = ROUTE_SHIPS.find((r) => r.route === "licensed");
    expect(mix?.legal).toBe(true);
    expect(licensed?.legal).toBe(false);
  });

  it("what Mix swaps is counted by the route function, not off the list", () => {
    expect(MIX_IDS).toBe(
      Object.keys(BRIDGE_BY_ID).filter(
        (id) => routeOutcomeForId(id, "mix").kind === "licensed",
      ).length,
    );
    expect(MIX_POSTS).toBe(
      BRIDGE.filter((p) => routeOutcome(p, "mix").kind === "licensed").length,
    );
    // It changes something (or the route is Ours under another name) and it does
    // not change everything (or it is Licensed under another name).
    expect(MIX_IDS).toBeGreaterThan(0);
    expect(MIX_IDS).toBeLessThan(IDS_TOTAL);
  });
});

describe("the ruling surface", () => {
  // ★ THE ASKS MOVED TO `spec.ts` AT THE MIGRATION WAVE and this suite followed
  // them rather than being deleted with them. The template, the desk's queue and
  // the review ledger read one list now, so the list is the thing worth pinning:
  // an ask is what a ruling is recorded against, and its id is the join.
  const ASKS = MEDIA_KIT.asks;

  it("is four asks, and round four swapped two of them for the sheet", () => {
    expect(ASKS).toHaveLength(4);
    // `sources` (rule on a list of licence names) and `route` are gone: the
    // sourcing sheet ranks real places instead of asking for a yes to a list,
    // and round four answers the route rather than re-asking it. `spend` and
    // `crowds` are the two questions the sheet raised that nothing else answers.
    expect(ASKS.map((a) => a.id)).toEqual(["rule", "spend", "crowds", "kit"]);
  });

  it("every answer is one token, so a ruling is four words", () => {
    for (const a of ASKS) {
      expect(a.options.length).toBeGreaterThanOrEqual(2);
      for (const o of a.options) {
        // ★ ONE TOKEN, NOT ONE WORD, AND THE DIFFERENCE IS THE LEDGER'S. Round
        // four allowed "Subjects only", which the review line cannot carry: the
        // grammar is `<ask>=<option>` and a space ends the clause. The two-word
        // answer became `all-faces`, which reads the same and parses.
        expect(o, `${a.id}: "${o}" is not one token`).toMatch(
          /^[a-z0-9][a-z0-9-]*$/,
        );
      }
    }
  });

  it("every recommendation is one of the options offered", () => {
    for (const a of ASKS) expect(a.options).toContain(a.recommended);
  });

  it("every ask points at a section of the board that argues it", () => {
    const ids = new Set(MEDIA_KIT.sections.map((s) => s.id));
    for (const a of ASKS) expect(ids.has(a.evidence), a.id).toBe(true);
  });

  /**
   * ★ THE ONE NUMBER THE ROUND EXISTS TO CORRECT WAS STILL IN AN ASK. The first
   * cut of round three fixed the finding at the top of decision.ts and left the
   * ask itself reading "Licensed ships twelve swaps", the pre-rule count, two
   * lines above its own `because` and directly above the table that contradicts
   * it, under a caption promising every number is computed. So: every digit on
   * the ruling surface has to be a number the batch computes. A count typed into
   * a sentence goes stale silently; an interpolated one cannot.
   *
   * ★ AND THE SURFACE IS WIDER THAN THE ASKS NOW. The template's Answer prints
   * the verdict above them, so the verdict is scanned too, which is what caught
   * the last two typed counts on this board: the `blog` column of the Ours and
   * Licensed rows both wrote the number of posts as a literal.
   */
  it("every count on the ruling surface is one the batch computes", () => {
    const derived = new Set<number>([
      IDS_TOTAL,
      IDS_UNDER_RULE,
      IDS_TOTAL - MIX_IDS,
      MIX_IDS,
      MIX_POSTS,
      POSTS_FILLED,
      POSTS_EMPTY,
      POSTS_UNDER_RULE,
      BRIDGE.length,
      BRIDGE.length - MIX_POSTS,
      BARRED.length,
      BARRED_IDS.length,
      BARRED_POSTS.length,
      CANDIDATES.length,
      MASTERS.length,
      // Round four's money and the one catalogue count a ruling turns on. Every
      // one of these is exported from plan.ts or sources.ts, so a figure on the
      // ruling surface is a figure the plan table also shows.
      TOTAL,
      HARD_FRAMES,
      ISTOCK_FRAME,
      UNSPLASH_MONTH,
      CLIPS_IF_LICENSED,
      WEBSUMMIT_CC,
    ]);
    const surfaces = [
      ...ASKS.map(
        (a) => `${a.question} ${a.because ?? ""} ${a.overrule ?? ""}`,
      ),
      `${MEDIA_KIT.verdict.recommendation} ${MEDIA_KIT.verdict.because} ${MEDIA_KIT.verdict.overrule ?? ""}`,
      ...ROUTE_SHIPS.map((r) => `${r.ships} ${r.blog} ${r.cost} ${r.ends}`),
    ];
    for (const text of surfaces) {
      // "ask 1" is a cross reference to a question, not a count of anything, and
      // a digit welded to a word is a name (CC0), not a number either. Thousands
      // separators are stripped first so 87,066 reads as one number rather than
      // as an 87 and an 066, which is how a big count would otherwise slip the
      // guard entirely.
      for (const n of text
        .replace(/ask \d/g, "ask")
        .replace(/(\d),(?=\d{3}\b)/g, "$1")
        .match(/(?<![A-Za-z])\d+/g) ?? []) {
        expect(derived, text).toContain(Number(n));
      }
    }
  });

  /**
   * ★ THE MONEY IN AN ASK IS THE MONEY IN THE PLAN, OR THE BOARD LIES QUIETLY.
   * The same class of fault as round three's stale count, in its round-four form:
   * a price typed into a question and a plan table that moves under it would
   * disagree with nothing to notice it. So the ask is asserted against the plan's
   * own totals, and the route table still says the pre-rule counts it always did.
   */
  it("the spend ask quotes the plan's totals, never a typed price", () => {
    const spend = ASKS.find((a) => a.id === "spend");
    expect(spend?.because).toContain(`$${TOTAL}`);
    expect(spend?.because).toContain(`${HARD_FRAMES} iStock frames`);
    expect(spend?.recommended).toBe("buy");
    const kit = ASKS.find((a) => a.id === "kit");
    expect(kit?.because).toContain(`$${TOTAL}`);
    expect(kit?.because).toContain(`$${CLIPS_IF_LICENSED}`);
    // The comparison only works one way round, and it is the round's point.
    expect(CLIPS_IF_LICENSED).toBeGreaterThan(TOTAL);
  });

  it("the crowds ask names the catalogue that turns on it", () => {
    const crowds = ASKS.find((a) => a.id === "crowds");
    expect(crowds?.because).toContain(WEBSUMMIT_CC.toLocaleString("en-US"));
    expect(crowds?.options).toEqual(["subjects", "all-faces"]);
  });

  it("the route table still says the counts the rule leaves", () => {
    const licensed = ROUTE_SHIPS.find((r) => r.route === "licensed");
    expect(licensed?.ships).toContain(
      `${IDS_UNDER_RULE} of the ${IDS_TOTAL} ids`,
    );
    expect(licensed?.blog).toContain(`${POSTS_UNDER_RULE} of ${BRIDGE.length}`);
    expect(licensed?.legal).toBe(false);
    expect(BARRED_IDS.length).toBe(IDS_TOTAL - IDS_UNDER_RULE);
  });

  it("the route table covers every route the board can be switched to", () => {
    expect(ROUTE_SHIPS.map((r) => r.route).sort()).toEqual([
      "licensed",
      "mix",
      "ours",
    ]);
    // The recommendation leads the table, as it leads the toggle.
    expect(ROUTE_SHIPS[0].route).toBe("mix");
    // ★ AND THE TOGGLE IS THE SPEC'S DECLARED CONTROL NOW, so the table's order
    // and the dock's order cannot drift: they are read off one array.
    const control = MEDIA_KIT.controls?.find((c) => c.id === "route");
    expect(control?.options.map((o) => o.id)).toEqual(
      ROUTE_SHIPS.map((r) => r.route),
    );
    expect(control?.default).toBe("mix");
  });
});
