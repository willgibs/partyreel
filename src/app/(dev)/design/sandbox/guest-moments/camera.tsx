"use client";

import "@/components/guest/camera/camera.css";

import { SwitchCamera, X, Zap } from "lucide-react";

import { CameraReel } from "@/components/guest/camera/camera-reel";
import { CameraShutter } from "@/components/guest/camera/camera-shutter";
import { RollDonePanel } from "@/components/guest/camera/camera-panels";
import { type ShotTile, YourShots } from "@/components/guest/camera/your-shots";
import { Button } from "@/components/ui/button";
import { reelCells } from "@/lib/guest/camera/reel";
import {
  CAMERA_CONTROLS,
  CAMERA_HINT,
  cameraSubLine,
  reelCaption,
  reelLabel,
  rollCount,
  rollDoneLine,
  yourShotsLine,
} from "@/lib/guest/camera/words";

import {
  HER_SHOTS,
  IN_THE_FINDER,
  type Photo,
  ROLL,
  WEDDING,
} from "./fixtures";

/**
 * PRIYA'S CAMERA, PRODUCTION'S PARTS ROUND A STILL: the camera sheet
 * (`camera-screen.tsx`: its bar, its contained picture, the reel, the
 * caption, the count, the shutter and the line under it), the roll's end
 * (`RollDonePanel`) and her list (`YourShots`), composed here because the
 * live camera opens the phone's camera and a lab frame must never ask for it.
 *
 * ★ EVERY WORD IS PRODUCTION'S unless an option is the change: the sub-line,
 * the caption, the reel's frames (`reelCells`), the roll's end and her list's
 * own lines. An option adds only its own piece: a re-shoot count, or a way to
 * take a shot back from the reel.
 *
 * ★ A DISPOSABLE'S NIGHT: every shot of hers is sealed until 9 am, so every
 * one is hers to take back (`removable`), and the album shows none of them.
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

/** The night's own clock: 10 pm, the evening before the develop. */
function tonight(): Date {
  const d = new Date(WEDDING.developsAt);
  d.setDate(d.getDate() - 1);
  d.setHours(22, 0, 0, 0);
  return d;
}

/* ── how many she may take back ────────────────────────────────────────── */

/** The `limit` ask's options: three rolls' worth (today), a flat 3, one roll's worth. */
export type Limit = "rolls" | "three" | "roll";

/** The re-shoots each limit gives a roll of `ROLL`: shots past the roll that removing can free. */
export const RESHOOTS: Record<Limit, number> = {
  // Today's as the board was drawn: three rolls' worth, two rolls past her own (camera-wiring built `three`).
  rolls: ROLL * 2,
  three: 3,
  roll: ROLL,
};

/**
 * WHAT HER LIST'S HEAD SAYS UNDER "YOUR SHOTS": production's count
 * (`rollCount`, "6 of 24") and, where a limit is said, what is left of it.
 * Today's ceiling is said only in Settings ("up to 72 shots in all") and
 * met, unsaid, at the shot past it.
 */
export function shotsCount(limit: Limit, held: number, spent: number): string {
  const count = rollCount(held, ROLL);
  if (limit === "rolls") return count;
  const left = RESHOOTS[limit] - spent;
  return `${count} · ${left} ${left === 1 ? "re-shoot" : "re-shoots"} left`;
}

/** What the roll's end adds once her re-shoots are spent (nothing today: the panel only drops its "Remove a shot"). */
export function spentLine(limit: Limit): string | null {
  if (limit === "rolls") return null;
  return limit === "three"
    ? "Your 3 re-shoots are used."
    : `Your ${ROLL} re-shoots are used.`;
}

/* ── the camera ────────────────────────────────────────────────────────── */

/**
 * THE CAMERA ON HER ROLL: `used` frames spent. `done` lays the roll's end
 * over the picture (the shutter goes, as production's); `sheet` is the
 * `reel` option's take-back, her newest shot over the picture with its two
 * keys.
 */
export function CameraScreen({
  used,
  done,
  sheet,
}: {
  used: number;
  done?: { line: string; freeAFrame: boolean };
  sheet?: { shot: Photo; line: string };
}) {
  const night = tonight();
  const recent = HER_SHOTS.slice(-Math.min(used, HER_SHOTS.length)).map(
    (p, i) => {
      const at = new Date(night);
      at.setMinutes(-60 + i * 9);
      return {
        key: p.key,
        takenAt: at.getTime(),
        kind: "photo" as const,
        sending: false,
      };
    },
  );
  const cells = reelCells({ cap: ROLL, used, recording: false, recent });
  return (
    <div
      data-gm-camera={used}
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
                developsAt: WEDDING.developsAt,
                recording: false,
                done: Boolean(done),
                nowMs: night.getTime(),
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
          {done ? (
            <RollDonePanel
              line={done.line}
              freeAFrame={done.freeAFrame}
              onShots={none}
              onBack={none}
            />
          ) : null}
          {sheet ? <TakeBackSheet shot={sheet.shot} line={sheet.line} /> : null}
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
              frame: Math.min(used + 1, ROLL),
              cap: ROLL,
              held: used,
              done: Boolean(done),
              host: false,
              sending: 0,
            })}
          </p>
        </div>

        <div className="cam-controls" data-off={done ? "" : undefined}>
          <div className="cam-count" data-cam-count="">
            <p className="font-heading text-page leading-none text-white tabular-nums">
              {ROLL - used}
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
            disabled={Boolean(done || sheet)}
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

/** The `reel` option's take-back: what pressing the reel's newest frame opens, over the picture. */
export const TAKE_BACK = {
  take: "Take it back",
  keep: "Keep it",
} as const;

/** The sheet's line under its keys: what taking it back does, at the picked limit. */
export function takeBackLine(limit: Limit): string {
  if (limit === "rolls")
    return "Taking it back frees its frame for another shot.";
  return `Taking it back frees its frame: 1 of your ${RESHOOTS[limit]} re-shoots.`;
}

/**
 * HER NEWEST SHOT, PRESSED ON THE REEL (the `reel` option): the shot fills
 * the picture's box under the roll's-end dim, with one key that takes it
 * back and one that keeps it, in the roll's end's own furniture
 * (`RollDonePanel`'s keys and lines), so a camera panel says it.
 */
function TakeBackSheet({ shot, line }: { shot: Photo; line: string }) {
  return (
    <div
      data-gm-take-back={shot.key}
      className="cam-dim absolute inset-0 flex flex-col items-center justify-center px-7 text-center"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- her own frozen frame, a still here */}
      <img
        src={shot.src}
        alt=""
        draggable={false}
        className="aspect-[3/4] w-40 rounded-tile object-cover shadow-lg"
        style={{ objectPosition: shot.focus }}
      />
      <div className="mt-5 grid w-full max-w-72 gap-2">
        <Button type="button" variant="on-photo" size="cta" tabIndex={-1}>
          {TAKE_BACK.take}
        </Button>
        <Button type="button" variant="glass" size="cta" tabIndex={-1}>
          {TAKE_BACK.keep}
        </Button>
      </div>
      <p className="mt-4 text-caption text-white/55">{line}</p>
    </div>
  );
}

/* ── her list ──────────────────────────────────────────────────────────── */

/**
 * YOUR SHOTS, production's list over the camera: her six sealed shots, each
 * with its X, the newest one Removing where `removing` says so, the head's
 * count as the option says it.
 */
export function ShotsScreen({
  count,
  removing,
}: {
  count: string;
  removing?: string;
}) {
  const night = tonight();
  const tiles: ShotTile[] = HER_SHOTS.map((p) => ({
    key: p.key,
    mediaId: p.key,
    kind: "photo",
    status: "sealed",
    src: p.src,
    removable: true,
    retryable: false,
  }));
  return (
    <div
      data-gm-shots={count}
      className="fixed inset-0 overflow-hidden bg-black text-white select-none"
    >
      <YourShots
        tiles={tiles}
        line={yourShotsLine({
          reveal: "develop",
          developsAt: WEDDING.developsAt,
          nowMs: night.getTime(),
        })}
        count={count}
        removing={new Map(removing ? [[removing, "working" as const]] : [])}
        canFreeFrames
        onRemove={none}
        onRetry={none}
        onBack={none}
      />
    </div>
  );
}

/** The roll's end's line on her spent roll, production's. */
export const doneLine = () =>
  rollDoneLine({
    held: ROLL,
    reveal: "develop",
    developsAt: WEDDING.developsAt,
    nowMs: tonight().getTime(),
  });
