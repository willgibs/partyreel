"use client";

import "./glass.css";

import type { RefObject } from "react";

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
} from "./door-kit";

/**
 * GLASS: THE DOORS ON THE COVER IN ONE GLASS CAPSULE (round three's drawing,
 * the starting point of round four's refinement): one object of five segments
 * at the cover's foot, the waiting counts as lights; stuck, the capsule itself
 * floats on under the bar, the cover's face leading it and the code's chip
 * closing it.
 */

/** How a segment stands: on the cover at a desk, on the cover in a hand (its glyph over its word), docked. */
type SegmentForm = "desk" | "hand" | "dock" | "dock-hand";

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

/** One segment of the capsule: its glyph, its word where there is room, the count. */
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
  const Icon = ROOM_ICON[room];
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
        ) : face.left && (hand || bare) ? (
          <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold text-white tabular-nums ring-[1.5px] ring-white/70 ring-inset">
            {formatCount(face.left)}
          </span>
        ) : null}
      </span>
      {bare ? null : (
        <span className="truncate">
          {form === "desk" ? ROOM_LABEL[room] : ROOM_SHORT[room]}
        </span>
      )}
      {!hand && !bare && (face.count || face.left) ? (
        <WaitLight
          n={face.count ?? face.left ?? 0}
          unlit={!face.count}
          className="text-white"
        />
      ) : null}
    </button>
  );
}

/** The capsule's hairline between two segments (a desk's; a hand's segments part by their own room). */
function Hair() {
  return <span aria-hidden className="h-4 w-px shrink-0 bg-white/18" />;
}

/** The doors on the cover: one glass capsule at its foot. */
function Capsule({
  c,
  screen,
  selected,
  onOpen,
  capsuleRef,
}: DoorDraw & { capsuleRef?: RefObject<HTMLDivElement | null> }) {
  const faces = facesOf(c);
  const hand = screen === "375";
  return (
    <div
      ref={capsuleRef}
      data-eh-doors="glass"
      role="group"
      aria-label="This event"
      className={cn(
        "flex items-center glass text-white",
        hand
          ? "h-14 w-full gap-0.5 rounded-[22px] p-1"
          : "h-11 w-fit gap-0.5 rounded-full p-1",
      )}
    >
      {ROOM_ORDER.map((room, i) => (
        <span key={room} className="contents">
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
function Dock({ c, name, screen, selected, onOpen }: DoorDraw) {
  const faces = facesOf(c);
  const phone = screen === "375";
  return (
    <div
      data-eh-band=""
      data-eh-dock=""
      data-stuck=""
      className={cn(
        "pointer-events-none fixed inset-x-0 top-14 z-30 flex",
        phone ? "justify-center px-3 pt-2" : "px-5 pt-2.5",
      )}
    >
      <div
        data-eh-doors="glass"
        role="group"
        aria-label="This event"
        className="eh-glass-dock pointer-events-auto flex h-12 max-w-full items-center gap-0.5 rounded-full glass p-1.5 text-white"
      >
        <BandLead
          c={c}
          name={name}
          phone={phone}
          onGlass
          className={phone ? "pe-1" : "pe-2"}
        />
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
        <CodeEnd name={name} className="ms-1" />
      </div>
    </div>
  );
}

export const GLASS: DoorOption = {
  // The capsule stands between the name and the strip, and is what the live frame watches: it docks as it goes under the bar.
  CoverFoot: ({ fact, mark, ...d }) => (
    <>
      <Capsule {...d} capsuleRef={mark} />
      {fact}
    </>
  ),
  Page: ({ stuck, ...d }) => (stuck ? <Dock {...d} /> : null),
  seam: { "375": { rise: 0, fade: 0 }, "1440": { rise: 0, fade: 0 } },
  stickAt: 64,
};
