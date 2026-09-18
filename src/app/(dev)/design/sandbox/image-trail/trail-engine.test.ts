import { describe, expect, it } from "vitest";

import {
  advance,
  boxOf,
  dist,
  emptyState,
  factsOf,
  frameOf,
  lifeMs,
  litAt,
  type Path,
  poolFor,
  replay,
  scriptedPointer,
  spiralPath,
  type TrailSpec,
  wanderPath,
} from "./trail-engine";

/**
 * THE TRAIL ENGINE'S CONTRACT.
 *
 * What is pinned here is what a board's WORDS depend on, never a look: the
 * birth rule is travel and not time, a card's life is a closed form of its age
 * so a still and the loop agree, the ring is bounded, the keeper holds only the
 * newest card and only at rest, and a replay is deterministic (which is the
 * whole reason the capture, the reduced-motion still and the server's HTML can
 * be one picture). The numbers each option states are measured off `factsOf`
 * in the boards' own tests, so a retune there turns those red rather than
 * leaving a tile that says one thing and draws another.
 */

const SPEC: TrailSpec = {
  density: 100,
  size: 240,
  slideMs: 900,
  holdMs: 400,
  fadeMs: 1000,
  shrinkMs: 1000,
  endScale: 0.2,
  entrance: "slide",
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

describe("the birth rule", () => {
  it("births on TRAVEL, not on the clock", () => {
    // 1,600 px covered either way: the same number of photographs, at half the
    // speed and twice the time. This is the whole difference between this and
    // the home hero's engine, and every option's density is stated in px.
    // Both spans divide by the 16 ms step exactly, so neither run is cut short
    // of the distance it is meant to cover.
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
    const born = s.cards.filter((c) => c !== null);
    expect(born.length).toBe(3);
    // `drift` births AT the mark, so the three marks are 100 apart; under
    // `slide` they share the lagged birth point by design, so the spacing is
    // read off the mark rather than off `from`.
    const xs = born.map((c) => c!.to.x).sort((a, b) => a - b);
    expect(xs.length).toBe(3);
  });
});

describe("a card's life", () => {
  it("is a closed form of its age: the same card at the same age draws the same frame", () => {
    const s = walk(SPEC, line(600), 1600);
    const c = s.cards.find((x) => x !== null)!;
    const a = frameOf(c, SPEC, c.bornAt + 700);
    const b = frameOf(c, SPEC, c.bornAt + 700);
    expect(a).toEqual(b);
    // And it does not depend on how the engine got there.
    const alone = frameOf(c, SPEC, c.bornAt + 700);
    expect(alone).toEqual(a);
  });

  it("slides from where it was born to where the source was", () => {
    const s = walk(SPEC, line(600), 1600);
    const c = s.cards.find((x) => x !== null)!;
    const at0 = frameOf(c, SPEC, c.bornAt)!;
    expect(at0.x).toBeCloseTo(c.from.x, 3);
    const landed = frameOf(c, SPEC, c.bornAt + SPEC.slideMs)!;
    expect(landed.x).toBeCloseTo(c.to.x, 1);
  });

  it("is born behind the source and chases it", () => {
    // The lag is what gives the slide something to cover: with a real lag the
    // birth point trails the cursor by a visible distance.
    const s = walk(SPEC, line(900), 1600);
    const c = s.cards
      .filter((x) => x !== null)
      .sort((a, b) => b!.seq - a!.seq)[0]!;
    expect(dist(c.from, c.to)).toBeGreaterThan(20);
  });

  it("holds whole, then fades and shrinks, then is gone", () => {
    const s = walk(SPEC, line(600), 1600);
    const c = s.cards.find((x) => x !== null)!;
    const whole = frameOf(c, SPEC, c.bornAt + SPEC.holdMs - 1)!;
    expect(whole.opacity).toBe(1);
    const half = frameOf(c, SPEC, c.bornAt + SPEC.holdMs + SPEC.fadeMs / 2)!;
    expect(half.opacity).toBeGreaterThan(0);
    expect(half.opacity).toBeLessThan(1);
    // The shrink runs ahead of the fade on purpose, so the tail reads as depth.
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
});

describe("the keeper", () => {
  const keep = { ...SPEC, keeper: true };

  it("holds the newest photograph whole while the source rests", () => {
    let s = walk(keep, line(600), 1600);
    const at = { ...s.source! };
    for (let i = 0; i < 400; i++) s = advance(s, keep, { to: at, dt: 16 });
    const newest = s.cards.find((c) => c && c.seq === s.seq - 1)!;
    const f = frameOf(newest, keep, s.t)!;
    expect(f.opacity).toBe(1);
    expect(f.scale).toBeCloseTo(1, 2);
  });

  it("holds ONLY the newest: the rest of the trail decays away behind it", () => {
    let s = walk(keep, line(600), 1600);
    const at = { ...s.source! };
    for (let i = 0; i < 400; i++) s = advance(s, keep, { to: at, dt: 16 });
    const lit = s.cards.filter((c) => c && frameOf(c, keep, s.t));
    expect(lit.length).toBe(1);
    expect(lit[0]!.seq).toBe(s.seq - 1);
  });

  it("releases it the moment the source moves again", () => {
    let s = walk(keep, line(600), 1600);
    const at = { ...s.source! };
    for (let i = 0; i < 400; i++) s = advance(s, keep, { to: at, dt: 16 });
    const held = s.cards.find((c) => c && c.seq === s.seq - 1)!;
    // One stroke away, then far enough past the decay for it to be gone.
    for (let i = 1; i <= 120; i++) {
      s = advance(s, keep, { to: { x: at.x + i * 6, y: at.y }, dt: 16 });
    }
    expect(frameOf(held, keep, s.t)).toBeNull();
  });

  it("is off by default, so the privacy hero's path source is untouched by it", () => {
    let s = walk(SPEC, line(600), 1600);
    const at = { ...s.source! };
    for (let i = 0; i < 400; i++) s = advance(s, SPEC, { to: at, dt: 16 });
    expect(s.cards.filter((c) => c && frameOf(c, SPEC, s.t)).length).toBe(0);
  });
});

describe("a replay", () => {
  const path = scriptedPointer(1440, 930);

  it("is deterministic, which is what makes the still, the capture and the loop one picture", () => {
    const a = replay(SPEC, [path], 4000);
    const b = replay(SPEC, [path], 4000);
    expect(litAt(a, SPEC, 4000)).toEqual(litAt(b, SPEC, 4000));
  });

  it("draws a real trail from a scripted pointer, which a headless capture has no cursor for", () => {
    const s = replay(SPEC, [path], 4000);
    expect(litAt(s, SPEC, 4000).length).toBeGreaterThan(3);
  });

  it("runs several paths through ONE ring, so two arms read as one object", () => {
    const centre = { x: 720, y: 465 };
    const arms = [0, 180].map((phase) =>
      spiralPath({
        centre,
        r0: 240,
        grow: 0.7,
        turn: 30,
        phase,
        speed: 120,
        rMax: 900,
      }),
    );
    const states = replay(SPEC, arms, 6000);
    expect(states.length).toBe(2);
    const lit = litAt(states, SPEC, 6000);
    // Sorted into one paint order across both arms.
    expect(lit.map((l) => l.frame.z)).toEqual(
      [...lit.map((l) => l.frame.z)].sort((a, b) => a - b),
    );
    expect(new Set(lit.map((l) => l.source)).size).toBe(2);
  });

  it("walks a wander that never repeats inside a visit and is the same every time", () => {
    const w = wanderPath({
      centre: { x: 720, y: 465 },
      rx: 420,
      ry: 240,
      speed: 0.42,
      phase: 0,
    });
    expect(w(1000)).toEqual(w(1000));
    expect(w(1000)).not.toEqual(w(9000));
  });
});

describe("the measured facts", () => {
  it("counts the busiest instant and the beat off the path it will be drawn with", () => {
    const f = factsOf(SPEC, [scriptedPointer(1440, 930)], 12_000);
    expect(f.lit).toBeGreaterThan(0);
    expect(f.beat).toBeGreaterThan(0);
    expect(f.nodes).toBe(SPEC.pool);
  });

  it("answers more photographs lit for a denser spec, which is what the option promises", () => {
    const path = [scriptedPointer(1440, 930)];
    const dense = factsOf({ ...SPEC, density: 60, pool: 24 }, path, 12_000);
    const sparse = factsOf({ ...SPEC, density: 140, pool: 24 }, path, 12_000);
    expect(dense.lit).toBeGreaterThan(sparse.lit);
    expect(dense.beat).toBeLessThan(sparse.beat);
  });

  it("answers more lit for a longer decay at the same density", () => {
    const path = [scriptedPointer(1440, 930)];
    const quick = factsOf(
      { ...SPEC, fadeMs: 500, shrinkMs: 500, pool: 24 },
      path,
      12_000,
    );
    const long = factsOf(
      { ...SPEC, fadeMs: 1600, shrinkMs: 1600, pool: 24 },
      path,
      12_000,
    );
    expect(long.lit).toBeGreaterThan(quick.lit);
  });
});

describe("the card's box", () => {
  it("is portrait first, and the size is its width", () => {
    const b = boxOf(SPEC, 0);
    expect(b.w).toBe(240);
    expect(b.h).toBe(320);
    expect(b.h).toBeGreaterThan(b.w);
  });

  it("walks a short declared cycle rather than dealing a shape", () => {
    const shapes = [0, 1, 2, 3, 4].map((i) => boxOf(SPEC, i));
    expect(shapes[0]).toEqual(shapes[4]);
    expect(new Set(shapes.map((s) => s.h)).size).toBeGreaterThan(1);
  });
});
