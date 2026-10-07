"use client";

import { useRef, useState } from "react";

import type { ShutterState } from "@/components/ui/shutter";

import { Dock, GuestAlbum, Ring, type RingBeat } from "./album";
import type { Light } from "./fixtures";
import type { Ground } from "./knobs";
import { envelope, useLoop } from "./live";

/**
 * THE ADD, ANSWERING: production's dock and `Shutter` at the album's foot,
 * the Ring's light moving one way per option.
 *
 *  - `breath`: production's own Ring and motion, untouched (its three hues,
 *    the 4.8 s breath at rest, the dim while files send, the check as they
 *    land);
 *  - `still`: Aperture's Ring, still at rest; the fill as files send, one
 *    flare as the run lands;
 *  - `answer`: Aperture's Ring, still at rest; the envelope (quick to rise,
 *    slow to settle) on each of her photos landing;
 *  - `party`: the same envelope on every photo landing in the album, another
 *    guest's lifting it less than hers.
 *
 * ★ STILL AT REST, EVERY NEW OPTION (the creative director's pass): a breath
 * while nothing happens is the loop the brand rules out, the ROADMAP's "idle
 * breath" included.
 *
 * ★ ONE NIGHT, ONE CLOCK (`LOOP`): at rest, her press, three photos landing a
 * beat and a half apart, the run whole, rest, then other guests' photos
 * landing. The moving frame plays it; each held beat is the light at one of
 * its instants and the trace under the row draws the whole of it, all read
 * off the same functions, so a still, the loop and the trace agree.
 *
 * ★ THE ALBUM'S ANSWER IS WORN (`after: album`): where the cover's Seam holds
 * the album's light, the Ring rests unlit and the same motions light it from
 * nothing.
 */

export type AddWay = "breath" | "still" | "answer" | "party";

/** The night's clock, in seconds. */
export const LOOP = {
  period: 13.6,
  /** Another guest's photo before her press, and two after the run. */
  guests: [0.9, 10.4, 11.2],
  press: 2.2,
  /** Her three photos landing. */
  lands: [3.6, 5.0, 6.4],
  done: 6.4,
  /** How long a landed run stands whole (`guest-action-dock.tsx`'s `DONE_HOLD_MS`). */
  hold: 1.6,
} as const;

/** How far another guest's photo lifts the Ring, against hers (the creative director's pass: hers must outshine theirs). */
const GUEST_LIFT = 0.45;
/** The envelope's settle: about two and a half seconds to rest. */
const SETTLE = 1.1;

/** The run at an instant: production's shutter state, its progress and what is still on its way. */
export function runAt(t: number): {
  state: ShutterState;
  progress: number;
  count: number;
} {
  if (t >= LOOP.press && t < LOOP.done) {
    const landed = LOOP.lands.filter((e) => e <= t).length;
    return {
      state: "sending",
      progress: (t - LOOP.press) / (LOOP.done - LOOP.press),
      count: LOOP.lands.length - landed,
    };
  }
  if (t >= LOOP.done && t < LOOP.done + LOOP.hold)
    return { state: "done", progress: 1, count: 0 };
  return { state: "idle", progress: 0, count: 0 };
}

/** The atom's own breath, as `shutter.css` draws it (0.6 to 0.32 and back over 9.6 s), as a lift for the trace. */
const breathAt = (t: number) =>
  -0.7 * ((1 - Math.cos((2 * Math.PI * t) / 9.6)) / 2);

/** The Ring's lift at an instant, per way (for `breath`, its breath's dip: the atom draws its own motion). */
export function liftAt(way: AddWay, t: number): number {
  if (way === "breath") return runAt(t).state === "idle" ? breathAt(t) : 0;
  if (way === "still") return envelope(t, [LOOP.done], 0.8);
  if (way === "answer") return envelope(t, LOOP.lands, SETTLE);
  return Math.max(
    envelope(t, LOOP.lands, SETTLE),
    GUEST_LIFT * envelope(t, LOOP.guests, SETTLE),
  );
}

/* ── the beats ─────────────────────────────────────────────────────────── */

export type Beat = "rest" | "landing" | "landed" | "guest";

/** Each beat's instant on the clock. */
const BEAT_AT: Record<Beat, number> = {
  rest: 2.0,
  landing: 3.75,
  landed: LOOP.done + 0.12,
  guest: LOOP.guests[1] + 0.2,
};

export const BEAT_TITLE: Record<Beat, string> = {
  rest: "At rest",
  landing: "Her first photo lands, two still sending",
  landed: "The run lands",
  guest: "Another guest's photo lands, a moment on",
};

/** The Ring at a beat, in the album's answer. */
export function beatOf(
  way: AddWay,
  beat: Beat,
  kind: RingBeat["kind"],
): RingBeat {
  const t = BEAT_AT[beat];
  const run = runAt(t);
  // ★ TODAY'S BREATH, HELD: a still of today's Ring at rest is drawn at the dip of its loop (the atom's own glow at
  // its lowest), the one way a picture can say it moves while nothing happens.
  if (way === "breath")
    return {
      kind,
      ...run,
      lift: run.state === "idle" ? -0.55 : undefined,
      held: true,
    };
  return { kind, ...run, lift: liftAt(way, t), held: true, key: true };
}

/* ── the frames ────────────────────────────────────────────────────────── */

export type Lights = { light: Light; keyLight: Light };

/** The album's foot with the Ring held at one beat. */
export function AddBeat({
  way,
  beat,
  kind,
  lights,
  ground,
}: {
  way: AddWay;
  beat: Beat;
  kind: RingBeat["kind"];
  lights: Lights;
  ground: Ground;
}) {
  return (
    <GuestAlbum
      screen="375"
      ground={ground}
      seam={false}
      scroll="in"
      dock={
        <Dock
          ring={
            <Ring
              beat={beatOf(way, beat, kind)}
              light={lights.light}
              keyLight={lights.keyLight}
              ground={ground}
            />
          }
        />
      }
    />
  );
}

/**
 * THE MOMENT PLAYING: the night's clock on a loop in the frame, the shutter's
 * state stepping with it (a render only when the run's state, count or a
 * twentieth of its progress changes) and the envelope written straight onto
 * the Ring every frame. Today's Ring plays the atom's own breath. Under reduced
 * motion it holds the rest.
 */
export function AddPlaying({
  way,
  kind,
  lights,
  ground,
}: {
  way: AddWay;
  kind: RingBeat["kind"];
  lights: Lights;
  ground: Ground;
}) {
  const ring = useRef<HTMLSpanElement | null>(null);
  const [run, setRun] = useState(() => runAt(BEAT_AT.rest));
  const key = useRef("");
  const today = way === "breath";
  useLoop(ring, LOOP.period, BEAT_AT.rest, (t) => {
    const now = runAt(t);
    const k = `${now.state}:${now.count}:${Math.round(now.progress * 20)}`;
    if (k !== key.current) {
      key.current = k;
      setRun(now);
    }
    if (!today)
      ring.current?.style.setProperty("--sg-lift", `${liftAt(way, t)}`);
  });
  return (
    <GuestAlbum
      screen="375"
      ground={ground}
      seam={false}
      scroll="in"
      dock={
        <Dock
          ring={
            <span data-sg-playing={way} className="inline-flex">
              <Ring
                wrapRef={ring}
                beat={
                  today
                    ? { kind, ...run }
                    : { kind, ...run, lift: 0, still: true, key: true }
                }
                light={lights.light}
                keyLight={lights.keyLight}
                ground={ground}
              />
            </span>
          }
        />
      }
    />
  );
}

/* ── the trace ─────────────────────────────────────────────────────────── */

/** As wide as the row of five phones above it (375 each, 24 apart). */
const TRACE_W = 5 * 375 + 4 * 24;
const TRACE_H = 64;
const MARKS: readonly { at: number; label: string }[] = [
  { at: LOOP.guests[0], label: "a guest's photo" },
  { at: LOOP.press, label: "her press" },
  { at: LOOP.lands[0], label: "her photos land" },
  { at: LOOP.lands[1], label: "" },
  { at: LOOP.done, label: "" },
  { at: LOOP.guests[1], label: "guests' photos" },
  { at: LOOP.guests[2], label: "" },
];

/**
 * THE RING'S GLOW OVER THE NIGHT'S CLOCK, the one picture of how an option
 * moves that a still can hold (the creative director's pass: the options
 * differ over time). Read off `liftAt`, the function the frames above play,
 * so the trace and the frames cannot disagree; a lab drawing, never the
 * product's.
 */
export function Trace({ way }: { way: AddWay }) {
  const x = (t: number) => (t / LOOP.period) * TRACE_W;
  // The glow's level: today's from its own 0.6 (its dip at 0.32), a new Ring's from its still rest.
  const level = (t: number) => {
    const lift = liftAt(way, t);
    return way === "breath" ? 0.6 + 0.4 * lift : 0.2 + 0.8 * Math.max(0, lift);
  };
  const y = (v: number) => TRACE_H - 6 - v * (TRACE_H - 18);
  const points: string[] = [];
  for (let i = 0; i <= 340; i++) {
    const t = (i / 340) * LOOP.period;
    points.push(`${x(t).toFixed(1)},${y(level(t)).toFixed(1)}`);
  }
  return (
    <figure data-sg-trace={way} className="m-0 flex flex-col gap-1.5">
      <figcaption className="text-[11px] text-muted-foreground">
        The Ring&apos;s glow over the night&apos;s clock, as the first frame
        plays it; the dots are the four stills beside it
      </figcaption>
      <svg
        width={TRACE_W}
        height={TRACE_H + 16}
        viewBox={`0 0 ${TRACE_W} ${TRACE_H + 16}`}
        aria-hidden
        className="overflow-visible text-muted-foreground"
      >
        <line
          x1={0}
          x2={TRACE_W}
          y1={y(0.2)}
          y2={y(0.2)}
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeDasharray="2 4"
        />
        {MARKS.map((m, i) => (
          <g key={i}>
            <line
              x1={x(m.at)}
              x2={x(m.at)}
              y1={2}
              y2={TRACE_H}
              stroke="currentColor"
              strokeOpacity={0.22}
            />
            {m.label ? (
              <text
                x={x(m.at) + 4}
                y={TRACE_H + 13}
                fontSize={11}
                fill="currentColor"
              >
                {m.label}
              </text>
            ) : null}
          </g>
        ))}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        {(Object.keys(BEAT_AT) as Beat[]).map((beat) => (
          <circle
            key={beat}
            data-sg-trace-beat={beat}
            cx={x(BEAT_AT[beat])}
            cy={y(level(BEAT_AT[beat]))}
            r={4}
            fill="var(--foreground)"
          />
        ))}
      </svg>
    </figure>
  );
}
