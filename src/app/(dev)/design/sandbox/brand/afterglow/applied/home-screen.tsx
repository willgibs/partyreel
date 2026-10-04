"use client";

import type { CSSProperties, ReactNode } from "react";

import type { SlideProps } from "../../deck/contract";
import { Photo, type PhotoId } from "../../deck/media";
import { AppIcon } from "../marks";
import { ink, SlideRoot } from "../root";
import { GROUND, PhoneShell, Readout } from "../system";
import { Note, Scaled } from "./kit";

/**
 * 14 ON A HOME SCREEN: the Ring at its true size (60 px, the system's own
 * cut for its size) among plain neighbours, on two real photographs: a
 * daylight wedding and a dark, blue-lit crowd. The neighbours are plain tiles
 * (a solid colour and a simple shape), never anyone's mark, in the colours a
 * real home screen is full of; the Ring is the one dark disc among them, and
 * its light is the only light on the screen. The tinted cut beside them.
 */

type Tint = "default" | "tinted";

/** A plain neighbour: a solid tile and one simple shape, in a home screen's ordinary colours. */
const TILES: readonly { label: string; bg: string; fg: string; glyph: GlyphId }[] = [
  { label: "Calendar", bg: "#ffffff", fg: "#1c1c1e", glyph: "grid" },
  { label: "Notes", bg: "#f7d154", fg: "#ffffff", glyph: "lines" },
  { label: "Weather", bg: "#3b82f6", fg: "#ffffff", glyph: "half" },
  { label: "Clock", bg: "#1c1c1e", fg: "#ffffff", glyph: "ring" },
  { label: "Maps", bg: "#e9e5dc", fg: "#5b8c5a", glyph: "pin" },
  { label: "Mail", bg: "#4a8ff7", fg: "#ffffff", glyph: "env" },
  { label: "Music", bg: "#f2546f", fg: "#ffffff", glyph: "note" },
  { label: "Files", bg: "#ffffff", fg: "#3b82f6", glyph: "folder" },
  { label: "Wallet", bg: "#111113", fg: "#f2b84b", glyph: "bars" },
  { label: "Camera", bg: "#d9d9de", fg: "#2c2c2e", glyph: "lens" },
  { label: "Health", bg: "#ffffff", fg: "#f2546f", glyph: "plus" },
  { label: "Books", bg: "#f28c28", fg: "#ffffff", glyph: "book" },
  { label: "Messages", bg: "#3ec267", fg: "#ffffff", glyph: "bubble" },
  { label: "Translate", bg: "#22252b", fg: "#ffffff", glyph: "wave" },
  { label: "Settings", bg: "#8e8e93", fg: "#ffffff", glyph: "dot" },
  { label: "Podcasts", bg: "#9b5cf6", fg: "#ffffff", glyph: "tri" },
  { label: "Phone", bg: "#3ec267", fg: "#ffffff", glyph: "dot" },
  { label: "Browser", bg: "#ffffff", fg: "#3b82f6", glyph: "ring" },
];

type GlyphId = "grid" | "lines" | "half" | "ring" | "pin" | "env" | "note" | "folder" | "bars" | "lens" | "plus" | "book" | "bubble" | "wave" | "dot" | "tri";

function Shape({ id, c }: { id: GlyphId; c: string }) {
  const s = { fill: "none", stroke: c, strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  const f = { fill: c } as const;
  const shapes: Record<GlyphId, ReactNode> = {
    grid: (
      <>
        <rect x="8" y="9" width="16" height="15" rx="2.5" {...s} />
        <path d="M8 14h16" {...s} />
      </>
    ),
    lines: <path d="M9 11h14M9 16h14M9 21h9" {...s} />,
    half: (
      <>
        <circle cx="15" cy="15" r="5.5" {...f} />
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
    note: <path d="M13 22V10l9-2v12M13 22a2.5 2.5 0 1 1-2.5-2.5M22 20a2.5 2.5 0 1 1-2.5-2.5" {...s} />,
    folder: <path d="M8 12a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" {...f} />,
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
    book: <path d="M9 10h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H9zM23 10h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z" {...f} />,
    bubble: <path d="M16 9c-5 0-8.5 3-8.5 6.6 0 2 1.1 3.8 3 5L10 24l4-2.1c.6.1 1.3.2 2 .2 5 0 8.5-3 8.5-6.6S21 9 16 9z" {...f} />,
    wave: <path d="M7 17c2.2-4 4.4-4 6.6 0s4.4 4 6.6 0 2.8-2 4.8-1" {...s} />,
    dot: <circle cx="16" cy="16" r="6" {...f} />,
    tri: <path d="M13 10.5v11l9-5.5z" {...f} />,
  };
  return (
    <svg aria-hidden viewBox="0 0 32 32" width={34} height={34}>
      {shapes[id]}
    </svg>
  );
}

const SIZE = 60;

/** A plain tile in iOS's corner (a continuous corner reads as 22.4% of its side). */
function Tile({ t, tint }: { t: (typeof TILES)[number]; tint: Tint }) {
  const tinted = tint === "tinted";
  return (
    <span
      className="flex items-center justify-center"
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE * 0.2237,
        background: tinted ? "linear-gradient(180deg, #2a2a2c, #161617)" : `linear-gradient(180deg, color-mix(in oklab, ${t.bg} 92%, white), ${t.bg})`,
        boxShadow: "inset 0 0 0 0.5px rgb(0 0 0 / 0.08)",
      }}
    >
      <Shape id={t.glyph} c={tinted ? "#cfcfd4" : t.fg} />
    </span>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        marginTop: 6,
        fontSize: 11.5,
        fontWeight: 500,
        color: "#ffffff",
        letterSpacing: "0.005em",
        textShadow: "0 1px 3px rgb(0 0 0 / 0.45)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Slot({ children, label, read }: { children: ReactNode; label?: string; read?: string }) {
  return (
    <span className="flex flex-col items-center" style={{ width: 76 }} data-bd-read={read}>
      {children}
      {label ? <Label>{label}</Label> : null}
    </span>
  );
}

const COLS = [27, 114, 201, 288].map((x) => x - 8);

/**
 * A home screen at its true size (375 by 812, icons 60 px): the wallpaper a
 * real photograph, four rows of plain neighbours, the search pill and the
 * dock. `at` puts the Ring on the grid (row, column) or in the dock.
 */
function HomeScreen({
  wallpaper,
  focus,
  zoom = 1,
  origin,
  rows: nRows = 4,
  tint = "default",
  at,
  bare = false,
  marked = true,
}: {
  wallpaper: PhotoId;
  focus?: string;
  /** A wallpaper's own crop, as a person sets one: scaled from `origin`. */
  zoom?: number;
  origin?: string;
  rows?: number;
  tint?: Tint;
  at: { row: number; col: number } | "dock";
  bare?: boolean;
  /** Mark the icon for the deck's caption (off for an enlarged copy). */
  marked?: boolean;
}) {
  const grid = TILES.slice(0, 15);
  const dock = TILES.slice(14, 18);
  let k = 0;
  const icon = (
    <AppIcon
      size={SIZE}
      appearance={tint === "tinted" ? "tinted" : "room"}
      read={marked ? `the icon on the home screen, ${tint}` : undefined}
    />
  );
  const rows = Array.from({ length: nRows }, (_, r) => r).map((r) =>
    [0, 1, 2, 3].map((c) => {
      if (at !== "dock" && at.row === r && at.col === c)
        return (
          <Slot key={`${r}${c}`} label="Partyreel" read={marked ? "the Partyreel slot" : undefined}>
            {icon}
          </Slot>
        );
      const t = grid[k++ % grid.length];
      return (
        <Slot key={`${r}${c}`} label={t.label}>
          <Tile t={t} tint={tint} />
        </Slot>
      );
    }),
  );
  const shade: CSSProperties = { position: "absolute", inset: 0 };
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#000" }}>
      <div style={{ ...shade, transform: `scale(${zoom})`, transformOrigin: origin ?? "50% 50%" }}>
        <Photo id={wallpaper} focus={focus} />
      </div>
      {bare ? null : (
        <div className="absolute inset-x-0 top-0 flex items-center justify-between" style={{ height: 54, paddingInline: 34, color: "#fff" }}>
          <span style={{ fontSize: 15.5, fontWeight: 600, paddingTop: 2 }}>9:41</span>
          <span className="flex items-center" style={{ gap: 6 }}>
            <svg aria-hidden width={44} height={12} viewBox="0 0 44 12" fill="#fff">
              {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={i * 5} y={8 - i * 2.4} width={3.2} height={3.6 + i * 2.4} rx={0.8} />
              ))}
              <rect x={23} y={1} width={18} height={10} rx={2.6} fill="none" stroke="#fff" strokeOpacity={0.5} />
              <rect x={24.6} y={2.6} width={14.8} height={6.8} rx={1.4} />
            </svg>
          </span>
        </div>
      )}
      {rows.map((cells, r) => (
        <div key={r} className="absolute flex" style={{ top: 72 + r * 102, left: COLS[0] }}>
          {cells.map((cell, c) => (
            <span key={c} style={{ position: "absolute", left: COLS[c] - COLS[0] }}>
              {cell}
            </span>
          ))}
        </div>
      ))}
      {/* The search pill and the dock: frosted, plain. */}
      <span
        className="absolute flex items-center justify-center"
        style={{ left: "50%", top: 668, transform: "translateX(-50%)", height: 28, paddingInline: 14, borderRadius: 99, background: "rgb(255 255 255 / 0.22)", color: "#fff", fontSize: 12, fontWeight: 500, gap: 5 }}
      >
        <svg aria-hidden width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5L20 20" strokeLinecap="round" />
        </svg>
        Search
      </span>
      <div
        className="absolute flex items-center justify-around"
        style={{ left: 12, right: 12, top: 712, height: 88, borderRadius: 34, background: "rgb(255 255 255 / 0.2)", paddingInline: 8 }}
      >
        {dock.map((t, i) =>
          at === "dock" && i === 1 ? (
            <Slot key="partyreel" read="the Partyreel slot, in the dock">
              {icon}
            </Slot>
          ) : (
            <Slot key={t.label}>
              <Tile t={t} tint={tint} />
            </Slot>
          ),
        )}
      </div>
    </div>
  );
}

const PHONE_W = 375 + 24;
const PHONE_H = 812 + 24;

function Phone({ children }: { children: ReactNode }) {
  return (
    <PhoneShell width={PHONE_W} height={PHONE_H} ground="room">
      {children}
    </PhoneShell>
  );
}

/** A clean home screen, three rows, the couple framed in the clear band above the dock. */
const DAY = { wallpaper: "wedding-petals" as const, focus: "50% 50%", zoom: 1.5, origin: "54% 0%", rows: 3 };
const DARK = { wallpaper: "concert-confetti" as const, focus: "62% 50%" };

const PROOF =
  "At 60 px the Ring is the one dark disc on the screen and its light the only light, on a daylight wedding and in a blue-lit crowd, among louder neighbours.";

/** The icon and its neighbours, enlarged twice, cut from the day screen round the Ring. */
function Detail({ w, h }: { w: number; h: number }) {
  const s = 2;
  // The Ring's slot is row 1, column 1: its centre, with its label under it.
  const cx = COLS[1] + 38;
  const cy = 72 + 102 + 40;
  return (
    <div className="relative overflow-hidden" style={{ width: w, height: h, borderRadius: 10 }}>
      <Scaled w={375} view={812} scale={s} style={{ position: "absolute", left: w / 2 - cx * s, top: h / 2 - cy * s }}>
        <HomeScreen {...DAY} at={{ row: 1, col: 1 }} bare marked={false} />
      </Scaled>
    </div>
  );
}

function TintedRow({ w }: { w: number }) {
  return (
    <div className="relative overflow-hidden" style={{ width: w, height: 104, borderRadius: 10 }}>
      {/* A naturally dark crop (the crowd), never a photograph under a tint. */}
      <div className="absolute inset-0">
        <Photo id="concert-confetti" focus="50% 96%" />
      </div>
      <div className="absolute flex justify-between" style={{ left: 14, right: 14, top: 16 }}>
        <Slot label="Partyreel">
          <AppIcon size={SIZE} appearance="tinted" read="the tinted icon" />
        </Slot>
        {[TILES[0], TILES[2], TILES[6], TILES[12]].map((t) => (
          <Slot key={t.label} label={t.label}>
            <Tile t={t} tint="tinted" />
          </Slot>
        ))}
      </div>
    </div>
  );
}

export function HomeScreenSlide({ screen }: SlideProps) {
  const t = ink("room");
  if (screen === "375")
    return (
      <SlideRoot screen={screen} ground="room">
        <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: 812 }}>
          <HomeScreen {...DAY} at={{ row: 1, col: 1 }} bare />
        </div>
        <div
          className="absolute inset-x-0 flex items-center"
          style={{ top: 812, height: 44, paddingInline: 20, borderBlock: "1px solid rgb(255 255 255 / 0.08)", background: GROUND.display.hex }}
        >
          <Readout style={{ color: t.faint }}>A dark wallpaper, the Ring in the dock</Readout>
        </div>
        <div className="absolute inset-x-0 overflow-hidden" style={{ top: 856, height: 812 }}>
          <HomeScreen {...DARK} at="dock" />
        </div>
        <div className="absolute inset-x-0" style={{ top: 1668, paddingInline: 20, paddingTop: 22 }}>
          <Note ground="room" label="At true size">
            {PROOF}
          </Note>
        </div>
      </SlideRoot>
    );
  return (
    <SlideRoot screen={screen} ground="room" style={{ background: GROUND.display.hex }}>
      <div className="absolute" style={{ left: 56, top: 60 }}>
        <Phone>
          <HomeScreen {...DAY} at={{ row: 1, col: 1 }} />
        </Phone>
      </div>
      <div className="absolute" style={{ left: 56 + PHONE_W + 36, top: 60 }}>
        <Phone>
          <HomeScreen {...DARK} at="dock" />
        </Phone>
      </div>
      <div className="absolute" style={{ left: 56 + 2 * PHONE_W + 72, top: 96, width: 418 }}>
        <Readout style={{ color: t.faint }}>The icon at 60 px, enlarged twice</Readout>
        <div style={{ marginTop: 14 }}>
          <Detail w={418} h={232} />
        </div>
        <Readout className="block" style={{ color: t.faint, marginTop: 30 }}>
          Tinted, beside its neighbours
        </Readout>
        <div style={{ marginTop: 14 }}>
          <TintedRow w={418} />
        </div>
        <Note ground="room" label="At true size" style={{ marginTop: 30 }}>
          {PROOF}
        </Note>
      </div>
    </SlideRoot>
  );
}
