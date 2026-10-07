"use client";

import "@/components/guest/camera/camera.css";

import { RefreshCw, SwitchCamera, X, Zap } from "lucide-react";

import { RollDonePanel } from "@/components/guest/camera/camera-panels";
import { CameraReel } from "@/components/guest/camera/camera-reel";
import { CameraShutter } from "@/components/guest/camera/camera-shutter";
import { type ShotTile, YourShots } from "@/components/guest/camera/your-shots";
import { Button } from "@/components/ui/button";
import { reelCells } from "@/lib/guest/camera/reel";
import {
  CAMERA_CONTROLS,
  CAMERA_HINT,
  cameraSubLine,
  reelLabel,
  rollCount,
  rollDoneLine,
  yourShotsLine,
} from "@/lib/guest/camera/words";

import { CELLAR_SHOTS, FINDER, ROLL, WEDDING } from "./fixtures";

/**
 * THE ALBUM'S CAMERA IN THE CELLAR: production's camera parts round a still
 * (`camera-screen.tsx`'s bar, its contained picture, the reel, the caption,
 * the count, the shutter and the line under it; the roll's end, its panel;
 * her shots, production's `YourShots`), composed here because the live
 * camera opens the phone's camera and a lab frame must never ask for it.
 *
 * ★ A FRAME WAITING FOR THE LINE WEARS THE SENDING DOT'S PLACE, half-lit and
 * still (`ns.css`'s `[data-ns-reel-wait]`): production's reel marks a frame
 * still on its way with a pulsing dot, and in a dead zone nothing is on its
 * way, so the frames that hold a waiting shot say so without moving.
 *
 * ★ STAND-INS, SAID ONCE: the finder's live picture is a still (the cellar's
 * tasting table), the reel's live frame is dark (it plays the phone's own
 * stream, and a lab frame has none), the night's clock is fixed (11:50 pm,
 * the develop at 9 the next morning) and every press is inert.
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

/** The night's clock, on the reader's own calendar (so "tomorrow at 9 am" whatever her zone). */
export const NOW = new Date(2026, 8, 12, 23, 50).getTime();
const DEVELOPS = new Date(2026, 8, 13, 9, 0).toISOString();
const minute = (h: number, m: number) => new Date(2026, 8, 12, h, m).getTime();

/** Her 20 frames before the cellar, an evening's minutes, oldest first (the reel shows the last few). */
const EARLIER = Array.from({ length: ROLL.before }, (_, i) => ({
  key: `earlier-${i}`,
  takenAt: minute(19 + Math.floor((i * 12) / 60), (i * 12) % 60),
  kind: "photo" as const,
  sending: false,
}));

/** The cellar's shots, from 11:48 pm, a minute apart: `sending` marks one that waits for the line. */
const cellar = (n: number, waiting: boolean) =>
  Array.from({ length: n }, (_, i) => ({
    key: `cellar-${i}`,
    takenAt: minute(23, 48 + i),
    kind: "photo" as const,
    sending: waiting,
  }));

export type CameraState = {
  /** Frames spent, as the count reads them. */
  used: number;
  /** The cellar's shots the reel holds (spent on the device, waiting for the line). */
  waiting: number;
  /** The count under the shutter. */
  left: number;
  /** The reel's caption. */
  caption: string;
  /** The line under the shutter. */
  hint: string;
  /** Her one press beside the line (production's Retry). */
  retry?: boolean;
  /** The roll is spent: its end's panel stands over the picture. */
  done?: boolean;
};

export function CellarCamera({ s }: { s: CameraState }) {
  const recent = [...EARLIER, ...cellar(s.waiting, true)];
  const cells = reelCells({
    cap: ROLL.cap,
    used: s.used,
    recording: false,
    recent,
  });
  return (
    <div
      data-ns-camera=""
      data-ns-reel-wait=""
      className="fixed inset-0 overflow-hidden bg-black text-white select-none"
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
                developsAt: DEVELOPS,
                recording: false,
                done: Boolean(s.done),
                nowMs: NOW,
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
            src={FINDER.src}
            alt=""
            draggable={false}
            className="size-full object-cover brightness-[0.62]"
            style={{ objectPosition: FINDER.focus }}
          />
          {s.done ? (
            <RollDonePanel
              line={rollDoneLine({
                held: ROLL.cap,
                reveal: "develop",
                developsAt: DEVELOPS,
                nowMs: NOW,
              })}
              freeAFrame={false}
              onShots={none}
              onBack={none}
            />
          ) : null}
        </div>

        <div className="cam-roll">
          <CameraReel
            cells={cells}
            stream={null}
            mirror={false}
            frozen={new Map()}
            just={new Set()}
            progress={null}
            label={reelLabel(s.used)}
            onOpen={none}
          />
          <p className="cam-caption" data-cam-caption="">
            {s.caption}
          </p>
        </div>

        <div className="cam-controls" data-off={s.done ? "" : undefined}>
          <div className="cam-count" data-cam-count="">
            <p className="font-heading text-page leading-none text-white tabular-nums">
              {s.left}
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
            disabled={Boolean(s.done)}
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
            <p data-cam-hint="">{s.done ? "" : s.hint}</p>
            {s.retry && !s.done ? (
              <span className="cam-hint-action">
                <RefreshCw className="size-3.5" aria-hidden />
                {CAMERA_HINT.retry}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * HIS SHOTS, AS THE LINE COMES BACK: production's `YourShots`, the cellar's
 * shots first (newest first, as the list keeps them), `refused` of them
 * refused for the roll ("Didn't send", no Retry: a roll's refusal is never
 * one a retry could pass).
 */
export function CellarShots({ refused }: { refused: number }) {
  const shots = CELLAR_SHOTS.slice(0, ROLL.cap - ROLL.before + refused);
  const tiles: ShotTile[] = shots
    .map((still, i) => {
      const isRefused = i >= ROLL.cap - ROLL.before;
      return {
        key: `cellar-${i}`,
        kind: "photo" as const,
        status: isRefused ? ("failed" as const) : ("sealed" as const),
        src: still.src,
        removable: false,
        retryable: false,
      };
    })
    .reverse();
  return (
    <div
      data-ns-shots={refused}
      className="fixed inset-0 overflow-y-auto bg-black text-white"
    >
      <YourShots
        tiles={tiles}
        line={yourShotsLine({
          reveal: "develop",
          developsAt: DEVELOPS,
          nowMs: NOW,
        })}
        count={rollCount(ROLL.cap, ROLL.cap)}
        removing={new Map()}
        canFreeFrames={false}
        onRemove={none}
        onRetry={none}
        onBack={none}
      />
    </div>
  );
}
