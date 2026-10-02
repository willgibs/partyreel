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
  LOOK_SET,
  NIGHT,
  PARTY,
  PRIYA,
  ROLL,
  type Shot,
  type Still,
} from "./fixtures";
import { FilmStill } from "./film";

/**
 * THE WAITING ROOM: what the album is, full screen, from a guest's first shot
 * until the roll develops (his `waiting` notes: an atmospheric room, a live
 * count, a mystery stack in the middle, her own shots to manage; and this
 * round, "for grids, I'd prefer not to get messy and begin tilting anything").
 *
 * ★ NOTHING IS TILTED. Every print, square and photograph stands square to
 * the screen; depth comes from light and from stacking straight, never from
 * a rotation.
 *
 * ★ INSIDE THE ALBUM, AFTER THE DOOR. The door (`locked-door`'s family) is
 * before joining; this is the album's own face while the roll develops, so it
 * keeps what the album always offers (her camera, Invite, her name) and
 * nothing of the Partyreel chrome (bible 7).
 *
 * ★ WHAT A ROOM MAY KNOW OF ANYONE ELSE'S SHOT IS ITS PLACE IN THE COUNT AND
 * ITS MINUTE. The count rides the album's own sync (the head count every
 * gallery payload carries, moved by the doorbell): no new traffic, and never
 * a name or a picture of anyone else's shot. The contact sheet and the dial
 * draw exactly that (`NIGHT`); the colour room needs a few colours read off
 * each shot on the phone that took it, which is new and says so in its cost.
 *
 * ★ HER SHOTS ARE HERS ALONE. "Mine" is the server's read it always is
 * (`/api/guests/mine`), and her own undeveloped shots are the one thing the
 * page may show her before 9 am; each is hers to delete through the same
 * removal the album's viewer uses, final for the host too. They are drawn as
 * the phone took them: whether the roll wears a look is its own decision.
 */

export type RoomId = "sheet" | "stack" | "glow" | "dial";

/* ── the room's ground, shared ──────────────────────────────────────────── */

/**
 * A LAPTOP'S ROOM: the same room at 1440 (a guest opening the album on her
 * laptop, or anyone at a desk), its middle a centred column. A context rather
 * than a prop, so every piece of a room reads it.
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

/** Each room's light, the one colour it has (bible 6): a source, never paint. */
const LIGHT: Record<RoomId, string> = {
  sheet: "ink",
  stack: "safe",
  glow: "glow",
  dial: "night",
};

function RoomBar({ sub = "Developing" }: { sub?: string }) {
  const wide = useContext(Wide);
  return (
    <div
      className={cn(
        "relative z-10 flex h-14 shrink-0 items-center justify-between",
        wide ? "px-8" : "px-5",
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-heading text-base">{EVENT.name}</p>
        <p className="dm-room-sub">{sub}</p>
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
 * for an always-dark leaf), her shots left beside the camera.
 */
function RoomActions() {
  const wide = useContext(Wide);
  return (
    <div
      className={cn(
        "relative z-10 space-y-2 px-5 pb-7",
        wide && "mx-auto w-full max-w-sm",
      )}
    >
      <Button type="button" size="cta" className="w-full" tabIndex={-1}>
        <Camera /> Take a photo
        <span className="ml-1 rounded-full bg-primary-foreground/10 px-2 py-0.5 text-xs tabular-nums">
          {`${LEFT} left`}
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
  kind,
  children,
  under,
}: {
  kind: RoomId;
  children: ReactNode;
  /** What lies under the room's middle: its light, drawn first. */
  under?: ReactNode;
}) {
  const wide = useContext(Wide);
  return (
    <div
      className="dm-room surface-ink"
      data-dm-room={kind}
      data-light={LIGHT[kind]}
    >
      <span aria-hidden className="dm-room-light" />
      {under}
      <span aria-hidden className="dm-room-grain" />
      <RoomBar />
      <div
        className={cn(
          "relative z-10 flex flex-1 flex-col",
          wide && "mx-auto w-full max-w-[680px]",
        )}
      >
        {children}
      </div>
      <RoomActions />
    </div>
  );
}

/** When it develops, as every room says it. */
function Develops({ className }: { className?: string }) {
  return (
    <p
      data-dm-when
      className={cn("dm-room-dim text-center text-sm", className)}
    >
      {`Develops at ${ROLL.develops}`}
      <span className="dm-room-faint">{` · in ${PARTY.until}`}</span>
    </p>
  );
}

/**
 * The party's count, the one number every room is built round, with the shot
 * that just landed (the sync's own delta, read on her device: the count is
 * all that travels).
 */
function Count({
  line,
  size = 56,
  arrival = true,
}: {
  line: string;
  size?: number;
  arrival?: boolean;
}) {
  return (
    <div className="text-center" data-dm-count>
      <p
        className="font-heading leading-none tabular-nums"
        style={{ fontSize: size }}
      >
        {PARTY.shots}
      </p>
      <p className="dm-room-dim mt-2 text-sm">{line}</p>
      {arrival && (
        <p className="dm-arrival" data-dm-arrival>
          +1 just now
        </p>
      )}
    </div>
  );
}

/** Her six, oldest first: the order the night took them in. */
const HERS_IN_ORDER = [...HER_SHOTS].reverse();

/** Her shot for the n-th of hers in the night's order. */
const hersAt = (() => {
  const map = new Map<number, Shot>();
  let k = 0;
  for (const s of NIGHT) if (s.mine) map.set(s.n, HERS_IN_ORDER[k++]);
  return map;
})();

/* ── 1. the party's contact sheet ───────────────────────────────────────── */

/** How many of the newest squares still glow, warm with being just shot. */
const WARM = 14;

export function SheetRoom() {
  const wide = useContext(Wide);
  return (
    <Room kind="sheet">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-5">
        <Count
          line={`shots from ${PARTY.guests} guests, developing`}
          size={52}
        />
        <div
          className="dm-sheet"
          style={{
            gridTemplateColumns: `repeat(${wide ? 20 : 12}, minmax(0, 1fr))`,
          }}
          data-dm-sheet={NIGHT.length}
        >
          {NIGHT.map((s) => {
            const mine = hersAt.get(s.n);
            if (mine)
              return (
                <span key={s.n} className="dm-cell" data-mine data-dm-hers-cell>
                  <FilmStill still={mine.still} className="size-full" />
                </span>
              );
            const age = NIGHT.length - s.n;
            return (
              <span
                key={s.n}
                className="dm-cell"
                data-new={age === 0 ? "" : undefined}
                style={
                  age < WARM
                    ? ({ "--warm": (WARM - age) / WARM } as CSSProperties)
                    : undefined
                }
              />
            );
          })}
        </div>
        <p className="dm-room-dim flex items-center gap-2 text-xs">
          <span className="dm-key" aria-hidden />
          {`Yours, ${PARTY.hers} of them · tap one to open`}
        </p>
        <Develops />
      </div>
    </Room>
  );
}

/* ── 2. the stack, squared ──────────────────────────────────────────────── */

/** One edge line in the deck for every ten shots: 142 stands fourteen deep. */
const DEPTH = Math.round(PARTY.shots / 10);

/** Where her six tabs stand on the deck's edge, from its top. */
const TABS = [26, 64, 98, 134, 170, 206];

export function StackRoom() {
  return (
    <Room kind="stack">
      <div className="flex flex-1 flex-col items-center justify-center gap-7">
        <Count
          line={`shots in the stack, from ${PARTY.guests} guests`}
          size={52}
        />
        <span className="dm-deck" data-dm-deck={DEPTH}>
          {Array.from({ length: DEPTH }, (_, i) => (
            <span
              key={i}
              aria-hidden
              className="dm-deck-under"
              style={{ translate: `0 ${(DEPTH - i) * 2.2}px` }}
            />
          ))}
          {TABS.map((top, i) => (
            <span
              key={i}
              className="dm-deck-tab"
              style={{ top }}
              data-dm-tab
              aria-label={`Your shot from ${HERS_IN_ORDER[i].time}`}
            />
          ))}
          <span className="dm-print-back dm-deck-top">
            <span aria-hidden className="dm-print-back-line">
              {`${EVENT.name} · ${EVENT.date} · `.repeat(30)}
            </span>
            <span className="dm-print-stamp">{`No. ${PARTY.shots} · ${PARTY.time}`}</span>
          </span>
        </span>
        <div className="space-y-1.5">
          <p className="dm-room-dim text-center text-xs">
            {`Yours are the ${PARTY.hers} tabs · tap one to open`}
          </p>
          <Develops />
        </div>
      </div>
    </Room>
  );
}

/* ── 3. the party's colours ─────────────────────────────────────────────── */

/**
 * THE GLOW: where the party's colour hangs in the room. Each pool stands in
 * for the few colours read off a shot on the phone that took it (in the
 * proposal a handful of bytes beside the count, never the picture): here a
 * party photograph blurred past recognition, so the colour is real and no
 * picture survives.
 */
const POOLS: { light: string; x: number; y: number; s: number }[] = [
  { light: "String lights", x: -40, y: 60, s: 260 },
  { light: "A club's lights", x: 150, y: 20, s: 280 },
  { light: "Blue stage light", x: 30, y: 250, s: 300 },
  { light: "Lasers", x: 190, y: 300, s: 250 },
  { light: "Golden hour", x: -60, y: 430, s: 270 },
];

/** The party's own photographs (everyone's, which she never sees), by their light. */
const POOL_STILLS: readonly Still[] = POOLS.map(
  (p) => LOOK_SET.find((s) => s.light === p.light) ?? LOOK_SET[0],
);

function Glow({ dim = false }: { dim?: boolean }) {
  const wide = useContext(Wide);
  const k = wide ? 2.4 : 1;
  return (
    <span aria-hidden className="dm-glow" data-dim={dim ? "" : undefined}>
      {POOLS.map((p, i) => (
        <span
          key={i}
          className="dm-pool"
          data-new={i === POOLS.length - 1 && !dim ? "" : undefined}
          style={{
            left: p.x * k,
            top: p.y,
            width: p.s * k,
            height: p.s,
          }}
        >
          <FilmStill still={POOL_STILLS[i]} className="size-full" />
        </span>
      ))}
    </span>
  );
}

export function GlowRoom() {
  return (
    <Room kind="glow" under={<Glow />}>
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Count
          line={`shots from ${PARTY.guests} guests, developing`}
          size={64}
        />
        <Develops />
      </div>
      <div className="px-5 pb-5" data-dm-yours>
        <p className="dm-room-dim mb-2 text-xs">{`Yours · ${PARTY.hers}`}</p>
        <div className="grid grid-cols-6 gap-1.5">
          {HER_SHOTS.map((s) => (
            <span key={s.id} className="dm-thumb" data-dm-hers-cell>
              <FilmStill still={s.still} className="aspect-square w-full" />
            </span>
          ))}
        </div>
      </div>
    </Room>
  );
}

/* ── 4. the night on a dial ─────────────────────────────────────────────── */

/** The dial runs from 7 pm, bottom left, round to 9 am, bottom right. */
const DIAL = { size: 300, r: 118, from: 135, sweep: 270, span: 14 * 60 };
const angleOf = (minute: number) =>
  ((DIAL.from + (minute / DIAL.span) * DIAL.sweep) * Math.PI) / 180;
const at = (minute: number, r: number) => {
  const a = angleOf(minute);
  const c = DIAL.size / 2;
  return [c + Math.cos(a) * r, c + Math.sin(a) * r] as const;
};
const arc = (from: number, to: number, r: number) => {
  const [x0, y0] = at(from, r);
  const [x1, y1] = at(to, r);
  const large = ((to - from) / DIAL.span) * DIAL.sweep > 180 ? 1 : 0;
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};

/** Five-minute bins of the night: how many shots landed in each. */
const BINS = (() => {
  const bins = new Map<number, number>();
  for (const s of NIGHT) {
    const b = Math.floor(s.minute / 5) * 5;
    bins.set(b, (bins.get(b) ?? 0) + 1);
  }
  return [...bins.entries()].sort((a, b) => a[0] - b[0]);
})();

const NOW = NIGHT[NIGHT.length - 1].minute;

function Dial() {
  const c = DIAL.size / 2;
  return (
    <svg
      viewBox={`0 0 ${DIAL.size} ${DIAL.size}`}
      width={DIAL.size}
      height={DIAL.size}
      className="dm-dial"
      data-dm-dial={`${BINS.length} bins`}
      aria-hidden
    >
      <path d={arc(0, DIAL.span, DIAL.r)} className="dm-dial-track" />
      <path d={arc(NOW, DIAL.span, DIAL.r)} className="dm-dial-ahead" />
      <path d={arc(0, NOW, DIAL.r)} className="dm-dial-past" />
      {BINS.map(([minute, n]) => {
        const [x0, y0] = at(minute + 2.5, DIAL.r + 6);
        const [x1, y1] = at(minute + 2.5, DIAL.r + 6 + 3 + n * 2.6);
        return (
          <line
            key={minute}
            x1={x0}
            y1={y0}
            x2={x1}
            y2={y1}
            className="dm-dial-bar"
            data-new={minute + 5 > NOW ? "" : undefined}
          />
        );
      })}
      {NIGHT.filter((s) => s.mine).map((s) => {
        const [x, y] = at(s.minute, DIAL.r - 9);
        return (
          <circle
            key={s.n}
            cx={x}
            cy={y}
            r={3}
            className="dm-dial-hers"
            data-dm-hers-dot
          />
        );
      })}
      {(() => {
        const [x, y] = at(NOW, DIAL.r);
        const [lx, ly] = at(NOW + 22, DIAL.r + 16);
        return (
          <>
            <circle cx={x} cy={y} r={5} className="dm-dial-now" />
            <text x={lx} y={ly} className="dm-dial-label dm-dial-now-label">
              now
            </text>
          </>
        );
      })()}
      {(() => {
        const [x, y] = at(DIAL.span, DIAL.r);
        return <circle cx={x} cy={y} r={4} className="dm-dial-develop" />;
      })()}
      <text
        x={at(0, DIAL.r)[0] - 6}
        y={at(0, DIAL.r)[1] + 22}
        className="dm-dial-label"
      >
        7 pm
      </text>
      <text
        x={at(DIAL.span, DIAL.r)[0] + 6}
        y={at(DIAL.span, DIAL.r)[1] + 22}
        className="dm-dial-label"
        textAnchor="end"
      >
        {ROLL.develops}
      </text>
      <text x={c} y={c - 6} className="dm-dial-count" textAnchor="middle">
        {PARTY.shots}
      </text>
      <text x={c} y={c + 18} className="dm-dial-sub" textAnchor="middle">
        shots so far
      </text>
    </svg>
  );
}

export function DialRoom() {
  return (
    <Room kind="dial">
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <div className="relative" data-dm-count>
          <Dial />
          <p className="sr-only">{`${PARTY.shots} shots`}</p>
        </div>
        <span className="dm-yours-pill" data-dm-yours>
          {`Yours · ${PARTY.hers}`}
          <span className="dm-room-faint">{`, the dots on the dial`}</span>
        </span>
        <Develops />
      </div>
    </Room>
  );
}

/* ── her shots, opened: each hers to delete ─────────────────────────────── */

function DeleteMark() {
  return (
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
  );
}

function When({ shot }: { shot: Shot }) {
  return (
    <span className="flex items-center gap-1 tabular-nums">
      {shot.video ? (
        <>
          <Play className="size-2.5 fill-current" aria-hidden />
          {`0:0${shot.video}`}
        </>
      ) : (
        shot.time
      )}
    </span>
  );
}

/** One of hers, face up and square, with its minute and its Delete. */
function Hers({ shot, className }: { shot: Shot; className?: string }) {
  return (
    <span className={cn("dm-hers relative block", className)} data-dm-hers>
      <FilmStill still={shot.still} className="aspect-square w-full" />
      <span className="dm-hers-when">
        <When shot={shot} />
      </span>
      <DeleteMark />
    </span>
  );
}

/**
 * HER SHOTS, OPENED, in the room's own light and the room's own order: lifted
 * off the sheet into a grid, dealt out of the stack in a row, gathered under
 * the glow, or read by the minute round the dial. Square, never tilted.
 */
export function HerShots({
  room,
  lead,
  shots = HER_SHOTS,
}: {
  room: RoomId;
  lead: string;
  shots?: readonly Shot[];
}) {
  const wide = useContext(Wide);
  return (
    <div
      className="dm-room surface-ink"
      data-dm-room="hers"
      data-light={LIGHT[room]}
    >
      {room === "glow" && <Glow dim />}
      <span aria-hidden className="dm-room-light" />
      <div
        className={cn(
          "relative z-10 flex h-14 shrink-0 items-center justify-between",
          wide ? "px-8" : "px-5",
        )}
      >
        <div>
          <p className="font-heading text-base">Your shots</p>
          <p className="dm-room-sub" data-dm-lead>
            {lead}
          </p>
        </div>
        <span className="dm-room-round" aria-label="Close">
          <X className="size-5" aria-hidden />
        </span>
      </div>
      <div
        className={cn(
          "relative z-10",
          wide
            ? "mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-8 pb-24"
            : "px-5 pt-4",
        )}
      >
        {room === "stack" ? (
          <div className={cn(!wide && "pt-16")}>
            <div className="dm-dealt" data-dm-dealt>
              {shots.map((s) => (
                <Hers key={s.id} shot={s} className="dm-hers-print" />
              ))}
            </div>
            <p className="dm-room-dim mt-3 flex items-center justify-center gap-1.5 text-xs">
              {shots.map((s, i) => (
                <span
                  key={s.id}
                  className="dm-dot"
                  data-on={i === 0 ? "" : undefined}
                />
              ))}
            </p>
          </div>
        ) : room === "dial" ? (
          <ol className={cn("grid gap-2", wide && "grid-cols-2 gap-x-6")}>
            {[...shots].reverse().map((s, i) => (
              <li key={s.id} className="dm-hers-row" data-dm-hers>
                <span className="w-16 shrink-0 overflow-hidden rounded-lg">
                  <FilmStill still={s.still} className="aspect-square w-full" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-lg leading-tight tabular-nums">
                    {`${s.time} pm`}
                  </span>
                  <span className="dm-room-dim block text-xs">
                    {s.video
                      ? `A ${s.video}-second video`
                      : `Shot ${i + 1} on your roll`}
                  </span>
                </span>
                <span
                  className="dm-room-round"
                  aria-label="Delete this shot"
                  data-dm-delete
                >
                  <Trash2 className="size-4" aria-hidden />
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <div
            className={cn(
              "grid gap-2",
              wide
                ? "grid-cols-3 gap-4"
                : room === "sheet"
                  ? "grid-cols-3"
                  : "grid-cols-2",
            )}
          >
            {shots.map((s) => (
              <Hers key={s.id} shot={s} />
            ))}
          </div>
        )}
      </div>
      <p
        className={cn(
          "dm-room-faint relative z-10 px-8 text-center text-xs text-pretty",
          wide ? "absolute inset-x-0 bottom-10" : "mt-6",
        )}
      >
        {`Only you can see these until ${ROLL.develops}. Delete one and it's gone for everyone.`}
      </p>
    </div>
  );
}

/**
 * THE DELETE, CONFIRMED: the guest's own removal's words (final, the host's
 * view included), and the carried call that the frame stays spent.
 */
export function DeleteShot({ room }: { room: RoomId }) {
  const wide = useContext(Wide);
  const shot = HER_SHOTS[1];
  return (
    <div className="relative min-h-screen">
      <HerShots room={room} lead={`${PARTY.hers} of ${ROLL.shots}`} />
      <div className="fixed inset-0 z-20 bg-black/55" aria-hidden />
      <div
        className={cn(
          "surface-ink fixed z-30 bg-[#18181b] px-5 pt-5 pb-8 text-[#f4f4f5]",
          wide
            ? "rounded-3xl top-1/2 left-1/2 w-[440px] -translate-1/2 border border-white/10 pb-5"
            : "rounded-t-3xl inset-x-0 bottom-0 border-t border-white/10",
        )}
        data-dm-sheet-ask
      >
        <div className="flex items-start gap-4">
          <span className="w-16 shrink-0 overflow-hidden rounded-md">
            <FilmStill still={shot.still} className="aspect-square w-full" />
          </span>
          <div className="min-w-0 space-y-1.5">
            <p className="font-heading text-lg" data-dm-say>
              Delete this shot?
            </p>
            <p className="text-sm text-pretty text-white/70">
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
