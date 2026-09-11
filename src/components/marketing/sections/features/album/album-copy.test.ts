import { describe, expect, it } from "vitest";

import {
  type CopyItem,
  GETTING_IN,
  HOW_MUCH_FITS,
  NAMES,
  STAYS,
  TAKE_HOME,
  WHO_CAN_OPEN,
  YOUR_CALL,
} from "./album-copy";
import { ALBUM_FAQ } from "./album-faq";

/**
 * The balance rule, made a gate. A list whose siblings wrap to different row
 * counts reads as unbalanced before anyone reads a word (Will, 2026-09-02),
 * so every set on /features/album is held in a length BAND (all siblings
 * inside the rows their column affords) and a SPREAD (no sibling more than a
 * few words longer than another). The bands are measured, not guessed: a
 * media-split column holds ~64 characters a row, a three-up ~40, a four-up ~34.
 */
function bandOf(items: CopyItem[], min: number, max: number, spread = 18) {
  const lengths = items.map((i) => i.body.length);
  for (const item of items) {
    expect(item.body.length, item.title).toBeGreaterThanOrEqual(min);
    expect(item.body.length, item.title).toBeLessThanOrEqual(max);
  }
  expect(
    Math.max(...lengths) - Math.min(...lengths),
    "spread",
  ).toBeLessThanOrEqual(spread);
}

describe("the album page's copy sets", () => {
  it("getting in: three facts, two rows in a media-split column", () => {
    bandOf(GETTING_IN.facts, 88, 118);
    expect(GETTING_IN.subhead.length).toBeLessThanOrEqual(125);
  });

  it("your call: three settings helpers, one row beside their controls", () => {
    bandOf(YOUR_CALL.settings, 50, 68);
    expect(YOUR_CALL.hints.live.length).toBeLessThanOrEqual(80);
    expect(YOUR_CALL.hints.review.length).toBeLessThanOrEqual(80);
  });

  it("names: a lead under two rows and three one-line states", () => {
    expect(NAMES.lead.length).toBeLessThanOrEqual(110);
    bandOf(NAMES.states, 36, 56, 16);
  });

  it("who can open it: two one-line facts", () => {
    for (const fact of WHO_CAN_OPEN.facts) {
      expect(fact.length).toBeLessThanOrEqual(60);
    }
  });

  it("taking it home: three plates, two rows in a three-up", () => {
    bandOf(TAKE_HOME.plates, 62, 82);
  });

  it("how much fits: two one-line facts", () => {
    for (const fact of HOW_MUCH_FITS.facts) {
      expect(fact.length).toBeLessThanOrEqual(76);
    }
  });

  it("it stays: four short steps and three notes on the same grid", () => {
    bandOf(STAYS.steps, 36, 56, 12);
    bandOf(STAYS.notes, 64, 84);
  });

  it("the FAQ: verdict first, two rows, short questions", () => {
    expect(ALBUM_FAQ.length).toBeGreaterThanOrEqual(8);
    for (const item of ALBUM_FAQ) {
      expect(item.q.length, item.q).toBeLessThanOrEqual(48);
      expect(item.a.length, item.q).toBeGreaterThanOrEqual(85);
      expect(item.a.length, item.q).toBeLessThanOrEqual(170);
      // A verdict of a few words, then a period, then the one sentence.
      expect(item.a, item.q).toMatch(/^[^.]{2,26}\. /);
    }
  });

  it("carries no em-dashes and no banned identity language", () => {
    const all = JSON.stringify({
      GETTING_IN,
      YOUR_CALL,
      NAMES,
      WHO_CAN_OPEN,
      TAKE_HOME,
      HOW_MUCH_FITS,
      STAYS,
      ALBUM_FAQ,
    });
    expect(all).not.toContain("—");
    expect(/\bnight\b/i.test(all)).toBe(false);
  });
});
