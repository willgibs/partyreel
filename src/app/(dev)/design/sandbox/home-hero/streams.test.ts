import { describe, expect, it } from "vitest";

import type { Mode } from "@/components/lab";

import { FRAMES } from "./shared";
import {
  BUILT,
  GEO,
  placeAt,
  restPhase,
  STREAM_IDS,
  STREAMS,
  type StreamId,
} from "./streams";

/**
 * WHAT A STREAM HAS TO BE TRUE OF (round six, 2026-09-16).
 *
 * The four compositions in `streams.ts` are tables of numbers, and a table of
 * numbers has no compile error: a station moved 20 px pushes the headline into
 * the site header, a beat shortened by 60 ms puts two photographs in one held
 * place, and both look like a design opinion rather than a fault. These are the
 * conditions the compositions are DRAWN FROM, so they are checked here rather
 * than hoped for, and this file is also how they were tuned.
 *
 * Not pinned here: anything about the look. A test that fixed a station table
 * would be a test that owns the design, and the design is Will's (the bible is
 * the only law; a contract guards function, never a look).
 */

const MODES: Mode[] = ["desktop", "phone"];
/** Half the canvas, for the rest-state spread check. */
const CANVAS_HALF: Record<Mode, number> = { desktop: 720, phone: 187.5 };

describe("every stream leaves the type its measured lane", () => {
  it.each(STREAM_IDS)("%s clears the site header on both canvases", (id) => {
    for (const mode of MODES) {
      const { lock } = BUILT[id][mode];
      const geo = GEO[mode];
      // ★ THE CEILING IS THE SITE HEADER, a 4rem transparent overlay sitting on
      // the hero. The headline is anchored on its baseline off the centre, so
      // its cap starts at (canvas/2 - head - line box): a head past `headMax`
      // puts the first line under the header, and past a little more it leaves
      // the canvas entirely. Measured off the stream, so this fails the moment
      // a station table is tuned past what the composition can carry.
      expect(
        lock.head,
        `${id} at ${mode}: the headline is pushed too high`,
      ).toBeLessThanOrEqual(geo.headMax);
      // And it must clear the code's own plate, which near the centre is the
      // taller of the two things the type has to get past.
      expect(lock.head).toBeGreaterThanOrEqual(geo.qr / 2 + geo.margin);
      expect(lock.low).toBeGreaterThanOrEqual(geo.qr / 2 + geo.margin);
    }
  });
});

describe("no frame is ever rasterized above its own pixels", () => {
  it.each(STREAM_IDS)(
    "%s sizes every DOM box to its largest visible moment",
    (id) => {
      for (const mode of MODES) {
        const st = STREAMS[id];
        const { cards, box } = BUILT[id][mode];
        cards.forEach((c, i) => {
          // The card's DOM box is `w * fit` and the transform scale is `s / fit`,
          // so the on-screen size is `w * s`. `fit` is the largest `s` the card
          // ever reaches while a person can see it: if any visible sample beats
          // it, that frame is being upscaled on the screen.
          for (let k = 0; k <= 240; k++) {
            const p = k / 240;
            if (p > box[i].exit) continue;
            const q = placeAt(c, p, st, mode);
            if (st.opacityAt(p, q.out) <= 0.02) continue;
            expect(
              q.s,
              `${id} ${mode} card ${i} exceeds its box at ${p}`,
            ).toBeLessThanOrEqual(box[i].fit + 1e-6);
          }
          expect(box[i].w).toBeGreaterThan(0);
          expect(Number.isFinite(box[i].h)).toBe(true);
        });
      }
    },
  );
});

describe("the settle never double books a place", () => {
  it("gives every held place more time than a frame occupies it", () => {
    for (const mode of MODES) {
      const st = STREAMS.settle;
      const { cards, box } = BUILT.settle[mode];
      // The places are walked in order, so a place comes round again after
      // `places * beat`; a frame owns it from the end of its approach to the
      // end of its fade. Two photographs in one place is the one fault this
      // treatment cannot survive, and it is a arithmetic, not an eye, that
      // catches it.
      const places = new Set(cards.map((c) => c.reach)).size;
      const beat = st.cycle[mode] / st.pool[mode];
      const revisit = places * beat;
      // When the frame is at rest in its place: the first sample past the
      // approach, to the last sample with any opacity left.
      let start = 1;
      let end = 0;
      // The settle's fade is a function of the PHASE (it happens while the frame
      // is standing still), so the distance argument is the one the first card
      // is actually at; passing it keeps the call honest rather than guessing.
      const probe = cards[0];
      for (let k = 0; k <= 480; k++) {
        const p = k / 480;
        if (st.opacityAt(p, placeAt(probe, p, st, mode).out) <= 0.02) continue;
        const moving =
          Math.abs(st.travelAt(p) - st.travelAt(Math.min(p + 1 / 480, 1))) >
          1e-6;
        if (!moving) {
          start = Math.min(start, p);
          end = Math.max(end, p);
        }
      }
      const occupied = (end - start) * st.flight;
      expect(
        occupied,
        `settle at ${mode}: a place is occupied for ${Math.round(occupied)}ms and comes round every ${Math.round(revisit)}ms`,
      ).toBeLessThan(revisit);
      expect(box.length).toBe(cards.length);
    }
  });
});

describe("every stream's rest state is its own designed still", () => {
  it.each(STREAM_IDS)(
    "%s stands deployed, never collapsed at the code",
    (id) => {
      for (const mode of MODES) {
        const st = STREAMS[id];
        const { cards } = BUILT[id][mode];
        const half = CANVAS_HALF[mode];
        // ★ THE REST STATE IS WHAT REDUCED MOTION GETS, and it is the one state no
        // screenshot of a running board ever shows. `hero.css` puts it outside
        // every media query and the pre-burst frame inside `no-preference`, so a
        // reader who asked for less motion gets exactly these transforms and the
        // loop never starts. The fault it guards against is a still that is not a
        // composition: every frame stacked at the code (which is what the
        // pre-burst frame looks like when the split is wired the wrong way round),
        // or one arm empty.
        const lit = cards
          .map((c) => ({ c, q: placeAt(c, restPhase(c, st), st, mode) }))
          .filter(({ c, q }) => st.opacityAt(restPhase(c, st), q.out) > 0.02);
        expect(
          lit.length,
          `${id} at ${mode}: nothing is lit at rest`,
        ).toBeGreaterThanOrEqual(6);
        const atCode = lit.filter(
          ({ q }) => Math.abs(q.x) < half * 0.06,
        ).length;
        expect(
          atCode,
          `${id} at ${mode}: ${atCode} of ${lit.length} frames are stacked on the code at rest`,
        ).toBeLessThanOrEqual(2);
        // Both arms, and a spread of distances rather than one ring.
        expect(lit.some(({ q }) => q.x < -half * 0.3)).toBe(true);
        expect(lit.some(({ q }) => q.x > half * 0.3)).toBe(true);
        expect(lit.some(({ q }) => Math.abs(q.x) > half * 0.75)).toBe(true);
      }
    },
  );
});

describe("nothing in a composition is dealt", () => {
  it("places every card from a table, never from a hash", () => {
    // The whole round: round five gave each frame four seeded values and the
    // picture never resolved into a shape. A stream's per-card values have to
    // come out of a short cycle, which is exactly what makes them predictable
    // to the eye. Checked structurally: every value a card carries appears a
    // small number of distinct times across the pool, where a hash would give
    // one distinct value per card.
    for (const id of STREAM_IDS) {
      const { cards } = BUILT[id as StreamId].desktop;
      const perArm = cards.filter((c) => c.dir === 1);
      for (const key of ["station", "reach", "roll", "turn"] as const) {
        const distinct = new Set(perArm.map((c) => c[key]));
        expect(
          distinct.size,
          `${id}: ${key} takes ${distinct.size} values over ${perArm.length} cards, which is a deal rather than a cycle`,
        ).toBeLessThanOrEqual(6);
      }
    }
  });
});

describe("the photograph pool", () => {
  it("reports what each stream needs for no photograph to be on screen twice", () => {
    // Not an assertion about the stand-ins, which are 12 and repeat by
    // construction: the two arms' windows are `pool` wide and offset by half
    // the set, so they are disjoint exactly when the set is at least twice the
    // pool. This is the number ASSETS row 2 is sized against, so it is read out
    // of the code rather than retyped into a doc.
    const need =
      Math.max(...STREAM_IDS.map((id) => BUILT[id].desktop.pool)) * 2;
    expect(need).toBeLessThanOrEqual(34);
    expect(FRAMES.length).toBeGreaterThan(0);
  });
});
