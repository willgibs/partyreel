"use client";

import "./cards.css";

import {
  type PointerEvent,
  type RefObject,
  useLayoutEffect,
  useRef,
} from "react";

import { Pause } from "lucide-react";

import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import {
  BandLead,
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
  useRestHeight,
} from "./door-kit";
import type { ScreenId } from "./scene";

/**
 * CARDS OVER THE SEAM, ROUND FOUR: the cover's photograph dissolves into the
 * page at its foot and five cards stand across that seam on the lift, App
 * Store depth; as the row reaches the bar the same five fold into pills, one
 * continuous movement, and unfold the same way back.
 *
 * ★ EVERY DOOR AT REST, ON EVERY SCREEN. In a hand the cards are a two by two
 * grid with See it as a guest the full width under it, never a shelf: round
 * three's shelf showed two and a half cards, hid Settings and the guest's view
 * past the screen's edge and cut Review's count mid-word, which is the
 * regression production's own phone grid was built to end (`room-card.ts`).
 *
 * ★ A WAITING COUNT IS A NUMERAL, AMBER ONLY AS ITS POINT. Where something
 * waits on her the count stands big in the heading face at the card's end,
 * today's waiting light beside it, and the line keeps the word it counts; no
 * card is ever washed amber. Settings' steps left stay plain words in the ink
 * (the call G4), and paused uploads read Paused.
 */

/**
 * How far the cards rise into the cover, and how far its photograph dissolves
 * into the page under them: about half a card at a desk, so the seam runs
 * through the row; in a hand the grid's first row stands on the photograph and
 * the seam runs under it.
 */
const SEAM: Record<ScreenId, { rise: number; fade: number }> = {
  "375": { rise: 52, fade: 84 },
  "1440": { rise: 40, fade: 72 },
};

/** The fold is occasional (once a pass of the bar), so it is quick: under 300ms. */
const FOLD_MS = 260;

/** The drawer's curve (`--ease-drawer`), read where the token is unreadable. */
const DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";

/** A waiting count's line once its numeral stands on its own: the word it counts ("waiting"). */
const wordOf = (value: string) => value.replace(/^[\d.,]+\s*/, "");

/**
 * The pointer's place on a card, for the light that follows it in the room
 * (`cards.css`): two properties written, nothing rendered, so a hover costs
 * the page nothing.
 */
function follow(e: PointerEvent<HTMLButtonElement>) {
  if (e.pointerType !== "mouse") return;
  const door = e.currentTarget;
  const r = door.getBoundingClientRect();
  door.style.setProperty("--eh-cards-x", `${e.clientX - r.left}px`);
  door.style.setProperty("--eh-cards-y", `${e.clientY - r.top}px`);
}

/**
 * ONE DOOR, A CARD AT REST AND A PILL STUCK, and the same element in both
 * (production's own rule: the row never remounts as it condenses). Every piece
 * of both forms is drawn once; the band's `data-stuck` decides which shows,
 * and `data-fold` names what the fold carries from one form to the other.
 */
function Door({
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
  const waits = face.amber && face.count ? face.count : 0;
  return (
    <button
      type="button"
      data-eh-door={room}
      aria-pressed={selected || undefined}
      aria-label={doorName(room, face)}
      onClick={() => onOpen?.(room)}
      onPointerMove={follow}
      className="eh-cards-door"
    >
      {/* The card's surface on its own layer, so the fold can carry it from
          the card's box to the pill's without touching the words on it. */}
      <span aria-hidden data-fold="skin" className="eh-cards-skin" />
      <span
        aria-hidden
        className={cn("eh-cards-glyph", room === "reel" && "eh-cards-reel")}
      >
        <span data-fold="disc" className="eh-cards-disc" />
        <span data-fold="glyph" className="eh-cards-mark">
          <Icon />
        </span>
      </span>
      <span aria-hidden className="eh-cards-text">
        <span
          data-fold="title"
          className="truncate font-heading text-card-title"
        >
          {phone ? ROOM_SHORT[room] : ROOM_LABEL[room]}
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
          {waits ? wordOf(face.value) : face.value}
        </span>
      </span>
      {phone ? null : (
        // The pill's word, a control's label (Inter), never the card's title restyled (the ladder's two roles).
        <span
          aria-hidden
          data-fold="word"
          className="eh-cards-word text-xs font-medium"
        >
          {ROOM_SHORT[room]}
        </span>
      )}
      {waits ? (
        <span aria-hidden className="eh-cards-count">
          <span data-fold="light" className="eh-amber" />
          <span data-fold="num" className="eh-cards-num font-heading">
            {formatCount(waits)}
          </span>
        </span>
      ) : face.left ? (
        // Settings' steps left, for a pill too small for its words: an unlit ring, never amber.
        <span aria-hidden className="eh-cards-count eh-cards-left">
          <span data-fold="light" className="eh-unlit" />
          <span data-fold="num" className="eh-cards-num font-heading">
            {formatCount(face.left)}
          </span>
        </span>
      ) : face.paused ? (
        // Paused uploads on a pill too small for "Paused": the plain pause, the code's own corner glyph.
        <span
          aria-hidden
          className="eh-cards-count eh-cards-left eh-cards-pause"
        >
          <Pause data-fold="light" fill="currentColor" strokeWidth={0} />
        </span>
      ) : null}
    </button>
  );
}

/** Where a piece stands, how round its corner is and how lit, as the eye sees it now (a running fold included). */
function stance(el: HTMLElement, win: Window) {
  const style = win.getComputedStyle(el);
  return {
    box: el.getBoundingClientRect(),
    radius: parseFloat(style.borderTopLeftRadius) || 0,
    opacity: parseFloat(style.opacity),
  };
}

/**
 * ★ THE FOLD: the five cards become the five pills as the row reaches the bar,
 * and the pills the cards as it leaves, each piece travelling from where it
 * stood to where it stands (FLIP: first, last, invert, play). The band's
 * `data-stuck` is flipped HERE, by hand, between the two reads; React never
 * writes it, so the old form is still on screen when this effect reads it.
 *
 * ★ CALLED ABOVE `useRestHeight`, AND THAT ORDER IS THE FOOTPRINT RULE: layout
 * effects run in call order, so the band is already in its new form when the
 * footprint reads its rest, and everything that moves is a transform, an
 * opacity or the skin's absolutely placed box. The band's own height never
 * animates, so the footprint can never follow a fold half done (the loop
 * `event-cards-row.tsx` describes).
 *
 * ★ INTERRUPTIBLE: a fold reversed mid-flight starts from where each piece
 * visibly is, since a rect reads its running animation, never from where it
 * was headed. Reduced motion, and a still frame drawn stuck, flip at once.
 */
function useFold(band: RefObject<HTMLDivElement | null>, stuck: boolean) {
  const flights = useRef<Animation[]>([]);
  const ready = useRef(false);
  useLayoutEffect(() => {
    const el = band.current;
    if (!el) return;
    const win = el.ownerDocument.defaultView ?? window;
    const first = !ready.current;
    ready.current = true;
    if (el.hasAttribute("data-stuck") === stuck) return;
    const moves =
      !first &&
      typeof el.animate === "function" &&
      win.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    if (!moves) {
      el.toggleAttribute("data-stuck", stuck);
      return;
    }
    const parts = [...el.querySelectorAll<HTMLElement>("[data-fold]")];
    const from = parts.map((p) => stance(p, win));
    const was = new Map(parts.map((p, i) => [p, from[i]] as const));
    for (const f of flights.current) f.cancel();
    flights.current = [];
    el.toggleAttribute("data-stuck", stuck);
    const to = parts.map((p) => stance(p, win));
    const ease =
      win.getComputedStyle(el).getPropertyValue("--ease-drawer").trim() ||
      DRAWER;
    const fly = (
      p: HTMLElement,
      frames: Keyframe[],
      extra: KeyframeAnimationOptions = {},
    ) =>
      flights.current.push(
        p.animate(frames, {
          duration: FOLD_MS,
          easing: ease,
          fill: "backwards",
          ...extra,
        }),
      );
    parts.forEach((p, i) => {
      const a = from[i];
      const b = to[i];
      // Hidden in the new form: it simply goes, as an exit should (faster than an entrance).
      if (b.box.width === 0) return;
      const kind = p.dataset.fold;
      const arrives = a.box.width === 0;
      if (kind === "veil") {
        // The band's ground comes up under the pills rather than cutting the cover's foot off.
        if (arrives) fly(p, [{ opacity: 0 }, { opacity: 1 }]);
        return;
      }
      if (kind === "lead" || kind === "code") {
        // The cover's face slides in at the band's head; the code comes last, once the
        // longest flight (As a guest's, across the row) has passed the place it stands.
        if (arrives)
          fly(
            p,
            kind === "lead"
              ? [
                  { opacity: 0, transform: "translateX(-8px)" },
                  { opacity: 1, transform: "none" },
                ]
              : [
                  { opacity: 0, transform: "scale(0.9)" },
                  { opacity: 1, transform: "none" },
                ],
            kind === "lead"
              ? { duration: 200, delay: 60 }
              : { duration: 140, delay: 150 },
          );
        return;
      }
      if (kind === "title" || kind === "word") {
        // The card's title becomes the pill's word and back, flying with its glyph from
        // wherever its other form stood, so no word lands while a glyph is still crossing it.
        const other = p
          .closest(".eh-cards-door")
          ?.querySelector<HTMLElement>(
            `[data-fold="${kind === "title" ? "word" : "title"}"]`,
          );
        const o = other ? was.get(other) : undefined;
        if (arrives && o && o.box.width > 0) {
          fly(p, [
            {
              transformOrigin: "0 0",
              transform: `translate(${o.box.left - b.box.left}px, ${o.box.top - b.box.top}px) scale(${o.box.height / b.box.height})`,
            },
            { transformOrigin: "0 0", transform: "none" },
          ]);
          return;
        }
      }
      if (kind === "title" || kind === "word" || kind === "text" || arrives) {
        // Words with no other form to fly from (a card's line, a hand's titles) develop
        // in the fold's last stretch, once the glyphs beside them have all but landed.
        if (arrives)
          fly(p, [{ opacity: 0 }, { opacity: 1 }], {
            duration: 130,
            delay: 140,
            easing: "ease-out",
          });
        return;
      }
      const dx = a.box.left - b.box.left;
      const dy = a.box.top - b.box.top;
      if (kind === "skin") {
        // The surface's own box travels, so its corner and its shadow never stretch.
        fly(p, [
          {
            left: `${dx}px`,
            top: `${dy}px`,
            width: `${a.box.width}px`,
            height: `${a.box.height}px`,
            borderRadius: `${Math.min(a.radius, a.box.height / 2)}px`,
          },
          {
            left: "0px",
            top: "0px",
            width: `${b.box.width}px`,
            height: `${b.box.height}px`,
            borderRadius: `${Math.min(b.radius, b.box.height / 2)}px`,
          },
        ]);
        return;
      }
      // A glyph, its disc, a light or a numeral: carried and scaled whole, never stretched.
      const s =
        kind === "num"
          ? a.box.height / b.box.height
          : a.box.width / b.box.width;
      fly(p, [
        {
          transformOrigin: "0 0",
          transform: `translate(${dx}px, ${dy}px) scale(${s})`,
          ...(kind === "disc" ? { opacity: a.opacity } : {}),
        },
        {
          transformOrigin: "0 0",
          transform: "none",
          ...(kind === "disc" ? { opacity: b.opacity } : {}),
        },
      ]);
    });
  }, [band, stuck]);
}

/**
 * THE ROW OVER THE SEAM, sticky, folding into its band once it reaches the
 * bar: production's footprint and band (`event-cards-row.tsx`), the cover's
 * face leading it stuck and the code's chip closing it.
 *
 * ★ OVER THE SEAM, THE ROW RISES INTO THE COVER by its overlap (an inline
 * margin: the hub's `space-y-6` is a production utility the lab's cannot
 * outrank), and the band takes no top padding at rest, so the cards' tops are
 * exactly the rise; the footprint holds the resting row's height
 * (`useRestHeight`), so folding never moves the album.
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
  useFold(bandRef, stuck);
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
        data-screen={screen}
        className="eh-cards-band pointer-events-auto"
      >
        <span aria-hidden data-fold="veil" className="eh-cards-veil" />
        <div
          data-eh-doors="cards"
          role="group"
          aria-label="This event"
          className="eh-cards-doors"
        >
          <span data-fold="lead" className="eh-cards-lead">
            <BandLead c={c} name={name} phone={phone} />
          </span>
          {ROOM_ORDER.map((room) => (
            <Door
              key={room}
              room={room}
              face={faces[room]}
              phone={phone}
              selected={selected === room}
              onOpen={onOpen}
            />
          ))}
          <span data-fold="code" className="eh-cards-code">
            <CodeEnd name={name} />
          </span>
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
