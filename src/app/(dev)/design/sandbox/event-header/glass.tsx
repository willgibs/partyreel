"use client";

import "./glass.css";

import { type RefObject, useLayoutEffect, useRef } from "react";
import { Pause } from "lucide-react";

import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import {
  CodeEnd,
  type DoorDraw,
  type DoorFace,
  type DoorOption,
  type DoorPress,
  doorName,
  facesOf,
  ROOM_ICON,
  ROOM_LABEL,
  ROOM_ORDER,
  ROOM_SHORT,
  type RoomId,
} from "./door-kit";

/**
 * GLASS: EVERY DOOR IN ONE GLASS CAPSULE, the way a phone's tab bar holds its
 * tabs (round four, refined from round three's drawing).
 *
 *  - AT A DESK it stands on the cover's foot under the name, each door its
 *    glyph and its word. As she scrolls it stops under the bar exactly where
 *    it is, the same object: nothing in it moves, it lifts off the page (the
 *    layer's shadow) and the code's chip joins its end, since the cover's
 *    code has just gone under the bar.
 *  - IN A HAND it is the phone's own tab bar, at the screen's foot where her
 *    thumb is, from the first screen to the album's last row, the code its
 *    last door: it never moves and never changes form. On paper it floats
 *    over the page itself (the week before's checklist), so there it wears
 *    the app bar's own frosted page (`glass.css`).
 *  - EVERY COUNT RIDES ITS GLYPH AS A BADGE cut into the glyph's shoulder:
 *    today's waiting light where something waits on her, a disc in the
 *    door's own ink where it is only hers to act on (Settings' "2 left", the
 *    call G4), and that disc holding the pause while uploads are paused.
 */

/** Where the capsule stops: 8px under the app's 56px bar (the live frame's `stickAt`). */
const DOCK_TOP = 64;

type Size = "desk" | "hand";

/**
 * A BADGE ON ITS GLYPH'S SHOULDER, per size: the glyph's box, the badge's
 * height, and where the badge's corner sits on the glyph (x in from its left
 * edge, y above its top). Its centre lands just past the glyph's corner, so
 * the notch takes a fifth of the glyph at most: a gear stays a gear.
 */
const SHOULDER: Record<
  Size,
  { glyph: number; h: number; x: number; y: number }
> = {
  desk: { glyph: 16, h: 16, x: 10.5, y: -8 },
  hand: { glyph: 20, h: 16, x: 13.5, y: -7.5 },
};

/**
 * ★ EVERY DESK GLYPH KEEPS A BADGE'S ROOM, BADGE OR NOT: a door that grew by
 * its badge moved every door after it the moment Review cleared, under the
 * hand that knew where Settings was. So the room a one-digit badge overhangs
 * stands after every glyph (a wider count takes its own), and the doors keep
 * their places through every moment of the night.
 */
const ROOM = SHOULDER.desk.x + SHOULDER.desk.h - SHOULDER.desk.glyph;

/** The clear ring the glyph keeps round its badge. */
const GAP = 1.5;

/** A badge's width: a circle for one digit, a pill as the count grows. */
const badgeWidth = (text: string, h: number) =>
  Math.max(h, Math.round(text.length * 6 + 8));

/**
 * THE GLYPH'S NOTCH: the badge's own stadium, a clear ring wider, cut out of
 * the glyph and its halo, so the badge stands on the glyph's shoulder rather
 * than over its strokes (the way a phone draws a badge on an app's icon), and
 * the amber stays a point. ★ ON THE GLASS NO RING OF COLOUR CAN CUT IT: the
 * pane is a different colour over every photograph, so the cut is geometry.
 * The outer square runs past the glyph by its halo's reach.
 */
function notch(box: number, x: number, y: number, w: number, h: number) {
  const x0 = x - GAP;
  const y0 = y - GAP;
  const x1 = x + w + GAP;
  const y1 = y + h + GAP;
  const r = (y1 - y0) / 2;
  const o = 4;
  return `path(evenodd, "M${-o} ${-o}H${box + o}V${box + o}H${-o}Z M${x0 + r} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1 - r} ${y1}H${x0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}Z")`;
}

/** What rides a door's glyph: the waiting light, an unlit count, the pause, or nothing. */
type Badge =
  | { kind: "lit"; text: string }
  | { kind: "unlit"; text: string }
  | { kind: "paused" }
  | null;

function badgeOf(face: DoorFace): Badge {
  if (face.amber && face.count)
    return { kind: "lit", text: formatCount(face.count) };
  if (face.left) return { kind: "unlit", text: formatCount(face.left) };
  if (face.paused) return { kind: "paused" };
  return null;
}

/** A door's glyph, and the badge on its shoulder where it has one. */
function Glyph({
  room,
  face,
  size,
}: {
  room: RoomId;
  face: DoorFace;
  size: Size;
}) {
  const Icon = ROOM_ICON[room];
  const s = SHOULDER[size];
  const badge = badgeOf(face);
  const box = { width: s.glyph, height: s.glyph };
  const desk = size === "desk";
  if (!badge)
    return (
      <Icon
        aria-hidden
        className="block shrink-0 glass-mark-lit"
        style={{ ...box, marginInlineEnd: desk ? ROOM : 0 }}
      />
    );
  const w = badge.kind === "paused" ? s.h : badgeWidth(badge.text, s.h);
  return (
    <span
      className="relative block shrink-0"
      // At a desk the word follows the glyph: the badge's overhang is the glyph's own room, so the word never meets it.
      style={{
        ...box,
        marginInlineEnd: desk ? Math.max(ROOM, s.x + w - s.glyph) : 0,
      }}
    >
      <span
        className="block size-full glass-mark-lit"
        style={{ clipPath: notch(s.glyph, s.x, s.y, w, s.h) }}
      >
        <Icon aria-hidden className="block size-full" />
      </span>
      <span
        aria-hidden
        data-badge={badge.kind}
        className="eh-glass-badge absolute flex items-center justify-center rounded-full text-[10px] leading-none font-semibold tabular-nums"
        style={{ left: s.x, top: s.y, width: w, height: s.h }}
      >
        {badge.kind === "paused" ? (
          <Pause className="size-2.5" fill="currentColor" strokeWidth={0} />
        ) : (
          badge.text
        )}
      </span>
    </span>
  );
}

/** One door of the capsule: its glyph (and badge), its word, its whole line in its name. */
function Segment({
  room,
  face,
  size,
  selected,
  onOpen,
}: {
  room: RoomId;
  face: DoorFace;
  size: Size;
  selected: boolean;
  onOpen?: DoorPress;
}) {
  const desk = size === "desk";
  return (
    <button
      type="button"
      data-eh-door={room}
      aria-pressed={selected || undefined}
      aria-label={doorName(room, face)}
      title={doorName(room, face)}
      onClick={() => onOpen?.(room)}
      className={cn(
        "eh-glass-seg flex items-center justify-center rounded-full font-medium outline-none",
        desk
          ? "h-9 shrink-0 gap-2 px-3.5 text-sm"
          : "h-full min-w-0 flex-1 flex-col gap-1 text-[11px] leading-none",
      )}
    >
      <Glyph room={room} face={face} size={size} />
      <span className="max-w-full truncate glass-mark-lit">
        {desk ? ROOM_LABEL[room] : ROOM_SHORT[room]}
      </span>
    </button>
  );
}

/**
 * THE CODE'S CHIP AT THE CAPSULE'S END: it joins once the cover's code has
 * gone under the bar, so at rest nothing is drawn twice (production's rule
 * for the band's chip). Folded away it is inert: out of the tab order and the
 * reader's tree, never a hidden control.
 */
function ChipSlot({ name, on }: { name: string; on: boolean }) {
  return (
    <span
      data-on={on || undefined}
      inert={!on}
      className="eh-glass-chip flex shrink-0 justify-end"
    >
      <span className="eh-glass-chip-in flex">
        <CodeEnd name={name} />
      </span>
    </span>
  );
}

/** Where a capsule stands: on the cover, docked under the bar, or at a phone's foot. */
type At = "cover" | "dock" | "foot";

/** The capsule itself, wherever it stands: one group of five doors, and the code's chip once the cover's has gone. */
function Capsule({
  c,
  name,
  screen,
  ground,
  selected,
  onOpen,
  at,
  chip,
  capsuleRef,
}: DoorDraw & {
  at: At;
  /** Whether the code's chip is on (absent: the capsule has no slot for it). */
  chip?: boolean;
  capsuleRef?: RefObject<HTMLDivElement | null>;
}) {
  const faces = facesOf(c);
  const size: Size = screen === "375" ? "hand" : "desk";
  return (
    <div
      ref={capsuleRef}
      data-eh-doors="glass"
      data-at={at}
      data-ground={ground}
      role="group"
      aria-label="This event"
      className={cn(
        "eh-glass-capsule flex items-center rounded-full glass p-1 text-white",
        size === "desk" ? "h-11 w-fit gap-0.5" : "h-14 w-full",
      )}
    >
      {ROOM_ORDER.map((room) => (
        <Segment
          key={room}
          room={room}
          face={faces[room]}
          size={size}
          selected={selected === room}
          onOpen={onOpen}
        />
      ))}
      {chip === undefined ? null : <ChipSlot name={name} on={chip} />}
    </div>
  );
}

/**
 * AT A DESK, STUCK: the capsule held under the bar at the very place it
 * reached it (the cover's own x, `stickAt`'s y), its doors exactly as they
 * stood on the cover, lifted over the album, the code's chip joining its end.
 * It takes no room in the page (fixed), so the album never moves.
 *
 * ★ ONE CAPSULE ON SCREEN: while the dock stands, the cover's capsule keeps
 * its footprint but is hidden (`data-eh-glass-docked` on the frame's root,
 * set before paint), so the two never show at once, and the dock's glass
 * never blurs a copy of its own words from the cover passing under it.
 */
function Dock(d: DoorDraw) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const root = ref.current?.ownerDocument.documentElement;
    if (!root) return;
    root.setAttribute("data-eh-glass-docked", "");
    return () => root.removeAttribute("data-eh-glass-docked");
  }, []);
  return (
    <div
      ref={ref}
      data-eh-band=""
      data-eh-dock=""
      data-stuck=""
      className="pointer-events-none fixed left-5 z-30"
      style={{ top: DOCK_TOP }}
    >
      <div className="pointer-events-auto">
        <Capsule {...d} at="dock" chip />
      </div>
    </div>
  );
}

/**
 * IN A HAND: THE PHONE'S OWN TAB BAR, at the screen's foot, on the first
 * screen and however far she scrolls. Her thumb is there all night (a drink
 * in the other hand), the doors keep their words at every scroll, and nothing
 * in it ever moves.
 *
 * ★ THE CODE IS ITS LAST DOOR FROM THE FIRST SCREEN, never a chip arriving:
 * one joining as the cover left pushed all five doors over by its width (As a
 * guest by 36pt) under the thumb that knew them. On a phone the cover's own
 * code stands at the top corner, out of her thumb's reach, so the bar's chip
 * is the code she can reach, and it stands at rest too. Fixed, so the bar
 * takes no room in the page.
 */
function Foot({ stuck, ...d }: DoorDraw & { stuck: boolean }) {
  return (
    // ★ NOT `data-eh-dock`: that mark reads "docked under the bar" on the frame's caption. `data-eh-foot` names where it is.
    <div
      data-eh-band=""
      data-eh-foot=""
      data-stuck={stuck ? "" : undefined}
      className="eh-glass-foot pointer-events-none fixed inset-x-3 z-30"
    >
      <div className="pointer-events-auto">
        <Capsule {...d} at="foot" chip />
      </div>
    </div>
  );
}

export const GLASS: DoorOption = {
  CoverFoot: ({ fact, mark, ...d }) =>
    d.screen === "375" ? (
      // In a hand the doors stand at the screen's foot (`Page`), so the cover's foot is the strip alone; the live frame watches it, and the bar marks itself stuck once the cover has gone.
      <div ref={mark}>{fact}</div>
    ) : (
      // At a desk the capsule stands between the name and the strip, and the live frame watches it: it docks as it reaches the bar.
      <>
        <Capsule {...d} at="cover" capsuleRef={mark} />
        {fact}
      </>
    ),
  Page: ({ stuck, ...d }) =>
    d.screen === "375" ? (
      <Foot {...d} stuck={stuck} />
    ) : stuck ? (
      <Dock {...d} />
    ) : null,
  seam: { "375": { rise: 0, fade: 0 }, "1440": { rise: 0, fade: 0 } },
  stickAt: DOCK_TOP,
};
