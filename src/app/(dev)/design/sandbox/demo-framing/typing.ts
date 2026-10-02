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
 * ★ ROUND THREE'S TURNS ARE READ OFF THE SAME STEPS. An address standing is
 * the code standing over it and its album pouring; the steps between two
 * addresses are the code gone and the stream resting. How the stream rests is
 * the take's: a drift (`rateAt`, round two's `turns`, which he loved), or the
 * album folding back into the link before the next address and bursting out
 * of it after (`foldAt`).
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

/** The stream's ramps round the typing, in `turns`: down before an erase, back up after a landing. */
export const DOWN_MS = 600;
export const UP_MS = 900;

/**
 * How long the album takes to fold back into the link before the next
 * address, in the takes that rewind: the last stretch of an address's stand.
 * Slower than a reply and quicker than the burst it answers (1,750 ms), so
 * the in-breath and the out-breath read as one gesture.
 */
export const FOLD_MS = 760;

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

/**
 * THE STREAM'S PACE IN `turns`, as a share of its full speed: full while an
 * address stands, easing to a drift `DOWN_MS` before it is erased and back up
 * over `UP_MS` once the next has landed, so the two motions take turns and
 * the stream is never quite still. `t` is the time since the typing began, so
 * the first pass's opening hold (the band just branched out) starts at full.
 */
export function rateAt(score: Score, t: number): number {
  const s = stepAt(score, t);
  if (s.phase !== "hold") return DRIFT;
  const into = mod(t, score.loop) - s.from;
  const left = s.to - s.from - into;
  const first = s.from === 0 && t < score.loop;
  const up = first ? 1 : smooth(into / UP_MS);
  // A loop of one address has no erase to slow down for.
  const down = score.steps.length === 1 ? 1 : smooth(left / DOWN_MS);
  return DRIFT + (1 - DRIFT) * Math.min(up, down);
}

/** The loop's length in seconds, as the score prints it. */
export const secondsOf = (score: Score) => Math.round(score.loop / 100) / 10;

export type Fold = {
  /**
   * How far the album has folded back into the link: 0 while it pours, rising
   * over the last `FOLD_MS` of an address's stand, 1 from the erase until the
   * next address lands.
   */
  readonly fold: number;
  /**
   * How long the album has been pouring, in ms: from the landing of the
   * address standing (its burst), or the page's arrival for the first. Held
   * where the fold began, so a folding album retraces the very places it
   * stood rather than running on as it shrinks.
   */
  readonly since: number;
};

/**
 * THE ALBUM'S BREATH, IN THE TAKES THAT REWIND: each address bursts its own
 * album out of the link when it lands, pours it while it stands, and folds it
 * back in before it is erased, so the typing always has the stage to itself
 * and every address reads as a new album. A loop of one address never folds.
 */
export function foldAt(score: Score, t: number): Fold {
  const s = stepAt(score, t);
  const at = mod(t, score.loop);
  if (s.phase === "hold") {
    const into = at - s.from;
    const len = s.to - s.from;
    if (score.steps.length === 1) return { fold: 0, since: t };
    const start = len - FOLD_MS;
    const fold = smooth((into - start) / FOLD_MS);
    return { fold, since: Math.min(into, start) };
  }
  // Between two addresses: folded, and frozen where the last stand's fold
  // began. The stand before this change is the last hold behind it.
  const i = score.steps.indexOf(s);
  let h = i - 1;
  while (h >= 0 && score.steps[h].phase !== "hold") h--;
  const held = h >= 0 ? score.steps[h] : score.steps[0];
  return { fold: 1, since: held.to - held.from - FOLD_MS };
}
