"use client";

import "@/components/guest/camera/camera.css";

import { SwitchCamera, X, Zap } from "lucide-react";
import type { CSSProperties } from "react";

import { CameraReel } from "@/components/guest/camera/camera-reel";
import { CameraShutter } from "@/components/guest/camera/camera-shutter";
import { Button } from "@/components/ui/button";
import { reelCells } from "@/lib/guest/camera/reel";
import {
  CAMERA_CONTROLS,
  CAMERA_HINT,
  cameraSubLine,
  reelCaption,
  reelLabel,
} from "@/lib/guest/camera/words";

import { IN_THE_FINDER, WEDDING } from "./fixtures";

/**
 * A GUEST'S CAMERA ON A ROLL OF ANY SIZE: production's own camera sheet
 * (`camera-screen.tsx`), its bar, its contained picture, the reel as a
 * timeline, the count, the shutter and the line under it, composed here
 * round a still, because the live one opens the phone's camera and a lab
 * frame must never ask for it.
 *
 * ★ EVERY WORD IS PRODUCTION'S, READ AT THIS ROLL: the sub-line
 * (`cameraSubLine`), the caption (`reelCaption`: "Frame 10 of 12"), the
 * reel's name and its frames (`reelCells`), so what a roll of 12 or of 36
 * says is what the camera already says at any size. Nothing here is new; it
 * is drawn so the size can be judged where a guest meets it.
 *
 * ★ THE ROLL'S LENGTH SHOWS WHERE SHE LOOKS: on a short roll the reel's last
 * frame is in sight a few frames ahead; on a long one the fresh frames run
 * on past the edge. The count beside the shutter says the rest.
 */

const none = () => {};
const HANDLERS = {
  onPointerDown: none,
  onPointerUp: none,
  onPointerCancel: none,
  onKeyDown: none,
  onKeyUp: none,
  onContextMenu: none,
};

/** The minutes of her shots this visit, the night's own clock: the toast, then the floor. */
const TAKEN_AT = [
  [21, 2],
  [21, 9],
  [21, 31],
  [21, 47],
  [22, 3],
] as const;

export function GuestCamera({
  roll,
  frame,
}: {
  /** Frames on her roll. */
  roll: number;
  /** The frame the next shot takes (1-based). */
  frame: number;
}) {
  const used = frame - 1;
  // The party's own night, 10 pm, the evening before its develop.
  const day = new Date(WEDDING.developsAt);
  day.setDate(day.getDate() - 1);
  const tonight = new Date(day);
  tonight.setHours(22, 0, 0, 0);
  const recent = TAKEN_AT.slice(-Math.min(used, TAKEN_AT.length)).map(
    ([h, m], i) => {
      const at = new Date(day);
      at.setHours(h, m, 0, 0);
      return {
        key: `cz-shot-${i}`,
        takenAt: at.getTime(),
        kind: "photo" as const,
        sending: false,
      };
    },
  );
  const cells = reelCells({ cap: roll, used, recording: false, recent });
  return (
    <div
      data-cz-camera={roll}
      className="cz-cam fixed inset-0 overflow-hidden bg-black text-white select-none"
      style={
        {
          "--cz-finder": `url(${IN_THE_FINDER.src})`,
        } as CSSProperties
      }
    >
      <div className="cam-screen" data-cam-screen="">
        <div className="cam-bar">
          <Button
            type="button"
            variant="glass"
            size="icon-cta"
            tabIndex={-1}
            aria-label="Back to the album"
          >
            <X aria-hidden />
          </Button>
          <div className="min-w-0 px-3 text-center">
            <p className="truncate font-heading text-card-title text-white">
              {WEDDING.name}
            </p>
            <p className="truncate text-micro text-white/60" data-cam-sub="">
              {cameraSubLine({
                reveal: "develop",
                developsAt: WEDDING.developsAt,
                recording: false,
                done: false,
                nowMs: tonight.getTime(),
              })}
            </p>
          </div>
          <Button
            type="button"
            variant="glass"
            size="icon-cta"
            tabIndex={-1}
            aria-label={CAMERA_CONTROLS.flash}
          >
            <Zap aria-hidden />
          </Button>
        </div>

        <div className="cam-picture" data-cam-picture="">
          {/* eslint-disable-next-line @next/next/no-img-element -- the finder's live picture, a still here */}
          <img
            src={IN_THE_FINDER.src}
            alt=""
            draggable={false}
            className="size-full object-cover"
            style={{ objectPosition: IN_THE_FINDER.focus }}
          />
        </div>

        <div className="cam-roll">
          <CameraReel
            cells={cells}
            stream={null}
            mirror={false}
            frozen={new Map()}
            just={new Set()}
            progress={null}
            label={reelLabel(used)}
            onOpen={none}
          />
          <p className="cam-caption" data-cam-caption="">
            {reelCaption({
              frame,
              cap: roll,
              done: false,
              host: false,
              sending: 0,
            })}
          </p>
        </div>

        <div className="cam-controls">
          <div className="cam-count" data-cam-count="">
            <p className="font-heading text-page leading-none text-white tabular-nums">
              {roll - used}
            </p>
            <p className="mt-1 text-caption text-white/60">
              {CAMERA_CONTROLS.left}
            </p>
          </div>
          <CameraShutter
            handlers={HANDLERS}
            pressed={false}
            filming={false}
            progress={null}
            disabled={false}
            label={CAMERA_CONTROLS.shutterOrFilm}
          />
          <Button
            type="button"
            variant="glass"
            size="icon-cta"
            tabIndex={-1}
            aria-label={CAMERA_CONTROLS.turn}
            className="cam-turn"
          >
            <SwitchCamera aria-hidden />
          </Button>
          <div className="cam-hint">
            <p data-cam-hint="">{CAMERA_HINT.tapOrHold}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
