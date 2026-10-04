"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Wordmark } from "../marks";
import { BASE, ON, type Tone } from "../system";

/**
 * THE TOUCHPOINTS' OWN KIT: the furniture a page needs around the system's
 * parts (a browser window, a page drawn at its real width and scaled into
 * the slide, the site's nav, round actions and a few glyphs). The brand's
 * parts stay in `../system` and `../marks`; nothing here carries colour.
 *
 * ★ EVERY GLYPH HERE IS LINES AND TRIANGLES, NEVER A CIRCLE: in this system a
 * circle is a person, so even a window's three controls are left out rather
 * than drawn as three grey dots.
 */

/** A page drawn at its real width, scaled to fit the slide (type stays true to the page). */
export function Scaled({
  w,
  h,
  scale,
  children,
  className,
  style,
}: {
  /** The page's real size, px. */
  w: number;
  h: number;
  scale: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ width: w * scale, height: h * scale, ...style }}
    >
      <div
        className="absolute left-0 top-0"
        style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "0 0" }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * A BROWSER WINDOW, plain: a grey bar with the address in a pill and the page
 * under it. No coloured window controls (the chrome is grey) and no dots.
 */
export function BrowserShell({
  width,
  height,
  url,
  children,
  className,
  style,
}: {
  /** The window's outer width, slide px. */
  width: number;
  /** The page area's height, slide px (the bar adds its own). */
  height: number;
  url: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const bar = 34;
  return (
    <div
      className={cn("ev-browser", className)}
      style={{ width, height: height + bar, ...style }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          height: bar,
          backgroundColor: BASE.step.hex,
          borderBottom: `1px solid ${ON.paper.line}`,
        }}
      >
        <span
          className="ev-body flex items-center"
          style={{
            height: 22,
            padding: "0 14px",
            gap: 6,
            borderRadius: 6,
            fontSize: 11.5,
            color: BASE.muted.hex,
            backgroundColor: BASE.card.hex,
          }}
        >
          <LockGlyph />
          {url}
        </span>
      </div>
      <div className="relative overflow-hidden" style={{ height }}>
        {children}
      </div>
    </div>
  );
}

/* ── glyphs: lines and triangles ───────────────────────────────────────── */

export function LockGlyph({ size = 9, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 10 11.5" aria-hidden className="block shrink-0">
      <path d="M2.6 5V3.4a2.4 2.4 0 0 1 4.8 0V5" fill="none" stroke={color} strokeWidth={1.3} />
      <rect x={1} y={5} width={8} height={6} rx={1.2} fill={color} />
    </svg>
  );
}

export function Chevron({
  size = 10,
  dir = "down",
  color = "currentColor",
  weight = 1.5,
}: {
  size?: number;
  dir?: "down" | "left" | "right";
  color?: string;
  weight?: number;
}) {
  const d = dir === "down" ? "M2 4l4 4 4-4" : dir === "left" ? "M8 2L4 6l4 4" : "M4 2l4 4-4 4";
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden className="block shrink-0">
      <path d={d} fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlayGlyph({ size = 12, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden className="block shrink-0">
      <path d="M3 1.6v8.8c0 .5.5.8.9.5l6.6-4.4a.6.6 0 0 0 0-1L3.9 1.1c-.4-.3-.9 0-.9.5z" fill={color} />
    </svg>
  );
}

export function MenuGlyph({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden className="block shrink-0">
      <path d="M3 6.5h12M3 11.5h12" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function CopyGlyph({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden className="block shrink-0">
      <rect x={4.5} y={4.5} width={8} height={8} rx={1.6} fill="none" stroke={color} strokeWidth={1.4} />
      <path d="M9.5 2.6V2.4c0-.8-.6-1.4-1.4-1.4H2.4C1.6 1 1 1.6 1 2.4v5.7c0 .8.6 1.4 1.4 1.4h.2" fill="none" stroke={color} strokeWidth={1.4} />
    </svg>
  );
}

export function ShareGlyph({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden className="block shrink-0">
      <path d="M7 1.2v8M4 4.2l3-3 3 3" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 6.5H3c-.8 0-1.5.7-1.5 1.5v3.5c0 .8.7 1.5 1.5 1.5h8c.8 0 1.5-.7 1.5-1.5V8c0-.8-.7-1.5-1.5-1.5h-.5" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
}

export function PrintGlyph({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden className="block shrink-0">
      <path d="M3.5 4.5V1.5h7v3M3.5 10.5h-1A1.5 1.5 0 0 1 1 9V6a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 13 6v3a1.5 1.5 0 0 1-1.5 1.5h-1" fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
      <rect x={3.5} y={8} width={7} height={4.6} rx={0.6} fill="none" stroke={color} strokeWidth={1.4} />
    </svg>
  );
}

/** An include mark for a plan's list: the success glyph's shape, in ink (a fact, not a state). */
export function IncludeGlyph({ size = 12, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden className="block shrink-0" style={{ overflow: "visible" }}>
      <path d="M1.8 6.3 4.7 9.1 10.4 2.8" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="square" />
    </svg>
  );
}

/** A plan's limit mark: a short rule. */
export function LimitGlyph({ size = 12, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden className="block shrink-0">
      <path d="M2.5 6h7" stroke={color} strokeWidth={1.5} strokeLinecap="square" />
    </svg>
  );
}

/* ── actions: round, in the ground's own ink ───────────────────────────── */

/**
 * A ROUND ACTION (the house rule: sharp surfaces, round actions). `solid` is
 * the one call to act: ink on paper, paper in the room. Never a colour.
 */
export function Action({
  children,
  tone,
  solid = false,
  h = 44,
  font = 15,
  className,
  style,
  contrastLabel,
}: {
  children: ReactNode;
  tone: Tone;
  solid?: boolean;
  h?: number;
  font?: number;
  className?: string;
  style?: CSSProperties;
  contrastLabel?: string;
}) {
  const t = ON[tone];
  const fill = solid ? t.ink : tone === "paper" ? BASE.card.hex : t.card;
  const ink = solid ? t.ground : t.ink;
  return (
    <span
      className={cn("ev-action", className)}
      style={{
        height: h,
        paddingInline: Math.round(h * 0.48),
        gap: Math.round(h * 0.2),
        fontSize: font,
        backgroundColor: fill,
        color: ink,
        boxShadow: solid ? undefined : `inset 0 0 0 1px ${t.line}`,
        ...style,
      }}
    >
      <span data-bd-contrast={contrastLabel} className="flex items-center" style={{ gap: Math.round(h * 0.2) }}>
        {children}
      </span>
    </span>
  );
}

/* ── the site's nav ────────────────────────────────────────────────────── */

const LINKS = [
  { label: "Features", menu: true },
  { label: "Events", menu: true },
  { label: "Resources", menu: true },
  { label: "Pricing", menu: false },
] as const;

/**
 * THE SITE'S NAV at a desk: the wordmark (its full stop whoever is looking),
 * the four doors, Log in and the one call to act. `current` underlines nothing:
 * the page says where it is in its own words.
 */
export function SiteNav({
  tone,
  dot,
  w = 1440,
  pad = 56,
  h = 76,
  wordmark = 28,
}: {
  tone: Tone;
  dot: string;
  w?: number;
  pad?: number;
  h?: number;
  wordmark?: number;
}) {
  const t = ON[tone];
  return (
    <div className="relative flex items-center justify-between" style={{ width: w, height: h, paddingInline: pad }}>
      <Wordmark height={wordmark} tone={tone} dot={dot} read="wordmark in the nav" />
      <div
        className="ev-body absolute flex items-center"
        style={{ left: "50%", transform: "translateX(-50%)", gap: 34, fontSize: 15, color: t.ink }}
      >
        {LINKS.map((l) => (
          <span key={l.label} className="flex items-center" style={{ gap: 6, opacity: 0.82 }}>
            {l.label}
            {l.menu && <Chevron size={9} color={t.muted} />}
          </span>
        ))}
      </div>
      <div className="flex items-center" style={{ gap: 20 }}>
        <span className="ev-body" style={{ fontSize: 15, fontWeight: 500, color: t.ink }}>
          Log in
        </span>
        <Action tone={tone} solid h={40} font={14.5}>
          Start free
        </Action>
      </div>
    </div>
  );
}

/** The site's nav on a phone: the wordmark, the one call to act, the menu. */
export function SiteNavPhone({ tone, dot, w = 375 }: { tone: Tone; dot: string; w?: number }) {
  const t = ON[tone];
  return (
    <div className="flex items-center justify-between" style={{ width: w, height: 56, paddingInline: 20 }}>
      <Wordmark height={23} tone={tone} dot={dot} read="wordmark in the phone nav" />
      <div className="flex items-center" style={{ gap: 14 }}>
        <Action tone={tone} solid h={34} font={13.5}>
          Start free
        </Action>
        <MenuGlyph color={t.ink} />
      </div>
    </div>
  );
}

/** A phone's status bar (inside a drawn phone; a phone slide's own top is the deck's head). */
export function StatusBar({ tone, w = 375 }: { tone: Tone; w?: number }) {
  const c = ON[tone].ink;
  return (
    <div className="flex items-center justify-between" style={{ width: w, height: 50, padding: "14px 30px 0 34px" }}>
      <span className="ev-body ev-num" style={{ fontSize: 15, fontWeight: 600, color: c, letterSpacing: "-0.01em" }}>
        9:41
      </span>
      <svg width={64} height={12} viewBox="0 0 64 12" aria-hidden>
        <g fill={c}>
          <rect x={0} y={8} width={3} height={4} rx={0.8} />
          <rect x={5} y={6} width={3} height={6} rx={0.8} />
          <rect x={10} y={3.5} width={3} height={8.5} rx={0.8} />
          <rect x={15} y={1} width={3} height={11} rx={0.8} />
          <path d="M27 4.2a8.2 8.2 0 0 1 11 0l-1.3 1.4a6.3 6.3 0 0 0-8.4 0zM29.6 7a4.6 4.6 0 0 1 5.8 0l-2.9 3.2z" />
          <rect x={41} y={1} width={20} height={10} rx={2.6} fill="none" stroke={c} strokeOpacity={0.45} strokeWidth={1} />
          <rect x={42.8} y={2.8} width={14} height={6.4} rx={1.4} />
          <rect x={62} y={4.2} width={1.6} height={3.6} rx={0.6} fillOpacity={0.45} />
        </g>
      </svg>
    </div>
  );
}

/** A figure's caption on the slide: what the drawing is, small. */
export function Caption({
  children,
  tone,
  className,
  style,
}: {
  children: ReactNode;
  tone: Tone;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <p className={cn("ev-label", className)} style={{ color: ON[tone].muted, ...style }}>
      {children}
    </p>
  );
}
