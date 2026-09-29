"use client";

import { SwitchCamera, X, Zap } from "lucide-react";

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
 * THE EVENT'S OWN DISPOSABLE (new this round).
 *
 * A disposable is sold in a printed paper wrapper, and this one is printed
 * for the party: the host's names as the camera's name (bible 7, the host's
 * name first), the date, the exposures and when it develops, in the paper
 * and ink of the product's own quiet chapters, never a colour of its own
 * (bible 6: the colour is the party's, in the window). The live picture sits
 * in a die-cut window at the phone's whole frame, the counter shows through
 * its own round cut, and the shutter is the plastic button through the paper.
 * Every event gets a camera of its own that a guest could screenshot and post.
 *
 * The first press pulls the wrapper's tab off the window, the one moment a
 * real disposable asks of a new owner, and that pull is the tap that lets the
 * phone ask.
 */
export function WrapperCamera(p: CamProps) {
  const live = isLive(p.phase);
  const recording = p.phase === "recording";
  const hold = p.video === "hold";
  const switchWay = p.video === "switch";
  const buttonWay = p.video === "button";
  return (
    <div className="dm-wrap" data-dm-camera="wrapper">
      <span aria-hidden className="dm-wrap-fibre" />
      <div className="relative flex h-14 shrink-0 items-center justify-between px-3">
        <span className="dm-wrap-round" aria-label="Back to the album">
          <X className="size-5" aria-hidden />
        </span>
        <span className="flex items-center gap-1.5 text-micro font-semibold tracking-[0.16em] uppercase">
          <Zap className="size-3.5" aria-hidden /> Flash on
        </span>
      </div>

      <div className="relative px-6">
        <p className="text-micro font-semibold tracking-[0.2em] uppercase opacity-60">
          A disposable camera for
        </p>
        <p className="mt-1 font-heading text-[54px] leading-[0.9] tracking-[-0.015em] uppercase">
          {EVENT.name}
        </p>
        <p className="mt-2 text-micro font-semibold tracking-[0.14em] uppercase opacity-70">
          {`${EVENT.date} · ${ROLL.shots} exposures · Develops 9 am`}
        </p>
      </div>

      <div className="relative mx-auto mt-5 w-[300px]">
        {p.phase === "refused" ? (
          <div className="flex aspect-[3/4] w-full items-center">
            <Refused tone="paper" left={p.left} />
          </div>
        ) : (
          <div className="dm-wrap-window">
            {live ? (
              <FilmStill
                still={p.still}
                look={p.look}
                className="aspect-[3/4] w-full"
                position="50% 45%"
              />
            ) : p.phase === "ask" ? (
              <div className="dm-wrap-tab" data-dm-reach>
                <span className="text-micro font-semibold tracking-[0.18em] uppercase">
                  Pull to open the camera
                </span>
                <span aria-hidden className="text-2xl leading-none">
                  ↓
                </span>
              </div>
            ) : (
              <div className="aspect-[3/4] w-full bg-[#0c0b0a]" />
            )}
          </div>
        )}
        {p.phase !== "refused" && (
          <span
            className="dm-wrap-counter"
            data-dm-say
            data-rec={recording ? "" : undefined}
          >
            {recording ? (
              <span className="text-[12px] font-semibold tabular-nums">
                {clock(p.seconds ?? 0)}
              </span>
            ) : (
              <span className="font-heading text-xl tabular-nums">
                {p.left}
              </span>
            )}
          </span>
        )}
        {p.phase === "after" && (
          <span className="dm-wrap-stamp" data-dm-receipt>
            {p.afterVideo ? "Video on the roll" : `No. ${p.taken} on the roll`}
          </span>
        )}
      </div>

      <div className="relative mt-auto flex items-center justify-between px-10 pb-10">
        <span className="flex w-14 flex-col items-center gap-1.5">
          <SwitchCamera className="size-5" aria-hidden />
          <span className="text-micro font-semibold tracking-[0.14em] uppercase opacity-70">
            Flip
          </span>
        </span>
        <span className="flex flex-col items-center gap-2">
          {switchWay && (
            <span
              className="dm-wrap-slide"
              data-video={recording ? "" : undefined}
            >
              <span>Photo</span>
              <span>Video</span>
            </span>
          )}
          <span className="dm-wrap-hole">
            <span
              className="dm-wrap-shutter"
              data-video={recording ? "" : undefined}
              data-off={live ? undefined : ""}
              data-dm-reach={p.phase === "ask" ? undefined : ""}
              aria-label="Take the shot"
            />
          </span>
        </span>
        <span className="flex w-14 flex-col items-center gap-1.5">
          {buttonWay ? (
            <>
              <span
                className="dm-wrap-video"
                data-stop={recording ? "" : undefined}
              />
              <span className="text-micro font-semibold tracking-[0.14em] uppercase opacity-70">
                Video
              </span>
            </>
          ) : hold ? (
            <span className="text-center text-micro leading-tight font-semibold tracking-[0.12em] uppercase opacity-70">
              Hold for video
            </span>
          ) : (
            <>
              <span aria-hidden className="dm-wrap-barcode" />
              <span className="text-center text-micro leading-tight font-semibold tracking-[0.12em] uppercase opacity-70">
                {p.count === "own"
                  ? videosWord(p.videosLeft ?? 3)
                  : "No retakes"}
              </span>
            </>
          )}
        </span>
      </div>
      {(p.phase === "ask" || p.phase === "again") && (
        <IosAlert mic={p.mic} note={askLine(p.phase, p.mic)} />
      )}
    </div>
  );
}
