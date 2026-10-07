"use client";

import "./row.css";
import "./ring.css";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import type { Guest } from "./fixtures";
import type { Ground } from "./knobs";
import { Face, type Palette } from "./face";
import { alpha, keyOf, ringPaint, WHITE_RING } from "./light";

/**
 * THE GUEST ROW: HER PARTY'S FACES, NEWEST FIRST, THE NEWEST RINGED (the
 * old event-header r3 `faces` option Will loved, drawn as this board's one
 * row so every place and every question wears the same drawing).
 *
 * ★ EACH FACE IS PRODUCTION'S `Avatar` (the seeded mesh, never animated), in
 * a slot of the row's own: the slot carries the overlap (a quarter of the
 * face, `AvatarGroup`'s rule), the parting ring of the ground under it, the
 * newest's ring and its light, and the lift a pointer gives it. `AvatarGroup`
 * cannot carry a ring outside the face (the face clips), which is the one
 * thing a wiring lane would add to it.
 *
 * ★ THE NEWEST ON TOP: a row overlaps leftward-first, so each face sits over
 * the one after it and the newest, at the head, is whole (the old option's
 * `zIndex`, kept).
 *
 * ★ THE COUNT SPEAKS IN ITS LINE'S VOICE: "38 guests", plain, at the line's
 * own size, in the byline's white on a photograph and the bar's grey on the
 * page, so "Maya · September 12, 2026" and the faces under it read as one
 * run of facts. The camera's readout (identity r2) prints a NUMBER beside a
 * glyph; a word set in it ("38 GUESTS") read as a dashboard's caption under
 * a wedding's name.
 *
 * ★ THE NEWEST'S RING IS THE CARRIED CALL'S (`lands`, taken; the old
 * `newest` question's three ways stay drawable, `white` and `photo` being
 * its overrule): a flare in the light of the photograph they just added as
 * each photo lands, settling over two seconds into a fine ring that always
 * marks the newest. ★ ON PAPER A LIGHT KEEPS ITS DARK (Aperture): a lit ring
 * stands in a small puck of the room; a fine ring at rest is printed in ink.
 *
 * ★ THREE WAYS TO ANSWER A POINTER (the `hover` decision): none, as today;
 * transitions.dev's avatar-group hover at its own numbers
 * (`.agents/skills/transitions-dev/11-avatar-group-hover.md`); or that lift
 * eased home with no overshoot. Both combs bring the face under the pointer
 * to the front (a face mid-row lifts out from under its neighbour) and say
 * WHO IN THE COUNT'S OWN PLACE: "38 guests" turns to its name (transitions.dev's
 * text swap), so nothing is laid over the byline and no pill is needed (the
 * creative director's pass). The timing function is written BEFORE the
 * variables, so a lift eases in and the return wears its own curve (the
 * recipe's trick). Under reduced motion nothing moves; an INSTANT (a held
 * beat) is a drawing and keeps its pose.
 */

export type RingWay = "white" | "photo" | "lands";
export type HoverWay = "still" | "comb" | "settled";

/** The beat a row is drawn at. */
export type RowBeat =
  /** Their photos are landing now (the newest within the quarter hour). */
  | "adding"
  /** An hour on: nobody is adding. */
  | "later"
  /** Priya's own first photo has just landed: her face leads. */
  | "joined";

type Size = "xxs" | "xs" | "sm" | "default" | "lg";

/** A face's look in the row: its box (the overlap and the ring read it), the `Avatar` step it is drawn at, its class where the avatar has no step that size. */
type Look = {
  px: number;
  avatar: "sm" | "default";
  box?: string;
  initial?: string;
};

/**
 * A FACE'S SIZE IN THE ROW.
 *
 * ★ A DESK'S COVER DRAWS 36, NOT THE AVATAR'S 40: under a 14px byline whose
 * host face is 24, a row of 40s read as a second title; 36 keeps her party a
 * step above its host's face and well below the name.
 */
const SIZES: Record<Size, Look> = {
  xxs: { px: 16, avatar: "default", box: "size-4", initial: "text-[8px]" },
  xs: { px: 20, avatar: "default", box: "size-5", initial: "text-[8px]" },
  sm: { px: 24, avatar: "sm", initial: "text-[10px]" },
  default: { px: 32, avatar: "default" },
  lg: { px: 36, avatar: "default", box: "size-9", initial: "text-[15px]" },
};

/**
 * ★ ON THE PAGE A DESK'S ROW IS THE BAR'S HEIGHT: the album's bar is a line
 * of 28px controls (View), so a row standing in it draws 28s where a cover
 * would draw 32, and the bar never grows for its faces.
 */
const IN_BAR: Look = {
  px: 28,
  avatar: "default",
  box: "size-7",
  initial: "text-[12px]",
};

/** The hover's numbers: transitions.dev's own (`comb`), and the same lift eased home (`settled`). */
const HOVER = {
  lift: -4,
  scale: 1.05,
  falloff: 0.45,
  in: "cubic-bezier(0.22, 1, 0.36, 1)",
  out: {
    comb: "cubic-bezier(0.34, 3.85, 0.64, 1)",
    settled: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
} as const;

/**
 * THE POINTER'S WALK (the hover loupe's loop), as a hand reads a row: in from
 * the left, a rest on Theo (the newest) long enough to read his name, along
 * the row a face at a time, a second look back, a rest mid-row and at the
 * sixth face, then down off the row onto the album while the row settles
 * home, and a beat of stillness before the next pass. ★ EVERY MOVE IS TO A
 * NEIGHBOUR, so no face is crossed without answering, as a real pointer
 * would make it. `rest` is how long the pointer stays once there.
 */
const WALK: readonly { at: number | "in" | "out"; rest: number }[] = [
  { at: "in", rest: 500 },
  { at: 0, rest: 1300 },
  { at: 1, rest: 340 },
  { at: 2, rest: 340 },
  { at: 3, rest: 1100 },
  { at: 2, rest: 650 },
  { at: 3, rest: 280 },
  { at: 4, rest: 340 },
  { at: 5, rest: 1100 },
  { at: "out", rest: 1700 },
];

/** A move's time: a hand's unhurried pace over the row's own pixels, never a snap and never a crawl. */
const travelFor = (dx: number, dy: number) =>
  Math.round(Math.min(560, Math.max(220, Math.hypot(dx, dy) * 6)));

/**
 * When a face answers, as a share of the move: as the pointer crosses into
 * it (the faces overlap, so a little past the middle), never as it sets off;
 * leaving downward, it is off the face early in the move.
 */
const ARRIVES = 0.55;
const LEAVES = 0.35;

/** Where the walk waits between passes: off the row's left, outside a loupe's window. */
const OFFSTAGE = -40;

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** Whether this reader asked for less motion (the frame's own window). */
function useReducedMotion(el: HTMLElement | null): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const win = el?.ownerDocument.defaultView;
    if (!win) return;
    const q = win.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, [el]);
  return reduced;
}

/** The lift each face takes with the pointer on `active` (transitions.dev's falloff). */
function shiftsFor(n: number, active: number | null) {
  return Array.from({ length: n }, (_, i) => {
    if (active === null) return { shift: 0, scale: 1 };
    const d = Math.abs(i - active);
    return {
      shift: HOVER.lift * Math.pow(HOVER.falloff, d),
      scale: i === active ? HOVER.scale : 1,
    };
  });
}

/**
 * Where the pointer rests on a face, in the row's own pixels: a loupe scales
 * the row (a transform), and a rect is read in the screen's, so the two are
 * divided back by the row's own scale.
 */
function pointOn(
  row: HTMLElement,
  face: HTMLElement | null | undefined,
): { x: number; y: number } | null {
  if (!face) return null;
  const box = row.getBoundingClientRect();
  const k = row.offsetWidth > 0 ? box.width / row.offsetWidth : 1;
  const r = face.getBoundingClientRect();
  return {
    x: (r.left - box.left + r.width * 0.55) / k,
    y: (r.top - box.top + r.height * 0.62) / k,
  };
}

/** Whether the newest is lit at this beat (the held ways) or flaring (the landing way). */
const litAt = (beat: RowBeat) => beat === "adding" || beat === "joined";

/** What the newest wears at a beat: a held ring of light, a flare, a fine ring, or nothing. */
function ringState(
  ring: RingWay,
  lit: boolean,
): "held" | "flare" | "fine" | undefined {
  if (ring === "lands") return lit ? "flare" : "fine";
  return lit ? "held" : undefined;
}

/** The pointer as the walk has it: where, and how long its move there takes (0 is a jump, unseen). */
type Cursor = { x: number; y: number; travel: number };

export function PartyRow({
  faces,
  joiner,
  count,
  shown,
  size,
  on,
  ground = "room",
  ring,
  beat,
  hover,
  instant = false,
  pointer = null,
  label = true,
  play,
  palette = "wheel",
  className,
}: {
  /** The party, newest first. */
  faces: readonly Guest[];
  /** Who joins at the head at the `joined` beat (Priya's first photo landing). */
  joiner?: Guest;
  /** The one count (`getEventGuests`), before anyone joins. */
  count: number;
  /** Faces before the count takes over. */
  shown: number;
  size: Size;
  /** On a photograph (the cover, the room in both themes) or on the page. */
  on: "photo" | "page";
  /** The page's ground, where the row is on the page. */
  ground?: Ground;
  ring: RingWay;
  beat: RowBeat;
  hover: HoverWay;
  /** A drawn instant: nothing animates, a flare stands at its peak, a lift keeps its pose. */
  instant?: boolean;
  /** At an instant, the pointer held on this face. */
  pointer?: number | null;
  /** The count's words after the faces. */
  label?: boolean;
  /** A live loop: the newest's beats playing, or a pointer drifting along the row. */
  play?: "ring" | "hover";
  /** How each face is coloured (production's wheel where absent). */
  palette?: Palette;
  className?: string;
}) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const reduced = useReducedMotion(el);

  /* ── the ring's beat, played or drawn ── */
  const [liveBeat, setLiveBeat] = useState<RowBeat>(beat);
  const [flareKey, setFlareKey] = useState(0);
  useEffect(() => {
    if (play !== "ring" || reduced || !el) return;
    const win = el.ownerDocument.defaultView ?? window;
    // A quiet hour (2.4 s), Theo's run landing (3.6 s), quiet again, then Priya's first photo (3.6 s); and again.
    const steps: { beat: RowBeat; ms: number }[] = [
      { beat: "later", ms: 2400 },
      { beat: "adding", ms: 3600 },
      { beat: "later", ms: 2400 },
      { beat: "joined", ms: 3600 },
    ];
    let i = 0;
    let t = 0;
    const next = () => {
      const s = steps[i % steps.length]!;
      setLiveBeat(s.beat);
      if (litAt(s.beat)) setFlareKey((k) => k + 1);
      i += 1;
      t = win.setTimeout(next, s.ms);
    };
    next();
    return () => win.clearTimeout(t);
  }, [play, reduced, el]);
  const nowBeat = play === "ring" && !reduced ? liveBeat : beat;
  const joined = nowBeat === "joined" && joiner !== undefined;
  const people = joined ? [joiner, ...faces] : faces;
  const total = joined ? count + 1 : count;
  const lit = litAt(nowBeat);

  /* ── the pointer, live or played ── */
  const [active, setActive] = useState<number | null>(null);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const slots = useRef<(HTMLSpanElement | null)[]>([]);
  const n = Math.min(shown, people.length);
  const answers = hover !== "still" && !instant;
  const enter = useCallback(
    (i: number) => {
      if (!answers) return;
      setPhase("in");
      setActive(i);
    },
    [answers],
  );
  const leave = useCallback(() => {
    if (!answers) return;
    setPhase("out");
    setActive(null);
  }, [answers]);

  useEffect(() => {
    if (play !== "hover" || !el) return;
    const win = el.ownerDocument.defaultView ?? window;
    const answering = hover !== "still";
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const t = win.setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    const clear = () => timers.forEach((t) => win.clearTimeout(t));
    if (reduced) {
      // Less motion: no walk. The pointer rests on a face mid-row and the row answers as it would, without moving
      // (the name still comes; nothing lifts).
      later(() => {
        const at = Math.min(3, n - 1);
        const xy = pointOn(el, slots.current[at]);
        if (xy) setCursor({ ...xy, travel: 0 });
        if (answering) {
          setPhase("in");
          setActive(at);
        }
      }, 300);
      return clear;
    }
    const home = { x: OFFSTAGE, y: el.offsetHeight * 0.62 };
    let pos = home;
    let i = 0;
    const step = () => {
      const s = WALK[i % WALK.length]!;
      i += 1;
      if (s.at === "in") {
        // A jump, unseen: the pointer waits off the row's left for its next pass.
        pos = home;
        setCursor({ ...home, travel: 0 });
        later(step, s.rest);
        return;
      }
      const face = s.at === "out" ? null : Math.min(s.at, n - 1);
      const to =
        face === null
          ? { x: pos.x + 26, y: el.offsetHeight + 34 }
          : (pointOn(el, slots.current[face]) ?? pos);
      const travel = travelFor(to.x - pos.x, to.y - pos.y);
      pos = to;
      setCursor({ ...to, travel });
      if (answering) {
        if (face === null)
          later(() => {
            setPhase("out");
            setActive(null);
          }, travel * LEAVES);
        else
          later(() => {
            setPhase("in");
            setActive(face);
          }, travel * ARRIVES);
      }
      later(step, travel + s.rest);
    };
    step();
    return clear;
  }, [play, reduced, el, hover, n]);

  const faceActive = instant ? pointer : active;
  const shifts = shiftsFor(n, hover === "still" ? null : faceActive);
  const ease =
    phase === "out" && hover !== "still" ? HOVER.out[hover] : HOVER.in;
  // Who the pointer is on, said in the count's place (both combs); the count otherwise.
  const naming =
    hover !== "still" && faceActive !== null && faceActive < n
      ? people[faceActive]!.name
      : null;

  const look = on === "page" && size === "default" ? IN_BAR : SIZES[size];
  const newest = people[0];
  const light = newest ? keyOf(newest.last) : "#fff";
  const vars: Vars = {
    "--pr-size": `${look.px}px`,
    "--pr-light": ring === "white" ? "#fff" : light,
    "--pr-paint":
      ring === "white"
        ? WHITE_RING
        : newest
          ? ringPaint(newest.last)
          : WHITE_RING,
    "--pr-glow": ring === "white" ? "rgb(255 255 255 / 0.5)" : alpha(light, 70),
  };

  return (
    <div
      ref={setEl}
      data-pr-row={on}
      data-pr-ring={ring}
      data-pr-beat={nowBeat}
      data-pr-hover={hover}
      data-pr-play={play}
      data-pr-held={instant ? "" : undefined}
      className={cn("pr-row relative", className)}
      style={vars}
    >
      <span
        className="pr-faces"
        onMouseLeave={leave}
        role="img"
        aria-label={`${newest?.name ?? ""}${lit ? " is adding now" : " added last"}, and ${formatCount(total - 1)} others`}
      >
        {people.slice(0, n).map((p, i) => {
          const wears = i === 0 ? ringState(ring, lit) : undefined;
          const raised = faceActive === i && hover !== "still";
          return (
            <span
              key={p.seed}
              ref={(node) => {
                slots.current[i] = node;
              }}
              data-pr-face={i}
              data-pr-wears={wears}
              data-pr-joining={
                i === 0 && joined && play === "ring" && !reduced
                  ? flareKey
                  : undefined
              }
              onMouseEnter={() => enter(i)}
              className="pr-face"
              style={
                {
                  zIndex: n - i + (raised ? n : 0),
                  transitionTimingFunction: ease,
                  "--shift": `${shifts[i]!.shift.toFixed(3)}px`,
                  "--scale-active": shifts[i]!.scale,
                } as Vars
              }
            >
              {wears ? (
                <Lit
                  key={`${p.seed}-${flareKey}`}
                  wears={wears}
                  puck={on === "page" && ground === "paper" && wears !== "fine"}
                />
              ) : null}
              <Face
                seed={p.seed}
                name={p.name}
                palette={palette}
                size={look.avatar}
                className={cn("pr-avatar", look.box)}
                initial={look.initial}
              />
            </span>
          );
        })}
      </span>
      {label ? (
        <span
          data-pr-count=""
          data-pr-naming={naming ? "" : undefined}
          aria-live="polite"
          className={cn(
            "pr-count text-sm tabular-nums",
            naming
              ? on === "photo"
                ? "font-medium text-white"
                : "font-medium text-foreground"
              : on === "photo"
                ? "text-white/85"
                : "text-muted-foreground",
          )}
        >
          {/* Keyed on its words, so each swap is a fresh entrance (`pr-swap`). */}
          <span key={naming ?? "count"} className="pr-count-words">
            {naming ??
              `${formatCount(total)} ${total === 1 ? "guest" : "guests"}`}
          </span>
        </span>
      ) : null}
      {play === "hover" && cursor ? (
        <Pointer x={cursor.x} y={cursor.y} travel={cursor.travel} />
      ) : null}
      {instant && pointer !== null ? (
        <HeldPointer at={pointer} slots={slots} />
      ) : null}
    </div>
  );
}

/** The newest's light: its ring, its glow, and on paper the puck that keeps its dark. */
function Lit({
  wears,
  puck,
}: {
  wears: "held" | "flare" | "fine";
  puck: boolean;
}) {
  return (
    <>
      {puck ? <span aria-hidden className="pr-puck" /> : null}
      <span aria-hidden className="pr-glow" data-wears={wears} />
      <span aria-hidden className="pr-ring" data-wears={wears} />
    </>
  );
}

/**
 * A DRAWN POINTER, the arrow the Mac Will judges on draws (black, a white
 * edge, a soft shadow), so it reads on a photograph and on paper alike. Its
 * tip, the arrow's top-left corner, stands on the point; a move glides over
 * `travel`, and a move of 0 is a jump.
 */
function Pointer({
  x,
  y,
  travel = 0,
}: {
  x: number;
  y: number;
  travel?: number;
}) {
  return (
    <span
      aria-hidden
      data-pr-pointer=""
      className="pr-pointer"
      style={{
        transform: `translate(${x - 2}px, ${y - 2}px)`,
        transitionDuration: `${travel}ms`,
      }}
    >
      <svg width="17" height="23" viewBox="0 0 17 23" fill="none">
        <path
          d="M2 2v15.6l3.9-3.7 2.7 6.3 2.9-1.25-2.7-6.2h5.3L2 2z"
          fill="#0b0b0c"
          stroke="#fff"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** The pointer at an instant, placed on the face it is held on, once the row has laid out. */
function HeldPointer({
  at,
  slots,
}: {
  at: number;
  slots: { current: (HTMLSpanElement | null)[] };
}) {
  const [xy, setXy] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const row = ref.current?.parentElement;
    const win = row?.ownerDocument.defaultView;
    if (!row || !win) return;
    const place = () => {
      const p = pointOn(row, slots.current[at]);
      if (p) setXy(p);
    };
    place();
    const t = win.setTimeout(place, 600);
    return () => win.clearTimeout(t);
  }, [at, slots]);
  return (
    <span ref={ref} aria-hidden>
      {xy ? <Pointer x={xy.x} y={xy.y} /> : null}
    </span>
  );
}
