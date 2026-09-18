/**
 * THE SWITCHING BACKDROP, AS ARITHMETIC (the cursor-backdrop lane, 2026-09-18).
 *
 * Will, after finding the Codrops "Image Trail Effects" resource: "Rather than
 * leaning on aurora treatments for more UI-forward sections (eg. icon feature
 * cards with no media visual), we could have full image background sections
 * that switch the image based on cursor position... make the page feel very
 * alive." Demo six is the reference and nothing else: its numbers were read
 * once (a switch every 100 px of travel, the entering photograph offset 100 px
 * toward the direction of travel, 1.2 s expo-out, a rising z-index, nothing
 * fading) and everything here is designed from the ground up against them.
 *
 * ★ PURE, AND THAT IS LOAD-BEARING. No React, no DOM, no clock of its own: a
 * pointer and a delta go in, a stack of layers comes out. Three things depend
 * on it:
 *
 *  1. `backdrop-engine.test.ts` runs the whole rule set in the node project,
 *     including the ones that are impossible to see by eye (a switch lands on
 *     exactly the travel threshold; going back across a band returns the
 *     PREVIOUS photograph rather than the next one).
 *  2. A board preview has no pointer. `pointerAt` is a scripted path, so every
 *     capture, `pnpm lab:demo` and the reduced-motion still are the same run of
 *     the same arithmetic rather than whatever the mouse happened to be doing.
 *  3. The reduced-motion still is not frame zero, it is `stillAt`: the state
 *     the scripted path has ALREADY reached. That is what lets a reader who
 *     asked for less motion see the option instead of an empty section, and it
 *     is why each trigger's tile draws a different photograph with no animation
 *     running anywhere.
 *
 * ★ THE STACK IS THE MODEL, NOT A CROSSFADE PAIR. Demo six never fades: it
 * places the next photograph on top and lets the one below stay exactly where
 * it was. So the state is an ordered stack, oldest first, and a layer that
 * finishes arriving DROPS everything under it, because a full-bleed opaque
 * photograph at rest covers them. Cycling falls out of that; there is no
 * "current" and "previous" to keep in sync.
 */

/** What decides the next photograph. */
export type TriggerId = "band" | "travel" | "cells";
/** How the next photograph arrives. */
export type EntranceId = "slide" | "wipe" | "cut";

export type Box = { readonly w: number; readonly h: number };

/**
 * A pointer, in the SECTION's own coordinates. `cell` is which of the
 * section's cards or rows it is over, or -1 for none: the engine never looks at
 * the DOM, so whoever owns the pointer (a real `pointermove`, or the scripted
 * path) answers that question and hands the answer in.
 */
export type Pointer = {
  readonly x: number;
  readonly y: number;
  readonly cell: number;
};

export type Config = {
  /** How many photographs the section cycles. */
  readonly pool: number;
  readonly trigger: TriggerId;
  readonly entrance: EntranceId;
  /** `travel` only: the pixels of pointer travel between switches. */
  readonly travel: number;
  /** One entrance, in ms. */
  readonly pace: number;
  /** `cells` only: how many cards or rows the section has. */
  readonly cells: number;
  readonly box: Box;
};

/** One photograph in flight (or at rest, at `t` 1). */
export type Layer = {
  /** The index into the pool. */
  readonly frame: number;
  /** 0 at the moment it is placed, 1 once it has settled. */
  readonly t: number;
  /** Which side it came from: -1 the left, 1 the right. */
  readonly dir: -1 | 1;
};

export type State = {
  /** Oldest first; the last entry is the one on top. Never empty. */
  readonly stack: readonly Layer[];
  /** The pool index the section is currently ON (the top layer's frame). */
  readonly index: number;
  /** `travel` only: pixels since the last switch. */
  readonly since: number;
  /** The last pointer seen, so the next step can measure its delta. */
  readonly at: Pointer | null;
};

/**
 * ★ THE STACK IS CAPPED, AND THE CAP IS A REAL CASE. A fast sweep with the
 * `band` trigger can start a switch every frame, and an uncapped stack would
 * hold a dozen photographs mid-flight with the top one the only thing anyone
 * can see. Six is comfortably past what a 680 ms entrance can accumulate at a
 * plausible pointer speed, and dropping from the BOTTOM keeps the newest.
 */
const STACK_CAP = 6;

export const DEFAULTS: Omit<Config, "box"> = {
  pool: 8,
  trigger: "band",
  entrance: "slide",
  travel: 180,
  pace: 680,
  cells: 3,
};

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Expo-out, the reference's easing and the right one here: about two thirds of
 * the distance is gone in the first eighth of the entrance, so the sliver of
 * the photograph underneath is a flicker rather than a gap, and the tail is
 * long enough to read as a settle rather than a stop.
 */
export const expoOut = (t: number) =>
  t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);

/** The CSS twin of `expoOut`, for the one place a transition is declared. */
export const EXPO_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

/** The section at rest: the pool's first photograph, nothing in flight. */
export function start(): State {
  return {
    stack: [{ frame: 0, t: 1, dir: 1 }],
    index: 0,
    since: 0,
    at: null,
  };
}

/**
 * WHICH PHOTOGRAPH A BAND WANTS. The pointer's x across the section indexes the
 * pool, so the section is a thing you SCRUB: moving back returns the photograph
 * you just left, which is the one property the reference's travel rule cannot
 * have. Clamped rather than wrapped, so the two edges are the two ends of the
 * pool and not a seam you fall through.
 */
export function bandIndex(x: number, cfg: Config): number {
  const at = Math.floor(clamp01(x / Math.max(1, cfg.box.w)) * cfg.pool);
  return at < 0 ? 0 : at > cfg.pool - 1 ? cfg.pool - 1 : at;
}

/**
 * WHICH PHOTOGRAPH A CARD OWNS. The cards are spread through the pool rather
 * than taking its first three, so three neighbouring cards never bring up three
 * photographs shot in the same room.
 */
export function cellIndex(cell: number, cfg: Config): number {
  if (cell < 0) return -1;
  const stride = Math.max(1, Math.floor(cfg.pool / Math.max(1, cfg.cells)));
  return (cell * stride) % cfg.pool;
}

/** The sign of a delta, with 0 reading as "the way we were already going". */
const sideOf = (dx: number, was: -1 | 1): -1 | 1 =>
  dx > 0 ? 1 : dx < 0 ? -1 : was;

/**
 * ONE FRAME. Advance every layer, drop what is covered, then decide whether a
 * new photograph is placed.
 *
 * ★ THE ORDER MATTERS. Advancing first means a layer that lands on this frame
 * has already collapsed the stack under it before a new one is pushed, so the
 * stack holds only what is really in flight. Deciding first would leave the
 * settled layer under the new one for one extra frame, which is invisible and
 * would still make `stack.length` untestable.
 */
export function step(s: State, cfg: Config, p: Pointer, dtMs: number): State {
  const dt = dtMs > 0 ? dtMs : 0;
  const pace = Math.max(1, cfg.pace);

  // 1. Advance, then drop everything below the topmost layer that has landed.
  let stack = s.stack.map((l) =>
    l.t >= 1 ? l : { ...l, t: clamp01(l.t + dt / pace) },
  );
  let floor = 0;
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].t >= 1) {
      floor = i;
      break;
    }
  }
  if (floor > 0) stack = stack.slice(floor);

  // 2. How far the pointer moved, and where it wants to be.
  const prev = s.at;
  const dx = prev ? p.x - prev.x : 0;
  const dy = prev ? p.y - prev.y : 0;
  const moved = Math.hypot(dx, dy);
  const was: -1 | 1 = stack[stack.length - 1]?.dir ?? 1;

  let next = -1;
  let dir: -1 | 1 = was;
  let since = s.since;

  if (cfg.trigger === "band") {
    const want = bandIndex(p.x, cfg);
    if (want !== s.index) {
      next = want;
      dir = want > s.index ? 1 : -1;
    }
  } else if (cfg.trigger === "travel") {
    since += moved;
    // ★ THE FIRST POINTER IS NOT TRAVEL. With no previous sample the delta is
    // the whole section, which would fire a switch the instant the pointer
    // entered. `prev` being null is what keeps the entrance an answer to
    // movement rather than to arrival.
    if (prev && since >= cfg.travel) {
      next = (s.index + 1) % cfg.pool;
      dir = sideOf(dx, was);
      since = 0;
    }
  } else {
    const want = cellIndex(p.cell, cfg);
    // No card under the pointer: the section RESTS on the last one it brought
    // up, rather than snapping back to the pool's first.
    if (want >= 0 && want !== s.index) {
      next = want;
      dir = want > s.index ? 1 : -1;
    }
  }

  if (next < 0) return { stack, index: s.index, since, at: p };

  const pushed = [...stack, { frame: next, t: 0, dir }];
  return {
    stack:
      pushed.length > STACK_CAP
        ? pushed.slice(pushed.length - STACK_CAP)
        : pushed,
    index: next,
    since,
    at: p,
  };
}

/** One layer, ready to be written onto a node. Nothing else is ever written. */
export type Painted = {
  readonly frame: number;
  readonly z: number;
  readonly transform: string;
  readonly opacity: number;
  /** `null` when the layer is whole; a `clip-path` value while a wipe opens. */
  readonly clip: string | null;
};

/**
 * THE THREE ENTRANCES, as the only three properties a compositor can move for
 * free: a transform, an opacity and a clip path. No filter, no shadow, no
 * width.
 *
 * ★ NOTHING FADES ON THE WAY IN, and that is the reference's real idea. A
 * crossfade of two photographs passes through a moment that is neither, which
 * on a full-bleed section reads as a dissolve on a slideshow. Opacity here is
 * 1 for every layer at every moment; the entrances differ in SHAPE.
 *
 *  slide  the photograph arrives from the side the pointer came from, a tenth
 *         of the section wide, and settles. The sliver of the photograph
 *         underneath on its trailing edge is the effect, not a bug.
 *  wipe   the photograph does not move; the section is uncovered from the
 *         travel edge. The crispest of the three, and the only one with a hard
 *         line in it, which is the page's own chapter-cut grammar.
 *  cut    the photograph is simply THERE, at 3.5 percent over size, settling
 *         back. A film cut with a breath after it.
 */
export function paint(s: State, cfg: Config): Painted[] {
  const off = cfg.box.w * 0.1;
  return s.stack.map((l, i) => {
    const e = expoOut(l.t);
    if (cfg.entrance === "slide") {
      const x = l.dir * off * (1 - e);
      return {
        frame: l.frame,
        z: i,
        transform: x === 0 ? "none" : `translate3d(${x.toFixed(2)}px, 0, 0)`,
        opacity: 1,
        clip: null,
      };
    }
    if (cfg.entrance === "wipe") {
      const k = (1 - e) * 100;
      const scale = 1 + 0.03 * (1 - e);
      return {
        frame: l.frame,
        z: i,
        transform: e >= 1 ? "none" : `scale(${scale.toFixed(4)})`,
        opacity: 1,
        // The uncovered band grows FROM the side the pointer came from, so the
        // wipe and the pointer travel the same way.
        clip:
          e >= 1
            ? null
            : l.dir > 0
              ? `inset(0 0 0 ${k.toFixed(2)}%)`
              : `inset(0 ${k.toFixed(2)}% 0 0)`,
      };
    }
    const scale = 1 + 0.035 * (1 - e);
    return {
      frame: l.frame,
      z: i,
      transform: e >= 1 ? "none" : `scale(${scale.toFixed(4)})`,
      opacity: 1,
      clip: null,
    };
  });
}

/* ── the scripted pointer ─────────────────────────────────────────────────── */

/** One full lap of the scripted path, in ms. */
export const PATH_PERIOD = 7200;

/**
 * THE FOUR SCRIPTED PATHS. A board preview has no pointer, and a phone has no
 * pointer at all, so the thing that drives the section is declared here and the
 * live loop, the capture and the reduced-motion still all read the same one.
 *
 *  sweep   a cursor moving through the section. Two sines at an irrational-ish
 *          ratio: x makes one lap of the period, so `band` walks the whole pool
 *          and comes BACK (the property being judged), and y wanders at 1/0.618
 *          of it so the path never repeats a point and `cells` crosses every
 *          card. Deliberately not a straight line: a straight sweep makes
 *          `band` and `travel` look identical, and their difference is the
 *          question.
 *  scroll  the phone with no cursor: the pool indexed by how far the section
 *          has come up the screen. One pass, then it holds.
 *  cycle   the phone on a clock: one photograph every `CYCLE_DWELL`.
 *  rest    a pointer that never moves, which is the honest model of "one still
 *          photograph": the same engine, given nothing, switches nothing.
 */
export type PathId = "sweep" | "scroll" | "cycle" | "rest";

/** How long one photograph holds under `cycle`. */
export const CYCLE_DWELL = 1200;
/** How long one pass of `scroll` takes, end to end. */
export const SCROLL_PASS = 6000;

export type PathOpts = {
  cells: number;
  axis: "x" | "y";
  path?: PathId;
  /** How many photographs `cycle` steps through. Defaults to the engine's. */
  pool?: number;
};

export function pointerAt(ms: number, box: Box, opts: PathOpts): Pointer {
  const mid = box.h * 0.5;
  switch (opts.path ?? "sweep") {
    case "rest":
      return { x: 0, y: mid, cell: -1 };
    case "scroll": {
      const k = clamp01(ms / SCROLL_PASS);
      return { x: k * (box.w - 1), y: mid, cell: -1 };
    }
    case "cycle": {
      // The pool stepped, not swept: each photograph sits in the middle of its
      // own band, so a band boundary is never landed on by rounding.
      const bands = Math.max(1, opts.pool ?? DEFAULTS.pool);
      const n = Math.floor(ms / CYCLE_DWELL);
      const at = (n % bands) + 0.5;
      return { x: (at / bands) * box.w, y: mid, cell: -1 };
    }
    default: {
      const a = (2 * Math.PI * ms) / PATH_PERIOD;
      const b = (2 * Math.PI * ms) / (PATH_PERIOD * 0.618) + 1.1;
      const x = box.w * (0.5 + 0.44 * Math.sin(a));
      const y = box.h * (0.5 + 0.22 * Math.sin(b));
      return { x, y, cell: cellAt(x, y, box, opts) };
    }
  }
}

/**
 * Which card a point is over, for the scripted path only: the real section
 * answers this from its own hover. `axis` is the direction the cards are laid
 * out in (the icon three-up is a row, the guest ledger is a column), and the
 * band outside the cards' own stretch reads as -1, so the path leaves the cards
 * and the section is seen resting.
 */
export function cellAt(
  x: number,
  y: number,
  box: Box,
  opts: { cells: number; axis: "x" | "y" },
): number {
  if (opts.cells <= 0) return -1;
  const along =
    opts.axis === "x" ? x / Math.max(1, box.w) : y / Math.max(1, box.h);
  // The cards occupy the middle 64 percent of their axis; outside it there is
  // nothing under the pointer.
  const k = (along - 0.18) / 0.64;
  if (k < 0 || k >= 1) return -1;
  return Math.min(opts.cells - 1, Math.floor(k * opts.cells));
}

/** A fixed step, so every integration of the path is the same arithmetic. */
export const TICK = 1000 / 60;

/** The state the scripted path has reached at `ms`. Deterministic. */
export function integrate(cfg: Config, ms: number, opts: PathOpts): State {
  let s = start();
  for (let t = 0; t <= ms; t += TICK) {
    s = step(s, cfg, pointerAt(t, cfg.box, opts), t === 0 ? 0 : TICK);
  }
  return s;
}

/**
 * THE STILL: the frame a reader who asked for less motion is shown, and the
 * frame a capture holds.
 *
 * It scans the scripted path for the first moment at or after `from` where the
 * top layer has arrived `entranceAt` of the way in. So a decision about WHICH
 * photograph shows (the trigger) asks for a settled still, and a decision about
 * HOW it arrives (the entrance) asks for one in the middle of the entrance,
 * where a slide, a wipe and a cut are three visibly different pictures with
 * nothing moving. Both are honest: neither invents a state the live effect does
 * not pass through.
 */
export function stillAt(
  cfg: Config,
  opts: PathOpts & { from?: number; entranceAt?: number },
): { state: State; ms: number } {
  // ★ 0.45 OF A LAP IS CHOSEN, NOT ARBITRARY. A still is only taken where the
  // stack has settled, and with a pointer that never stops those moments are
  // sparse; scanning from earlier in the lap lands `travel` and `cells` on the
  // SAME photograph, which would leave two of the trigger's three tiles
  // identical. The engine's test pins this, so moving the path or the numbers
  // tells you the tiles have collided instead of letting a review find it.
  const from = opts.from ?? PATH_PERIOD * 0.45;
  const want = opts.entranceAt ?? 1;
  let s = start();
  let last = s;
  for (let t = 0; t <= PATH_PERIOD * 2; t += TICK) {
    s = step(s, cfg, pointerAt(t, cfg.box, opts), t === 0 ? 0 : TICK);
    last = s;
    if (t < from) continue;
    const top = s.stack[s.stack.length - 1];
    const settled = want >= 1;
    if (
      settled
        ? top.t >= 1 && s.stack.length === 1
        : s.stack.length > 1 && top.t >= want
    )
      return { state: s, ms: t };
  }
  // A configuration that never reaches the asked-for shape (a pool of one, a
  // pace longer than the lap) still owes a picture: the last state is one.
  return { state: last, ms: PATH_PERIOD * 2 };
}
