"use client";

import { type CSSProperties, type ReactNode, useMemo } from "react";
import qrcode from "qrcode-generator";

import { seedsFrom } from "@/lib/avatar/gradient";
import { cn } from "@/lib/utils";

import { Photo, type PhotoId, Seeded } from "../../deck/media";
import { Wordmark } from "../marks";
import { Develop, Edge, EdgeArrow, type EdgeItem, GROUND, vars } from "../system";

/**
 * THE APPLIED KIT: what the six touchpoints (slides 9 to 14) share beyond the
 * system's own primitives (`system.tsx`, `marks.tsx`), each drawn in the
 * system's spirit: the window and the phone a page is shown in, the site's
 * nav and its close, the one action shape, a roll whose credits travel with
 * its frames, and the event's code developing into hers.
 *
 * ★ A PAGE IS DRAWN AT ITS OWN WIDTH AND SHOWN SMALLER. A desk page is laid
 * out at 1280 and a phone page at 375, and the window or the phone scales the
 * whole drawing (`Scaled`), so a sketch keeps a real viewport's proportions
 * rather than a layout invented for the slide's leftover room.
 */

/* ── showing a page ──────────────────────────────────────────────────────── */

/** A drawing laid out at `w` by `h`, shown at `scale` (the box takes the shown size). */
export function Scaled({
  w,
  h,
  scale,
  children,
  className,
  style,
}: {
  w: number;
  h: number;
  scale: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{ position: "relative", width: w * scale, height: h * scale, overflow: "hidden", ...style }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: w,
          height: h,
          transform: scale === 1 ? undefined : `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * A BROWSER WINDOW in the vision's paper: a quiet bar with the address, and
 * the page under it drawn at `page` px wide, scaled into the window. Its
 * ground is the page's own (paper, or the room for the reel).
 */
export function BrowserShell({
  w,
  h,
  url,
  page,
  ground = "paper",
  children,
  className,
  style,
}: {
  /** The window's outer size on the slide. */
  w: number;
  h: number;
  url: string;
  /** The page's own width in px, which the window scales down to `w`. */
  page: number;
  ground?: "paper" | "room";
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const bar = 34;
  const scale = w / page;
  return (
    <div className={cn("cs-browser", className)} style={{ width: w, height: h, ...style }}>
      <div className="cs-browser-bar" style={{ height: bar }}>
        <span className="cs-browser-dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className="cs-browser-url">{url}</span>
      </div>
      <div
        className="cs-browser-page"
        data-cs-ground={ground === "room" ? "room" : undefined}
        style={{ height: h - bar }}
      >
        <Scaled w={page} h={(h - bar) / scale} scale={scale}>
          {children}
        </Scaled>
      </div>
    </div>
  );
}

/** A phone's status bar, drawn plainly: the time, the signal, the battery. */
export function StatusBar({ room = false, time = "9:41" }: { room?: boolean; time?: string }) {
  return (
    <div className={cn("cs-statusbar", room && "cs-on-room")} aria-hidden>
      <span className="cs-statusbar-time">{time}</span>
      <span className="cs-statusbar-icons">
        <svg viewBox="0 0 18 12" width={17} height={11}>
          <rect x="0" y="8" width="3" height="4" rx="0.8" fill="currentColor" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" fill="currentColor" />
          <rect x="10" y="3" width="3" height="9" rx="0.8" fill="currentColor" />
          <rect x="15" y="0" width="3" height="12" rx="0.8" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 16 12" width={15} height={11}>
          <path d="M8 11.4 L5.6 8.8 A3.4 3.4 0 0 1 10.4 8.8 Z" fill="currentColor" />
          <path d="M3.4 6.6 A6.6 6.6 0 0 1 12.6 6.6" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" />
          <path d="M1.1 4.2 A9.8 9.8 0 0 1 14.9 4.2" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        </svg>
        <svg viewBox="0 0 27 13" width={25} height={12}>
          <rect x="0.6" y="0.6" width="22.6" height="11.8" rx="3.4" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.1" />
          <rect x="2.4" y="2.4" width="17.4" height="8.2" rx="2" fill="currentColor" />
          <path d="M24.6 4.4 v4.2 a2.1 2.1 0 0 0 0 -4.2 z" fill="currentColor" fillOpacity="0.4" />
        </svg>
      </span>
    </div>
  );
}

/* ── the one action shape ────────────────────────────────────────────────── */

export type PillTone = "ink" | "paper" | "line" | "room-line";

/**
 * THE ACTION: one shape for every button in the vision, a rounded bar about
 * twice as round as a surface (its radius 40 percent of its height), never a
 * capsule chip. Ink on paper is the primary; paper is the primary in the room;
 * a hairline is the second action. Never coloured: an action has no hue.
 */
export function Pill({
  children,
  tone = "ink",
  size = 15,
  lead,
  wide = false,
  className,
  style,
}: {
  children: ReactNode;
  tone?: PillTone;
  /** The label's size in px; the bar is about 2.7 times it. */
  size?: number;
  /** A small drawing before the label (a plus, a play). */
  lead?: ReactNode;
  wide?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cn("cs-pill cs-read", className)}
      data-cs-tone={tone}
      style={{
        height: Math.round(size * 2.7),
        padding: `0 ${Math.round(size * (lead ? 1.15 : 1.35))}px`,
        borderRadius: Math.round(size * 1.08),
        fontSize: size,
        gap: Math.round(size * 0.5),
        width: wide ? "100%" : undefined,
        ...style,
      }}
    >
      {lead}
      {children}
    </span>
  );
}

/** A plus, drawn on the label's line. */
export function PlusGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} aria-hidden style={{ flex: "none" }}>
      <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

/** A play triangle, for a reel's door. */
export function PlayGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 12 14" width={size} height={size * 1.15} aria-hidden style={{ flex: "none" }}>
      <path d="M1.2 1.4 L11 7 L1.2 12.6 Z" fill="currentColor" />
    </svg>
  );
}

/** A small chevron after a nav word that opens a menu. */
function Chevron() {
  return (
    <svg viewBox="0 0 10 6" width={9} height={6} aria-hidden style={{ opacity: 0.6 }}>
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── the site's nav and its close ────────────────────────────────────────── */

const NAV = [
  { label: "Features", menu: true },
  { label: "Events", menu: true },
  { label: "Resources", menu: true },
  { label: "Pricing", menu: false },
] as const;

/**
 * THE SITE'S NAV, on the page's own ground: the wordmark, four words, and
 * Start free as the one action. In the room the same words in room ink, the
 * action in paper. A phone keeps the wordmark, the action and a menu.
 */
export function SiteNav({
  layout,
  room = false,
  current,
}: {
  layout: "desk" | "phone";
  room?: boolean;
  current?: string;
}) {
  const desk = layout === "desk";
  return (
    <nav
      className={cn("cs-nav", room && "cs-on-room")}
      style={{
        height: desk ? 80 : 60,
        padding: desk ? "0 64px" : "0 16px",
      }}
    >
      <Wordmark height={desk ? 25 : 21} read={desk ? "wordmark, the nav" : undefined} />
      {desk && (
        <span className="cs-nav-words">
          {NAV.map((n) => (
            <span
              key={n.label}
              className="cs-read"
              data-cs-current={current === n.label ? "" : undefined}
            >
              {n.label}
              {n.menu && <Chevron />}
            </span>
          ))}
        </span>
      )}
      <span className="cs-nav-end">
        {desk && <span className="cs-read cs-nav-login">Log in</span>}
        <Pill tone={room ? "paper" : "ink"} size={desk ? 14 : 13}>
          Start free
        </Pill>
        {!desk && (
          <svg viewBox="0 0 20 14" width={20} height={14} aria-label="Menu" style={{ marginLeft: 6 }}>
            <path d="M1 3h18M1 11h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </span>
    </nav>
  );
}

/** The site's true facts, as its close prints them along the band. */
export const SITE_EDGE: EdgeItem[] = [
  "Partyreel",
  { text: "1A", dim: true },
  "partyreel.com",
  { text: "2026", dim: true },
];

/**
 * THE CLOSE: a page ends on its own ground, a thin band with the site's
 * edge knocked out of it, then the footer's words on the same paper (or the
 * same room). Never a chapter of another ground.
 */
export function SiteClose({ layout, room = false }: { layout: "desk" | "phone"; room?: boolean }) {
  const desk = layout === "desk";
  const cols = desk
    ? [
        ["Product", "Features", "Events", "Reel", "Pricing"],
        ["Resources", "Help", "Blog", "About"],
        ["Legal", "Terms", "Privacy"],
      ]
    : [
        ["Product", "Features", "Pricing"],
        ["Resources", "Help", "About"],
      ];
  return (
    <footer className={cn("cs-close", room && "cs-on-room")}>
      <Edge items={SITE_EDGE} band repeat={desk ? 6 : 3} size={desk ? 11 : 10} height={desk ? 26 : 24} />
      <div
        style={{
          display: "flex",
          gap: desk ? 72 : 36,
          padding: desk ? "30px 64px 34px" : "22px 16px 26px",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: desk ? "0 0 300px" : "none", display: desk ? "block" : "none" }}>
          <Wordmark height={20} />
          <p className="cs-read cs-muted" style={{ margin: "12px 0 0", fontSize: 13, lineHeight: "19px", maxWidth: 260 }}>
            The whole event, in one album.
          </p>
        </div>
        {cols.map(([head, ...items]) => (
          <div key={head} style={{ display: "grid", gap: 7 }}>
            <span className="cs-read" style={{ fontSize: 13, fontWeight: 600 }}>
              {head}
            </span>
            {items.map((t) => (
              <span key={t} className="cs-read cs-muted" style={{ fontSize: 13 }}>
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}

/* ── a roll that advances ────────────────────────────────────────────────── */

export type RollFrame = {
  readonly photo: PhotoId;
  readonly focus?: string;
  /** The frame number the edge prints under it. */
  readonly n: string;
  /** Who shot it (or, for a plan, whose album): a name and a seed for the dot. */
  readonly who?: { readonly name: string; readonly seed: string };
};

/**
 * A ROLL: the contact strip (`Strip`), built so it can advance. Each frame
 * carries its own rebate above it and its own credit under it, so the edge
 * travels with the film instead of standing still over a carousel. With
 * `advance`, the roll steps one frame at a time (the system's frame advance:
 * one crisp step, then the frame holds) through eight frames and starts over;
 * the run is drawn twice so the start and the end are the same picture.
 * `develop` raises the first frames from paper as the roll lands. At rest the
 * roll is still and every frame developed.
 */
export function RollStrip({
  frames,
  frameW,
  ratio = 3 / 2,
  gap = 6,
  edgeSize = 10,
  rebate,
  advance = false,
  develop,
  offset = 0,
  className,
  style,
}: {
  /** Eight frames when it advances (the cycle); any number when it is still. */
  frames: readonly RollFrame[];
  frameW: number;
  ratio?: number;
  gap?: number;
  edgeSize?: number;
  /** The rebate's words, a segment per frame, in turn (an event's edge cut in two). */
  rebate: readonly (readonly EdgeItem[])[];
  advance?: boolean;
  develop?: { delay?: number; duration?: number; count?: number };
  /** Px the run starts left of the strip's own edge (a strip bleeding in from the left). */
  offset?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const fh = Math.round(frameW / ratio);
  const rowTop = Math.round(edgeSize * 2.4);
  const rowBottom = Math.round(edgeSize * 2.6);
  const run = advance ? [...frames, ...frames] : frames;
  const devCount = develop?.count ?? 7;
  return (
    <div
      className={cn("cs-strip cs-roll", className)}
      style={{ overflow: "hidden", height: rowTop + fh + rowBottom, ...style }}
    >
      <div
        className={advance ? "cs-roll-run" : undefined}
        style={{
          display: "flex",
          gap,
          position: "absolute",
          top: 0,
          left: -offset,
          ...vars({ "--cs-step": `${frameW + gap}px` }),
        }}
      >
        {run.map((f, i) => {
          const image = <Photo id={f.photo} focus={f.focus} />;
          const devs = develop && i < devCount;
          return (
            <div key={`${f.n}-${i}`} style={{ width: frameW, flex: "none" }}>
              <div style={{ height: rowTop, display: "flex", alignItems: "center", overflow: "hidden" }}>
                <Edge items={rebate[i % rebate.length]} size={edgeSize} className="cs-edge-dim" />
              </div>
              <div className="cs-strip-frame" style={{ width: frameW, height: fh }}>
                {devs ? (
                  <Develop delay={(develop.delay ?? 200) + i * 140} duration={develop.duration ?? 1800}>
                    {image}
                  </Develop>
                ) : (
                  image
                )}
              </div>
              <div
                className="cs-edge"
                style={{ height: rowBottom, fontSize: edgeSize, gap: "0.55em" }}
                aria-label={`Frame ${f.n}${f.who ? `, ${f.who.name}` : ""}`}
              >
                <EdgeArrow />
                <span aria-hidden>{f.n}</span>
                {f.who && (
                  <span className="cs-edge-item" aria-hidden style={{ marginLeft: "0.5em" }}>
                    <Seeded seed={f.who.seed} className="cs-edge-dot" />
                    {f.who.name}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── the code, developing into hers ──────────────────────────────────────── */

type Grid = { n: number; dark: (r: number, c: number) => boolean };

function gridOf(value: string, version = 0): Grid {
  const q = qrcode(version as Parameters<typeof qrcode>[0], "Q");
  q.addData(value);
  q.make();
  return { n: q.getModuleCount(), dark: (r, c) => q.isDark(r, c) };
}

const WAVES = 12;

/**
 * THE CODE DEVELOPS: the event's real code comes up out of a sample code of
 * the same size, one cell at a time, the way Create hands it over. The two
 * share a version, so their finders and timing lines are the same modules and
 * hold still while only the cells that differ turn, in twelve stepped waves
 * (a stepped turn reads as deliberate, a fade as a loading state). It plays
 * once as the hub first opens; at rest, and under reduced motion, it is
 * simply her code, and it scans.
 */
export function DevelopingCode({
  value,
  sample = "https://partyreel.com/e/a-sample-album",
  size,
  color = GROUND.ink.hex,
  delay = 900,
  duration = 1900,
  read,
}: {
  value: string;
  sample?: string;
  size: number;
  color?: string;
  delay?: number;
  duration?: number;
  read?: string;
}) {
  const { n, still, arrive, leave } = useMemo(() => {
    const hers = gridOf(value);
    const version = (hers.n - 17) / 4;
    let from: Grid;
    try {
      from = gridOf(sample, version);
    } catch {
      from = hers;
    }
    const still: [number, number][] = [];
    const arrive: [number, number][][] = Array.from({ length: WAVES }, () => []);
    const leave: [number, number][][] = Array.from({ length: WAVES }, () => []);
    for (let r = 0; r < hers.n; r++)
      for (let c = 0; c < hers.n; c++) {
        const a = from.dark(r, c);
        const b = hers.dark(r, c);
        if (a && b) still.push([r, c]);
        else if (a || b) {
          const [w] = seedsFrom(`cell:${r}:${c}`, 1);
          const wave = Math.min(WAVES - 1, Math.floor(w * WAVES));
          (b ? arrive : leave)[wave].push([r, c]);
        }
      }
    return { n: hers.n, still, arrive, leave };
  }, [value, sample]);
  const layer = (cells: [number, number][], key: string, cls?: string, wave?: number) => (
    <svg
      key={key}
      viewBox={`0 0 ${n} ${n}`}
      width={size}
      height={size}
      className={cls}
      style={{
        position: "absolute",
        inset: 0,
        ...(wave != null
          ? vars({ "--cs-code-delay": `${delay + Math.round((wave * duration) / WAVES)}ms` })
          : {}),
      }}
      fill={color}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {cells.map(([r, c]) => (
        <rect key={`${r}-${c}`} x={c} y={r} width={1.02} height={1.02} />
      ))}
    </svg>
  );
  return (
    <div
      role="img"
      aria-label={`A code for ${value}`}
      style={{ position: "relative", width: size, height: size }}
      data-bd-read={read}
    >
      {layer(still, "still")}
      {arrive.map((cells, w) => layer(cells, `in-${w}`, "cs-code-in", w))}
      {leave.map((cells, w) => layer(cells, `out-${w}`, "cs-code-out", w))}
    </div>
  );
}

/* ── small pieces ────────────────────────────────────────────────────────── */

/** A person's seeded light, as a round avatar with an optional ring of paper. */
export function Orb({ seed, size, ring = false, style }: { seed: string; size: number; ring?: boolean; style?: CSSProperties }) {
  return (
    <Seeded
      seed={seed}
      style={{
        width: size,
        height: size,
        flex: "none",
        boxShadow: ring ? `0 0 0 2px ${GROUND.paper.hex}` : undefined,
        ...style,
      }}
    />
  );
}
