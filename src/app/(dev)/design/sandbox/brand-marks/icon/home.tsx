"use client";

import type { ReactNode } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";

import { type IconId, RingIcon } from "./ring";

/**
 * A PHONE'S HOME SCREEN at its own size (375 by 812, icons 60 points): a real
 * photograph for a wallpaper, five rows of plain neighbours with Partyreel
 * among them, the search pill and the dock (brand r2's slide 14, kept).
 *
 * ★ THE NEIGHBOURS ARE NOBODY'S MARK: flat tiles and one plain shape each, in
 * the ordinary colours a home screen is full of, light and dark tiles mixed,
 * so the icon is judged where it will live, among loud strangers.
 */

type Glyph =
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

type Neighbour = {
  readonly label: string;
  readonly bg: string;
  readonly fg: string;
  readonly glyph: Glyph;
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
  messages: {
    label: "Messages",
    bg: "#3ec267",
    fg: "#ffffff",
    glyph: "bubble",
  },
  translate: {
    label: "Translate",
    bg: "#22252b",
    fg: "#ffffff",
    glyph: "wave",
  },
  settings: { label: "Settings", bg: "#8e8e93", fg: "#ffffff", glyph: "dot" },
  podcasts: { label: "Podcasts", bg: "#9b5cf6", fg: "#ffffff", glyph: "tri" },
  phone: { label: "Phone", bg: "#3ec267", fg: "#ffffff", glyph: "dot" },
  browser: { label: "Browser", bg: "#ffffff", fg: "#3b82f6", glyph: "ring" },
  home: { label: "Home", bg: "#ffffff", fg: "#f28c28", glyph: "house" },
  contacts: {
    label: "Contacts",
    bg: "#cfcfd4",
    fg: "#6e6e73",
    glyph: "person",
  },
  reminders: {
    label: "Reminders",
    bg: "#ffffff",
    fg: "#1c1c1e",
    glyph: "check",
  },
  stocks: { label: "Stocks", bg: "#121214", fg: "#ffffff", glyph: "wave" },
  passwords: {
    label: "Passwords",
    bg: "#2c2c2e",
    fg: "#ffffff",
    glyph: "keys",
  },
} as const satisfies Record<string, Neighbour>;

/** One plain shape on a 32 box, in the tile's glyph colour. */
function Shape({ id, c }: { id: Glyph; c: string }) {
  const s = {
    fill: "none",
    stroke: c,
    strokeWidth: 2.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  const f = { fill: c } as const;
  const shapes: Record<Glyph, ReactNode> = {
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
        <rect
          x="8"
          y="16"
          width="16"
          height="4"
          rx="1.5"
          fill={c}
          opacity={0.6}
        />
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

/**
 * A plain tile in the system's corner (a continuous corner reads as 22.4% of
 * its side), or round, as a launcher masks every icon to a circle.
 */
function Tile({ n, round = false }: { n: Neighbour; round?: boolean }) {
  return (
    <span
      className="flex items-center justify-center"
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: round ? "50%" : SIZE * 0.2237,
        background: `linear-gradient(180deg, color-mix(in oklab, ${n.bg} 90%, white), ${n.bg})`,
        boxShadow: "inset 0 0 0 0.5px rgb(0 0 0 / 0.08)",
      }}
    >
      <Shape id={n.glyph} c={n.fg} />
    </span>
  );
}

function Slot({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span className="flex flex-col items-center" style={{ width: 76 }}>
      {children}
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
        {label}
      </span>
    </span>
  );
}

const COL = [19, 106, 193, 280];
const ROW0 = 70;
const ROW = 100;

type Wall = {
  name: string;
  still: string;
  focus: string;
  zoom?: number;
  origin?: string;
  /** The twenty slots, row by row; null is Partyreel's. */
  grid: readonly (Neighbour | null)[];
};

/** A night: confetti over a blue-lit crowd. */
export const NIGHT: Wall = {
  name: "night",
  still: "concert-confetti",
  focus: "60% 50%",
  grid: [
    N.calendar,
    N.clock,
    N.weather,
    N.notes,
    N.maps,
    N.mail,
    N.camera,
    N.files,
    N.wallet,
    N.health,
    null,
    N.books,
    N.translate,
    N.settings,
    N.podcasts,
    N.reminders,
    N.stocks,
    N.contacts,
    N.home,
    N.passwords,
  ],
};

/**
 * A day: the wedding's arch, cropped into its flowers, the icon on the bright
 * ground at the foot of its first column (★ the creative director's pass: its
 * slot had drifted onto the dark foliage, where a dark tile meets no day).
 */
export const DAY: Wall = {
  name: "day",
  still: "wedding-arch",
  focus: "36% 50%",
  zoom: 1.6,
  origin: "30% 96%",
  grid: [
    N.weather,
    N.calendar,
    N.notes,
    N.clock,
    N.maps,
    N.translate,
    N.mail,
    N.camera,
    N.files,
    N.wallet,
    N.health,
    N.books,
    N.reminders,
    N.contacts,
    N.settings,
    N.podcasts,
    null,
    N.stocks,
    N.home,
    N.passwords,
  ],
};

const DOCK = [N.phone, N.browser, N.messages, N.music];

function Status() {
  return (
    <div
      className="absolute inset-x-0 top-0 flex items-center justify-between"
      style={{ height: 54, paddingInline: 34, color: "#fff" }}
    >
      <span style={{ fontSize: 15.5, fontWeight: 600, paddingTop: 2 }}>
        9:41
      </span>
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

/** The whole home screen, 375 by 812, the icon in its slot. */
export function HomeScreen({ icon, wall }: { icon: IconId; wall: Wall }) {
  const still = marketingImage(wall.still);
  return (
    <div
      className="relative overflow-hidden"
      style={{ width: 375, height: 812, background: "#000" }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${wall.zoom ?? 1})`,
          transformOrigin: wall.origin ?? "50% 50%",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixed still in a lab frame */}
        <img
          src={still.src}
          alt=""
          className="size-full object-cover"
          style={{ objectPosition: wall.focus }}
        />
      </div>
      <Status />
      {wall.grid.map((n, i) => {
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
                <Tile n={n} />
              </Slot>
            ) : (
              <Slot label="Partyreel">
                <RingIcon
                  id={icon}
                  size={SIZE}
                  read={`the icon on the ${wall.name} screen`}
                />
              </Slot>
            )}
          </span>
        );
      })}
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
          backdropFilter: "blur(14px)",
          color: "#fff",
          fontSize: 12.5,
          fontWeight: 500,
        }}
      >
        Search
      </span>
      <div
        className="absolute flex items-center justify-around"
        style={{
          left: 12,
          right: 12,
          bottom: 14,
          height: 92,
          borderRadius: 34,
          paddingInline: 8,
          background: "rgb(255 255 255 / 0.22)",
          backdropFilter: "blur(20px)",
        }}
      >
        {DOCK.map((n) => (
          <Tile key={n.label} n={n} />
        ))}
      </div>
    </div>
  );
}

/** A launcher's twenty slots, row by row; null is Partyreel's. */
const LAUNCHER: readonly (Neighbour | null)[] = [
  N.clock,
  N.calendar,
  N.weather,
  N.maps,
  N.mail,
  N.camera,
  N.files,
  N.music,
  N.notes,
  null,
  N.wallet,
  N.settings,
  N.contacts,
  N.podcasts,
  N.books,
  N.home,
];

/** The maskable icon's safe zone: the circle of 80% of its width every launcher keeps. */
const SAFE = 0.8;

/**
 * A LAUNCHER'S HOME, 375 BY 812: every icon masked to a circle, as the
 * manifest's maskable icon is (`icon-512-maskable.png`).
 *
 * ★ AT THE HARSHEST CROP A LAUNCHER MAY TAKE (the creative director's pass):
 * a maskable icon promises only its safe zone, the centre circle of 80% of
 * its width, and a launcher may show exactly that, scaled up to fill its
 * slot; masked at the tile's own edge, the kindest crop, a take that spills
 * past the safe zone looked whole when a phone may cut it. So the icon is
 * drawn at 1/0.8 of the slot and cut at the slot's circle.
 *
 * ★ NO MIRROR BALL ON THE WALL: the DJ still hung a real one over the grid,
 * beside a take that is one.
 */
export function Launcher({ icon }: { icon: IconId }) {
  const still = marketingImage("festival-crowd");
  return (
    <div
      className="relative overflow-hidden"
      style={{ width: 375, height: 812, background: "#000" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed still in a lab frame */}
      <img
        src={still.src}
        alt=""
        className="absolute inset-0 size-full object-cover"
        style={{ objectPosition: "40% 50%", filter: "brightness(0.8)" }}
      />
      <Status />
      {LAUNCHER.map((n, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        return (
          <span
            key={`${r}-${c}`}
            className="absolute"
            style={{ left: COL[c], top: 300 + r * ROW }}
          >
            {n ? (
              <Slot label={n.label}>
                <Tile n={n} round />
              </Slot>
            ) : (
              <Slot label="Partyreel">
                <span
                  data-bm-read="the maskable icon in a launcher's circle"
                  data-bm-says="60×60"
                  style={{
                    display: "block",
                    width: SIZE,
                    height: SIZE,
                    borderRadius: "50%",
                    overflow: "hidden",
                  }}
                >
                  <RingIcon
                    id={icon}
                    size={SIZE / SAFE}
                    style={{ margin: (SIZE - SIZE / SAFE) / 2 }}
                  />
                </span>
              </Slot>
            )}
          </span>
        );
      })}
      <span
        className="absolute flex items-center"
        style={{
          left: 20,
          right: 20,
          bottom: 30,
          height: 48,
          borderRadius: 99,
          paddingInline: 18,
          gap: 10,
          background: "rgb(255 255 255 / 0.9)",
          color: "#3c4043",
          fontSize: 14,
        }}
      >
        <span
          style={{ fontWeight: 700, color: "#4285f4", fontSize: 18 }}
          aria-hidden
        >
          G
        </span>
        Search
      </span>
    </div>
  );
}
