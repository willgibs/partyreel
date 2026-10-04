"use client";

import type { ReactNode } from "react";

import type { SlideProps } from "../../deck/contract";
import type { PhotoId } from "../../deck/media";
import { AppIcon, TILE_PATH } from "../marks";
import { isDesk, Kicker, Pic, SlideGround } from "../slides/kit";
import { BASE, ON, PhoneShell } from "../system";
import { Caption, Scaled, StatusBar } from "./kit";

/**
 * 14 ON A HOME SCREEN. The party of three at its true size (60 pt) on a phone,
 * among neighbours that are plain tiles with plain marks (no real app, no
 * real logo), over a photograph, in daylight and in the dark. The tile to its
 * left carries a red badge, so the one test that matters is seen in one
 * glance: a badge is a flat red count; the party is three lit guests, parted
 * by their tile's own colour. They never read as each other.
 *
 * ★ THE ICON'S THREE LOOKS (a system extension, `AppIcon variant`), in the
 * phone's own names: dark (the display's near-black, the icon itself), light
 * (a paper tile, which the daylight phone wears) and tinted (every icon forced
 * to one hue, where the party must hold by its shape and its parts alone).
 */

type Tile = { name: string; fill: string; mark: "lines" | "grid" | "tri" | "wave" | "square" | "bars" | "chev" | "plus"; ink?: string; badge?: number };

/** The neighbours: plain tiles in the colours real home screens hold, each a plain mark. */
const NEIGHBOURS: Tile[] = [
  { name: "Tides", fill: "#2f6fd6", mark: "wave" },
  { name: "Ledger", fill: "#f4f4f6", mark: "lines", ink: "#3a3a40" },
  { name: "Pantry", fill: "#f29c38", mark: "grid" },
  { name: "Atlas", fill: "#3fae6a", mark: "tri" },
  { name: "Inbox", fill: "#4b8cf0", mark: "square", badge: 3 },
  { name: "Tempo", fill: "#1d1d21", mark: "bars" },
  { name: "Transit", fill: "#e9e2d4", mark: "chev", ink: "#5a4d36" },
  { name: "Studio", fill: "#7b5cf0", mark: "plus" },
  { name: "Garden", fill: "#9cc95a", mark: "lines" },
  { name: "Radio", fill: "#ef6a4f", mark: "wave" },
  { name: "Habit", fill: "#ffffff", mark: "grid", ink: "#3a3a40" },
  { name: "Books", fill: "#d97a2b", mark: "square" },
  { name: "Focus", fill: "#4a4a52", mark: "tri" },
  { name: "Canvas", fill: "#22a3b8", mark: "plus" },
  { name: "Field", fill: "#c9c9cf", mark: "bars", ink: "#2c2c31" },
];

/** Ours sits third in the second row, the badged neighbour on its left. */
const OURS_AT = 6;

function Mark({ kind, ink }: { kind: Tile["mark"]; ink: string }) {
  const s = { stroke: ink, strokeWidth: 6, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <g>
      {kind === "lines" && <path d="M34 42h32M34 54h32M34 66h20" {...s} />}
      {kind === "grid" && (
        <g fill={ink}>
          <rect x={32} y={32} width={15} height={15} rx={3} />
          <rect x={53} y={32} width={15} height={15} rx={3} />
          <rect x={32} y={53} width={15} height={15} rx={3} />
          <rect x={53} y={53} width={15} height={15} rx={3} />
        </g>
      )}
      {kind === "tri" && <path d="M50 32 70 66H30z" fill={ink} />}
      {kind === "wave" && <path d="M28 56c7-10 15-10 22 0s15 10 22 0" {...s} />}
      {kind === "square" && <rect x={31} y={36} width={38} height={28} rx={5} {...s} strokeWidth={5.5} />}
      {kind === "bars" && <path d="M36 66V50M50 66V36M64 66V44" {...s} />}
      {kind === "chev" && <path d="M38 34l16 16-16 16M52 34l16 16-16 16" {...s} strokeWidth={5.5} />}
      {kind === "plus" && <path d="M50 34v32M34 50h32" {...s} />}
    </g>
  );
}

/** A neighbour: the same continuous corner as ours, a flat fill, a plain mark, maybe a badge. */
function NeighbourIcon({ t, size }: { t: Tile; size: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden className="block">
        <g transform="scale(0.09765625)">
          <path d={TILE_PATH} fill={t.fill} />
        </g>
        <Mark kind={t.mark} ink={t.ink ?? "#ffffff"} />
      </svg>
      {t.badge !== undefined && (
        // The phone's own red light: a flat disc and its count, at the tile's top right.
        <span
          className="ev-badge"
          style={{ height: size * 0.39, minWidth: size * 0.39, fontSize: size * 0.25, right: -size * 0.14, top: -size * 0.14 }}
        >
          {t.badge}
        </span>
      )}
    </div>
  );
}

function Cell({ children, label, size, light }: { children: ReactNode; label: string; size: number; light: boolean }) {
  return (
    <div className="flex flex-col items-center" style={{ width: size + 20, gap: size * 0.1 }}>
      {children}
      <span className={light ? "ev-home-label ev-home-label-light" : "ev-home-label"} style={{ fontSize: size * 0.19 }}>
        {label}
      </span>
    </div>
  );
}

/** A home screen at its real width: a photograph, the status bar, four rows of four. */
function HomeScreen({
  w,
  h,
  photo,
  focus,
  light,
  read,
}: {
  w: number;
  h: number;
  photo: PhotoId;
  focus?: string;
  /** A light home screen: the icon's light look, and labels with a stronger shadow. */
  light: boolean;
  read?: string;
}) {
  const icon = 60;
  const margin = w >= 390 ? 27 : 24;
  const colGap = (w - margin * 2 - icon * 4) / 3;
  const cells: { t?: Tile; ours?: boolean }[] = [];
  let n = 0;
  for (let i = 0; i < 16; i++) {
    if (i === OURS_AT) cells.push({ ours: true });
    else cells.push({ t: NEIGHBOURS[n++] });
  }
  return (
    <div className="relative overflow-hidden" style={{ width: w, height: h }}>
      <Pic id={photo} focus={focus} style={{ position: "absolute", inset: 0, width: w, height: h, borderRadius: 0 }} />
      <div className="relative">
        {/* Both wallpapers are dark along their top edge, so the bar is light on both. */}
        <StatusBar tone="room" w={w} />
      </div>
      <div
        className="relative grid"
        style={{
          marginTop: 18,
          paddingInline: margin - 10,
          gridTemplateColumns: `repeat(4, ${icon + 20}px)`,
          columnGap: colGap - 20,
          rowGap: 22,
        }}
      >
        {cells.map((c, i) =>
          c.ours ? (
            <Cell key="ours" label="Partyreel" size={icon} light={light}>
              <AppIcon size={icon} variant={light ? "light" : "dark"} read={read} />
            </Cell>
          ) : (
            <Cell key={`${c.t!.name}-${i}`} label={c.t!.name} size={icon} light={light}>
              <NeighbourIcon t={c.t!} size={icon} />
            </Cell>
          ),
        )}
      </div>
    </div>
  );
}

/** The two tiles that matter, at twice their size: the badge, and the party beside it. */
function BesideBadge({ scale }: { scale: number }) {
  const inbox = NEIGHBOURS.find((t) => t.badge !== undefined)!;
  return (
    <div className="flex" style={{ gap: 33 * scale, padding: `${12 * scale}px 0 0 ${2 * scale}px` }}>
      <NeighbourIcon t={inbox} size={60 * scale} />
      <AppIcon size={60 * scale} read="the icon beside a badge, at 2x" />
    </div>
  );
}

/** The phone's three appearances, in its own names. */
const LOOKS: { v: "dark" | "light" | "tinted"; name: string }[] = [
  { v: "dark", name: "Dark" },
  { v: "light", name: "Light" },
  { v: "tinted", name: "Tinted" },
];

function Looks({ size, gap }: { size: number; gap: number }) {
  return (
    <div className="flex" style={{ gap }}>
      {LOOKS.map((l) => (
        <div key={l.v} className="flex flex-col items-start" style={{ gap: 10 }}>
          <div className={l.v === "light" ? "ev-icon-on-paper" : undefined} style={{ borderRadius: size * 0.225 }}>
            <AppIcon size={size} variant={l.v} read={`icon, ${l.name.toLowerCase()}`} />
          </div>
          <span className="ev-body" style={{ fontSize: 13, color: BASE.muted.hex }}>
            {l.name}
          </span>
        </div>
      ))}
    </div>
  );
}

const LINE = "A badge is the phone's flat red count. The party is three lit guests, parted by their tile.";

export function HomeScreenSlide({ screen }: SlideProps) {
  if (!isDesk(screen)) {
    return (
      <SlideGround tone="paper" screen={screen} pad={false}>
        <div style={{ height: 52 }} />
        <HomeScreen w={375} h={560} photo="concert-confetti" focus="50% 30%" light={false} read="icon at 60, on a phone" />
        <div style={{ padding: "26px 20px 0" }}>
          <Kicker tone="paper">Beside a badge, at 2×</Kicker>
          <div style={{ marginTop: 6 }}>
            <BesideBadge scale={2} />
          </div>
          <p className="ev-body" style={{ fontSize: 14.5, color: ON.paper.ink, marginTop: 18 }}>
            {LINE}
          </p>
          <Kicker tone="paper" style={{ marginTop: 30 }}>
            Three looks
          </Kicker>
          <div style={{ marginTop: 14 }}>
            <Looks size={92} gap={22} />
          </div>
        </div>
      </SlideGround>
    );
  }
  const pw = 393;
  return (
    <SlideGround tone="paper" screen={screen} pad={false} style={{ backgroundColor: BASE.step.hex }}>
      <div className="absolute" style={{ left: 80, top: 96 }}>
        <PhoneShell width={pw} tone="paper">
          <Scaled w={pw} h={852} scale={1}>
            <HomeScreen w={pw} h={852} photo="wedding-petals" focus="50% 40%" light read="icon at 60, daylight" />
          </Scaled>
        </PhoneShell>
      </div>
      <div className="absolute" style={{ left: 80 + pw + 24 + 36, top: 96 }}>
        <PhoneShell width={pw} tone="room">
          <Scaled w={pw} h={852} scale={1}>
            <HomeScreen w={pw} h={852} photo="concert-confetti" focus="50% 30%" light={false} read="icon at 60, in the dark" />
          </Scaled>
        </PhoneShell>
      </div>
      <div className="absolute" style={{ left: 1040, top: 104, width: 344 }}>
        <Kicker tone="paper">Beside a badge, at 2×</Kicker>
        <div style={{ marginTop: 8 }}>
          <BesideBadge scale={2} />
        </div>
        <p className="ev-body" style={{ fontSize: 15, color: ON.paper.ink, marginTop: 22 }}>
          {LINE}
        </p>
        <Kicker tone="paper" style={{ marginTop: 52 }}>
          Three looks
        </Kicker>
        <div style={{ marginTop: 16 }}>
          <Looks size={88} gap={24} />
        </div>
        <Caption tone="paper" style={{ marginTop: 40 }}>
          True size, 60 pt: light on the left, dark on the right
        </Caption>
      </div>
    </SlideGround>
  );
}
