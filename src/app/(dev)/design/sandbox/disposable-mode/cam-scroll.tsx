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
  VIDEO_SECONDS,
} from "./cam-shared";
import { HER_SHOTS, ROLL } from "./fixtures";
import { FilmStill } from "./film";

/**
 * THE SCREEN SCROLLS LIKE A REEL (a branch of the camera that shoots on a
 * reel, new this round).
 *
 * The reel turned on end and made the whole screen: her roll is a column of
 * frames she moves down, the way every phone now scrolls a reel. The frame
 * she is on is the live picture, a rounded card in the middle; the frame she
 * last shot sits sealed above it, its minute on its edge; the next fresh one
 * waits below, under her thumb, with the shutter resting on it. A shot seals
 * the card and the column scrolls up one frame, so taking a picture is
 * moving on through the roll, and a rail at the edge says where in the
 * twenty-four she is.
 */

const CARD = { x: 20, w: 335, h: 447, r: 26 };
/** Where the live card stands: under the bar, the last frame's foot above it. */
const LIVE_TOP = 114;
const STEP = CARD.h + 10;
/** Whether the last act moved the roll on a frame (a video counted on its own does not). */
const wound = (p: CamProps) =>
  p.phase === "after" && !(p.afterVideo && p.count === "own");

/** The camera's bar, which the column passes under. */
const BAR = 56;

/** The minute of the frame sealed above: her last before 10:40, the one just
 *  taken, or her twenty-fourth late in the night. */
const lastTime = (p: CamProps) =>
  p.phase === "after" && !(p.afterVideo && p.count === "own")
    ? "10:41"
    : p.phase === "done"
      ? "11:48"
      : HER_SHOTS[0].time;

function Rail({ at, done }: { at: number; done: boolean }) {
  return (
    <span className="dm-rail" aria-hidden data-dm-rail={`${at}/${ROLL.shots}`}>
      {Array.from({ length: ROLL.shots }, (_, i) => (
        <span
          key={i}
          data-state={
            done || i + 1 < at ? "spent" : i + 1 === at ? "now" : "fresh"
          }
        />
      ))}
    </span>
  );
}

export function ScrollCamera(p: CamProps) {
  const recording = p.phase === "recording";
  const done = p.phase === "done";
  const hold = p.video === "hold";
  const switchWay = p.video === "switch";
  const buttonWay = p.video === "button";
  const frame = frameOf(p);
  const said = hint(p);
  const sealed = done ? ROLL.shots : frame - 1;
  return (
    <CamScreen id="scroll" className="overflow-hidden">
      <CamBar
        sub={
          recording
            ? "Filming"
            : done
              ? "Your roll is done"
              : "Develops at 9 am"
        }
      />
      {/* The column scrolls under the bar, never over it. */}
      <div className="absolute inset-x-0 top-14 bottom-0 overflow-hidden">
        <div
          className="dm-reel-col"
          data-wound={wound(p) ? "" : undefined}
          style={{ top: LIVE_TOP - STEP - BAR }}
        >
          {/* The frame she last shot, sealed: only its foot shows. */}
          <span
            className="dm-reel-card dm-reel-sealed"
            data-just={wound(p) ? "" : undefined}
            style={{ left: CARD.x, width: CARD.w, height: CARD.h, top: 0 }}
          >
            <span className="dm-reel-edge">
              <span className="tabular-nums">{sealed}</span>
              <span className="flex items-center gap-1 tabular-nums">
                {/* A video that counts on its own is no frame of the 24: the
                  frame above stays her last photo. */}
                {p.afterVideo && p.count !== "own" ? (
                  <>
                    <Play className="size-2.5 fill-current" aria-hidden />
                    {clock(6)}
                  </>
                ) : (
                  lastTime(p)
                )}
              </span>
            </span>
          </span>

          {/* The frame she is on. */}
          <span
            className="dm-reel-card dm-reel-live"
            data-rec={recording ? "" : undefined}
            style={{ left: CARD.x, width: CARD.w, height: CARD.h, top: STEP }}
          >
            {done ? (
              <span className="dm-reel-end grid size-full place-items-center px-6">
                <RollDone />
              </span>
            ) : (
              <FilmStill
                still={p.still}
                className="size-full"
                position="50% 45%"
              />
            )}
            {p.phase === "after" && <span aria-hidden className="dm-flash" />}
            {recording && (
              <svg
                aria-hidden
                className="dm-reel-rec"
                viewBox={`0 0 ${CARD.w} ${CARD.h}`}
              >
                <rect
                  x="1.5"
                  y="1.5"
                  width={CARD.w - 3}
                  height={CARD.h - 3}
                  rx={CARD.r - 1.5}
                  pathLength={100}
                  strokeDasharray={`${((p.seconds ?? 0) / VIDEO_SECONDS) * 100} 100`}
                />
              </svg>
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
            {!done && (
              <span className="dm-reel-num" aria-hidden>
                {frame}
              </span>
            )}
          </span>

          {/* The next fresh frame, under her thumb. */}
          {!done && frame < ROLL.shots && (
            <span
              className="dm-reel-card dm-reel-fresh"
              style={{
                left: CARD.x,
                width: CARD.w,
                height: CARD.h,
                top: STEP * 2,
              }}
            >
              <span className="dm-reel-num">{frame + 1}</span>
            </span>
          )}
        </div>
      </div>

      <Rail at={done ? ROLL.shots + 1 : frame} done={done} />

      {!done && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center pb-6">
          {switchWay && (
            <ModeSwitch video={recording} className="dm-modes-glass mb-3" />
          )}
          <div className="grid w-full grid-cols-3 items-center px-9">
            <div className="justify-self-start" data-dm-say>
              <p className="font-heading text-[28px] leading-none tabular-nums">
                {p.left}
              </p>
              <p className="mt-1 text-xs text-white/65">{leftUnit(p)}</p>
            </div>
            <span
              className="dm-shutter justify-self-center"
              data-video={hold && recording ? "" : undefined}
              data-stop={recording && switchWay ? "" : undefined}
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
          <p
            className="mt-3 h-4 text-center text-xs text-white/60"
            data-dm-hint
          >
            {p.phase === "after" ? `Scrolled on to frame ${frame}.` : said}
          </p>
        </div>
      )}
    </CamScreen>
  );
}
