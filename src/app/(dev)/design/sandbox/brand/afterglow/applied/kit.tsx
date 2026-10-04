"use client";

import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { MARKETING_REELS } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { type PhotoId, Reel, type ReelId } from "../../deck/media";
import { Wordmark } from "../marks";
import { ink } from "../root";
import {
  chromaOf,
  conicOf,
  EDGE,
  type Ground,
  GROUND,
  lampTone,
  type Light,
  lightOfPhoto,
  LitPhoto,
  PhoneShell,
  Readout,
  type RegisterId,
  SAMPLED,
  Seam,
} from "../system";

/**
 * THE APPLIED KIT: what the six touchpoints share, composed from the system's
 * own primitives (`system.tsx`) and never re-inventing one.
 *
 * ★ A PAGE IS DRAWN AT ITS OWN SIZE, THEN SHOWN AT THE SLIDE'S. A desk page is
 * laid out at 1440 by 900 and a phone page at 375 wide, at their real type
 * sizes, and `Scaled` shrinks the whole drawing into a browser or a phone on a
 * slide, the way a screenshot would. So the phone slide draws the very same
 * phone page at 1:1, and the desk slide shows it in a phone beside the desk.
 *
 * ★ TWO ADDITIONS, IN THE SYSTEM'S SPIRIT (both said in the report):
 * `ReelLight`, a Bloom that answers its reel, taking each shot's own light as
 * the reel cuts (the study's "aurora that answers"); and `WallSeam`, a Seam
 * born in place under a wall of photographs, each photograph's light directly
 * beneath it in its own edge's colours.
 */

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/* ── a drawing at its own size, shown at the slide's ───────────────────────── */

/**
 * A page drawn at `w` wide (its view `view` tall, its whole length `page`),
 * shown at `scale`, scrolled down by `scroll` of its own px.
 */
export function Scaled({
  w,
  view,
  page,
  scale,
  scroll = 0,
  children,
  className,
  style,
}: {
  w: number;
  view: number;
  page?: number;
  scale: number;
  scroll?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ width: Math.round(w * scale), height: Math.round(view * scale), ...style }}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          width: w,
          height: page ?? view,
          transform: `scale(${scale}) translateY(${-scroll}px)`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── a browser window, neutral ─────────────────────────────────────────────── */

/**
 * A browser window with no maker's marks: three grey points and the address,
 * the chrome in the page's own ground family, so the page is the subject.
 */
export function BrowserWindow({
  width,
  ground,
  url = "partyreel.com",
  pageW = 1440,
  viewH = 900,
  pageH,
  scroll,
  children,
  className,
  style,
}: {
  width: number;
  ground: Ground;
  url?: string;
  pageW?: number;
  viewH?: number;
  pageH?: number;
  scroll?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const scale = width / pageW;
  const bar = Math.round(Math.max(18, width * 0.032));
  return (
    <div
      className={cn("ag-browser", className)}
      data-ground={ground}
      style={{ width, borderRadius: Math.max(6, Math.round(width * 0.011)), ...style }}
    >
      <div
        className="ag-browser-bar"
        style={{ height: bar, fontSize: Math.max(7, Math.round(bar * 0.36)) }}
      >
        <span className="ag-browser-dots" style={{ gap: bar * 0.2, left: bar * 0.42 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: bar * 0.24, height: bar * 0.24 }} />
          ))}
        </span>
        <span
          className="ag-browser-url"
          style={{ height: bar * 0.62, paddingInline: bar * 0.6, width: bar * 9 }}
        >
          {url}
        </span>
      </div>
      <Scaled w={pageW} view={viewH} page={pageH} scale={scale} scroll={scroll}>
        {children}
      </Scaled>
    </div>
  );
}

/* ── a phone, with its page inside ────────────────────────────────────────── */

/** The status bar a phone page sits under: the time, the radios, the island. */
export function StatusBar({ ground }: { ground: Ground }) {
  const c = ground === "room" ? "#f5f5f6" : "#0d0d0f";
  return (
    <div
      className="absolute inset-x-0 top-0"
      style={{ height: 54, background: GROUND[ground].hex, color: c }}
    >
      <span
        className="absolute"
        style={{ left: 34, top: 18, fontSize: 15.5, fontWeight: 600, letterSpacing: "-0.01em" }}
      >
        9:41
      </span>
      <span
        className="absolute rounded-full"
        style={{ left: 127, top: 11, width: 121, height: 34, background: "#000" }}
      />
      <svg
        aria-hidden
        className="absolute"
        style={{ right: 26, top: 21 }}
        width={68}
        height={13}
        viewBox="0 0 68 13"
        fill={c}
      >
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 5} y={9 - i * 2.6} width={3.2} height={3.4 + i * 2.6} rx={0.8} />
        ))}
        <path
          d="M31.5 3.2a8.6 8.6 0 0 1 11 0l-1.3 1.4a6.7 6.7 0 0 0-8.4 0zM34 5.9a5 5 0 0 1 6 0l-1.3 1.4a3.1 3.1 0 0 0-3.4 0zM36.4 8.6a1.2 1.2 0 0 1 1.2 0L37 11z"
        />
        <rect x={45.5} y={1.5} width={19} height={10} rx={2.6} fill="none" stroke={c} strokeOpacity={0.45} />
        <rect x={47.2} y={3.2} width={15.6} height={6.6} rx={1.4} />
        <rect x={65.4} y={4.6} width={1.6} height={3.8} rx={0.8} fillOpacity={0.45} />
      </svg>
    </div>
  );
}

/**
 * A phone on a slide with a phone page in it: the system's `PhoneShell`, the
 * page drawn at 375 and shrunk to the screen, and the status bar held still
 * while the page scrolls under it.
 */
export function PhoneView({
  width = 300,
  ground,
  viewH = 812,
  pageH,
  scroll = 0,
  children,
  className,
  style,
}: {
  width?: number;
  ground: Ground;
  viewH?: number;
  pageH?: number;
  scroll?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const bezel = Math.round(width * 0.03);
  const inner = width - 2 * bezel;
  const s = inner / 375;
  const height = Math.round(viewH * s) + 2 * bezel;
  return (
    <PhoneShell width={width} height={height} ground={ground} className={className} style={style}>
      <Scaled w={375} view={viewH} page={pageH} scale={s} scroll={scroll}>
        {children}
      </Scaled>
      <Scaled w={375} view={54} scale={s} className="!absolute top-0 left-0">
        <StatusBar ground={ground} />
      </Scaled>
    </PhoneShell>
  );
}

/* ── controls: achromatic, never lit ───────────────────────────────────────── */

const BTN = {
  lg: { h: 52, px: 26, f: 17 },
  md: { h: 44, px: 20, f: 15 },
  sm: { h: 34, px: 15, f: 13.5 },
} as const;

/**
 * A pill. The primary is the ground's opposite (a paper pill in the room, an
 * ink pill on paper); the secondary is a quiet outline. Never a light's fill.
 */
export function Btn({
  ground,
  kind = "primary",
  size = "md",
  icon,
  wide = false,
  children,
  style,
}: {
  ground: Ground;
  kind?: "primary" | "secondary";
  size?: keyof typeof BTN;
  icon?: ReactNode;
  wide?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const b = BTN[size];
  return (
    <span
      className="ag-btn"
      data-ground={ground}
      data-kind={kind}
      style={{
        height: b.h,
        paddingInline: b.px,
        fontSize: b.f,
        width: wide ? "100%" : undefined,
        gap: Math.round(b.f * 0.45),
        ...style,
      }}
    >
      {icon}
      {children}
    </span>
  );
}

/* ── small glyphs, drawn ───────────────────────────────────────────────────── */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function Glyph({
  name,
  size = 16,
  weight = 1.8,
  style,
}: {
  name: "chevron" | "menu" | "plus" | "check" | "dash" | "copy" | "share" | "print" | "back" | "play" | "down";
  size?: number;
  weight?: number;
  style?: CSSProperties;
}) {
  const d: Record<typeof name, ReactNode> = {
    chevron: <path d="M6 9l6 6 6-6" />,
    down: <path d="M6 9l6 6 6-6" />,
    back: <path d="M15 5l-7 7 7 7" />,
    menu: <path d="M4 9h16M4 15h16" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    dash: <path d="M7 12h10" />,
    copy: (
      <>
        <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
        <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
      </>
    ),
    share: <path d="M12 15V4M8 8l4-4 4 4M6 12v6.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V12" />,
    print: (
      <>
        <path d="M7 9V4h10v5M7 17H5.5A1.5 1.5 0 0 1 4 15.5v-5A1.5 1.5 0 0 1 5.5 9h13a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H17" />
        <path d="M7 14h10v6H7z" />
      </>
    ),
    play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />,
  };
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} strokeWidth={weight} {...stroke} style={{ flexShrink: 0, ...style }}>
      {d[name]}
    </svg>
  );
}

/* ── the site's nav and foot: the wordmark alone, the page's own ground ───── */

const LINKS = [
  ["Features", true],
  ["Events", true],
  ["Resources", true],
  ["Pricing", false],
] as const;

/** The marketing nav, desk (drawn at 1440) or phone (at 375, under its status bar). */
export function SiteNav({
  ground,
  screen,
  active,
}: {
  ground: Ground;
  screen: "desk" | "phone";
  active?: (typeof LINKS)[number][0];
}) {
  const t = ink(ground);
  if (screen === "phone")
    return (
      <div className="absolute inset-x-0 flex items-center justify-between" style={{ top: 54, height: 56, paddingInline: 20 }}>
        <Wordmark height={18} color={t.fg} read="wordmark in the phone's nav" />
        <span className="flex items-center" style={{ gap: 14 }}>
          <Btn ground={ground} size="sm">
            Start free
          </Btn>
          <Glyph name="menu" size={22} weight={1.9} style={{ color: t.fg }} />
        </span>
      </div>
    );
  return (
    <div className="absolute inset-x-0 top-0 flex items-center justify-between" style={{ height: 80, paddingInline: 72 }}>
      <Wordmark height={23} color={t.fg} read="wordmark in the nav" />
      <span className="absolute flex items-center" style={{ left: "50%", transform: "translateX(-50%)", gap: 34 }}>
        {LINKS.map(([name, menu]) => (
          <span
            key={name}
            className="flex items-center"
            style={{ gap: 5, fontSize: 15, fontWeight: 500, color: name === active ? t.fg : t.muted }}
          >
            {name}
            {menu ? <Glyph name="chevron" size={13} weight={2} /> : null}
          </span>
        ))}
      </span>
      <span className="flex items-center" style={{ gap: 22 }}>
        <span style={{ fontSize: 15, fontWeight: 500 }}>Log in</span>
        <Btn ground={ground} size="sm">
          Start free
        </Btn>
      </span>
    </div>
  );
}

const FOOT = [
  ["Product", ["Features", "Events", "The reel", "Pricing"]],
  ["Learn", ["Help", "Blog"]],
  ["Partyreel", ["About", "Privacy", "Terms"]],
] as const;

/**
 * THE FOOT: the page's own ground to the end (never an ink slab), its top
 * edge lit by a Seam of `light` (the page's photographs, else the house five),
 * the wordmark alone, then the site's own thesis.
 */
export function SiteFooter({
  ground,
  screen,
  light,
  height,
  style,
}: {
  ground: Ground;
  screen: "desk" | "phone";
  light: Light;
  height: number;
  style?: CSSProperties;
}) {
  const t = ink(ground);
  const desk = screen === "desk";
  const rule = ground === "room" ? "rgb(255 255 255 / 0.07)" : "rgb(20 20 22 / 0.08)";
  return (
    <footer
      className="absolute inset-x-0"
      style={{ height, background: GROUND[ground].hex, color: t.fg, borderTop: `1px solid ${rule}`, ...style }}
    >
      {/* Quieter than the opener's light: a page opens lit and ramps down. */}
      <Seam
        light={light}
        ground={ground}
        reach={desk ? (ground === "room" ? 130 : 56) : ground === "room" ? 88 : 48}
        strength={ground === "room" ? 0.5 : 0.8}
      />
      <div
        className="relative"
        style={{ paddingInline: desk ? 96 : 20, paddingTop: desk ? 140 : ground === "room" ? 92 : 60 }}
      >
        <div className={desk ? "flex items-start justify-between" : "flex flex-col"} style={{ gap: desk ? 40 : 30 }}>
          <div>
            <Wordmark height={desk ? 24 : 20} color={t.fg} read={`wordmark in the ${ground === "room" ? "room's" : "paper"} foot`} />
            <p className="ag-subtitle" style={{ fontSize: desk ? 22 : 19, marginTop: desk ? 18 : 14, color: t.fg }}>
              The whole event, in one album.
            </p>
          </div>
          <div className="flex" style={{ gap: desk ? 72 : 36 }}>
            {FOOT.map(([head, links]) => (
              <div key={head} className="flex flex-col" style={{ gap: desk ? 9 : 8 }}>
                <Readout style={{ color: t.faint, marginBottom: 2 }}>{head}</Readout>
                {links.slice(0, desk ? 4 : 2).map((l) => (
                  <span key={l} style={{ fontSize: desk ? 14.5 : 13.5, color: t.muted }}>
                    {l}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div
          className="flex items-center justify-between"
          style={{ marginTop: desk ? 44 : 30, paddingTop: 16, borderTop: `1px solid ${rule}`, fontSize: 12.5, color: t.faint }}
        >
          <span>© 2026 Partyreel</span>
          <span>No app required</span>
        </div>
      </div>
    </footer>
  );
}

/* ── the slide's own note: what the touchpoint proves ──────────────────────── */

export function Note({
  ground,
  label,
  children,
  width,
  className,
  style,
}: {
  ground: Ground;
  label: string;
  children: ReactNode;
  width?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const t = ink(ground);
  return (
    <div className={className} style={{ width, ...style }}>
      <Readout style={{ color: t.faint }}>{label}</Readout>
      <p className="ag-body" style={{ fontSize: 15, lineHeight: 1.5, color: t.muted, marginTop: 8 }}>
        {children}
      </p>
    </div>
  );
}

/* ── the reel's own light, answering each shot ─────────────────────────────── */

/**
 * ONE CLOCK FOR A SLIDE'S REELS: the first reel to mount leads, and any other
 * copy of it on the slide (the same page in a phone beside a desk) follows its
 * time, so the two screens play one moment and wear one light.
 */
class ReelLead {
  private v: HTMLVideoElement | null = null;
  private followers = new Set<HTMLVideoElement>();
  /** The first to join leads; the rest follow. Says whether it leads. */
  join(v: HTMLVideoElement) {
    if (!this.v) {
      this.v = v;
      return true;
    }
    this.followers.add(v);
    return false;
  }
  leave(v: HTMLVideoElement) {
    if (this.v === v) this.v = null;
    this.followers.delete(v);
  }
  /**
   * The leader's time, pushed to every follower on each of its ticks: a
   * follower the browser never started (an autoplay it held back) is still
   * brought to the leader's moment, and started if the leader plays.
   */
  tick(v: HTMLVideoElement) {
    if (v !== this.v) return;
    for (const f of this.followers) {
      if (Math.abs(f.currentTime - v.currentTime) > 0.35) f.currentTime = v.currentTime;
      if (f.paused && !v.paused) void f.play().catch(() => undefined);
    }
  }
}

const ReelSync = createContext<ReelLead | null>(null);

export function ReelClock({ children }: { children: ReactNode }) {
  const [lead] = useState(() => new ReelLead());
  return <ReelSync.Provider value={lead}>{children}</ReelSync.Provider>;
}

/**
 * THE BLOOM THAT ANSWERS (an addition): the reel in its Bloom, the Bloom
 * taking each shot's own light (the shot's photograph, sampled) as the reel
 * cuts to it, crossfading on the cut. It never loops on its own clock: it is
 * the reel's light, so it changes only when the picture does. Under reduced
 * motion the reel rests on its poster and the light on its first shot's.
 */
export function ReelLight({
  reel,
  ground = "room",
  blur,
  spread = 6,
  radius = 2,
  rest = 0.92,
  focus,
  className,
  style,
}: {
  reel: ReelId;
  ground?: Ground;
  blur: number;
  spread?: number;
  radius?: number;
  rest?: number;
  focus?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const meta = MARKETING_REELS.find((r) => r.id === reel) ?? MARKETING_REELS[0];
  const register: RegisterId = ground === "paper" ? "paper" : "room";
  const conics = useMemo(
    () => meta.recipe.clipIds.map((id) => conicOf(lightOfPhoto(id as PhotoId), register)),
    [meta, register],
  );
  const box = useRef<HTMLDivElement | null>(null);
  const [shot, setShot] = useState(0);
  const sync = useContext(ReelSync);
  useEffect(() => {
    const el = box.current;
    const v = el?.querySelector("video");
    if (!el || !v) return;
    sync?.join(v);
    const bounds = meta.shotBoundaries;
    const read = () => {
      sync?.tick(v);
      let i = 0;
      for (let k = 0; k < bounds.length; k++) if (v.currentTime >= bounds[k]) i = k;
      setShot(i);
    };
    v.addEventListener("timeupdate", read);
    v.addEventListener("seeked", read);
    // The deck stops a hidden option's loops by pausing its CSS; its reel
    // stops with it, so three decks never decode at once.
    const slide = el.closest("[data-bd-slide]");
    const still = el.ownerDocument.defaultView?.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mo = slide
      ? new MutationObserver(() => {
          if (slide.hasAttribute("data-bd-paused")) v.pause();
          else if (!still) void v.play().catch(() => undefined);
        })
      : null;
    if (slide) mo?.observe(slide, { attributes: true, attributeFilter: ["data-bd-paused"] });
    return () => {
      v.removeEventListener("timeupdate", read);
      v.removeEventListener("seeked", read);
      mo?.disconnect();
      sync?.leave(v);
    };
  }, [meta, sync]);
  const vars: Vars = {
    "--ag-spread": `${spread}px`,
    "--ag-blur": `${blur}px`,
    "--ag-radius": `${radius}px`,
    ...style,
  };
  return (
    <div ref={box} className={cn("ag-ambient", className)} data-ground={ground} style={vars}>
      <div aria-hidden className="ag-ambient-lights">
        {conics.map((c, i) => (
          <div
            key={i}
            className="ag-ambient-light"
            style={{ background: c, opacity: i === shot ? rest : 0 }}
          />
        ))}
      </div>
      <div className="ag-photo size-full" data-ground={ground}>
        <Reel id={reel} style={focus ? { objectPosition: focus } : undefined} />
      </div>
    </div>
  );
}

/* ── a wall of photographs, and the Seam born in place under it ────────────── */

export type Tile = { id: PhotoId; x: number; y: number; w: number; h: number; focus?: string };
export type RowSpec = readonly { id: PhotoId; a: number; focus?: string }[];

/** A justified row: every photograph at its own width, one height, edge to edge. */
export function justify(row: RowSpec, width: number, gap: number, y = 0, x0 = 0) {
  const sum = row.reduce((s, t) => s + t.a, 0);
  const h = (width - gap * (row.length - 1)) / sum;
  let x = x0;
  const tiles: Tile[] = row.map((t) => {
    const w = t.a * h;
    const tile = { id: t.id, x, y, w, h, focus: t.focus };
    x += w + gap;
    return tile;
  });
  return { h, tiles };
}

/** Rows stacked: the wall, and the bottom row the Seam is born under. */
export function wallOf(rows: readonly RowSpec[], width: number, gap: number) {
  let y = 0;
  const all: Tile[] = [];
  let last: Tile[] = [];
  for (const r of rows) {
    const j = justify(r, width, gap, y);
    all.push(...j.tiles);
    last = j.tiles;
    y += j.h + gap;
  }
  return { tiles: all, bottom: last, height: y - gap };
}

export function Wall({ tiles, ground = "room" }: { tiles: readonly Tile[]; ground?: Ground }) {
  return (
    <>
      {tiles.map((t) => (
        <LitPhoto
          key={`${t.id}-${Math.round(t.x)}-${Math.round(t.y)}`}
          id={t.id}
          focus={t.focus}
          ground={ground}
          style={{ position: "absolute", left: t.x, top: t.y, width: t.w, height: t.h }}
        />
      ))}
    </>
  );
}

/**
 * THE SEAM, IN PLACE (an addition): light born under a wall of photographs,
 * each photograph's own bottom edge (`EDGE`, sampled segment by segment)
 * directly beneath it, pooled under each photograph rather than in the
 * system Seam's three fixed pools, its source line broken where the wall's
 * gaps are. Mount it as the first child of a `relative` box set at the
 * wall's foot, as wide as the wall.
 */
export function WallSeam({
  tiles,
  width,
  ground = "room",
  reach,
  strength = 1,
  style,
}: {
  tiles: readonly Tile[];
  width: number;
  ground?: Ground;
  reach?: number;
  strength?: number;
  style?: CSSProperties;
}) {
  const paper = ground === "paper";
  const stops = (reg: RegisterId) =>
    tiles.flatMap((t) => {
      const hues = EDGE[t.id]?.bottom ?? SAMPLED[t.id].map((x) => x.h);
      const c = chromaOf(t.id);
      return hues.map((h, k) => {
        const at = ((t.x + ((k + 0.5) * t.w) / hues.length) / width) * 100;
        return `${lampTone({ h, w: 1, c }, reg).oklch} ${at.toFixed(2)}%`;
      });
    });
  const band = (reg: RegisterId) => `linear-gradient(90deg in oklab, ${stops(reg).join(", ")})`;
  // Each photograph's pool, plus one short rim along the whole edge: the edge
  // itself is lit end to end, and each photograph carries its light further.
  const pools = [
    ...tiles.map(
      (t) =>
        `radial-gradient(${Math.round(t.w * 0.74)}px 100% at ${Math.round(t.x + t.w / 2)}px 0px, rgb(0 0 0 / 0.9) 0%, rgb(0 0 0 / 0.38) 20%, rgb(0 0 0 / 0.08) 50%, transparent 84%)`,
    ),
    "linear-gradient(to bottom, rgb(0 0 0 / 0.55) 0%, rgb(0 0 0 / 0.14) 16%, transparent 34%)",
  ].join(", ");
  const lines = tiles
    .map(
      (t) =>
        `linear-gradient(90deg, transparent ${Math.round(t.x)}px, #000 ${Math.round(t.x + 8)}px, #000 ${Math.round(t.x + t.w - 8)}px, transparent ${Math.round(t.x + t.w)}px)`,
    )
    .join(", ");
  return (
    <div
      aria-hidden
      className="ag-wallseam"
      data-ground={ground}
      style={{ height: reach ?? (paper ? 56 : 120), ...style }}
    >
      <div
        className="ag-wallseam-light"
        style={{
          background: band(paper ? "paperSeam" : "roomSeam"),
          opacity: strength * (paper ? 1 : 0.95),
          WebkitMaskImage: pools,
          maskImage: pools,
        }}
      />
      <div
        className="ag-wallseam-line"
        style={{
          background: band(paper ? "paperLine" : "roomLine"),
          WebkitMaskImage: lines,
          maskImage: lines,
        }}
      />
    </div>
  );
}

