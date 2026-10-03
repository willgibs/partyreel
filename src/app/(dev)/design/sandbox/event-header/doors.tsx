"use client";

import {
  type ReactNode,
  type RefObject,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Check,
  Clapperboard,
  ListChecks,
  Play,
  Settings,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CodeChip } from "@/components/ui/code-chip";
import { doorLabel } from "@/lib/events/visibility-labels";
import { settingsReadiness, stepsLeft } from "@/lib/events/readiness";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { AT_THE_DOOR, type Case, GUESTS, REVIEW } from "./fixtures";
import type { ScreenId } from "./scene";

/**
 * THE DOORS INTO HER ROOMS, ROUND THREE: each of round two's three, refined
 * as he asked, and each with its sticky form ("slides right into the sticky
 * menu on scroll (important for all options to have their version in cleanly
 * doing so)").
 *
 *  - `cards`, today's cards with App Store depth: the cover fades into the
 *    page at its foot and the cards stand over that seam on the lift shadow,
 *    the reel's card one of them (its glyph in the reel's own violet, no
 *    stills: "we have images in event head and gallery below"); stuck, pills
 *    under a band that fades into the album rather than ending on a line;
 *  - `windows`, windows into each room made quiet: each door's picture a
 *    small inset well drawn in ink and grey, taking its colour only under the
 *    pointer, the reel's own a small player rather than its photographs;
 *    stuck, each window becomes its pill's glyph;
 *  - `glass`, the doors on the cover in one glass capsule, polished: one
 *    object of five segments at the cover's foot, the waiting counts as amber
 *    lights; stuck, the capsule itself floats on under the bar, the cover's
 *    face leading it and the code's chip closing it.
 *
 * The row is production's order (`EVENT_ROOMS`: the reel, Guests, Review,
 * Settings) with See it as a guest last, the payoff at the row's end
 * (`AS_GUEST_DOOR`). Every press opens its room over the hub, as wired.
 *
 * ★ THE NEEDS-ACTION TONE IS THE ONE COLOUR (production's amber `warning`): a
 * count of people at the door or uploads in Review, and nothing else; the
 * reel's violet marks the reel itself (design-system.md's one colour per
 * action), never a state.
 */

export type DoorsId = "cards" | "windows" | "glass";

export type RoomId = "reel" | "guests" | "review" | "settings" | "guest";

/** The rooms a door opens, in production's order, the guest's view last. */
export const ROOM_ORDER: readonly RoomId[] = [
  "reel",
  "guests",
  "review",
  "settings",
  "guest",
];

export const ROOM_LABEL: Record<RoomId, string> = {
  reel: "Highlight reel",
  guests: "Guests",
  review: "Review",
  settings: "Settings",
  guest: "As a guest",
};

/** The word a small door has room for. */
const SHORT: Record<RoomId, string> = {
  reel: "Reel",
  guests: "Guests",
  review: "Review",
  settings: "Settings",
  guest: "As a guest",
};

const ICON: Record<RoomId, LucideIcon> = {
  reel: Clapperboard,
  guests: Users,
  review: ListChecks,
  settings: Settings,
  guest: Smartphone,
};

/** A door's face: its one line, and the count that needs her (the amber tone) or one to act on. */
export type DoorFace = {
  value: string;
  amber?: boolean;
  /** The needs-action count. */
  count?: number;
  /** A count to act on, never waiting on her (Settings' steps left): the foreground, never amber. */
  strong?: boolean;
};

/** Every door's face, from the album's facts: production's words (`page.tsx`, `room-card.ts`). */
export function facesOf(c: Case): Record<RoomId, DoorFace> {
  const left = stepsLeft(c.ready);
  const toGo = 2 - c.reelHave;
  return {
    reel:
      c.reel === "live"
        ? { value: "Live for guests" }
        : {
            value:
              c.reelHave === 0
                ? "Starts at 2 photos"
                : `${toGo} more ${toGo === 1 ? "photo" : "photos"}`,
          },
    guests:
      c.waiting > 0
        ? {
            value: `${formatCount(c.waiting)} waiting`,
            amber: true,
            count: c.waiting,
          }
        : {
            value: `${formatCount(c.guests)} ${c.guests === 1 ? "guest" : "guests"}`,
          },
    review:
      c.review > 0
        ? {
            value: `${formatCount(c.review)} waiting`,
            amber: true,
            count: c.review,
          }
        : { value: "All caught up" },
    settings:
      left > 0
        ? { value: `${formatCount(left)} left`, strong: true }
        : { value: doorLabel(c.door) },
    guest: { value: "What they see" },
  };
}

export type DoorPress = (room: RoomId) => void;

/** The amber light and its number: what waits on her, as status=lights draws a state. */
function WaitLight({ n, className }: { n: number; className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1.5 text-label font-semibold tabular-nums",
        className,
      )}
    >
      <span className="eh-amber" aria-hidden />
      {formatCount(n)}
    </span>
  );
}

/**
 * THE VALUE LINE, as status=lights draws a state: where something waits on
 * her, its amber light leads the words and the words stay the ground's ink;
 * a count that is hers to act on is the foreground; anything else is quiet.
 */
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

/* ══ CARDS: App Store depth, over the seam ═════════════════════════════════ */

/** The glyph in its own small round: the reel's in its violet, every other in the page's grey (a waiting room's state is its light). */
function GlyphChip({ room, size }: { room: RoomId; size: "sm" | "md" }) {
  const Icon = ICON[room];
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        size === "md" ? "size-9" : "size-8",
        room === "reel" ? "eh-chip-reel" : "bg-muted text-muted-foreground",
      )}
    >
      <Icon className={size === "md" ? "size-[18px]" : "size-4"} />
    </span>
  );
}

function SeamCard({
  room,
  face,
  phone,
  selected,
  onOpen,
}: {
  room: RoomId;
  face: DoorFace;
  phone: boolean;
  selected: boolean;
  onOpen?: DoorPress;
}) {
  return (
    <button
      type="button"
      data-eh-door={room}
      aria-pressed={selected || undefined}
      onClick={() => onOpen?.(room)}
      className={cn(
        "eh-lift group relative flex min-w-0 flex-col justify-between rounded-2xl bg-card text-left text-card-foreground shadow-lift outline-none",
        phone ? "h-[6.75rem] w-[8.5rem] shrink-0 p-3" : "h-[7.25rem] flex-1 p-4",
        selected && "ring-2 ring-foreground",
      )}
    >
      <GlyphChip room={room} size={phone ? "sm" : "md"} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-heading text-card-title">
          {phone ? SHORT[room] : ROOM_LABEL[room]}
        </span>
        <Value face={face} />
      </span>
    </button>
  );
}

/** A card, stuck: a pill on the same lift, its glyph, its word and the amber count. */
function SeamPill({
  room,
  face,
  phone,
  selected,
  onOpen,
}: {
  room: RoomId;
  face: DoorFace;
  phone: boolean;
  selected: boolean;
  onOpen?: DoorPress;
}) {
  const Icon = ICON[room];
  return (
    <button
      type="button"
      data-eh-door={room}
      aria-pressed={selected || undefined}
      aria-label={phone ? ROOM_LABEL[room] : undefined}
      onClick={() => onOpen?.(room)}
      className={cn(
        "eh-pill-lift flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-card text-xs font-medium text-card-foreground shadow-lift outline-none",
        phone ? "px-2.5" : "px-3",
        selected && "ring-2 ring-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-4",
          room === "reel" ? "eh-reel-ink" : "text-muted-foreground",
        )}
        aria-hidden
      />
      {phone ? null : SHORT[room]}
      {face.count ? <WaitLight n={face.count} /> : null}
    </button>
  );
}

/* ══ WINDOWS: a small quiet picture of each room ═══════════════════════════ */

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
              i < done ? "bg-current" : "ring-[1.5px] ring-current/45 ring-inset",
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

/** The window's well: a quiet inset of the page, its picture in ink, the amber count on its corner. */
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
          {SHORT[room]}
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

/** A window, stuck: its picture as the pill's glyph, its word, and the count that needs her. */
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
      {phone ? null : SHORT[room]}
      {face.count ? (
        <WaitLight n={face.count} className={phone ? "pr-1.5" : undefined} />
      ) : null}
    </button>
  );
}

/* ══ GLASS: one capsule on the cover ═══════════════════════════════════════ */

/** How a segment stands: on the cover at a desk, on the cover in a hand (its glyph over its word), docked. */
type SegmentForm = "desk" | "hand" | "dock" | "dock-hand";

/** One segment of the capsule: its glyph, its word where there is room, the amber count. */
function Segment({
  room,
  face,
  form,
  selected,
  onOpen,
}: {
  room: RoomId;
  face: DoorFace;
  form: SegmentForm;
  selected: boolean;
  onOpen?: DoorPress;
}) {
  const Icon = ICON[room];
  const hand = form === "hand";
  const bare = form === "dock-hand";
  return (
    <button
      type="button"
      data-eh-door={room}
      aria-pressed={selected || undefined}
      aria-label={bare ? `${ROOM_LABEL[room]}: ${face.value}` : undefined}
      title={`${ROOM_LABEL[room]}: ${face.value}`}
      onClick={() => onOpen?.(room)}
      className={cn(
        "eh-seg relative flex shrink-0 items-center justify-center text-white outline-none",
        hand
          ? "h-full min-w-0 flex-1 flex-col gap-1 rounded-[18px] text-[11px] font-medium"
          : bare
            ? "size-9 rounded-full"
            : "h-9 gap-2 rounded-full px-3.5 text-sm font-medium",
        selected && "bg-white/20",
      )}
    >
      <span className="relative">
        <Icon className={hand ? "size-5" : "size-4"} aria-hidden />
        {face.count && (hand || bare) ? (
          <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] leading-none font-semibold text-warning-foreground tabular-nums">
            {formatCount(face.count)}
          </span>
        ) : null}
      </span>
      {bare ? null : (
        <span className="truncate">
          {form === "desk" ? ROOM_LABEL[room] : SHORT[room]}
        </span>
      )}
      {face.count && !hand && !bare ? (
        <WaitLight n={face.count} className="text-white" />
      ) : null}
    </button>
  );
}

/** The capsule's hairline between two segments (a desk's; a hand's segments part by their own room). */
function Hair() {
  return <span aria-hidden className="h-4 w-px shrink-0 bg-white/18" />;
}

/** The doors on the cover: one glass capsule at its foot. */
export function GlassDoors({
  c,
  screen,
  selected,
  onOpen,
  capsuleRef,
}: {
  c: Case;
  screen: ScreenId;
  selected?: RoomId | null;
  onOpen?: DoorPress;
  /** A live frame reads its stuck state off the capsule's own top. */
  capsuleRef?: RefObject<HTMLDivElement | null>;
}) {
  const faces = facesOf(c);
  const hand = screen === "375";
  return (
    <div
      ref={capsuleRef}
      data-eh-doors="glass"
      data-eh-capsule=""
      role="group"
      aria-label="This event"
      className={cn(
        "glass flex items-center text-white",
        hand
          ? "h-14 w-full gap-0.5 rounded-[22px] p-1"
          : "h-11 w-fit gap-0.5 rounded-full p-1",
      )}
    >
      {ROOM_ORDER.map((room, i) => (
        <span key={room} className={cn("contents")}>
          {!hand && i > 0 ? <Hair /> : null}
          <Segment
            room={room}
            face={faces[room]}
            form={hand ? "hand" : "desk"}
            selected={selected === room}
            onOpen={onOpen}
          />
        </span>
      ))}
    </div>
  );
}

/**
 * GLASS, STUCK: the capsule floats on under the bar once the cover's has gone
 * under it, the cover's face leading it and the code's chip closing it, over
 * the album scrolling beneath. It takes no room in the page (fixed), so the
 * album never moves when it arrives.
 */
function GlassDock({
  c,
  name,
  phone,
  selected,
  onOpen,
}: {
  c: Case;
  name: string;
  phone: boolean;
  selected?: RoomId | null;
  onOpen?: DoorPress;
}) {
  const faces = facesOf(c);
  return (
    <div
      data-eh-band=""
      data-stuck=""
      className={cn(
        "eh-dock pointer-events-none fixed inset-x-0 top-14 z-30 flex",
        phone ? "justify-center px-3 pt-2" : "px-5 pt-2.5",
      )}
    >
      <div
        data-eh-doors="glass"
        role="group"
        aria-label="This event"
        className="eh-dock-glass glass pointer-events-auto flex h-12 max-w-full items-center gap-0.5 rounded-full p-1.5 text-white"
      >
        <BandLead c={c} name={name} onGlass phone={phone} />
        <Hair />
        {ROOM_ORDER.map((room) => (
          <Segment
            key={room}
            room={room}
            face={faces[room]}
            form={phone ? "dock-hand" : "dock"}
            selected={selected === room}
            onOpen={onOpen}
          />
        ))}
        <CodeChip
          aria-label={`Show the code for ${name}`}
          title="Invite"
          className="ms-1"
        />
      </div>
    </div>
  );
}

/* ══ THE ROW AND ITS BAND ══════════════════════════════════════════════════ */

/** How far the cards rise into the cover: the seam they stand over (the cover clears it, `head.tsx`). */
export const SEAM_RISE: Record<ScreenId, number> = { "375": 44, "1440": 64 };

/**
 * THE ROW UNDER THE COVER, sticky, condensing to the band once it reaches the
 * bar: production's footprint and band (`event-cards-row.tsx`), the cover's
 * face leading it stuck and the code's chip closing it.
 *
 * ★ THE FOOTPRINT HOLDS THE RESTING ROW'S HEIGHT (production's `useStuckBand`),
 * so condensing never moves the album: a row that shrank under a live frame's
 * scroll would lift its own footprint off the bar and unstick it, for ever.
 * ★ OVER THE SEAM, THE ROW RISES INTO THE COVER by its overlap (an inline
 * margin: production's `space-y-6` is a utility the lab's cannot outrank).
 * ★ WITH THE DOORS ON THE COVER (`glass`) nothing stands under it at rest, so
 * the dock arrives fixed under the bar once the capsule has gone under it,
 * and takes no room in the page.
 */
export function DoorsRow({
  doors,
  c,
  name,
  screen,
  stuck,
  selected,
  onOpen,
  footRef,
}: {
  doors: DoorsId;
  c: Case;
  name: string;
  screen: ScreenId;
  stuck: boolean;
  selected?: RoomId | null;
  onOpen?: DoorPress;
  /** A live frame's footprint, which it reads its stuck state off. */
  footRef?: RefObject<HTMLDivElement | null>;
}) {
  const bandRef = useRef<HTMLDivElement | null>(null);
  const [rest, setRest] = useState(0);
  const phone = screen === "375";
  useLayoutEffect(() => {
    const band = bandRef.current;
    if (!band || stuck || doors === "glass") return;
    const hold = () => setRest(band.getBoundingClientRect().height);
    hold();
    const ro = new ResizeObserver(hold);
    ro.observe(band);
    return () => ro.disconnect();
  }, [stuck, doors]);

  if (doors === "glass")
    return stuck ? (
      <GlassDock
        c={c}
        name={name}
        phone={phone}
        selected={selected}
        onOpen={onOpen}
      />
    ) : null;

  const rise = doors === "cards" ? SEAM_RISE[screen] : 0;
  return (
    <div
      ref={footRef}
      data-eh-row={doors}
      className="pointer-events-none sticky top-14 z-30 -mx-3 sm:-mx-5"
      style={{
        minHeight: rest || undefined,
        marginTop: rise ? -(24 + rise) : undefined,
      }}
    >
      <Band
        doors={doors}
        c={c}
        name={name}
        phone={phone}
        stuck={stuck}
        selected={selected}
        onOpen={onOpen}
        bandRef={bandRef}
      />
    </div>
  );
}

function Band({
  doors,
  c,
  name,
  phone,
  stuck,
  selected,
  onOpen,
  bandRef,
}: {
  doors: "cards" | "windows";
  c: Case;
  name: string;
  phone: boolean;
  stuck: boolean;
  selected?: RoomId | null;
  onOpen?: DoorPress;
  bandRef?: RefObject<HTMLDivElement | null>;
}) {
  const faces = facesOf(c);
  const seam = doors === "cards";
  const doorOf = (room: RoomId): ReactNode => {
    const face = faces[room];
    const on = selected === room;
    if (seam)
      return stuck ? (
        <SeamPill
          key={room}
          room={room}
          face={face}
          phone={phone}
          selected={on}
          onOpen={onOpen}
        />
      ) : (
        <SeamCard
          key={room}
          room={room}
          face={face}
          phone={phone}
          selected={on}
          onOpen={onOpen}
        />
      );
    return stuck ? (
      <WindowPill
        key={room}
        room={room}
        face={face}
        c={c}
        phone={phone}
        selected={on}
        onOpen={onOpen}
      />
    ) : (
      <WindowDoor
        key={room}
        room={room}
        face={face}
        c={c}
        phone={phone}
        selected={on}
        onOpen={onOpen}
      />
    );
  };
  return (
    <div
      ref={bandRef}
      data-eh-band=""
      data-stuck={stuck || undefined}
      className={cn(
        "pointer-events-auto transition-[background-color,border-color] duration-200",
        phone ? "px-3 py-2" : "px-5 py-2",
        stuck
          ? seam
            ? "eh-fade-band"
            : "border-b border-border bg-background/85 backdrop-blur"
          : "border-b border-transparent",
      )}
    >
      <div
        data-eh-doors={doors}
        role="group"
        aria-label="This event"
        className={cn(
          stuck
            ? phone
              ? // In a hand the band runs past the screen's edge and fades there, as production's does.
                "eh-shelf -mx-3 flex items-center gap-1.5 overflow-x-auto px-3 py-0.5"
              : "flex items-center gap-2 overflow-hidden py-0.5"
            : seam
              ? phone
                ? "eh-shelf -mx-3 flex gap-2.5 overflow-x-auto px-3 pt-0.5 pb-3"
                : "flex gap-3 pt-0.5 pb-2"
              : phone
                ? "flex items-start justify-between gap-1.5 py-1"
                : "flex gap-2.5 py-0.5",
        )}
      >
        {stuck ? <BandLead c={c} name={name} phone={phone} /> : null}
        {ROOM_ORDER.map(doorOf)}
        {stuck ? (
          <CodeChip
            aria-label={`Show the code for ${name}`}
            title="Invite"
            className="ml-0.5"
          />
        ) : null}
      </div>
    </div>
  );
}

/** The band's lead once the cover has gone: its first photograph and the event's name. */
function BandLead({
  c,
  name,
  phone,
  onGlass = false,
}: {
  c: Case;
  name: string;
  phone: boolean;
  onGlass?: boolean;
}) {
  const face = c.stills[0]?.tile;
  return (
    <span
      data-band-lead=""
      className={cn(
        "flex min-w-0 shrink-0 items-center gap-2.5",
        onGlass ? "ps-0 pe-2" : "pr-1",
        phone && "pe-1",
      )}
    >
      {face ? (
        // eslint-disable-next-line @next/next/no-img-element -- the cover's first still
        <img
          src={face}
          alt=""
          className={cn(
            "size-9 shrink-0 object-cover",
            onGlass ? "rounded-full" : "rounded-lg",
          )}
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            "size-9 shrink-0",
            onGlass ? "rounded-full bg-white/15" : "rounded-lg bg-muted",
          )}
        />
      )}
      {phone ? null : (
        <span
          className={cn(
            "max-w-48 truncate font-heading text-card-title",
            onGlass && "text-white",
          )}
        >
          {name}
        </span>
      )}
    </span>
  );
}
