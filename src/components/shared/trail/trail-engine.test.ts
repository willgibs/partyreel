// @contract-for: src/components/shared/trail/trail-engine.ts
// @contract-for: src/components/shared/trail/trail-frames.ts

import { describe, expect, it } from "vitest";

import { isMarketingImageId } from "@/lib/constants/marketing-media";

import {
  advance,
  atRest,
  boxOf,
  dist,
  emptyState,
  factsOf,
  frameOf,
  KEEP_AFTER,
  lifeMs,
  litAt,
  type Path,
  PHONE_BELOW,
  pickPhase,
  poolFor,
  POOL_CEILING,
  replay,
  screenOf,
  SHY,
  shyness,
  shyWindow,
  stillAt,
  trailSpec,
  trailWalk,
  type TrailSpec,
  wanderPath,
  wanderSpeed,
} from "./trail-engine";
import { TRAIL_FRAMES, trailFrame } from "./trail-frames";

/**
 * THE TRAIL ENGINE'S CONTRACT.
 *
 * The engine is pure by design (no React, no DOM, nothing measured) precisely so
 * the properties below can be CHECKED rather than eyeballed on a page: the birth
 * rule is travel and not time, a card's life is a closed form of its age so a
 * still and the loop can never disagree, the ring is bounded, the keeper holds
 * only the newest card and only at rest, the walk travels at the pace it was
 * asked for, and a replay is deterministic (which is the whole reason the
 * resting composition, the reduced-motion still and the loop's first frame are
 * one picture).
 *
 * Function, never look: nothing here pins a duration, a curve weight, an alpha,
 * a density or a size. Retune every number in `RULED`, swap the photographs,
 * widen the card, slow the walk, and every test still passes; break the birth
 * rule, the ring, the keeper, the shy fade, the rest state or the derivations
 * and they do not.
 */

const SPEC: TrailSpec = {
  density: 100,
  size: 240,
  slideMs: 900,
  holdMs: 400,
  fadeMs: 1000,
  shrinkMs: 1000,
  endScale: 0.2,
  entrance: "flick",
  lag: 0.1,
  pool: 14,
  keeper: false,
};

/** A straight walk to the right at a known speed, which makes the birth rule
 *  arithmetic rather than a guess. */
const line =
  (pxPerSecond: number): Path =>
  (t) => ({ x: (t / 1000) * pxPerSecond, y: 300 });

/** Walk a path into the engine one 16 ms step at a time. */
function walk(spec: TrailSpec, path: Path, upto: number) {
  let s = emptyState(spec);
  for (let t = 0; t <= upto; t += 16) {
    s = advance(s, spec, { to: path(t), dt: t === 0 ? 0 : 16 });
  }
  return s;
}

/** Hold the source where it is for `ms`, which is what a hand at rest does. */
function rest(s: ReturnType<typeof walk>, spec: TrailSpec, ms: number) {
  const at = { ...s.source! };
  for (let i = 0; i < Math.ceil(ms / 16); i++) {
    s = advance(s, spec, { to: at, dt: 16 });
  }
  return s;
}

describe("the birth rule", () => {
  it("births on TRAVEL, not on the clock", () => {
    // 1,600 px covered either way: the same number of photographs, at half the
    // speed and twice the time. This is the whole difference between this and
    // the home hero's engine, and the ruled density is stated in px.
    const fast = walk(SPEC, line(1000), 1600);
    const slow = walk(SPEC, line(500), 3200);
    expect(fast.seq).toBe(slow.seq);
    expect(fast.seq).toBe(16);
  });

  it("births nothing from the first sample, however far from the origin", () => {
    const s = advance(emptyState(SPEC), SPEC, {
      to: { x: 4000, y: 4000 },
      dt: 16,
    });
    expect(s.seq).toBe(0);
    expect(s.source).toEqual({ x: 4000, y: 4000 });
  });

  it("caps a teleport instead of drawing a wall of cards across it", () => {
    let s = advance(emptyState(SPEC), SPEC, { to: { x: 0, y: 0 }, dt: 16 });
    s = advance(s, SPEC, { to: { x: 6000, y: 0 }, dt: 16 });
    // 60 births would be arithmetically correct and visually a disaster.
    expect(s.seq).toBeLessThanOrEqual(4);
    // And the mark moved to where the source arrived, so the next stroke
    // measures from here.
    expect(s.lastBirth.x).toBe(6000);
  });

  it("spaces several births in one frame along the segment", () => {
    let s = advance(emptyState(SPEC), SPEC, { to: { x: 0, y: 0 }, dt: 16 });
    s = advance(s, SPEC, { to: { x: 300, y: 0 }, dt: 16 });
    expect(s.cards.filter((c) => c !== null).length).toBe(3);
  });
});

describe("a card's life", () => {
  it("is a closed form of its age: the same card at the same age draws the same frame", () => {
    const s = walk(SPEC, line(600), 1600);
    const c = s.cards.find((x) => x !== null)!;
    expect(frameOf(c, SPEC, c.bornAt + 700)).toEqual(
      frameOf(c, SPEC, c.bornAt + 700),
    );
  });

  it("slides from where it was born to where the source was", () => {
    const s = walk(SPEC, line(600), 1600);
    const c = s.cards.find((x) => x !== null)!;
    expect(frameOf(c, SPEC, c.bornAt)!.x).toBeCloseTo(c.from.x, 3);
    expect(frameOf(c, SPEC, c.bornAt + SPEC.slideMs)!.x).toBeCloseTo(c.to.x, 1);
  });

  it("is born BEHIND the source and chases it, which is half the ruling", () => {
    // Will, `entrance=flick`: "Keeping the image trail behind the cursor also
    // allows better cursor visibility/tracking than keeping the image directly
    // beneath it." With no lag there is no chase to watch.
    const s = walk(SPEC, line(900), 1600);
    const c = s.cards
      .filter((x) => x !== null)
      .sort((a, b) => b!.seq - a!.seq)[0]!;
    expect(dist(c.from, c.to)).toBeGreaterThan(20);
  });

  it("turns the way it was thrown, and not at all on a vertical stroke", () => {
    // The other half of the ruling: "Following the way it was thrown rather
    // than the cursor". A sideways stroke and its mirror turn opposite ways.
    const across = walk(SPEC, line(600), 1600);
    const back = walk(
      SPEC,
      (t) => ({ x: 2000 - (t / 1000) * 600, y: 300 }),
      1600,
    );
    const roll = (s: ReturnType<typeof walk>) => {
      const c = s.cards.find((x) => x !== null && x.slot === 0)!;
      return frameOf(c, SPEC, c.bornAt)!.rot;
    };
    expect(roll(across) - roll(back)).toBeGreaterThan(10);

    const down = walk(SPEC, (t) => ({ x: 400, y: (t / 1000) * 600 }), 1600);
    const c = down.cards.find((x) => x !== null && x.slot === 0)!;
    // Straight down is square: the flick's turn is the sideways component.
    expect(frameOf(c, SPEC, c.bornAt)!.rot).toBeCloseTo(
      frameOf({ ...c, heading: Math.PI / 2 }, SPEC, c.bornAt)!.rot,
      6,
    );
  });

  it("holds whole, then fades and shrinks, then is gone", () => {
    const s = walk(SPEC, line(600), 1600);
    const c = s.cards.find((x) => x !== null)!;
    expect(frameOf(c, SPEC, c.bornAt + SPEC.holdMs - 1)!.opacity).toBe(1);
    const half = frameOf(c, SPEC, c.bornAt + SPEC.holdMs + SPEC.fadeMs / 2)!;
    expect(half.opacity).toBeGreaterThan(0);
    expect(half.opacity).toBeLessThan(1);
    // The shrink runs ahead of the fade on purpose, so the tail reads as depth
    // rather than as a dimmer switch.
    expect(half.scale).toBeLessThan(0.55);
    expect(frameOf(c, SPEC, c.bornAt + lifeMs(SPEC) + 1)).toBeNull();
  });

  it("paints newest over oldest with no sorting anywhere", () => {
    const s = walk(SPEC, line(600), 2400);
    const cards = s.cards.filter((x) => x !== null);
    for (const a of cards) {
      for (const b of cards) {
        if (a!.seq <= b!.seq) continue;
        const fa = frameOf(a!, SPEC, s.t);
        const fb = frameOf(b!, SPEC, s.t);
        if (fa && fb) expect(fa.z).toBeGreaterThan(fb.z);
      }
    }
  });
});

describe("the ring", () => {
  it("never grows past the pool, however long the source runs", () => {
    const s = walk(SPEC, line(2400), 30_000);
    expect(s.cards.length).toBe(SPEC.pool);
    expect(s.seq).toBeGreaterThan(SPEC.pool * 3);
  });

  it("is sized so a card is never overwritten while it is still lit", () => {
    const speed = 1800;
    const spec = { ...SPEC, pool: poolFor(SPEC, speed) };
    const s = walk(spec, line(speed), 20_000);
    const alive = s.cards.filter((c) => c && frameOf(c, spec, s.t));
    expect(alive.length).toBeLessThanOrEqual(spec.pool);
    // Every lit card is one of the most recent `pool` births: nothing was
    // recycled out from under a photograph a reader could still see.
    for (const c of alive)
      expect(s.seq - c!.seq).toBeLessThanOrEqual(spec.pool);
  });

  it("stops at the ceiling rather than letting arithmetic size a wall", () => {
    // Every node is a real next/image; past the ceiling the fastest strokes
    // recycle a card that was already at its faintest.
    expect(poolFor(SPEC, 100_000)).toBe(POOL_CEILING);
  });
});

describe("the keeper", () => {
  const keep = { ...SPEC, keeper: true };

  it("holds the newest photograph whole while the source rests", () => {
    const s = rest(walk(keep, line(600), 1600), keep, 6400);
    const newest = s.cards.find((c) => c && c.seq === s.seq - 1)!;
    const f = frameOf(newest, keep, s.t)!;
    expect(f.opacity).toBe(1);
    expect(f.scale).toBeCloseTo(1, 2);
  });

  it("holds ONLY the newest: the rest of the trail decays away behind it", () => {
    const s = rest(walk(keep, line(600), 1600), keep, 6400);
    const lit = s.cards.filter((c) => c && frameOf(c, keep, s.t));
    expect(lit.length).toBe(1);
    expect(lit[0]!.seq).toBe(s.seq - 1);
  });

  it("does not take hold during a pause in the middle of a stroke", () => {
    const s = rest(walk(keep, line(600), 1600), keep, KEEP_AFTER / 2);
    expect(atRest(s, keep)).toBe(false);
  });

  it("releases it the moment the source moves again", () => {
    let s = rest(walk(keep, line(600), 1600), keep, 6400);
    const held = s.cards.find((c) => c && c.seq === s.seq - 1)!;
    const at = { ...s.source! };
    for (let i = 1; i <= 200; i++) {
      s = advance(s, keep, { to: { x: at.x + i * 6, y: at.y }, dt: 16 });
    }
    expect(frameOf(held, keep, s.t)).toBeNull();
  });

  it("is off by default, so a path source is untouched by it", () => {
    const s = rest(walk(SPEC, line(600), 1600), SPEC, 6400);
    expect(s.cards.filter((c) => c && frameOf(c, SPEC, s.t)).length).toBe(0);
  });
});

describe("the rest state, which is what lets the loop stop", () => {
  const keep = { ...SPEC, keeper: true };

  it("is reached once the hand has stopped and the trail behind it has gone", () => {
    const moving = walk(keep, line(600), 1600);
    expect(atRest(moving, keep)).toBe(false);
    expect(atRest(rest(moving, keep, 200), keep)).toBe(false);
    expect(atRest(rest(moving, keep, lifeMs(keep) + 400), keep)).toBe(true);
  });

  it("is never reached with the keeper off, because something is always going", () => {
    const s = rest(walk(SPEC, line(600), 1600), SPEC, 6400);
    expect(atRest(s, SPEC)).toBe(false);
  });

  it("writes nothing new once reached: the held card's frame stops changing", () => {
    const settled = rest(walk(keep, line(600), 1600), keep, lifeMs(keep) + 400);
    const held = settled.cards.find((c) => c && c.seq === settled.seq - 1)!;
    const later = rest(settled, keep, 2000);
    const heldLater = later.cards.find((c) => c && c.seq === later.seq - 1)!;
    expect(frameOf(heldLater, keep, later.t)).toEqual(
      frameOf(held, keep, settled.t),
    );
  });
});

describe("the shy fade: the words stay the loudest thing on the screen", () => {
  const spec: TrailSpec = {
    ...SPEC,
    shy: { cx: 500, cy: 400, hx: 200, hy: 100, cover: 0.34, floor: 0.2 },
  };
  const card = boxOf(spec, 0);

  it("costs a photograph nothing where it is clear of the words", () => {
    expect(shyness(spec, 50, 50, card.w, card.h)).toBe(1);
  });

  it("is measured on the OVERLAP, so a card grazing a corner barely dims", () => {
    // The bug it replaced was a rule written on the card's CENTRE: a photograph
    // whose centre sits above the block still has its bottom third on the
    // eyebrow, and that card broke the board's first capture at full strength.
    const graze = shyness(spec, 320, 260, card.w, card.h);
    const over = shyness(spec, 500, 400, card.w, card.h);
    expect(graze).toBeGreaterThan(over);
    expect(graze).toBeLessThan(1);
    expect(over).toBeCloseTo(spec.shy!.floor, 5);
  });

  it("never reaches zero, so the trail reads as passing BEHIND rather than as switched off", () => {
    for (let x = 0; x <= 1000; x += 25) {
      for (let y = 0; y <= 800; y += 25) {
        const v = shyness(spec, x, y, card.w, card.h);
        expect(v).toBeGreaterThanOrEqual(spec.shy!.floor - 1e-9);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("is absent when no words were handed in", () => {
    expect(shyness(SPEC, 500, 400, card.w, card.h)).toBe(1);
  });

  it("dims the frame the loop draws, not only the arithmetic", () => {
    const shyWalk = walk(spec, () => ({ x: 500, y: 400 }), 0);
    const s = walk(spec, line(600), 1600);
    const c = s.cards.find((x) => x !== null)!;
    const away = frameOf(c, spec, c.bornAt)!;
    const onWords = frameOf(
      { ...c, from: { x: 500, y: 400 }, to: { x: 500, y: 400 } },
      spec,
      c.bornAt,
    )!;
    expect(onWords.opacity).toBeLessThan(away.opacity);
    expect(shyWalk.seq).toBe(0);
  });
});

describe("the walk, which is the source that is not a cursor", () => {
  const box = { w: 1200, h: 700 };

  it("travels at the pace it was asked for, whatever the box's shape", () => {
    // ★ The derivation is the contract, not the constant: `wanderSpeed` solves
    // the walk's own parameter for a pace in px a second, so "at the same pace"
    // (Will, `phone=walks`) is a number rather than a hope.
    for (const [rx, ry, pace] of [
      [480, 266, 500],
      [150, 228, 210],
      [900, 120, 300],
    ]) {
      const p = wanderPath({
        centre: { x: 0, y: 0 },
        rx,
        ry,
        speed: wanderSpeed(rx, ry, pace),
        phase: 0,
      });
      let travelled = 0;
      for (let t = 16; t <= 240_000; t += 16)
        travelled += dist(p(t - 16), p(t));
      expect(travelled / 240).toBeGreaterThan(pace * 0.98);
      expect(travelled / 240).toBeLessThan(pace * 1.02);
    }
  });

  it("never traces the same figure twice inside a visit", () => {
    // Will's one open note on `walks`: "Different path than current". The
    // figure it replaced was a pair of sines that closed on itself.
    const p = trailWalk(box);
    for (let t = 4000; t < 90_000; t += 4000) {
      expect(dist(p(0), p(t))).toBeGreaterThan(8);
    }
  });

  it("is the same curve every time it is computed, which the still depends on", () => {
    expect(trailWalk(box)(7000)).toEqual(trailWalk(box)(7000));
  });

  it("opens somewhere else on the figure when a visit asks it to", () => {
    expect(trailWalk(box, 0)(0)).not.toEqual(trailWalk(box, 120)(0));
  });

  it("wanders the whole box rather than staying in the middle of it", () => {
    // The board's first capture at 375 drew every photograph behind the words
    // because its stroke never left the middle of the column.
    const p = trailWalk(box);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let t = 0; t <= 120_000; t += 32) {
      const { x, y } = p(t);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    expect(minX).toBeLessThan(box.w * 0.2);
    expect(maxX).toBeGreaterThan(box.w * 0.8);
    expect(minY).toBeLessThan(box.h * 0.22);
    expect(maxY).toBeGreaterThan(box.h * 0.78);
    // And never so far past the edge that the trail spends its ring off screen.
    expect(minX).toBeGreaterThan(-1);
    expect(maxX).toBeLessThan(box.w + 1);
  });
});

describe("a replay", () => {
  const path = trailWalk({ w: 1440, h: 720 });

  it("is deterministic, which is what makes the still and the loop one picture", () => {
    expect(litAt(replay(SPEC, [path], 9000), SPEC, 9000)).toEqual(
      litAt(replay(SPEC, [path], 9000), SPEC, 9000),
    );
  });

  it("reaches a real composition rather than a trail still filling up", () => {
    expect(
      litAt(replay(SPEC, [path], 9000), SPEC, 9000).length,
    ).toBeGreaterThan(3);
  });

  it("runs several paths through one paint order, so two figures read as one object", () => {
    const two = [0, 300].map((phase) => trailWalk({ w: 1440, h: 720 }, phase));
    const states = replay(SPEC, two, 9000);
    expect(states.length).toBe(2);
    const lit = litAt(states, SPEC, 9000);
    expect(lit.map((l) => l.frame.z)).toEqual(
      [...lit.map((l) => l.frame.z)].sort((a, b) => a - b),
    );
    expect(new Set(lit.map((l) => l.source)).size).toBe(2);
  });
});

describe("the measured facts", () => {
  const path = [trailWalk({ w: 1440, h: 720 })];

  it("counts the busiest instant, the quietest and the beat off the path it will be drawn with", () => {
    const f = factsOf(SPEC, path, 20_000, { w: 1440, h: 720 });
    expect(f.lit).toBeGreaterThan(0);
    expect(f.beat).toBeGreaterThan(0);
    expect(f.nodes).toBe(SPEC.pool);
  });

  it("never leaves the screen bare: the quietest instant still has photographs on it", () => {
    // The number a busiest-instant count cannot see, and the one that caught a
    // path sweeping its whole ring off the edge.
    expect(
      factsOf(SPEC, path, 20_000, { w: 1440, h: 720 }).quiet,
    ).toBeGreaterThan(0);
  });

  it("answers more photographs lit for a denser spec, which is what density MEANS", () => {
    const dense = factsOf({ ...SPEC, density: 60, pool: 24 }, path, 20_000);
    const sparse = factsOf({ ...SPEC, density: 140, pool: 24 }, path, 20_000);
    expect(dense.lit).toBeGreaterThan(sparse.lit);
    expect(dense.beat).toBeLessThan(sparse.beat);
  });

  it("answers more lit for a longer decay at the same density", () => {
    const quick = factsOf(
      { ...SPEC, fadeMs: 500, shrinkMs: 500, pool: 24 },
      path,
      20_000,
    );
    const long = factsOf(
      { ...SPEC, fadeMs: 1600, shrinkMs: 1600, pool: 24 },
      path,
      20_000,
    );
    expect(long.lit).toBeGreaterThan(quick.lit);
  });
});

describe("the card's box", () => {
  it("is portrait first, and the size is its width", () => {
    const b = boxOf(SPEC, 0);
    expect(b.w).toBe(SPEC.size);
    expect(b.h).toBeGreaterThan(b.w);
  });

  it("walks a short declared cycle rather than dealing a shape", () => {
    const shapes = [0, 1, 2, 3, 4].map((i) => boxOf(SPEC, i));
    expect(shapes[0]).toEqual(shapes[4]);
    expect(new Set(shapes.map((s) => s.h)).size).toBeGreaterThan(1);
  });

  it("holds a slot's shape still while the ring recycles through it", () => {
    // A slot is a real DOM element with a pixel box; a card that changed its
    // shape on recycling would resize a live node mid-trail.
    expect(boxOf(SPEC, 3)).toEqual(boxOf(SPEC, 3 + ASPECT_CYCLE));
  });
});

/** How many slots the shape cycle takes to come round, read off the engine. */
const ASPECT_CYCLE = 4;

describe("the ruled spec, derived rather than typed", () => {
  const desktop = { w: 1440, h: 720 };
  const phone = { w: 375, h: 640 };

  it("scales the density with the card, so one ruling covers both screens", () => {
    const d = trailSpec(desktop);
    const p = trailSpec(phone);
    expect(p.size).toBeLessThan(d.size);
    // "Half a photograph apart" means the same thing at 375 as at 1440.
    expect(p.density / p.size).toBeCloseTo(d.density / d.size, 2);
  });

  it("keeps the same clocks at both, which is why one answer covered both", () => {
    const d = trailSpec(desktop);
    const p = trailSpec(phone);
    expect(lifeMs(p)).toBe(lifeMs(d));
    expect(p.slideMs).toBe(d.slideMs);
    expect(p.lag).toBe(d.lag);
    expect(p.entrance).toBe(d.entrance);
  });

  it("derives the ring from the life and the density rather than typing it", () => {
    const d = trailSpec(desktop);
    expect(d.pool).toBe(poolFor(d, screenOf(desktop).hand));
    expect(d.pool).toBeLessThanOrEqual(POOL_CEILING);
  });

  it("takes its phone numbers below the site's own phone breakpoint", () => {
    expect(screenOf({ w: PHONE_BELOW - 1, h: 600 })).toEqual(
      screenOf({ w: 320, h: 600 }),
    );
    expect(screenOf({ w: PHONE_BELOW, h: 600 })).toEqual(
      screenOf({ w: 1440, h: 900 }),
    );
  });

  it("leaves the words to the window rather than dimming each card by them", () => {
    // A card is one opacity, so dimming it by its overlap dims the half of it
    // standing on clean paper too, and overlapping cards composite past any
    // per-card floor. The window on the layer does both jobs exactly.
    expect(trailSpec(desktop).shy).toBeUndefined();
  });

  it("keeps the keeper on, so a hand that stops is never left an empty screen", () => {
    expect(trailSpec(desktop).keeper).toBe(true);
  });

  it("walks at its screen's own pace, and a phone's is slower than a laptop's", () => {
    const at = (box: { w: number; h: number }) => {
      const p = trailWalk(box);
      let travelled = 0;
      for (let t = 16; t <= 30_000; t += 16) travelled += dist(p(t - 16), p(t));
      return travelled / 30;
    };
    expect(at(phone)).toBeLessThan(at(desktop));
    expect(at(desktop)).toBeGreaterThan(0);
  });
});

describe("the shy window the words stand in", () => {
  const box = { w: 1440, h: 600 };
  const words = { cx: 720, cy: 300, hx: 224, hy: 190 };

  it("opens exactly on the words and feathers outward from them", () => {
    const w = shyWindow(box, words);
    expect(w.x1).toBe(words.cx - words.hx);
    expect(w.x2).toBe(words.cx + words.hx);
    expect(w.y1).toBe(words.cy - words.hy);
    expect(w.y2).toBe(words.cy + words.hy);
    // The soft edge runs OUTWARD: nothing inside the block is ever at full
    // strength, and nothing outside the feather is ever touched.
    expect(w.x0).toBeLessThan(w.x1);
    expect(w.x3).toBeGreaterThan(w.x2);
    expect(w.y0).toBeLessThan(w.y1);
    expect(w.y3).toBeGreaterThan(w.y2);
  });

  it("feathers over the card's own width, so a photograph dissolves rather than hits a wall", () => {
    const w = shyWindow(box, words);
    expect(w.x1 - w.x0).toBeGreaterThan(trailSpec(box).size * 0.25);
    expect(w.x1 - w.x0).toBe(w.y1 - w.y0);
  });

  it("carries the alpha whose UNION is the floor, not the floor itself", () => {
    // CSS composites mask layers with `add` (a + b - ab), so two gradients each
    // carrying the floor would leave nearly twice it over the words. This is
    // the one thing the sheet cannot work out for itself.
    const a = shyWindow(box, words).alpha;
    expect(a).toBeLessThan(SHY.floor);
    expect(a + a - a * a).toBeCloseTo(SHY.floor, 3);
  });

  it("is narrower than the box it is cut in, or there would be no trail to see", () => {
    const w = shyWindow(box, words);
    expect(w.x0).toBeGreaterThan(0);
    expect(w.x3).toBeLessThan(box.w);
  });
});

describe("the opening the composition is chosen from", () => {
  const box = { w: 1440, h: 600 };
  const words = { cx: 720, cy: 300, hx: 224, hy: 190 };
  const spec = trailSpec(box);

  /** How much lit photograph stands clear of the words at the resting moment,
   *  which is what makes the first frame a composition rather than a smudge. */
  const clear = (phase: number) => {
    const at = stillAt(spec);
    let score = 0;
    for (const { frame } of litAt(
      replay(spec, [trailWalk(box, phase)], at),
      spec,
      at,
    )) {
      if (frame.x < 0 || frame.x > box.w || frame.y < 0 || frame.y > box.h)
        continue;
      if (
        Math.abs(frame.x - words.cx) < words.hx &&
        Math.abs(frame.y - words.cy) < words.hy
      )
        continue;
      score += frame.opacity * frame.scale;
    }
    return score;
  };

  it("keeps the best of the openings it tried, never the first one it dealt", () => {
    const tries = [0.02, 0.51, 0.13, 0.77, 0.36];
    let i = 0;
    const picked = pickPhase(spec, box, words, () => tries[i++], tries.length);
    const scores = tries.map((t) => clear(t * 600));
    expect(clear(picked)).toBeCloseTo(Math.max(...scores), 6);
    expect(Math.max(...scores)).toBeGreaterThan(Math.min(...scores));
  });

  it("still opens somewhere different on the next visit", () => {
    // The floor under the composition is raised; the choreography is not fixed.
    const a = pickPhase(spec, box, words, mulberry(1));
    const b = pickPhase(spec, box, words, mulberry(2));
    expect(a).not.toBe(b);
  });

  it("answers a real opening even when there are no words to stand clear of", () => {
    expect(pickPhase(spec, box, undefined, mulberry(3))).toBeGreaterThanOrEqual(
      0,
    );
  });
});

/** A tiny seeded generator, so "a different visit" is a test rather than luck. */
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("the photographs", () => {
  it("names only ids the media manifest knows, never a path", () => {
    // bible 18: nothing under public/marketing/ is referenced except through an
    // entry in the manifest, so the generated set lands as a data change.
    for (const id of TRAIL_FRAMES) expect(isMarketingImageId(id)).toBe(true);
    expect(trailFrame(0).src).toBe(trailFrame(TRAIL_FRAMES.length).src);
  });

  it("holds enough distinct frames that a ring never shows one twice in a row", () => {
    expect(new Set(TRAIL_FRAMES).size).toBe(TRAIL_FRAMES.length);
    for (let i = 1; i < TRAIL_FRAMES.length; i++) {
      expect(TRAIL_FRAMES[i]).not.toBe(TRAIL_FRAMES[i - 1]);
    }
  });
});
