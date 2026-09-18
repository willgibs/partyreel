/**
 * THE IMAGE TRAIL ENGINE (the image-trail lane, 2026-09-18).
 *
 * OUR OWN, WRITTEN FROM SCRATCH, with Codrops' "Image Trail Effects" demo one
 * read once for its numbers and nothing else: no file, no photograph and no
 * line of theirs is in this repo, and no dependency was added for it (no GSAP).
 * What their demo taught, in one sentence: a photograph is born every time the
 * cursor has travelled far enough, it appears where the cursor WAS and slides
 * to where the cursor IS, and then it fades and shrinks away. Density is the
 * travel threshold, pace is the slide, and the decay is the fade and the
 * shrink. Everything below is that sentence made ours.
 *
 * ★ A CARD'S WHOLE LIFE IS DECIDED AT BIRTH, which is the one structural choice
 * everything else hangs off. A card records where it came from, where it is
 * going and when it was born; after that its position, its scale, its turn and
 * its opacity are a CLOSED FORM of its age. So there is no per-frame
 * integration to drift, no accumulated rounding, and the same card at the same
 * age draws the same pixels on the server, in a node test and in the browser.
 * It is the home hero's discipline (`hero-stream.ts`) applied to a source that
 * is not a clock.
 *
 * ★ THE SOURCE IS AN INTERFACE, WHICH IS WHY TWO BOARDS SHARE ONE ENGINE. The
 * engine never asks where a position came from. `advance` takes one sample, so
 * the pointer feeds it a cursor and `privacy-hero` feeds it a PATH walked at a
 * pace: the privacy hero is this trail with a curve where the cursor would be.
 * Round one of that board emitted particles from a turning nozzle and Will
 * answered none; a path that drops a decaying trail behind it is the same
 * picture with the thing he asked for (the trailing photographs decaying)
 * built into the mechanism rather than bolted beside it.
 *
 * ★ THE STILL IS A REPLAY, NOT A SPECIAL CASE. `replay` walks any path from
 * zero to a chosen moment and hands back the state it reaches, so the rest
 * state, the reduced-motion composition, a reader with scripting off, the
 * headless capture and `lab:demo` (which emulates reduced motion, so a board
 * whose options differ only while moving would compare as identical) are all
 * ONE picture, computed the same way the live loop computes its frames. That
 * is also the scripted pointer path the manifest asks for: a headless browser
 * has no cursor, so the capture is the replay.
 *
 * ★ THE POOL IS A RING. A birth takes the next slot and overwrites whatever was
 * there, which is always the most decayed card, so the DOM node count is fixed
 * and a violent flick of the mouse costs nothing but recycling.
 *
 * Pure: no React, no stylesheet, no `env`. `trail-engine.test.ts` reads exactly
 * these tables, and `trail-layer.tsx` is the only thing that turns them into
 * pixels.
 */

/* ── Primitives ──────────────────────────────────────────────────────────── */

export type Pt = { x: number; y: number };

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
 *  than as a dimmer switch. */
export const quintOut = (t: number) => {
  const u = 1 - clamp01(t);
  return 1 - u * u * u * u * u;
};

/**
 * The shapes a trail is made of, walked in order rather than dealt. Portrait
 * first because that is what a phone takes and what Will's two screenshots of
 * the reference show; the square and the wider one keep a run of cards from
 * reading as a printed contact sheet. Each is `w : h` at the card's own size.
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

/** How a photograph arrives. */
export type Entrance = "slide" | "drift" | "flick";

export type TrailSpec = {
  /**
   * DENSITY: px of source travel between one birth and the next. The whole
   * feel of the effect lives here. Demo one uses 100 at a desktop.
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
  entrance: Entrance;
  /**
   * THE LAG, as the fraction of the remaining distance the birth point covers
   * every 60th of a second. Demo one runs 0.1. It is what makes a card appear
   * BEHIND the cursor and chase it: with no lag there is no slide to watch.
   */
  lag: number;
  /** How many DOM nodes the ring holds. `poolFor` derives an honest one. */
  pool: number;
  /**
   * THE KEEPER (this lane's proposal): while the source rests, the newest
   * photograph does not decay. See `advance`.
   */
  keeper: boolean;
  /**
   * ★ THE LOCKUP, SO THE TRAIL CAN SEE IT. Left out, nothing changes.
   *
   * A cursor trail goes where the reader's hand goes, which on a hero is
   * straight across the headline. The reference has no type to protect and ours
   * does: the first capture of this board had a bright reception table sitting
   * on top of the words PRIVACY AND TRUST, and the eyebrow was gone.
   *
   * The house answer to media under type is to MEASURE a clear lane and place
   * the words outside it (`hero-stream.ts`), and that answer is unavailable
   * here, because the lane is wherever the cursor is. The other reachable
   * answer, a scrim over the photographs, is the one thing bible 1 refuses. So
   * the photograph yields instead: inside the lockup's own box a card fades to
   * `floor` and comes back over a soft edge, which reads as the trail passing
   * BEHIND the words rather than as anything being dimmed on top of them, and
   * costs the composition nothing anywhere else on the screen.
   */
  shy?: {
    /** The lockup's centre, in the same canvas px the source is in. */
    cx: number;
    cy: number;
    /** Half the lockup's ink, per axis. */
    hx: number;
    hy: number;
    /**
     * How much of a photograph has to lie over the words before it is all the
     * way down to `floor`, as a share of the photograph's own area. It is the
     * softness of the edge: at 0.35 a card grazing a corner barely dims and one
     * a third over the headline is already behind it.
     */
    cover: number;
    /** What a card is worth where it lies over the words. */
    floor: number;
  };
};

/** ms from birth to gone. */
export const lifeMs = (s: TrailSpec) =>
  s.holdMs + Math.max(s.fadeMs, s.shrinkMs);

/**
 * How many nodes the ring needs so a card is never overwritten while it is still
 * lit, given how fast the source moves. A pointer has no speed limit, so the
 * caller passes the speed it is willing to draw properly and anything past it
 * recycles, which is exactly what should happen: at 2,000 px a second there are
 * already more photographs on the screen than anybody is reading.
 *
 * ★ AND A CEILING, WHICH IS A DESIGN NUMBER, NOT A SAFETY ONE. The arithmetic
 * asks for sixty nodes at the densest option and a hurried hand; sixty
 * photographs is not a trail, it is a wall, and every one of them is a real
 * `next/image` on a marketing hero. The ceiling holds the DOM at a size a hero
 * can afford and lets the fastest strokes recycle, which costs a photograph
 * nobody was going to look at.
 */
export const POOL_CEILING = 24;

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
  /** The source's direction of travel at birth, in radians. The flick reads
   *  off it, and nothing else does. */
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

/** How far a `drift` card carries on past the cursor, as a share of its width. */
const DRIFT = 0.42;

/** The flick's turn, in degrees, at full sideways travel. */
const FLICK = 7;

/** Where a card starts its slide, as a share of its full size: a photograph is
 *  LAID DOWN rather than switched on, which is the whole of "crisp media motion
 *  design" at this scale (Will, 2026-09-18). It costs nothing and it is the
 *  difference between a sprite and a print. */
const LAND_FROM = 0.92;

/**
 * How much of its light a card keeps, given the lockup: 1 anywhere clear of the
 * words, `floor` where it covers them, and the ramp between is the OVERLAP
 * itself. Exported so the boards can measure it rather than trust it.
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
  // Smoothstepped, so a photograph crossing the lockup's edge dims on a curve
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
  if (spec.entrance === "flick") {
    // Sideways travel turns the card the way it was thrown; a vertical stroke
    // leaves it square, which is what a hand does with a photograph.
    rot += FLICK * Math.cos(c.heading);
  }

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
  /** The lagged point a `slide` card is born at. */
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
const KEEP_AFTER = 120;

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
    const heading = Math.atan2(uy, ux);
    const slot = seq % spec.pool;
    const from =
      spec.entrance === "slide" || spec.entrance === "flick"
        ? { ...lag }
        : { ...lastBirth };
    const target =
      spec.entrance === "drift"
        ? {
            // It carries on the way the source was going, so the trail reads as
            // thrown forward rather than pulled along.
            x: lastBirth.x + ux * spec.size * DRIFT,
            y: lastBirth.y + uy * spec.size * DRIFT,
          }
        : { ...to };
    cards[slot] = {
      seq,
      slot,
      bornAt: t,
      from,
      to: target,
      heading,
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
   * reader stops moving, which is a fine demo and a bad hero: the first screen
   * of a marketing page cannot depend on the cursor to have anything on it. So
   * while the source rests, the newest photograph's decay clock is pushed along
   * with the engine's, and it simply holds, whole and lit, under the cursor.
   * Move again and it is released at the instant of the move and decays on the
   * ordinary curve with the rest of the trail. One number, no second mechanism,
   * and the reader discovers they have been carrying a photograph.
   */
  if (spec.keeper && still >= KEEP_AFTER && seq > 0) {
    const newest = cards[(seq - 1) % spec.pool];
    if (newest && newest.seq === seq - 1 && t > newest.dieFrom) {
      cards[newest.slot] = { ...newest, dieFrom: t };
    }
  }

  return { t, source: to, lag, lastBirth, seq, still, cards };
}

/* ── Paths: a source that is not a cursor ────────────────────────────────── */

/**
 * A PATH IS A FUNCTION OF TIME, in canvas px. That is the whole interface, and
 * it is what lets `privacy-hero` be this trail with a curve where the cursor
 * would be, and what lets a headless capture of the POINTER board draw a real
 * trail: the scripted pointer path below is a path like any other.
 */
export type Path = (t: number) => Pt;

/**
 * THE SCRIPTED POINTER, for every capture and for `lab:demo`.
 *
 * A headless browser has no cursor, and `lab:demo` emulates reduced motion on
 * top of that, so a board that only draws while a hand is moving would be
 * compared as a blank stage against a blank stage and pass for the wrong
 * reason. This is the hand: one continuous stroke that crosses the frame, turns
 * back through the middle and leaves, so a capture shows the trail at its
 * densest AND its decay at the tail. Two frequencies that do not divide each
 * other, so the curve never retraces itself inside one pass.
 */
export const scriptedPointer =
  (w: number, h: number): Path =>
  (t) => {
    const u = t / 1000;
    return {
      // ★ IT HAS TO REACH THE EDGES, and the first cut did not. At 375 the
      // lockup fills nearly the whole column, so a hand that stayed in the
      // middle drew every photograph behind the words and the capture showed a
      // phone with no trail on it at all. These amplitudes take the stroke to
      // within a tenth of each edge, so a still shows both the photographs over
      // the type and the ones in the strips it leaves clear.
      x: w * (0.5 + 0.4 * Math.sin(u * 0.9)),
      y: h * (0.5 + 0.38 * Math.sin(u * 1.4 + 0.6)),
    };
  };

/**
 * THE PRIVACY HERO'S SPIRAL ARM: a point that leaves the lockup's rim and winds
 * outward as it turns, which is the figure Will loved on round three ("the
 * images popping in spiraling opposite two sides") drawn as a CURVE rather than
 * emitted as particles. Two of these 180 degrees apart are the two arms, and
 * the trail each drops behind it is the decay he asked for.
 *
 * `r0` is the rim, `grow` how many px it climbs per turn, `turn` degrees a
 * second, `phase` the arm's own start.
 */
export const spiralPath =
  (o: {
    centre: Pt;
    r0: number;
    grow: number;
    turn: number;
    phase: number;
    /** px a second along the ray, which is what "pace" sets. */
    speed: number;
    /** Past this the arm restarts at the rim, so the figure is a loop. */
    rMax: number;
    /**
     * ★ HOW FAR INTO ITS OWN SWEEP THIS ARM STARTS, in ms. Two arms that restart
     * together leave the hero briefly bare twice a cycle; half a sweep apart,
     * one is always climbing while the other is arriving. The caller sets the
     * angle to match, so the two are still opposite.
     */
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

/**
 * THE WANDER: the trail's own lag fed by a slow, DETERMINISTIC random walk, as
 * the alternative the manifest names. A sum of sines with incommensurable
 * periods is a random walk that never repeats inside a visit and is the same
 * curve every time it is drawn, which a real random walk is not: the still, the
 * capture and the live page have to agree.
 */
export const wanderPath =
  (o: {
    centre: Pt;
    rx: number;
    ry: number;
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

/* ── The replay: the still, the capture and every measurement ────────────── */

/** The sampling step a replay walks at: 16 ms is a 60 Hz hand, which is what
 *  the live loop gets, so the still is the loop and not an approximation. */
export const REPLAY_STEP = 16;

/**
 * Walk one or more paths from zero to `upto` and hand back the state. Several
 * paths share ONE engine state (the privacy hero's two arms are one trail with
 * two sources), so they compete for the same ring and paint in one z order,
 * which is what makes two arms read as one object.
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
 *  them: one flat list so a still is a list of pictures and nothing more. */
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
 * with: the most photographs lit at one instant, how often one is born, and how
 * far a card travels while it is lit. Every number a board's words state is
 * read off this, so a retune turns a test red instead of leaving a tile that
 * says one thing and draws another.
 */
export function factsOf(
  spec: TrailSpec,
  paths: readonly Path[],
  over: number,
  /**
   * ★ THE SCREEN, SO "LIT" MEANS ON SCREEN. A path that sweeps past the edge
   * leaves photographs still fading where nobody can see them, and counting
   * those would put a number on a tile that is true of the arithmetic and false
   * of the picture. Left out, every card counts, which is right for a source
   * that stays inside the frame.
   */
  within?: { w: number; h: number },
): { lit: number; quiet: number; beat: number; nodes: number; born: number } {
  const states = paths.map(() => emptyState(spec));
  let lit = 0;
  /**
   * ★ AND THE QUIETEST INSTANT, which is the number a busiest-instant count
   * cannot see. An arm whose sweep runs past the edge of the screen leaves the
   * hero BARE for seconds at a time while its peak still reads healthy; that
   * reached a capture once, and the board's own test now holds a floor under it.
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
