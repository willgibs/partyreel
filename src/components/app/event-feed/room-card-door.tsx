"use client";

import "./room-card.css";

import { useEffect, useRef, useState } from "react";
import {
  Clapperboard,
  ListChecks,
  Pause,
  Settings,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  badgeCount,
  countWord,
  type DoorRoomId,
  ROOM_LABEL,
  ROOM_SHORT,
  type RoomFace,
} from "./room-card";

/**
 * ONE DOOR, A CARD AT REST AND A PILL UNDER THE BAR, AND THE SAME ELEMENT IN BOTH (event-header r4's cards, Will's pick:
 * "a bit more pronounced than the glass capsule, without shouting"; drawn as r6 left them). Every piece of both forms is
 * drawn once here, the row's `data-stuck` decides which shows (`room-card.css`), and `data-fold` names what the fold
 * carries from one form to the other (`event-cards-row-fold.ts`). The element itself is the row's to choose: a link into a
 * room, the reel's link or its guidance's button; they all wear `doorAttrs` and draw `DoorParts`.
 *
 * ★ A NAME, THEN PIECES THAT SAY NOTHING TWICE. The door's accessible name is its room and its line ("Review: 8
 * waiting"), so every piece inside is `aria-hidden`: a screen reader hears the door once, in either form.
 *
 * ★ THE COUNT RIDES THE GLYPH'S SHOULDER, AND ONLY WHERE IT NEEDS HER (event-header r6, Will's `card=shoulder`: "add the
 * count as a badge on the card icons ... so each card's content can be absorbed in one glance"). Review's waiting uploads
 * and the people at her door wear a badge in the needs-you status (`--needs-you`, his `attention=tally`), and the line
 * keeps the word it counts; every other glyph is bare and its line says it. Settings' steps left and paused uploads are
 * hers to act on, never a status: a quiet badge where a door has no line to say them in (a hand's tile, a pill), and
 * plain words in the ink where it has. Every glyph is the ink, the reel's too: Afterglow paints no hue on a control.
 */

/** Production's glyphs for the five doors. */
const ROOM_ICON: Record<DoorRoomId, LucideIcon> = {
  reel: Clapperboard,
  guests: Users,
  review: ListChecks,
  settings: Settings,
  "as-guest": Smartphone,
};

/**
 * The door's classes: the sheet's one hook, and the house's press (identity r4's `press=shrink`, its give per form set
 * by the sheet's `--press-scale`), which leaves a trigger whose layer opens on the press alone (the reel's guidance).
 */
export const DOOR = "hub-door press-shrink";

/** A door's whole accessible name: its room, then its line ("Review: 8 waiting"). */
export const doorName = (room: DoorRoomId, value: string) =>
  `${ROOM_LABEL[room]}: ${value}`;

/** What every door element wears, whatever it is: the sheet's hook and its name. */
export function doorAttrs(room: DoorRoomId, value: string) {
  return {
    "data-hub-door": room,
    "aria-label": doorName(room, value),
    className: DOOR,
  } as const;
}

/**
 * THE WAITING COUNT TICKS DOWN ON RETURN. A host clears nine photographs in the Review room and comes back; the badge
 * sliding 12 to 3 over 200ms says what she just did, where a number that is simply different says nothing at all. First
 * paint never animates (there is no previous value to travel from), and reduced motion shortens the travel to one frame.
 * It says what the badge says at every step (`badgeCount`), so a count clearing from 140 reads 99+ until it is under 100.
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

  return <>{badgeCount(shown)}</>;
}

/**
 * THE BADGE ON THE GLYPH'S SHOULDER, or nothing: a count that waits on her in the status, else a count hers to act on
 * (steps left, paused uploads) as a quiet ring, marked `data-hers` so the sheet shows it only where the door has no line.
 */
function Badge({ face, waits }: { face: RoomFace; waits: number }) {
  if (waits)
    return (
      <span data-fold="badge" data-badge="needs" className="hub-door-badge">
        <TickingCount value={waits} />
      </span>
    );
  if (face.left)
    return (
      <span
        data-fold="badge"
        data-badge="quiet"
        data-hers=""
        className="hub-door-badge"
      >
        {badgeCount(face.left)}
      </span>
    );
  if (face.paused)
    return (
      <span
        data-fold="badge"
        data-badge="quiet"
        data-hers=""
        className="hub-door-badge"
      >
        {/* Paused uploads: the plain pause, the code's own corner glyph. */}
        <Pause fill="currentColor" strokeWidth={0} />
      </span>
    );
  return null;
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
  const waits = face.needs && face.count ? face.count : 0;
  const full = ROOM_LABEL[room];
  const short = ROOM_SHORT[room];
  return (
    <>
      {/* The card's surface on its own layer, so the fold can carry it from the card's box to the pill's without
          touching the words on it. */}
      <span aria-hidden data-fold="skin" className="hub-door-skin" />
      <span aria-hidden className="hub-door-glyph">
        <span data-fold="disc" className="hub-door-disc" />
        <span data-fold="glyph" className="hub-door-mark">
          <Icon />
        </span>
        <Badge face={face} waits={waits} />
      </span>
      <span aria-hidden className="hub-door-text">
        <span
          data-fold="title"
          className="hub-door-title truncate font-heading text-card-title"
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
            "hub-door-line truncate text-xs",
            // A line that names what waits on her, or what is hers to act on, reads in the ink.
            waits || face.strong || face.paused
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
    </>
  );
}
