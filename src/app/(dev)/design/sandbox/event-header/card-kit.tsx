"use client";

import "./card-kit.css";

import {
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useLayoutEffect,
  useRef,
} from "react";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import {
  BandLead,
  CodeEnd,
  type DoorDraw,
  type DoorFace,
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

/**
 * WHAT EVERY TAKE ON THE CARDS SHARES (round six): the row on the cover's
 * foot, its footprint and its band, the pieces a door is drawn from, and the
 * fold that carries the five cards into their pills under the bar and back.
 * Each take (`cards.tsx`) draws its own door from these pieces and dresses
 * them under its own look (`cards.css`), so the takes differ by their idea and
 * never by their plumbing.
 *
 * ★ THE ROW IS A CONTAINER (`eh-row`), AND EVERY SHAPE IS READ OFF ITS WIDTH,
 * never off the Screen knob, so a take holds at every width a host can hold,
 * not only at the three drawn: a phone's one row under 640px, tiles from 640 to
 * 1088 (five cards there are 110 to 200px, too narrow for "Highlight reel"
 * beside a glyph: the ROADMAP's tablet line), the desk's cards from 1088
 * (where each is 200px or more). `card-kit.css` holds those shapes.
 *
 * ★ THE BAND PUTS EVERYTHING BACK WHERE THE COVER HAD IT (a call carried in
 * every take): the cover's face at the band's left end, the code at its right
 * end where the cover's code stood, and the doors gathered in the middle, so
 * Review, the door pressed most tonight, folds straight up.
 */

export type Look = "shoulder" | "ring" | "numeral";

/** The fold is occasional (once a pass of the bar), so it is quick: under 300ms. */
const FOLD_MS = 260;

/** The drawer's curve (`--ease-drawer`), read where the token is unreadable. */
const DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";

/**
 * Reduced motion's fold: the new form develops in place and nothing travels
 * (production's own reduced fade, the reveal chips' 150ms linear).
 */
const DISSOLVE_MS = 150;

/** The count that waits on her, or 0: people at the door, uploads in Review. */
export const waitsOf = (face: DoorFace) =>
  face.amber && face.count ? face.count : 0;

/**
 * ★ A BADGE NEVER GROWS PAST "99+" (Will, round five: "Can max at 99+ so it
 * never overflows into card title"): the cap is the badge's own, one home,
 * never the count's format, so the accessible name and the room keep the
 * whole number ("Review: 140 waiting").
 */
export const capCount = (n: number) => (n > 99 ? "99+" : formatCount(n));

/**
 * The pointer's place on a door, for a light that follows it (each take's
 * sheet decides whether one does): two properties written, nothing rendered.
 */
export function follow(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const door = e.currentTarget;
  const r = door.getBoundingClientRect();
  door.style.setProperty("--eh-x", `${e.clientX - r.left}px`);
  door.style.setProperty("--eh-y", `${e.clientY - r.top}px`);
}

/* ── a door's pieces ─────────────────────────────────────────────────────── */

/** What a take's door is handed. */
export type DoorProps = {
  room: RoomId;
  /** Its place in the row (0 to 4): the fold's cascade reads it. */
  i: number;
  face: DoorFace;
  selected: boolean;
  onOpen?: DoorPress;
};

/**
 * THE DOOR ITSELF: a card at rest, a pill stuck, and the same element in both
 * (production's own rule: the row never remounts as it condenses), marked as
 * the hub's frames and Try it find a door (`data-eh-door`).
 */
export function DoorButton({
  room,
  i,
  face,
  selected,
  onOpen,
  className,
  children,
}: DoorProps & { className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      data-eh-door={room}
      data-i={i}
      aria-pressed={selected || undefined}
      aria-label={doorName(room, face)}
      onClick={() => onOpen?.(room)}
      onPointerMove={follow}
      className={cn("eh-ck-door", className)}
    >
      {children}
    </button>
  );
}

/**
 * The card's surface on its own layer, so the fold carries it from the card's
 * box to the pill's without touching the words on it.
 */
export function Skin({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      data-fold="skin"
      className={cn("eh-ck-skin", className)}
    />
  );
}

/**
 * The glyph in its disc; `children` stands on the disc's shoulder (a take's
 * badge). ★ EVERY GLYPH IS INK, THE REEL'S INCLUDED
 * (Afterglow: no hue is painted on a control; production's reel violet was
 * the hub's one painted colour), a call carried in every take.
 */
export function Glyph({
  room,
  children,
}: {
  room: RoomId;
  children?: ReactNode;
}) {
  const Icon = ROOM_ICON[room];
  return (
    <span aria-hidden className="eh-ck-glyph">
      <span data-fold="disc" className="eh-ck-disc" />
      <span data-fold="glyph" className="eh-ck-mark">
        <Icon />
      </span>
      {children}
    </span>
  );
}

/**
 * The card's title over its line. The title is drawn twice, whole and short,
 * and the row's width picks one (a tile under 130px, and a phone, say "Reel").
 */
export function Words({
  room,
  line,
  strong,
}: {
  room: RoomId;
  line: string;
  /** The line reads in the ink: a count hers to act on, paused uploads. */
  strong?: boolean;
}) {
  return (
    <span aria-hidden className="eh-ck-text">
      <span data-fold="title" className="eh-ck-title font-heading">
        <span className="eh-ck-long">{ROOM_LABEL[room]}</span>
        <span className="eh-ck-short">{ROOM_SHORT[room]}</span>
      </span>
      <span
        data-fold="text"
        data-strong={strong ? "" : undefined}
        className="eh-ck-line"
      >
        {line}
      </span>
    </span>
  );
}

/** The pill's word, a control's label (Inter), never the card's title restyled (the ladder's two roles). */
export function PillWord({ room }: { room: RoomId }) {
  return (
    <span aria-hidden data-fold="word" className="eh-ck-word">
      {ROOM_SHORT[room]}
    </span>
  );
}

/* ── the fold ────────────────────────────────────────────────────────────── */

/** Where a piece stands, how round its corner is and how lit, as the eye sees it now (a running fold included). */
function stance(el: HTMLElement, win: Window) {
  const style = win.getComputedStyle(el);
  return {
    box: el.getBoundingClientRect(),
    radius: parseFloat(style.borderTopLeftRadius) || 0,
    opacity: parseFloat(style.opacity),
  };
}

/** How each take's fold is paced. */
export type FoldPace = {
  /** Between one door and the next, from the row's middle out (Review first): 0 moves all five as one. */
  cascade?: number;
};

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
 * opacity or an absolutely placed box (a skin). The band's
 * own height never animates, so the footprint can never follow a fold half
 * done (the loop `event-cards-row.tsx` describes).
 *
 * ★ INTERRUPTIBLE: a fold reversed mid-flight starts from where each piece
 * visibly is, since a rect reads its running animation, never from where it
 * was headed. A still frame drawn stuck flips at once.
 *
 * ★ REDUCED MOTION DISSOLVES, NEVER SNAPS (a call carried in every take): the
 * new form develops in place over 150ms and nothing travels. Web animations
 * are outside the global guard's clamp, which is why this one is written here
 * and kept to an opacity.
 */
export function useFold(
  band: RefObject<HTMLDivElement | null>,
  stuck: boolean,
  pace: FoldPace = {},
) {
  const flights = useRef<Animation[]>([]);
  const ready = useRef(false);
  const cascade = pace.cascade ?? 0;
  useLayoutEffect(() => {
    const el = band.current;
    if (!el) return;
    const win = el.ownerDocument.defaultView ?? window;
    const first = !ready.current;
    ready.current = true;
    if (el.hasAttribute("data-stuck") === stuck) return;
    if (first || typeof el.animate !== "function") {
      el.toggleAttribute("data-stuck", stuck);
      return;
    }
    for (const f of flights.current) f.cancel();
    flights.current = [];
    if (!win.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      el.toggleAttribute("data-stuck", stuck);
      // The doors develop; the band's ground is there at once, as in the moving fold.
      const bar = el.querySelector<HTMLElement>(":scope > .eh-ck-bar");
      if (bar)
        flights.current.push(
          bar.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: DISSOLVE_MS,
            easing: "linear",
          }),
        );
      return;
    }
    const parts = [...el.querySelectorAll<HTMLElement>("[data-fold]")];
    const from = parts.map((p) => stance(p, win));
    const was = new Map(parts.map((p, i) => [p, from[i]] as const));
    el.toggleAttribute("data-stuck", stuck);
    const to = parts.map((p) => stance(p, win));
    const ease =
      win.getComputedStyle(el).getPropertyValue("--ease-drawer").trim() ||
      DRAWER;
    /** A door's piece waits its turn: Review first, then its neighbours, the row's ends last. */
    const turn = (p: HTMLElement) => {
      const i = Number(p.closest("[data-i]")?.getAttribute("data-i"));
      return Number.isFinite(i) ? Math.abs(i - 2) * cascade : 0;
    };
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
      const delay = turn(p);
      // ★ The band's ground is there from the fold's first frame (fresh eyes: a
      // ground that faded in let the album's own words print through the gaps
      // and under the face as it arrived); everything else moves over it.
      if (kind === "veil") return;
      if (kind === "lead" || kind === "code") {
        // The cover's face slides in at the band's head; the code arrives once the doors
        // nearest it have passed the place it stands.
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
              : { duration: 160, delay: 120 },
          );
        return;
      }
      if (kind === "title" || kind === "word") {
        // The card's title becomes the pill's word and back, flying with its glyph from
        // wherever its other form stood, so no word lands while a glyph is still crossing it.
        const other = p
          .closest("[data-eh-door]")
          ?.querySelector<HTMLElement>(
            `[data-fold="${kind === "title" ? "word" : "title"}"]`,
          );
        const o = other ? was.get(other) : undefined;
        if (arrives && o && o.box.width > 0) {
          fly(
            p,
            [
              {
                transformOrigin: "0 0",
                transform: `translate(${o.box.left - b.box.left}px, ${o.box.top - b.box.top}px) scale(${o.box.height / b.box.height})`,
              },
              { transformOrigin: "0 0", transform: "none" },
            ],
            { delay },
          );
          return;
        }
      }
      if (
        kind === "title" ||
        kind === "word" ||
        kind === "text" ||
        kind === "fade" ||
        arrives
      ) {
        // Words with no other form to fly from (a card's line, a hand's titles) develop
        // in the fold's last stretch, once the glyphs beside them have all but landed.
        if (arrives)
          fly(p, [{ opacity: 0 }, { opacity: 1 }], {
            duration: 130,
            delay: 140 + delay,
            easing: "ease-out",
          });
        return;
      }
      const dx = a.box.left - b.box.left;
      const dy = a.box.top - b.box.top;
      if (kind === "skin") {
        // The surface's own box travels, so its corner and its shadow never stretch;
        // a surface that is lit in one form and clear in the other fades on the way.
        const fade =
          a.opacity !== b.opacity
            ? [{ opacity: a.opacity }, { opacity: b.opacity }]
            : [{}, {}];
        fly(
          p,
          [
            {
              left: `${dx}px`,
              top: `${dy}px`,
              width: `${a.box.width}px`,
              height: `${a.box.height}px`,
              borderRadius: `${Math.min(a.radius, a.box.height / 2)}px`,
              ...fade[0],
            },
            {
              left: "0px",
              top: "0px",
              width: `${b.box.width}px`,
              height: `${b.box.height}px`,
              borderRadius: `${Math.min(b.radius, b.box.height / 2)}px`,
              ...fade[1],
            },
          ],
          { delay },
        );
        return;
      }
      // A glyph, its disc, a point, a badge or a numeral: carried and scaled whole, never stretched.
      const s =
        kind === "num"
          ? a.box.height / b.box.height
          : a.box.width / b.box.width;
      const lit = a.opacity !== b.opacity;
      fly(
        p,
        [
          {
            transformOrigin: "0 0",
            transform: `translate(${dx}px, ${dy}px) scale(${s})`,
            ...(lit ? { opacity: a.opacity } : {}),
          },
          {
            transformOrigin: "0 0",
            transform: "none",
            ...(lit ? { opacity: b.opacity } : {}),
          },
        ],
        { delay },
      );
    });
  }, [band, stuck, cascade]);
}

/* ── the row ─────────────────────────────────────────────────────────────── */

/**
 * THE ROW ON THE COVER'S FOOT, sticky, folding into its band once it reaches
 * the bar: production's footprint and band (`event-cards-row.tsx`), the
 * cover's face leading it stuck and the code's chip closing it.
 *
 * ★ THE ROW RISES INTO THE COVER by its whole height and the photograph left
 * under it (`seam.tsx`'s `seamOf`: an inline margin, since the hub's
 * `space-y-6` is a production utility the lab's cannot outrank), and the band
 * takes no top padding at rest, so the cards' tops are exactly the rise; the
 * footprint holds the resting row's height (`useRestHeight`), so folding
 * never moves the album.
 */
export function CardRow({
  look,
  c,
  name,
  screen,
  selected,
  onOpen,
  stuck,
  mark,
  rise,
  Door,
  pace,
}: DoorDraw & {
  look: Look;
  stuck: boolean;
  mark?: RefObject<HTMLDivElement | null>;
  /** How far the cards stand up into the cover. */
  rise: number;
  Door: (p: DoorProps) => ReactNode;
  pace?: FoldPace;
}) {
  const bandRef = useRef<HTMLDivElement | null>(null);
  useFold(bandRef, stuck, pace);
  const rest = useRestHeight(bandRef, stuck);
  const faces = facesOf(c);
  return (
    <div
      ref={mark}
      data-eh-row="cards"
      className="eh-ck-row pointer-events-none sticky top-14 z-30 -mx-3 sm:-mx-5"
      style={
        {
          minHeight: rest || undefined,
          marginTop: -(24 + rise),
        } as CSSProperties
      }
    >
      <div
        ref={bandRef}
        data-eh-band=""
        data-look={look}
        data-screen={screen}
        className="eh-ck-band pointer-events-auto"
      >
        <span aria-hidden data-fold="veil" className="eh-ck-veil" />
        <div className="eh-ck-bar">
          <span data-fold="lead" className="eh-ck-lead">
            <BandLead c={c} name={name} phone={false} />
          </span>
          <div
            data-eh-doors="cards"
            role="group"
            aria-label="This event"
            className="eh-ck-doors"
          >
            {ROOM_ORDER.map((room, i) => (
              <Door
                key={room}
                room={room}
                i={i}
                face={faces[room]}
                selected={selected === room}
                onOpen={onOpen}
              />
            ))}
          </div>
          <span data-fold="code" className="eh-ck-code">
            <CodeEnd name={name} />
          </span>
        </div>
      </div>
    </div>
  );
}
