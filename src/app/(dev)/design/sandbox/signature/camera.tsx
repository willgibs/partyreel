"use client";

import "@/components/guest/camera/camera.css";

import { SwitchCamera, X, Zap } from "lucide-react";
import { type CSSProperties, useRef } from "react";

import { CameraReel } from "@/components/guest/camera/camera-reel";
import { CameraShutter } from "@/components/guest/camera/camera-shutter";
import { Button } from "@/components/ui/button";
import { filmingProgress, filmingRead } from "@/lib/guest/camera/clock";
import { reelCells } from "@/lib/guest/camera/reel";
import {
  CAMERA_CONTROLS,
  CAMERA_HINT,
  cameraSubLine,
  reelCaption,
  reelLabel,
} from "@/lib/guest/camera/words";

import { still, WEDDING } from "./fixtures";
import { conicOf, edgeLight, Seam, stillLight } from "./light";
import { useLoop } from "./live";

/**
 * THE ALBUM'S CAMERA, FILMING THE TOAST: production's camera parts round a
 * still (`camera-screen.tsx`'s bar, its contained picture with the filming
 * mark, the reel recording, the caption, the count and the shutter filming,
 * its red ring a share of the clip's length, and the line under it), composed
 * here because the live camera opens the phone's camera and a lab frame must
 * never ask for it.
 *
 * ★ THE RED STAYS IN EVERY OPTION: the face, its ring and the mark are the
 * camera's recording state, information; an option adds only its light.
 *
 * ★ THE LIGHT ANSWERS THE SOUND THE CLIP IS RECORDING: loud, the room's
 * toast; quiet, a lull; refused, the microphone the guest said no to, so the
 * clip films silence and the light stays dark (the camera already says so in
 * words: "Filming without sound"). The moving frame plays a toast's sound on
 * an envelope (quick to rise, slow to settle).
 *
 * ★ STAND-INS, SAID ONCE: the finder's live picture is a still, the sound is
 * drawn rather than heard, and every press is inert.
 */

export type ClipWay = "red" | "seam" | "bloom";
export type ClipMoment = "loud" | "quiet" | "refused";

/** The finder's picture: the toast under the string lights. */
const FINDER = still("wedding-toast");
/** The picture's own light (a Bloom round it), and its bottom edge (a Seam under it). */
const PICTURE_LIGHT = stillLight(FINDER.id);
const PICTURE_EDGE = edgeLight(FINDER.id);

/** Four seconds into a thirty-second clip. */
const ELAPSED_MS = 4_000;
/** The roll: six shots taken of twenty-four. */
const CAP = 24;
const USED = 6;

/** How loud each moment is, 0 to 1. */
const LEVEL: Record<ClipMoment, number> = {
  loud: 0.92,
  quiet: 0.26,
  refused: 0,
};

/** The Seam's reach under the picture at full sound: as far as the reel's foot. */
const SEAM_REACH = 86;

const none = () => {};
const HANDLERS = {
  onPointerDown: none,
  onPointerUp: none,
  onPointerCancel: none,
  onKeyDown: none,
  onKeyUp: none,
  onContextMenu: none,
};

/** The night's clock for the reel's minutes: ten in the evening. */
function tonight(): number {
  const d = new Date();
  d.setHours(22, 0, 0, 0);
  return d.getTime();
}

/**
 * A TOAST'S SOUND, AS A LEVEL: a speech's syllables in bursts, a laugh
 * swelling, the room's applause, read on the envelope's own clock so the
 * light rises with each and settles between them. Pure, so a still and the
 * loop agree.
 */
function soundAt(t: number): number {
  const words = Math.max(0, Math.sin(t * 9.1) * Math.sin(t * 2.3 + 0.4)) * 0.7;
  const swell =
    t > 4.2 && t < 6.4 ? Math.sin(((t - 4.2) / 2.2) * Math.PI) * 0.95 : 0;
  const lull = t > 7 && t < 8.6 ? 0.12 : 1;
  return Math.min(1, Math.max(words * lull, swell));
}

export function CameraFilming({
  way,
  moment,
  playing = false,
}: {
  way: ClipWay;
  moment: ClipMoment;
  /** The moving frame: the light follows a toast's sound on a loop. */
  playing?: boolean;
}) {
  const light = useRef<HTMLSpanElement | null>(null);
  const level = useRef(0);
  useLoop(
    light,
    9.6,
    0,
    (t) => {
      if (!light.current) return;
      // The envelope: quick to rise to the sound, slow to settle from it.
      const target = soundAt(t);
      const prev = level.current;
      level.current =
        target > prev
          ? prev + (target - prev) * 0.45
          : prev + (target - prev) * 0.05;
      light.current.style.setProperty("--sg-level", level.current.toFixed(3));
    },
    playing,
  );
  const at = tonight();
  const recent = Array.from({ length: USED }, (_, i) => ({
    key: `shot-${i}`,
    takenAt: at - (USED - i) * 9 * 60_000,
    kind: "photo" as const,
    sending: false,
  }));
  const cells = reelCells({ cap: CAP, used: USED, recording: true, recent });
  const progress = filmingProgress(ELAPSED_MS);
  const silent = moment === "refused";
  const vars = {
    "--sg-level": playing ? 0 : LEVEL[moment],
  } as CSSProperties;
  return (
    <div
      data-sg-camera={`${way}-${moment}`}
      className="fixed inset-0 overflow-hidden bg-black text-white select-none"
    >
      <div className="cam-screen" data-cam-screen="" data-filming="">
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
                reveal: "live",
                developsAt: null,
                recording: true,
                done: false,
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

        {way === "bloom" && !silent ? (
          // The picture's own light behind it: a frame of its colours, born at its edges, as strong as the sound.
          <span
            ref={light}
            aria-hidden
            data-sg-bloom="clip"
            className="sg-cam-bloom"
            style={
              {
                ...vars,
                "--sg-conic": conicOf(PICTURE_LIGHT, "room"),
              } as CSSProperties
            }
          />
        ) : null}

        <div className="cam-picture" data-cam-picture="">
          {/* eslint-disable-next-line @next/next/no-img-element -- the finder's live picture, a still here */}
          <img
            src={FINDER.src}
            alt=""
            draggable={false}
            className="size-full object-cover"
            style={{ objectPosition: FINDER.focus }}
          />
          <span className="cam-rec" data-cam-rec="">
            <span className="cam-rec-dot" aria-hidden />
            {filmingRead(ELAPSED_MS)}
          </span>
        </div>

        <div className="cam-roll relative">
          {way === "seam" && !silent ? (
            // Under the picture, behind the reel: the picture's own edge, lit as far as the sound carries it.
            <span
              ref={light}
              aria-hidden
              data-sg-clip-seam=""
              className="sg-clip-seam"
              style={vars}
            >
              <Seam light={PICTURE_EDGE} edge="top" reach={SEAM_REACH} />
            </span>
          ) : null}
          <CameraReel
            cells={cells}
            stream={null}
            mirror={false}
            frozen={new Map()}
            just={new Set()}
            progress={progress}
            label={reelLabel(USED)}
            onOpen={none}
          />
          <p className="cam-caption" data-cam-caption="">
            {reelCaption({
              frame: USED + 1,
              cap: CAP,
              done: false,
              host: false,
              sending: 0,
            })}
          </p>
        </div>

        <div className="cam-controls">
          <div className="cam-count" data-cam-count="">
            <p className="font-heading text-page leading-none text-white tabular-nums">
              {CAP - USED}
            </p>
            <p className="mt-1 text-caption text-white/60">
              {CAMERA_CONTROLS.left}
            </p>
          </div>
          <CameraShutter
            handlers={HANDLERS}
            pressed
            filming
            progress={progress}
            disabled={false}
            label={CAMERA_CONTROLS.shutterOrFilm}
          />
          <Button
            type="button"
            variant="glass"
            size="icon-cta"
            tabIndex={-1}
            disabled
            aria-label={CAMERA_CONTROLS.turn}
            className="cam-turn"
          >
            <SwitchCamera aria-hidden />
          </Button>
          <div className="cam-hint">
            <p data-cam-hint="">
              {silent ? CAMERA_HINT.letGoSilent : CAMERA_HINT.letGo}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
