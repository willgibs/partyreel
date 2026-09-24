import { describe, expect, it } from "vitest";

import {
  BUILT as HOME_BUILT,
  GEO as HOME_GEO,
} from "@/components/marketing/sections/home/hero-stream";

import {
  ageOf,
  type Bp,
  frameAt,
  GAP,
  HALF_MIN,
  HOME,
  homeSpeed,
  LOCK,
  SHIPPED,
  STAGE,
  STREAM_LG_MIN,
  STREAMS,
  VARIANTS,
  xAt,
} from "./stream-engine";

/**
 * THE STREAM'S ARITHMETIC, pinned. The engine is pure by design (no React, no
 * DOM, nothing measured at runtime) precisely so the promises below can be
 * CHECKED rather than eyeballed on a page: the loop writes what these functions
 * return, the server writes the same expressions into custom properties, and a
 * drift between the two is a hydration warning nobody sees until it ships.
 *
 * What it guards, in Will's terms:
 *
 *  1  THE PACE IS THE HOME HERO'S, BY IMPORT. His round-three note killed the
 *     calm caps ("now it feels too boring... home hero currently feels perfect")
 *     and the answer was to grade against the shipped stream rather than pick a
 *     number. Retune the home hero and this composition re-paces with it; type a
 *     speed in here instead and these fail.
 *  2  NO PHOTOGRAPH IS EVER UNDER A WORD, asked at the NARROWEST viewport each
 *     composition serves, where the band crowds the lockup hardest. The keep-out
 *     is the lockup's whole COLUMN, which is wider than its ink at every width
 *     it is drawn at, so a rewrite of the copy cannot invalidate it (bible 10).
 *  3  NO TWO FRAMES SIT ON THE SAME PIXEL. Photographs in a file may overlap;
 *     two on the same spot read as a rendering fault, and the first draft had
 *     exactly that.
 *  4  THE ALBUM'S EDGE IS ONE NUMBER. The stage draws the album from `STAGE` and
 *     the stream aims at `STAGE`, so the photographs land on the edge that is
 *     really there.
 *  5  A FRAME ONLY EVER SCALES DOWN from the box it was sized to, which is what
 *     keeps it off a re-raster every frame.
 *
 * Function, never look: nothing here pins an alpha, a size, a colour or a
 * photograph. Retune a lane, a scale pair or the tuck and every test still
 * passes as long as the promises hold.
 */

const BPS: Bp[] = ["base", "lg"];

/** A card's rotated half-extents: every check here is axis-aligned, so the roll
 *  is folded into the box rather than ignored. */
const rad = (d: number) => (d * Math.PI) / 180;
function extents(w: number, h: number, roll: number) {
  const c = Math.abs(Math.cos(rad(roll)));
  const s = Math.abs(Math.sin(rad(roll)));
  return { hw: (w * c + h * s) / 2, hh: (w * s + h * c) / 2 };
}

/** Every lit frame over one whole cycle, at a given half-width. */
function walk(
  variant: (typeof VARIANTS)[number],
  bp: Bp,
  half: number,
  visit: (
    lit: { x: number; y: number; hw: number; hh: number; key: string }[],
  ) => void,
) {
  const f = STREAMS[variant][bp];
  const step = Math.max(20, Math.round(f.cycle / 400));
  for (let t = 0; t < f.cycle; t += step) {
    const lit = [];
    for (let i = 0; i < f.cards.length; i++) {
      const c = f.cards[i];
      const age = ageOf(c, t, f.cycle);
      if (age > f.flight || f.opacity(c, age) <= 0.05) continue;
      const p = f.place(c, age);
      const k = p.s / f.box[i].fit;
      lit.push({
        x: xAt(p, half),
        y: p.y,
        key: c.key,
        ...extents(f.box[i].w * k, f.box[i].h * k, c.roll),
      });
    }
    visit(lit);
  }
}

describe("the reference is the home hero, measured not typed", () => {
  it("reads the beat and the launch speed off the shipped stream", () => {
    for (const bp of BPS) {
      expect(HOME[bp].beat).toBe(
        Math.round(HOME_BUILT[bp].cycle / HOME_BUILT[bp].pool),
      );
      expect(HOME[bp].half).toBe(HOME_GEO[bp].halfRef);
      expect(HOME[bp].launch).toBeGreaterThan(0);
    }
  });

  it("paces every variant on a whole number of the home hero's beats", () => {
    for (const v of VARIANTS) {
      for (const bp of BPS) {
        const beat = STREAMS[v][bp].facts.beat;
        const ratio = beat / HOME[bp].beat;
        // Half, one, two: a composition may let more of the reference's beats
        // pass, never invent a clock of its own.
        expect(
          Math.abs(ratio - Math.round(ratio * 2) / 2),
          `${v}/${bp} beat ${beat} is not a multiple of the home hero's ${HOME[bp].beat}`,
        ).toBeLessThan(0.02);
      }
    }
  });

  it("never travels faster than the home hero's own stream does", () => {
    for (const v of VARIANTS) {
      for (const bp of BPS) {
        const f = STREAMS[v][bp];
        expect(f.facts.launch).toBe(Math.round(HOME[bp].launch));
        // The home curve's speed at the end of its own flight is the ceiling:
        // this composition walks THAT curve, and its paths are shorter than the
        // home hero's whole travel, so it can never reach the end of it.
        const ceiling = homeSpeed(HOME[bp].flight, bp);
        expect(
          f.facts.fastest,
          `${v}/${bp} is faster than the reference`,
        ).toBeLessThanOrEqual(ceiling);
      }
    }
  });
});

describe("no photograph is ever under a word", () => {
  it("keeps every frame clear of the lockup's column until it is past its foot", () => {
    for (const v of VARIANTS) {
      // The `base` composition lives in the strip UNDER the words, so its
      // keep-out is vertical and is checked below; this is the side band's.
      const bp: Bp = "lg";
      walk(v, bp, HALF_MIN[bp], (lit) => {
        for (const c of lit) {
          // Below the lockup's foot the album's own column is fair game: that
          // is where the frame is entering the album.
          if (c.y + c.hh >= -GAP[bp]) continue;
          expect(
            Math.abs(c.x) - c.hw,
            `${v}: ${c.key} is inside the lockup's column at ${STREAM_LG_MIN}`,
          ).toBeGreaterThanOrEqual(LOCK);
        }
      });
    }
  });

  it("keeps a phone's frames inside the strip under the lockup", () => {
    for (const v of VARIANTS) {
      const bp: Bp = "base";
      walk(v, bp, HALF_MIN[bp], (lit) => {
        for (const c of lit) {
          expect(
            c.y - c.hh,
            `${v}: ${c.key} reaches above the words' foot at a phone`,
          ).toBeGreaterThanOrEqual(-GAP[bp]);
        }
      });
    }
  });
});

describe("no two frames sit on the same pixel", () => {
  it("keeps every lit pair in the open air at least half a frame apart", () => {
    // ★ IN THE OPEN AIR, and only there. Two photographs crowding at the
    // album's edge is the composition working: they are being taken in, and a
    // pile at the rim is what that looks like. Two sitting on the same pixel
    // out in the empty room beside the words reads as a rendering fault, and
    // the first draft of the lane table had exactly that.
    const open = (c: { y: number; hh: number }) => c.y + c.hh < 0;
    for (const v of VARIANTS) {
      for (const bp of BPS) {
        walk(v, bp, HALF_MIN[bp], (lit) => {
          for (let a = 0; a < lit.length; a++) {
            if (!open(lit[a])) continue;
            for (let b = a + 1; b < lit.length; b++) {
              if (!open(lit[b])) continue;
              const rx =
                Math.abs(lit[a].x - lit[b].x) / (lit[a].hw + lit[b].hw);
              const ry =
                Math.abs(lit[a].y - lit[b].y) / (lit[a].hh + lit[b].hh);
              expect(
                Math.max(rx, ry),
                `${v}/${bp}: ${lit[a].key}@${lit[a].x.toFixed(0)},${lit[a].y.toFixed(0)} (${lit[a].hw.toFixed(0)}x${lit[a].hh.toFixed(0)}) and ${lit[b].key}@${lit[b].x.toFixed(0)},${lit[b].y.toFixed(0)} (${lit[b].hw.toFixed(0)}x${lit[b].hh.toFixed(0)}) are on the same spot`,
              ).toBeGreaterThan(0.5);
            }
          }
        });
      }
    }
  });

  it("gives every lane a whole number of passes per cycle", () => {
    // A cycle that ends mid-pass puts the last frame of a lane one beat behind
    // that lane's first instead of a full pass, and the two land together once
    // every cycle. The count is derived; this is the property it buys.
    for (const v of VARIANTS) {
      for (const bp of BPS) {
        const f = STREAMS[v][bp];
        const seen = new Map<string, number[]>();
        for (const c of f.cards) {
          // A card's lane is where its path starts; two cards share a lane when
          // they start at the same place.
          const p = f.place(c, 0);
          const key = `${p.a.toFixed(1)}:${p.b.toFixed(3)}`;
          seen.set(key, [...(seen.get(key) ?? []), c.at]);
        }
        const counts = [...seen.values()].map((v) => v.length);
        expect(
          new Set(counts).size,
          `${v}/${bp}: lanes carry uneven numbers of frames (${counts.join(", ")})`,
        ).toBe(1);
      }
    }
  });
});

describe("the album's edge is one number", () => {
  it("is the stage's own height and floor, not a second table", () => {
    for (const bp of BPS) {
      expect(STAGE[bp].h).toBeGreaterThan(0);
      expect(STAGE[bp].floor).toBeGreaterThan(0);
      // The dissolve is part of the visible album, never more than it.
      expect(STAGE[bp].fade).toBeLessThan(STAGE[bp].h);
    }
  });

  it("lands every frame inside the album rather than short of it", () => {
    for (const v of VARIANTS) {
      for (const bp of BPS) {
        const f = STREAMS[v][bp];
        for (const c of f.cards) {
          const end = f.place(c, f.flight);
          expect(
            end.y,
            `${v}/${bp}: ${c.key} stops short of the album's edge`,
          ).toBeGreaterThan(-STAGE[bp].h * 0.2);
        }
      }
    }
  });
});

describe("the rest state and the loop are one picture", () => {
  it("is pure: the same age gives the same frame, twice", () => {
    for (const v of VARIANTS) {
      const f = STREAMS[v].lg;
      const c = f.cards[2];
      const a = frameAt(f, c, 1500, f.box[2].fit, f.box[2]);
      const b = frameAt(f, c, 1500, f.box[2].fit, f.box[2]);
      expect(a).toEqual(b);
    }
  });

  it("writes the horizontal as a calc on the hero's own half-width", () => {
    // A pixel count here would be right at one viewport and wrong at every
    // other, and the sheet could not paint the rest state without a script.
    const f = STREAMS[SHIPPED].lg;
    const t = frameAt(f, f.cards[0], 900, f.box[0].fit, f.box[0]).transform;
    expect(t).toMatch(/var\(--als-half\)/);
    expect(t).toMatch(/^translate3d\(calc\(/);
  });

  it("never asks a frame to scale ABOVE the box it was sized to", () => {
    for (const v of VARIANTS) {
      for (const bp of BPS) {
        const f = STREAMS[v][bp];
        for (let i = 0; i < f.cards.length; i++) {
          for (let k = 0; k <= 60; k++) {
            const age = (k / 60) * f.flight;
            if (f.opacity(f.cards[i], age) <= 0.004) continue;
            expect(
              f.place(f.cards[i], age).s,
              `${v}/${bp}: ${f.cards[i].key} scales past its own raster`,
            ).toBeLessThanOrEqual(f.box[i].fit);
          }
        }
      }
    }
  });
});

describe("the variations", () => {
  it("ships one of the ones the board draws", () => {
    expect(VARIANTS).toContain(SHIPPED);
  });

  it("gives each one a caption stating its own measured numbers", () => {
    for (const v of VARIANTS) {
      for (const bp of BPS) {
        const f = STREAMS[v][bp];
        expect(f.caption).toContain(String(f.facts.lit));
        expect(f.caption).toContain(String(f.facts.beat));
        expect(f.caption).toContain(String(f.facts.launch));
        // No em-dash anywhere in copy a reviewer reads (the house policy).
        expect(f.caption).not.toContain("—");
      }
    }
  });

  it("makes each one a different answer, not a different number", () => {
    // Two options that land on the same composition is a finding, not a
    // catalog (docs/PROGRAM.md: never force a board's options apart, and never
    // ship two that agree).
    const seen = new Set<string>();
    for (const v of VARIANTS) {
      const f = STREAMS[v].lg;
      const sig = f.cards
        .slice(0, 4)
        .map((c) => {
          const p = f.place(c, 2000);
          return `${p.a.toFixed(0)}:${p.b.toFixed(2)}:${p.y.toFixed(0)}:${p.s.toFixed(2)}`;
        })
        .join("|");
      expect(seen.has(sig), `${v} draws the same thing as another`).toBe(false);
      seen.add(sig);
    }
  });
});
