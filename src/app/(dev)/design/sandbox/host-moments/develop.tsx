"use client";

import "@/components/guest/camera/camera.css";

import { Sparkles, SwitchCamera, TriangleAlert, X, Zap } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { AddsPage } from "@/components/app/event-settings/adds-page";
import { CameraReel } from "@/components/guest/camera/camera-reel";
import { CameraShutter } from "@/components/guest/camera/camera-shutter";
import { Button } from "@/components/ui/button";
import { ConsequenceLine } from "@/components/ui/consequence-line";
import { reelCells } from "@/lib/guest/camera/reel";
import {
  CAMERA_CONTROLS,
  CAMERA_HINT,
  cameraSubLine,
  developsWhen,
  reelCaption,
  reelLabel,
} from "@/lib/guest/camera/words";

import { Panel, WeddingSettings, weddingEvent } from "./chrome";
import {
  DEVELOPS_AT,
  EVENT,
  HOST,
  IN_THE_FINDER,
  PARTY,
  ROLL,
  TONIGHT,
} from "./fixtures";
import type { ScreenId } from "./knobs";
import { Graft, Mark, Press, Reveal } from "./scene";

/**
 * Q6, A DEVELOP TIME ADDED MID-PARTY. At 9:40 pm the wedding's camera has
 * shown every shot as it was taken (the album's camera, Right away: a mix,
 * so Settings stands Customize open); Maya decides the rest of the night
 * should develop at 9 am. Production writes it at once and says nothing, and
 * every guest's roll starts again, because the develop begins a new period
 * (`events_reveal_stamp` restamps `sealed_from`, and the roll counts from it).
 *
 * The host's frame is production's How guests add page (`adds-page.tsx`), the
 * develop pressed (today) or a candidate's line grafted under the choice while
 * Right away still stands, as every consequence line waits. The guest's
 * frames are production's camera sheet (`camera-screen.tsx`, quoted round a
 * still: the live one opens the phone's camera), every word production's
 * (`cameraSubLine`, `reelCaption`, `reelCells`), at Priya's roll.
 */

export type TellWay = "today" | "line" | "choose";
export type GuestWay = "today" | "line" | "panel";

const WHEN = developsWhen(DEVELOPS_AT, TONIGHT.getTime());

/* ── what Maya is told ─────────────────────────────────────────────────── */

/** The "When everyone sees" choices, the line under them grafted to. */
const WHEN_CHOICES =
  '[data-capture-and-reveal] [role="radiogroup"]:has([data-choice="develop"])';

function FreshRollLine() {
  return (
    <div data-hm-read="what she reads" className="mt-3">
      <ConsequenceLine
        confirmLabel="Start fresh rolls"
        onConfirm={() => {}}
        onCancel={() => {}}
      >
        {`Every guest's roll starts again: ${ROLL.size} fresh shots each, developing together ${WHEN}. What's in the album now stays in view.`}
      </ConsequenceLine>
    </div>
  );
}

/** The consequence line's own look, with the choice it offers: fresh rolls, or each guest's roll carried on. */
function ChooseLine() {
  return (
    <div
      data-hm-read="what she reads"
      className="mt-3 space-y-3 rounded-lg bg-warning/8 p-3"
    >
      <p className="flex gap-2 text-sm text-pretty text-foreground">
        <TriangleAlert
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-warning"
        />
        <span>
          {`From now on, every shot develops ${WHEN}. Guests have shot most of their roll: give everyone a fresh ${ROLL.size}, or let each carry on with what's left?`}
        </span>
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" size="sm">
          Keep it as it is
        </Button>
        <Button type="button" variant="outline" size="sm">
          Carry on with what&apos;s left
        </Button>
        <Button type="button" size="sm">
          {`Fresh rolls of ${ROLL.size}`}
        </Button>
      </div>
    </div>
  );
}

export function TellMoment({
  screen,
  way,
}: {
  screen: ScreenId;
  way: TellWay;
}) {
  return (
    <WeddingSettings
      event={weddingEvent({
        capture: "camera",
        roll_size: ROLL.size,
        moderation_mode: "live",
        develops_at: null,
      } as never)}
      counts={{ in: PARTY.in }}
    >
      <Panel screen={screen} title="How guests add" up>
        <AddsPage />
      </Panel>
      {way === "today" ? (
        <>
          <Press
            at='[data-choice="develop"] button[role="radio"]'
            until='[data-choice="develop"][data-state="on"]'
          />
          <Mark at='[data-choice="develop"]' as="what she reads" />
        </>
      ) : (
        <>
          <Graft at={WHEN_CHOICES} place="after">
            {way === "line" ? <FreshRollLine /> : <ChooseLine />}
          </Graft>
          <Reveal at='[data-hm-read="what she reads"]' />
        </>
      )}
    </WeddingSettings>
  );
}

/* ── what her guests see ───────────────────────────────────────────────── */

const none = () => {};
const HANDLERS = {
  onPointerDown: none,
  onPointerUp: none,
  onPointerCancel: none,
  onKeyDown: none,
  onKeyUp: none,
  onContextMenu: none,
};

/** Priya's camera, production's sheet round a still: her roll, the count, the shutter and the line under it. */
function GuestCamera({
  used,
  developing,
  hint,
  over,
}: {
  /** Frames spent on her roll. */
  used: number;
  /** The develop time is set. */
  developing: boolean;
  /** The line under the shutter, where an option says something there. */
  hint?: ReactNode;
  /** A panel over the picture. */
  over?: ReactNode;
}) {
  const recent = Array.from({ length: Math.min(used, 5) }, (_, i) => ({
    key: `hm-shot-${i}`,
    takenAt: TONIGHT.getTime() - (5 - i) * 6 * 60_000,
    kind: "photo" as const,
    sending: false,
  }));
  const cells = reelCells({ cap: ROLL.size, used, recording: false, recent });
  return (
    <div
      className="hm-cam fixed inset-0 overflow-hidden bg-black text-white select-none"
      style={{ "--hm-finder": `url(${IN_THE_FINDER.src})` } as CSSProperties}
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
              {EVENT.name}
            </p>
            <p
              className="truncate text-micro text-white/60"
              data-hm-read="the camera's line"
            >
              {cameraSubLine({
                reveal: developing ? "develop" : "live",
                developsAt: developing ? DEVELOPS_AT : null,
                recording: false,
                done: false,
                nowMs: TONIGHT.getTime(),
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

        <div className="cam-picture relative" data-cam-picture="">
          {/* eslint-disable-next-line @next/next/no-img-element -- the finder's live picture, a still here */}
          <img
            src={IN_THE_FINDER.src}
            alt=""
            draggable={false}
            className="size-full object-cover"
            style={{ objectPosition: IN_THE_FINDER.focus }}
          />
          {over}
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
          <p className="cam-caption">
            {reelCaption({
              frame: used + 1,
              cap: ROLL.size,
              done: false,
              host: false,
              sending: 0,
            })}
          </p>
        </div>

        <div className="cam-controls">
          <div className="cam-count" data-hm-read="the count">
            <p className="font-heading text-page leading-none text-white tabular-nums">
              {ROLL.size - used}
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
            {hint ?? <p>{CAMERA_HINT.tapOrHold}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Her camera at 9:35 pm, before the develop time: every shot straight in, 5 frames left. */
export function CameraBefore() {
  return <GuestCamera used={ROLL.priyaUsed} developing={false} />;
}

/** Her camera the next time she opens it, after Maya's save: a fresh roll, and what the option says of it. */
export function CameraAfter({ way }: { way: GuestWay }) {
  if (way === "line")
    return (
      <GuestCamera
        used={0}
        developing
        hint={
          <p
            data-hm-read="what she reads"
            className="flex items-center justify-center gap-1.5 text-pretty"
          >
            <Sparkles className="size-3.5 shrink-0" aria-hidden />
            {`A fresh roll: ${HOST.name} set a develop time.`}
          </p>
        }
      />
    );
  if (way === "panel")
    return (
      <GuestCamera
        used={0}
        developing
        over={
          <div
            data-hm-read="what she reads"
            className="cam-dim absolute inset-0 flex flex-col items-center justify-center px-7 text-center"
          >
            <p className="font-heading text-page text-white">A fresh roll</p>
            <p className="mt-1.5 max-w-72 text-reading text-pretty text-white/75">
              {`${HOST.name} set a develop time, so everyone starts again with ${ROLL.size} shots. Everything develops together ${WHEN}.`}
            </p>
            <div className="mt-6 grid w-full max-w-72 gap-2">
              <Button type="button" variant="on-photo" size="cta">
                Start shooting
              </Button>
            </div>
          </div>
        }
      />
    );
  return <GuestCamera used={0} developing />;
}
