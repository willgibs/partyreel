"use client";

import { Check, Play, SwitchCamera } from "lucide-react";

import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  CamBar,
  type CamProps,
  CamScreen,
  clock,
  frameOf,
  hint,
  leftUnit,
  ModeSwitch,
  pill,
  RecPill,
  RollDone,
} from "./cam-shared";
import { rollCells } from "./cam-reel";
import { ROLL } from "./fixtures";
import { FilmStill } from "./film";

/**
 * THE REEL AS A TIMELINE (a branch of the camera that shoots on a reel, new
 * this round).
 *
 * The reel's idea kept whole (her roll in sight under the picture, a frame
 * spent and the strip moving on with every shot) and its film stock taken
 * out: no sprocket holes, no edge print, no brown base. The strip is drawn
 * the way the product draws a reel and a phone draws a timeline: twenty-four
 * rounded frames on black, the spent ones sealed dark glass with their
 * minute, the fresh ones a hairline, and the frame she is on holding the live
 * picture in miniature, so she watches her shot go onto the reel and the
 * reel glide on to the next.
 */

const CELL = { w: 30, h: 40 };
const PITCH = 37;

function Timeline(p: CamProps) {
  const cells = rollCells(p);
  const current =
    cells.find((c) => c.state === "current" || c.state === "rolling") ??
    cells[cells.length - 1];
  const x = (n: number) => 187.5 + (n - current.n) * PITCH - CELL.w / 2;
  // A video counted on its own is no frame of the 24: the strip stays put.
  const after = p.phase === "after" && !(p.afterVideo && p.count === "own");
  const exposed = cells
    .filter((c) => c.state === "exposed")
    .reduce((a, c) => a + (c.span ?? 1), 0);
  return (
    <div className="dm-tl" data-dm-strip={`${exposed} exposed`}>
      <div className="dm-tl-track" data-wound={after ? "" : undefined}>
        {cells.map((c) => {
          const w = CELL.w + ((c.span ?? 1) - 1) * PITCH;
          const isNow = c.state === "current" || c.state === "rolling";
          const just = after && c.state === "exposed" && c.time === "10:41";
          return (
            <span
              key={c.n}
              className="dm-tl-cell"
              data-state={c.state}
              data-just={just ? "" : undefined}
              style={{ left: x(c.n), width: w, height: CELL.h }}
            >
              {isNow && c.state === "current" && (
                <FilmStill
                  still={p.still}
                  className="size-full"
                  position="50% 45%"
                />
              )}
              {c.state === "exposed" && c.time && (
                <span className="dm-tl-time">
                  {c.video ? (
                    <>
                      <Play className="size-2 fill-current" aria-hidden />
                      {clock(c.video)}
                    </>
                  ) : (
                    c.time
                  )}
                </span>
              )}
              {c.state === "rolling" && (
                <span className="dm-tl-time dm-tl-time-rec">
                  {clock(p.seconds ?? 0)}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function TimelineCamera(p: CamProps) {
  const recording = p.phase === "recording";
  const done = p.phase === "done";
  const hold = p.video === "hold";
  const switchWay = p.video === "switch";
  const buttonWay = p.video === "button";
  const frame = frameOf(p);
  const said = hint(p);
  return (
    <CamScreen id="timeline">
      <CamBar
        sub={
          recording
            ? "Filming"
            : done
              ? "Your roll is done"
              : "Develops at 9 am"
        }
      />
      <div className="relative mx-2.5 mt-0.5 aspect-[3/4] shrink-0 overflow-hidden rounded-[22px]">
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
      <Timeline {...p} />
      <p className="mt-2 text-center text-micro text-white/50 tabular-nums">
        {done
          ? `${ROLL.shots} of ${ROLL.shots} · the reel is full`
          : `Frame ${frame} of ${ROLL.shots}`}
      </p>
      <div
        className="flex flex-1 flex-col justify-center pb-3"
        data-dm-controls
        data-off={p.phase === "done" ? "" : undefined}
      >
        {switchWay && !done && (
          <ModeSwitch video={recording} className="mb-3 self-center" />
        )}
        <div className="grid grid-cols-3 items-center px-7">
          <div className="justify-self-start" data-dm-say>
            <p className="font-heading text-[28px] leading-none tabular-nums">
              {done ? 0 : p.left}
            </p>
            <p className="mt-1 text-xs text-white/60">{leftUnit(p)}</p>
          </div>
          <span
            className="dm-shutter justify-self-center"
            data-video={hold && recording ? "" : undefined}
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
        <p className="mt-3 h-4 text-center text-xs text-white/55" data-dm-hint>
          {p.phase === "after" ? `On to frame ${frame}.` : said}
        </p>
      </div>
    </CamScreen>
  );
}
