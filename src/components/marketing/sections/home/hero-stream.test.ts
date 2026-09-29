import { describe, expect, it } from "vitest";

import qrcode from "qrcode-generator";

import { marketingImage } from "@/lib/constants/marketing-media";

import {
  blockBox,
  BUILT,
  colOf,
  FRAME_SIZES,
  GEO,
  type Geometry,
  GEOMETRIES,
  HEADER,
  OBJECT,
  OBJECT_CODE_PATH,
  OBJECT_EVENT,
  OBJECT_PRINTS,
  opacityAt,
  placeAt,
  QR_QUIET,
  reachOf,
  restPhase,
  SOLID_OUT,
  STREAM_FRAMES,
  TABLET_STEP,
} from "./hero-stream";

/**
 * WHAT THE HOME HERO'S STREAM HAS TO BE TRUE OF (the hero's wiring round,
 * 2026-09-17; the board's `streams.test.ts`, cut to the one composition that
 * shipped, and the link card and the tablet's geometry since hero-card r2).
 *
 * The composition is a table of numbers, and a table of numbers has no compile
 * error: a beat shortened by 60 ms doubles the frames on screen, a card grown
 * by 20 px stands a photograph on the headline, a geometry's reference
 * changed puts the band under the type at 1024 and nowhere else, and all three
 * look like a design opinion rather than a fault. These are the conditions the
 * composition is DRAWN FROM, so they are checked here rather than hoped for.
 *
 * Not pinned here: anything about the look. A test that fixed the travel curve
 * or the curl would be a test that owns the design, and the design is Will's (a
 * contract guards function, never a look).
 */

/** The clear line is designed at each geometry's reference and re-checked at
 *  its narrowest viewport, where the same band crowds the block hardest. */
const WORST = (g: Geometry) => GEO[g].halfMin;

/** Where the object's centre stands at an axis: the middle of its air or its
 *  floor, the lower of the two (the sheet's `.hhs-object`, as numbers). */
const centreAt = (g: Geometry, axis: number) =>
  Math.max((HEADER + axis + BUILT[g].low) / 2, axis - BUILT[g].lift);

describe("the band leaves the type its measured lane", () => {
  it.each(GEOMETRIES)(
    "%s keeps every frame off the block, at its worst width",
    (g) => {
      const { cards, box } = BUILT[g];
      const block = blockBox(g, WORST(g));
      // ★ EVERY LIT FRAME, EVERY SAMPLE, OUTSIDE THE BLOCK'S BOX, and with air to
      // spare. `build` solves the anchor at the design reference, which is what
      // keeps the composition the one Will picked; this is what stops a viewport
      // the reference never saw from quietly eating the gap. If it ever fails the
      // answer is another geometry, never a thinner margin.
      const AIR = 24;
      let closest = Infinity;
      for (let i = 0; i < cards.length; i++) {
        for (let k = 0; k <= 480; k++) {
          const p = k / 480;
          if (p > box[i].exit) continue;
          const q = placeAt(cards[i], p, g);
          if (opacityAt(q.out) <= 0.02) continue;
          // The frame's span and the block's, both as fractions of the hero's
          // half-width; the vertical is px, because the band runs on one axis and
          // the block is anchored in px below it.
          if (Math.abs(q.x) - q.hw / WORST(g) >= block.col) continue;
          closest = Math.min(closest, block.top - q.hh);
        }
      }
      expect(
        closest,
        `${g}: the band comes within ${closest.toFixed(1)}px of the block`,
      ).toBeGreaterThanOrEqual(AIR);
    },
  );

  it.each(GEOMETRIES)(
    "%s solves its clear line off the band, not off a guess",
    (g) => {
      const geo = GEO[g];
      const { cards, low } = BUILT[g];
      const measured = reachOf(cards, g, colOf(geo), geo.halfRef);
      // The anchor IS the measurement plus the designed air; nothing else may
      // set it. (The bare code's plate was the other term until the link card
      // replaced it: the card stands in the air over the block, never in it.)
      expect(low).toBe(Math.round(measured + geo.margin + geo.breath));
      expect(
        measured,
        `${g}: nothing reaches over the block's column`,
      ).toBeGreaterThan(0);
    },
  );

  it.each(GEOMETRIES)("%s fits the whole composition above the fold", (g) => {
    const { axisMin, below, minH } = BUILT[g];
    // The hero is exactly one screen: the site header is sticky, so the hero's
    // -mt puts its top edge at the viewport's top and its first 64px are the
    // header's band. At `minH` the clamp's two ends meet exactly: the card at
    // its floor, the block ending at the fold.
    expect(axisMin).toBeGreaterThanOrEqual(HEADER);
    expect(minH).toBe(axisMin + below);
    // And it has to be a height a real window has: the shortest laptop the hero
    // is verified on is 720 and the shortest phone 667, and a desk window as
    // narrow as a tablet is as short as the laptop. Each fits the hero whole,
    // the air under the actions included. ★ THE 720 LAPTOP GAVE UP ITS FOOT'S
    // AIR from demo-doors (2026-09-27, the eyebrow's 28px) until the axis's
    // floor was solved for the link card rather than for the bare code, which
    // stood higher over the axis than the card's midpoint stands.
    const shortest = g === "base" ? 667 : 720;
    expect(
      minH,
      `${g}: the hero cannot fit its block in the shortest window it is verified on`,
    ).toBeLessThanOrEqual(shortest);
  });
});

describe("the link card stands clear of the header, the band and the type", () => {
  it.each(GEOMETRIES)(
    "%s keeps the card's painted top under the header at the axis's floor",
    (g) => {
      // ★ THE AXIS'S FLOOR IS THE CARD'S (demo-doors found the frame's top
      // under the header on desk windows under about 773 tall, because the
      // floor was solved for the bare 144 px code). At the floor the card's
      // highest painted point, a pinned face over a turned print, is `airTop`
      // under the header's band.
      const { axisMin, object } = BUILT[g];
      const top = centreAt(g, axisMin) - object.box / 2 - object.over;
      expect(top - HEADER).toBeGreaterThanOrEqual(GEO[g].airTop - 0.5);
    },
  );

  it.each(GEOMETRIES)(
    "%s keeps the axis inside the card and the block under it, at every height",
    (g) => {
      const { axisMin, below, object, low } = BUILT[g];
      const { inset } = GEO[g];
      // Every axis the clamp can give, from the floor to a very tall screen.
      for (let axis = axisMin; axis <= 1400; axis += 4) {
        const c = centreAt(g, axis);
        const top = c - object.box / 2;
        const foot = c + object.box / 2;
        // The band is born behind the card: the axis crosses its box, at least
        // `inset` above its foot, so a frame is whole before it shows.
        expect(top, `${g} at axis ${axis}`).toBeLessThan(axis);
        expect(foot - axis, `${g} at axis ${axis}`).toBeGreaterThanOrEqual(
          inset - 1e-6,
        );
        // And the type never meets the card: the block's first line starts
        // under the card's foot with at least the air the card keeps under
        // the header (the two are equal at the floor, where the air is least).
        expect(
          axis + low - foot,
          `${g} at axis ${axis}`,
        ).toBeGreaterThanOrEqual(GEO[g].airTop);
      }
      expect(below).toBeGreaterThan(low);
    },
  );

  it.each(GEOMETRIES)(
    "%s hides a frame behind the card until it is solid",
    (g) => {
      // A frame born on the axis must not show beside the card before it is
      // whole: the axis runs `inset` above the card's foot, which has to be
      // more than half the tallest frame at the distance it turns solid. The
      // scale is read off the band's own travel, at the first sample at or
      // past that distance.
      const { cards } = BUILT[g];
      const tallest = Math.max(...cards.map((c) => c.h));
      let s = 0;
      for (let k = 0; k <= 480 && s === 0; k++) {
        const q = placeAt(cards[0], k / 480, g);
        if (q.out >= SOLID_OUT) s = q.s;
      }
      expect(opacityAt(SOLID_OUT)).toBe(1);
      expect(s).toBeGreaterThan(0);
      expect(GEO[g].inset).toBeGreaterThan((tallest / 2) * s);
    },
  );

  it("draws the tablet's card as the composition of the two drawn", () => {
    // Every length of the tablet's card is TABLET_STEP of the way from the
    // phone's drawing to the desk's, which is the one thing the sheet's
    // `--hhs-k` can draw: a hand-tuned tablet number would never render.
    const walk = (b: unknown, t: unknown, l: unknown, at: string) => {
      if (typeof b === "number") {
        expect(t, at).toBeCloseTo(b + TABLET_STEP * ((l as number) - b), 9);
        return;
      }
      for (const k of Object.keys(b as object))
        walk(
          (b as Record<string, unknown>)[k],
          (t as Record<string, unknown>)[k],
          (l as Record<string, unknown>)[k],
          `${at}.${k}`,
        );
    };
    walk(OBJECT.base, OBJECT.tablet, OBJECT.lg, "OBJECT");
  });

  it("turns each print the same at every size", () => {
    // The card writes each print's turn once (a rotation is not a length the
    // sheet composes), so a drawing that turned a print differently at one
    // size would be silently drawn with the desk's turn.
    OBJECT.lg.fan.forEach((f, i) => {
      expect(OBJECT.base.fan[i].r).toBe(f.r);
    });
    expect(OBJECT.base.fan.length).toBe(OBJECT_PRINTS.length);
    expect(OBJECT.lg.fan.length).toBe(OBJECT_PRINTS.length);
  });

  it("takes every print's photograph from the media manifest", () => {
    for (const p of OBJECT_PRINTS) {
      expect(() => marketingImage(p.photo), p.photo).not.toThrow();
    }
    expect(OBJECT_EVENT.guests).toBeGreaterThan(OBJECT_PRINTS.length);
  });
});

describe("no frame is ever rasterized above its own pixels", () => {
  it.each(GEOMETRIES)(
    "%s sizes every DOM box to its largest visible moment",
    (g) => {
      const { cards, box } = BUILT[g];
      cards.forEach((c, i) => {
        // The DOM box is `w * fit` and the transform scale is `s / fit`, so the
        // on-screen size is `w * s`. `fit` is the largest `s` the frame ever
        // reaches while a person can see it: if any visible sample beats it,
        // that photograph is being upscaled on the screen.
        for (let k = 0; k <= 240; k++) {
          const p = k / 240;
          if (p > box[i].exit) continue;
          const q = placeAt(c, p, g);
          if (opacityAt(q.out) <= 0.02) continue;
          expect(
            q.s,
            `${g} frame ${i} exceeds its box at ${p}`,
          ).toBeLessThanOrEqual(box[i].fit + 1e-6);
        }
        expect(box[i].w).toBeGreaterThan(0);
        expect(Number.isFinite(box[i].h)).toBe(true);
      });
    },
  );

  it("asks for the size it renders, in each geometry", () => {
    // The `sizes` attribute is derived from the largest box each geometry
    // actually paints, so a retuned card retunes the request. A vw value here
    // would over-fetch on a wide screen, where the band grows but the frames
    // do not.
    expect(FRAME_SIZES).toBe(
      `(min-width: 1024px) ${BUILT.lg.facts.largest}px, (min-width: 768px) ${BUILT.tablet.facts.largest}px, ${BUILT.base.facts.largest}px`,
    );
    expect(FRAME_SIZES).not.toMatch(/vw/);
  });
});

describe("one set of nodes serves all three geometries", () => {
  it("pairs every frame across the geometries", () => {
    // `cinema-hero.tsx` renders ONE list of nodes and lets the sheet choose
    // between a `-base`, a `-tablet` and a `-lg` custom property on each: that
    // only works while frame `i` is the same photograph in the same launch
    // order in all three. A retuned beat that changed a pool would break the
    // pairing silently, and every frame would wear another frame's box.
    for (const g of GEOMETRIES) {
      expect(BUILT[g].cards.length, g).toBe(BUILT.lg.cards.length);
      expect(BUILT[g].pool, g).toBe(BUILT.lg.pool);
      BUILT[g].cards.forEach((c, i) => {
        expect(c.key).toBe(BUILT.lg.cards[i].key);
        expect(c.photo).toBe(BUILT.lg.cards[i].photo);
        expect(c.dir).toBe(BUILT.lg.cards[i].dir);
      });
    }
  });
});

describe("the rest state is a composed still", () => {
  it.each(GEOMETRIES)(
    "%s stands deployed, never collapsed behind the card",
    (g) => {
      // ★ THE REST STATE IS WHAT REDUCED MOTION GETS, and it is the one state no
      // screenshot of a running hero ever shows. The sheet puts it outside every
      // preference query and the pre-burst frame inside `no-preference`, so a
      // reader who asked for less motion gets exactly these transforms and the
      // loop never starts. The fault it guards against is a still that is not a
      // composition: every frame stacked behind the card (which is what the
      // pre-burst frame looks like when the split is wired the wrong way round),
      // or one arm empty.
      const { cards } = BUILT[g];
      const lit = cards
        .map((c) => ({ c, q: placeAt(c, restPhase(c), g) }))
        .filter(({ q }) => opacityAt(q.out) > 0.02);
      expect(lit.length, `${g}: nothing is lit at rest`).toBeGreaterThanOrEqual(
        6,
      );
      const atCentre = lit.filter(({ q }) => Math.abs(q.x) < 0.06).length;
      expect(
        atCentre,
        `${g}: ${atCentre} of ${lit.length} frames are stacked behind the card at rest`,
      ).toBeLessThanOrEqual(2);
      // Both arms, and a spread of distances rather than one ring.
      expect(lit.some(({ q }) => q.x < -0.3)).toBe(true);
      expect(lit.some(({ q }) => q.x > 0.3)).toBe(true);
      expect(lit.some(({ q }) => Math.abs(q.x) > 0.75)).toBe(true);
    },
  );
});

describe("nothing in the composition is dealt", () => {
  it("places every frame from a table, never from a hash", () => {
    // The board's whole point, kept: an earlier round gave each frame four
    // seeded values and the picture never resolved into a shape. A frame's
    // values have to come out of a short cycle, which is exactly what makes
    // them predictable to the eye. Checked structurally: the band runs one
    // file a side, so a whole arm carries ONE box shape per aspect and one
    // launch cadence, where a hash would give a distinct value per frame.
    for (const g of GEOMETRIES) {
      const arm = BUILT[g].cards.filter((c) => c.dir === 1);
      expect(new Set(arm.map((c) => c.w)).size).toBeLessThanOrEqual(3);
      const gaps = new Set(
        arm.slice(1).map((c, i) => Math.round(c.at - arm[i].at)),
      );
      expect(gaps.size, `${g}: the launch cadence is not one beat`).toBe(1);
    }
  });

  it("deals no photograph twice on screen, once Will's set lands", () => {
    // Not an assertion about the stand-ins, which are twelve and repeat by
    // construction: the two arms' windows are `pool` wide and offset by half
    // the set, so they are disjoint exactly when the set is at least twice the
    // pool. This is the number ASSETS row 2 is sized against, so it is read out
    // of the code rather than retyped into a doc.
    expect(
      Math.max(...GEOMETRIES.map((g) => BUILT[g].pool)) * 2,
    ).toBeLessThanOrEqual(34);
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

describe("the card's code draws as a code", () => {
  it.each(GEOMETRIES)("%s keeps a whole pixel on every module", (g) => {
    // ★ RESHAPED WITH THE OBJECT (hero-card r2). This was "three pixels on
    // every module", because the bare code WAS the hero's object and had to
    // scan (the phone's was drawn at 112 first and measured 2.73 px per module
    // on the live page, a code nobody could scan). The card's code no longer
    // has to scan: a desk's press opens the demo modal, whose code does, and a
    // phone cannot scan itself. What still fails silently is a code that stops
    // drawing as one: a longer value adds modules, and under a pixel each the
    // crisp edges merge them into a grey square. The value is written out in
    // the demo's own shape, since lib/constants/site.ts reads `env`, which
    // throws in this runner.
    const code = qrcode(0, "M");
    code.addData(`https://partyreel.com${OBJECT_CODE_PATH}`);
    code.make();
    const span = code.getModuleCount() + QR_QUIET;
    const perModule = OBJECT[g].code / span;
    expect(
      perModule,
      `${g}: ${perModule.toFixed(2)}px per module over ${span} modules`,
    ).toBeGreaterThanOrEqual(1);
  });
});

describe("what the composition costs", () => {
  it.each(GEOMETRIES)("%s keeps the compositor's layer count honest", (g) => {
    const { cards, facts } = BUILT[g];
    // Every frame is a composited layer for its whole flight, so the pool is
    // the real cost and the busiest instant is what a phone feels. The ceiling
    // is a judgement, not a law: it is here so that doubling it is a decision
    // somebody makes rather than a beat somebody retunes.
    expect(cards.length).toBeLessThanOrEqual(20);
    expect(facts.onScreen).toBeLessThanOrEqual(14);
    expect(facts.onScreen).toBeGreaterThan(4);
  });
});
