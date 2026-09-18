// @contract-for: src/components/shared/river/river-engine.ts

import { describe, expect, it } from "vitest";

import {
  boxOf,
  buildCards,
  fallAt,
  frameAt,
  originOf,
  phaseAt,
  restOf,
  revealEase,
  RIVER_FADES,
  riverClock,
  riverGeo,
  type RiverCard,
  type RiverGeo,
} from "./river-engine";

/**
 * THE RIVER'S ARITHMETIC, pinned. The engine is pure by design (no React, no
 * DOM, no measuring) precisely so the properties below can be CHECKED rather
 * than eyeballed on a stage: the loop writes what these functions return, the
 * server writes the same expressions into custom properties, and a drift
 * between the two is a hydration warning nobody sees until it ships.
 *
 * Function, never look: nothing here pins a duration, a curve weight, an alpha
 * or a size. Retune FLIGHT, the gravity split, the card size or the fan and
 * every test still passes; break the recycle, the rest state or the
 * determinism and they do not.
 */

/** The two boxes production actually mounts: the empty album is square. */
const SQUARE = riverGeo(1);
/** And a taller slot, because the geometry claims to hold at any ratio. */
const TALL = riverGeo(1.32);

const PACK = 9;
const cards = buildCards(PACK);
const clock = riverClock(PACK);

/** The progress a card wraps at: the cycle's ceiling, in flights. */
const ceiling = clock.cycle / clock.flight;

/** Walk one card's whole life finely enough to catch a one-frame pop. */
function walk(c: RiverCard, geo: RiverGeo, step = 0.001) {
  const out: { p: number; visible: boolean }[] = [];
  for (let p = 0; p <= ceiling + 1e-9; p += step) {
    out.push({ p, visible: !frameAt(c, p, geo).gone });
  }
  return out;
}

describe("the clock", () => {
  it("wraps a card before its flight is over, so the stream never gaps", () => {
    // The cadence divides the flight a hair short: every card in the pool is
    // airborne at every moment, and gravity does the spacing for free.
    expect(clock.cycle).toBeLessThan(clock.flight);
    expect(clock.launch * PACK).toBe(clock.cycle);
  });

  it("keeps the same pace whatever the pool size: fewer photographs, a sparser flow", () => {
    for (const n of [4, 9, 12, 20]) {
      const k = riverClock(n);
      expect(k.flight).toBe(clock.flight);
      expect(k.cycle).toBeLessThan(k.flight);
      // A bigger pool launches more often rather than falling faster.
      expect(k.launch).toBeLessThanOrEqual(riverClock(n - 1).launch);
    }
  });

  it("spreads the pool evenly around the cycle at rest", () => {
    const phases = cards
      .map((c) => phaseAt(c, 0, 1, clock))
      .sort((a, b) => a - b);
    for (const p of phases) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(ceiling);
    }
    // No two cards share a moment: they would be one photograph thick.
    for (let i = 1; i < phases.length; i++) {
      expect(phases[i] - phases[i - 1]).toBeGreaterThan(0.01);
    }
  });
});

describe("the recycle", () => {
  it.each([
    ["square", SQUARE],
    ["tall", TALL],
  ])("takes every card out of the box before it wraps (%s)", (_label, geo) => {
    for (const c of cards) {
      expect(frameAt(c, ceiling, geo).gone, c.key).toBe(true);
    }
  });

  it.each([
    ["square", SQUARE],
    ["tall", TALL],
  ])("cuts a card exactly once, never twice (%s)", (_label, geo) => {
    // ★ A card that went, came back and went again is the pop the dead line
    // exists to prevent: it would blink at the bottom of the stream every
    // cycle. Count the visible-to-gone edges over one whole life.
    for (const c of cards) {
      const life = walk(c, geo);
      let edges = 0;
      for (let i = 1; i < life.length; i++) {
        if (life[i - 1].visible && !life[i].visible) edges++;
      }
      expect(edges, `${c.key} left the box ${edges} times`).toBe(1);
    }
  });

  it("cuts on the card's TOP EDGE and never its centre", () => {
    // ★ The whole reason the cut is not `centre > deadY`: a card is laid out
    // and scaled about its centre, so a centre test throws away the upper half
    // of a photograph still standing where the mask is fully opaque. Proof:
    // at the moment a card really goes, its centre is already well past the
    // dead line, so a centre test would have fired strictly earlier.
    for (const c of cards) {
      const life = walk(c, SQUARE);
      const last = life.filter((s) => s.visible).at(-1);
      expect(last, c.key).toBeDefined();
      const centre = SQUARE.originY + fallAt(last!.p) * SQUARE.travel;
      expect(centre, c.key).toBeGreaterThan(SQUARE.deadY);
    }
  });

  it("dissolves the stream out of the box before the cut, at both ends", () => {
    // The masks and the dead line read ONE number (RIVER_FADES): a dead line
    // above the mask's last stop would cut a card in plain sight.
    expect(SQUARE.deadY).toBeCloseTo(RIVER_FADES.bottom1, 10);
    expect(RIVER_FADES.bottom0).toBeLessThan(RIVER_FADES.bottom1);
    // And the flow is born ABOVE the frame, behind the top dissolve, so no
    // card ever switches on inside the box.
    expect(SQUARE.originY).toBeLessThan(0);
  });
});

describe("one card's composition", () => {
  it("is never rasterized above 1:1, and is full size well before it lands", () => {
    for (const c of cards) {
      for (let p = 0; p <= ceiling; p += 0.01) {
        const f = frameAt(c, p, SQUARE);
        if (f.gone) continue;
        const scale = Number(/scale\(([\d.]+)\)/.exec(f.transform)?.[1]);
        expect(scale, `${c.key} at ${p}`).toBeLessThanOrEqual(1);
        expect(scale).toBeGreaterThan(0);
      }
    }
  });

  it("leaves at an angle and lands square", () => {
    const angle = (c: RiverCard, p: number) => {
      const f = frameAt(c, p, SQUARE);
      expect(f.gone, `${c.key} is gone at ${p}`).toBe(false);
      if (f.gone) return 0;
      return Number(/rotate\((-?[\d.]+)deg\)/.exec(f.transform)![1]);
    };
    const tumbled = cards.reduce((a, b) =>
      Math.abs(b.rz) > Math.abs(a.rz) ? b : a,
    );
    expect(Math.abs(tumbled.rz)).toBeGreaterThan(1);
    expect(Math.abs(angle(tumbled, 0.02))).toBeGreaterThan(
      Math.abs(angle(tumbled, 0.8)) * 2,
    );
  });

  it("opens the fan out of nothing, and never wider than the box", () => {
    for (const c of cards) {
      const born = frameAt(c, 0, SQUARE);
      expect(born.gone).toBe(false);
      // Every card is born on the centre line: the flow slides out of one
      // point rather than switching on across the width.
      expect(born.gone ? "" : born.transform).toContain("translate3d(0.000%");
      const landed = frameAt(c, 0.8, SQUARE);
      if (landed.gone) continue;
      const x = Number(/translate3d\((-?[\d.]+)%/.exec(landed.transform)![1]);
      // The translate is a percentage of the CARD's own box, which is itself a
      // share of the flow's width: x% of the card is (x * cardW) widths.
      const widths = (x / 100) * SQUARE.card * c.wf * c.sJit;
      expect(Math.abs(widths)).toBeLessThanOrEqual(SQUARE.spread + 1e-9);
    }
  });

  it("fades a card up rather than switching it on", () => {
    const c = cards[0];
    const a = frameAt(c, 0, SQUARE);
    const b = frameAt(c, 0.05, SQUARE);
    const settled = frameAt(c, 0.3, SQUARE);
    expect(a.gone ? 1 : a.opacity).toBe(0);
    expect(b.gone ? 0 : b.opacity).toBeGreaterThan(0);
    expect(settled.gone ? 0 : settled.opacity).toBe(1);
  });
});

describe("the rest state", () => {
  it("IS the running flow with the pour finished and the clock at zero", () => {
    // ★ The rest state is what a reduced-motion reader, a reader with
    // scripting off, a crawler and the server's own HTML all get, so it may
    // never be authored separately from the loop: it is the same expression.
    for (const c of cards) {
      const rest = restOf(c, SQUARE, clock);
      const running = frameAt(c, phaseAt(c, 0, 1, clock), SQUARE);
      if (running.gone) {
        expect(rest.opacity, c.key).toBe("0");
        // Still placed, so the sheet's rule never reads an empty property.
        expect(rest.transform, c.key).not.toBe("");
      } else {
        expect(rest.transform, c.key).toBe(running.transform);
        expect(Number(rest.opacity)).toBeCloseTo(running.opacity, 3);
      }
    }
  });

  it("is the SAME string every time, so the server and the browser agree", () => {
    // Integer-only hashing and rounded output, on purpose: Math.sin and
    // Math.cos are not bit identical across JS engines, and this string is
    // server rendered into a custom property. A drift here is a hydration
    // warning in production and nothing at all in a lab.
    const once = cards.map((c) => restOf(c, SQUARE, clock));
    const twice = buildCards(PACK).map((c) => restOf(c, riverGeo(1), clock));
    expect(twice).toEqual(once);
    for (const r of once) {
      expect(r.transform).toMatch(/^(none|translate3d\(-?[\d.]+%, )/);
      expect(r.transform).not.toMatch(/NaN|Infinity/);
    }
  });

  it("starts the pour from one point, with the reveal at zero", () => {
    // The pour and the loop are ONE expression: at elapsed 0 the reveal has
    // not opened the seeded offsets, so every card sits at the same progress
    // and the entrance needs no handoff from a separate entrance animation.
    expect(revealEase(0)).toBe(0);
    expect(revealEase(1)).toBe(1);
    const at = cards.map((c) => phaseAt(c, 0, revealEase(0), clock));
    expect(new Set(at).size).toBe(1);
    expect(at[0]).toBe(0);
  });
});

describe("the box", () => {
  it("is described entirely in fractions, so one geometry serves every width", () => {
    // ★ Nothing here is px. The component takes its width from its container,
    // hands CSS percentages of each card's OWN box, and therefore survives a
    // resize with no listener and paints correctly on a server that cannot
    // know the width. A number in px would quietly break all three.
    for (const [k, v] of Object.entries(SQUARE)) {
      expect(Number.isFinite(v), k).toBe(true);
      expect(Math.abs(v as number), k).toBeLessThan(10);
    }
    expect(riverGeo(2).card).toBe(SQUARE.card);
    expect(riverGeo(2).spread).toBe(SQUARE.spread);
  });

  it("puts a card's centre on the origin, in both directions", () => {
    // margin percentages resolve against the containing block's WIDTH in BOTH
    // directions, which is why the top margin is not divided by the ratio and
    // the height is. Get this wrong and the flow is offset by half a card in a
    // non-square box only, which is exactly the bug nobody sees on a phone.
    for (const geo of [SQUARE, TALL]) {
      for (const c of cards) {
        const box = boxOf(c, geo);
        const w = parseFloat(box.width);
        const h = parseFloat(box.height);
        expect(parseFloat(box.marginLeft)).toBeCloseTo(-w / 2, 3);
        // 2 places, not 3: the emitted percentages are already rounded to 3,
        // and multiplying the height back by the ratio re-inflates that.
        expect(parseFloat(box.marginTop)).toBeCloseTo((-h / 2) * geo.h, 2);
      }
    }
    expect(parseFloat(originOf(TALL))).toBeCloseTo(
      (TALL.originY / TALL.h) * 100,
      3,
    );
  });

  it("gives every photograph exactly one card", () => {
    expect(new Set(cards.map((c) => c.photo)).size).toBe(PACK);
    expect(new Set(cards.map((c) => c.key)).size).toBe(PACK);
    expect([...cards].sort((a, b) => a.photo - b.photo).map((c) => c.photo)) //
      .toEqual([...Array(PACK).keys()]);
  });

  it("spreads consecutive launches apart rather than clustering them", () => {
    // The lane comes off the golden ratio sequence and not a hash: a hash
    // clusters, and a clustered flow reads as a queue down one side.
    for (let i = 1; i < cards.length; i++) {
      expect(
        Math.abs(cards[i].lane - cards[i - 1].lane),
        `${cards[i - 1].key} then ${cards[i].key}`,
      ).toBeGreaterThan(0.2);
    }
    for (const c of cards) {
      expect(Math.abs(c.lane)).toBeLessThanOrEqual(1);
    }
  });
});

describe("gravity", () => {
  it("runs the whole fall and is quicker at the bottom than at the top", () => {
    expect(fallAt(0)).toBe(0);
    expect(fallAt(1)).toBeCloseTo(1, 10);
    const early = fallAt(0.1) - fallAt(0);
    const late = fallAt(1) - fallAt(0.9);
    expect(late).toBeGreaterThan(early * 1.5);
    // Monotone: a photograph never floats back up.
    let prev = -1;
    for (let p = 0; p <= 1; p += 0.01) {
      const f = fallAt(p);
      expect(f).toBeGreaterThan(prev);
      prev = f;
    }
  });
});
