"use client";

import "./row.css";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { floatingTip } from "@/components/ui/floating-layer";
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
 * ★ THREE WAYS TO RING THE NEWEST (the `newest` decision), each at a beat:
 *  - `white`: a white ring and a soft white glow while their photos land
 *    (the quarter hour the hub's strip lights its newest end by), then none;
 *  - `photo`: the same, in the light of the photograph they just added (its
 *    sampled key, `light.ts`);
 *  - `lands`: a flare in that light as each photo lands, settling over two
 *    seconds into a fine ring that always marks the newest.
 * ★ ON PAPER A LIGHT KEEPS ITS DARK (Aperture): a lit ring stands in a small
 * puck of the room, as the Add's Ring does on paper; a fine ring at rest is
 * printed in the page's ink.
 *
 * ★ THREE WAYS TO ANSWER A POINTER (the `hover` decision): none, as today;
 * transitions.dev's avatar-group hover at its own numbers
 * (`.agents/skills/transitions-dev/11-avatar-group-hover.md`); or that lift
 * eased home with no overshoot, the face brought to the front and named. The
 * timing function is written BEFORE the variables, so a lift eases in and the
 * return wears its own curve (the recipe's trick). Under reduced motion
 * nothing moves; an INSTANT (a held beat) is a drawing and keeps its pose.
 */

export type RingWay = "white" | "photo" | "lands";
export type HoverWay = "still" | "comb" | "named";

/** The beat a row is drawn at. */
export type RowBeat =
  /** Their photos are landing now (the newest within the quarter hour). */
  | "adding"
  /** An hour on: nobody is adding. */
  | "later"
  /** Priya's own first photo has just landed: her face leads. */
  | "joined";

type Size = "xxs" | "xs" | "sm" | "default" | "lg";
const PX: Record<Size, number> = {
  xxs: 16,
  xs: 20,
  sm: 24,
  default: 32,
  lg: 40,
};

/** The hover's numbers: transitions.dev's own (`comb`), and the same lift eased home (`named`). */
const HOVER = {
  lift: -4,
  scale: 1.05,
  falloff: 0.45,
  in: "cubic-bezier(0.22, 1, 0.36, 1)",
  out: {
    comb: "cubic-bezier(0.34, 3.85, 0.64, 1)",
    named: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
} as const;

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
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
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
    if (play !== "hover" || reduced || !el) return;
    const win = el.ownerDocument.defaultView ?? window;
    // A pointer drifting in from the left, along the faces, a beat on each, then away.
    const path: (number | null)[] = [null, 0, 1, 2, 3, 2, 4, 5, null, null];
    let i = 0;
    let t = 0;
    const step = () => {
      const target = path[i % path.length]!;
      if (target === null) {
        setCursor({ x: -22, y: el.offsetHeight * 0.6 });
        if (hover !== "still") {
          setPhase("out");
          setActive(null);
        }
      } else {
        const at = pointOn(el, slots.current[target]);
        if (at) setCursor(at);
        if (hover !== "still") {
          setPhase("in");
          setActive(target);
        }
      }
      i += 1;
      t = win.setTimeout(step, target === null ? 900 : 640);
    };
    step();
    return () => win.clearTimeout(t);
  }, [play, reduced, el, hover]);

  const faceActive = instant ? pointer : active;
  const shifts = shiftsFor(n, hover === "still" ? null : faceActive);
  const ease =
    phase === "out" && hover !== "still"
      ? HOVER.out[hover === "comb" ? "comb" : "named"]
      : HOVER.in;

  const px = PX[size];
  const newest = people[0];
  const light = newest ? keyOf(newest.last) : "#fff";
  const vars: Vars = {
    "--pr-size": `${px}px`,
    "--pr-light": ring === "white" ? "#fff" : light,
    "--pr-paint":
      ring === "white"
        ? WHITE_RING
        : newest
          ? ringPaint(newest.last)
          : WHITE_RING,
    "--pr-glow": ring === "white" ? "rgb(255 255 255 / 0.5)" : alpha(light, 70),
  };
  // The avatar's own sizes are 24, 32 and 40; the door's smaller faces take the default box at their own size.
  const avatarSize = size === "sm" || size === "lg" ? size : "default";
  const boxed = size === "xs" || size === "xxs";

  return (
    <div
      ref={setEl}
      data-pr-row={on}
      data-pr-ring={ring}
      data-pr-beat={nowBeat}
      data-pr-hover={hover}
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
          const raised = faceActive === i && hover === "named";
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
                size={avatarSize}
                className={cn(
                  "pr-avatar",
                  boxed && (size === "xs" ? "size-5" : "size-4"),
                )}
                initial={cn(
                  size === "sm" && "text-[10px]",
                  size === "lg" && "text-base",
                  boxed && "text-[8px]",
                )}
              />
              {raised ? (
                <span
                  data-pr-name=""
                  className={cn(
                    "pr-name px-2.5 py-1 text-xs font-medium",
                    floatingTip,
                  )}
                >
                  {p.name}
                </span>
              ) : null}
            </span>
          );
        })}
      </span>
      {label ? (
        <span
          data-pr-count=""
          className={cn(
            "pr-count text-label font-semibold tracking-[0.08em] uppercase tabular-nums",
            on === "photo" ? "text-white" : "text-muted-foreground",
          )}
        >
          {`${formatCount(total)} ${total === 1 ? "guest" : "guests"}`}
        </span>
      ) : null}
      {play === "hover" && cursor && !reduced ? (
        <Pointer x={cursor.x} y={cursor.y} />
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

/** A drawn pointer, the arrow a mouse shows, where the loop has it. */
function Pointer({ x, y }: { x: number; y: number }) {
  return (
    <span
      aria-hidden
      data-pr-pointer=""
      className="pr-pointer"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
        <path
          d="M1.5 1.5v14.2l3.6-3.4 2.4 5.6 2.5-1.1-2.4-5.5h5.1L1.5 1.5z"
          fill="#fff"
          stroke="#111"
          strokeWidth="1.2"
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
