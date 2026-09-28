import {
  ageOf,
  ASPECTS,
  type Bp,
  type Card,
  type Field,
  HOME,
  homeSpeed,
  homeTravel,
  LOCK,
  ROLLS,
  smoothstep,
  type Solved,
  xAt,
} from "@/components/shared/album-stream/stream-engine";

/**
 * PUSH: THE FALL THAT OPENS ITS ROW, the fifth option (the marketing refresh,
 * 2026-09-28), solved the way `stream-engine.ts` solves the other four.
 *
 * ★ WHY IT EXISTS. The first four were argued against an arrival grammar the
 * album has since replaced: milestone 29 shipped album-columns r2's
 * `arrival=push` in both albums (the rows, `arrival.css`), where a new photograph
 * OPENS ITS ROW from its left edge, clipped and never scaled, its neighbours
 * gliding aside on the same beat, and only a glow fades. Nothing about the
 * photograph itself fades or grows. So this is the fall drawn FOR that grammar:
 * the photograph falls on the home hero's own curve, never changing size, goes
 * in behind the album's top edge right over the album's head, and the moment it
 * is half through, the album's first row opens for it (the stage's own rows,
 * `rows-hero.tsx`, doing exactly what a guest's album does).
 *
 * ★ ONE SIDE, THE HEAD'S. A newest-first album opens at its head, top left, so
 * every photograph falls on that side and lands over the head; a frame born on
 * the right would have to cross under the words to land there, or land where
 * nothing opens. The lanes are the engine's own band shares on the left (its
 * `LANES_LG` and `LANES_BASE`, module-private there, so restated here with the
 * numbers unchanged); only where they land moves, onto the album's head.
 *
 * ★ IT GOES IN FROM ABOVE, SO IT IS OVER THE ALBUM WHEN IT CROSSES. The
 * engine's own fall tucks in last (`bend`: both controls on the birth's
 * vertical, the horizontal as t³), so its outer lane meets the album's top
 * edge still well beside the album and slides in sideways, which is right for
 * a frame that only has to disappear and wrong for one that has to open the
 * head: here the crossing IS the arrival. So the path is the engine's fall with
 * its end turned down: the first control on the birth's vertical (it falls
 * beside the words first), the second on the landing's (it arrives falling
 * straight), then a straight drop through the edge.
 *
 * ★ LAB-ONLY BY CONSTRUCTION. The engine's path helpers are private to it, so
 * the small walker below measures a path the way `pathOf` does; picked, the
 * wiring writes `push` as a recipe INSIDE the engine (a `behind` exit, one
 * side, no scale, this entry) with an arrival callback on `AlbumStream`, and
 * this file goes with the board.
 */

type Path = Card["path"];
type Pt = { a: number; b: number; y: number };

/** Half the album's own column (`max-w-4xl`, 896) at `lg`: where the head is. */
const ALBUM_HALF = 448;

/**
 * THE LANES, born where the engine's are and landing over the head.
 *
 * `f` and `y` are the engine's (lg: a share of the band beside the lockup;
 * base: a share of the half-width, in the strip under the words), mirrored to
 * the head's side. `land` is new: a share of the album's half-width at lg (the
 * column is pinned there) or of the hero's at base (the album IS the column),
 * both measured from the centre line toward the head. The inner lane lands
 * nearer the middle, so the two never cross on the way in, and both land over
 * the head photograph at every shape the rows give it (portrait to landscape,
 * read off the stage at 1440 and 375).
 */
const LANES: Record<Bp, readonly { f: number; y: number; land: number }[]> = {
  lg: [
    { f: 0.33, y: -505, land: 0.62 },
    { f: 0.82, y: -300, land: 0.78 },
  ],
  // A phone's strip is narrow: landing where the engine's own base lanes do
  // (two files a frame apart, both over the head at two a row) keeps them
  // from touching on the way in, which converging on one point did.
  base: [
    { f: 0.68, y: -152, land: 0.66 },
    { f: 0.26, y: -126, land: 0.22 },
  ],
};

/**
 * THE RECIPE, one row per axis the other four vary on.
 *   beats   one and a half of the home hero's (bloom's clock): an arrival
 *           every 1875ms at a desk, which lets each push's glow (2s,
 *           `ARRIVAL_GLOW_MS`, all but out by 94 per cent of its run) go out
 *           as the next row opens, so one photograph is new at a time
 *   unit    glide's frame, so the size is not what differs
 *   bend    how far down the birth's vertical the first control sits: glide's
 *           0.9, so it falls beside the words and turns in late
 *   entry   px above the album's edge the turn is done and the drop begins,
 *           the frame's half-height and a little, so no part of it reaches
 *           the edge before it is over the album
 *   lead    how far above that point the second control sits, which is what
 *           makes it arrive falling straight rather than sliding
 *   sink    past the edge by the frame's half-height and a little, so it is
 *           wholly behind the album when it goes
 */
const RECIPE = {
  beats: { lg: 1.5, base: 1.5 } as Record<Bp, number>,
  unit: 104,
  bend: 0.9,
  entry: { lg: 64, base: 40 } as Record<Bp, number>,
  lead: { lg: 30, base: 20 } as Record<Bp, number>,
  sink: { lg: 72, base: 44 } as Record<Bp, number>,
} as const;

/**
 * THE PUSH'S FALL: a cubic from the birth to the entry point whose first
 * control is on the birth's vertical (it falls first) and whose second is on
 * the entry's (it arrives falling), then a straight drop through the edge.
 */
function fall(p: Pt, r: Pt, q: Pt, bp: Bp, n = 48): Pt[] {
  const c1 = { a: p.a, b: p.b, y: p.y + (r.y - p.y) * RECIPE.bend };
  const c2 = { a: r.a, b: r.b, y: r.y - RECIPE.lead[bp] };
  const curve = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    const mix = (k: keyof Pt) =>
      u * u * u * p[k] +
      3 * u * u * t * c1[k] +
      3 * u * t * t * c2[k] +
      t * t * t * r[k];
    return { a: mix("a"), b: mix("b"), y: mix("y") };
  });
  const drop = Array.from({ length: 8 }, (_, i) => {
    const t = (i + 1) / 8;
    return { a: r.a, b: r.b, y: r.y + (q.y - r.y) * t };
  });
  return [...curve, ...drop];
}

/** A polyline walked by distance at the design reference's half-width. */
function pathOf(points: Pt[], half: number): Path {
  const px = (p: Pt) => p.a + p.b * half;
  const acc = [0];
  for (let i = 1; i < points.length; i++)
    acc.push(
      acc[i - 1] +
        Math.hypot(
          px(points[i]) - px(points[i - 1]),
          points[i].y - points[i - 1].y,
        ),
    );
  const length = acc[acc.length - 1];
  return {
    length,
    at: (d: number) => {
      const dd = Math.min(Math.max(d, 0), length);
      let i = 1;
      while (i < acc.length - 1 && acc[i] < dd) i++;
      const seg = acc[i] - acc[i - 1] || 1;
      const t = (dd - acc[i - 1]) / seg;
      const lerp = (k: keyof Pt) =>
        points[i - 1][k] + (points[i][k] - points[i - 1][k]) * t;
      return {
        a: lerp("a"),
        b: lerp("b"),
        y: lerp("y"),
        u: length > 0 ? dd / length : 0,
      };
    },
  };
}

/** The ms the home hero's curve takes to cover `px`, at this breakpoint. */
function timeTo(px: number, bp: Bp): number {
  let ms = 0;
  while (homeTravel(ms, bp) < px && ms < 60000) ms += 25;
  return ms;
}

export type PushCard = Card & {
  /** The age the frame's centre crosses the album's top edge: the row opens. */
  handover: number;
};

export type PushField = Omit<Solved, "cards"> & {
  cards: PushCard[];
  /** Slots in the cycle: a launch's place in the arrival order needs it. */
  slots: number;
};

function build(bp: Bp): PushField {
  const half = HOME[bp].half;
  const beat = Math.round(HOME[bp].beat * RECIPE.beats[bp]);
  const unit = bp === "lg" ? RECIPE.unit : RECIPE.unit * 0.6;
  const sink = RECIPE.sink[bp];

  const lanes = LANES[bp]
    .map((lane) => {
      // Born on the head's side: the engine's `bornAt`, mirrored.
      const born =
        bp === "lg"
          ? { a: -(1 - lane.f) * LOCK, b: -lane.f }
          : { a: 0, b: -lane.f };
      const into =
        bp === "lg"
          ? { a: -lane.land * ALBUM_HALF, b: 0 }
          : { a: 0, b: -lane.land };
      const path = pathOf(
        fall(
          { ...born, y: lane.y },
          { ...into, y: -RECIPE.entry[bp] },
          { ...into, y: sink },
          bp,
        ),
        half,
      );
      // Where on the path the centre meets the edge (y = 0): the handover.
      let lo = 0;
      let hi = path.length;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (path.at(mid).y < 0) lo = mid;
        else hi = mid;
      }
      return {
        path,
        arrive: timeTo(path.length, bp),
        handover: timeTo(hi, bp),
      };
    })
    // The lane that reaches the edge last leads the file, so no card waits on
    // a later one and the launches stay in slot order (`launchOf` relies on it).
    .sort((a, b) => b.handover - a.handover);

  const flight = Math.max(...lanes.map((l) => l.arrive));
  // Whole passes through the two lanes, so the file never breaks at the wrap
  // (the engine's own rule for singles), and one slot to spare.
  const slots =
    Math.ceil((Math.ceil(flight / beat) + 1) / lanes.length) * lanes.length;
  const cycle = slots * beat;
  // ★ THE ARRIVALS KEEP THE BEAT, NOT THE LAUNCHES. The two lanes reach the
  // edge a few hundred ms apart, so launching on the beat opened the rows on a
  // limp (1.9s, 3.1s, 1.9s at a desk). The quicker lane leaves that much
  // later instead, and every row opens exactly one beat after the last.
  const latest = Math.max(...lanes.map((l) => l.handover));

  const cards: PushCard[] = Array.from({ length: slots }, (_, k) => {
    const lane = lanes[k % lanes.length];
    const [aw, ah] = ASPECTS[k % ASPECTS.length];
    return {
      key: `alm-push-${bp}-${k}`,
      slot: k,
      // Rewritten per launch by the layer (every arrival is a new photograph);
      // this is the rest state's.
      photo: k,
      w: unit * aw,
      h: unit * ah,
      at: (((k * beat - (latest - lane.handover)) % cycle) + cycle) % cycle,
      roll: ROLLS[(k * 2) % ROLLS.length],
      path: lane.path,
      arrive: lane.arrive,
      handover: lane.handover,
    };
  });

  const field: Field = {
    bp,
    cards,
    cycle,
    flight,
    // Never scaled: the push's own rule ("a clip, never a scale").
    place: (c, age) => {
      const q = c.path.at(homeTravel(Math.min(age, c.arrive), bp));
      return { a: q.a, b: q.b, y: q.y, s: 1 };
    },
    // In over the engine's 280ms, and gone the moment it is wholly behind the
    // album: glide's `behind`, nothing fading.
    opacity: (c, age) => (age >= c.arrive ? 0 : smoothstep(0, 280, age)),
  };

  // The facts, measured off `place` and `opacity` the way the engine's `solve`
  // measures the other four, so the captions compare like with like.
  const box = cards.map((c) => ({
    w: Math.round(c.w * 1.01),
    h: Math.round(c.h * 1.01),
    fit: 1.01,
    exit: c.arrive,
  }));
  let lit = 0;
  const step = Math.max(10, Math.round(field.cycle / 600));
  for (let t = 0; t < field.cycle; t += step) {
    let n = 0;
    for (const c of cards) {
      const age = ageOf(c, t, field.cycle);
      if (age <= flight && field.opacity(c, age) > 0.02) n++;
    }
    lit = Math.max(lit, n);
  }
  let fastest = 0;
  const dt = flight / 480;
  for (const c of cards)
    for (let i = 0; i < 480; i++) {
      const age = i * dt;
      if (field.opacity(c, age) <= 0.02) continue;
      const p = field.place(c, age);
      const q = field.place(c, age + dt);
      fastest = Math.max(
        fastest,
        (Math.hypot(xAt(q, half) - xAt(p, half), q.y - p.y) / dt) * 1000,
      );
    }
  const facts = {
    lit,
    nodes: cards.length,
    beat,
    launch: Math.round(homeSpeed(0, bp)),
    fastest: Math.round(fastest),
  };
  const home = HOME[bp];
  return {
    ...field,
    cards,
    slots,
    box,
    facts,
    caption: `${facts.lit} lit at the busiest instant (the home hero: ${home.lit}) · one photograph every ${facts.beat} ms (home: ${home.beat}) · leaving at ${facts.launch} px a second, never faster than ${facts.fastest} · going in behind the album's edge over its head, where its row opens`,
  };
}

/** Both breakpoints, solved once at module load, as the engine does. */
export const PUSH: Record<Bp, PushField> = {
  lg: build("lg"),
  base: build("base"),
};

/**
 * WHICH LAUNCH A CARD IS ON, in the order the photographs arrive. Card `k` sits
 * about `k` beats into its flight at elapsed 0 (its lane's head start taken
 * off, always less than a beat), so a larger `k` left earlier and reaches the
 * album earlier; its current launch is its `m`th, and the whole stream's
 * launches in the order they arrive are `m * slots - k`. Offset so the card
 * furthest along at rest is launch 0.
 */
export function launchOf(
  field: PushField,
  c: PushCard,
  elapsed: number,
): number {
  const m = Math.floor((c.at + elapsed) / field.cycle);
  return m * field.slots - c.slot + (field.slots - 1);
}
