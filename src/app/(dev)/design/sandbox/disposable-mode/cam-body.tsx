"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  askLine,
  type CamProps,
  clock,
  IosAlert,
  isLive,
  Refused,
  videosWord,
} from "./cam-shared";
import { EVENT, ROLL } from "./fixtures";
import { FilmStill } from "./film";

/**
 * THE DRAWN DISPOSABLE, PUSHED (round one's `camera=body`, kept).
 *
 * The back of a real disposable as the whole screen, pushed toward the
 * object: the event's names on the wrapper's label across the top, a small
 * optical window to frame in (a bright-line frame, the plastic's own
 * vignette), the ready light beside it, the frame counter as a dial in its
 * own window, and the thumb wheel. The wind is the signature: after a shot the
 * shutter locks and the counter waits until she rolls the wheel, as a real
 * one does. The window keeps the phone's whole frame (3:4), so what she saves
 * is what she framed.
 */
export function BodyCamera(p: CamProps) {
  const live = isLive(p.phase);
  const wind = p.phase === "after";
  const recording = p.phase === "recording";
  const switchWay = p.video === "switch";
  const buttonWay = p.video === "button";
  // Before the wind, the counter still shows the frame she has not yet left.
  const spends = !p.afterVideo
    ? 1
    : p.count === "own"
      ? 0
      : p.count === "three"
        ? 3
        : 1;
  const shown = wind ? p.left + spends : p.left;
  return (
    <div className="dm-body" data-dm-camera="body">
      <div className="flex h-14 shrink-0 items-center justify-between px-3">
        <span className="dm-body-round" aria-label="Back to the album">
          <X className="size-5" aria-hidden />
        </span>
        <span className="dm-emboss text-micro">Develops 9 am</span>
      </div>

      <div className="dm-body-label mx-5 flex items-baseline justify-between rounded-md px-3 py-2">
        <span className="font-heading text-[15px] font-semibold tracking-[0.18em] uppercase">
          {EVENT.name}
        </span>
        <span className="text-micro font-semibold tracking-[0.14em] uppercase">
          {`${ROLL.shots} exp · ISO 800`}
        </span>
      </div>

      {p.phase === "refused" ? (
        <div className="mx-5 mt-5">
          <Refused left={p.left} />
        </div>
      ) : (
        <div className="mx-5 mt-5 flex items-start gap-4">
          <div className="dm-body-window w-[236px] shrink-0">
            {live ? (
              <FilmStill
                still={p.still}
                look={p.look}
                className="aspect-[3/4] w-full"
                position="50% 45%"
              />
            ) : (
              <div className="aspect-[3/4] w-full bg-[#050505]" />
            )}
            {live && <span aria-hidden className="dm-optic" />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-5 pt-1">
            <span className="flex flex-col items-center gap-1.5">
              <span
                className="dm-body-led"
                data-state={recording ? "rec" : live && !wind ? "ready" : "off"}
              />
              <span className="dm-emboss text-micro">
                {recording ? "Rec" : "Ready"}
              </span>
            </span>
            <span
              className="dm-body-counter"
              data-dm-say
              data-rec={recording ? "" : undefined}
            >
              {recording ? (
                <span className="text-[13px] font-semibold tracking-[0.1em] tabular-nums">
                  {clock(p.seconds ?? 0)}
                </span>
              ) : (
                <span className="font-heading text-2xl font-semibold tabular-nums">
                  {shown}
                </span>
              )}
            </span>
            {p.count === "own" && !recording && (
              <span className="dm-emboss text-center text-micro">
                {videosWord(p.videosLeft ?? 3)}
              </span>
            )}
            {switchWay && (
              <span className="flex flex-col items-center gap-1.5">
                <span
                  className="dm-body-slide"
                  data-video={recording ? "" : undefined}
                />
                <span className="dm-emboss text-micro">Photo · Video</span>
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mx-5 mt-6 flex items-center gap-4">
        <span
          className="dm-body-wheel block min-w-0 flex-1"
          data-due={wind ? "" : undefined}
          data-dm-reach={wind ? "" : undefined}
          aria-label="Wind on"
        />
        <span
          className={cn(
            "dm-emboss w-20 shrink-0 text-right text-micro",
            wind && "dm-emboss-lit",
          )}
        >
          {wind ? "Wind on →" : "Wind →"}
        </span>
      </div>

      <div className="mx-5 mt-6 grid grid-cols-3 gap-2 px-1 text-center">
        {[
          ["1", "Wind"],
          ["2", "Frame"],
          ["3", "Shoot"],
        ].map(([n, word]) => (
          <span key={n} className="space-y-1">
            <span className="dm-emboss block font-heading text-base font-semibold">
              {n}
            </span>
            <span className="dm-emboss block text-micro">{word}</span>
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between px-9 pb-10">
        <span className="flex w-14 flex-col items-center gap-1.5">
          <span
            className="dm-body-flash"
            data-lit={live && !wind ? "" : undefined}
          />
          <span className="dm-emboss text-micro">Flash</span>
        </span>
        <span
          className="dm-body-shutter"
          data-locked={wind || !live ? "" : undefined}
          data-pressed={recording && p.video === "hold" ? "" : undefined}
          data-dm-reach={wind ? undefined : ""}
          aria-label="Take the shot"
        />
        <span className="flex w-14 flex-col items-center gap-1.5">
          {buttonWay ? (
            <>
              <span
                className="dm-body-video"
                data-stop={recording ? "" : undefined}
              />
              <span className="dm-emboss text-micro">Video</span>
            </>
          ) : p.video === "hold" ? (
            <span className="dm-emboss text-center text-micro leading-tight">
              Hold for video
            </span>
          ) : null}
        </span>
      </div>
      {(p.phase === "ask" || p.phase === "again") && (
        <IosAlert mic={p.mic} note={askLine(p.phase, p.mic)} />
      )}
    </div>
  );
}
