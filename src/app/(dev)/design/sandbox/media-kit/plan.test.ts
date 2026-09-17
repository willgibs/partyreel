import { describe, expect, it } from "vitest";

import { CATALOGUE, FRAME_COUNT, SHEET_COUNT } from "./catalogue";
import {
  BRIDGE_LIMITS,
  CLIPS_IF_LICENSED,
  HARD_FRAMES,
  PAID_ROWS,
  PLAN,
  planSource,
  TOTAL,
  TOTAL_PROMO,
} from "./plan";
import {
  ALL_VERTICALS,
  ALLOWED_SOURCES,
  BARRED_SOURCES,
  drawableVerticals,
  LICENCES,
  SEARCH_QUERY,
  sheetFor,
  SOURCES,
  VERTICAL_LABEL,
  WEBSUMMIT_CC,
  WEBSUMMIT_TOTAL,
} from "./sources";

/**
 * THE SOURCING SHEET AND THE PLAN, PINNED (the media-kit track, round four).
 *
 * This suite exists for the same reason round three's does, and against the same
 * fault in a new costume. Round three found three separate places where a number
 * or a list written into prose had gone quietly stale, or was read in two
 * namespaces at once, and each time the board and the thing it described drifted
 * with nothing to notice. Round four adds money to the board, which is the most
 * expensive kind of number to get wrong, so:
 *
 *  - the total is the sum of the rows, and the rows take their prices from the
 *    sources' own cards;
 *  - a plan row cannot name a source that is not on the sheet;
 *  - the ranking's one rule (no release, no shipping) is asserted rather than
 *    trusted to the order somebody typed the array in;
 *  - a contact sheet cannot claim a vertical its source does not cover, and a
 *    sheet key cannot name a source that does not exist;
 *  - and nothing in the catalogue is a local file, which is the promise the whole
 *    sheet makes about not copying anything paid into this repo.
 */

describe("the plan", () => {
  it("names only sources that are on the sheet", () => {
    for (const row of PLAN) {
      expect(() => planSource(row), row.key).not.toThrow();
      expect(SOURCES.map((s) => s.id)).toContain(row.sourceId);
    }
  });

  it("covers every vertical exactly once, plus the clips", () => {
    expect(PLAN.map((r) => r.key)).toEqual([...ALL_VERTICALS, "clips"]);
    for (const v of ALL_VERTICALS) {
      const row = PLAN.find((r) => r.key === v);
      expect(row?.label).toBe(VERTICAL_LABEL[v]);
    }
  });

  it("totals the rows rather than stating a figure of its own", () => {
    expect(TOTAL).toBe(PLAN.reduce((n, r) => n + r.spend, 0));
    expect(TOTAL_PROMO).toBeLessThan(TOTAL);
    // Two lines cost money and the rest are covered by the first. If that ever
    // stops being true the plan is a different plan and its prose is wrong.
    expect(PAID_ROWS).toHaveLength(2);
  });

  it("prices each paid row off its own source's card", () => {
    const subscription = PLAN.find((r) => r.key === "weddings");
    expect(subscription?.spend).toBe(planSource(subscription!).firstSpend);
    const perFrame = PLAN.find((r) => r.key === "corporate");
    expect(perFrame?.spend).toBe(
      planSource(perFrame!).firstSpend! * HARD_FRAMES,
    );
  });

  /**
   * ★ THE ASYMMETRY IS THE ARGUMENT, so it is asserted. Licensing the stills is
   * cheap and licensing the films is not, which is why the recommendation buys
   * one and shoots the other. If a price ever moves far enough to invert that,
   * the recommendation on the board is wrong and this fails rather than the
   * board quietly continuing to say it.
   */
  it("costs less for every photograph than for the films alone", () => {
    expect(CLIPS_IF_LICENSED).toBeGreaterThan(TOTAL);
    expect(PLAN.find((r) => r.key === "clips")?.spend).toBe(0);
  });

  it("says what the money does not buy, in more than one line", () => {
    expect(BRIDGE_LIMITS.length).toBeGreaterThanOrEqual(3);
    for (const line of BRIDGE_LIMITS) expect(line.length).toBeGreaterThan(40);
  });
});

describe("the sourcing sheet", () => {
  it("opens a door to every source for every kind of event", () => {
    // Will, 2026-09-17: a source whose sheet cannot be drawn is "at least
    // linked neatly to explore". Every source, every vertical: https, and the
    // vertical's own words in the door, unless the source's only reachable
    // door is its home (Death to Stock, whose browse paths refuse everything
    // but a browser).
    for (const s of SOURCES) {
      for (const v of ALL_VERTICALS) {
        const door = s.search(v);
        expect(door, `${s.id} ${v}`).toMatch(/^https:\/\//);
        const word = SEARCH_QUERY[v].split(" ")[0];
        expect(
          door === s.url || door.toLowerCase().includes(word),
          `${s.id} ${v}: the door neither carries "${word}" nor is the source's own door`,
        ).toBe(true);
      }
    }
  });

  it("has a unique id, a price and a quoted clause on every card", () => {
    const ids = SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SOURCES) {
      expect(s.name.length, s.id).toBeGreaterThan(2);
      expect(s.url, s.id).toMatch(/^https:\/\//);
      expect(s.licenceUrl, s.id).toMatch(/^https:\/\//);
      expect(s.clause.length, s.id).toBeGreaterThan(30);
      expect(s.price, s.id).toMatch(/\d|[Ff]ree/);
      expect(s.covers.length, s.id).toBeGreaterThan(0);
      expect(s.verdict.length, s.id).toBeGreaterThan(40);
    }
  });

  /**
   * ★ THE RANKING'S ONE RULE, ASSERTED RATHER THAN TRUSTED TO THE ARRAY ORDER.
   * The sheet's whole claim is that it ranks by whether a source holds a release
   * and not by price, because our verticals are rooms full of recognisable
   * people. A source with no release sitting above the line would make the sheet
   * say one thing and do another, which is the exact shape of every fault round
   * three found.
   */
  it("puts no source without a release above the line", () => {
    for (const s of ALLOWED_SOURCES) {
      expect(s.release, s.id).not.toBe("none");
      expect(s.firstSpend, s.id).not.toBeNull();
    }
    expect(ALLOWED_SOURCES.length).toBeGreaterThan(0);
    expect(BARRED_SOURCES.length).toBeGreaterThan(0);
    expect(ALLOWED_SOURCES.length + BARRED_SOURCES.length).toBe(SOURCES.length);
  });

  it("puts the cheapest released subscription first, which is the recommendation", () => {
    expect(SOURCES[0].id).toBe("unsplash-plus");
    expect(SOURCES[0].release).toBe("held");
    expect(PLAN[0].sourceId).toBe(SOURCES[0].id);
  });

  /**
   * ★ A LICENCE IS NOT A SOURCE. Round three's survey listed CC0 1.0 as its top
   * "source", which is a legal instrument and not a place with photographs in
   * it, and that conflation is why it could not answer the question this round
   * was given. The two lists are separate now and nothing may appear in both.
   */
  it("keeps the licences out of the places", () => {
    const places = new Set(SOURCES.map((s) => s.name.toLowerCase()));
    for (const l of LICENCES) {
      expect(places.has(l.name.toLowerCase()), l.name).toBe(false);
      expect(l.clause.length, l.name).toBeGreaterThan(30);
    }
    // The refusal the track was built on is a licence, not a company: the free
    // Unsplash terms sit here and Unsplash+ sits on the sheet above.
    expect(LICENCES.map((l) => l.name)).toContain("Unsplash, the free licence");
    expect(SOURCES.map((s) => s.name)).toContain("Unsplash+");
  });

  it("keeps the two counts ask 3 turns on consistent with each other", () => {
    expect(WEBSUMMIT_CC).toBeLessThan(WEBSUMMIT_TOTAL);
    const ws = SOURCES.find((s) => s.id === "websummit-flickr");
    expect(ws?.catalogue).toContain(WEBSUMMIT_CC.toLocaleString("en-US"));
    expect(ws?.catalogue).toContain(WEBSUMMIT_TOTAL.toLocaleString("en-US"));
  });
});

describe("the contact sheets", () => {
  it("names only sources that exist, and only verticals they cover", () => {
    const byId = new Map(SOURCES.map((s) => [s.id, s]));
    for (const key of Object.keys(CATALOGUE)) {
      const [id, vertical] = key.split("::");
      const source = byId.get(id);
      expect(source, key).toBeDefined();
      expect(ALL_VERTICALS, key).toContain(vertical);
      // A sheet for a vertical the card does not claim would be the board
      // showing one thing and saying another.
      expect(source!.covers, key).toContain(vertical);
    }
  });

  it("agrees with the helper the board filters by", () => {
    for (const s of SOURCES) {
      for (const v of drawableVerticals(s.id)) {
        expect(
          sheetFor(s.id, v)?.frames.length,
          `${s.id}/${v}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  /**
   * ★ NOTHING PAID IS EVER IN THIS REPO, and this is the assertion that keeps it
   * true. Every frame on the sheet is the source's own thumbnail on the source's
   * own CDN: a relative path here would mean a file had been copied in, which is
   * the one thing a board about licensing must not do quietly.
   */
  it("holds no local file, only the sources' own URLs", () => {
    for (const [key, sheet] of Object.entries(CATALOGUE)) {
      expect(sheet.frames.length, key).toBeGreaterThanOrEqual(6);
      for (const f of sheet.frames) {
        expect(f.thumb, key).toMatch(/^https:\/\//);
        expect(f.page, key).toMatch(/^https:\/\//);
        expect(f.thumb, key).not.toMatch(/partyreel/i);
      }
    }
  });

  /**
   * ★ A BLANK CARD STATES ITS OWN REASON, AND THE REASONS ARE NOT ONE REASON.
   * The slate under a source with no contact sheet used to print a single
   * categorical sentence, that the catalogue answers a non-browser client with a
   * 401 or a 403. Seven cards showed it; three of them were actually refusing.
   * One of the other four was Coverr, whose entire verdict on the same card is a
   * measurement taken off the search page the slate said had refused, so the
   * board contradicted itself across two columns of one row. This pins the shape
   * rather than the wording: a source is drawn or it says why, never neither and
   * never both, so a future harvest that drops a sheet cannot inherit a reason
   * that was written about something else.
   */
  it("gives every undrawn source its own reason, and no drawn one an excuse", () => {
    for (const s of SOURCES) {
      const drawn = drawableVerticals(s.id).length > 0;
      if (drawn) {
        expect(s.noSheet, s.id).toBeUndefined();
      } else {
        expect(typeof s.noSheet, s.id).toBe("string");
        expect(s.noSheet!.length, s.id).toBeGreaterThan(40);
      }
    }
    // Distinct text, not one sentence pasted seven times: the fault this
    // replaces was a shared sentence, so sharing one again must fail here.
    const reasons = SOURCES.map((s) => s.noSheet).filter(Boolean);
    expect(new Set(reasons).size).toBe(reasons.length);
    expect(reasons.length).toBeGreaterThan(0);
  });

  it("counts what the board prints", () => {
    expect(SHEET_COUNT).toBe(Object.keys(CATALOGUE).length);
    expect(FRAME_COUNT).toBe(
      Object.values(CATALOGUE).reduce((n, s) => n + s.frames.length, 0),
    );
    expect(FRAME_COUNT).toBeGreaterThan(100);
  });
});
