"use client";

import "@/components/guest/camera/camera.css";
import "./ns.css";
import "./roll.css";

import { Camera, QrCode, RefreshCw, SwitchCamera, X, Zap } from "lucide-react";

import { RollDonePanel } from "@/components/guest/camera/camera-panels";
import { CameraReel } from "@/components/guest/camera/camera-reel";
import { CameraShutter } from "@/components/guest/camera/camera-shutter";
import { type ShotTile, YourShots } from "@/components/guest/camera/your-shots";
import { AlbumCover } from "@/components/guest/event-experience-head";
import {
  type UploadFailure,
  UploadFailureSheet,
} from "@/components/guest/upload/failure-sheet";
import { Button } from "@/components/ui/button";
import { ROLL_RESHOOTS, rollSpentMessage } from "@/lib/disposable/roll";
import { coverEyebrow } from "@/lib/disposable/wait-words";
import { shotName } from "@/lib/guest/camera/frame-math";
import { reelCells } from "@/lib/guest/camera/reel";
import {
  addWords,
  CAMERA_CONTROLS,
  CAMERA_HINT,
  cameraSubLine,
  reelLabel,
  rollDoneLine,
  shotsCountLine,
  yourShotsLine,
} from "@/lib/guest/camera/words";

import {
  CELLAR_SHOTS,
  FINDER,
  ROLL,
  type Still,
  still,
  type StillId,
  WEDDING,
} from "./fixtures";
import { GuestBar } from "./album";
import { useStillFile } from "./scene";

/**
 * THE ALBUM'S CAMERA IN THE CELLAR, AND WHERE ITS NIGHT ENDS: production's
 * camera parts round a still (`camera-screen.tsx`'s bar, its contained
 * picture, the reel, the caption, the count, the shutter and the line under
 * it; the roll's end, its panel), his shots (production's `YourShots`, as
 * `album-camera.tsx`'s `tiles` would hand them), and the album he goes back
 * to with production's failure sheet over it. Composed here because the live
 * camera opens the phone's camera and a lab frame must never ask for it.
 *
 * ★ A FRAME WAITING FOR THE LINE WEARS THE SENDING DOT'S PLACE, half-lit and
 * still (`ns.css`'s `[data-ns-reel-wait]`): production's reel marks a frame
 * still on its way with a pulsing dot, and in a dead zone nothing is on its
 * way, so the frames that hold a waiting shot say so without moving. The
 * strip under the frames draws the same reel at twice a phone's size
 * (`ReelAt2x`, `roll.css`), since at 375 the mark is seven points.
 *
 * ★ STAND-INS, SAID ONCE: the finder's live picture is a still (the cellar's
 * tasting table), the reel's live frame is dark (it plays the phone's own
 * stream, and a lab frame has none), his shots are the bootstrap stills, the
 * night's clock is fixed (11:50 pm in the cellar, 12:41 am upstairs, the
 * develop at 9 the next morning), the album's sheet reads the reader's own
 * clock (`useWaitClock`), so its develop is set to 9 am on the reader's day
 * (it says "at 9 am", as the night's 12:41 am does), and every press is inert.
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

/** The night's clock, on the reader's own calendar (so "tomorrow at 9 am" whatever her zone): the cellar. */
export const NOW = new Date(2026, 8, 12, 23, 50).getTime();
/** Upstairs, the line back: past midnight, so the develop is "at 9 am", the same morning. */
const AFTER = new Date(2026, 8, 13, 0, 41).getTime();
const DEVELOPS = new Date(2026, 8, 13, 9, 0).toISOString();
const minute = (h: number, m: number) => new Date(2026, 8, 12, h, m).getTime();

/** 9 am on the reader's own day: the sheet's clock is the reader's, never the night's (the header's stand-ins). */
const SHEET_DEVELOPS = (() => {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
})();

/** His 20 frames before the cellar, an evening's minutes, oldest first (the reel shows the last few). */
const EARLIER = Array.from({ length: ROLL.before }, (_, i) => ({
  key: `earlier-${i}`,
  takenAt: minute(19 + Math.floor((i * 12) / 60), (i * 12) % 60),
  kind: "photo" as const,
  sending: false,
}));

/** When his `i`th shot in the cellar was taken: from 11:48 pm, a minute apart. */
const cellarAt = (i: number) => minute(23, 48 + i);

/** The cellar's shots: `sending` marks one that waits for the line. */
const cellar = (n: number, waiting: boolean) =>
  Array.from({ length: n }, (_, i) => ({
    key: `cellar-${i}`,
    takenAt: cellarAt(i),
    kind: "photo" as const,
    sending: waiting,
  }));

/**
 * The stills his evening's twenty froze on, for his list, NEWEST FIRST: the
 * eight a phone shows under the cellar's four are the eight stills the cellar
 * never used, so no photograph stands twice in one screen of his list.
 */
const EVENING: readonly StillId[] = [
  "wedding-toast",
  "reception-table",
  "party-dj",
  "wedding-arch",
  "festival-lights",
  "concert-confetti",
  "party-balloons",
  "reception-hall",
  "wedding-rings",
  "wedding-golden",
  "wedding-petals",
  "festival-crowd",
];
/** His evening's `i`th shot (oldest first), counted from his newest. */
const eveningStill = (i: number): Still =>
  still(EVENING[(ROLL.before - 1 - i) % EVENING.length]!);

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
  /**
   * What the roll's end says under its keys, in the panel's own caption line (production's `freeLine`): the shots that
   * still wait, since the line under the shutter goes with the shutter.
   */
  doneNote?: string;
};

/** The reel's frames for a state: the evening's twenty, then the cellar's waiting shots. */
function cellsFor(s: CameraState) {
  return reelCells({
    cap: ROLL.cap,
    used: s.used,
    recording: false,
    recent: [...EARLIER, ...cellar(s.waiting, true)],
  });
}

export function CellarCamera({ s }: { s: CameraState }) {
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
              freeAFrame={Boolean(s.doneNote)}
              freeLine={s.doneNote}
              onShots={none}
              onBack={none}
            />
          ) : null}
        </div>

        <div className="cam-roll">
          <CameraReel
            cells={cellsFor(s)}
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
 * THE REEL AT TWICE A PHONE'S SIZE, for the strip under the frames: the very
 * reel and caption a state draws in its frame (`cellsFor`), so the waiting
 * mark is judged where it is a few points at 375. A picture, never a door.
 */
export function ReelAt2x({ s }: { s: CameraState }) {
  return (
    <div
      data-ns-reel-wait=""
      data-ns-reel2x=""
      className="ns-reel2x"
      inert
      aria-hidden
    >
      <div className="ns-reel2x-in">
        <CameraReel
          cells={cellsFor(s)}
          stream={null}
          mirror={false}
          frozen={new Map()}
          just={new Set()}
          progress={null}
          label={reelLabel(s.used)}
          onOpen={none}
        />
        <p className="cam-caption">{s.caption}</p>
      </div>
    </div>
  );
}

/**
 * HIS SHOTS AT 12:41 AM, as production's list holds them (`album-camera.tsx`'s
 * `tiles`): this visit's, newest first, the cellar's shots that landed before
 * his evening's twenty, each sealed until the develop ("Developing") and his to
 * take back (its X), under production's head ("24 of 24 · 3 re-shoots left"),
 * its line and its foot. ★ A SHOT REFUSED FOR THE ROLL IS NEVER IN IT: the list
 * skips every refusal but a send that may go again (`refusalOf` is `roll`), so
 * today's two refused shots would be nowhere here either; the album's sheet is
 * where they are said (`RefusedInAlbum`).
 */
export function HisShots({ landed }: { landed: number }) {
  const shots = [
    ...EARLIER.map((e, i) => ({ key: e.key, still: eveningStill(i) })),
    ...CELLAR_SHOTS.slice(0, landed).map((s, i) => ({
      key: `cellar-${i}`,
      still: s,
    })),
  ];
  const tiles: ShotTile[] = shots
    .map(({ key, still: s }) => ({
      key,
      mediaId: `media-${key}`,
      kind: "photo" as const,
      status: "sealed" as const,
      src: s.src,
      removable: true,
      retryable: false,
    }))
    .reverse();
  return (
    <div
      data-ns-shots={landed}
      className="fixed inset-0 overflow-hidden bg-black text-white"
    >
      <YourShots
        tiles={tiles}
        line={yourShotsLine({
          reveal: "develop",
          developsAt: DEVELOPS,
          nowMs: AFTER,
        })}
        count={shotsCountLine(ROLL.before + landed, ROLL.cap, ROLL_RESHOOTS)}
        removing={new Map()}
        canFreeFrames
        onRemove={none}
        onRetry={none}
        onBack={none}
      />
    </div>
  );
}

/**
 * BACK IN THE ALBUM AT 12:41 AM, AS TODAY: the camera closed, the album's
 * failure sheet opens on what the line's return could not land (`guest-upload.tsx`
 * holds it while the camera is open, and the run's end already set it), in
 * production's own sheet with the server's sentence on each row. ★ ITS RETRY IS
 * PRODUCTION'S TOO: `retryCanPass` reads `roll_spent` as a send that may go
 * again, so "Retry both" stands over two shots the roll refuses again (unless
 * he first takes two of his back).
 *
 * The album under it is Sam's Disposable before its develop: production's cover
 * on the house light (nothing in it is drawable until 9 am), its eyebrow and its
 * Take (`coverEyebrow`, `addWords`); its words and the album below stand under
 * the sheet.
 */
export function RefusedInAlbum() {
  const fifth = useStillFile(
    CELLAR_SHOTS[4]!,
    shotName(cellarAt(4), "photo", "image/jpeg"),
  );
  const sixth = useStillFile(
    CELLAR_SHOTS[5]!,
    shotName(cellarAt(5), "photo", "image/jpeg"),
  );
  const failures: UploadFailure[] =
    fifth && sixth
      ? [fifth, sixth].map((file, i) => ({
          id: `refused-${i}`,
          file,
          error: rollSpentMessage(ROLL.cap),
          code: "roll_spent",
        }))
      : [];
  return (
    <div
      data-ns-album-under=""
      className="relative min-h-screen bg-background text-foreground"
    >
      <GuestBar name="Sam" />
      <AlbumCover
        className="-mt-14"
        eyebrow={coverEyebrow(
          { capture: "camera", developsAt: DEVELOPS },
          AFTER,
        )}
        name={WEDDING.name}
        host={{
          name: WEDDING.host.name,
          avatarUrl: null,
          seed: WEDDING.host.seed,
        }}
        date={WEDDING.date}
        description={null}
        mediaCount={0}
        guestCount={WEDDING.guests}
        actions={
          <>
            <Button
              type="button"
              variant="on-photo"
              size="cta"
              tabIndex={-1}
              className="min-w-0 flex-1"
            >
              <Camera /> {addWords({ camera: true, empty: false })}
            </Button>
            <Button
              type="button"
              variant="glass"
              size="icon-cta"
              tabIndex={-1}
              aria-label="Invite"
            >
              <QrCode />
            </Button>
          </>
        }
      />
      <UploadFailureSheet
        open={failures.length > 0}
        onOpenChange={none}
        failures={failures}
        sent={ROLL.cellar}
        landed={ROLL.cap - ROLL.before}
        hostName={WEDDING.host.name}
        waits={{ waits: true, developsAt: SHEET_DEVELOPS }}
        camera
        onRetry={none}
      />
    </div>
  );
}
