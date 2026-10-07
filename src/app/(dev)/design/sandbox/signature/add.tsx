"use client";

import type { CSSProperties } from "react";
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
 *  - `breath`: production's own motion, untouched (the 4.8 s breath at rest,
 *    the dim while files send, the check as they land);
 *  - `still`: no breath; the fill as files send, one flare as the run lands;
 *  - `answer`: the envelope (quick to rise, slow to settle) on each of her
 *    photos landing, over a breath so faint it only says ready;
 *  - `party`: the same envelope on every photo landing in the album.
 *
 * ★ ONE NIGHT, ONE CLOCK (`LOOP`): at rest, her press, three photos landing
 * a beat and a half apart, the run whole, rest, then other guests' photos
 * landing. The moving frame plays it; each held beat is the light at one of
 * its instants, read off the same functions, so a still and the loop agree.
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

/** The faint breath under the envelope: a tenth of the glow's height, over seven seconds. */
const faint = (t: number) =>
  -0.25 * ((1 - Math.cos((2 * Math.PI * t) / 7)) / 2);

/** The Ring's lift at an instant, per way (null: production's own motion, the breath). */
export function liftAt(way: AddWay, t: number): number | null {
  if (way === "breath") return null;
  if (way === "still") return envelope(t, [LOOP.done], 0.8);
  if (way === "answer") {
    const env = envelope(t, LOOP.lands);
    return runAt(t).state === "idle" ? env + faint(t) * (1 - env) : env;
  }
  return envelope(t, [...LOOP.lands, ...LOOP.guests]);
}

/* ── the beats ─────────────────────────────────────────────────────────── */

export type Beat = "rest" | "landing" | "landed" | "guest";

/** Each beat's instant on the clock. */
const BEAT_AT: Record<Beat, number> = {
  rest: 2.0,
  landing: 3.9,
  landed: LOOP.done + 0.05,
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
  const lift = liftAt(way, t);
  // ★ THE BREATH, HELD: a still of today's Ring at rest is drawn mid-breath (production's own glow at the dip of
  // its loop), the one way a picture can say it moves while nothing happens.
  const breathRest = way === "breath" && run.state === "idle";
  return {
    kind,
    ...run,
    lift: breathRest ? -0.55 : (lift ?? undefined),
    held: true,
  };
}

/* ── the frames ────────────────────────────────────────────────────────── */

/** The album's foot with the Ring held at one beat. */
export function AddBeat({
  way,
  beat,
  kind,
  light,
  ground,
}: {
  way: AddWay;
  beat: Beat;
  kind: RingBeat["kind"];
  light: Light;
  ground: Ground;
}) {
  return (
    <GuestAlbum
      screen="375"
      ground={ground}
      seam={null}
      scroll
      dock={
        <Dock
          ring={
            <Ring
              beat={beatOf(way, beat, kind)}
              light={light}
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
 * the Ring every frame. Under reduced motion it holds the rest.
 */
export function AddPlaying({
  way,
  kind,
  light,
  ground,
}: {
  way: AddWay;
  kind: RingBeat["kind"];
  light: Light;
  ground: Ground;
}) {
  const ring = useRef<HTMLSpanElement | null>(null);
  const [run, setRun] = useState(() => runAt(BEAT_AT.rest));
  const key = useRef("");
  useLoop(ring, LOOP.period, BEAT_AT.rest, (t) => {
    const now = runAt(t);
    const k = `${now.state}:${now.count}:${Math.round(now.progress * 20)}`;
    if (k !== key.current) {
      key.current = k;
      setRun(now);
    }
    const lift = liftAt(way, t);
    if (lift !== null) ring.current?.style.setProperty("--sg-lift", `${lift}`);
  });
  const lifted = way !== "breath";
  return (
    <GuestAlbum
      screen="375"
      ground={ground}
      seam={null}
      scroll
      dock={
        <Dock
          ring={
            <span
              data-sg-playing={way}
              style={{ display: "inline-flex" } as CSSProperties}
            >
              <Ring
                wrapRef={ring}
                beat={{
                  kind,
                  ...run,
                  lift: lifted ? 0 : undefined,
                  held: false,
                  still: lifted,
                }}
                light={light}
                ground={ground}
              />
            </span>
          }
        />
      }
    />
  );
}
