"use client";

import { Check, SwitchCamera, X, Zap } from "lucide-react";

import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  type CamProps,
  CamScreen,
  clock,
  FrameRing,
  hint,
  justSpent,
  ModeSwitch,
  pill,
  RecPill,
  RollDone,
  VIDEO_SECONDS,
  videosWord,
} from "./cam-shared";
import { EVENT, ROLL } from "./fixtures";
import { FilmStill } from "./film";

/**
 * THE COUNT INSIDE THE SHUTTER (a branch of the album's own camera, new this
 * round).
 *
 * What it keeps of the viewfinder Will picked out: the plainness, the one big
 * act, and the twenty-four ticks round the shutter. What it pushes: the live
 * picture takes the whole screen, every control floats on the product's own
 * glass (media chrome over a photograph, `lib/glass.ts`), and the count moves
 * INTO the shutter, so the one thing she presses is also the one thing that
 * tells her how many are left: a numeral that rolls down a shot at a time,
 * inside the ring of ticks. The camera is three objects (close, the shutter,
 * the flip) over her picture, the way the phone's own camera is.
 */
/** Her sealed shots, as a glyph: two frames stacked square, the roll's own mark. */
function SealedStack() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      <rect
        x="6"
        y="2.5"
        width="11"
        height="13"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.55"
      />
      <rect x="3" y="5" width="11" height="13" rx="2.5" fill="currentColor" />
    </svg>
  );
}

export function ShutterCamera(p: CamProps) {
  const recording = p.phase === "recording";
  const done = p.phase === "done";
  const hold = p.video === "hold";
  const switchWay = p.video === "switch";
  const buttonWay = p.video === "button";
  // Every shot of hers so far, photos and videos alike (her seventh, just after).
  const hers = p.taken ?? ROLL.shots - p.left;
  const said = hint(p);
  return (
    <CamScreen id="shutter" className="overflow-hidden">
      <FilmStill
        still={p.still}
        className="absolute inset-0 size-full"
        position="50% 40%"
      />
      <span aria-hidden className="dm-scrim-top" />
      <span aria-hidden className="dm-scrim-bottom" />
      {p.phase === "after" && <span aria-hidden className="dm-flash" />}
      {done && <span aria-hidden className="dm-dim" />}

      {/* The top: close, whose camera it is, the flash (and the flip, where
          the second button takes its place at the foot). */}
      <div className="absolute inset-x-4 top-3.5 z-10 flex items-center justify-between gap-2">
        <span
          className={cn(GLASS, "dm-glass-round")}
          aria-label="Back to the album"
        >
          <X className="size-5" aria-hidden />
        </span>
        {recording && p.seconds !== undefined ? (
          <RecPill seconds={p.seconds} />
        ) : (
          <span className={cn(GLASS, "dm-capsule")} data-dm-sub>
            {p.phase === "after" ? (
              <>
                <Check className="size-3.5" aria-hidden />
                {pill(said)}
              </>
            ) : done ? (
              `${EVENT.name} · back at ${ROLL.develops}`
            ) : (
              <>
                <span className="font-heading text-[15px]">{EVENT.name}</span>
                <span className="text-white/65">{`Develops ${ROLL.develops}`}</span>
              </>
            )}
          </span>
        )}
        <span className="flex gap-2">
          {buttonWay && (
            <span
              className={cn(GLASS, "dm-glass-round")}
              aria-label="Turn the camera round"
            >
              <SwitchCamera className="size-5" aria-hidden />
            </span>
          )}
          <span
            className={cn(GLASS, "dm-glass-round")}
            data-on=""
            aria-label="Flash"
          >
            <Zap className="size-5" aria-hidden />
          </span>
        </span>
      </div>

      {done ? (
        <div className="absolute inset-x-5 bottom-10 z-10">
          <RollDone className={cn(GLASS, "dm-done-glass")}>
            <span className="dm-shutter-count mb-4" data-off="">
              <FrameRing left={0} size={64} className="dm-ring-small" />
              <span className="dm-shutter-num dm-shutter-num-sm">0</span>
            </span>
          </RollDone>
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-9 z-10 flex flex-col items-center">
          {/* Only a line that teaches something: how to film, and how to stop.
              The count in the shutter already says the roll's rule. */}
          {((hold && p.phase === "framing") || recording) && (
            <p className="dm-hint-on-photo mb-4" data-dm-hint>
              {said}
            </p>
          )}
          {switchWay && (
            <ModeSwitch video={recording} className="dm-modes-glass mb-4" />
          )}
          <div className="grid w-full grid-cols-3 items-center px-9">
            <span
              className={cn(
                GLASS,
                "dm-glass-round dm-glass-lg justify-self-start",
              )}
              aria-label="Your shots"
            >
              <SealedStack />
              <span className="dm-badge" data-dm-hers>
                {hers}
              </span>
            </span>
            <span
              className="dm-shutter-count justify-self-center"
              data-dm-reach
              data-video={(hold || switchWay) && recording ? "" : undefined}
            >
              <FrameRing
                left={p.left}
                size={104}
                just={justSpent(p)}
                className="dm-ring-on-photo"
                recording={
                  hold && recording
                    ? (p.seconds ?? 0) / VIDEO_SECONDS
                    : undefined
                }
              />
              {recording && switchWay ? (
                <span className="dm-shutter-stop" aria-hidden />
              ) : recording && hold ? (
                <span className="dm-shutter-num dm-shutter-num-rec" data-dm-say>
                  {clock(p.seconds ?? 0)}
                </span>
              ) : (
                <span className="dm-shutter-num" data-dm-say>
                  <span
                    className="dm-roll-digit"
                    data-rolled={p.phase === "after" ? "" : undefined}
                  >
                    {p.left}
                  </span>
                  <span className="dm-shutter-unit">
                    {p.count === "own" ? "photos" : "left"}
                  </span>
                </span>
              )}
            </span>
            {buttonWay ? (
              <span
                className={cn(
                  GLASS,
                  "dm-glass-round dm-glass-lg justify-self-end",
                )}
                aria-label="Film a video"
              >
                <span
                  className="dm-rec-glyph"
                  data-stop={recording ? "" : undefined}
                />
              </span>
            ) : (
              <span
                className={cn(
                  GLASS,
                  "dm-glass-round dm-glass-lg justify-self-end",
                )}
                aria-label="Turn the camera round"
              >
                <SwitchCamera className="size-5" aria-hidden />
              </span>
            )}
          </div>
          {p.count === "own" && (
            <p className="dm-hint-on-photo mt-3 tabular-nums" data-dm-videos>
              {`${videosWord(p.videosLeft ?? 3)} left`}
            </p>
          )}
        </div>
      )}
    </CamScreen>
  );
}
