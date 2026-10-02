"use client";

import { Check, SwitchCamera } from "lucide-react";

import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  CamBar,
  type CamProps,
  CamScreen,
  hint,
  justSpent,
  leftUnit,
  ModeSwitch,
  pill,
  RecPill,
  RollDone,
  VIDEO_SECONDS,
} from "./cam-shared";
import { ROLL } from "./fixtures";
import { FilmStill } from "./film";

/**
 * THE ROLL ROUND THE PICTURE (a branch of the album's own camera, new this
 * round).
 *
 * The viewfinder's twenty-four ticks leave the shutter and run round the
 * live picture itself: the picture stands in the screen as a rounded pane,
 * and its rim is the roll, twenty-four segments from twelve o'clock round,
 * each going dark as a shot spends it. The shutter is left a plain white
 * button, the way every camera's is, and the numeral beside it says what the
 * rim shows. While a video runs, the rim is its clock: a red line travels the
 * picture's edge to ten seconds.
 */

/* The picture's pane, at a phone's 375: 14 px from each side, 3:4. */
const PANE = { x: 14, w: 347, h: 463, r: 30 };
/* The rim rides 7 px outside the pane. */
const GAP = 7;
const RIM = {
  w: PANE.w + GAP * 2,
  h: PANE.h + GAP * 2,
  r: PANE.r + GAP,
};
const PAD = 3;

/**
 * A POINT AT DISTANCE `s` ALONG THE RIM, clockwise from the middle of its top
 * edge: the straight runs and the quarter circles of a rounded rectangle,
 * walked in order.
 */
function pointAt(s: number): [number, number] {
  const { w, h, r } = RIM;
  const arc = (Math.PI * r) / 2;
  const pieces: [number, (t: number) => [number, number]][] = [
    [w / 2 - r, (t) => [w / 2 + t, 0]],
    [arc, (t) => arcAt(w - r, r, -90, t / r)],
    [h - 2 * r, (t) => [w, r + t]],
    [arc, (t) => arcAt(w - r, h - r, 0, t / r)],
    [w - 2 * r, (t) => [w - r - t, h]],
    [arc, (t) => arcAt(r, h - r, 90, t / r)],
    [h - 2 * r, (t) => [0, h - r - t]],
    [arc, (t) => arcAt(r, r, 180, t / r)],
    [w / 2 - r, (t) => [r + t, 0]],
  ];
  let rest = s;
  for (const [len, at] of pieces) {
    if (rest <= len) return at(rest);
    rest -= len;
  }
  return [w / 2, 0];
}

function arcAt(cx: number, cy: number, from: number, rad: number) {
  const a = (from * Math.PI) / 180 + rad;
  return [cx + Math.cos(a) * RIM.r, cy + Math.sin(a) * RIM.r] as [
    number,
    number,
  ];
}

const PERIMETER =
  2 * (RIM.w - 2 * RIM.r) + 2 * (RIM.h - 2 * RIM.r) + 2 * Math.PI * RIM.r;

/** One stretch of the rim as a path, sampled every few pixels. */
function stretch(from: number, to: number): string {
  const pts: string[] = [];
  const steps = Math.max(2, Math.ceil((to - from) / 4));
  for (let k = 0; k <= steps; k++) {
    const [x, y] = pointAt(from + ((to - from) * k) / steps);
    pts.push(`${(x + PAD).toFixed(1)} ${(y + PAD).toFixed(1)}`);
  }
  return `M ${pts.join(" L ")}`;
}

const SEGMENTS = Array.from({ length: ROLL.shots }, (_, i) => {
  const each = PERIMETER / ROLL.shots;
  return stretch(i * each + 5, (i + 1) * each - 5);
});

function Rim({
  left,
  just,
  recording,
}: {
  left: number;
  just: number;
  /** A video running: the fraction of its ten seconds. */
  recording?: number;
}) {
  const spent = ROLL.shots - left;
  return (
    <svg
      aria-hidden
      className="dm-rim"
      width={RIM.w + PAD * 2}
      height={RIM.h + PAD * 2}
      viewBox={`0 0 ${RIM.w + PAD * 2} ${RIM.h + PAD * 2}`}
      data-dm-rim={`${left}/${ROLL.shots}`}
      data-rec={recording !== undefined ? "" : undefined}
    >
      {SEGMENTS.map((d, i) => (
        <path
          key={i}
          d={d}
          data-tick={i < spent - just ? "spent" : i < spent ? "just" : "lit"}
        />
      ))}
      {recording !== undefined && (
        <path
          className="dm-rim-rec"
          d={stretch(0, Math.max(1, PERIMETER * recording))}
        />
      )}
    </svg>
  );
}

export function RimCamera(p: CamProps) {
  const recording = p.phase === "recording";
  const done = p.phase === "done";
  const switchWay = p.video === "switch";
  const buttonWay = p.video === "button";
  const said = hint(p);
  return (
    <CamScreen id="rim">
      <CamBar
        sub={
          recording
            ? "Filming"
            : done
              ? "Your roll is done"
              : `Develops at ${ROLL.develops}`
        }
      />
      <div
        className="relative mx-auto mt-2.5 shrink-0"
        style={{ width: PANE.w, height: PANE.h }}
      >
        <span
          className="absolute"
          style={{ left: -GAP - PAD, top: -GAP - PAD }}
        >
          <Rim
            left={done ? 0 : p.left}
            just={justSpent(p)}
            recording={recording ? (p.seconds ?? 0) / VIDEO_SECONDS : undefined}
          />
        </span>
        <div
          className="relative size-full overflow-hidden"
          style={{ borderRadius: PANE.r }}
        >
          <FilmStill still={p.still} className="size-full" position="50% 45%" />
          {p.phase === "after" && <span aria-hidden className="dm-flash" />}
          {done && (
            <div className="dm-dim grid place-items-center px-7">
              <RollDone />
            </div>
          )}
          {p.phase === "after" && (
            <span
              data-dm-receipt
              className={cn(
                GLASS,
                "absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white",
              )}
            >
              <Check className="size-3.5" aria-hidden />
              {pill(said)}
            </span>
          )}
          {recording && p.seconds !== undefined && (
            <span className="absolute top-3 left-1/2 -translate-x-1/2">
              <RecPill seconds={p.seconds} />
            </span>
          )}
        </div>
      </div>
      <div
        className="flex flex-1 flex-col justify-center pb-4"
        data-dm-controls
        data-off={p.phase === "done" ? "" : undefined}
      >
        {switchWay && !done && (
          <ModeSwitch video={recording} className="mb-4 self-center" />
        )}
        <div className="grid grid-cols-3 items-center px-7">
          <div className="justify-self-start" data-dm-say>
            <p className="font-heading text-[30px] leading-none tabular-nums">
              {done ? 0 : p.left}
            </p>
            <p className="mt-1 text-xs text-white/60">{leftUnit(p)}</p>
          </div>
          <span
            className="dm-shutter justify-self-center"
            data-video={p.video === "hold" && recording ? "" : undefined}
            data-stop={recording && switchWay ? "" : undefined}
            data-off={done ? "" : undefined}
            data-dm-reach
            aria-label="Take the shot"
          />
          {buttonWay ? (
            <span
              className="dm-video-button justify-self-end"
              data-stop={recording ? "" : undefined}
              aria-label="Film a video"
            />
          ) : (
            <span
              className="dm-cam-round justify-self-end"
              aria-label="Turn the camera round"
            >
              <SwitchCamera className="size-5" aria-hidden />
            </span>
          )}
        </div>
        <p className="mt-4 h-4 text-center text-xs text-white/55" data-dm-hint>
          {p.phase === "after" ? "It develops at 9 am with everyone's." : said}
        </p>
      </div>
    </CamScreen>
  );
}
