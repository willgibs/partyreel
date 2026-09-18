import {
  ageOf,
  ASPECTS,
  CANVAS,
  type Card,
  clearRadius,
  extents,
  type Field,
  HOME,
  homeTravel,
  type Mode,
  rad,
  ROLLS,
  smoothstep,
  solve,
  type Solved,
  type TrailSpec,
} from "./field";

/**
 * THE PRIVACY HERO'S TWO SPIRALS (the heroes lane, 2026-09-18).
 *
 * Will, on the album hero's round three: "I'd love to revamp 'the field' for
 * the 'Privacy & trust' page hero. I love the images popping in spiraling
 * opposite two sides. Increasing the pace, reducing the gap between images and
 * leaving a decaying trail behind the 2 spirals should hopefully be perfect
 * for that page hero."
 *
 * ★ THE MECHANISM IS ROUND THREE'S, KEPT ON PURPOSE, because it is the thing he
 * loved: a two-nozzle source behind the words that TURNS, and every frame it
 * throws flies straight out along the ray it was born on. Nobody draws a
 * spiral: it is what a turning source leaves behind it, the way a Catherine
 * wheel's sparks do. What reads as "spiraling" is the pop-in point sweeping
 * round the words on two opposite sides. The pair leaves together, 180 degrees
 * apart, which is the home hero's own symmetry ("the pair leaves together").
 *
 * ★ BORN ON THE WORDS' RIM, NOT AT THEIR CENTRE. Round three birthed every
 * frame at the centre and spent the first seventh of its flight dark behind the
 * type. At the home hero's pace that crossing eats the whole band: a frame would
 * appear already doing 140 px a second and be gone two seconds later. So a frame
 * pops in on the lockup's rim at the home hero's own launch speed and runs the
 * home hero's own curve from there; the lockup plays the part the code plays on
 * the home page.
 *
 * ★ PACE IS TEMPO AND NOTHING ELSE. Every option of the pace question is one
 * picture on a faster or slower clock: the travel, the turn and the launches all
 * scale together, so the spacing and the spiral's shape hold still and the one
 * thing that changes is how fast.
 *
 * ★ THE GAP IS THE LAUNCH CLOCK. A turning source spaces its frames by how far
 * it turns between launches, so a smaller gap is a quicker clock at the same
 * pace. A frame is drawn at a size that tracks its distance from the centre,
 * because the space between neighbours grows with that distance too, so the
 * ratio of the two, which is what reads as the gap, holds along the whole arm.
 *
 * ★ THE TRAIL DECAYS IN REAL TIME, NOT IN THE COMPOSITION'S. "A decaying trail
 * behind the 2 spirals" is read literally: a spiral is the sweeping pop-in
 * point, so what is BEHIND it is where the arm just was. With a trail the arm
 * dims from its head to its tail like a comet and leaves an afterimage of
 * itself a few degrees back in the turn; without one the frames stay lit until
 * they leave the screen, which is round three. Its clock is real time, so a
 * faster spiral draws a longer tail: the one thing a still can show of a pace.
 */

export const PACES = ["home", "under", "over"] as const;
export type Pace = (typeof PACES)[number];

/** Each pace as a multiple of the home hero's tempo: a notch is a quarter
 *  down or a third up, one step either way on a log scale. */
export const TEMPO: Record<Pace, number> = { home: 1, under: 0.75, over: 4 / 3 };

export const GAPS = ["half", "edge", "overlap"] as const;
export type Gap = (typeof GAPS)[number];

/** Centre to centre between neighbours on one arm, in photograph widths. */
export const SPACING: Record<Gap, number> = {
  half: 1.5,
  edge: 1,
  overlap: 0.75,
};

/** How the spirals are drawn at a phone. */
export type Arms = "spirals" | "cones";

/** What each arm leaves behind it. */
export type Trail = "wake" | "echoes" | "none";

/**
 * THE LOCKUP AS ONE KEEP-OUT BOX, measured to its INK on the rendered
 * `PageHero` (scale `lg`, `text-title`) with the privacy page's own words:
 * the eyebrow, two headline lines, the sentence and the actions at 1440; at 375
 * the headline breaks twice, the sentence three times and the actions stack.
 * Re-measure if the copy changes (bible 21: copy is open).
 */
export const BLOCK: Record<Mode, { w: number; h: number }> = {
  desktop: { w: 706, h: 346 },
  phone: { w: 300, h: 359 },
};

/** The lockup's centre, px from the canvas top: the middle of the screen under
 *  the site header, which the hero runs beneath. */
export const CENTRE_Y: Record<Mode, number> = { desktop: 497, phone: 412 };

type Geo = {
  /** Air between the lockup's ink and a card's box. */
  margin: number;
  /** The card box width at scale 1, before its aspect. */
  unit: number;
  /** Degrees a second the source turns at the home hero's tempo. */
  turn: number;
  /** A card's scale is its distance from the centre over this, clamped. */
  reach: number;
  sMin: number;
  sMax: number;
  /** px before the canvas edge over which a card dissolves. */
  fade: number;
  /** The newest pair's direction at elapsed 0, degrees clockwise from 3 o'clock. */
  start: number;
  /** Where the gap solver starts looking, ms between two pairs. */
  halfBeat: number;
};

const GEO: Record<Mode, Geo> = {
  desktop: {
    margin: 28,
    unit: 200,
    turn: 28,
    reach: 600,
    sMin: 0.6,
    sMax: 0.95,
    fade: 110,
    // The direction that leaves the most of both arms on screen at rest, which
    // is what reduced motion, a crawler and a cold paint all see (swept).
    start: 72,
    halfBeat: 640,
  },
  phone: {
    margin: 12,
    unit: 104,
    turn: 30,
    reach: 330,
    sMin: 0.62,
    sMax: 1.02,
    fade: 60,
    start: 144,
    halfBeat: 820,
  },
};

/** The site header's band, which the hero runs beneath (marketing.css's
 *  --mkt-header-h, 4rem). */
const HEADER = 64;

/** How long a card takes to pop in, at the home hero's tempo. */
const POP_MS = 240;

/** The trail's real-time clocks: how long an arm's frames take to die away,
 *  how far back in the turn the afterimage reaches, and the echoes' spacing. */
export const DECAY_MS: Record<Mode, number> = { desktop: 5200, phone: 4000 };
export const SMEAR_MS = 700;
export const ECHO_MS = 260;
export const ECHO_ALPHA = [0.42, 0.18] as const;

/** At a phone, the cones: pairs of rays within thirty degrees of straight up
 *  and straight down, walked so that neighbours land far apart across the
 *  column rather than stacking on one another. */
const CONE = [0, 24, -24, 12, -12, 30, -30, 6, -18, 18, -6, 27, -27] as const;

export type SpiralCard = Card & {
  arm: 0 | 1;
  /** The ray, radians, clockwise from 3 o'clock. */
  angle: number;
  /** Born here, on the lockup's rim. */
  r0: number;
  /** Dissolving from here to `rOut`. */
  rFade: number;
  rOut: number;
};

export type SpiralSpec = {
  mode: Mode;
  pace: Pace;
  gap: Gap;
  trail: Trail;
  /** Only read at a phone. */
  arms: Arms;
  /** A launch clock to draw at instead of the gap's own: the solver's probe. */
  beat?: number;
};

/** A spiral field, built and solved: the tables the hero draws. */
export type Spirals = Solved<SpiralCard> & {
  spec: SpiralSpec;
  /** ms between one pair and the next. */
  beat: number;
  /** Degrees the source turns between two pairs (0 for the cones). */
  step: number;
  /** Degrees a second the source turns (0 for the cones). */
  turn: number;
  /** The measured numbers each option states, against the home hero's. */
  pace: { launch: number; beat: number; turnS: number };
  /** Centre to centre between neighbours on an arm, in their own widths
   *  (measured at rest, not claimed). */
  spacing: number;
};

/** Every spiral field the board asks for, built once: the previews, their
 *  captions and the tests all read the same handful of tables. */
const BUILT = new Map<string, Spirals>();

export function spirals(spec: SpiralSpec): Spirals {
  const key = `${spec.mode}-${spec.pace}-${spec.gap}-${spec.trail}-${spec.mode === "phone" ? spec.arms : "spirals"}-${spec.beat ?? ""}`;
  const hit = BUILT.get(key);
  if (hit) return hit;
  const built = build(spec);
  BUILT.set(key, built);
  return built;
}

function build(spec: SpiralSpec): Spirals {
  const { mode, pace, gap, trail } = spec;
  const form: Arms = mode === "phone" ? spec.arms : "spirals";
  const g = GEO[mode];
  const canvas = CANVAS[mode];
  const tempo = TEMPO[pace];
  const cx = canvas.w / 2;
  const cy = CENTRE_Y[mode];
  const bw = BLOCK[mode].w / 2 + g.margin;
  const bh = BLOCK[mode].h / 2 + g.margin;

  // THE LAUNCH CLOCK: whatever beat draws this gap, solved at the home
  // hero's tempo and carried onto the pace's.
  const beat = spec.beat ?? beatFor(mode, gap, form) / tempo;
  const turn = form === "spirals" ? g.turn * tempo : 0;

  const scaleAt = (r: number) =>
    Math.min(g.sMax, Math.max(g.sMin, r / g.reach));
  const travel = (age: number) => homeTravel(age * tempo, mode);

  /** Whether a card-sized box centred at (x, y) touches the words. */
  const overWords = (x: number, y: number, hw: number, hh: number) =>
    Math.abs(x - cx) < bw + hw - g.margin &&
    Math.abs(y - cy) < bh + hh - g.margin;

  // HOW LONG A CARD IS AIRBORNE, in the home hero's time: out past the
  // farthest corner from its rim. At a pace the flight is this over the tempo,
  // cut short by the trail's decay, which runs in real time.
  const farthest = Math.hypot(canvas.w / 2, Math.max(cy, canvas.h - cy));
  let homeFlight = 0;
  while (
    homeTravel(homeFlight, mode) < farthest - Math.min(bw, bh) &&
    homeFlight < 60000
  )
    homeFlight += 50;
  const flight =
    trail === "none"
      ? homeFlight / tempo
      : Math.min(homeFlight / tempo, DECAY_MS[mode] + 100);

  // THE TABLE CLOSES ON A WHOLE NUMBER OF HALF TURNS. The two arms are one
  // another turned 180 degrees, so a table whose launches turn the source
  // exactly half way round (or a whole number of halves) repeats with the arms
  // swapped, seamlessly, and every card keeps ONE ray for its whole life: the
  // rest state, the DOM box and the facts are then per card and exact, which
  // a free-running angle would not give.
  //
  // ★ ONE TABLE FOR EVERY PACE AND EVERY TRAIL. It is laid out in the home
  // hero's time against the longest flight any option draws (no trail, which
  // lives to the edge), so a pace only rescales it and a trail only relights
  // it: the picture at rest is the same one across the pace question, which is
  // what "one picture on a quicker clock" has to mean.
  const homeBeat = beat * tempo;
  let slots = Math.ceil(homeFlight / homeBeat) + 1;
  let step = 0;
  if (form === "spirals") {
    const per = g.turn * (homeBeat / 1000);
    let halves = 1;
    slots = Math.max(1, Math.round((180 * halves) / per));
    while (slots * homeBeat < homeFlight) {
      halves++;
      slots = Math.max(1, Math.round((180 * halves) / per));
    }
    step = (180 * halves) / slots;
  }
  const cycle = slots * beat;

  const cards: SpiralCard[] = [];
  for (let k = 0; k < slots; k++) {
    for (const arm of [0, 1] as const) {
      // Clockwise: the source's angle grows with time, so the pair that left
      // k beats ago left k steps short of where the source points now.
      const deg =
        form === "spirals"
          ? g.start - k * step + arm * 180
          : (arm ? 90 : -90) + CONE[k % CONE.length];
      const angle = rad(deg);
      const [aw, ah] = ASPECTS[(k + arm) % ASPECTS.length];
      const w = g.unit * aw;
      const h = g.unit * ah;
      const roll = ROLLS[(2 * k + arm) % ROLLS.length];

      // Born where its own box first clears the words, at the size it has
      // there: a fixed point, because the size is read off the radius.
      let r0 = 0;
      let s = g.sMin;
      for (let i = 0; i < 6; i++) {
        const e = extents(w * s, h * s, roll);
        r0 = clearRadius(angle, bw, bh, e.hw, e.hh);
        s = scaleAt(r0);
      }

      // Where it leaves: out of the canvas at the sides and the foot (its
      // centre past the edge and a little over), but UPWARD it is gone by the
      // time its top edge reaches the header's foot. A photograph under the
      // bar's own words would fight them for the eye, and the bar is the one
      // thing on the screen a frame may never sit behind.
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const sEdge = scaleAt(Math.hypot(canvas.w / 2, canvas.h / 2));
      const hhEdge = extents(w * sEdge, h * sEdge, roll).hh;
      const tx =
        Math.abs(ux) < 1e-6
          ? Infinity
          : (ux > 0 ? canvas.w - cx : cx) / Math.abs(ux) + 0.25 * g.unit;
      const ty =
        Math.abs(uy) < 1e-6
          ? Infinity
          : uy > 0
            ? (canvas.h - cy) / uy + 0.25 * g.unit
            : (cy - HEADER - hhEdge) / -uy;
      const rOut = Math.min(tx, ty);
      const rFade = rOut - g.fade;

      cards.push({
        key: `pvh-${form}-${k}-${arm}`,
        slot: k,
        photo: (k + (arm ? 6 : 0)) % 12,
        w,
        h,
        at: k * beat,
        roll,
        arm,
        angle,
        r0,
        rFade,
        rOut,
      });
    }
  }

  const radiusAt = (c: SpiralCard, age: number) => c.r0 + travel(age);

  /** The card's own light, before any trail: popping in, then dissolving at
   *  the canvas edge, and with a trail, dying away down the arm. */
  const opacity = (c: SpiralCard, age: number) => {
    // A ray that leaves the screen before it clears the words (a phone has
    // plenty) is never lit at all.
    if (!(c.rOut > c.r0)) return 0;
    const r = radiusAt(c, age);
    const born = smoothstep(0, POP_MS / tempo, age);
    const edge = 1 - smoothstep(c.rFade, c.rOut, r);
    const decay =
      trail === "none"
        ? 1
        : Math.pow(1 - smoothstep(0, DECAY_MS[mode], age), 0.85);
    return born * edge * decay;
  };

  const place = (c: SpiralCard, age: number) => {
    const r = radiusAt(c, age);
    return {
      x: cx + Math.cos(c.angle) * r,
      y: cy + Math.sin(c.angle) * r,
      s: scaleAt(r),
    };
  };

  /** The card turned back round the centre by `deg`, at its own radius: where
   *  the ARM was that long ago. Never over the words. */
  const behind = (c: SpiralCard, age: number, deg: number) => {
    const r = radiusAt(c, age);
    const a = c.angle - rad(deg);
    const s = scaleAt(r);
    const e = extents(c.w * s, c.h * s, c.roll);
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    return { x, y, s, clear: !overWords(x, y, e.hw, e.hh) };
  };

  const trailSpec: TrailSpec<SpiralCard> | undefined =
    trail === "echoes"
      ? {
          kind: "ghost",
          count: ECHO_ALPHA.length,
          at: (c, age, k, fit, box) => {
            const back = (turn * ECHO_MS * (k + 1)) / 1000;
            const b = behind(c, age, back);
            if (!b.clear || turn === 0) return { transform: "", opacity: 0 };
            return {
              transform: `translate3d(${(b.x - box.w / 2).toFixed(2)}px, ${(b.y - box.h / 2).toFixed(2)}px, 0) rotate(${c.roll.toFixed(2)}deg) scale(${(b.s / fit).toFixed(4)})`,
              opacity: opacity(c, age) * ECHO_ALPHA[k],
            };
          },
        }
      : trail === "wake"
        ? {
            kind: "smear",
            count: 1,
            at: (c, age, _k, _fit, box) => {
              const head = place(c, age);
              // The afterimage reaches back SMEAR_MS of turn, cut short where
              // it would cross the words.
              let back = (turn * SMEAR_MS) / 1000;
              let tail = behind(c, age, back);
              for (let i = 0; i < 6 && !tail.clear && back > 0.5; i++) {
                back *= 0.6;
                tail = behind(c, age, back);
              }
              const dx = head.x - tail.x;
              const dy = head.y - tail.y;
              const len = Math.hypot(dx, dy);
              if (!tail.clear || len < 6) return { transform: "", opacity: 0 };
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              // From the tail to a little past the card's centre, so the head
              // end is under the photograph and only the part behind it shows.
              const span = len + c.w * head.s * 0.5;
              const mx = tail.x + (dx / len) * (span / 2);
              const my = tail.y + (dy / len) * (span / 2);
              const sx = span / box.w;
              const sy = (Math.min(c.w, c.h) * head.s * 0.92) / box.h;
              return {
                transform: `translate3d(${(mx - box.w / 2).toFixed(2)}px, ${(my - box.h / 2).toFixed(2)}px, 0) rotate(${angle.toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
                opacity: opacity(c, age) * 0.9,
              };
            },
          }
        : undefined;

  const field: Field<SpiralCard> = {
    mode,
    cards,
    cycle,
    flight,
    place,
    opacity,
    trail: trailSpec,
  };

  const solved = solve(field);
  return {
    ...solved,
    spec: { ...spec, arms: form },
    beat,
    step,
    turn,
    pace: {
      launch: Math.round(HOME[mode].launch * tempo),
      beat: Math.round(beat),
      turnS: turn > 0 ? Math.round((360 / turn) * 10) / 10 : 0,
    },
    spacing: spacingOf(solved),
  };
}

/**
 * THE GAP, MEASURED: at two dozen instants across a whole cycle, every pair of
 * neighbours on one arm that are both well lit, the distance between their
 * centres over the width of the nearer one; the median of all of them. Read
 * off the picture the board draws, across the loop rather than at one frame of
 * it, so an option's words can be held to it whichever way the arms point.
 */
function spacingOf(field: Solved<SpiralCard>) {
  const ratios: number[] = [];
  for (let n = 0; n < 24; n++) {
    const t = (n / 24) * field.cycle;
    for (const arm of [0, 1] as const) {
      const on = field.cards
        .filter((c) => c.arm === arm)
        .sort((a, b) => a.at - b.at);
      for (let i = 0; i + 1 < on.length; i++) {
        const a = on[i];
        const b = on[i + 1];
        const ageA = ageOf(a, t, field.cycle);
        const ageB = ageOf(b, t, field.cycle);
        if (ageA > field.flight || ageB > field.flight) continue;
        if (field.opacity(a, ageA) < 0.3 || field.opacity(b, ageB) < 0.3)
          continue;
        const pa = field.place(a, ageA);
        const pb = field.place(b, ageB);
        const width = Math.min(a.w * pa.s, b.w * pb.s);
        ratios.push(Math.hypot(pa.x - pb.x, pa.y - pb.y) / width);
      }
    }
  }
  if (ratios.length === 0) return 0;
  ratios.sort((x, y) => x - y);
  return Math.round(ratios[Math.floor(ratios.length / 2)] * 100) / 100;
}

/**
 * ★ THE GAP IS SOLVED, NOT GUESSED. An option that says "half a photograph
 * apart" has to draw half a photograph apart, so the beat for each gap is found
 * by measuring the picture: bisect the launch clock until the median spacing
 * between neighbours at rest is the option's own number. It is solved once per
 * canvas and gap at the home hero's tempo, with no trail (a trail changes what
 * is lit, never where), and a pace only rescales it, which is why the picture
 * holds still across the pace question.
 */
const SOLVED = new Map<string, number>();

export function beatFor(mode: Mode, gap: Gap, form: Arms): number {
  // ★ A PHONE TAKES THE DESKTOP'S CLOCK, on the home hero's own ratio between
  // its two breakpoints (1350 against 1250). At 375 the words fill the column,
  // so an arm is only ever seen in the strips above and below them and there
  // are never two neighbours lit at rest to measure; the cones are not an arm
  // at all. The gap is a property of the spiral, and the desktop is where it
  // can be seen whole.
  if (mode === "phone")
    return Math.round(
      (beatFor("desktop", gap, "spirals") * HOME.phone.beat) /
        HOME.desktop.beat,
    );
  const key = `${mode}-${gap}-${form}`;
  const hit = SOLVED.get(key);
  if (hit !== undefined) return hit;
  const want = SPACING[gap];
  const measure = (beat: number) =>
    spirals({ mode, pace: "home", gap, trail: "none", arms: form, beat })
      .spacing;
  let lo = 120;
  let hi = GEO[mode].halfBeat * 4;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    const got = measure(mid);
    // More time between pairs, more space between neighbours.
    if (got === 0 || got < want) lo = mid;
    else hi = mid;
  }
  const beat = Math.round((lo + hi) / 2);
  SOLVED.set(key, beat);
  return beat;
}
