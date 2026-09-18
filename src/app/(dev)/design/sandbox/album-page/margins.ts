import {
  ASPECTS,
  type Card,
  extents,
  type Field,
  HOME,
  homeTravel,
  type Mode,
  ROLLS,
  smoothstep,
  solve,
  type Solved,
} from "../privacy-hero/field";

/**
 * THE ALBUM PAGE'S MOTION, THREE KINDS (the heroes lane, 2026-09-18), on the
 * one field engine the privacy hero lifted (`../privacy-hero/field.ts`).
 *
 * Will: "feel the area above and to the sides of the H1 lockup will feel too
 * empty with just the album beneath. Maybe we can use a more subtle animation
 * in some of the empty space to help the hero feel more alive & full." And the
 * pace is the home hero's (his round four), SUBTLE because the album under the
 * words is the main visual.
 *
 * ★ DIFFERENT IN KIND, NOT IN DEGREE. A stream with a destination (frames are
 * born and travel INTO the album), a still scatter with a cadence (nothing
 * travels, one lands each beat), and a procession on a path (nothing is born
 * or lands, everything travels). Each is graded against the home hero, which
 * the options say in numbers the test holds them to.
 *
 * ★ SUBTLE IS SIZE AND PLACE, NEVER A SCRIM. The frames are small, they keep
 * to the empty space, and they are photographs at full strength (bible 1);
 * nothing is laid over them and nothing crosses the words.
 *
 * ★ THE ALBUM TAKES WHAT REACHES IT. The motion is the hero's backdrop and the
 * album is the hero's stage, which paints over it: a frame whose path ends a
 * little way inside the album's top edge slides BEHIND the frame and is gone,
 * with no fade to time.
 */

export const MOTIONS = ["stream", "arrivals", "arch"] as const;
export type Motion = (typeof MOTIONS)[number];

/** Room above the words and between the actions and the album, px. A phone has
 *  no space BESIDE the words (they fill the column), so each motion asks for
 *  the strip it draws in: the stream the gap above the album, the other two a
 *  band above the eyebrow. */
export type Room = { top: number; gap: number };

export const ROOM: Record<Mode, Record<Motion, Room>> = {
  desktop: {
    stream: { top: 80, gap: 64 },
    arrivals: { top: 80, gap: 64 },
    // The arch passes OVER the words, so it asks for a band there: under the
    // header's own row and clear of the eyebrow.
    arch: { top: 150, gap: 64 },
  },
  phone: {
    stream: { top: 56, gap: 150 },
    arrivals: { top: 150, gap: 48 },
    arch: { top: 150, gap: 48 },
  },
};


/** The site header's band, which the hero runs beneath. */
const HEADER = 64;

/**
 * THE WORDS AND THE ALBUM, MEASURED on the rendered hero (`PageHero` at `lg`
 * with the album page's own copy): the lockup's ink box, and the album's
 * column. Every other number here is placed off these. Re-measure if the copy
 * changes (bible 21).
 */
export const INK: Record<Mode, { l: number; r: number; h: number }> = {
  desktop: { l: 429, r: 1011, h: 422 },
  phone: { l: 18, r: 357, h: 359 },
};
export const COLUMN: Record<Mode, { l: number; r: number }> = {
  desktop: { l: 272, r: 1168 },
  phone: { l: 16, r: 359 },
};

/** The ink box's top and foot, and the album's top edge, for a motion. */
export function layout(mode: Mode, motion: Motion) {
  const room = ROOM[mode][motion];
  const top = HEADER + room.top;
  const foot = top + INK[mode].h;
  return { top, foot, album: foot + room.gap, ...INK[mode] };
}

/** The album's visible height at each width (visual.tsx draws it). */
const ALBUM_H: Record<Mode, number> = { desktop: 600, phone: 430 };

/** The floor under the album's dissolve: room for its light to pool. */
const FLOOR: Record<Mode, number> = { desktop: 150, phone: 110 };

/** The hero section's height for a motion: the header's band, the words, the
 *  album, and the floor its light pools on. */
export function heightOf(mode: Mode, motion: Motion) {
  return layout(mode, motion).album + ALBUM_H[mode] + FLOOR[mode];
}

type Pt = { x: number; y: number };

/** A path as a polyline with its running length, walked by distance. */
function pathOf(points: Pt[]) {
  const acc = [0];
  for (let i = 1; i < points.length; i++)
    acc.push(
      acc[i - 1] +
        Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y),
    );
  const length = acc[acc.length - 1];
  const at = (d: number): Pt & { u: number } => {
    const dd = Math.min(Math.max(d, 0), length);
    let i = 1;
    while (i < acc.length - 1 && acc[i] < dd) i++;
    const seg = acc[i] - acc[i - 1] || 1;
    const t = (dd - acc[i - 1]) / seg;
    return {
      x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
      y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
      u: length > 0 ? dd / length : 0,
    };
  };
  return { length, at };
}

/** A quadratic curve from `a` to `b` bending through `c`, as a polyline. */
function bend(a: Pt, c: Pt, b: Pt, n = 40): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return {
      x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    };
  });
}

type PathCard = Card & {
  path: ReturnType<typeof pathOf>;
  /** The scale at the start of the path and at its end. */
  s0: number;
  s1: number;
};

type StationCard = Card & { x: number; y: number; s: number };

export type Margins = {
  field: Solved;
  /** What the option's words claim, measured: the numbers the test holds. */
  facts: {
    lit: number;
    /** ms between one launch (or landing) and the next. */
    beat: number;
    /** px a second a frame leaves at, or 0 when nothing travels. */
    launch: number;
    /** The fastest anything moves, px a second. */
    fastest: number;
  };
  caption: string;
};

/* ── 1. FALLING IN: born beside the words, gliding down into the album ───── */

/**
 * THE PAGE'S OWN SENTENCE, DRAWN: "every phone uploads into the same album".
 * A pair of small photographs appears in the empty space either side of the
 * words every beat of the home hero's clock and glides down into the album's
 * top edge on the home hero's own curve, leaving at its launch speed and
 * gathering pace as it goes, then slides under the frame and is gone.
 *
 * Each frame falls first and turns in last (the curve's bend sits just above
 * the album), so it never leans toward the words on the way down.
 */
const FALL = {
  desktop: {
    unit: 104,
    // Where a frame appears: across the empty side, never on the words.
    from: [
      { x: 150, y: 150 },
      { x: 300, y: 250 },
      { x: 90, y: 330 },
      { x: 250, y: 120 },
      { x: 190, y: 430 },
      { x: 330, y: 380 },
    ],
    // Where it enters the album: its top-left corner, outside the words' own
    // width, so a frame never passes the foot of the lockup on its way in,
    // and far enough inside the column that it is whole behind the album by
    // the time its path ends.
    into: [345, 362, 352, 368, 340, 358],
  },
  phone: {
    unit: 52,
    // A phone's words fill the column, so the stream lives in the strip
    // between the actions and the album: a frame appears just under the
    // lockup's foot and drops into the album's top edge.
    from: [
      { x: 64, y: 0 },
      { x: 128, y: 8 },
      { x: 96, y: 4 },
    ],
    into: [74, 140, 108],
  },
} as const;

function stream(mode: Mode): Field<PathCard> {
  const g = FALL[mode];
  const lay = layout(mode, "stream");
  const width = mode === "desktop" ? 1440 : 375;
  const beat = HOME[mode].beat;
  const cards: PathCard[] = [];
  // A phone's starts are measured from the lockup's foot (its only room is the
  // strip under it); a desktop's are placed on the canvas beside the words.
  const start = (a: Pt) =>
    mode === "phone" ? { x: a.x, y: lay.foot + 36 + a.y } : a;
  const paths = g.from.map((from, i) => {
    const a = start(from);
    // The path ends with the whole frame under the album's top edge.
    const endY = lay.album + (mode === "desktop" ? 72 : 40);
    const b = { x: g.into[i], y: endY };
    // Fall first, turn in last: the bend sits at the album's edge.
    const c = { x: a.x, y: lay.album + (mode === "desktop" ? 10 : 0) };
    return { a, b, c };
  });
  const lengths = paths.map(({ a, b, c }) => pathOf(bend(a, c, b)).length);
  let flight = 0;
  const longest = Math.max(...lengths);
  while (homeTravel(flight, mode) < longest && flight < 60000) flight += 25;
  const slots = Math.ceil(flight / beat) + 1;
  for (let k = 0; k < slots; k++) {
    for (const side of [0, 1] as const) {
      const p = paths[(k + side * 3) % paths.length];
      const mirror = (pt: Pt) => (side ? { x: width - pt.x, y: pt.y } : pt);
      const [aw, ah] = ASPECTS[(k + side) % ASPECTS.length];
      cards.push({
        key: `apg-stream-${k}-${side}`,
        slot: k,
        photo: (k * 2 + side * 5) % 12,
        w: g.unit * aw,
        h: g.unit * ah,
        at: k * beat,
        roll: ROLLS[(k * 2 + side) % ROLLS.length],
        path: pathOf(bend(mirror(p.a), mirror(p.c), mirror(p.b))),
        s0: 0.86,
        s1: 1,
      });
    }
  }
  return {
    mode,
    cards,
    cycle: slots * beat,
    flight,
    place: (c, age) => {
      const q = c.path.at(homeTravel(age, mode));
      return { x: q.x, y: q.y, s: c.s0 + (c.s1 - c.s0) * q.u };
    },
    opacity: (c, age) =>
      homeTravel(age, mode) >= c.path.length ? 0 : smoothstep(0, 280, age),
  };
}

/* ── 2. LANDING: a still scatter, one photograph arriving each beat ──────── */

/**
 * NOTHING TRAVELS. The empty space either side of the words holds a loose
 * scatter of small photographs; on every beat of the home hero's clock one
 * lands at an empty place with a short settle and the oldest fades. The one
 * motion is the settle, a third of a second long, which is why this is the
 * quietest of the three.
 */
const LAND = {
  desktop: {
    unit: 112,
    life: 8,
    at: [
      { x: 200, y: 170, s: 1 },
      { x: 1250, y: 250, s: 0.92 },
      { x: 330, y: 400, s: 0.82 },
      { x: 1110, y: 130, s: 0.86 },
      { x: 110, y: 330, s: 0.9 },
      { x: 1320, y: 440, s: 1 },
      { x: 300, y: 110, s: 0.78 },
      { x: 1180, y: 390, s: 0.84 },
      { x: 160, y: 520, s: 0.86 },
      { x: 1290, y: 580, s: 0.8 },
      { x: 360, y: 250, s: 0.74 },
      { x: 1080, y: 520, s: 0.76 },
    ],
  },
  phone: {
    unit: 60,
    life: 4,
    // A loose row in the band over the eyebrow, never two on top of each other.
    at: [
      { x: 58, y: 150, s: 1 },
      { x: 318, y: 124, s: 0.92 },
      { x: 150, y: 112, s: 0.86 },
      { x: 236, y: 168, s: 0.8 },
      { x: 330, y: 166, s: 0.84 },
    ],
  },
} as const;

/** The settle: how long, and how much larger a frame arrives. */
const SETTLE_MS = 320;
const SETTLE_LIFT = 0.08;

function arrivals(mode: Mode): Field<StationCard> {
  const g = LAND[mode];
  const beat = HOME[mode].beat;
  const stations = g.at.length;
  const life = g.life * beat;
  const cards: StationCard[] = g.at.map((st, k) => {
    const [aw, ah] = ASPECTS[k % ASPECTS.length];
    return {
      key: `apg-land-${k}`,
      slot: k,
      photo: (k * 5) % 12,
      w: g.unit * aw,
      h: g.unit * ah,
      at: k * beat,
      roll: ROLLS[k % ROLLS.length],
      x: st.x,
      y: st.y,
      s: st.s,
    };
  });
  return {
    mode,
    cards,
    cycle: stations * beat,
    flight: life,
    place: (c, age) => {
      const t = Math.min(1, age / SETTLE_MS);
      const ease = 1 - (1 - t) * (1 - t) * (1 - t);
      return { x: c.x, y: c.y, s: c.s * (1 + SETTLE_LIFT * (1 - ease)) };
    },
    opacity: (_c, age) =>
      smoothstep(0, 200, age) * (1 - smoothstep(life - 700, life, age)),
  };
}

/* ── 3. AN ARCH: a procession out of the album and back into it ──────────── */

/**
 * NOTHING IS BORN AND NOTHING LANDS. Photographs rise out of the album's top
 * edge on one side, climb the empty side of the words, pass over them under the
 * header and sink back into the album on the other side: a steady procession at
 * the home hero's launch speed, the slowest thing on the home page, a frame
 * every few seconds. The frames are smallest where the arch runs over the
 * words, where the room is narrowest.
 */
const ARCH = {
  desktop: { unit: 96, gapWidths: 1.5, top: 104, side: 150 },
  phone: { unit: 56, gapWidths: 1.6, top: 136, side: 0 },
} as const;

function arch(mode: Mode): Field<PathCard> {
  const g = ARCH[mode];
  const lay = layout(mode, "arch");
  const width = mode === "desktop" ? 1440 : 375;
  const v = HOME[mode].launch;
  let points: Pt[];
  if (mode === "desktop") {
    // Up the left side from under the album, over the words just below the
    // header, and down the right side back under the album.
    const inset = COLUMN.desktop.l + 70;
    const floor = lay.album + 70;
    const left = g.side;
    points = [
      ...bend(
        { x: inset, y: floor },
        { x: left - 40, y: (floor + g.top) / 2 + 40 },
        { x: left + 60, y: g.top + 90 },
        30,
      ),
      ...bend(
        { x: left + 60, y: g.top + 90 },
        { x: width / 2, y: g.top - 70 },
        { x: width - left - 60, y: g.top + 90 },
        40,
      ).slice(1),
      ...bend(
        { x: width - left - 60, y: g.top + 90 },
        { x: width - left + 40, y: (floor + g.top) / 2 + 40 },
        { x: width - inset, y: floor },
        30,
      ).slice(1),
    ];
  } else {
    // A phone has no side: the arch flattens into the band above the eyebrow,
    // entering and leaving at the screen's edges.
    points = bend(
      { x: -60, y: g.top + 30 },
      { x: width / 2, y: g.top - 70 },
      { x: width + 60, y: g.top + 30 },
      40,
    );
  }
  const path = pathOf(points);
  const flight = (path.length / v) * 1000;
  // One frame every gap, measured in the frames' own width at full size.
  const every = ((g.unit * g.gapWidths) / v) * 1000;
  const slots = Math.ceil(flight / every);
  const cycle = Math.max(slots * every, flight);
  const cards: PathCard[] = Array.from({ length: slots }, (_, k) => {
    const [aw, ah] = ASPECTS[k % ASPECTS.length];
    return {
      key: `apg-arch-${k}`,
      slot: k,
      photo: (k * 7) % 12,
      w: g.unit * aw,
      h: g.unit * ah,
      at: k * every,
      roll: ROLLS[k % ROLLS.length],
      path,
      s0: 1,
      s1: 1,
    };
  });
  // Smallest over the words: the scale dips with how near the arch's top the
  // frame is, which is also where it is nearest the header.
  const dip = mode === "desktop" ? 0.62 : 0.86;
  return {
    mode,
    cards,
    cycle,
    flight,
    place: (_c, age) => {
      const q = path.at((v * age) / 1000);
      const high = 1 - Math.min(1, Math.abs(q.u - 0.5) * 2);
      return { x: q.x, y: q.y, s: 1 - (1 - dip) * smoothstep(0.35, 1, high) };
    },
    opacity: (_c, age) => (age >= flight ? 0 : smoothstep(0, 400, age)),
  };
}

/* ── The three, solved once ───────────────────────────────────────────────── */

const BUILT = new Map<string, Margins>();

export function margins(mode: Mode, motion: Motion): Margins {
  const key = `${mode}-${motion}`;
  const hit = BUILT.get(key);
  if (hit) return hit;
  const field = solve(
    (motion === "stream"
      ? stream(mode)
      : motion === "arrivals"
        ? arrivals(mode)
        : arch(mode)) as unknown as Field,
  );
  const beat =
    motion === "arch"
      ? Math.round(field.cards[1].at - field.cards[0].at)
      : HOME[mode].beat;
  const launch = motion === "arrivals" ? 0 : Math.round(HOME[mode].launch);
  const facts = {
    lit: field.facts.lit,
    beat,
    launch,
    fastest: field.facts.fastest,
  };
  const home = HOME[mode];
  const caption =
    motion === "arrivals"
      ? `${facts.lit} lit at once (the home hero: ${home.lit}) · one lands every ${beat} ms, the home hero's clock · nothing travels`
      : `${facts.lit} lit at the busiest instant (the home hero: ${home.lit}) · ${motion === "stream" ? `a pair every ${beat} ms` : `a frame every ${beat} ms`} (home: ${home.beat}) · leaving at ${launch} px a second, never faster than ${facts.fastest}`;
  const built = { field, facts, caption };
  BUILT.set(key, built);
  return built;
}

/** A card's rotated half-extents at a scale: what the keep-out test reads. */
export function boxAt(c: Card, s: number) {
  return extents(c.w * s, c.h * s, c.roll);
}
