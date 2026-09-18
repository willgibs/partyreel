/**
 * THE RIVER'S ENGINE: the arithmetic of one flow of photographs falling through
 * a box, and nothing else (no React, no DOM), so the server, the browser and a
 * test all compute the same frame.
 *
 * Copied out of the lab's `sandbox/river-visual/river.tsx` when Will answered
 * `guest-photos=ghost` (2026-09-18: "This is an immediate upgrade to the 'this
 * is where it all lands' empty state"), which is its first production home.
 * COPIED, NOT MOVED: the `river-card` board still imports the lab file while it
 * builds, and river-visual's own wiring retires it and points the card here.
 * What came across is what production needs: the flow, the clock, the rest
 * state. What stayed in the lab: the three origins (the demo code, the plain
 * plate, and the Link and the scan floor that came with them), the caption, the
 * tone pairs (production reads the ruled `--shadow-lift`, which is already
 * per ground) and the manifest stills. Nothing pours out of an object here:
 * the flow arrives from above the frame already falling, which is the lab's
 * `origin: "none"`, as the option was drawn.
 *
 * ★ EVERY LENGTH IS A FRACTION OF THE BOX'S WIDTH. The lab took the box in px;
 * production takes it from its container, and the arithmetic is linear in the
 * width, so the whole flow is computed once in width units and handed to CSS
 * as percentages of each card's OWN box (see `frameAt`). That is what lets the
 * server paint the rest state at a width it cannot know, lets the flow survive
 * a resize with no listener, and keeps the loop's writes to transform and
 * opacity alone: no measuring, no container unit resolved per frame.
 *
 * WHAT IS KEPT from the lab, because it was the good part (the lab's header has
 * the long form). A card's progress is a closed form of the clock,
 * (slot * launch * reveal + elapsed) mod cycle / flight: no state, no timers,
 * no per-card bookkeeping, and recycling falls out of the modulo. The cadence
 * divides the flight exactly, so every frame is airborne and gravity does the
 * spacing. The fan opens over the first third of the DISTANCE fallen. A frame
 * leaves at an angle and lands square. And a card is recycled only once its TOP
 * EDGE is past the bottom dissolve, never its centre, so nothing pops.
 */

/* ── The clock ── */

/** One card's whole life, in ms. A constant and not a function of the box, so
 *  two rivers on one page pour in step whatever their sizes. */
const FLIGHT = 7600;

/**
 * The cycle as a share of the flight. The gap between two launches is the
 * flight times this over the card count, deliberately a hair SHORTER than an
 * even split, so every card in the pool is always airborne and the stream has
 * no gaps. It is also the ceiling a card's progress wraps at, so a card must
 * be gone before it (`OVER_TRAVEL` below, and the test that holds it).
 */
const CYCLE_SHARE = 0.965;

/** The pour: one tween that fans the seeded launch offsets apart, once. */
export const REVEAL_MS = 1500;

/** How much of the DISTANCE fallen the fan opens over. Distance and not
 *  flight: the fall is gravity weighted, so a third of the flight is a tenth
 *  of the distance. */
const OPEN = 0.34;

/**
 * ★ THE PROGRESS BY WHICH EVERY CARD HAS LEFT, against the cycle's ceiling of
 * 0.965. The fall's length is solved from this (`riverGeo`), never typed. The
 * lab typed it (1.26 heights), tuned on a box 1.32 widths tall with the code
 * at the top, where it cut at 0.93; the empty album's box is square and pours
 * from above, and there the same number cut two of nine cards at 0.967 and
 * 0.969, after their progress had already wrapped: a sliver in the last
 * percent of the dissolve, teleported to the top. Solved from the cut, the
 * margin holds in any box.
 */
const CUT_AT = 0.93;

/** The tumble a card is born with, at most, in degrees, and the share of it
 *  left when it lands. */
const TUMBLE = 8.5;
const LANDED = 0.12;

export type RiverClock = {
  flight: number;
  /** The gap between two launches, in ms. */
  launch: number;
  /** The period a card relaunches on: `launch` times the card count. */
  cycle: number;
};

/**
 * The clock for a pool of `count` cards. The flight is fixed and the cadence
 * divides it, so fewer photographs make a sparser flow at the same pace rather
 * than a faster one: the lab's twelve stills launched every 611 ms, the guest
 * pack's nine launch every 815.
 */
export function riverClock(count: number): RiverClock {
  const launch = Math.round((FLIGHT * CYCLE_SHARE) / count);
  return { flight: FLIGHT, launch, cycle: count * launch };
}

/* ── The box ── */

/**
 * The dissolves, as fractions of the box: the top edge where the flow arrives
 * (production's own addition: with no object at the top, frames would
 * otherwise enter through a hard line), the bottom where it leaves, and both
 * sides. The component hands these to the sheet, so the masks and the dead
 * line below read one number.
 */
export const RIVER_FADES = {
  top: 0.1,
  bottom0: 0.8,
  bottom1: 1,
  side: 0.08,
} as const;

export type RiverGeo = {
  /** The box's height over its width: every length below is in widths. */
  h: number;
  /** Where every card is born, above the frame, so the flow arrives already
   *  falling. Negative: above the top edge. */
  originY: number;
  /** A card's largest size: its DOM box, so its scale never exceeds 1. */
  card: number;
  /** The scale a card is born at. */
  sMin: number;
  /** The share of the fall at which scale reaches 1. */
  fullAt: number;
  /** Half the stream's width at full fan. */
  spread: number;
  /** The fall at progress 1. It OVER travels the dissolve on purpose. */
  travel: number;
  /** Past this y the bottom dissolve has taken the stream to zero. Derived
   *  from the mask's last stop, never typed. */
  deadY: number;
};

/**
 * The geometry for a box `ratio` widths tall. The lab's numbers, with the
 * rounding to whole px gone: they were measured in the browser against the
 * alternatives (a card at 0.4 of the width is a braid, a third is a scatter
 * with holes and a half is a wall), and they are linear in the box, so they
 * hold at any width.
 */
export function riverGeo(ratio: number): RiverGeo {
  const originY = -0.1 * ratio;
  const card = 0.4;
  const deadY = ratio * RIVER_FADES.bottom1;
  // The largest half height a landed card can have: full size, full jitter,
  // and what is left of the tumble, bounded the way `frameAt` bounds it.
  const halfMax = (card * (1 + (LANDED * TUMBLE * Math.PI) / 180)) / 2;
  return {
    h: ratio,
    originY,
    card,
    sMin: 0.3,
    fullAt: 0.6,
    // The widest lane's outer edge at 80 percent of the box, so the flow fills
    // the slot and dissolves at the sides rather than being cut by them.
    spread: 0.2,
    // ★ OVER TRAVEL: a card may only recycle once no part of it can be seen,
    // so the fall is as long as it takes the largest card's top edge to clear
    // the dead line by CUT_AT, and it runs on past it.
    travel: (deadY + halfMax - originY) / fallAt(CUT_AT),
    deadY,
  };
}

/* ── The primitives ── */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/**
 * Gravity: 38 percent quadratic, 62 linear. A frame leaves slowly and is twice
 * as quick at the bottom. (The lab's header still says 0.6p² + 0.4p, the home
 * hero's weighting; its body measured that stacking six of twelve frames into
 * the first 200 px of a box and moved to this.)
 */
export const fallAt = (p: number) => 0.38 * p * p + 0.62 * p;

/** The fan, over the first third of the distance fallen. */
const openAt = (fall: number) => smoothstep(0, OPEN, fall);

/**
 * ease-in-out-quart, which IS `--ease-in-out-strong` (0.77, 0, 0.175, 1),
 * written out rather than solved so the pour needs no bezier solver and stays
 * deterministic. The home hero's stream carries the same curve.
 */
export function revealEase(t: number) {
  const u = clamp01(t);
  if (u < 0.5) return 8 * u * u * u * u;
  const v = 1 - u;
  return 1 - 8 * v * v * v * v;
}

/**
 * A deterministic 0..1 per card. Integer ops only: Math.sin is not bit
 * identical across engines, and the server and the browser must write the
 * SAME rest transform or hydration warns.
 */
function hash01(n: number) {
  let hv = Math.imul(n + 1, 2654435761) >>> 0;
  hv = (hv ^ (hv >>> 15)) >>> 0;
  hv = Math.imul(hv, 2246822519) >>> 0;
  hv = (hv ^ (hv >>> 13)) >>> 0;
  return hv / 4294967296;
}

/* ── The cards ── */

export type RiverCard = {
  key: string;
  /** Launch order, jittered by a sixth of a cadence so it is no metronome. */
  slot: number;
  /** Which photograph: one card per photograph, so none is ever doubled. */
  photo: number;
  /** Where across the flow it runs, -1 to 1. */
  lane: number;
  /** Width factor: 1 is a square, 0.8 a 4:5 portrait. */
  wf: number;
  /** Per card size, 0.84 to 1 of the geometry's card. */
  sJit: number;
  /** Degrees of tumble at birth; it decays as the frame falls. */
  rz: number;
};

/**
 * ONE FLOW. The lane comes off the golden ratio sequence rather than a hash,
 * so the lanes spread evenly across the width AND two consecutive launches are
 * always far apart: a hash clusters, and a clustered flow reads as a queue down
 * one side.
 */
export function buildCards(count: number): RiverCard[] {
  const phi = 0.618033988749895;
  return Array.from({ length: count }, (_, g) => {
    const j = hash01(g + 101);
    const jj = hash01(g + 211);
    const j4 = hash01(g + 307);
    return {
      key: `rvr-${g}`,
      slot: g + (hash01(g + 517) - 0.5) * 0.34,
      photo: g,
      lane: ((g * phi) % 1) * 2 - 1,
      wf: j < 0.45 ? 0.8 : 1,
      sJit: 0.84 + j4 * 0.16,
      // Wide, because it decays to nearly nothing: spent at the top, where a
      // frame is small, and gone by the time it is large.
      rz: (jj * 2 - 1) * TUMBLE,
    };
  });
}

/** A card's box, in widths. */
const boxW = (c: RiverCard, geo: RiverGeo) => geo.card * c.wf * c.sJit;
const boxH = (c: RiverCard, geo: RiverGeo) => geo.card * c.sJit;

/**
 * The card's DOM box as CSS, in percentages of the flow's own box. `top` and
 * `height` resolve against its HEIGHT and everything else against its WIDTH
 * (margins included, in both directions), which is why the two heights divide
 * by `h` and the top margin does not.
 */
export function boxOf(c: RiverCard, geo: RiverGeo) {
  const w = boxW(c, geo);
  const h = boxH(c, geo);
  return {
    width: `${(w * 100).toFixed(3)}%`,
    height: `${((h / geo.h) * 100).toFixed(3)}%`,
    marginLeft: `${((-w / 2) * 100).toFixed(3)}%`,
    marginTop: `${((-h / 2) * 100).toFixed(3)}%`,
  };
}

/** Where every card is born, as the sheet's `top`. */
export const originOf = (geo: RiverGeo) =>
  `${((geo.originY / geo.h) * 100).toFixed(3)}%`;

/** The tumble decays to 12 percent of its birth angle over the first three
 *  quarters of the fall: a frame leaves at an angle and lands square. */
const angleAt = (c: RiverCard, p: number) =>
  c.rz * (1 - (1 - LANDED) * smoothstep(0, 0.75, p));

/** Cards fade up as they are born, above the frame, so none switches on. */
const opacityAt = (p: number) => smoothstep(0, 0.1, p);

/** A card's progress, 0 to the cycle's ceiling, at this clock. */
export function phaseAt(
  c: RiverCard,
  elapsed: number,
  reveal: number,
  clock: RiverClock,
) {
  return (
    mod(c.slot * clock.launch * reveal + elapsed, clock.cycle) / clock.flight
  );
}

export type RiverFrameState =
  | { gone: true }
  | { gone: false; transform: string; opacity: number };

const GONE: RiverFrameState = { gone: true };

/**
 * ONE CARD AT ONE PROGRESS: the whole composition, and the same expression the
 * rest state is written from.
 *
 * ★ THE TRANSLATE IS A PERCENTAGE OF THE CARD'S OWN BOX. A translate
 * percentage resolves against the element's border box, and the card's box is
 * itself a share of the flow's width, so `x / boxW` percent IS `x` widths of
 * the flow: exact at any size, with nothing measured.
 *
 * ★ AND A CARD IS GONE ONLY WHEN ITS TOP EDGE IS PAST THE DEAD LINE. A card is
 * laid out and scaled about its centre, so a centre test would throw away the
 * upper half of a frame still standing where the mask is opaque. The half
 * height is the tumbled box's, bounded without trigonometry (|sin a| <= |a|,
 * |cos a| <= 1): at most a percent generous at these angles, which only ever
 * makes the cut later, and free of Math.cos, whose last bit is the engine's
 * own and would let the server and the browser disagree about a card on the
 * line.
 */
export function frameAt(
  c: RiverCard,
  p: number,
  geo: RiverGeo,
): RiverFrameState {
  if (p > 1) return GONE;
  const fall = fallAt(p);
  const s = geo.sMin + (1 - geo.sMin) * clamp01(fall / geo.fullAt);
  const deg = angleAt(c, p);
  const w = boxW(c, geo);
  const h = boxH(c, geo);
  const y = fall * geo.travel;
  const half = (h * s + w * s * ((Math.abs(deg) * Math.PI) / 180)) / 2;
  if (geo.originY + y - half > geo.deadY) return GONE;
  const x = c.lane * geo.spread * openAt(fall);
  return {
    gone: false,
    transform: `translate3d(${((x / w) * 100).toFixed(3)}%, ${((y / h) * 100).toFixed(3)}%, 0) rotate(${deg.toFixed(2)}deg) scale(${s.toFixed(4)})`,
    opacity: opacityAt(p),
  };
}

/**
 * THE REST STATE: the flow standing at its steady spacing, which a reader who
 * asked for less motion, a reader with scripting off and the server's own HTML
 * all get. It is the loop's own expression with the pour finished and the clock
 * at zero, so it cannot drift from the running flow. A card that is gone at
 * rest keeps a transform (it is simply invisible), so the sheet's rule never
 * reads an empty property.
 */
export function restOf(c: RiverCard, geo: RiverGeo, clock: RiverClock) {
  const p = phaseAt(c, 0, 1, clock);
  const f = frameAt(c, p, geo);
  if (!f.gone) return { transform: f.transform, opacity: f.opacity.toFixed(3) };
  // Gone at rest: still placed (below the frame), and dark.
  const shown = frameAt(c, p, { ...geo, deadY: Number.POSITIVE_INFINITY });
  return {
    transform: shown.gone ? "none" : shown.transform,
    opacity: "0",
  };
}
