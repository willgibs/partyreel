"use client";

import { Play, SwitchCamera } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  CamBar,
  type CamProps,
  CamScreen,
  clock,
  frameOf,
  hint,
  isLive,
  leftUnit,
  ModeSwitch,
  RecPill,
  RollDone,
} from "./cam-shared";
import { EVENT, HER_SHOTS, ROLL } from "./fixtures";
import { FilmStill } from "./film";

/**
 * A CAMERA THAT SHOOTS ON A REEL, AS ROUND TWO DREW IT (kept, the reference
 * the two branches beside it are read against).
 *
 * The viewfinder's live picture at the phone's whole width, over a strip of
 * film: twenty-four frames between sprocket holes, the ones she has exposed
 * dark with the minute each was taken, the next one lit and waiting. A shot
 * exposes it and winds the strip on one frame, so the roll is always in
 * sight. The edge print is the film's own, in the host's names.
 */

const PITCH = 62;
const CELL_W = 54;

type Cell = {
  n: number;
  state: "exposed" | "current" | "fresh" | "rolling";
  time?: string;
  video?: number;
  /** A video that spent more than one frame, drawn across them. */
  span?: number;
};

/**
 * HER ROLL, AS A STRIP HOLDS IT: her six (oldest first on the strip, which
 * runs left to right as the night does), the frame she is on, the rest fresh.
 * Shared by both reel cameras, so the two read one roll.
 */
export function rollCells(p: CamProps): Cell[] {
  const cells: Cell[] = [];
  const spentPhotos = p.phase === "done" ? ROLL.shots : ROLL.shots - p.left;
  const own = p.count === "own";
  const three = p.count === "three";
  const history = [...HER_SHOTS].reverse();
  let n = 1;
  for (const shot of history) {
    if (n > spentPhotos) break;
    if (shot.video && own) continue;
    const span = shot.video && three ? 3 : 1;
    cells.push({
      n,
      state: "exposed",
      time: shot.time,
      video: shot.video,
      span,
    });
    n += span;
  }
  if (p.phase === "after" && n <= spentPhotos) {
    const span = p.afterVideo && three ? 3 : 1;
    cells.push({
      n,
      state: "exposed",
      time: "10:41",
      video: p.afterVideo ? 6 : undefined,
      span,
    });
    n += span;
  }
  while (n <= spentPhotos) {
    cells.push({ n, state: "exposed", span: 1 });
    n += 1;
  }
  if (n <= ROLL.shots)
    cells.push({
      n,
      state: p.phase === "recording" ? "rolling" : "current",
      span: 1,
    });
  for (let k = n + 1; k <= ROLL.shots; k++)
    cells.push({ n: k, state: "fresh", span: 1 });
  return cells;
}

function Strip(p: CamProps) {
  const cells = rollCells(p);
  const current =
    cells.find((c) => c.state === "current" || c.state === "rolling") ??
    cells[cells.length - 1];
  // Laid out on frame numbers, the current frame at the centre.
  const x = (n: number) => 187.5 + (n - current.n) * PITCH - CELL_W / 2;
  return (
    <div
      className="dm-strip"
      data-dm-strip={`${cells.filter((c) => c.state === "exposed").reduce((a, c) => a + (c.span ?? 1), 0)} exposed`}
    >
      <div className="dm-strip-holes dm-strip-holes-top" aria-hidden />
      <div className="dm-strip-holes dm-strip-holes-bottom" aria-hidden />
      <p aria-hidden className="dm-edge dm-edge-top">
        {`${EVENT.name.toUpperCase()}  ▸ ${ROLL.shots} EXP  ▸ ISO 800`}
      </p>
      {cells.map((c) => {
        const w = CELL_W + ((c.span ?? 1) - 1) * PITCH;
        return (
          <span
            key={c.n}
            className="dm-strip-cell"
            data-state={c.state}
            style={{ left: x(c.n), width: w }}
          >
            {c.state === "exposed" && c.time && (
              <span className="dm-strip-time">
                {c.video ? (
                  <>
                    <Play className="size-2.5 fill-current" aria-hidden />
                    {clock(c.video)}
                  </>
                ) : (
                  c.time
                )}
              </span>
            )}
            {c.state === "rolling" && (
              <span className="dm-strip-time dm-strip-time-rec">
                {clock(p.seconds ?? 0)}
              </span>
            )}
          </span>
        );
      })}
      {cells.map((c) => (
        <span
          key={`n${c.n}`}
          aria-hidden
          className={cn(
            "dm-edge dm-edge-num",
            (c.state === "current" || c.state === "rolling") && "dm-edge-on",
          )}
          style={{ left: x(c.n) + 2 }}
        >
          {c.state === "current" || c.state === "rolling" ? `▸${c.n}` : c.n}
        </span>
      ))}
    </div>
  );
}

export function ReelCamera(p: CamProps) {
  const live = isLive(p.phase);
  const recording = p.phase === "recording";
  const hold = p.video === "hold";
  const switchWay = p.video === "switch";
  const buttonWay = p.video === "button";
  const done = p.phase === "done";
  const frame = frameOf(p);
  return (
    <CamScreen id="reel">
      <CamBar
        sub={
          recording
            ? "Filming"
            : done
              ? "Your roll is done"
              : "Develops at 9 am"
        }
      />
      <div className="relative shrink-0">
        {live ? (
          <FilmStill
            still={p.still}
            className="aspect-[3/4] w-full"
            position="50% 45%"
          />
        ) : (
          <div className="flex aspect-[3/4] w-full items-center bg-[#0c0c0c] px-7">
            <RollDone />
          </div>
        )}
        {recording && p.seconds !== undefined && (
          <span className="absolute top-3 left-1/2 -translate-x-1/2">
            <RecPill seconds={p.seconds} />
          </span>
        )}
        {p.phase === "after" && <span aria-hidden className="dm-flash" />}
      </div>
      <Strip {...p} />
      <div
        className="flex flex-1 flex-col justify-center pb-4"
        data-dm-controls
        data-off={p.phase === "done" ? "" : undefined}
      >
        {switchWay && live && (
          <ModeSwitch video={recording} className="mb-3 self-center" />
        )}
        <div className="grid grid-cols-3 items-center px-6">
          <div className="justify-self-start" data-dm-say>
            <p className="font-heading text-[26px] leading-none tabular-nums">
              {done ? 0 : p.left}
            </p>
            <p className="mt-1 text-xs text-white/60">
              {p.count === "own" ? leftUnit(p) : "left on the roll"}
            </p>
          </div>
          <span
            className="dm-shutter justify-self-center"
            data-video={hold && recording ? "" : undefined}
            data-stop={recording && switchWay ? "" : undefined}
            data-off={live ? undefined : ""}
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
          {p.phase === "after"
            ? `Wound on to frame ${frame}.`
            : p.phase === "framing" && !hold
              ? `Frame ${frame} of ${ROLL.shots}. There is no retake.`
              : hint(p)}
        </p>
      </div>
    </CamScreen>
  );
}
