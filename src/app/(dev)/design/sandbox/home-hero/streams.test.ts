import { describe, expect, it } from "vitest";

import type { Mode } from "@/components/lab";

import { FRAMES } from "./shared";
import {
  blockBox,
  BUILT,
  GEO,
  placeAt,
  restPhase,
  STREAM_IDS,
  STREAMS,
  type StreamId,
} from "./streams";

/**
 * WHAT A STREAM HAS TO BE TRUE OF (round seven, 2026-09-16).
 *
 * The four compositions in `streams.ts` are tables of numbers, and a table of
 * numbers has no compile error: a station moved 20 px pushes the headline into
 * the site header, a beat shortened by 60 ms puts two photographs in one held
 * place, an orbit station drawn 30 px nearer the code stands a frame on the
 * headline, and all three look like a design opinion rather than a fault.
 * These are the conditions the compositions are DRAWN FROM, so they are
 * checked here rather than hoped for, and this file is also how they were
 * tuned.
 *
 * Not pinned here: anything about the look. A test that fixed a station table
 * would be a test that owns the design, and the design is Will's (the bible is
 * the only law; a contract guards function, never a look).
 */

const MODES: Mode[] = ["desktop", "phone"];
/** Half the canvas, for the rest-state spread check. */
const CANVAS_HALF: Record<Mode, number> = { desktop: 720, phone: 187.5 };
/** The canvas height, for the block-fits check. */
const CANVAS_H: Record<Mode, number> = { desktop: 930, phone: 760 };

describe("every stream leaves the type its measured lane", () => {
  it.each(STREAM_IDS)("%s clears the site header on both canvases", (id) => {
    for (const mode of MODES) {
      const { lock } = BUILT[id][mode];
      const geo = GEO[mode];
      const st = STREAMS[id];
      if (st.lockup === "split") {
        // ★ THE CEILING IS THE SITE HEADER, a 4rem transparent overlay sitting
        // on the hero. The headline is anchored on its baseline off the centre,
        // so its cap starts at (canvas/2 - head - line box): a head past
        // `headMax` puts the first line under the header, and past a little
        // more it leaves the canvas entirely. Measured off the stream, so this
        // fails the moment a table is tuned past what the composition carries.
        expect(
          lock.head,
          `${id} at ${mode}: the headline is pushed too high`,
        ).toBeLessThanOrEqual(geo.headMax);
      }
      // And it must clear the code's own plate, which near the centre is the
      // taller of the two things the type has to get past.
      const plate = geo.qr / 2 + Math.min(geo.margin, geo.gap);
      expect(lock.head).toBeGreaterThanOrEqual(plate);
      expect(lock.low).toBeGreaterThanOrEqual(plate);
    }
  });

  it.each(STREAM_IDS)("%s fits its unsplit block on both canvases", (id) => {
    for (const mode of MODES) {
      const st = STREAMS[id];
      const built = BUILT[id][mode];
      const box = blockBox(st, built, mode);
      if (!box) continue;
      // The block's box in canvas px from the top: it has to start under the
      // site header's 4rem and end inside the canvas, with a little air.
      const axisPx = GEO[mode].axis[st.lockup] * CANVAS_H[mode];
      expect(
        axisPx + box.top,
        `${id} at ${mode}: the block starts under the site header`,
      ).toBeGreaterThanOrEqual(64 + 12);
      expect(
        axisPx + box.bottom,
        `${id} at ${mode}: the block runs off the canvas`,
      ).toBeLessThanOrEqual(CANVAS_H[mode] - 12);
      // And the code itself, plate and all, stays on the canvas.
      expect(axisPx - GEO[mode].qr / 2).toBeGreaterThanOrEqual(64);
      expect(axisPx + GEO[mode].qr / 2).toBeLessThanOrEqual(CANVAS_H[mode]);
    }
  });

  it.each(STREAM_IDS)("%s never stands a frame on the block", (id) => {
    for (const mode of MODES) {
      const st = STREAMS[id];
      const built = BUILT[id][mode];
      const box = blockBox(st, built, mode);
      if (!box) continue;
      // ★ EVERY LIT FRAME, EVERY SAMPLE, OUTSIDE THE BLOCK'S BOX. The stacks
      // solve their anchor at the nearest line's measure and this holds the
      // whole block; the orbit's stations are drawn by hand and this is the
      // only thing that holds them. A frame sweeping round the block on its way
      // to a bottom station passes this exactly when the sweep is wide enough.
      const air = 8;
      for (let i = 0; i < built.cards.length; i++) {
        const c = built.cards[i];
        for (let k = 0; k <= 480; k++) {
          const p = k / 480;
          if (p > built.box[i].exit) continue;
          const q = placeAt(c, p, st, mode);
          if (st.opacityAt(p, q.out) <= 0.02) continue;
          const inX = Math.abs(q.x) - q.hw < box.halfW + air;
          const inY = q.y + q.hh > box.top - air && q.y - q.hh < box.bottom + air;
          expect(
            inX && inY,
            `${id} at ${mode}: card ${i} (station ${c.station}) stands on the block at phase ${p.toFixed(3)}: x ${q.x.toFixed(0)} y ${q.y.toFixed(0)} half ${q.hw.toFixed(0)}x${q.hh.toFixed(0)}`,
          ).toBe(false);
        }
      }
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

describe("the orbit never double books a station", () => {
  it("gives every held station more time than a frame occupies it", () => {
    for (const mode of MODES) {
      const st = STREAMS.orbit;
      const { cards, box } = BUILT.orbit[mode];
      // The stations are walked in order, so a station comes round again after
      // `stations * beat`; a frame owns it from the end of its approach to the
      // end of its fade. Two photographs in one station is the one fault this
      // treatment cannot survive, and it is arithmetic, not an eye, that
      // catches it.
      const places = new Set(cards.map((c) => c.station)).size;
      const beat = st.cycle[mode] / st.pool[mode];
      const revisit = places * beat;
      // When the frame is at rest in its station: the first sample past the
      // approach, to the last sample with any opacity left.
      let start = 1;
      let end = 0;
      // The orbit's fade is a function of the PHASE (it happens while the frame
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
        `orbit at ${mode}: a station is occupied for ${Math.round(occupied)}ms and comes round every ${Math.round(revisit)}ms`,
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
        // screenshot of a running board ever shows (the band standing as a
        // full file, the orbit with its stations occupied). `hero.css` puts it outside
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
    // Round six's whole point, kept: round five gave each frame four seeded
    // values and the picture never resolved into a shape. A stream's per-card
    // values have to come out of a short cycle, which is exactly what makes
    // them predictable to the eye. Checked structurally: every value a card
    // carries appears a small number of distinct times across the pool, where
    // a hash would give one distinct value per card. The band's are all one
    // value; the orbit's eight stations a side are the ceiling.
    for (const id of STREAM_IDS) {
      const { cards } = BUILT[id as StreamId].desktop;
      const perArm = cards.filter((c) => c.dir === 1);
      for (const key of ["station", "reach", "roll", "turn"] as const) {
        const distinct = new Set(perArm.map((c) => c[key]));
        expect(
          distinct.size,
          `${id}: ${key} takes ${distinct.size} values over ${perArm.length} cards, which is a deal rather than a cycle`,
        ).toBeLessThanOrEqual(8);
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
