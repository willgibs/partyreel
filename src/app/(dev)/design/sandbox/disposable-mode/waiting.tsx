"use client";

import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
} from "react";
import { Camera, Play, QrCode, Trash2, X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  EVENT,
  HER_SHOTS,
  LEFT,
  PARTY,
  PRIYA,
  ROLL,
  type Shot,
} from "./fixtures";
import { FilmStill, type LookId } from "./film";

/**
 * THE WAITING ROOM: what the album is, full screen, from a guest's first shot
 * until the roll develops (his `waiting` note, whole, and the lane's own two).
 *
 * ★ INSIDE THE ALBUM, AFTER THE DOOR. The door (`locked-door`'s family) is
 * before joining; this is the album's own face while the roll develops, so it
 * keeps what the album always offers (her camera, Invite, her name's menu)
 * and nothing of the Partyreel chrome (bible 7).
 *
 * ★ THE COUNT RIDES THE ALBUM'S OWN SYNC. The head count every gallery
 * payload already carries (`onCountChange`) is the number here, moved by the
 * doorbell at once and by the minute-long poll otherwise: no new traffic, and
 * never a name or a picture of anyone else's shot.
 *
 * ★ HER SHOTS ARE HERS ALONE. "Mine" is the server's read it always is
 * (`/api/guests/mine`), and her own undeveloped shots are the one thing the
 * page may show her before 9 am; each is hers to delete through the same
 * removal the album's viewer uses, final for the host too.
 *
 * ★ LIGHT WITH A SOURCE (bible 6): the only colour is the safelight's red, at
 * the room's top edge, and a photograph's own.
 */

/* ── the room's ground, shared ──────────────────────────────────────────── */

/**
 * A LAPTOP'S ROOM: the same room at 1440 (a guest opening the album on her
 * laptop the next morning, or anyone at a desk), its middle a centred column
 * and her shots a wider grid. A context rather than a prop, so every piece
 * of a room reads it without the board threading it through each one.
 */
const Wide = createContext(false);

export function WaitingScreen({
  wide,
  children,
}: {
  wide: boolean;
  children: ReactNode;
}) {
  return <Wide.Provider value={wide}>{children}</Wide.Provider>;
}

function RoomBar() {
  const wide = useContext(Wide);
  return (
    <div
      className={cn(
        "relative flex h-14 shrink-0 items-center justify-between",
        wide ? "px-8" : "px-5",
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-heading text-base font-medium">
          {EVENT.name}
        </p>
        <p className="text-micro tracking-[0.14em] text-[#f7e9e4]/55 uppercase">
          Developing
        </p>
      </div>
      <span className="flex items-center gap-2">
        <Avatar size="sm" seed={PRIYA.seed}>
          <AvatarFallback className="text-[10px]">
            {PRIYA.name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm">{PRIYA.name}</span>
      </span>
    </div>
  );
}

/**
 * Her camera over Invite, where the album's action block always stands: the
 * product's own buttons on the ink surface (`surface-ink` re-maps the tokens
 * for an always-dark leaf, globals.css), her shots left beside the camera as
 * her tracker's place has it today.
 */
function RoomActions({ left = LEFT }: { left?: number }) {
  const wide = useContext(Wide);
  return (
    <div
      className={cn(
        "relative space-y-2 px-5 pb-8",
        wide && "mx-auto w-full max-w-sm",
      )}
    >
      <Button
        type="button"
        size="cta"
        className="w-full"
        tabIndex={-1}
        data-dm-camera-row
      >
        <Camera /> Take a photo
        <span className="ml-1 rounded-full bg-primary-foreground/10 px-2 py-0.5 text-xs tabular-nums">
          {`${left} left`}
        </span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 w-full"
        tabIndex={-1}
      >
        <QrCode /> Invite
      </Button>
    </div>
  );
}

function Room({
  children,
  kind,
  left,
}: {
  children: ReactNode;
  kind: string;
  left?: number;
}) {
  const wide = useContext(Wide);
  return (
    <div className="dm-room surface-ink" data-dm-room={kind}>
      <span aria-hidden className="dm-room-light" />
      <span aria-hidden className="dm-room-grain" />
      <RoomBar />
      <div
        className={cn(
          "relative flex flex-1 flex-col",
          wide && "mx-auto w-full max-w-[560px]",
        )}
      >
        {children}
      </div>
      <RoomActions left={left} />
    </div>
  );
}

/** When it develops, as every room says it. */
function Develops({ className }: { className?: string }) {
  return (
    <p
      data-dm-when
      className={cn("text-center text-sm text-[#f7e9e4]/70", className)}
    >
      {`Develops tomorrow at ${ROLL.develops}`}
      <span className="text-[#f7e9e4]/45">{` · in ${PARTY.until}`}</span>
    </p>
  );
}

/**
 * The party's count, the one number every room is built round, with what it
 * gained since she opened the page (the sync's own delta, read on her device:
 * the count is all that travels).
 */
function Count({
  big = true,
  line,
  since = 3,
}: {
  big?: boolean;
  line: string;
  since?: number;
}) {
  return (
    <div className="text-center" data-dm-count>
      <p
        className={cn(
          "font-heading leading-none font-medium tabular-nums",
          big ? "text-[64px]" : "text-[44px]",
        )}
      >
        {PARTY.shots}
      </p>
      <p className="mt-2 text-sm text-[#f7e9e4]/80">{line}</p>
      {since > 0 && (
        <p className="mt-2 inline-flex rounded-full bg-[#f7e9e4]/[0.08] px-2.5 py-0.5 text-xs text-[#f7e9e4]/70 tabular-nums">
          {`+${since} since you opened it`}
        </p>
      )}
    </div>
  );
}

/* ── a print, face down ─────────────────────────────────────────────────── */

/**
 * THE BACK OF A PRINT: photo paper's warm white with its maker's line printed
 * across it, the way every lab's paper carries one, here the host's names.
 * Nothing of the picture.
 */
function PrintBack({
  style,
  mine,
  className,
}: {
  style?: CSSProperties;
  mine?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("dm-print-back", className)}
      data-mine={mine ? "" : undefined}
      style={style}
    >
      <span aria-hidden className="dm-print-back-line">
        {`${EVENT.name} · ${EVENT.date} · `.repeat(4)}
      </span>
    </span>
  );
}

/* ── 1. his room, whole: her stack in the middle ────────────────────────── */

const STACK_TILT = [-7, 4, -3, 6, -1, 2];

export function StackRoom() {
  return (
    <Room kind="stack">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <Count line={`shots developing, from ${PARTY.guests} guests`} />
        <span
          className="relative block h-[222px] w-[170px]"
          data-dm-stack={PARTY.hers}
        >
          {STACK_TILT.map((deg, i) => (
            <PrintBack
              key={i}
              mine
              className="absolute inset-0"
              style={{
                transform: `rotate(${deg}deg) translateY(${-i * 1.5}px)`,
              }}
            />
          ))}
          <span className="dm-stack-badge">{`Yours · ${PARTY.hers}`}</span>
        </span>
        <div className="space-y-1.5">
          <Develops />
          <p className="text-center text-xs text-[#f7e9e4]/45">
            Tap your stack to see yours.
          </p>
        </div>
      </div>
    </Room>
  );
}

/* ── 2. the tray: her shots, coming up ──────────────────────────────────── */

const TRAY_AT: { x: number; y: number; r: number; w: number }[] = [
  { x: 18, y: 14, r: -4, w: 104 },
  { x: 134, y: 6, r: 3, w: 96 },
  { x: 236, y: 22, r: -2, w: 92 },
  { x: 40, y: 150, r: 5, w: 98 },
  { x: 150, y: 138, r: -6, w: 104 },
  { x: 250, y: 158, r: 2, w: 84 },
];

export function TrayRoom({ look }: { look: LookId }) {
  return (
    <Room kind="tray">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <Count
          big={false}
          line={`shots in the tray, ${PARTY.hers} of them yours`}
        />
        <div
          className="dm-tray mx-4 h-[292px] w-[343px]"
          data-dm-tray={PARTY.hers}
        >
          {HER_SHOTS.map((s, i) => {
            const at = TRAY_AT[i];
            return (
              <span
                key={s.id}
                className="dm-latent absolute"
                style={{
                  left: at.x,
                  top: at.y,
                  width: at.w,
                  transform: `rotate(${at.r}deg)`,
                }}
              >
                <FilmStill
                  still={s.still}
                  look={look}
                  stamp={false}
                  className="aspect-[3/4] w-full"
                />
              </span>
            );
          })}
          <span aria-hidden className="dm-tray-sheen" />
        </div>
        <div className="space-y-1.5">
          <p
            data-dm-when
            className="px-8 text-center text-sm text-balance text-[#f7e9e4]/70"
          >
            {`Yours come up by ${ROLL.develops} with everyone's, in ${PARTY.until}.`}
          </p>
          <p className="text-center text-xs text-[#f7e9e4]/45">
            Tap one of yours to lift it out.
          </p>
        </div>
      </div>
    </Room>
  );
}

/* ── 3. the pile: the party's roll, landing live ────────────────────────── */

/** Fourteen backs stand for the 142 (the pile's height grows with the count). */
const PILE: { x: number; y: number; r: number; mine?: boolean }[] = [
  { x: 10, y: 60, r: -18 },
  { x: 140, y: 48, r: 14 },
  { x: 62, y: 92, r: 7 },
  { x: 118, y: 104, r: -9 },
  { x: 30, y: 30, r: 24, mine: true },
  { x: 160, y: 88, r: -22 },
  { x: 88, y: 40, r: -4 },
  { x: 48, y: 110, r: 16 },
  { x: 128, y: 20, r: 9, mine: true },
  { x: 96, y: 76, r: -13 },
  { x: 20, y: 86, r: 3 },
  { x: 150, y: 64, r: 27 },
  { x: 72, y: 58, r: -26 },
];

export function PileRoom() {
  return (
    <Room kind="pile">
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <Count
          line={`shots on the pile, ${PARTY.guests} guests shooting`}
          since={0}
        />
        <span className="relative block h-[250px] w-[300px]" data-dm-pile>
          {PILE.map((p, i) => (
            <PrintBack
              key={i}
              mine={p.mine}
              className="dm-pile-print absolute"
              style={{ left: p.x, top: p.y, transform: `rotate(${p.r}deg)` }}
            />
          ))}
          {/* The newest, landing: someone just shot. */}
          <PrintBack
            className="dm-pile-print dm-pile-new absolute"
            style={{ left: 104, top: 52, transform: "rotate(-6deg)" }}
          />
          <span
            className={cn(
              GLASS,
              "absolute top-2 right-0 rounded-full px-2.5 py-1 text-xs font-medium text-white",
            )}
            data-dm-arrival
          >
            +1 just now
          </span>
        </span>
        <span
          className="rounded-full border border-[#f7e9e4]/25 px-4 py-2 text-sm text-[#f7e9e4]/90"
          data-dm-yours
        >
          {`Yours (${PARTY.hers})`}
          <span className="text-[#f7e9e4]/50"> · the folded corners</span>
        </span>
        <Develops />
      </div>
    </Room>
  );
}

/* ── 4. her roll, wound on a reel ───────────────────────────────────────── */

/**
 * HER ROLL AS A STRIP OUT OF ITS CANISTER: the reel camera's own strip, at
 * the room's scale, her exposed frames dark with their minutes and the rest
 * waiting; the party's count over it. The camera's strip carried on, so the
 * roll she watches run out in her hand is the one she waits on.
 */
export function StripRoom() {
  const spent = PARTY.hers;
  const times = [...HER_SHOTS].reverse().map((s) => s.time);
  return (
    <Room kind="strip">
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <Count line={`shots developing, from ${PARTY.guests} guests`} />
        <div className="relative h-[150px] w-full" data-dm-roll={spent}>
          <span aria-hidden className="dm-canister" />
          <div className="dm-roll-strip">
            <span aria-hidden className="dm-strip-holes dm-strip-holes-top" />
            <span
              aria-hidden
              className="dm-strip-holes dm-strip-holes-bottom"
            />
            <p aria-hidden className="dm-edge dm-edge-top">
              {`${EVENT.name.toUpperCase()}  ▸ ${ROLL.shots} EXP  ▸ ${PRIYA.name.toUpperCase()}`}
            </p>
            {Array.from({ length: 9 }, (_, i) => {
              const n = i + 1;
              const state =
                n <= spent ? "exposed" : n === spent + 1 ? "current" : "fresh";
              return (
                <span
                  key={n}
                  className="dm-roll-cell"
                  data-state={state}
                  style={{ left: 16 + i * 78 }}
                >
                  {state === "exposed" && (
                    <span className="dm-strip-time">{times[i]}</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-center text-sm text-[#f7e9e4]/85" data-dm-yours>
            {`Your roll: ${spent} of ${ROLL.shots} exposed`}
          </p>
          <Develops />
          <p className="text-center text-xs text-[#f7e9e4]/45">
            Tap your roll to see yours.
          </p>
        </div>
      </div>
    </Room>
  );
}

/* ── her shots, opened: each hers to delete ─────────────────────────────── */

/** A shot of hers, face up for her alone, with its time and its Delete. */
function Hers({
  shot,
  look,
  latent,
  tilt,
}: {
  shot: Shot;
  look: LookId;
  latent?: boolean;
  tilt: number;
}) {
  return (
    <span
      className="relative block"
      style={{ transform: `rotate(${tilt}deg)` }}
      data-dm-hers
    >
      <span className={cn("dm-print-face block", latent && "dm-latent")}>
        <FilmStill
          still={shot.still}
          look={look}
          stamp={false}
          className="aspect-[3/4] w-full"
        />
      </span>
      <span className="absolute bottom-2 left-2 flex items-center gap-1 text-micro font-medium text-white/90 tabular-nums drop-shadow">
        {shot.video ? (
          <>
            <Play className="size-2.5 fill-current" aria-hidden />
            {`0:0${shot.video}`}
          </>
        ) : (
          shot.time
        )}
      </span>
      <span
        className={cn(
          GLASS,
          "absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full text-white",
        )}
        aria-label="Delete this shot"
        data-dm-delete
      >
        <Trash2 className="size-3.5" aria-hidden />
      </span>
    </span>
  );
}

const HERS_TILT = [-3, 2, -1.5, 2.5, -2, 1];

export function HerShots({
  look,
  latent,
  lead,
  shots = HER_SHOTS,
}: {
  look: LookId;
  /** The tray's: hers are still coming up, faint even to her. */
  latent?: boolean;
  lead: string;
  shots?: readonly Shot[];
}) {
  const wide = useContext(Wide);
  return (
    <div className="dm-room surface-ink" data-dm-room="hers">
      <span aria-hidden className="dm-room-light" />
      <div
        className={cn(
          "relative flex h-14 shrink-0 items-center justify-between",
          wide ? "px-8" : "px-5",
        )}
      >
        <div>
          <p className="font-heading text-base font-medium">Your shots</p>
          <p className="text-micro text-[#f7e9e4]/55">{lead}</p>
        </div>
        <span className="dm-cam-round" aria-label="Close">
          <X className="size-5" aria-hidden />
        </span>
      </div>
      <div
        className={cn(
          "relative grid gap-x-4 gap-y-5 pt-4",
          wide
            ? "mx-auto w-full max-w-5xl grid-cols-6 gap-x-6 px-8 pt-10"
            : "grid-cols-2 px-5",
        )}
      >
        {shots.map((s, i) => (
          <Hers
            key={s.id}
            shot={s}
            look={look}
            latent={latent}
            tilt={HERS_TILT[i % HERS_TILT.length]}
          />
        ))}
      </div>
      <p className="relative mt-6 px-8 text-center text-xs text-pretty text-[#f7e9e4]/50">
        {`Only you can see these until ${ROLL.develops}. Delete one and it's gone for everyone.`}
      </p>
    </div>
  );
}

/**
 * THE DELETE, CONFIRMED: the guest's own removal's words (final, the host's
 * view included), and the carried call `spent` said where she decides.
 */
export function DeleteShot({
  look,
  latent,
}: {
  look: LookId;
  latent?: boolean;
}) {
  const wide = useContext(Wide);
  const shot = HER_SHOTS[1];
  return (
    <div className="relative min-h-screen">
      <HerShots
        look={look}
        latent={latent}
        lead={`${PARTY.hers} of ${ROLL.shots}`}
      />
      <div className="fixed inset-0 bg-black/55" aria-hidden />
      <div
        className={cn(
          "surface-ink fixed bg-[#1a1311] px-5 pt-5 pb-8 text-[#f7efe9]",
          wide
            ? "rounded-3xl top-1/2 left-1/2 w-[440px] -translate-1/2 border border-white/10 pb-5"
            : "rounded-t-3xl inset-x-0 bottom-0 border-t border-white/10",
        )}
        data-dm-sheet
      >
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "w-16 shrink-0 overflow-hidden rounded-md",
              latent && "dm-latent",
            )}
          >
            <FilmStill
              still={shot.still}
              look={look}
              stamp={false}
              className="aspect-[3/4] w-full"
            />
          </span>
          <div className="min-w-0 space-y-1.5">
            <p className="font-heading text-lg font-medium" data-dm-say>
              Delete this shot?
            </p>
            <p className="text-sm text-pretty text-[#f7efe9]/70">
              {`It's deleted from the roll right away and can't be recovered. The frame stays spent: you'll still have ${LEFT} left.`}
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="cta" tabIndex={-1}>
            Keep it
          </Button>
          <Button
            type="button"
            size="cta"
            tabIndex={-1}
            className="dm-destructive"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
