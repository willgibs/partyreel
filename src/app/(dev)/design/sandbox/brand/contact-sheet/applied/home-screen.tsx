"use client";

import type { CSSProperties, ReactNode } from "react";

import { HEAD } from "../../deck/deck";
import { PARTY, Photo, type PhotoId } from "../../deck/media";
import { AppIcon } from "../marks";
import { Kicker, type Screen, SlideRoot } from "../parts";
import { EVENTS, GROUND, PhoneShell } from "../system";
import { StatusBar } from "./kit";

/**
 * 14 ON A HOME SCREEN: the print on ink, a web clip saved from partyreel.com, at its
 * true size (60 px on a 375 screen) among plain neighbours, on a photograph.
 * Twice: on a daylight wallpaper in the light appearance, and on a dark
 * wallpaper in the dark one, the hard case for an ink tile, where its light
 * edge and its paper P carry it. Beside them, every event's own icon (the
 * guest's clip of one album, the same print on that event's latent image) and the
 * tinted appearance, where the print holds as a shape alone.
 *
 * What it proves: an icon with no colour of its own still finds itself in a
 * screen full of colour, because it is the darkest, plainest tile there, and
 * the colour beside it on a guest's phone is their event's.
 */

/* ── the neighbours: plain tiles, a simple shape each, never a brand ─────── */

type Glyph =
  | "dot"
  | "ring"
  | "bars"
  | "square"
  | "wave"
  | "tri"
  | "grid"
  | "half";

const NEIGHBOURS: readonly {
  label: string;
  fill: string;
  mark: string;
  glyph: Glyph;
}[] = [
  { label: "Travel", fill: "#3b7be0", mark: "#ffffff", glyph: "tri" },
  { label: "Bank", fill: "#f4f2ee", mark: "#2b2b2e", glyph: "bars" },
  { label: "Recipes", fill: "#f0a03c", mark: "#ffffff", glyph: "dot" },
  { label: "Fitness", fill: "#1d1d20", mark: "#7ee0a1", glyph: "ring" },
  { label: "Budget", fill: "#3f9a6a", mark: "#ffffff", glyph: "square" },
  { label: "Transit", fill: "#e2564b", mark: "#ffffff", glyph: "wave" },
  { label: "Radio", fill: "#8b64d6", mark: "#ffffff", glyph: "half" },
  { label: "Lists", fill: "#ffffff", mark: "#e2564b", glyph: "grid" },
  { label: "Garden", fill: "#9fc75a", mark: "#ffffff", glyph: "dot" },
  { label: "Tickets", fill: "#2b2b2e", mark: "#f0c24a", glyph: "square" },
  { label: "Reading", fill: "#f6e7c8", mark: "#a0642c", glyph: "bars" },
  { label: "Scanner", fill: "#e8ecf3", mark: "#3b7be0", glyph: "ring" },
  { label: "Market", fill: "#ffcc4d", mark: "#2b2b2e", glyph: "tri" },
  { label: "Sleep", fill: "#26345e", mark: "#cfd8ff", glyph: "half" },
];

function GlyphShape({ g, color }: { g: Glyph; color: string }) {
  const p = { fill: color };
  switch (g) {
    case "dot":
      return <circle cx="30" cy="30" r="11" {...p} />;
    case "ring":
      return (
        <circle
          cx="30"
          cy="30"
          r="12"
          fill="none"
          stroke={color}
          strokeWidth="5"
        />
      );
    case "bars":
      return (
        <g {...p}>
          <rect x="17" y="32" width="6" height="12" rx="2" />
          <rect x="27" y="24" width="6" height="20" rx="2" />
          <rect x="37" y="16" width="6" height="28" rx="2" />
        </g>
      );
    case "square":
      return <rect x="19" y="19" width="22" height="22" rx="5" {...p} />;
    case "wave":
      return (
        <path
          d="M14 34 q8 -12 16 0 t16 0"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
        />
      );
    case "tri":
      return <path d="M30 17 L44 41 L16 41 Z" {...p} />;
    case "grid":
      return (
        <g {...p}>
          <rect x="17" y="17" width="11" height="11" rx="3" />
          <rect x="32" y="17" width="11" height="11" rx="3" />
          <rect x="17" y="32" width="11" height="11" rx="3" />
          <rect x="32" y="32" width="11" height="11" rx="3" opacity="0.4" />
        </g>
      );
    case "half":
      return <path d="M30 16 a14 14 0 0 1 0 28 z" {...p} />;
  }
}

/** A hex colour's relative luminance (WCAG), to pick a shape that reads on a dark tile. */
function lum(hex: string): number {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * f(v[0]) + 0.7152 * f(v[1]) + 0.0722 * f(v[2]);
}

/** The iOS-style corner, as `marks.tsx` draws the app icon's. */
const TILE_CLIP =
  "M22.37,0 H77.63 C87.70,0 100,12.30 100,22.37 V77.63 C100,87.70 87.70,100 77.63,100 H22.37 C12.30,100 0,87.70 0,77.63 V22.37 C0,12.30 12.30,0 22.37,0 Z";

/**
 * A plain neighbour: a flat tile and one shape. In the dark appearance the
 * tile goes dark and the shape keeps the tile's colour (a pale tile's shape
 * keeps its own), as the system draws it.
 */
function Tile({
  n,
  size,
  dark,
}: {
  n: (typeof NEIGHBOURS)[number];
  size: number;
  dark: boolean;
}) {
  // In the dark appearance the shape takes whichever of its two colours
  // stands off the dark tile more, so no neighbour goes blank.
  const shape = dark ? (lum(n.fill) > lum(n.mark) ? n.fill : n.mark) : n.mark;
  return (
    <svg
      viewBox="0 0 60 60"
      width={size}
      height={size}
      aria-hidden
      style={{ display: "block" }}
    >
      <g transform="scale(0.6)">
        <path d={TILE_CLIP} fill={dark ? "#1c1c1e" : n.fill} />
      </g>
      <GlyphShape g={n.glyph} color={shape} />
    </svg>
  );
}

/* ── a home screen ───────────────────────────────────────────────────────── */

type Slot =
  | { kind: "app" }
  | { kind: "event"; seed: string; label: string }
  | { kind: "tile"; i: number }
  | { kind: "none" };

const COLS = [27, 114, 201, 288];

function AppLabel({ children }: { children: string }) {
  return (
    <span
      className="cs-read"
      style={{
        display: "block",
        width: 80,
        marginLeft: -10,
        marginTop: 5,
        textAlign: "center",
        fontSize: 12,
        lineHeight: "14px",
        fontWeight: 500,
        color: "#ffffff",
        textShadow: "0 1px 2px rgb(0 0 0 / 0.45)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {children}
    </span>
  );
}

/** One slot of the grid or the dock (the dock's icons carry no label). */
function SlotIcon({
  s,
  dark,
  read,
  label = true,
}: {
  s: Slot;
  dark: boolean;
  read?: boolean;
  label?: boolean;
}): ReactNode {
  if (s.kind === "none") return null;
  if (s.kind === "app")
    return (
      <div>
        <AppIcon
          size={60}
          read={read ? "the app icon at 60, true size" : undefined}
        />
        {label && <AppLabel>Partyreel</AppLabel>}
      </div>
    );
  if (s.kind === "event")
    return (
      <div>
        <AppIcon
          size={60}
          seed={s.seed}
          read={read ? "the event's own icon at 60" : undefined}
        />
        {label && <AppLabel>{s.label}</AppLabel>}
      </div>
    );
  const n = NEIGHBOURS[s.i % NEIGHBOURS.length];
  return (
    <div>
      <Tile n={n} size={60} dark={dark} />
      {label && <AppLabel>{n.label}</AppLabel>}
    </div>
  );
}

const T = (i: number): Slot => ({ kind: "tile", i });
const APP: Slot = { kind: "app" };
const EVENT: Slot = { kind: "event", seed: PARTY.seed, label: PARTY.name };
const NONE: Slot = { kind: "none" };

/**
 * A HOME SCREEN at 375 by 812: the wallpaper (a photograph), the status bar,
 * a grid of 60 px icons with their labels, and the dock.
 */
function HomeScreen({
  wallpaper,
  focus,
  rows,
  dock,
  dark = false,
  read = false,
}: {
  wallpaper: PhotoId;
  focus?: string;
  rows: readonly (readonly Slot[])[];
  dock: readonly Slot[];
  dark?: boolean;
  read?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: 375,
        height: 812,
        overflow: "hidden",
        background: "#000",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        <Photo id={wallpaper} focus={focus} />
      </div>
      {dark && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "rgb(0 0 0 / 0.28)",
          }}
        />
      )}
      <StatusBar room />
      {rows.map((row, r) =>
        row.map((s, c) => (
          <div
            key={`${r}-${c}`}
            style={{ position: "absolute", left: COLS[c], top: 70 + r * 100 }}
          >
            <SlotIcon s={s} dark={dark} read={read} />
          </div>
        )),
      )}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: 690,
          transform: "translateX(-50%)",
          height: 26,
          padding: "0 12px",
          borderRadius: 13,
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: "rgb(255 255 255 / 0.2)",
          backdropFilter: "blur(14px)",
          color: "#fff",
        }}
      >
        <svg viewBox="0 0 12 12" width={11} height={11}>
          <circle
            cx="5"
            cy="5"
            r="3.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M8 8l2.6 2.6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <span className="cs-read" style={{ fontSize: 12, fontWeight: 500 }}>
          Search
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 10,
          right: 10,
          bottom: 10,
          height: 92,
          borderRadius: 32,
          background: dark ? "rgb(30 30 32 / 0.55)" : "rgb(255 255 255 / 0.28)",
          backdropFilter: "blur(20px) saturate(1.4)",
        }}
      >
        {dock.map((s, c) => (
          <div
            key={c}
            style={{ position: "absolute", left: COLS[c] - 10, top: 16 }}
          >
            <SlotIcon s={s} dark={dark} read={read} label={false} />
          </div>
        ))}
      </div>
    </div>
  );
}

const DAY_ROWS: readonly (readonly Slot[])[] = [
  [T(0), T(1), T(2), T(3)],
  [APP, T(4), T(5), T(6)],
  [T(7), T(8), EVENT, T(9)],
  [T(10), T(11), NONE, NONE],
];
const DAY_DOCK: readonly Slot[] = [T(12), T(1), T(5), T(13)];

const DARK_ROWS: readonly (readonly Slot[])[] = [
  [T(3), T(6), T(0), T(9)],
  [T(2), EVENT, T(11), T(4)],
  [T(13), T(7), NONE, NONE],
];
const DARK_DOCK: readonly Slot[] = [T(1), APP, T(5), T(12)];

/** A home screen inside a phone at true size (the screen 375 by 812). */
function PhoneAt({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <PhoneShell w={389} h={826} style={style}>
      {children}
    </PhoneShell>
  );
}

/** The tinted appearance: the system draws an icon as one shape in the owner's tint. */
function Tinted({ size, seed }: { size: number; seed?: string }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{ filter: "grayscale(1) contrast(1.15)", opacity: 0.95 }}>
        <AppIcon size={size} seed={seed} />
      </div>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: size * 0.2237,
          background: "#f2c879",
          mixBlendMode: "multiply",
          opacity: 0.7,
        }}
      />
    </div>
  );
}

/** Every event, its own icon: the same print on each event's latent image. */
function EventIcons({
  size,
  gap,
  label = 12,
}: {
  size: number;
  gap: number;
  label?: number;
}) {
  return (
    <div style={{ display: "flex", gap }}>
      {EVENTS.map((e) => (
        <div
          key={e.seed}
          style={{
            width: size,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 7,
          }}
        >
          <AppIcon size={size} seed={e.seed} />
          <span
            className="cs-read cs-muted"
            style={{
              fontSize: label,
              lineHeight: `${label + 4}px`,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {e.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HomeScreenSlide({ screen }: { screen: Screen }) {
  return screen === "1440" ? <HomeDesk /> : <HomePhone />;
}

function HomeDesk() {
  const top = HEAD["1440"] + 8;
  return (
    <SlideRoot screen="1440" style={{ background: GROUND.sheet.hex }}>
      <PhoneAt style={{ position: "absolute", left: 64, top }}>
        <HomeScreen
          wallpaper="wedding-petals"
          focus="50% 35%"
          rows={DAY_ROWS}
          dock={DAY_DOCK}
          read
        />
      </PhoneAt>
      <PhoneAt style={{ position: "absolute", left: 485, top }}>
        <HomeScreen
          wallpaper="festival-crowd"
          focus="50% 50%"
          rows={DARK_ROWS}
          dock={DARK_DOCK}
          dark
        />
      </PhoneAt>
      <div
        className="absolute"
        style={{ left: 940, top: HEAD["1440"] + 40, width: 436 }}
      >
        <Kicker>At true size, 60 px</Kicker>
        <p
          className="cs-read cs-muted"
          style={{ margin: "12px 0 0", fontSize: 15, lineHeight: "23px" }}
        >
          The darkest, plainest tile on a screen full of colour, in daylight and
          in the dark appearance. Its light edge and its paper P carry it on a
          dark wallpaper.
        </p>
        <Kicker style={{ marginTop: 40 }}>Every event, its own icon</Kicker>
        <p
          className="cs-read cs-muted"
          style={{ margin: "12px 0 0", fontSize: 15, lineHeight: "23px" }}
        >
          A guest who keeps an album on their home screen keeps that
          event&rsquo;s: the same print, its latent image in that event&rsquo;s
          colours.
        </p>
        <div style={{ marginTop: 20 }}>
          <EventIcons size={76} gap={30} />
        </div>
        <Kicker style={{ marginTop: 40 }}>Tinted, the print alone</Kicker>
        <div
          style={{
            display: "flex",
            gap: 18,
            alignItems: "center",
            marginTop: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 14,
              padding: 14,
              borderRadius: 18,
              background: "#141210",
            }}
          >
            <Tinted size={60} />
            <Tinted size={60} seed={PARTY.seed} />
          </div>
          <p
            className="cs-read cs-muted"
            style={{ margin: 0, fontSize: 14, lineHeight: "21px" }}
          >
            In one tint, the print holds as a shape, and an event&rsquo;s icon
            keeps its latent image as a tone.
          </p>
        </div>
      </div>
    </SlideRoot>
  );
}

function HomePhone() {
  const top = HEAD["375"];
  return (
    <SlideRoot screen="375" style={{ background: GROUND.sheet.hex }}>
      <div style={{ position: "absolute", left: 0, top }}>
        <HomeScreen
          wallpaper="wedding-petals"
          focus="50% 35%"
          rows={DAY_ROWS}
          dock={DAY_DOCK}
          read
        />
      </div>
      <div
        className="absolute"
        style={{ left: 16, right: 16, top: top + 812 + 30 }}
      >
        <Kicker style={{ fontSize: 11 }}>In the dark appearance</Kicker>
        <div
          style={{
            marginTop: 14,
            borderRadius: 20,
            overflow: "hidden",
            height: 196,
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", left: -16, top: -616 }}>
            <HomeScreen
              wallpaper="festival-crowd"
              focus="50% 50%"
              rows={DARK_ROWS}
              dock={DARK_DOCK}
              dark
            />
          </div>
        </div>
        <Kicker style={{ fontSize: 11, marginTop: 30 }}>
          Every event, its own icon
        </Kicker>
        <div style={{ marginTop: 16 }}>
          <EventIcons size={64} gap={22} label={12} />
        </div>
      </div>
    </SlideRoot>
  );
}
