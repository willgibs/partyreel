import { describe, expect, it } from "vitest";

import { CANVAS, extents, HOME, type Mode } from "./field";
import { PRIVACY_HERO } from "./spec";
import {
  type Arms,
  BLOCK,
  CENTRE_Y,
  GAPS,
  PACES,
  SPACING,
  spirals,
  type Trail,
} from "./spirals";

/**
 * WHAT THE SPIRALS HAVE TO BE TRUE OF (the heroes lane, 2026-09-18).
 *
 * Two kinds of check, and neither is about the look. The first is the
 * conditions the composition is DRAWN FROM: nothing lit ever sits on the words
 * or under the site header, the table closes, a pace only rescales the clock.
 * The second holds the words to the tables: every number an option states is
 * the number its preview measures, so a retune turns this red rather than
 * leaving a tile that says one thing and draws another (a board once drew an
 * option with its formula's sign backwards, and Will judged the picture).
 *
 * ★ NOTHING HERE CAPS A PACE OR A COUNT. Round three pinned 40 px a second and
 * sixteen lit on every composition, and every option was calm by construction;
 * he called them "too boring". Each option is graded against the home hero on
 * the board instead.
 */

const MODES: readonly Mode[] = ["desktop", "phone"];
const TRAILS: readonly Trail[] = ["wake", "echoes", "none"];
const armsFor = (mode: Mode): readonly Arms[] =>
  mode === "phone" ? ["spirals", "cones"] : ["spirals"];

/** Every option the board can draw, as the tables it draws them from. */
function* every() {
  for (const mode of MODES)
    for (const arms of armsFor(mode))
      for (const pace of PACES)
        for (const gap of GAPS)
          for (const trail of TRAILS)
            yield spirals({ mode, pace, gap, trail, arms });
}

/** The site header's band, which a lit frame may never sit under. */
const HEADER = 64;
const STEPS = 120;

describe("the spirals keep off the words and out from under the bar", () => {
  // Every option the board draws, sampled across every card's flight: slow by
  // nature, so it is given the time it needs rather than sampled thinner.
  it("never lights a card over the lockup's ink, at any option", { timeout: 60_000 }, () => {
    for (const f of every()) {
      const { mode } = f;
      const cx = CANVAS[mode].w / 2;
      const cy = CENTRE_Y[mode];
      const block = BLOCK[mode];
      for (const c of f.cards) {
        for (let i = 0; i <= STEPS; i++) {
          const age = (i / STEPS) * f.flight;
          if (f.opacity(c, age) <= 0.02) continue;
          const q = f.place(c, age);
          const e = extents(c.w * q.s, c.h * q.s, c.roll);
          const overX = Math.abs(q.x - cx) < block.w / 2 + e.hw;
          const overY = Math.abs(q.y - cy) < block.h / 2 + e.hh;
          expect(
            overX && overY,
            `${f.spec.mode} ${f.spec.pace} ${f.spec.gap} ${f.spec.trail}: ${c.key} is lit over the words at ${Math.round(age)} ms`,
          ).toBe(false);
        }
      }
    }
  });

  it("never lights a card under the header's words", { timeout: 60_000 }, () => {
    for (const f of every()) {
      for (const c of f.cards) {
        for (let i = 0; i <= STEPS; i++) {
          const age = (i / STEPS) * f.flight;
          if (f.opacity(c, age) <= 0.05) continue;
          const q = f.place(c, age);
          const e = extents(c.w * q.s, c.h * q.s, c.roll);
          expect(
            q.y - e.hh,
            `${f.spec.mode} ${f.spec.trail}: ${c.key} is under the header at ${Math.round(age)} ms`,
          ).toBeGreaterThan(HEADER - 2);
        }
      }
    }
  });

  it("keeps every trail node off the words too", { timeout: 60_000 }, () => {
    for (const f of every()) {
      if (!f.trail) continue;
      const { mode } = f;
      const cx = CANVAS[mode].w / 2;
      const cy = CENTRE_Y[mode];
      const block = BLOCK[mode];
      f.cards.forEach((c, i) => {
        for (let s = 0; s <= 80; s++) {
          const age = (s / 80) * f.flight;
          for (let k = 0; k < f.trail!.count; k++) {
            const n = f.trail!.at(c, age, k, f.box[i].fit, f.box[i]);
            if (n.opacity <= 0.02) continue;
            // translate3d(xpx, ypx, 0): the node's box starts there.
            const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(n.transform);
            expect(m, n.transform).toBeTruthy();
            const x = Number(m![1]) + f.box[i].w / 2;
            const y = Number(m![2]) + f.box[i].h / 2;
            // Its centre, at least, is never on the words; a ghost is a whole
            // card and is held to the card's own rule.
            const inside =
              Math.abs(x - cx) < block.w / 2 && Math.abs(y - cy) < block.h / 2;
            expect(inside, `${mode} ${f.spec.trail}: ${c.key} trail ${k}`).toBe(
              false,
            );
          }
        }
      });
    }
  });
});

describe("the table", () => {
  it("never double-books a slot: every flight fits inside its cycle", () => {
    for (const f of every()) expect(f.flight).toBeLessThanOrEqual(f.cycle);
  });

  it("launches the two arms together, half a turn apart", () => {
    for (const f of every()) {
      if (f.spec.arms === "cones") continue;
      for (let i = 0; i < f.cards.length; i += 2) {
        const a = f.cards[i];
        const b = f.cards[i + 1];
        expect(b.at).toBe(a.at);
        expect(Math.cos(b.angle)).toBeCloseTo(-Math.cos(a.angle), 6);
        expect(Math.sin(b.angle)).toBeCloseTo(-Math.sin(a.angle), 6);
      }
    }
  });

  it("makes a pace one picture on another clock", () => {
    for (const mode of MODES)
      for (const gap of GAPS) {
        const home = spirals({ mode, pace: "home", gap, trail: "none", arms: "spirals" });
        for (const pace of PACES) {
          const f = spirals({ mode, pace, gap, trail: "none", arms: "spirals" });
          expect(f.cards.length).toBe(home.cards.length);
          f.cards.forEach((c, i) => {
            const a = f.place(c, c.at);
            const b = home.place(home.cards[i], home.cards[i].at);
            expect(a.x).toBeCloseTo(b.x, 3);
            expect(a.y).toBeCloseTo(b.y, 3);
          });
        }
      }
  });

  it("throws the phone's cones within thirty degrees of up and down", () => {
    for (const pace of PACES)
      for (const gap of GAPS) {
        const f = spirals({ mode: "phone", pace, gap, trail: "wake", arms: "cones" });
        for (const c of f.cards)
          expect(Math.abs(Math.cos(c.angle))).toBeLessThanOrEqual(
            Math.sin((30 * Math.PI) / 180) + 1e-9,
          );
      }
  });
});

/**
 * ★ THE WORDS ARE HELD TO THE TABLES. The spec is pure data and cannot import
 * the engine, so the numbers are written out there and checked here.
 */
describe("every option says what it draws", () => {
  const ask = (id: string) => PRIVACY_HERO.asks.find((a) => a.id === id)!;
  const means = (askId: string, optionId: string) => {
    const o = ask(askId).options.find(
      (x) => typeof x !== "string" && x.id === optionId,
    );
    return typeof o === "object" ? (o.means ?? "") : "";
  };

  it("states each pace's launch speed and turn", () => {
    for (const pace of PACES) {
      const f = spirals({ mode: "desktop", pace, gap: "half", trail: "wake", arms: "spirals" });
      const text = means("pace", pace);
      expect(text, pace).toContain(`${f.pace.launch} px a second`);
      expect(text, pace).toContain(`every ${Math.round(f.pace.turnS)} seconds`);
    }
    expect(ask("pace").context).toContain(
      `${Math.round(HOME.desktop.launch)} px a second`,
    );
  });

  it("states each gap's spacing, clock and count at the home hero's speed", () => {
    for (const gap of GAPS) {
      const f = spirals({ mode: "desktop", pace: "home", gap, trail: "wake", arms: "spirals" });
      const text = means("gap", gap);
      // The spacing it draws is the one it names, to a tenth.
      expect(Math.abs(f.spacing - SPACING[gap]), gap).toBeLessThanOrEqual(0.15);
      expect(text, gap).toContain(`${Math.round(f.beat / 10) * 10} ms`);
      expect(text, gap).toContain(`${f.facts.lit}`);
    }
    expect(means("gap", "half")).toContain(`the home hero: ${HOME.desktop.lit}`);
    expect(ask("gap").context).toContain(`${HOME.desktop.beat} ms`);
    // "Two and a half apart" at the home hero's own clock, measured.
    const atHome = spirals({
      mode: "desktop",
      pace: "home",
      gap: "half",
      trail: "none",
      arms: "spirals",
      beat: HOME.desktop.beat,
    });
    expect(atHome.spacing).toBeGreaterThan(2.2);
    expect(atHome.spacing).toBeLessThan(2.8);
  });
});
