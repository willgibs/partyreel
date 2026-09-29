import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BUILT as HOME_BUILT,
  GEO as HOME_GEO,
  STREAM_FRAMES,
} from "@/components/marketing/sections/home/hero-stream";

import {
  ageOf,
  arrivalPhoto,
  type Bp,
  frameAt,
  GAP,
  HALF_MIN,
  HOME,
  homeSpeed,
  launchOf,
  LOCK,
  nextArrival,
  type Solved,
  STAGE,
  STREAM,
  STREAM_LG_MIN,
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
 *     it is drawn at, so a rewrite of the copy cannot invalidate it.
 *  3  NO TWO FRAMES SIT ON THE SAME PIXEL. Photographs in a file may overlap;
 *     two on the same spot read as a rendering fault, and the first draft had
 *     exactly that.
 *  4  THE ALBUM'S EDGE IS ONE NUMBER. The stage draws the album from `STAGE` and
 *     the stream aims at `STAGE`, and the two sheets and the hero's floor change
 *     composition where the engine does, so the photographs dissolve on the
 *     edge that is really there.
 *  5  A FRAME ONLY EVER SCALES DOWN from the box it was sized to, which is what
 *     keeps it off a re-raster every frame.
 *  6  THE PUSH (album-motion r1, `fall=push` and his note): both sides, one
 *     photograph handed over at a time on one steady beat, each at the album's
 *     edge as it dissolves, each the still the album will take, and a rest
 *     state that is a whole frame.
 *
 * ★ RESHAPED WITH THE PICK. Every check used to walk the board's four
 * variations; the board retired with its pick, so each walks the one
 * composition now, and the two that only a board needed ("ships one of the ones
 * the board draws", "makes each one a different answer") went with it.
 *
 * Function, never look: nothing here pins an alpha, a size, a colour or a
 * photograph. Retune a lane, the scale pair or the tuck and every test still
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
  bp: Bp,
  half: number,
  visit: (
    lit: { x: number; y: number; hw: number; hh: number; key: string }[],
  ) => void,
) {
  const f = STREAM[bp];
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

/**
 * THE LOOP'S OWN QUESTION, asked the loop's way: step the clock and note every
 * card whose age crosses its handover between two ticks, as `album-stream.tsx`
 * does (a 16 ms tick, the clock wrapping as it does).
 */
function handovers(f: Solved, from: number, to: number, dt = 16) {
  const out: { n: number; t: number; side: 0 | 1 }[] = [];
  const ages = f.cards.map((c) => ageOf(c, from, f.cycle));
  const launch = f.cards.map((c) => launchOf(f, c, from));
  for (let t = from + dt; t <= to; t += dt) {
    f.cards.forEach((c, i) => {
      const age = ageOf(c, t, f.cycle);
      const was = ages[i];
      ages[i] = age;
      const n = launchOf(f, c, t);
      if (n !== launch[i]) launch[i] = n;
      else if (was < c.handover && age >= c.handover)
        out.push({ n, t, side: c.side });
    });
  }
  return out;
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

  it("paces the album on a whole number of the home hero's half beats", () => {
    for (const bp of BPS) {
      const beat = STREAM[bp].facts.beat;
      const ratio = beat / HOME[bp].beat;
      // Half, one, one and a half: a composition may let more of the
      // reference's beats pass, never invent a clock of its own.
      expect(
        Math.abs(ratio - Math.round(ratio * 2) / 2),
        `${bp} beat ${beat} is not a multiple of the home hero's ${HOME[bp].beat}`,
      ).toBeLessThan(0.02);
    }
  });

  it("never travels faster than the home hero's own stream does", () => {
    for (const bp of BPS) {
      const f = STREAM[bp];
      expect(f.facts.launch).toBe(Math.round(HOME[bp].launch));
      // The home curve's speed at the end of its own flight is the ceiling:
      // this composition walks THAT curve, and its paths are shorter than the
      // home hero's whole travel, so it can never reach the end of it.
      const ceiling = homeSpeed(HOME[bp].flight, bp);
      expect(
        f.facts.fastest,
        `${bp} is faster than the reference`,
      ).toBeLessThanOrEqual(ceiling);
    }
  });
});

describe("no photograph is ever under a word", () => {
  it("keeps every frame clear of the lockup's column until it is past its foot", () => {
    // The `base` composition lives in the strip UNDER the words, so its
    // keep-out is vertical and is checked below; this is the side band's.
    const bp: Bp = "lg";
    walk(bp, HALF_MIN[bp], (lit) => {
      for (const c of lit) {
        // Below the lockup's foot the album's own column is fair game: that
        // is where the frame is entering the album.
        if (c.y + c.hh >= -GAP[bp]) continue;
        expect(
          Math.abs(c.x) - c.hw,
          `${c.key} is inside the lockup's column at ${STREAM_LG_MIN}`,
        ).toBeGreaterThanOrEqual(LOCK);
      }
    });
  });

  it("keeps a phone's frames inside the strip under the lockup", () => {
    const bp: Bp = "base";
    walk(bp, HALF_MIN[bp], (lit) => {
      for (const c of lit) {
        expect(
          c.y - c.hh,
          `${c.key} reaches above the words' foot at a phone`,
        ).toBeGreaterThanOrEqual(-GAP[bp]);
      }
    });
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
    for (const bp of BPS) {
      walk(bp, HALF_MIN[bp], (lit) => {
        for (let a = 0; a < lit.length; a++) {
          if (!open(lit[a])) continue;
          for (let b = a + 1; b < lit.length; b++) {
            if (!open(lit[b])) continue;
            const rx = Math.abs(lit[a].x - lit[b].x) / (lit[a].hw + lit[b].hw);
            const ry = Math.abs(lit[a].y - lit[b].y) / (lit[a].hh + lit[b].hh);
            expect(
              Math.max(rx, ry),
              `${bp}: ${lit[a].key}@${lit[a].x.toFixed(0)},${lit[a].y.toFixed(0)} and ${lit[b].key}@${lit[b].x.toFixed(0)},${lit[b].y.toFixed(0)} are on the same spot`,
            ).toBeGreaterThan(0.5);
          }
        }
      });
    }
  });

  it("gives every lane a whole number of passes per cycle", () => {
    // A cycle that ends mid-pass puts the last frame of a lane one beat behind
    // that lane's first instead of a full pass, and the two land together once
    // every cycle. The count is derived; this is the property it buys.
    for (const bp of BPS) {
      const f = STREAM[bp];
      const seen = new Map<string, number>();
      for (const c of f.cards) {
        // A card's lane is where its path starts; two cards share a lane when
        // they start at the same place.
        const p = f.place(c, 0);
        const key = `${p.a.toFixed(1)}:${p.b.toFixed(3)}`;
        seen.set(key, (seen.get(key) ?? 0) + 1);
      }
      const counts = [...seen.values()];
      expect(
        new Set(counts).size,
        `${bp}: lanes carry uneven numbers of frames (${counts.join(", ")})`,
      ).toBe(1);
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

  it("ends every path inside the album rather than short of it", () => {
    for (const bp of BPS) {
      const f = STREAM[bp];
      for (const c of f.cards) {
        const end = f.place(c, f.flight);
        expect(
          end.y,
          `${bp}: ${c.key} stops short of the album's edge`,
        ).toBeGreaterThan(-STAGE[bp].h * 0.2);
      }
    }
  });

  it("swaps the stream, the stage and the hero's floor where the engine does", () => {
    // A media query cannot read a module, so the swap is written in two sheets
    // and a class string. Until album-motion's wiring both sheets said 1024
    // while the engine was solved and tested for 1280, and the side band drew
    // frames over the words' column in between: this is the check that was
    // owed. Tailwind's `xl` is 80rem, 1280.
    const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
    const swaps = (css: string) =>
      [...css.matchAll(/@media \(min-width: (\d+)px\)/g)].map((m) =>
        Number(m[1]),
      );
    expect(
      swaps(read("src/components/shared/album-stream/album-stream.css")),
    ).toEqual([STREAM_LG_MIN]);
    expect(
      swaps(
        read("src/components/marketing/sections/features/album/live-album.css"),
      ),
    ).toEqual([STREAM_LG_MIN]);
    const hero = read(
      "src/components/marketing/sections/features/album/arrivals-hero.tsx",
    );
    expect(STREAM_LG_MIN).toBe(80 * 16);
    expect(hero).toContain(` pb-[${STAGE.base.floor}px] `);
    expect(hero).toContain(` xl:pb-[${STAGE.lg.floor}px]`);
  });
});

describe("the rest state and the loop are one picture", () => {
  it("is pure: the same age gives the same frame, twice", () => {
    const f = STREAM.lg;
    const c = f.cards[2];
    const a = frameAt(f, c, 1500, f.box[2].fit, f.box[2]);
    const b = frameAt(f, c, 1500, f.box[2].fit, f.box[2]);
    expect(a).toEqual(b);
  });

  it("writes the horizontal as a calc on the hero's own half-width", () => {
    // A pixel count here would be right at one viewport and wrong at every
    // other, and the sheet could not paint the rest state without a script.
    const f = STREAM.lg;
    const t = frameAt(f, f.cards[0], 900, f.box[0].fit, f.box[0]).transform;
    expect(t).toMatch(/var\(--als-half\)/);
    expect(t).toMatch(/^translate3d\(calc\(/);
  });

  it("never asks a frame to scale ABOVE the box it was sized to", () => {
    for (const bp of BPS) {
      const f = STREAM[bp];
      for (let i = 0; i < f.cards.length; i++) {
        for (let k = 0; k <= 60; k++) {
          const age = (k / 60) * f.flight;
          if (f.opacity(f.cards[i], age) <= 0.004) continue;
          expect(
            f.place(f.cards[i], age).s,
            `${bp}: ${f.cards[i].key} scales past its own raster`,
          ).toBeLessThanOrEqual(f.box[i].fit);
        }
      }
    }
  });

  it("rests on a whole frame: none being born or dissolving, both sides lit alike", () => {
    // The motion rule's still (docs/systems/marketing-content.md): what the
    // server paints and what a reader who asked for less motion keeps. A frame
    // caught half dissolved would stand there as a ghost for as long as they
    // stay.
    for (const bp of BPS) {
      const f = STREAM[bp];
      const whole = [0, 0];
      for (const c of f.cards) {
        const o = f.opacity(c, c.at);
        expect(
          o <= 0.004 || o >= 0.999,
          `${bp}: ${c.key} rests at opacity ${o.toFixed(3)}`,
        ).toBe(true);
        if (o >= 0.999) whole[c.side]++;
      }
      // As balanced as the count allows: an odd count leans by one.
      expect(
        Math.abs(whole[0] - whole[1]),
        `${bp}: the rest state is lopsided`,
      ).toBeLessThanOrEqual((whole[0] + whole[1]) % 2);
      expect(
        Math.min(whole[0], whole[1]),
        `${bp}: a side stands bare`,
      ).toBeGreaterThan(0);
    }
  });
});

describe("the push", () => {
  it("hands the album one photograph at a time, on one steady beat", () => {
    for (const bp of BPS) {
      const f = STREAM[bp];
      const got = handovers(f, 0, f.cycle * 2);
      // The first is the one the engine says comes next, and each after it
      // is the next number, exactly one beat later (to the tick).
      expect(got[0].n).toBe(nextArrival(f, 0));
      got.forEach((h, k) => {
        expect(h.n, `${bp}: arrival ${k} is out of order`).toBe(got[0].n + k);
        expect(
          Math.abs(h.t - (f.firstHandover + h.n * f.beat)),
          `${bp}: arrival ${h.n} is off its beat`,
        ).toBeLessThanOrEqual(16);
      });
      // Two cycles hand over two cycles' worth: every slot, twice.
      expect(got.length).toBeGreaterThanOrEqual(f.slots * 2 - 1);
    }
  });

  it("takes the two sides in turn, so the hero stays balanced", () => {
    for (const bp of BPS) {
      const f = STREAM[bp];
      const got = handovers(f, 0, f.cycle);
      for (let k = 1; k < got.length; k++)
        expect(
          got[k].side,
          `${bp}: two arrivals in a row from one side`,
        ).not.toBe(got[k - 1].side);
      // And the right arm is the left one mirrored: the same paths, reflected.
      const at = (side: 0 | 1) =>
        f.cards.filter((c) => c.side === side).map((c) => f.place(c, 2000));
      const key = (p: { a: number; b: number; y: number }) =>
        `${Math.abs(p.a).toFixed(1)}:${Math.abs(p.b).toFixed(3)}:${p.y.toFixed(1)}`;
      expect(new Set(at(1).map(key))).toEqual(new Set(at(0).map(key)));
      for (const p of at(0)) expect(xAt(p, HOME[bp].half)).toBeGreaterThan(0);
      for (const p of at(1)) expect(xAt(p, HOME[bp].half)).toBeLessThan(0);
    }
  });

  it("hands each one over at the album's edge, as it dissolves", () => {
    // "Both streams are simply drawn in & dissolved, then their item is pushed
    // in as an upload": the row opens as the frame goes, where it goes.
    for (const bp of BPS) {
      const f = STREAM[bp];
      f.cards.forEach((c, i) => {
        const o = f.opacity(c, c.handover);
        expect(o, `${bp}: ${c.key} is not going yet`).toBeLessThan(0.7);
        expect(
          o,
          `${bp}: ${c.key} is gone before its row opens`,
        ).toBeGreaterThan(0.3);
        const p = f.place(c, c.handover);
        const reach = (f.box[i].h * p.s) / f.box[i].fit;
        expect(
          Math.abs(p.y),
          `${bp}: ${c.key} hands over away from the album's edge`,
        ).toBeLessThan(reach);
        // Drawn in: smaller where it is taken than where it was born.
        expect(p.s).toBeLessThan(f.place(c, 0).s);
      });
    }
  });

  it("dresses each arrival as the still the album will take", () => {
    for (const bp of BPS) {
      const f = STREAM[bp];
      const first = nextArrival(f, 0);
      // With no album, the twelve walked backwards from the last, so twelve in
      // a row are twelve different stills and the first is the album's tail.
      const run = Array.from({ length: STREAM_FRAMES.length }, (_, k) =>
        arrivalPhoto(f, first + k, 0),
      );
      expect(run[0]).toBe(STREAM_FRAMES.length - 1);
      expect(new Set(run).size).toBe(STREAM_FRAMES.length);
      // With one, the album's own answer, counted from what it takes next.
      const later = f.firstHandover + (first + 3) * f.beat + 1;
      const asked: number[] = [];
      const photo = arrivalPhoto(f, first + 6, later, (ahead) => {
        asked.push(ahead);
        return 7;
      });
      expect(photo).toBe(7);
      expect(asked).toEqual([2]);
    }
  });

  it("keeps each card's arrival number for its whole flight", () => {
    // A card's number changes only when it leaves again, so the photograph it
    // was dressed in at launch is the one it hands over.
    for (const bp of BPS) {
      const f = STREAM[bp];
      for (const c of f.cards) {
        const launch = f.cycle - c.at; // the elapsed at which it leaves again
        const n = launchOf(f, c, launch + 1);
        for (let age = 1; age < f.flight; age += 97)
          expect(launchOf(f, c, launch + age)).toBe(n);
        expect(launchOf(f, c, launch - 1)).toBe(n - f.slots);
      }
    }
  });
});

describe("the numbers", () => {
  it("states its own measured numbers, in plain words", () => {
    for (const bp of BPS) {
      const f = STREAM[bp];
      expect(f.caption).toContain(String(f.facts.lit));
      expect(f.caption).toContain(String(f.facts.beat));
      expect(f.caption).toContain(String(f.facts.launch));
      // No em-dash anywhere in copy a reviewer reads (the house policy).
      expect(f.caption).not.toContain("—");
    }
  });
});
