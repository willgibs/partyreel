"use client";

import type { CSSProperties, ReactNode } from "react";

import type { SlideProps } from "../../deck/contract";
import { HEAD } from "../../deck/deck";
import { Photo, type PhotoId } from "../../deck/media";
import { Note, Scaled } from "../kit";
import { Wordmark } from "../marks";
import { SlideRoot } from "../root";
import { PhoneShell } from "../system";
import { inkOf, useTake } from "../take";
import { Label, useMeasure } from "./parts";

/**
 * 14 ON A HOME SCREEN: the icon at its true size (60 px, the system's own cut
 * for its size) among plain neighbours, on two real photographs, a night and
 * a day; then the icon at 60 px enlarged twice, the tinted appearance among tinted
 * neighbours, the icon at true size with the take's line, and the mark
 * printed, the take's paper answer for it.
 *
 * ★ THE NEIGHBOURS ARE NOBODY'S MARK: flat tiles and one plain shape each, in
 * the ordinary colours a home screen is full of, light and dark tiles mixed.
 * Among them the icon is the one dark disc, and its light the only light.
 */

type Tint = "default" | "tinted";

type GlyphId =
  | "grid"
  | "lines"
  | "sun"
  | "ring"
  | "pin"
  | "env"
  | "note"
  | "folder"
  | "bars"
  | "lens"
  | "plus"
  | "book"
  | "bubble"
  | "wave"
  | "dot"
  | "tri"
  | "house"
  | "person"
  | "check"
  | "keys";

/** A plain neighbour: a solid tile and one simple shape. */
type Neighbour = {
  readonly label: string;
  readonly bg: string;
  readonly fg: string;
  readonly glyph: GlyphId;
};

const N = {
  calendar: { label: "Calendar", bg: "#ffffff", fg: "#1c1c1e", glyph: "grid" },
  notes: { label: "Notes", bg: "#f6d35b", fg: "#ffffff", glyph: "lines" },
  weather: { label: "Weather", bg: "#3d86f2", fg: "#ffffff", glyph: "sun" },
  clock: { label: "Clock", bg: "#1c1c1e", fg: "#ffffff", glyph: "ring" },
  maps: { label: "Maps", bg: "#ebe7de", fg: "#4f8a54", glyph: "pin" },
  mail: { label: "Mail", bg: "#4a8ff7", fg: "#ffffff", glyph: "env" },
  music: { label: "Music", bg: "#f2546f", fg: "#ffffff", glyph: "note" },
  files: { label: "Files", bg: "#ffffff", fg: "#3b82f6", glyph: "folder" },
  wallet: { label: "Wallet", bg: "#121214", fg: "#f2b84b", glyph: "bars" },
  camera: { label: "Camera", bg: "#d9d9de", fg: "#2c2c2e", glyph: "lens" },
  health: { label: "Health", bg: "#ffffff", fg: "#f2546f", glyph: "plus" },
  books: { label: "Books", bg: "#f28c28", fg: "#ffffff", glyph: "book" },
  messages: { label: "Messages", bg: "#3ec267", fg: "#ffffff", glyph: "bubble" },
  translate: { label: "Translate", bg: "#22252b", fg: "#ffffff", glyph: "wave" },
  settings: { label: "Settings", bg: "#8e8e93", fg: "#ffffff", glyph: "dot" },
  podcasts: { label: "Podcasts", bg: "#9b5cf6", fg: "#ffffff", glyph: "tri" },
  phone: { label: "Phone", bg: "#3ec267", fg: "#ffffff", glyph: "dot" },
  browser: { label: "Browser", bg: "#ffffff", fg: "#3b82f6", glyph: "ring" },
  home: { label: "Home", bg: "#ffffff", fg: "#f28c28", glyph: "house" },
  contacts: { label: "Contacts", bg: "#cfcfd4", fg: "#6e6e73", glyph: "person" },
  reminders: { label: "Reminders", bg: "#ffffff", fg: "#1c1c1e", glyph: "check" },
  stocks: { label: "Stocks", bg: "#121214", fg: "#ffffff", glyph: "wave" },
  passwords: { label: "Passwords", bg: "#2c2c2e", fg: "#ffffff", glyph: "keys" },
} as const satisfies Record<string, Neighbour>;

/** One plain shape on a 32 box, in the tile's glyph colour. */
function Shape({ id, c }: { id: GlyphId; c: string }) {
  const s = {
    fill: "none",
    stroke: c,
    strokeWidth: 2.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  const f = { fill: c } as const;
  const shapes: Record<GlyphId, ReactNode> = {
    grid: (
      <>
        <rect x="8" y="9" width="16" height="15" rx="2.5" {...s} />
        <path d="M8 14h16" {...s} />
      </>
    ),
    lines: <path d="M9 11h14M9 16h14M9 21h9" {...s} />,
    sun: (
      <>
        <circle cx="15" cy="14.5" r="5" {...f} />
        <path d="M10 22h13" {...s} />
      </>
    ),
    ring: <circle cx="16" cy="16" r="7" {...s} />,
    pin: <path d="M16 25s-6-6.2-6-11a6 6 0 0 1 12 0c0 4.8-6 11-6 11z" {...f} />,
    env: (
      <>
        <rect x="8" y="10" width="16" height="12" rx="2" {...s} />
        <path d="M8.5 11l7.5 6 7.5-6" {...s} />
      </>
    ),
    note: (
      <path
        d="M13 22V10l9-2v12M13 22a2.5 2.5 0 1 1-2.5-2.5M22 20a2.5 2.5 0 1 1-2.5-2.5"
        {...s}
      />
    ),
    folder: (
      <path
        d="M8 12a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z"
        {...f}
      />
    ),
    bars: (
      <>
        <rect x="8" y="10" width="16" height="4" rx="1.5" {...f} />
        <rect x="8" y="16" width="16" height="4" rx="1.5" fill={c} opacity={0.6} />
      </>
    ),
    lens: (
      <>
        <rect x="7" y="11" width="18" height="12" rx="3" {...f} />
        <circle cx="16" cy="17" r="3.4" fill="#d9d9de" />
      </>
    ),
    plus: <path d="M16 9v14M9 16h14" {...s} strokeWidth={4} />,
    book: (
      <path
        d="M9 10h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H9zM23 10h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z"
        {...f}
      />
    ),
    bubble: (
      <path
        d="M16 9c-5 0-8.5 3-8.5 6.6 0 2 1.1 3.8 3 5L10 24l4-2.1c.6.1 1.3.2 2 .2 5 0 8.5-3 8.5-6.6S21 9 16 9z"
        {...f}
      />
    ),
    wave: <path d="M7 17c2.2-4 4.4-4 6.6 0s4.4 4 6.6 0 2.8-2 4.8-1" {...s} />,
    dot: <circle cx="16" cy="16" r="6" {...f} />,
    tri: <path d="M13 10.5v11l9-5.5z" {...f} />,
    house: <path d="M9 15l7-6 7 6v8H9z" {...f} />,
    person: (
      <>
        <circle cx="16" cy="13" r="4" {...f} />
        <path d="M9.5 24a6.5 6.5 0 0 1 13 0z" {...f} />
      </>
    ),
    check: (
      <>
        <circle cx="11" cy="12" r="2" {...f} />
        <circle cx="11" cy="20" r="2" {...f} />
        <path d="M16 12h7M16 20h7" {...s} />
      </>
    ),
    keys: (
      <>
        <circle cx="12" cy="16" r="4" {...s} />
        <path d="M16 16h8M21 16v3" {...s} />
      </>
    ),
  };
  return (
    <svg aria-hidden viewBox="0 0 32 32" width={34} height={34}>
      {shapes[id]}
    </svg>
  );
}

/** The icon's true size on a home screen, in points. */
const SIZE = 60;

/** The deck's running head on a phone slide: the night screen starts under it. */
const HEAD_375 = HEAD["375"];

/** A plain tile in the system's corner (a continuous corner reads as 22.4% of its side). */
function Tile({ n, tint }: { n: Neighbour; tint: Tint }) {
  const tinted = tint === "tinted";
  return (
    <span
      className="flex items-center justify-center"
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE * 0.2237,
        background: tinted
          ? "linear-gradient(180deg, #2b2b2e, #161618)"
          : `linear-gradient(180deg, color-mix(in oklab, ${n.bg} 90%, white), ${n.bg})`,
        boxShadow: "inset 0 0 0 0.5px rgb(0 0 0 / 0.08)",
      }}
    >
      <Shape id={n.glyph} c={tinted ? "#cfcfd4" : n.fg} />
    </span>
  );
}

/** A label under an icon, as the system draws it on any wallpaper. */
function IconLabel({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        marginTop: 6,
        fontSize: 11.5,
        fontWeight: 500,
        lineHeight: "14px",
        color: "#ffffff",
        letterSpacing: "0.005em",
        textShadow:
          "0 1px 2px rgb(0 0 0 / 0.55), 0 0 6px rgb(0 0 0 / 0.28), 0 0 1px rgb(0 0 0 / 0.4)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Slot({
  children,
  label,
  read,
}: {
  children: ReactNode;
  label?: string;
  read?: string;
}) {
  return (
    <span
      className="flex flex-col items-center"
      style={{ width: 76 }}
      data-bd-read={read}
    >
      {children}
      {label ? <IconLabel>{label}</IconLabel> : null}
    </span>
  );
}

/** The grid's columns (each slot 76 wide, its 60 px icon centred) and rows. */
const COL = [19, 106, 193, 280];
const ROW0 = 70;
const ROW = 100;

type Screen = {
  /** Its name in the deck's caption. */
  name: string;
  wallpaper: PhotoId;
  focus: string;
  /** A wallpaper's own crop, as a person sets one: scaled from `origin`. */
  zoom?: number;
  origin?: string;
  /** The twenty slots, row by row; null is the Partyreel icon's. */
  grid: readonly (Neighbour | null)[];
  dock: readonly Neighbour[];
};

/** A night: confetti over a blue-lit crowd. */
const NIGHT: Screen = {
  name: "night",
  wallpaper: "concert-confetti",
  focus: "60% 50%",
  grid: [
    N.calendar, N.clock, N.weather, N.notes,
    N.maps, N.mail, N.camera, N.files,
    N.wallet, N.health, null, N.books,
    N.translate, N.settings, N.podcasts, N.reminders,
    N.stocks, N.contacts, N.home, N.passwords,
  ],
  dock: [N.phone, N.browser, N.messages, N.music],
};

/**
 * A day: the wedding's arch, set the way a person crops one, into its flowers
 * and trees (white labels die on open sky, on any phone). The icon stands on
 * the white drape: the light ground, the case worth showing.
 */
const DAY: Screen = {
  name: "day",
  wallpaper: "wedding-arch",
  focus: "36% 50%",
  zoom: 1.6,
  origin: "30% 96%",
  grid: [
    N.weather, N.calendar, N.notes, N.clock,
    N.maps, N.translate, N.mail, N.camera,
    N.files, N.wallet, N.health, N.books,
    N.reminders, null, N.settings, N.podcasts,
    N.home, N.stocks, N.contacts, N.passwords,
  ],
  dock: [N.phone, N.browser, N.messages, N.music],
};

/** Where the Partyreel slot is in a screen's grid. */
function slotOf(s: Screen) {
  const i = s.grid.indexOf(null);
  return { row: Math.floor(i / 4), col: i % 4 };
}

/** The status bar on a home screen: white over any wallpaper. */
function HomeStatus() {
  return (
    <div
      className="absolute inset-x-0 top-0 flex items-center justify-between"
      style={{ height: 54, paddingInline: 34, color: "#fff" }}
    >
      <span style={{ fontSize: 15.5, fontWeight: 600, paddingTop: 2 }}>9:41</span>
      <svg aria-hidden width={44} height={12} viewBox="0 0 44 12" fill="#fff">
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={i * 5}
            y={8 - i * 2.4}
            width={3.2}
            height={3.6 + i * 2.4}
            rx={0.8}
          />
        ))}
        <rect
          x={23}
          y={1}
          width={18}
          height={10}
          rx={2.6}
          fill="none"
          stroke="#fff"
          strokeOpacity={0.5}
        />
        <rect x={24.6} y={2.6} width={14.8} height={6.8} rx={1.4} />
      </svg>
    </div>
  );
}

/**
 * A HOME SCREEN at its own size (375 by 812, icons 60 px): the wallpaper a
 * real photograph, five rows of plain neighbours with the icon among them,
 * the search pill and the dock.
 */
function HomeScreen({
  screen,
  tint = "default",
  bare = false,
  marked = true,
}: {
  screen: Screen;
  tint?: Tint;
  /** No status bar (the deck's own head stands there on a phone slide). */
  bare?: boolean;
  /** Mark the icon for the deck's caption (off for an enlarged copy). */
  marked?: boolean;
}) {
  const take = useTake();
  const { AppIcon } = take.light;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#000" }}>
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${screen.zoom ?? 1})`,
          transformOrigin: screen.origin ?? "50% 50%",
        }}
      >
        <Photo id={screen.wallpaper} focus={screen.focus} />
      </div>
      {bare ? null : <HomeStatus />}
      {screen.grid.map((n, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        return (
          <span
            key={`${r}-${c}`}
            className="absolute"
            style={{ left: COL[c], top: ROW0 + r * ROW }}
          >
            {n ? (
              <Slot label={n.label}>
                <Tile n={n} tint={tint} />
              </Slot>
            ) : (
              <Slot
                label="Partyreel"
                read={marked ? `the Partyreel slot, ${screen.name}` : undefined}
              >
                <AppIcon
                  size={SIZE}
                  appearance={tint === "tinted" ? "tinted" : "room"}
                  read={
                    marked ? `the icon on the ${screen.name} screen` : undefined
                  }
                />
              </Slot>
            )}
          </span>
        );
      })}
      {/* The search pill and the dock: frosted, plain. */}
      <span
        className="absolute flex items-center justify-center"
        style={{
          left: "50%",
          top: 668,
          transform: "translateX(-50%)",
          height: 28,
          paddingInline: 14,
          borderRadius: 99,
          background: "rgb(255 255 255 / 0.22)",
          backdropFilter: "blur(12px)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 500,
          gap: 5,
        }}
      >
        <svg
          aria-hidden
          width={11}
          height={11}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth={3}
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5L20 20" strokeLinecap="round" />
        </svg>
        Search
      </span>
      <div
        className="absolute flex items-center justify-around"
        style={{
          left: 12,
          right: 12,
          top: 712,
          height: 88,
          borderRadius: 34,
          background: "rgb(255 255 255 / 0.2)",
          backdropFilter: "blur(16px)",
          paddingInline: 8,
        }}
      >
        {screen.dock.map((n) => (
          <Slot key={n.label}>
            <Tile n={n} tint={tint} />
          </Slot>
        ))}
      </div>
    </div>
  );
}

/** A phone holding a home screen at `s` of its true size. */
function Phone({
  screen,
  s,
  style,
}: {
  screen: Screen;
  s: number;
  style?: CSSProperties;
}) {
  const inner = Math.round(375 * s);
  const width = Math.round(inner / 0.94);
  const bezel = Math.round(width * 0.03);
  const scale = (width - 2 * bezel) / 375;
  return (
    <PhoneShell
      width={width}
      height={Math.round(812 * scale) + 2 * bezel}
      screen="#000000"
      ink="#ffffff"
      on="room"
      style={style}
    >
      <Scaled w={375} view={812} scale={scale}>
        <HomeScreen screen={screen} />
      </Scaled>
    </PhoneShell>
  );
}

/** The Partyreel slot's centre on a screen (its icon and label), in its own points. */
function centreOf(s: Screen) {
  const at = slotOf(s);
  return { x: COL[at.col] + 38, y: ROW0 + at.row * ROW + 40 };
}

/**
 * THE 60 PX CUT, ENLARGED TWICE, cut from a screen round the icon: its
 * neighbours either side, its label under it.
 */
function Detail({
  screen,
  w,
  h,
  style,
}: {
  screen: Screen;
  w: number;
  h: number;
  style?: CSSProperties;
}) {
  const k = 2;
  const c = centreOf(screen);
  return (
    <div
      className="relative overflow-hidden"
      style={{ width: w, height: h, borderRadius: 12, ...style }}
    >
      <Scaled
        w={375}
        view={812}
        scale={k}
        style={{
          position: "absolute",
          left: Math.round(w / 2 - c.x * k),
          top: Math.round(h / 2 - c.y * k),
        }}
      >
        <HomeScreen screen={screen} bare marked={false} />
      </Scaled>
    </div>
  );
}

/** The tinted appearance among tinted neighbours, on a naturally dark crop. */
function TintedRow({
  w,
  count = 4,
  style,
}: {
  w: number;
  /** How many neighbours stand beside it (fewer on a phone slide). */
  count?: number;
  style?: CSSProperties;
}) {
  const take = useTake();
  const { AppIcon } = take.light;
  const row = [N.calendar, N.weather, N.music, N.messages].slice(0, count);
  return (
    <div
      className="relative overflow-hidden"
      style={{ width: w, height: 108, borderRadius: 12, ...style }}
    >
      <div className="absolute inset-0">
        <Photo id="concert-confetti" focus="50% 96%" />
      </div>
      <div
        className="absolute flex justify-between"
        style={{ left: 16, right: 16, top: 16 }}
      >
        <Slot label="Partyreel">
          <AppIcon size={SIZE} appearance="tinted" read="the tinted icon" />
        </Slot>
        {row.map((n) => (
          <Slot key={n.label} label={n.label}>
            <Tile n={n} tint="tinted" />
          </Slot>
        ))}
      </div>
    </div>
  );
}

/**
 * THE MARK PRINTED: a card on the take's own stock (a business card's
 * proportion, 85 by 55 mm), the icon in its paper appearance and the wordmark
 * beside it, a print you could hold. On the room it is an object on a dark
 * table: lit along its top edge, its shadow under it.
 */
function PrintedCard({ w, style }: { w: number; style?: CSSProperties }) {
  const take = useTake();
  const { AppIcon } = take.light;
  const t = inkOf(take, "paper");
  const h = Math.round((w * 55) / 85);
  const icon = Math.round(w * 0.25);
  return (
    <div
      className="relative flex items-center overflow-hidden"
      data-bd-card="paper"
      style={{
        width: w,
        height: h,
        borderRadius: 4,
        paddingLeft: Math.round(w * 0.11),
        gap: Math.round(w * 0.07),
        background: take.paper.card.hex,
        boxShadow:
          "inset 0 1px 0 rgb(255 255 255 / 0.9), 0 1px 1px rgb(0 0 0 / 0.5), 0 22px 40px -18px rgb(0 0 0 / 0.9)",
        ...style,
      }}
    >
      <AppIcon size={icon} appearance="paper" read="the icon, printed" />
      <div>
        <Wordmark
          height={Math.round(w * 0.075)}
          color={t.fg}
          read="the wordmark, printed"
        />
        <p
          style={{
            fontSize: Math.max(10, Math.round(w * 0.048)),
            color: t.muted,
            marginTop: Math.round(w * 0.03),
          }}
        >
          partyreel.com
        </p>
      </div>
    </div>
  );
}

/** The icon at its true size and the take's line about it. */
function TrueSize({ width, style }: { width: number; style?: CSSProperties }) {
  const take = useTake();
  const { AppIcon } = take.light;
  return (
    <div className="flex items-start" style={{ width, gap: 22, ...style }}>
      <AppIcon size={SIZE} appearance="room" read="the icon at true size" />
      <Note ground="room" label="At true size" style={{ flex: 1 }}>
        {take.words.notes.home}
      </Note>
    </div>
  );
}

export function HomeScreenSlide({ screen }: SlideProps) {
  const m = useMeasure();
  // A label only where a reader would be lost without it: the white card on a
  // dark slide is the mark in print, which nothing else on the slide says.
  const printed = "In print";

  if (m.desk) {
    const s = 0.88;
    const gap = 36;
    const phoneW = Math.round(Math.round(375 * s) / 0.94);
    const rx = m.pad + phoneW * 2 + gap + 56;
    const rw = m.w - m.pad - rx;
    return (
      <SlideRoot screen={screen} ground="room">
        <Phone
          screen={NIGHT}
          s={s}
          style={{ position: "absolute", left: m.pad, top: m.top }}
        />
        <Phone
          screen={DAY}
          s={s}
          style={{
            position: "absolute",
            left: m.pad + phoneW + gap,
            top: m.top,
          }}
        />
        <div className="absolute" style={{ left: rx, top: m.top, width: rw }}>
          <Label ground="room">The icon at 60 px, enlarged twice</Label>
          <Detail screen={DAY} w={rw} h={212} style={{ marginTop: 12 }} />
          <Label ground="room" style={{ marginTop: 28 }}>
            Tinted, among tinted neighbours
          </Label>
          <TintedRow w={rw} style={{ marginTop: 12 }} />
          <TrueSize width={rw} style={{ marginTop: 30 }} />
          <Label ground="room" style={{ marginTop: 30 }}>
            {printed}
          </Label>
          <PrintedCard w={220} style={{ marginTop: 14 }} />
        </div>
      </SlideRoot>
    );
  }

  // The phone: the night at true size, edge to edge, starting under the
  // deck's head (its light ink never stands on a busy wallpaper); the day cut
  // round the icon; then the tinted row, the line and the print.
  const k = m.inner / 375;
  // The day cut to three rows, whole with their labels: the icon's row and
  // one either side of it.
  const at = slotOf(DAY).row;
  const dayFrom = ROW0 + (at - 1) * ROW - 16;
  const dayView = 3 * ROW + 12;
  return (
    <SlideRoot screen={screen} ground="room">
      <div
        className="absolute inset-x-0 overflow-hidden"
        style={{ top: HEAD_375, height: 812 }}
      >
        <HomeScreen screen={NIGHT} />
      </div>
      <div
        className="absolute"
        style={{ left: m.pad, top: HEAD_375 + 812 + 28, width: m.inner }}
      >
        <Label ground="room">On a light wallpaper</Label>
        <div
          className="relative overflow-hidden"
          style={{ marginTop: 12, borderRadius: 16 }}
        >
          <Scaled
            w={375}
            view={dayView}
            page={812}
            scale={k}
            scroll={dayFrom}
          >
            <HomeScreen screen={DAY} />
          </Scaled>
        </div>
        <Label ground="room" style={{ marginTop: 28 }}>
          Tinted, among tinted neighbours
        </Label>
        <TintedRow w={m.inner} count={3} style={{ marginTop: 12 }} />
        <TrueSize width={m.inner} style={{ marginTop: 28 }} />
        <Label ground="room" style={{ marginTop: 26 }}>
          {printed}
        </Label>
        <PrintedCard w={200} style={{ marginTop: 12 }} />
      </div>
    </SlideRoot>
  );
}
