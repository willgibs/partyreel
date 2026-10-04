"use client";

import "./cards.css";

import { type RefObject, useRef } from "react";

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
  ROOM_ICON,
  ROOM_LABEL,
  ROOM_ORDER,
  ROOM_SHORT,
  type RoomId,
  useRestHeight,
} from "./door-kit";
import type { ScreenId } from "./scene";

/**
 * CARDS OVER THE SEAM (round three's drawing, the starting point of round
 * four's refinement): today's cards with App Store depth. The cover fades
 * into the page at its foot and the cards stand over that seam on the lift
 * shadow, the reel's card one of them (its glyph in the reel's own violet, no
 * stills); stuck, pills under a band that fades into the album rather than
 * ending on a line.
 */

/** How far the cards rise into the cover, and how far the photograph fades into the page under them. */
const SEAM: Record<ScreenId, { rise: number; fade: number }> = {
  "375": { rise: 44, fade: 84 },
  "1440": { rise: 64, fade: 120 },
};

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

/**
 * THE VALUE LINE, as status=lights draws a state: where something waits on
 * her, its light leads the words and the words stay the ground's ink; a count
 * that is hers to act on is the foreground; anything else is quiet.
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

/** The glyph in its own small round: the reel's in its violet, every other in the page's grey (a waiting room's state is its light). */
function GlyphChip({ room, size }: { room: RoomId; size: "sm" | "md" }) {
  const Icon = ROOM_ICON[room];
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
        phone
          ? "h-[6.75rem] w-[8.5rem] shrink-0 p-3"
          : "h-[7.25rem] flex-1 p-4",
        selected && "ring-2 ring-foreground",
      )}
    >
      <GlyphChip room={room} size={phone ? "sm" : "md"} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-heading text-card-title">
          {phone ? ROOM_SHORT[room] : ROOM_LABEL[room]}
        </span>
        <Value face={face} />
      </span>
    </button>
  );
}

/** A card, stuck: a pill on the same lift, its glyph, its word and the count. */
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
  const Icon = ROOM_ICON[room];
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
      {phone ? null : ROOM_SHORT[room]}
      {face.count || face.left ? (
        <WaitLight n={face.count ?? face.left ?? 0} unlit={!face.count} />
      ) : null}
    </button>
  );
}

/**
 * THE ROW OVER THE SEAM, sticky, condensing to its band once it reaches the
 * bar: production's footprint and band (`event-cards-row.tsx`), the cover's
 * face leading it stuck and the code's chip closing it.
 *
 * ★ OVER THE SEAM, THE ROW RISES INTO THE COVER by its overlap (an inline
 * margin: the hub's `space-y-6` is a production utility the lab's cannot
 * outrank), and the footprint holds the resting row's height
 * (`useRestHeight`), so condensing never moves the album.
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
  const rise = SEAM[screen].rise;
  return (
    <div
      ref={mark}
      data-eh-row="cards"
      className="pointer-events-none sticky top-14 z-30 -mx-3 sm:-mx-5"
      style={{ minHeight: rest || undefined, marginTop: -(24 + rise) }}
    >
      <div
        ref={bandRef}
        data-eh-band=""
        data-stuck={stuck || undefined}
        className={cn(
          "pointer-events-auto transition-[background-color,border-color] duration-200",
          phone ? "px-3 py-2" : "px-5 py-2",
          stuck ? "eh-fade-band" : "border-b border-transparent",
        )}
      >
        <div
          data-eh-doors="cards"
          role="group"
          aria-label="This event"
          className={cn(
            stuck
              ? phone
                ? // In a hand the band runs past the screen's edge and fades there, as production's does.
                  "eh-shelf -mx-3 flex items-center gap-1.5 overflow-x-auto px-3 py-0.5"
                : "flex items-center gap-2 overflow-hidden py-0.5"
              : phone
                ? "eh-shelf -mx-3 flex gap-2.5 overflow-x-auto px-3 pt-0.5 pb-3"
                : "flex gap-3 pt-0.5 pb-2",
          )}
        >
          {stuck ? (
            <BandLead c={c} name={name} phone={phone} className="pr-1" />
          ) : null}
          {ROOM_ORDER.map((room) =>
            stuck ? (
              <SeamPill
                key={room}
                room={room}
                face={faces[room]}
                phone={phone}
                selected={selected === room}
                onOpen={onOpen}
              />
            ) : (
              <SeamCard
                key={room}
                room={room}
                face={faces[room]}
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

export const CARDS: DoorOption = {
  // The cover's foot is the strip alone: the cards stand over the seam under it.
  CoverFoot: ({ fact }) => fact,
  Page: (p) => <Row {...p} />,
  seam: SEAM,
  stickAt: 57,
};
