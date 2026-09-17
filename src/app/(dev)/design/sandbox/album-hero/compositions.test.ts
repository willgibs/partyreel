import { describe, expect, it } from "vitest";

import { CANVAS, type Mode } from "@/components/lab";

import {
  BLOCK,
  build,
  BUILT,
  CALM,
  COMP_IDS,
  COMPOSITIONS,
  mod,
  type Step,
  STEPS,
} from "./compositions";
import { ALBUM_HERO } from "./spec";

/**
 * THE CALM RULE, PINNED (round three, 2026-09-17).
 *
 * Will's note on round two is this file's whole reason: "let's make the next
 * round of album hero visuals feel a bit more calm. These are all moving too
 * fast and feel distracting from the actual page content. Many frames are also
 * jittery/buggy." Taste cannot be tested and arithmetic can, so the three
 * things that MADE round two loud are numbers here, and a later round that
 * quietly speeds a composition back up turns this red rather than shipping.
 *
 *  1. NOTHING TRAVELS FASTER THAN 40 px A SECOND. The arrival's settle is
 *     excepted in `speedOf` itself: it is a beat rather than a drift, and it is
 *     over in six tenths of a second.
 *  2. AT MOST SIXTEEN PHOTOGRAPHS ARE LIT AT ONCE, at the busiest instant of a
 *     whole cycle rather than on average.
 *  3. NO LIT FRAME EVER TOUCHES THE LOCKUP. One block, its own box, at both
 *     headline steps: this is the condition every composition is drawn from,
 *     which is what lets the media stay at 100 percent with no scrim (bible 1).
 *
 * And one more that is Will's "jittery": a card's DOM box is sized to its
 * largest visible moment, so a photograph only ever scales DOWN and is never
 * re-rasterised above its own raster.
 */

const MODES: readonly Mode[] = ["desktop", "phone"];

/** The sampling the assertions walk. Finer than the solvers', on purpose: a
 *  test that samples exactly where the build sampled can only agree with it. */
const STEPS_N = 601;

function extents(w: number, h: number, roll: number) {
  const r = (roll * Math.PI) / 180;
  const c = Math.abs(Math.cos(r));
  const s = Math.abs(Math.sin(r));
  return { hw: (w * c + h * s) / 2, hh: (w * s + h * c) / 2 };
}

describe("the album hero's four compositions", () => {
  it("never lights a frame over the lockup, at either headline step", () => {
    for (const id of COMP_IDS) {
      const comp = COMPOSITIONS[id];
      for (const mode of MODES) {
        for (const step of STEPS) {
          const built = build(comp, mode, step as Step);
          const block = BLOCK[mode][step as Step];
          for (const c of built.cards) {
            for (let i = 0; i <= STEPS_N; i++) {
              const p = i / STEPS_N;
              if (comp.opacity(c, p, mode) <= 0.02) continue;
              const q = comp.place(c, p, mode);
              const e = extents(c.w * q.s, c.h * q.s, c.roll);
              const overX = Math.abs(q.x) < block.w / 2 + e.hw;
              const overY = Math.abs(q.y) < block.h / 2 + e.hh;
              expect(
                overX && overY,
                `${id} ${mode} ${step}: card ${c.slot} is lit over the lockup at p=${p.toFixed(3)}`,
              ).toBe(false);
            }
          }
        }
      }
    }
  });

  it("keeps everything under 40 px a second and sixteen frames lit", () => {
    for (const id of COMP_IDS) {
      for (const mode of MODES) {
        for (const step of STEPS) {
          const { facts } = build(COMPOSITIONS[id], mode, step as Step);
          expect(
            facts.speed,
            `${id} ${mode} ${step} moves at ${facts.speed} px/s`,
          ).toBeLessThanOrEqual(CALM.speed);
          expect(
            facts.onScreen,
            `${id} ${mode} ${step} lights ${facts.onScreen} frames`,
          ).toBeLessThanOrEqual(CALM.lit);
          expect(
            facts.onScreen,
            `${id} ${mode} ${step} lights nothing`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it("only ever scales a photograph DOWN from its own raster", () => {
    for (const id of COMP_IDS) {
      const comp = COMPOSITIONS[id];
      for (const mode of MODES) {
        for (const step of STEPS) {
          const built = build(comp, mode, step as Step);
          built.cards.forEach((c, i) => {
            const { fit } = built.box[i];
            for (let s = 0; s <= STEPS_N; s++) {
              const p = s / STEPS_N;
              if (comp.opacity(c, p, mode) <= 0.004) continue;
              expect(
                comp.place(c, p, mode).s,
                `${id} ${mode} ${step}: card ${c.slot} is drawn above its box`,
              ).toBeLessThanOrEqual(fit);
            }
          });
        }
      }
    }
  });

  it("gives every slot a cycle it fits inside, and the shelf a seamless one", () => {
    for (const id of COMP_IDS) {
      const comp = COMPOSITIONS[id];
      for (const mode of MODES) {
        const built = build(comp, mode, "lg");
        expect(
          built.flight,
          `${id} ${mode}: a flight longer than its cycle double-books a slot`,
        ).toBeLessThanOrEqual(built.cycle);
        if (comp.kind === "shelf") {
          // A band is only seamless when a card leaves the far edge at the
          // instant its slot is due again at the near one.
          expect(
            built.flight,
            `${id} ${mode}: the band wraps with a gap`,
          ).toBe(built.cycle);
        }
      }
    }
  });

  it("holds every frame on the canvas it was drawn for", () => {
    for (const id of COMP_IDS) {
      const comp = COMPOSITIONS[id];
      for (const mode of MODES) {
        const built = build(comp, mode, "lg");
        const halfW = CANVAS[mode].w / 2;
        const halfH = CANVAS[mode].h / 2;
        for (const c of built.cards) {
          let seen = false;
          for (let i = 0; i <= STEPS_N; i++) {
            const p = i / STEPS_N;
            if (comp.opacity(c, p, mode) <= 0.2) continue;
            const q = comp.place(c, p, mode);
            const e = extents(c.w * q.s, c.h * q.s, c.roll);
            if (
              Math.abs(q.x) - e.hw < halfW &&
              Math.abs(q.y) - e.hh < halfH
            ) {
              seen = true;
              break;
            }
          }
          expect(
            seen,
            `${id} ${mode}: card ${c.slot} is never on the canvas`,
          ).toBe(true);
        }
      }
    }
  });

  it("keeps a photograph from being buried in the still", () => {
    // The still is what a reduced-motion reader and a crawler get, so it is a
    // composition in its own right rather than a frozen accident. Frames may
    // tuck behind one another, which is the reference's own look and what the
    // depth axis is for; what none of them may be is BURIED, so no photograph
    // is more than 45 per cent covered by another at the rest phase.
    for (const id of COMP_IDS) {
      const comp = COMPOSITIONS[id];
      for (const mode of MODES) {
        const built = build(comp, mode, "lg");
        const lit = built.cards
          .map((c) => ({ c, p: Math.min(c.at / built.flight, 1) }))
          .filter(({ c, p }) => comp.opacity(c, p, mode) > 0.25)
          .map(({ c, p }) => {
            const q = comp.place(c, p, mode);
            const e = extents(c.w * q.s, c.h * q.s, c.roll);
            return { q, e, slot: c.slot };
          });
        for (let i = 0; i < lit.length; i++) {
          for (let j = i + 1; j < lit.length; j++) {
            const a = lit[i];
            const b = lit[j];
            const ox = a.e.hw + b.e.hw - Math.abs(a.q.x - b.q.x);
            const oy = a.e.hh + b.e.hh - Math.abs(a.q.y - b.q.y);
            if (ox <= 0 || oy <= 0) continue;
            const area = ox * oy;
            const smaller = Math.min(
              a.e.hw * a.e.hh * 4,
              b.e.hw * b.e.hh * 4,
            );
            expect(
              area / smaller,
              `${id} ${mode}: ${a.slot} and ${b.slot} pile up in the still`,
            ).toBeLessThan(0.45);
          }
        }
      }
    }
  });

  /**
   * ★ THE NUMBERS LIVE IN THE TABLES AND THE WORDS LIVE IN THE SPEC, and this
   * is what holds them equal. Round two carried "fifty-two frames at 1440" in
   * four separate prose strings and one of them was stale by its first
   * read-back, so a card's Cost line is written here as arithmetic: a retune of
   * any composition turns this red rather than leaving the board claiming a
   * count nobody drew any more. Every board card is a composition and every
   * composition is a card, which is the other half of the same guard.
   */
  it("pins every card's Cost line to the table it reports", () => {
    expect(
      ALBUM_HERO.candidates.map((c) => c.id).sort(),
      "a card with no composition, or a composition with no card",
    ).toEqual([...COMP_IDS].sort());
    for (const card of ALBUM_HERO.candidates) {
      const { facts } = BUILT[card.id as (typeof COMP_IDS)[number]].desktop.lg;
      const cost = card.facts?.find(([label]) => label === "Cost")?.[1];
      expect(
        cost,
        `${card.id} carries no Cost fact`,
      ).toBe(
        `${facts.onScreen} lit of ${facts.nodes} nodes, ${facts.speed} px a second`,
      );
    }
  });

  it("launches every slot on its own beat", () => {
    for (const id of COMP_IDS) {
      const comp = COMPOSITIONS[id];
      for (const mode of MODES) {
        const built = build(comp, mode, "lg");
        for (const c of built.cards) {
          // The shelf's foot band runs half a beat behind its top band on
          // purpose, so the two never arrive in lockstep; everything else
          // launches on the beat itself.
          const unit =
            comp.kind === "shelf" ? comp.beat[mode] / 2 : comp.beat[mode];
          expect(
            mod(c.at, unit),
            `${id} ${mode}: card ${c.slot} launches off the beat`,
          ).toBeCloseTo(0, 6);
        }
      }
    }
  });
});
