import { describe, expect, it } from "vitest";

import { HOME, type Mode } from "../privacy-hero/field";
import {
  boxAt,
  COLUMN,
  INK,
  layout,
  margins,
  type Motion,
  MOTIONS,
} from "./margins";
import { ALBUM_PAGE } from "./spec";

/**
 * WHAT THE ALBUM PAGE'S THREE MOTIONS HAVE TO BE TRUE OF (the heroes lane,
 * 2026-09-18): the conditions they are drawn from, and the words held to the
 * tables. Nothing here caps a pace or a count (round three's calm caps are what
 * Will called "too boring"); each motion is graded against the home hero on the
 * board, in numbers this file holds to what `margins.ts` measures.
 */

const MODES: readonly Mode[] = ["desktop", "phone"];
const HEADER = 64;
const STEPS = 160;

/** Every lit sample of every card of a motion: where it is and how big. */
function* lit(mode: Mode, motion: Motion, floor = 0.02) {
  const { field } = margins(mode, motion);
  for (const c of field.cards) {
    for (let i = 0; i <= STEPS; i++) {
      const age = (i / STEPS) * field.flight;
      if (field.opacity(c, age) <= floor) continue;
      const q = field.place(c, age);
      yield { c, age, q, e: boxAt(c, q.s) };
    }
  }
}

describe("the motions keep to the empty space", () => {
  it("never lights a frame over the words", () => {
    for (const mode of MODES)
      for (const motion of MOTIONS) {
        const lay = layout(mode, motion);
        const ink = INK[mode];
        for (const { c, age, q, e } of lit(mode, motion)) {
          const overX = q.x + e.hw > ink.l && q.x - e.hw < ink.r;
          const overY = q.y + e.hh > lay.top && q.y - e.hh < lay.foot;
          expect(
            overX && overY,
            `${mode} ${motion}: ${c.key} is on the words at ${Math.round(age)} ms`,
          ).toBe(false);
        }
      }
  });

  it("never lights a frame under the header's words", () => {
    for (const mode of MODES)
      for (const motion of MOTIONS)
        for (const { c, age, q, e } of lit(mode, motion, 0.05))
          expect(
            q.y - e.hh,
            `${mode} ${motion}: ${c.key} is under the header at ${Math.round(age)} ms`,
          ).toBeGreaterThan(HEADER - 2);
  });

  it("hands every falling frame to the album, whole", () => {
    // A frame that ends its fall half outside the album's column would blink
    // out beside it; one that ends inside is simply behind the frame.
    for (const mode of MODES) {
      const { field } = margins(mode, "stream");
      const lay = layout(mode, "stream");
      for (const c of field.cards) {
        const q = field.place(c, field.flight);
        const e = boxAt(c, q.s);
        expect(q.x - e.hw, c.key).toBeGreaterThan(COLUMN[mode].l);
        expect(q.x + e.hw, c.key).toBeLessThan(COLUMN[mode].r);
        expect(q.y - e.hh, c.key).toBeGreaterThanOrEqual(lay.album - 2);
      }
    }
  });

  it("starts and ends the desktop arch behind the album", () => {
    const { field } = margins("desktop", "arch");
    const lay = layout("desktop", "arch");
    const c = field.cards[0];
    for (const age of [0, field.flight - 1]) {
      const q = field.place(c, age);
      const e = boxAt(c, q.s);
      expect(q.x - e.hw).toBeGreaterThan(COLUMN.desktop.l);
      expect(q.x + e.hw).toBeLessThan(COLUMN.desktop.r);
      expect(q.y - e.hh).toBeGreaterThanOrEqual(lay.album - 2);
    }
  });
});

describe("the three are different in kind", () => {
  it("lands without travelling, and travels without landing", () => {
    for (const mode of MODES) {
      expect(margins(mode, "arrivals").facts.fastest).toBe(0);
      expect(margins(mode, "stream").facts.fastest).toBeGreaterThan(0);
      expect(margins(mode, "arch").facts.fastest).toBeGreaterThan(0);
    }
  });
});

describe("every motion says what it draws", () => {
  const ask = ALBUM_PAGE.asks.find((a) => a.id === "motion")!;
  const means = (id: Motion) => {
    const o = ask.options.find((x) => typeof x !== "string" && x.id === id);
    return typeof o === "object" ? (o.means ?? "") : "";
  };

  it("states the home hero's clock and speed where it claims them", () => {
    const home = HOME.desktop;
    expect(ask.context).toContain(`${Math.round(home.launch)} px a second`);
    expect(ask.context).toContain(`${home.beat} ms`);
    expect(margins("desktop", "stream").facts.beat).toBe(home.beat);
    expect(means("stream")).toContain(`every ${home.beat} ms`);
    expect(margins("desktop", "arrivals").facts.beat).toBe(home.beat);
    expect(means("arrivals")).toContain(`every ${home.beat} ms`);
    expect(margins("desktop", "arch").facts.launch).toBe(
      Math.round(home.launch),
    );
    expect(means("arch")).toContain(`${Math.round(home.launch)} px a second`);
  });
});
