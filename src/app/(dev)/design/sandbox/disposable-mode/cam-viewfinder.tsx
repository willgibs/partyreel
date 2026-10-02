"use client";

import { Check, SwitchCamera } from "lucide-react";

import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  CamBar,
  type CamProps,
  CamScreen,
  FrameRing,
  hint,
  isLive,
  justSpent,
  leftUnit,
  ModeSwitch,
  pill,
  RecPill,
  RollDone,
  VIDEO_SECONDS,
} from "./cam-shared";
import { FilmStill } from "./film";

/**
 * THE ALBUM'S OWN CAMERA, AS ROUND TWO DREW IT (kept, the reference the two
 * branches beside it are read against).
 *
 * The live picture at the phone's whole width, the shutter the one big act,
 * no retake and no library; the count lives round the shutter as twenty-four
 * ticks, one going dark with each shot, the frame just spent still glowing,
 * so the roll is read where the thumb already is; the moment after is a
 * receipt at the top of the picture and never the shot itself.
 */
export function Viewfinder(p: CamProps) {
  const live = isLive(p.phase);
  const recording = p.phase === "recording";
  const hold = p.video === "hold";
  const switchWay = p.video === "switch";
  const buttonWay = p.video === "button";
  const done = p.phase === "done";
  return (
    <CamScreen id="viewfinder">
      <CamBar
        sub={
          recording
            ? "Filming"
            : done
              ? "Your roll is done"
              : `Develops at 9 am · ${p.left} left`
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
        {p.phase === "after" && (
          <span
            data-dm-receipt
            className={cn(
              GLASS,
              "absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white",
            )}
          >
            <Check className="size-3.5" aria-hidden />
            {pill(hint(p))}
          </span>
        )}
        {recording && p.seconds !== undefined && (
          <span className="absolute top-3 left-1/2 -translate-x-1/2">
            <RecPill seconds={p.seconds} />
          </span>
        )}
        {p.phase === "after" && <span aria-hidden className="dm-flash" />}
      </div>
      <div
        className="flex flex-1 flex-col justify-center pb-5"
        data-dm-controls
        data-off={p.phase === "done" ? "" : undefined}
      >
        {switchWay && live && (
          <ModeSwitch video={recording} className="mb-4 self-center" />
        )}
        <div className="grid grid-cols-3 items-center px-6">
          <div className="justify-self-start" data-dm-say>
            <p className="font-heading text-[30px] leading-none tabular-nums">
              {p.left}
            </p>
            <p className="mt-1 text-xs text-white/60">{leftUnit(p)}</p>
          </div>
          <span
            className="relative grid place-items-center justify-self-center"
            data-dm-reach
          >
            <FrameRing
              left={p.left}
              size={112}
              just={justSpent(p)}
              recording={
                hold && recording ? (p.seconds ?? 0) / VIDEO_SECONDS : undefined
              }
            />
            <span
              className="dm-shutter absolute inset-0 m-auto"
              data-video={hold && recording ? "" : undefined}
              data-stop={recording && switchWay ? "" : undefined}
              data-off={live ? undefined : ""}
              aria-label="Take the shot"
            />
          </span>
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
        <p className="mt-5 h-4 text-center text-xs text-white/55" data-dm-hint>
          {p.phase === "after"
            ? "It develops at 9 am with everyone's."
            : hint(p)}
        </p>
      </div>
    </CamScreen>
  );
}
