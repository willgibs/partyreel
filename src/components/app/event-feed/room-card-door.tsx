"use client";

import "./room-card.css";

import { type PointerEvent, useEffect, useRef, useState } from "react";
import {
  Clapperboard,
  ListChecks,
  Pause,
  Settings,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";

import { formatCompactNumber, formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import {
  countWord,
  type DoorRoomId,
  ROOM_LABEL,
  ROOM_SHORT,
  type RoomFace,
} from "./room-card";

/**
 * ONE DOOR, A CARD AT REST AND A PILL UNDER THE BAR, AND THE SAME ELEMENT IN BOTH (event-header r4's cards over the seam,
 * Will's pick: "a bit more pronounced than the glass capsule, without shouting"). Every piece of both forms is drawn once
 * here, the row's `data-stuck` decides which shows (`room-card.css`), and `data-fold` names what the fold carries from one
 * form to the other (`event-cards-row-fold.ts`). The element itself is the row's to choose: a link into a room, the reel's
 * link or its guidance's button; they all wear `doorAttrs` and draw `DoorParts`.
 *
 * ★ A NAME, THEN PIECES THAT SAY NOTHING TWICE. The door's accessible name is its room and its line ("Review: 8
 * waiting"), so every piece inside is `aria-hidden`: a screen reader hears the door once, in either form.
 *
 * ★ A WAITING COUNT IS A NUMERAL, AMBER ONLY AS ITS POINT. Where something waits on her the count stands big in the heading
 * face at the card's end with today's waiting light beside it, and the line keeps the word it counts; no card is ever washed
 * amber. Settings' steps left stay plain words in the ink and, for a pill too small for its words, an unlit mark; paused
 * uploads read Paused and, in a pill, the plain pause.
 */

/** Production's glyphs for the five doors. */
const ROOM_ICON: Record<DoorRoomId, LucideIcon> = {
  reel: Clapperboard,
  guests: Users,
  review: ListChecks,
  settings: Settings,
  "as-guest": Smartphone,
};

/** The door's class: the sheet's one hook, on whatever element the row makes the door. */
export const DOOR = "hub-door";

/**
 * A COUNT AS THE DOOR DRAWS IT: whole to 999, then "1.2K". A numeral is the loudest thing on a card and a pill has one slot
 * for it, so a count that grew a comma ("1,234") widened a phone's half-width card past its own name and a pill past the
 * screen; the exact number is in the door's name ("Review: 1,234 waiting") and in the room it opens.
 */
const numeral = (n: number) =>
  n >= 1000 ? formatCompactNumber(n) : formatCount(n);

/** A door's whole accessible name: its room, then its line ("Review: 8 waiting"). */
export const doorName = (room: DoorRoomId, value: string) =>
  `${ROOM_LABEL[room]}: ${value}`;

/**
 * The pointer's place on a card, for the light that follows it in the room (`room-card.css`): two properties written,
 * nothing rendered, so a hover costs the page nothing. A finger and a pen leave it alone.
 */
function follow(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const door = e.currentTarget;
  const r = door.getBoundingClientRect();
  door.style.setProperty("--hub-door-x", `${e.clientX - r.left}px`);
  door.style.setProperty("--hub-door-y", `${e.clientY - r.top}px`);
}

/** What every door element wears, whatever it is: the sheet's hook, its name and the light that follows the pointer. */
export function doorAttrs(room: DoorRoomId, value: string) {
  return {
    "data-hub-door": room,
    "aria-label": doorName(room, value),
    onPointerMove: follow,
    className: DOOR,
  } as const;
}

/**
 * THE WAITING COUNT TICKS DOWN ON RETURN. A host clears nine photographs in the Review room and comes back; the numeral
 * sliding 12 to 3 over 200ms says what she just did, where a number that is simply different says nothing at all. First
 * paint never animates (there is no previous value to travel from), and reduced motion shortens the travel to one frame.
 */
function TickingCount({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (from === value) return;
    // ★ REDUCED MOTION SHORTENS THE TRAVEL, IT DOES NOT SKIP THE FRAME. Setting the value straight from the effect body
    // would be a synchronous setState in an effect (the cascading-render lint, and it is right): a zero-length run through
    // the same rAF lands on the same number one frame later, from a callback, which is where a setState belongs.
    const ms =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 200;
    const startedAt = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = ms === 0 ? 1 : Math.min(1, (now - startedAt) / ms);
      setShown(Math.round(from + (value - from) * t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{numeral(shown)}</>;
}

/**
 * THE DOOR'S PIECES, in both forms. `title` has a short word where the full one is too long for a narrow card (the reel's
 * "Highlight reel"), both in the page and one shown by width (`room-card.css`), so the server's paint is right at every
 * width. The pill's `word` is a control's label (Inter), never the card's title restyled: the ladder's two roles.
 */
export function DoorParts({
  room,
  face,
}: {
  room: DoorRoomId;
  face: RoomFace;
}) {
  const Icon = ROOM_ICON[room];
  const waits = face.amber && face.count ? face.count : 0;
  const full = ROOM_LABEL[room];
  const short = ROOM_SHORT[room];
  return (
    <>
      {/* The card's surface on its own layer, so the fold can carry it from the card's box to the pill's without
          touching the words on it. */}
      <span aria-hidden data-fold="skin" className="hub-door-skin" />
      <span
        aria-hidden
        className={cn("hub-door-glyph", room === "reel" && "hub-door-reel")}
      >
        <span data-fold="disc" className="hub-door-disc" />
        <span data-fold="glyph" className="hub-door-mark">
          <Icon />
        </span>
      </span>
      <span aria-hidden className="hub-door-text">
        <span
          data-fold="title"
          className="truncate font-heading text-card-title"
        >
          {short === full ? (
            full
          ) : (
            <>
              <span className="hub-door-full">{full}</span>
              <span className="hub-door-short">{short}</span>
            </>
          )}
        </span>
        <span
          data-fold="text"
          className={cn(
            "truncate text-xs",
            face.strong || face.paused
              ? "font-medium text-foreground"
              : "text-muted-foreground",
          )}
        >
          {waits ? countWord(face.value, waits) : face.value}
        </span>
      </span>
      <span
        aria-hidden
        data-fold="word"
        className="hub-door-word text-xs font-medium"
      >
        {short}
      </span>
      {waits ? (
        <span aria-hidden className="hub-door-count">
          <span data-fold="light" className="hub-door-light" />
          <span data-fold="num" className="hub-door-num font-heading">
            <TickingCount value={waits} />
          </span>
        </span>
      ) : face.left ? (
        // Settings' steps left, for a pill too small for its words: an unlit ring, never amber.
        <span aria-hidden className="hub-door-count hub-door-left">
          <span data-fold="light" className="hub-door-unlit" />
          <span data-fold="num" className="hub-door-num font-heading">
            {numeral(face.left)}
          </span>
        </span>
      ) : face.paused ? (
        // Paused uploads on a pill too small for "Paused": the plain pause, the code's own corner glyph.
        <span
          aria-hidden
          className="hub-door-count hub-door-left hub-door-pause"
        >
          <Pause data-fold="light" fill="currentColor" strokeWidth={0} />
        </span>
      ) : null}
    </>
  );
}
