"use client";

import "./windows.css";

import { type RefObject, useRef } from "react";
import { Check, Play, Settings, Smartphone, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { settingsReadiness } from "@/lib/events/readiness";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import {
  BandLead,
  CodeEnd,
  type DoorDraw,
  type DoorFace,
  type DoorOption,
  type DoorPress,
  facesOf,
  ROOM_LABEL,
  ROOM_ORDER,
  ROOM_SHORT,
  type RoomId,
  useRestHeight,
} from "./door-kit";
import { AT_THE_DOOR, type Case, GUESTS, REVIEW } from "./fixtures";

/**
 * QUIET WINDOWS (round three's drawing, the starting point of round four's
 * refinement): each door's picture a small inset well drawn in ink and grey,
 * taking its colour only under the pointer, the reel's own a small player
 * rather than its photographs; stuck, each window becomes its pill's glyph.
 */

/** A count as a light: the waiting light where it waits on her, an unlit ring where it is only hers to act on. */
function WaitLight({
  n,
  unlit = false,
  className,
}: {
  n: number;
  unlit?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1.5 text-label font-semibold tabular-nums",
        className,
      )}
    >
      <span className={unlit ? "eh-unlit" : "eh-amber"} aria-hidden />
      {formatCount(n)}
    </span>
  );
}

/** The value line: the light leads a waiting room's words; a count hers to act on is the foreground; the rest quiet. */
function Value({ face, className }: { face: DoorFace; className?: string }) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-1.5 text-xs tabular-nums",
        face.amber || face.strong
          ? "font-medium text-foreground"
          : "text-muted-foreground",
        className,
      )}
    >
      {face.amber ? <span className="eh-amber" aria-hidden /> : null}
      <span className="truncate">{face.value}</span>
    </span>
  );
}

/** Where a window's picture stands: a desk's card, a phone's square, a band's pill. */
type WindowAt = "card" | "square" | "pill";

/** A window's photographs: in grey at rest, their colour under the pointer (`.eh-window`). */
function Tiles({ srcs, at }: { srcs: readonly string[]; at: WindowAt }) {
  if (at === "pill")
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, drawn as the window's picture
      <img src={srcs[0]} alt="" className="eh-mono size-full object-cover" />
    );
  return (
    <span className="grid size-[68%] grid-cols-2 grid-rows-2 gap-[2px]">
      {srcs.slice(0, 4).map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, drawn as the window's picture
        <img
          key={i}
          src={src}
          alt=""
          className="eh-mono size-full min-h-0 rounded-[2px] object-cover"
        />
      ))}
    </span>
  );
}

/**
 * THE REEL'S OWN WINDOW: a small player drawn in ink, never its photographs
 * (his note: the reel "should have its own card design within this option"):
 * a screen's outline, its play mark, and a line that fills while it is live;
 * before it can play, the two pips it counts to.
 */
function Player({ c, at }: { c: Case; at: WindowAt }) {
  if (at === "pill")
    return <Play className="size-3 fill-current" aria-hidden />;
  const live = c.reel === "live";
  return (
    <span
      className={cn(
        "relative flex flex-col items-center justify-center rounded-[5px] border-[1.5px] border-current",
        at === "card" ? "h-[34px] w-[52px]" : "h-[26px] w-[40px]",
      )}
    >
      {live ? (
        <>
          <Play
            className={cn(
              "fill-current",
              at === "card" ? "size-3.5" : "size-3",
            )}
            aria-hidden
          />
          <span className="absolute inset-x-1.5 bottom-1 h-[2px] overflow-hidden rounded-full bg-current/25">
            <span className="eh-reel-line block h-full rounded-full bg-current" />
          </span>
        </>
      ) : (
        <span className="flex items-center gap-1" aria-hidden>
          {[0, 1].map((i) => (
            <span
              key={i}
              className={cn(
                "h-[3px] w-2.5 rounded-full",
                i < c.reelHave ? "bg-current" : "bg-current/30",
              )}
            />
          ))}
        </span>
      )}
    </span>
  );
}

/**
 * SETTINGS' OWN WINDOW: its steps in miniature, a row each, the ticked ones'
 * points in ink and the rest a ring. Never a ring of segments: a ring short of
 * whole reads as a spinner, and nothing on the hub may look like it loads.
 */
function StepRows({
  done,
  total,
  at,
}: {
  done: number;
  total: number;
  at: WindowAt;
}) {
  const rows = Math.min(total, 4);
  const widths = ["78%", "62%", "70%", "54%"];
  return (
    <span
      className={cn(
        "flex flex-col",
        at === "card" ? "w-[46px] gap-[7px]" : "w-[36px] gap-[5px]",
      )}
      aria-hidden
    >
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span
            className={cn(
              "size-[6px] shrink-0 rounded-full",
              i < done
                ? "bg-current"
                : "ring-[1.5px] ring-current/45 ring-inset",
            )}
          />
          <span
            className="h-[2px] rounded-full bg-current/40"
            style={{ width: widths[i] }}
          />
        </span>
      ))}
    </span>
  );
}

/** What each room looks like from its door, in the page's ink and grey. */
function WindowPicture({
  room,
  c,
  at,
}: {
  room: RoomId;
  c: Case;
  at: WindowAt;
}) {
  const small = at !== "card";
  if (room === "reel") return <Player c={c} at={at} />;
  if (room === "guests") {
    const faces = c.waiting > 0 ? AT_THE_DOOR : c.guests > 0 ? GUESTS : [];
    if (faces.length === 0)
      return <Users className="size-4 opacity-70" aria-hidden />;
    const shown = at === "pill" ? 1 : small ? 2 : 3;
    return (
      <span className="flex">
        {faces.slice(0, shown).map((p, i) => (
          <Avatar
            key={p.name}
            seed={p.seed}
            size="sm"
            className={cn("eh-mono ring-2 ring-muted", i > 0 && "-ms-2")}
          >
            <AvatarFallback className="text-[10px]">
              {p.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ))}
      </span>
    );
  }
  if (room === "review")
    return c.review > 0 ? (
      <Tiles srcs={REVIEW.map((r) => r.src)} at={at} />
    ) : (
      <Check className="size-4 opacity-70" aria-hidden />
    );
  if (room === "settings") {
    if (at === "pill") return <Settings className="size-3.5" aria-hidden />;
    const r = settingsReadiness(c.ready).needed;
    return <StepRows done={r.done} total={r.of} at={at} />;
  }
  // See it as a guest: her album standing in a guest's phone.
  if (at === "pill") return <Smartphone className="size-3.5" aria-hidden />;
  return (
    <span
      className={cn(
        "relative overflow-hidden rounded-[5px] border-[1.5px] border-current",
        at === "card" ? "h-[38px] w-[21px]" : "h-[30px] w-[17px]",
      )}
    >
      {c.photos > 0 && c.stills[0] ? (
        // eslint-disable-next-line @next/next/no-img-element -- the cover's own still, drawn small
        <img
          src={c.stills[0].tile}
          alt=""
          className="eh-mono absolute inset-x-0 top-0 h-3/5 w-full object-cover"
        />
      ) : (
        <span className="absolute inset-x-0 top-0 h-3/5 bg-current/15" />
      )}
      <span className="absolute inset-x-[22%] bottom-[12%] h-[8%] rounded-full bg-current" />
    </span>
  );
}

/** The window's well: a quiet inset of the page, its picture in ink, the count on its corner. */
function Well({
  room,
  c,
  face,
  at,
  className,
}: {
  room: RoomId;
  c: Case;
  face: DoorFace;
  at: WindowAt;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "eh-well relative flex shrink-0 items-center justify-center bg-muted text-foreground/65",
        className,
      )}
    >
      <WindowPicture room={room} c={c} at={at} />
      {face.count && at === "square" ? (
        <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-warning px-1 text-[10px] font-semibold text-warning-foreground tabular-nums ring-2 ring-card">
          {formatCount(face.count)}
        </span>
      ) : face.left && at === "square" ? (
        <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-card px-1 text-[10px] font-semibold text-foreground tabular-nums ring-[1.5px] ring-foreground/45 ring-inset">
          {formatCount(face.left)}
        </span>
      ) : null}
    </span>
  );
}

function WindowDoor({
  room,
  face,
  c,
  phone,
  selected,
  onOpen,
}: {
  room: RoomId;
  face: DoorFace;
  c: Case;
  phone: boolean;
  selected: boolean;
  onOpen?: DoorPress;
}) {
  if (phone)
    return (
      <button
        type="button"
        data-eh-door={room}
        aria-pressed={selected || undefined}
        onClick={() => onOpen?.(room)}
        className="eh-window group flex min-w-0 flex-1 flex-col items-center gap-1.5 outline-none"
      >
        <Well
          room={room}
          c={c}
          face={face}
          at="square"
          className={cn(
            "aspect-square w-full max-w-[60px] rounded-[16px] ring-0",
            selected &&
              "ring-2 ring-foreground ring-offset-2 ring-offset-background",
          )}
        />
        <span
          className={cn(
            "max-w-full text-center text-[11px] leading-[1.15] font-medium text-balance",
            face.amber ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {ROOM_SHORT[room]}
        </span>
      </button>
    );
  return (
    <button
      type="button"
      data-eh-door={room}
      aria-pressed={selected || undefined}
      onClick={() => onOpen?.(room)}
      className={cn(
        "eh-window group flex h-[5.25rem] min-w-0 flex-1 items-center gap-3 rounded-xl bg-card p-2.5 pr-3.5 text-left text-card-foreground outline-none",
        selected && "ring-2 ring-foreground",
      )}
    >
      <Well
        room={room}
        c={c}
        face={face}
        at="card"
        className="size-16 rounded-[10px]"
      />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-heading text-card-title">
          {ROOM_LABEL[room]}
        </span>
        <Value face={face} />
      </span>
    </button>
  );
}

/** A window, stuck: its picture as the pill's glyph, its word, and the count. */
function WindowPill({
  room,
  face,
  c,
  phone,
  selected,
  onOpen,
}: {
  room: RoomId;
  face: DoorFace;
  c: Case;
  phone: boolean;
  selected: boolean;
  onOpen?: DoorPress;
}) {
  return (
    <button
      type="button"
      data-eh-door={room}
      aria-pressed={selected || undefined}
      aria-label={phone ? ROOM_LABEL[room] : undefined}
      onClick={() => onOpen?.(room)}
      className={cn(
        "eh-window flex h-9 shrink-0 items-center gap-2 rounded-full bg-card text-xs font-medium outline-none",
        phone ? "px-1" : "pr-3 pl-1",
        selected && "ring-2 ring-foreground",
      )}
    >
      <Well
        room={room}
        c={c}
        face={face}
        at="pill"
        className="size-7 overflow-hidden rounded-full"
      />
      {phone ? null : ROOM_SHORT[room]}
      {face.count || face.left ? (
        <WaitLight
          n={face.count ?? face.left ?? 0}
          unlit={!face.count}
          className={phone ? "pr-1.5" : undefined}
        />
      ) : null}
    </button>
  );
}

/**
 * THE ROW UNDER THE COVER, sticky, condensing to its band once it reaches the
 * bar: production's footprint and band (`event-cards-row.tsx`), the cover's
 * face leading it stuck and the code's chip closing it. The footprint holds
 * the resting row's height (`useRestHeight`), so condensing never moves the
 * album.
 */
function Row({
  c,
  name,
  screen,
  selected,
  onOpen,
  stuck,
  mark,
}: DoorDraw & {
  stuck: boolean;
  mark: RefObject<HTMLDivElement | null>;
}) {
  const bandRef = useRef<HTMLDivElement | null>(null);
  const rest = useRestHeight(bandRef, stuck);
  const phone = screen === "375";
  const faces = facesOf(c);
  return (
    <div
      ref={mark}
      data-eh-row="windows"
      className="pointer-events-none sticky top-14 z-30 -mx-3 sm:-mx-5"
      style={{ minHeight: rest || undefined }}
    >
      <div
        ref={bandRef}
        data-eh-band=""
        data-stuck={stuck || undefined}
        className={cn(
          "pointer-events-auto transition-[background-color,border-color] duration-200",
          phone ? "px-3 py-2" : "px-5 py-2",
          stuck
            ? "border-b border-border bg-background/85 backdrop-blur"
            : "border-b border-transparent",
        )}
      >
        <div
          data-eh-doors="windows"
          role="group"
          aria-label="This event"
          className={cn(
            stuck
              ? phone
                ? // In a hand the band runs past the screen's edge and fades there, as production's does.
                  "eh-shelf -mx-3 flex items-center gap-1.5 overflow-x-auto px-3 py-0.5"
                : "flex items-center gap-2 overflow-hidden py-0.5"
              : phone
                ? "flex items-start justify-between gap-1.5 py-1"
                : "flex gap-2.5 py-0.5",
          )}
        >
          {stuck ? (
            <BandLead c={c} name={name} phone={phone} className="pr-1" />
          ) : null}
          {ROOM_ORDER.map((room) =>
            stuck ? (
              <WindowPill
                key={room}
                room={room}
                face={faces[room]}
                c={c}
                phone={phone}
                selected={selected === room}
                onOpen={onOpen}
              />
            ) : (
              <WindowDoor
                key={room}
                room={room}
                face={faces[room]}
                c={c}
                phone={phone}
                selected={selected === room}
                onOpen={onOpen}
              />
            ),
          )}
          {stuck ? <CodeEnd name={name} className="ml-0.5" /> : null}
        </div>
      </div>
    </div>
  );
}

export const WINDOWS: DoorOption = {
  // The cover's foot is the strip alone: the windows stand under the cover.
  CoverFoot: ({ fact }) => fact,
  Page: (p) => <Row {...p} />,
  seam: { "375": { rise: 0, fade: 0 }, "1440": { rise: 0, fade: 0 } },
  stickAt: 57,
};
