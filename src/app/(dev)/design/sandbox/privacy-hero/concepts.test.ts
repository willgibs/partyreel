import { describe, expect, it } from "vitest";

import { CANVAS } from "@/components/lab";
import { optionMeans } from "@/components/lab/board-spec";

import {
  ACCESS,
  accessTiles,
  APERTURE,
  CONCEPTS,
  lockupRect,
  rectAround,
  rectsClear,
  SEAL,
  sealCards,
  sealStepMs,
  SWEEP,
} from "./concepts";
import { PRIVACY_HERO } from "./spec";

/**
 * ROUND THREE'S WORDS AGAINST THE FOUR CONCEPTS' OWN NUMBERS, and the one
 * promise every option's geometry makes: nothing sits on the lockup's ink.
 * `paths.test.ts` did the first job for round two's engine (deleted with
 * it); this is the same discipline, `sweep` added by the overtaken audit's
 * reshape (2026-09-21).
 */

const MODES = ["desktop", "phone"] as const;

const tile = (option: string) =>
  optionMeans(
    PRIVACY_HERO.asks[0].options.find(
      (o) => (typeof o === "string" ? o : o.id) === option,
    )!,
  )!;

describe("the board's ask matches the three concepts, no more and no fewer", () => {
  it("CONCEPTS is exactly the ask's option ids", () => {
    const ids = PRIVACY_HERO.asks[0].options.map((o) =>
      typeof o === "string" ? o : o.id,
    );
    expect(new Set(ids)).toEqual(new Set(CONCEPTS));
  });
});

describe("the option tiles state the concepts' own numbers", () => {
  it("the aperture", () => {
    const t = tile("aperture");
    const [ringLo, ringHi] = APERTURE.ring.desktop;
    const [lo, hi] = APERTURE.opacity;
    expect(t).toContain(`${ringLo} to ${ringHi}px`);
    expect(t).toContain(`${Math.round(lo * 100)} to ${Math.round(hi * 100)}%`);
    expect(t).toContain(`${APERTURE.cycleMs / 1000} seconds`);
  });

  it("the access grid", () => {
    const t = tile("access");
    expect(t).toContain(`${ACCESS.tiles.desktop} small tiles`);
    expect(t).toContain(`${(ACCESS.holdMs / 1000).toFixed(2)}s`);
    expect(t).toContain(`${(ACCESS.fadeMs / 1000).toFixed(2)}s`);
    expect(t).toContain(`${ACCESS.cycleMs / 1000}s`);
  });

  it("the sweep", () => {
    const t = tile("sweep");
    expect(t).toContain(`${SWEEP.tiles.desktop} small tiles`);
    expect(t).toContain(`${(SWEEP.sweepMs / 1000).toFixed(1)}s`);
    expect(t).toContain(`${SWEEP.cycleMs / 1000}s`);
  });

  it("the sealed cards", () => {
    const t = tile("seal");
    expect(t).toContain(`${SEAL.cards.desktop} photographs`);
    expect(t).toContain(`${SEAL.sealedPct}%`);
    expect(t).toContain(`${SEAL.openPct}%`);
    expect(t).toContain(`${(SEAL.openMs / 1000).toFixed(2)}s`);
    expect(t).toContain(`${sealStepMs("desktop") / 1000} seconds`);
  });
});

describe("the rotations land exactly one turn at a time", () => {
  it("access: the per-tile step divides the cycle for both tile counts", () => {
    // `stepMs` is a constant, not derived per mode; this is what makes 8
    // tiles at a laptop and 6 at a phone both read as a clean rotation
    // rather than one of them landing mid-turn.
    expect(ACCESS.cycleMs % ACCESS.stepMs).toBe(0);
    expect(ACCESS.cycleMs / ACCESS.stepMs).toBe(ACCESS.tiles.desktop);
  });

  it("seal: the step always divides the shared cycle by the card count", () => {
    for (const mode of MODES) {
      expect(sealStepMs(mode) * SEAL.cards[mode]).toBe(SEAL.cycleMs);
    }
  });

  it("a card's own open-plus-reseal never outlasts its slice", () => {
    for (const mode of MODES) {
      expect(SEAL.openMs + SEAL.closeMs).toBeLessThan(sealStepMs(mode));
    }
  });
});

describe("every static element clears the lockup's ink and sits inside its canvas", () => {
  // `sweep` needs no geometry test of its own here: `SWEEP.sizePx` IS
  // `ACCESS.sizePx` and its tiles are `accessTiles(mode)`, the exact same
  // function this test already calls, so a second block would only prove the
  // same function returns the same answer twice.
  it("every access tile", () => {
    for (const mode of MODES) {
      const size = ACCESS.sizePx[mode];
      const canvas = rectAround(
        CANVAS[mode].w / 2,
        CANVAS[mode].h / 2,
        CANVAS[mode].w,
        CANVAS[mode].h,
      );
      for (const t of accessTiles(mode)) {
        const r = rectAround(t.x, t.y, size, size);
        expect(
          rectsClear(r, lockupRect(mode)),
          `${mode} tile at (${t.x}, ${t.y}) touches the lockup`,
        ).toBe(true);
        expect(r.x0 >= canvas.x0 && r.x1 <= canvas.x1).toBe(true);
        expect(r.y0 >= canvas.y0 && r.y1 <= canvas.y1).toBe(true);
      }
    }
    expect(accessTiles("desktop")).toHaveLength(ACCESS.tiles.desktop);
    expect(accessTiles("phone")).toHaveLength(ACCESS.tiles.phone);
  });

  it("every sealed card", () => {
    for (const mode of MODES) {
      const { w, h } = SEAL.size[mode];
      for (const c of sealCards(mode)) {
        const r = rectAround(c.x, c.y, w, h);
        expect(
          rectsClear(r, lockupRect(mode)),
          `${mode} card at (${c.x}, ${c.y}) touches the lockup`,
        ).toBe(true);
        expect(r.x0 >= 0 && r.x1 <= CANVAS[mode].w).toBe(true);
        expect(r.y0 >= 0 && r.y1 <= CANVAS[mode].h).toBe(true);
      }
    }
    expect(sealCards("desktop")).toHaveLength(SEAL.cards.desktop);
    expect(sealCards("phone")).toHaveLength(SEAL.cards.phone);
  });

  it("the aperture's ring stays smaller than either canvas", () => {
    for (const mode of MODES) {
      const [, ringHi] = APERTURE.ring[mode];
      expect(ringHi).toBeLessThan(CANVAS[mode].w);
      expect(ringHi).toBeLessThan(CANVAS[mode].h);
    }
  });
});
