/**
 * THE IMAGE TRAIL'S ARITHMETIC (promoted from the `image-trail` board,
 * 2026-09-19, at the look Will ruled on it).
 *
 * OURS, WRITTEN FROM SCRATCH, with Codrops' "Image Trail Effects" demo one read
 * once for its numbers and nothing else: no file, no photograph and no line of
 * theirs is in this repo, and no dependency was added for it (no GSAP). What
 * their demo taught, in one sentence: a photograph is born every time the cursor
 * has travelled far enough, it appears where the cursor WAS and slides to where
 * the cursor IS, and then it fades and shrinks away. Density is the travel
 * threshold, the slide is the chase, and the decay is the fade and the shrink.
 * Everything below is that sentence made ours, at Will's numbers.
 *
 * ★ A CARD'S WHOLE LIFE IS DECIDED AT BIRTH, which is the one structural choice
 * everything else hangs off. A card records where it came from, where it is
 * going and when it was born; after that its position, its scale, its turn and
 * its opacity are a CLOSED FORM of its age. So there is no per-frame
 * integration to drift, no accumulated rounding, and the same card at the same
 * age draws the same pixels in a node test and in the browser. It is the home
 * hero's discipline (`hero-stream.ts`) applied to a source that is not a clock.
 *
 * ★ THE SOURCE IS AN INTERFACE, which is the whole reason one engine serves a
 * cursor and a phone. `advance` takes one sample and never asks where it came
 * from, so a pointer feeds it a hand and a PATH feeds it a curve walked at a
 * pace. Will ruled both on the same board (`entrance=flick` for the hand,
 * `phone=walks` for the curve), and they are one mechanism rather than two.
 *
 * ★ THE STILL IS A REPLAY, NOT A SPECIAL CASE. `replay` walks a path from zero
 * to a chosen moment and hands back the state it reaches, so the rest state, the
 * reduced-motion composition and the loop's own first frame are ONE picture,
 * computed the same way the live loop computes its frames.
 *
 * ★ THE POOL IS A RING. A birth takes the next slot and overwrites whatever was
 * there, which is always the most decayed card, so the DOM node count is fixed
 * and a violent flick of the mouse costs nothing but recycling.
 *
 * Pure: no React, no stylesheet, no `env`, nothing measured. `trail-engine.test.ts`
 * reads exactly these tables, and `trail.tsx` is the only thing that turns them
 * into pixels.
 */

/* ── Primitives ──────────────────────────────────────────────────────────── */

export type Pt = { x: number; y: number };

/** The box a trail is drawn in, in CSS px. The caller measures it once. */
export type Box = { w: number; h: number };

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

/** The slide's ease: fast out of the gate, a long settle. Demo one reaches for
 *  expo-out here and it is right, so ours is the same curve written out rather
 *  than imported from anywhere. */
export const expoOut = (t: number) =>
  t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(t));

/** The fade: quad-out, so a photograph gives up its light early and lingers
 *  faintly rather than switching off at the end. */
export const quadOut = (t: number) => {
  const u = clamp01(t);
  return 1 - (1 - u) * (1 - u);
};

/** The shrink: quint-out, so it is nearly done shrinking while it is still
 *  bright. The two curves parting is what makes the tail read as DEPTH rather
 *  than as a dimmer switch, and it is what Will picked when he picked the long
 *  decay ("a slower shrink... keeping a third of its size"). */
export const quintOut = (t: number) => {
  const u = 1 - clamp01(t);
  return 1 - u * u * u * u * u;
};

/**
 * The shapes a trail is made of, walked in order rather than dealt. Portrait
 * first because that is what a phone takes and what the reference shows; the
 * square and the wider one keep a run of cards from reading as a printed
 * contact sheet. Each is `w : h` at the card's own size.
 */
export const ASPECTS = [
  [3, 4],
  [4, 5],
  [1, 1],
  [3, 4],
] as const;

/** A few degrees of tilt, walked in order: photographs laid down, never dealt
 *  (the home hero's rule, and the field's). */
export const ROLLS = [-3.5, 2, -1.5, 3, -2.5, 1.5, -3, 2.5] as const;

/* ── The spec ────────────────────────────────────────────────────────────── */

export type TrailSpec = {
  /**
   * DENSITY: px of source travel between one birth and the next. The whole feel
   * of the effect lives here, and Will ruled it at 140 ("This makes it feel a
   * lot less overwhelming while still providing the overlap that keeps the
   * trail continuous with no gaps").
   */
  density: number;
  /** The card's WIDTH in px; the height follows from its aspect. */
  size: number;
  /** ms for the slide from where it was born to where the source is. */
  slideMs: number;
  /** ms a card stays whole before it starts to go. */
  holdMs: number;
  /** ms the fade takes, and ms the shrink takes, from the end of the hold. */
  fadeMs: number;
  shrinkMs: number;
  /** What the shrink shrinks to, as a fraction of the card's own size. */
  endScale: number;
  /**
   * THE LAG, as the fraction of the remaining distance the birth point covers
   * every 60th of a second. Demo one runs 0.1. It is what makes a card appear
   * BEHIND the source and chase it: with no lag there is no slide to watch, and
   * it is half of what Will picked in the flick ("Keeping the image trail behind
   * the cursor also allows better cursor visibility/tracking than keeping the
   * image directly beneath it").
   */
  lag: number;
  entrance: Entrance;
  /** How many DOM nodes the ring holds. `poolFor` derives an honest one. */
  pool: number;
  /**
   * ★ THE KEEPER. While the source rests, the newest photograph does not decay:
   * see `advance`. A cursor trail without it leaves an EMPTY screen the moment
   * the reader stops moving, which is a fine demo and a bad page.
   */
  keeper: boolean;
  /**
   * ★ THE SHY FADE, SO THE TRAIL CAN SEE THE WORDS. Left out, nothing changes.
   *
   * A cursor trail goes where the reader's hand goes, which on a page is
   * straight across the headline. The reference has no type to protect and ours
   * does: the first capture of the board had a bright reception table sitting on
   * top of the words and the eyebrow was gone.
   *
   * The house answer to media under type is to MEASURE a clear lane and place
   * the words outside it (`hero-stream.ts`), and that answer is unavailable
   * here, because the lane is wherever the cursor is. The other reachable
   * answer, a scrim over the photographs, is the one thing bible 6 refuses. So
   * the photograph yields instead: inside the words' own box a card fades to
   * `floor` and comes back over a soft edge, which reads as the trail passing
   * BEHIND the words rather than as anything being dimmed on top of them, and
   * costs the composition nothing anywhere else on the screen.
   */
  shy?: {
    /** The words' centre, in the same box px the source is in. */
    cx: number;
    cy: number;
    /** Half the words' ink, per axis. */
    hx: number;
    hy: number;
    /**
     * How much of a photograph has to lie over the words before it is all the
     * way down to `floor`, as a share of the photograph's own area. It is the
     * softness of the edge: at 0.34 a card grazing a corner barely dims and one
     * a third over the headline is already behind it.
     */
    cover: number;
    /** What a card is worth where it lies over the words. */
    floor: number;
  };
};

/**
 * HOW A PHOTOGRAPH ARRIVES. Will ruled `flick` and that is the only one the
 * site draws (`RULED` below); the other two stay because the shape of a card's
 * arrival is part of the engine's interface rather than part of its look, and a
 * source that is not a cursor reaches for a different one (a path-drawn
 * photograph has no hand to be thrown by). Nothing here picks one: a caller does.
 */
export type Entrance = "slide" | "drift" | "flick";

/** ms from birth to gone. */
export const lifeMs = (s: TrailSpec) =>
  s.holdMs + Math.max(s.fadeMs, s.shrinkMs);

/**
 * ★ THE CEILING IS A DESIGN NUMBER, NOT A SAFETY ONE. Every node in the ring is
 * a real `next/image`, and the arithmetic below asks for twenty-two at the ruled
 * density with a hurried hand. Twenty holds the DOM at a size a dead-end page
 * can afford and lets the fastest strokes recycle, which costs a photograph that
 * was already at its faintest and which nobody was going to look at.
 */
export const POOL_CEILING = 20;

/**
 * How many nodes the ring needs so a card is never overwritten while it is still
 * lit, given how fast the source moves. A pointer has no speed limit, so the
 * caller passes the speed it is willing to draw properly and anything past it
 * recycles, which is exactly what should happen: past it there are already more
 * photographs on the screen than anybody is reading.
 */
export const poolFor = (s: TrailSpec, pxPerSecond: number) =>
  Math.min(
    POOL_CEILING,
    Math.ceil((lifeMs(s) / 1000) * (pxPerSecond / s.density)) + 2,
  );

/**
 * The card's box in px, before any scale, BY SLOT rather than by card: a slot is
 * a real DOM element with a pixel box, so its shape has to hold still while the
 * ring recycles through it. The picture inside it keeps cycling by `seq`, which
 * is what varies; consecutive births take consecutive slots, so neighbours on
 * the trail still differ in shape.
 */
export function boxOf(spec: TrailSpec, slot: number) {
  const [aw, ah] = ASPECTS[slot % ASPECTS.length];
  return { w: spec.size, h: Math.round((spec.size * ah) / aw) };
}

/* ── One card ────────────────────────────────────────────────────────────── */

export type TrailCard = {
  /** Monotonic and never reused: the newest card has the highest, which IS the
   *  paint order, so nothing has to sort anything. */
  seq: number;
  /** The slot in the ring this card occupies. */
  slot: number;
  /** ms on the engine's clock. */
  bornAt: number;
  /** Where it appears, and where it is heading. */
  from: Pt;
  to: Pt;
  /** The source's direction of travel at birth, in radians. The flick's turn
   *  reads off it, and nothing else does. */
  heading: number;
  /** Into the photograph pool, the aspect cycle and the roll cycle. */
  photo: number;
  /**
   * ★ WHEN THE DECAY STARTS, which is the ONE number `advance` is allowed to
   * write after a birth, and the whole of the keeper. Normally it is fixed at
   * birth (`bornAt + holdMs`); while the source rests it is pushed forward with
   * the clock, so the newest photograph simply never begins to go.
   */
  dieFrom: number;
};

/** What the DOM wants for one card at one moment, or null when it is gone. */
export type TrailFrame = {
  x: number;
  y: number;
  /** The card's own scale, 1 at its full size. */
  scale: number;
  /** degrees */
  rot: number;
  opacity: number;
  z: number;
};

/**
 * ★ THE FLICK'S TURN, in degrees at full sideways travel, and it is the ruling
 * (Will, `entrance=flick`: "Following the way it was thrown rather than the
 * cursor feels a lot more natural and fluid"). A card is born behind the source,
 * slides after it, and turns the way it was thrown; a vertical stroke leaves it
 * square, which is what a hand does with a photograph.
 */
const FLICK = 7;

/** How far a `drift` card carries on past the source, as a share of its width. */
const DRIFT = 0.42;

/** Where a card starts its slide, as a share of its full size: a photograph is
 *  LAID DOWN rather than switched on, which is the whole of "crisp media motion
 *  design" at this scale (Will, 2026-09-18). It costs nothing and it is the
 *  difference between a sprite and a print. */
const LAND_FROM = 0.92;

/**
 * How much of its light a card keeps, given the words: 1 anywhere clear of
 * them, `floor` where it covers them, and the ramp between is the OVERLAP
 * itself. Exported so a page can measure it rather than trust it.
 *
 * ★ THE OVERLAP, NOT THE CENTRE, and the first cut of this got it wrong. A
 * 240 by 320 photograph whose centre sits 255 px above the headline still has
 * its bottom third over the eyebrow, so a rule written on the centre left
 * exactly the card that broke the capture at full strength. Measuring what the
 * card COVERS is both correct and softer: a photograph grazing a corner barely
 * dims, and one that is a third over the words is already behind them, with no
 * separate feather to tune.
 */
export function shyness(
  spec: TrailSpec,
  x: number,
  y: number,
  w: number,
  h: number,
): number {
  const s = spec.shy;
  if (!s) return 1;
  const ox =
    Math.min(x + w / 2, s.cx + s.hx) - Math.max(x - w / 2, s.cx - s.hx);
  const oy =
    Math.min(y + h / 2, s.cy + s.hy) - Math.max(y - h / 2, s.cy - s.hy);
  if (ox <= 0 || oy <= 0) return 1;
  const covered = clamp01((ox * oy) / (w * h) / s.cover);
  // Smoothstepped, so a photograph crossing the words' edge dims on a curve
  // rather than on a straight line, which is what keeps it reading as depth.
  const t = covered * covered * (3 - 2 * covered);
  return 1 - (1 - s.floor) * t;
}

/**
 * One card at one moment on the engine's clock, or null when it has gone.
 * The loop, the rest state and every measurement read THIS and nothing else,
 * so a still and a moving frame can never disagree.
 */
export function frameOf(
  c: TrailCard,
  spec: TrailSpec,
  t: number,
): TrailFrame | null {
  const age = t - c.bornAt;
  if (age < 0) return null;
  const decay = t - c.dieFrom;
  if (decay > Math.max(spec.fadeMs, spec.shrinkMs)) return null;

  const p = expoOut(clamp01(age / spec.slideMs));
  const x = c.from.x + (c.to.x - c.from.x) * p;
  const y = c.from.y + (c.to.y - c.from.y) * p;

  // The decay is a real-time clock of its own, so a card that was held by the
  // keeper decays on exactly the same curve the moment it is released.
  const d = decay <= 0 ? 0 : decay;
  const box = boxOf(spec, c.slot);
  const opacity =
    (1 - quadOut(d / spec.fadeMs)) * shyness(spec, x, y, box.w, box.h);
  const shrunk = 1 + (spec.endScale - 1) * quintOut(d / spec.shrinkMs);
  const land = LAND_FROM + (1 - LAND_FROM) * p;

  let rot = ROLLS[c.photo % ROLLS.length];
  // Sideways travel turns the card the way it was thrown; a vertical stroke
  // leaves it square, which is what a hand does with a photograph.
  if (spec.entrance === "flick") rot += FLICK * Math.cos(c.heading);

  return {
    x,
    y,
    scale: land * shrunk,
    rot,
    opacity: opacity < 0 ? 0 : opacity,
    // Newest over oldest. `seq` never wraps in a session (it rises about once
    // per `density` px of travel), and the layer writes z only when it changes.
    z: 2 + c.seq,
  };
}

/* ── The engine's state ──────────────────────────────────────────────────── */

export type TrailState = {
  /** The engine's own clock, ms. It only ever moves forward. */
  t: number;
  /** The last sample, or null before the source has said anything. */
  source: Pt | null;
  /** The lagged point a card is born at. */
  lag: Pt;
  /** Where the last card was born, which the travel rule measures from. */
  lastBirth: Pt;
  /** The next card's seq. */
  seq: number;
  /** ms the source has been still. */
  still: number;
  /** The ring. A slot is null until it has held a card. */
  cards: (TrailCard | null)[];
};

export const emptyState = (spec: TrailSpec): TrailState => ({
  t: 0,
  source: null,
  lag: { x: 0, y: 0 },
  lastBirth: { x: 0, y: 0 },
  seq: 0,
  still: 0,
  cards: Array.from({ length: spec.pool }, () => null),
});

/** Below this a sample counts as no movement at all: a pointer that has not
 *  moved still fires on a scroll, and a path's own sampling jitter is smaller
 *  than a pixel. */
const MOVED_PX = 0.5;

/** How long the source must rest before the keeper takes hold, so a pause in
 *  the middle of a stroke does not pin a photograph. */
export const KEEP_AFTER = 120;

/**
 * ★ A BURST CAP, AND THE BUG IT PREVENTS. A hidden tab, a dropped frame or a
 * pointer that jumps the width of the screen all hand this one enormous step,
 * and a travel rule would faithfully birth forty photographs along it. The cap
 * births the newest few and moves the mark, so a teleport leaves a short trail
 * near where the cursor arrived rather than a wall of cards across the frame.
 */
const MAX_BIRTHS = 4;

/**
 * ONE SAMPLE IN, THE NEXT STATE OUT. Pure: it returns a new state and mutates
 * nothing the caller handed it, so the tests can walk a path one step at a time
 * and compare, and the layer can keep the state in a ref without React knowing.
 *
 * `to` is where the source is now, `dt` how long since the last sample. A null
 * `to` means the source has nothing to say (the pointer has not entered yet),
 * which ages the cards and births nothing.
 */
export function advance(
  state: TrailState,
  spec: TrailSpec,
  sample: { to: Pt | null; dt: number },
): TrailState {
  const t = state.t + Math.max(0, sample.dt);
  const { to, dt } = sample;

  if (!to) return { ...state, t, still: state.still + Math.max(0, dt) };

  // First sample: the source appears, and nothing is born from a jump out of
  // nowhere. The lag and the birth mark start under it.
  if (!state.source) {
    return {
      ...state,
      t,
      source: to,
      lag: { ...to },
      lastBirth: { ...to },
      still: 0,
    };
  }

  const moved = dist(state.source, to);
  const still = moved > MOVED_PX ? 0 : state.still + Math.max(0, dt);

  // ★ THE LAG IS FRAME-RATE INDEPENDENT. `lag` is written as the share of the
  // remaining distance covered per 60th of a second, so a 120 Hz screen and a
  // 30 Hz one draw the same chase rather than one twice as eager as the other.
  const k = clamp01(
    1 - Math.pow(1 - clamp01(spec.lag), Math.max(0, dt) / 16.667),
  );
  const lag = {
    x: state.lag.x + (to.x - state.lag.x) * k,
    y: state.lag.y + (to.y - state.lag.y) * k,
  };

  const cards = state.cards.slice();
  let { lastBirth, seq } = state;
  let births = 0;

  while (dist(lastBirth, to) >= spec.density && births < MAX_BIRTHS) {
    births++;
    // Step the mark along the segment so several births in one frame land
    // spaced out rather than stacked on one point.
    const d = dist(lastBirth, to);
    const ux = (to.x - lastBirth.x) / d;
    const uy = (to.y - lastBirth.y) / d;
    lastBirth = {
      x: lastBirth.x + ux * spec.density,
      y: lastBirth.y + uy * spec.density,
    };
    const slot = seq % spec.pool;
    cards[slot] = {
      seq,
      slot,
      bornAt: t,
      // Born BEHIND the source and heading for it, which is the half of the
      // ruling that is not the turn ("Keeping the image trail behind the cursor
      // also allows better cursor visibility/tracking"). `drift` is the one
      // arrival that is laid at the mark and carries on past it instead.
      from: spec.entrance === "drift" ? { ...lastBirth } : { ...lag },
      to:
        spec.entrance === "drift"
          ? {
              x: lastBirth.x + ux * spec.size * DRIFT,
              y: lastBirth.y + uy * spec.size * DRIFT,
            }
          : { ...to },
      heading: Math.atan2(uy, ux),
      photo: seq,
      dieFrom: t + spec.holdMs,
    };
    seq++;
  }

  // A cap that fired leaves the mark where the source is, so the next stroke
  // measures from here rather than from a point the pointer left long ago.
  if (births >= MAX_BIRTHS) lastBirth = { ...to };

  /**
   * ★ THE KEEPER. Without it a trail leaves an EMPTY screen the moment the
   * reader stops moving. So while the source rests, the newest photograph's
   * decay clock is pushed along with the engine's, and it simply holds, whole
   * and lit, under the cursor. Move again and it is released at the instant of
   * the move and decays on the ordinary curve with the rest of the trail. One
   * number, no second mechanism, and the reader discovers they have been
   * carrying a photograph.
   */
  if (spec.keeper && still >= KEEP_AFTER && seq > 0) {
    const newest = cards[(seq - 1) % spec.pool];
    if (newest && newest.seq === seq - 1 && t > newest.dieFrom) {
      cards[newest.slot] = { ...newest, dieFrom: t };
    }
  }

  return { t, source: to, lag, lastBirth, seq, still, cards };
}

/**
 * ★ WHETHER ANYTHING IS STILL CHANGING, which is what lets the loop STOP rather
 * than spin. At rest with the keeper standing, one photograph is held whole and
 * everything behind it has decayed away, so every following frame would write
 * the identical transform to the identical node: the cheapest frame is the one
 * never asked for. The layer wakes on the next pointer move.
 */
export function atRest(state: TrailState, spec: TrailSpec): boolean {
  if (!spec.keeper || state.still < KEEP_AFTER || state.seq === 0) return false;
  const held = (state.seq - 1) % spec.pool;
  for (const c of state.cards) {
    if (!c || c.slot === held) continue;
    if (frameOf(c, spec, state.t)) return false;
  }
  return true;
}

/* ── The path: a source that is not a cursor ─────────────────────────────── */

/**
 * A PATH IS A FUNCTION OF TIME, in box px. That is the whole interface, and it
 * is what makes `phone=walks` the same object as the cursor trail rather than a
 * second effect that looks like it.
 */
export type Path = (t: number) => Pt;

/**
 * ★ THE WALK, AND WHY IT IS NOT THE CAPTURE'S SWEEP. Will picked `walks` ("It
 * draws itself... walking its own path at the same pace, so the screen is alive
 * the moment it is opened and a finger is never asked for") and added the one
 * open note on it: "Different path than current". The current one was a pair of
 * sines that traced the SAME figure every visit, which is fine for a capture and
 * wrong for a page: a reader who lands on the 404 twice would watch the same
 * choreography twice.
 *
 * This is a sum of sines with periods that do not divide each other, so it is a
 * slow random walk that never repeats inside a visit, wanders the whole box, and
 * is still the same curve every time it is COMPUTED, which the still, the loop
 * and a test all depend on. `phase` is where a visit starts on it, so a page can
 * open somewhere else on the figure every time without the curve itself moving.
 */
export const wanderPath =
  (o: {
    centre: Pt;
    rx: number;
    ry: number;
    /** Radians a second of the walk's own parameter; `wanderSpeed` derives it. */
    speed: number;
    phase: number;
  }): Path =>
  (t) => {
    const u = (t / 1000) * o.speed + o.phase;
    return {
      x:
        o.centre.x +
        o.rx * (0.62 * Math.sin(u) + 0.38 * Math.sin(u * 2.3 + 1.1)),
      y:
        o.centre.y +
        o.ry * (0.58 * Math.cos(u * 1.3) + 0.42 * Math.sin(u * 0.7 + 2.2)),
    };
  };

/**
 * ★ THE WALK'S PACE IS SET IN PX A SECOND, NOT IN RADIANS, which is what makes
 * "at the same pace" (Will's own words for `walks`) a number rather than a hope.
 * A birth is a function of TRAVEL, so a walk at the pace a hand moves lays
 * photographs down at the beat a hand does, whatever the box's shape.
 *
 * ★ AND IT IS MEASURED, NOT DERIVED, because the closed form is wrong by up to
 * a sixth. The obvious formula is the root mean square of the two axes
 * (`speed` × sqrt(0.574·rx² + 0.327·ry²)); what a trail actually travels is the
 * mean of |v|, which is lower than its RMS by an amount that depends on how
 * anisotropic the figure is: 0.83 of it in a wide flat box, 0.93 in a tall
 * narrow one. So this walks the curve once at unit speed, reads its real arc
 * length, and scales. The parameter is linear in time, so arc length per second
 * is exactly proportional to `speed` and one pass answers every pace.
 *
 * It is about three thousand multiplications, run once when a box is measured
 * and never inside the loop. `trail-engine.test.ts` measures the walk it
 * returns against the pace it was asked for, at three box shapes.
 */
export function wanderSpeed(rx: number, ry: number, pxPerSecond: number) {
  const unit = wanderPath({
    centre: { x: 0, y: 0 },
    rx,
    ry,
    speed: 1,
    phase: 0,
  });
  // At unit speed the parameter advances one radian a second, so four minutes
  // covers enough periods of all four components (0.7, 1, 1.3 and 2.3) for the
  // average to be the figure's own rather than one lobe of it: a shorter window
  // lands about a percent out on a wide flat box, which is a percent of pace.
  const span = 240_000;
  const step = 20;
  let travelled = 0;
  for (let t = step; t <= span; t += step)
    travelled += dist(unit(t - step), unit(t));
  return pxPerSecond / (travelled / (span / 1000));
}

/**
 * A SPIRAL ARM: a point that leaves a rim and winds outward as it turns, which
 * is a figure drawn as a CURVE rather than emitted as particles. Two of these
 * 180 degrees apart are two arms, and the trail each drops behind it is the
 * decay. It is here rather than at its one call site because it is the second
 * proof that the source is an interface: swap the function and the same engine
 * draws a different object.
 *
 * `r0` is the rim, `grow` how much the y axis is squashed, `turn` degrees a
 * second, `phase` the arm's own start angle, `t0` how far into its own sweep it
 * starts (two arms that restart together leave the frame briefly bare twice a
 * cycle; half a sweep apart, one is always climbing while the other arrives).
 */
export const spiralPath =
  (o: {
    centre: Pt;
    r0: number;
    grow: number;
    turn: number;
    phase: number;
    /** px a second along the ray. */
    speed: number;
    /** Past this the arm restarts at the rim, so the figure is a loop. */
    rMax: number;
    t0?: number;
  }): Path =>
  (t) => {
    const span = (o.rMax - o.r0) / o.speed; // seconds for one sweep
    const at = t + (o.t0 ?? 0);
    const u = ((((at / 1000) % span) + span) % span) / span;
    const r = o.r0 + (o.rMax - o.r0) * u;
    const a = ((o.phase + o.turn * (at / 1000)) * Math.PI) / 180;
    return {
      x: o.centre.x + Math.cos(a) * r,
      y: o.centre.y + Math.sin(a) * r * o.grow,
    };
  };

/* ── The replay: the still and every measurement ─────────────────────────── */

/** The sampling step a replay walks at: 16 ms is a 60 Hz hand, which is what
 *  the live loop gets, so the still is the loop and not an approximation. */
export const REPLAY_STEP = 16;

/**
 * Walk one or more paths from zero to `upto` and hand back the states. Several
 * paths get one ring each but share one paint order, so two figures read as one
 * object rather than as one drawn over the other.
 */
export function replay(
  spec: TrailSpec,
  paths: readonly Path[],
  upto: number,
): TrailState[] {
  const states = paths.map(() => emptyState(spec));
  for (let t = 0; t <= upto; t += REPLAY_STEP) {
    for (let i = 0; i < paths.length; i++) {
      states[i] = advance(states[i], spec, {
        to: paths[i](t),
        dt: t === 0 ? 0 : REPLAY_STEP,
      });
    }
  }
  return states;
}

/** Every card of a replay that is still lit, newest last, as the layer paints
 *  them: one flat list, so a still is a list of pictures and nothing more. */
export function litAt(
  states: readonly TrailState[],
  spec: TrailSpec,
  t: number,
) {
  const out: { card: TrailCard; frame: TrailFrame; source: number }[] = [];
  for (let i = 0; i < states.length; i++) {
    for (const c of states[i].cards) {
      if (!c) continue;
      const f = frameOf(c, spec, t);
      if (!f || f.opacity <= 0.01) continue;
      out.push({ card: c, frame: f, source: i });
    }
  }
  return out.sort((a, b) => a.frame.z - b.frame.z);
}

/**
 * WHAT A SPEC COSTS, MEASURED RATHER THAN CLAIMED, on the path it will be drawn
 * with: the most photographs lit at one instant, the fewest, and how often one
 * is born. Every number a page's words or a Library hint states is read off
 * this, so a retune turns a test red instead of leaving a claim that says one
 * thing while the screen draws another.
 */
export function factsOf(
  spec: TrailSpec,
  paths: readonly Path[],
  over: number,
  /**
   * ★ THE BOX, SO "LIT" MEANS ON SCREEN. A path that sweeps past the edge leaves
   * photographs still fading where nobody can see them, and counting those would
   * put a number on a claim that is true of the arithmetic and false of the
   * picture.
   */
  within?: Box,
): { lit: number; quiet: number; beat: number; nodes: number; born: number } {
  const states = paths.map(() => emptyState(spec));
  let lit = 0;
  /**
   * ★ AND THE QUIETEST INSTANT, which is the number a busiest-instant count
   * cannot see. A path whose sweep runs past the edge of the screen leaves the
   * page BARE for seconds at a time while its peak still reads healthy; that
   * reached a capture once, and a floor under it is what catches it.
   */
  let quiet = Infinity;
  let born = 0;
  for (let t = 0; t <= over; t += REPLAY_STEP) {
    for (let i = 0; i < paths.length; i++) {
      const before = states[i].seq;
      states[i] = advance(states[i], spec, {
        to: paths[i](t),
        dt: t === 0 ? 0 : REPLAY_STEP,
      });
      born += states[i].seq - before;
    }
    // The first life is a ramp from an empty screen, so the busiest instant is
    // only meaningful once the trail has filled.
    if (t < lifeMs(spec)) continue;
    const seen = litAt(states, spec, t);
    const n = within
      ? seen.filter(
          ({ frame }) =>
            frame.x > -spec.size / 2 &&
            frame.x < within.w + spec.size / 2 &&
            frame.y > -spec.size &&
            frame.y < within.h + spec.size,
        ).length
      : seen.length;
    if (n > lit) lit = n;
    if (n < quiet) quiet = n;
  }
  return {
    lit,
    quiet: Number.isFinite(quiet) ? quiet : 0,
    beat: born > 0 ? Math.round(over / born) : 0,
    nodes: spec.pool * paths.length,
    born,
  };
}

/* ── THE RULED LOOK ──────────────────────────────────────────────────────── */

/**
 * ★ ONE LOOK, WILL'S, AND NO OPTIONS. The board offered three densities, three
 * decays, three entrances, three sizes and four phone answers; he answered each
 * one (2026-09-19) and the matrix collapses to the table below. A number here is
 * a RULING, so changing one is a design decision and not a tune: the board's
 * option tables retired with the board, and the table below holds his words.
 *
 *   density  d140  "less overwhelming while still providing the overlap that
 *                   keeps the trail continuous with no gaps"
 *   decay    long  at his own number: "I'd maybe even suggest 3 seconds to calm
 *                   it down just a bit", with the shrink slower than the fade
 *                   and a third of the card's size kept at the end
 *   entrance flick "Following the way it was thrown rather than the cursor"
 *   size     s180  180 px, and 100 on a phone
 */
const RULED = {
  /** px of travel between births, stated at the 180 px card and scaled with it,
   *  so "half a photograph apart" means the same thing on both screens. */
  density: 140,
  slideMs: 760,
  /**
   * Three seconds from birth to gone (`holdMs + shrinkMs`), the shrink running
   * longer than the fade so the tail reads as depth rather than as a dimmer.
   */
  holdMs: 500,
  fadeMs: 2440,
  shrinkMs: 2500,
  endScale: 0.34,
  lag: 0.1,
} as const;

/**
 * ★ THE SHY FADE, AND WHY IT IS A WINDOW RATHER THAN A DIMMER (the trail-wiring
 * lane, 2026-09-19). The mechanism is Will's and it is kept: a photograph goes
 * faint where it crosses the words and comes back over a soft edge, so the trail
 * reads as passing BEHIND them and never as a scrim laid on top (bible 6). What
 * changed is where it is applied, and measurement is what changed it.
 *
 * The board dimmed each CARD by how much of its own area lay over the block.
 * Driving a hand straight across the real 404 and sampling the composited pixels
 * inside each line's own glyph boxes found the description line at **1.49:1**,
 * and retuning the two numbers moved it between 2.2 and 5.1 from run to run.
 * Both failures are structural, not tuning:
 *
 *   · a card is one opacity, so a card half over the block dimmed the half that
 *     was on clean paper too, for no reason a reader can see; and
 *   · the trail OVERLAPS by design at this density, so two faint cards over one
 *     line composite to nearly twice one card's weight, and three to three
 *     times. A per-card floor can only ever be a lottery.
 *
 * A window on the LAYER fixes both at once. The layer isolates, so the cards
 * composite among themselves FIRST and the window applies to the result: the
 * floor becomes a guarantee whatever stacks inside it, and a card is clipped
 * rather than dimmed, so the part of it standing on clean paper stays whole.
 *
 * `FLOOR` is what the trail is worth over the words. A photograph that is solid
 * black, at this floor over paper, still leaves the muted description 4.87:1 and
 * the headline 13.4:1, so the worst case clears the body-copy bar rather than
 * landing near it. `FEATHER` is how far outside the block the window opens back
 * up, as a share of the card's own width: half a photograph, so a card crossing
 * the edge dissolves over its own width rather than hitting a wall.
 */
export const SHY = { floor: 0.16, feather: 0.5 } as const;

/**
 * The window the words punch in the layer, in px along each axis, plus the alpha
 * each of its two gradients carries.
 *
 * ★ THE ALPHA IS NOT THE FLOOR, and this is the one piece of arithmetic the CSS
 * cannot do for itself. A rectangular window needs two gradients (one per axis)
 * whose OPAQUE regions union, and CSS composites mask layers with `add`, which
 * is `a + b - ab` rather than `max(a, b)`. Outside either band that is still 1,
 * which is right; inside both it would be `2f - f²`, which is nearly twice the
 * floor. So each gradient carries `1 - sqrt(1 - floor)`, whose union is exactly
 * the floor. Pure, so `trail-engine.test.ts` can hold it to that.
 */
export function shyWindow(
  box: Box,
  words: { cx: number; cy: number; hx: number; hy: number },
) {
  const feather = Math.round(screenOf(box).size * SHY.feather);
  return {
    x0: Math.round(words.cx - words.hx - feather),
    x1: Math.round(words.cx - words.hx),
    x2: Math.round(words.cx + words.hx),
    x3: Math.round(words.cx + words.hx + feather),
    y0: Math.round(words.cy - words.hy - feather),
    y1: Math.round(words.cy - words.hy),
    y2: Math.round(words.cy + words.hy),
    y3: Math.round(words.cy + words.hy + feather),
    alpha: +(1 - Math.sqrt(1 - SHY.floor)).toFixed(4),
  };
}

/**
 * ★ A PHONE IS NOT A SMALL DESKTOP. Only the card's size changes, and the
 * density follows it, because both are a share of the column rather than a pixel
 * count; the decay, the slide and the lag are the same clocks at both, which is
 * what keeps one ruling covering both screens.
 *
 * `walk` is the pace the path travels at when nothing is driving the trail, and
 * it is the pace the board's own scripted hand measured at (about 500 px a
 * second across 1440), so the beat Will judged is the beat a page opens on.
 * `hand` is the speed the ring is sized for: a phone has no cursor to outrun, so
 * its ring is sized for its own walk exactly.
 */
const SCREEN = {
  desktop: { size: 180, walk: 500, hand: 900, rx: 0.4, ry: 0.38 },
  /**
   * ★ A PHONE'S WALK REACHES FURTHER, and the reason is the words. A column is
   * narrow enough that the 404's block fills almost all of it, so a walk with a
   * laptop's reach spends its whole visit behind the words and the screen Will
   * asked to be "alive the moment it is opened" opens on four ghosts. Reaching
   * nearly to the top and bottom edges puts the clear bands above and below the
   * block inside the figure, and a sine DWELLS at its extremes (its time is
   * arcsine-distributed), so widening the reach spends proportionally more of
   * the visit exactly where there is nothing to stay off.
   */
  phone: { size: 100, walk: 210, hand: 210, rx: 0.44, ry: 0.46 },
} as const;

/** Below this the phone's numbers apply: the board asked its phone question of
 *  "the page below 640 px", which is the site's own phone breakpoint. */
export const PHONE_BELOW = 640;

export const screenOf = (box: Box) =>
  box.w < PHONE_BELOW ? SCREEN.phone : SCREEN.desktop;

/**
 * The ruled spec for a real box. The words it has to stay off are not in here:
 * they are a WINDOW on the layer (`shyWindow`), measured off the rendered block
 * rather than declared, so the shy fade tracks the actual lines at any width
 * instead of a table that was true at two.
 */
export function trailSpec(box: Box): TrailSpec {
  const screen = screenOf(box);
  const base: TrailSpec = {
    ...RULED,
    size: screen.size,
    density: Math.round(RULED.density * (screen.size / SCREEN.desktop.size)),
    entrance: "flick",
    pool: 8,
    keeper: true,
  };
  // The ring is derived from the life and the density rather than typed, so a
  // longer decay or a denser trail pays for its own nodes.
  return { ...base, pool: poolFor(base, screen.hand) };
}

/**
 * The walk for a real box: the whole box wandered at the ruled pace, reaching to
 * within a tenth of each edge so photographs land in the strips the words leave
 * clear and not only behind them (the board's capture at 375 drew every card
 * behind the type until its stroke was widened).
 */
export function trailWalk(box: Box, phase = 0): Path {
  const screen = screenOf(box);
  const rx = box.w * screen.rx;
  const ry = box.h * screen.ry;
  return wanderPath({
    centre: { x: box.w / 2, y: box.h / 2 },
    rx,
    ry,
    speed: wanderSpeed(rx, ry, screen.walk),
    phase,
  });
}

/**
 * The moment the resting composition is frozen at: past one whole life, so what
 * a reader meets is a trail in flight with its tail already decaying, never a
 * trail still filling up from nothing.
 */
export const stillAt = (spec: TrailSpec) => Math.round(lifeMs(spec) * 2.4);

/**
 * ★ AND THE COMPOSITION IS CHOSEN, NOT DEALT. Where a visit opens on the walk
 * decides what the FIRST frame looks like, and the first frame is what a reader
 * who asked for less motion looks at for as long as they are on the page. Left
 * to chance, one visit meets the trail streaming across the paper and the next
 * meets it entirely behind the words, which is a blank 404 with a ghost on it.
 *
 * So a handful of openings are tried and the best one is kept: the score is how
 * much lit photograph is standing CLEAR of the words at that moment, which is
 * exactly what makes a composition rather than a smudge. The candidates are
 * random, so a reader who lands here twice still does not watch the same
 * choreography twice; only the floor under it is raised.
 *
 * It is a few thousand arithmetic steps, run once when a box is measured, never
 * in the loop, and `rand` is a parameter so a test can walk it.
 */
export function pickPhase(
  spec: TrailSpec,
  box: Box,
  words: { cx: number; cy: number; hx: number; hy: number } | undefined,
  rand: () => number = Math.random,
  tries = 5,
): number {
  const at = stillAt(spec);
  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < tries; i++) {
    const phase = rand() * 600;
    const lit = litAt(replay(spec, [trailWalk(box, phase)], at), spec, at);
    let score = 0;
    for (const { frame } of lit) {
      if (frame.x < 0 || frame.x > box.w || frame.y < 0 || frame.y > box.h)
        continue;
      // A photograph the words are standing on is not part of the composition.
      if (
        words &&
        Math.abs(frame.x - words.cx) < words.hx &&
        Math.abs(frame.y - words.cy) < words.hy
      )
        continue;
      score += frame.opacity * frame.scale;
    }
    if (score > bestScore) {
      bestScore = score;
      best = phase;
    }
  }
  return best;
}
