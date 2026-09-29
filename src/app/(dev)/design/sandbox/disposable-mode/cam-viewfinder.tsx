"use client";

import { Aperture, Check, SwitchCamera } from "lucide-react";

import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  askLine,
  CamBar,
  type CamProps,
  FrameRing,
  IosAlert,
  isLive,
  leftWords,
  RecPill,
  Refused,
  videosWord,
} from "./cam-shared";
import { FilmStill } from "./film";

/**
 * THE ALBUM'S OWN CAMERA, PUSHED (round one's `camera=viewfinder`, kept).
 *
 * What round one drew, and what this pushes: the live picture at the phone's
 * whole frame, the shutter the one big act, no retake and no library. Pushed:
 * the count moves INTO the shutter as twenty-four ticks around it, one going
 * dark with each shot (the frame just spent still glowing), so the roll is
 * read where the thumb already is; the moment after is a receipt at the top
 * of the picture and never the shot itself (a disposable shows nothing); the
 * picture wears the roll's look live.
 */
export function Viewfinder(p: CamProps) {
  const live = isLive(p.phase);
  const recording = p.phase === "recording";
  const hold = p.video === "hold";
  const switchWay = p.video === "switch";
  const buttonWay = p.video === "button";
  const videoMode = switchWay && recording;
  return (
    <div className="dm-cam" data-dm-camera="viewfinder">
      <CamBar
        sub={recording ? "Filming" : `Develops at 9 am · ${leftWords(p)}`}
      />
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
        {p.phase === "after" && p.taken !== undefined && (
          <span
            data-dm-receipt
            className={cn(
              GLASS,
              "absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white",
            )}
          >
            <Check className="size-3.5" aria-hidden />
            {p.afterVideo
              ? `Your video is on the roll`
              : `Shot ${p.taken} is on the roll`}
          </span>
        )}
        {recording && p.seconds !== undefined && (
          <span className="absolute top-3 left-1/2 -translate-x-1/2">
            <RecPill seconds={p.seconds} />
          </span>
        )}
        {buttonWay && live && (
          <span
            className={cn(
              GLASS,
              "absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-full text-white",
            )}
            aria-label="Turn the camera round"
          >
            <SwitchCamera className="size-5" aria-hidden />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center pb-5">
        {switchWay && (
          <div
            className="mb-4 flex justify-center gap-6 text-xs font-semibold tracking-[0.16em] uppercase"
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
            <p className="font-heading text-[30px] leading-none tabular-nums">
              {p.left}
            </p>
            <p className="mt-1 text-xs text-white/60">
              {p.count === "own"
                ? `photos · ${videosWord(p.videosLeft ?? 3)}`
                : "left"}
            </p>
          </div>
          <span
            className="relative grid place-items-center justify-self-center"
            data-dm-reach
          >
            <FrameRing
              left={p.left}
              size={112}
              justSpent={
                p.phase !== "after"
                  ? 0
                  : !p.afterVideo
                    ? 1
                    : p.count === "own"
                      ? 0
                      : p.count === "three"
                        ? 3
                        : 1
              }
              recording={hold && recording ? (p.seconds ?? 0) / 10 : undefined}
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
        <p className="mt-5 text-center text-xs text-white/55" data-dm-hint>
          {recording
            ? hold
              ? "Let go to stop."
              : "Press again to stop."
            : p.phase === "after"
              ? "On the roll. It develops at 9 am with everyone's."
              : hold
                ? "Tap for a photo. Hold for a video."
                : "Every shot counts. There is no retake."}
        </p>
      </div>
      {(p.phase === "ask" || p.phase === "again") && (
        <IosAlert mic={p.mic} note={askLine(p.phase, p.mic)} />
      )}
    </div>
  );
}
