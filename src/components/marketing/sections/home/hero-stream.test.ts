import { describe, expect, it } from "vitest";

import qrcode from "qrcode-generator";

import { marketingImage } from "@/lib/constants/marketing-media";

import {
  blockBox,
  BPS,
  BUILT,
  type Bp,
  colOf,
  QR_FLOOR_PX_PER_MODULE,
  QR_QUIET,
  FRAME_SIZES,
  GEO,
  opacityAt,
  placeAt,
  reachOf,
  restPhase,
  STREAM_FRAMES,
} from "./hero-stream";

/**
 * WHAT THE HOME HERO'S STREAM HAS TO BE TRUE OF (the hero's wiring round,
 * 2026-09-17; the board's `streams.test.ts`, cut to the one composition that
 * shipped).
 *
 * The composition is a table of numbers, and a table of numbers has no compile
 * error: a beat shortened by 60 ms doubles the frames on screen, a card grown
 * by 20 px stands a photograph on the headline, a breakpoint's reference
 * changed puts the band under the type at 1024 and nowhere else, and all three
 * look like a design opinion rather than a fault. These are the conditions the
 * composition is DRAWN FROM, so they are checked here rather than hoped for.
 *
 * Not pinned here: anything about the look. A test that fixed the travel curve
 * or the curl would be a test that owns the design, and the design is Will's (a
 * contract guards function, never a look).
 */

/** The clear line is designed at each breakpoint's reference and re-checked at
 *  its narrowest viewport, where the same band crowds the block hardest. */
const WORST: Record<Bp, number> = {
  base: GEO.base.halfMin,
  lg: GEO.lg.halfMin,
};

describe("the band leaves the type its measured lane", () => {
  it.each(BPS)(
    "%s keeps every frame off the block, at its worst width",
    (bp) => {
      const { cards, box } = BUILT[bp];
      const block = blockBox(bp, WORST[bp]);
      // ★ EVERY LIT FRAME, EVERY SAMPLE, OUTSIDE THE BLOCK'S BOX, and with air to
      // spare. `build` solves the anchor at the design reference, which is what
      // keeps the composition the one Will picked; this is what stops a viewport
      // the reference never saw from quietly eating the gap. If it ever fails the
      // answer is a third breakpoint, never a thinner margin.
      const AIR = 24;
      let closest = Infinity;
      for (let i = 0; i < cards.length; i++) {
        for (let k = 0; k <= 480; k++) {
          const p = k / 480;
          if (p > box[i].exit) continue;
          const q = placeAt(cards[i], p, bp);
          if (opacityAt(q.out) <= 0.02) continue;
          // The frame's span and the block's, both as fractions of the hero's
          // half-width; the vertical is px, because the band runs on one axis and
          // the block is anchored in px below it.
          if (Math.abs(q.x) - q.hw / WORST[bp] >= block.col) continue;
          closest = Math.min(closest, block.top - q.hh);
        }
      }
      expect(
        closest,
        `${bp}: the band comes within ${closest.toFixed(1)}px of the block`,
      ).toBeGreaterThanOrEqual(AIR);
    },
  );

  it.each(BPS)(
    "%s solves its clear line off the band, not off a guess",
    (bp) => {
      const geo = GEO[bp];
      const { cards, low } = BUILT[bp];
      const measured = reachOf(cards, bp, colOf(geo), geo.halfRef);
      // The anchor IS the measurement plus the designed air, or the plate when
      // the plate is taller; nothing else may set it.
      const plate = geo.qr / 2 + 8 + geo.margin;
      expect(low).toBe(
        Math.max(Math.round(measured + geo.margin + geo.breath), plate),
      );
      expect(
        measured,
        `${bp}: nothing reaches over the block's column`,
      ).toBeGreaterThan(0);
    },
  );

  it.each(BPS)("%s fits the whole composition above the fold", (bp) => {
    const { axisMin, below, minH } = BUILT[bp];
    // The hero is exactly one screen: the site header is sticky, so the hero's
    // -mt puts its top edge at the viewport's top and its first 64px are the
    // header's band. At `minH` the clamp's two ends meet exactly: the code at
    // its floor, the block ending at the fold.
    expect(axisMin).toBeGreaterThanOrEqual(64);
    expect(minH).toBe(axisMin + below);
    // And it has to be a height a real window has: the shortest laptop the hero
    // is verified on is 720 and the shortest phone 667.
    const shortest = bp === "lg" ? 720 : 667;
    expect(
      minH,
      `${bp}: the hero cannot fit its block in the shortest window it is verified on`,
    ).toBeLessThanOrEqual(shortest);
  });
});

describe("no frame is ever rasterized above its own pixels", () => {
  it.each(BPS)("%s sizes every DOM box to its largest visible moment", (bp) => {
    const { cards, box } = BUILT[bp];
    cards.forEach((c, i) => {
      // The DOM box is `w * fit` and the transform scale is `s / fit`, so the
      // on-screen size is `w * s`. `fit` is the largest `s` the frame ever
      // reaches while a person can see it: if any visible sample beats it, that
      // photograph is being upscaled on the screen.
      for (let k = 0; k <= 240; k++) {
        const p = k / 240;
        if (p > box[i].exit) continue;
        const q = placeAt(c, p, bp);
        if (opacityAt(q.out) <= 0.02) continue;
        expect(
          q.s,
          `${bp} frame ${i} exceeds its box at ${p}`,
        ).toBeLessThanOrEqual(box[i].fit + 1e-6);
      }
      expect(box[i].w).toBeGreaterThan(0);
      expect(Number.isFinite(box[i].h)).toBe(true);
    });
  });

  it("asks for the size it renders, at each breakpoint", () => {
    // The `sizes` attribute is derived from the largest box each breakpoint
    // actually paints, so a retuned card retunes the request. A vw value here
    // would over-fetch on a wide screen, where the band grows but the frames
    // do not.
    expect(FRAME_SIZES).toBe(
      `(min-width: 1024px) ${BUILT.lg.facts.largest}px, ${BUILT.base.facts.largest}px`,
    );
    expect(FRAME_SIZES).not.toMatch(/vw/);
  });
});

describe("one set of nodes serves both geometries", () => {
  it("pairs every frame across the two breakpoints", () => {
    // `cinema-hero.tsx` renders ONE list of nodes and lets the sheet choose
    // between a `-base` and a `-lg` custom property on each: that only works
    // while frame `i` is the same photograph in the same launch order on both.
    // A retuned beat that changed a pool would break the pairing silently, and
    // every frame would wear another frame's box.
    expect(BUILT.base.cards.length).toBe(BUILT.lg.cards.length);
    expect(BUILT.base.pool).toBe(BUILT.lg.pool);
    BUILT.base.cards.forEach((c, i) => {
      expect(c.key).toBe(BUILT.lg.cards[i].key);
      expect(c.photo).toBe(BUILT.lg.cards[i].photo);
      expect(c.dir).toBe(BUILT.lg.cards[i].dir);
    });
  });
});

describe("the rest state is a composed still", () => {
  it.each(BPS)("%s stands deployed, never collapsed at the code", (bp) => {
    // ★ THE REST STATE IS WHAT REDUCED MOTION GETS, and it is the one state no
    // screenshot of a running hero ever shows. The sheet puts it outside every
    // preference query and the pre-burst frame inside `no-preference`, so a
    // reader who asked for less motion gets exactly these transforms and the
    // loop never starts. The fault it guards against is a still that is not a
    // composition: every frame stacked at the code (which is what the pre-burst
    // frame looks like when the split is wired the wrong way round), or one arm
    // empty.
    const { cards } = BUILT[bp];
    const lit = cards
      .map((c) => ({ c, q: placeAt(c, restPhase(c), bp) }))
      .filter(({ q }) => opacityAt(q.out) > 0.02);
    expect(lit.length, `${bp}: nothing is lit at rest`).toBeGreaterThanOrEqual(
      6,
    );
    const atCode = lit.filter(({ q }) => Math.abs(q.x) < 0.06).length;
    expect(
      atCode,
      `${bp}: ${atCode} of ${lit.length} frames are stacked on the code at rest`,
    ).toBeLessThanOrEqual(2);
    // Both arms, and a spread of distances rather than one ring.
    expect(lit.some(({ q }) => q.x < -0.3)).toBe(true);
    expect(lit.some(({ q }) => q.x > 0.3)).toBe(true);
    expect(lit.some(({ q }) => Math.abs(q.x) > 0.75)).toBe(true);
  });
});

describe("nothing in the composition is dealt", () => {
  it("places every frame from a table, never from a hash", () => {
    // The board's whole point, kept: an earlier round gave each frame four
    // seeded values and the picture never resolved into a shape. A frame's
    // values have to come out of a short cycle, which is exactly what makes
    // them predictable to the eye. Checked structurally: the band runs one
    // file a side, so a whole arm carries ONE box shape per aspect and one
    // launch cadence, where a hash would give a distinct value per frame.
    for (const bp of BPS) {
      const arm = BUILT[bp].cards.filter((c) => c.dir === 1);
      expect(new Set(arm.map((c) => c.w)).size).toBeLessThanOrEqual(3);
      const gaps = new Set(
        arm.slice(1).map((c, i) => Math.round(c.at - arm[i].at)),
      );
      expect(gaps.size, `${bp}: the launch cadence is not one beat`).toBe(1);
    }
  });

  it("deals no photograph twice on screen, once Will's set lands", () => {
    // Not an assertion about the stand-ins, which are twelve and repeat by
    // construction: the two arms' windows are `pool` wide and offset by half
    // the set, so they are disjoint exactly when the set is at least twice the
    // pool. This is the number ASSETS row 2 is sized against, so it is read out
    // of the code rather than retyped into a doc.
    expect(Math.max(BUILT.base.pool, BUILT.lg.pool) * 2).toBeLessThanOrEqual(
      34,
    );
  });

  it("takes every frame from the media manifest", () => {
    // The manifest is the only source of a path, and an id that has
    // drifted out of it would throw at render on the home page's first paint.
    expect(STREAM_FRAMES.length).toBeGreaterThan(0);
    for (const id of STREAM_FRAMES) {
      expect(() => marketingImage(id), id).not.toThrow();
    }
    expect(new Set(STREAM_FRAMES).size, "a repeated id").toBe(
      STREAM_FRAMES.length,
    );
  });
});

describe("the code is scannable at the size it is drawn", () => {
  it.each(BPS)("%s keeps three pixels on every module", (bp) => {
    // ★ THE ONE FAILURE THIS COMPOSITION CANNOT SURVIVE. The code is the
    // eyebrow, the object and the argument at once, so a code drawn too small
    // to read off a screen empties the whole hero of its point, and nothing
    // about it looks wrong: it just does not scan. The phone's was drawn at 112
    // first and measured 2.73 px per module on the live page.
    //
    // The module count is computed from a URL of the demo's own SHAPE, written
    // out rather than imported: lib/demo.ts and lib/constants/site.ts both read
    // `env`, which throws in this runner with no NEXT_PUBLIC_* set (the note
    // home-sections.test.ts carries). A guest URL is the origin, "/e/" and a
    // 32-character token, so this is the real length, and a longer token that
    // pushed the code to the next QR version fails here rather than on a phone.
    const code = qrcode(0, "M");
    code.addData(`https://partyreel.com/e/${"0".repeat(32)}`);
    code.make();
    const span = code.getModuleCount() + QR_QUIET;
    const perModule = GEO[bp].qr / span;
    expect(
      perModule,
      `${bp}: ${perModule.toFixed(2)}px per module over ${span} modules`,
    ).toBeGreaterThanOrEqual(QR_FLOOR_PX_PER_MODULE);
  });
});

describe("what the composition costs", () => {
  it.each(BPS)("%s keeps the compositor's layer count honest", (bp) => {
    const { cards, facts } = BUILT[bp];
    // Every frame is a composited layer for its whole flight, so the pool is
    // the real cost and the busiest instant is what a phone feels. The ceiling
    // is a judgement, not a law: it is here so that doubling it is a decision
    // somebody makes rather than a beat somebody retunes.
    expect(cards.length).toBeLessThanOrEqual(20);
    expect(facts.onScreen).toBeLessThanOrEqual(14);
    expect(facts.onScreen).toBeGreaterThan(4);
  });
});
