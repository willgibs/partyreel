"use client";

import { Aperture, Play, SwitchCamera } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  askLine,
  CamBar,
  type CamProps,
  clock,
  IosAlert,
  isLive,
  RecPill,
  Refused,
  videosWord,
} from "./cam-shared";
import { EVENT, HER_SHOTS, ROLL } from "./fixtures";
import { FilmStill } from "./film";

/**
 * A CAMERA THAT SHOOTS ON A REEL (new this round).
 *
 * The viewfinder's live picture at the phone's whole frame, over a strip of
 * film: twenty-four frames between sprocket holes, the ones she has exposed
 * dark with the minute each was taken, the next one lit and waiting. A shot
 * exposes it and winds the strip on one frame, so the roll is always in
 * sight, and the strip is the thread the rest of the night can carry: her
 * stack in the waiting room, and the reel that premieres the roll at 9 am.
 * It is the product's own name, a party on a reel.
 *
 * The edge print is the film's own, the way a real strip carries its stock
 * and frame numbers along the sprockets, here in the host's names.
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
 * HER ROLL, AS THE STRIP HOLDS IT: her six (oldest first on the strip, which
 * runs left to right as the night does), the frame she is on, the rest fresh.
 */
function roll(p: CamProps): Cell[] {
  const cells: Cell[] = [];
  const spentPhotos = ROLL.shots - p.left;
  const own = p.count === "own";
  const three = p.count === "three";
  // Her six so far, oldest first. With `three` a video spends three frames.
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
  // The shot just taken ("after"), at 10:41.
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
  const cells = roll(p);
  const current = cells.find(
    (c) => c.state === "current" || c.state === "rolling",
  )!;
  // The strip is laid out on frame numbers, the current frame at the centre.
  const x = (n: number) => 187.5 + (n - current.n) * PITCH - CELL_W / 2;
  return (
    <div className="dm-strip" data-dm-strip={`${current.n - 1} exposed`}>
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
            data-video={c.video ? "" : undefined}
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
  const videoMode = switchWay && recording;
  const frame = ROLL.shots - p.left + 1;
  return (
    <div className="dm-cam" data-dm-camera="reel">
      <CamBar sub={recording ? "Filming" : "Develops at 9 am"} />
      <div className="relative shrink-0">
        {live ? (
          <FilmStill
            still={p.still}
            look={p.look}
            className="aspect-[3/4] w-full"
            position="50% 45%"
          />
        ) : (
          <div
            className={cn(
              "flex aspect-[3/4] w-full flex-col items-center gap-3 bg-[#0c0c0c] px-8 text-center",
              "justify-center",
            )}
          >
            {p.phase === "refused" ? (
              <Refused left={p.left} />
            ) : (
              <Aperture className="size-8 text-white/35" aria-hidden />
            )}
          </div>
        )}
        {recording && p.seconds !== undefined && (
          <span className="absolute top-3 left-1/2 -translate-x-1/2">
            <RecPill seconds={p.seconds} />
          </span>
        )}
      </div>
      <Strip {...p} />
      <div className="flex flex-1 flex-col justify-center pb-4">
        {switchWay && (
          <div
            className="mb-3 flex justify-center gap-6 text-xs font-semibold tracking-[0.16em] uppercase"
            data-dm-modes
          >
            <span className={videoMode ? "text-white/45" : "text-white"}>
              Photo
            </span>
            <span className={videoMode ? "text-white" : "text-white/45"}>
              Video
            </span>
          </div>
        )}
        <div className="grid grid-cols-3 items-center px-6">
          <div className="justify-self-start" data-dm-say>
            <p className="font-heading text-[26px] leading-none font-medium tabular-nums">
              {p.left}
            </p>
            <p className="mt-1 text-xs text-white/60">
              {p.count === "own"
                ? `photos · ${videosWord(p.videosLeft ?? 3)}`
                : "left on the roll"}
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
        <p className="mt-4 text-center text-xs text-white/55" data-dm-hint>
          {recording
            ? hold
              ? "Let go to stop."
              : "Press again to stop."
            : p.phase === "after"
              ? `Wound on to frame ${frame}.`
              : hold && live
                ? "Tap for a photo. Hold for a video."
                : live
                  ? `Frame ${frame} of ${ROLL.shots}. There is no retake.`
                  : ""}
        </p>
      </div>
      {(p.phase === "ask" || p.phase === "again") && (
        <IosAlert mic={p.mic} note={askLine(p.phase, p.mic)} />
      )}
    </div>
  );
}
