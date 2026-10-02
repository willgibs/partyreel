/**
 * THE TYPEWRITER'S SCORE: what the demo's address does over one loop, as one
 * closed table. The drawing's loop reads it to type, the frames' captions
 * read the addresses it holds, and the score drawn under each option reads
 * the same steps, so the three cannot disagree.
 *
 * ★ PURE, LIKE `hero-stream.ts` BESIDE IT. No React, no DOM, no clock of its
 * own: every answer is a function of the time into the loop, so a paused
 * frame resumes on the letter it stopped on, and the score the board prints
 * is the loop the frames run rather than a picture of it.
 *
 * ★ NOTHING IS DEALT. A key's delay is a step in a short declared cadence (a
 * hand's rhythm, uneven on purpose, the same every loop), the same way the
 * band's launch beat is: a board judges the loop it will ship, not one roll of
 * the dice.
 *
 * THE LOOP. The demo's own address stands first and longest; then, for each
 * host's address in turn, the one standing is erased (a held backspace), the
 * caret waits a beat on the bare domain, the next is typed a key at a time and
 * stands; after the last, the demo's own is typed back. Reduced motion never
 * runs it: it reads the demo's own address, still.
 *
 * ★ THE TURNS ARE READ OFF THE SAME STEPS. An address standing is its album
 * pouring; the steps between two addresses are the stream resting while the
 * typing has the stage. Round four's stream rests at a drift (round two's
 * turns, which he loved) and leaves each landing at lightspeed (`warpAt`): the
 * album the address made rushes out of it, then settles to its pace, the
 * tunnel his round three note named. A hero whose album fills in place rather
 * than streaming reads the same steps through `fillAt`.
 */

export type Phase = "hold" | "erase" | "gap" | "type";

export type Step = {
  readonly phase: Phase;
  /** The address this step is about: standing (hold), leaving (erase), or arriving (gap, type). */
  readonly slug: string;
  /** Which address, as an index into the score's list (0 is the demo's own). */
  readonly party: number;
  /** The address standing when the step began: whose prints and photographs are out. */
  readonly standing: number;
  /** Its span inside the loop, in ms. */
  readonly from: number;
  readonly to: number;
  /** A type step's key times, each from the step's start: key k lands at `keys[k]`. */
  readonly keys?: readonly number[];
};

export type Score = {
  /** The demo's own address first, then the hosts' in the order they are typed. */
  readonly addresses: readonly string[];
  readonly steps: readonly Step[];
  /** One loop, in ms. */
  readonly loop: number;
};

/** How long an address stands once it is typed, per stage (the stream's share
 *  of a loop differs, so a stage sets its own). */
export type Pace = {
  /** A host's address. */
  readonly hold: number;
  /** The demo's own, which stands first and longest. */
  readonly restHold: number;
};

/** A hand's cadence, in ms a key: uneven so it reads typed rather than printed. */
export const KEYS = [96, 78, 112, 70, 88, 124, 72, 94] as const;

/** A held backspace, per character. */
export const ERASE_MS = 36;

/** The caret's beat on the bare domain between the two addresses. */
export const GAP_MS = 300;

/** How long the caret stays once an address lands, before it fades. */
export const CARET_TAIL_MS = 520;

/** How far the stream slows while the address types, in `turns`: a drift, never a stop. */
export const DRIFT = 0.1;

/** The stream's ramp down before an erase, in `turns`. */
export const DOWN_MS = 600;

/**
 * ★ THE LIGHTSPEED LEAVING (his round three note: "the more common
 * 'lightspeed tunnel' the stream out version creates"). As an address lands,
 * the stream jumps from its drift to `WARP` times its pace in `WARP_IN_MS`,
 * then settles back to its pace over `WARP_OUT_MS` on a cubic ease-out: the
 * album the address made rushes out of it, the old party's photographs swept
 * to the edges ahead of it. The extra distance a warp covers is
 * `(WARP - 1) * (WARP_IN_MS / 2 + WARP_OUT_MS / 4)` of the stream's own clock,
 * about a third of a photograph's flight, so the new party has most of the
 * band by the time its address is erased.
 */
export const WARP = 6;
export const WARP_IN_MS = 180;
export const WARP_OUT_MS = 1800;

/**
 * How long a new album takes to fill in place, in the heroes whose album is
 * a wall rather than a stream (`waveAt`): its first tile at the landing, its
 * last this long after.
 */
export const WAVE_MS = 1500;

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Each key's landing time from the start of typing `slug`. */
function keysOf(slug: string): number[] {
  const out: number[] = [];
  let t = 0;
  for (let k = 0; k < slug.length; k++) {
    t += KEYS[k % KEYS.length];
    out.push(t);
  }
  return out;
}

/**
 * The loop for these addresses at this pace. `addresses[0]` is the demo's own;
 * an address repeated in the list (the demo's own among the hosts') is dropped,
 * so a host's address never types the one already standing.
 */
export function scoreOf(addresses: readonly string[], pace: Pace): Score {
  const list = addresses.filter((a, i) => addresses.indexOf(a) === i);
  const steps: Step[] = [];
  let t = 0;
  const push = (s: Omit<Step, "from" | "to">, ms: number) => {
    steps.push({ ...s, from: t, to: t + ms });
    t += ms;
  };
  push({ phase: "hold", slug: list[0], party: 0, standing: 0 }, pace.restHold);
  if (list.length > 1) {
    for (let i = 1; i <= list.length; i++) {
      const prev = i - 1;
      const next = i % list.length;
      push(
        { phase: "erase", slug: list[prev], party: prev, standing: prev },
        list[prev].length * ERASE_MS,
      );
      push(
        { phase: "gap", slug: list[next], party: next, standing: prev },
        GAP_MS,
      );
      const keys = keysOf(list[next]);
      push(
        {
          phase: "type",
          slug: list[next],
          party: next,
          standing: prev,
          keys,
        },
        keys[keys.length - 1],
      );
      // The loop closes on the demo's own address typed back: its hold is
      // the loop's first step, so it is not pushed twice.
      if (next !== 0)
        push(
          { phase: "hold", slug: list[next], party: next, standing: next },
          pace.hold,
        );
    }
  }
  return { addresses: list, steps, loop: t };
}

/** The step at a time into the loop. */
export function stepAt(score: Score, t: number): Step {
  const at = mod(t, score.loop);
  for (const s of score.steps) if (at < s.to) return s;
  return score.steps[score.steps.length - 1];
}

export type Typed = {
  /** What the address reads after the domain, right now. */
  readonly text: string;
  readonly phase: Phase;
  /** The caret's opacity: on while the address changes, fading after it lands. */
  readonly caret: number;
  /** The address standing: whose prints and photographs are out. */
  readonly standing: number;
};

/**
 * THE ADDRESS AT A TIME INTO THE LOOP: the characters showing, the phase, the
 * caret and whose address is standing. `t` may run past one loop; it wraps.
 */
export function typedAt(score: Score, t: number): Typed {
  const s = stepAt(score, t);
  const into = mod(t, score.loop) - s.from;
  switch (s.phase) {
    case "hold": {
      // The caret lingers on a landing, then fades; the loop's very first
      // hold (the demo's own on arrival) has no landing, so it has no caret,
      // and nor does a loop of one address, which never lands at all.
      const still = score.steps.length === 1;
      const tail = still || (s.from === 0 && t < score.loop) ? 0 : 1;
      const fade = 1 - Math.min(1, Math.max(0, (into - CARET_TAIL_MS) / 200));
      return {
        text: s.slug,
        phase: "hold",
        caret: tail * fade,
        standing: s.standing,
      };
    }
    case "erase": {
      const gone = Math.min(s.slug.length, Math.floor(into / ERASE_MS) + 1);
      return {
        text: s.slug.slice(0, s.slug.length - gone),
        phase: "erase",
        caret: 1,
        standing: s.standing,
      };
    }
    case "gap":
      return { text: "", phase: "gap", caret: 1, standing: s.standing };
    case "type": {
      const keys = s.keys ?? [];
      let n = 0;
      while (n < keys.length && keys[n] <= into) n++;
      return {
        text: s.slug.slice(0, n),
        phase: "type",
        caret: 1,
        standing: s.standing,
      };
    }
  }
}

const smooth = (x: number) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * (3 - 2 * u);
};

/** A cubic ease-out: quick to leave, slow to settle. */
const easeOut = (x: number) => {
  const u = 1 - Math.min(1, Math.max(0, x));
  return 1 - u * u * u;
};

/**
 * THE STREAM'S PACE, as a share of its full speed: a drift while the typing
 * has the stage, a jump to lightspeed as an address lands (`WARP`), settling
 * to full over `WARP_OUT_MS`, and easing back to the drift `DOWN_MS` before
 * the address is erased, so the two motions take turns and the stream is
 * never quite still. `t` is the time since the typing began: the first pass's
 * opening hold is the page's own branch-out, so it runs at full with no warp
 * of its own, and a loop of one address never warps or slows at all.
 */
export function warpAt(score: Score, t: number): number {
  const s = stepAt(score, t);
  if (s.phase !== "hold") return DRIFT;
  if (score.steps.length === 1) return 1;
  const into = mod(t, score.loop) - s.from;
  const left = s.to - s.from - into;
  const down = smooth(left / DOWN_MS);
  const first = s.from === 0 && t < score.loop;
  const pace = first ? 1 : warpSince(into);
  return DRIFT + (pace - DRIFT) * down;
}

/**
 * The stream's pace `ms` after a landing, from the drift: up to `WARP`, then
 * settling to its full pace. The one curve every landing runs, the
 * typewriter's and a visitor's own alike.
 */
export function warpSince(ms: number): number {
  if (ms < 0) return DRIFT;
  if (ms < WARP_IN_MS) return DRIFT + (WARP - DRIFT) * smooth(ms / WARP_IN_MS);
  return 1 + (WARP - 1) * (1 - easeOut((ms - WARP_IN_MS) / WARP_OUT_MS));
}

/** The loop's length in seconds, as the score prints it. */
export const secondsOf = (score: Score) => Math.round(score.loop / 100) / 10;

export type Wave = {
  /** How long ago the address standing landed (the page's arrival for the first), in ms. */
  readonly since: number;
  /**
   * How far the album has stepped back while the typing has the stage: 0
   * while an address stands, rising over `DOWN_MS` before its erase, 1 until
   * the next lands.
   */
  readonly rest: number;
};

/**
 * THE ALBUM'S TURN, IN THE HEROES WHOSE ALBUM FILLS IN PLACE: each address
 * that lands fills its own album outward from the link over `WAVE_MS`
 * (`since`), and the album steps back (`rest`) while the next address is
 * erased and typed, so the typing has the stage to itself. The arrival's
 * album is already full; a loop of one address never rests.
 */
export function waveAt(score: Score, t: number): Wave {
  const s = stepAt(score, t);
  const at = mod(t, score.loop);
  if (score.steps.length === 1) return { since: WAVE_MS * 4, rest: 0 };
  if (s.phase === "hold") {
    const into = at - s.from;
    const left = s.to - s.from - into;
    const first = s.from === 0 && t < score.loop;
    return {
      since: first ? WAVE_MS * 4 + into : into,
      rest: 1 - smooth(left / DOWN_MS),
    };
  }
  // Between two addresses: the album that stood rests, its wave long done.
  return { since: WAVE_MS * 4, rest: 1 };
}
