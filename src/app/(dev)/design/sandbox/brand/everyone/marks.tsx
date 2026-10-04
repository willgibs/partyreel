"use client";

import { type CSSProperties, useId, useMemo } from "react";

import { hex, meshDepths } from "@/lib/avatar/gradient";
import { cn } from "@/lib/utils";

import { BASE, CROWD, ON, Orb, orbOf, type Tone } from "./system";

/**
 * THE MARKS: the wordmark and the app icon, drawn as SVG and sized by props.
 *
 * ★ THE WORDMARK IS A WORD AND A PERSON. "partyreel" in lowercase (no letter
 * stands taller than the rest), set in Bricolage Grotesque ExtraBold, and its
 * full stop is an orb: a guest, the plus one every Partyreel arrives with.
 * The dot is seeded, so it can be whoever is looking (a fresh colour on the
 * marketing site, your own once you sign in, the host's on their event); in
 * print and wherever nobody is, it is a house guest.
 *
 * ★ SET, NOT YET OUTLINED (this round's allowance): the letters are the
 * loaded face, placed glyph by glyph at origins measured off the face itself
 * (the prefix advances below, kerning included, at 100 units), so the orb's
 * place is arithmetic rather than a guess, and a later outline replaces only
 * the `<text>`. The brand-marks board outlines and finishes the drawing.
 *
 * ★ THE ICON IS A PARTY OF THREE: three house guests, gathered as people stand
 * for a photograph, two behind and one in front, each parted from the next by
 * the tile's own colour (the guest row's ring). Drawn in the orb's own
 * material (the mesh, as SVG gradients), on the display's near-black, with the
 * light edge on its top bevel.
 */

/* ── shared: an orb in SVG ─────────────────────────────────────────────── */

const svgId = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, "");

/**
 * One person as SVG: production's `mesh`, layer for layer, as four circles
 * filled with gradients and composited with the same blend modes, inside an
 * isolated group so the blends only see the orb.
 */
export function OrbSvg({
  seed,
  cx,
  cy,
  r,
  id,
  simple = false,
}: {
  seed: string;
  cx: number;
  cy: number;
  r: number;
  id: string;
  /** Two layers instead of four, for a 29 px icon. */
  simple?: boolean;
}) {
  const o = orbOf(seed);
  const { primary, secondaryDark, secondaryMid } = meshDepths(o);
  const lx = o.light.x / 100;
  const ly = o.light.y / 100;
  const p = hex(primary);
  const dk = hex(secondaryDark);
  const md = hex(secondaryMid);
  const body = hex(o.body);
  return (
    <g style={{ isolation: "isolate" }}>
      <defs>
        <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p} />
          <stop offset="1" stopColor={body} />
        </linearGradient>
        <radialGradient id={`${id}-mid`} cx="0.5" cy="0.62" r="1.5">
          <stop offset="0" stopColor={md} />
          <stop offset="0.72" stopColor={md} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-dark`} cx={1 - lx} cy={1 - ly} r="1.16">
          <stop offset="0" stopColor={dk} />
          <stop offset="0.64" stopColor={dk} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-lit`} cx={lx} cy={ly} r="1.2">
          <stop offset="0" stopColor={p} />
          <stop offset="0.58" stopColor={p} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-base)`} />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-mid)`} />
      {!simple && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={`url(#${id}-dark)`}
          style={{ mixBlendMode: "soft-light" }}
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={`url(#${id}-lit)`}
        style={{ mixBlendMode: "overlay" }}
      />
    </g>
  );
}

/* ── the wordmark ──────────────────────────────────────────────────────── */

/**
 * The face's own geometry at 100 units (Bricolage Grotesque 800, opsz 96),
 * measured in the frame: each glyph's origin with kerning (prefix advances),
 * the x-height, the ascender and the last letter's ink.
 */
const WORD = "partyreel";
const PREFIX = [0, 57.4, 111.5, 151.5, 188.9, 242.8, 282.8, 335.3, 389.0];
const INK_LEFT = 3.6; // the p's left side bearing
const L_INK_RIGHT = 19.8; // the l's ink, from its origin
const X_HEIGHT = 52.8;
const ASCENDER = 70;
const DESCENDER = 15.6;

/** Tracking per gap, in units (-3.5 = -0.035em): tight, never touching. */
const TRACK = -3.5;
/** The orb: 0.57 of the x-height, a letter's gap from the l, on the baseline. */
const DOT = X_HEIGHT * 0.57;
const DOT_GAP = 6.5;

const origins = PREFIX.map((x, i) => x + i * TRACK - INK_LEFT);
const L_RIGHT = origins[8] + L_INK_RIGHT;
const DOT_CX = L_RIGHT + DOT_GAP + DOT / 2;
const WM_W = DOT_CX + DOT / 2;
const BASELINE = ASCENDER;
const WM_H = ASCENDER + DESCENDER;

/** The wordmark's drawn aspect (width over height, descender included). */
export const WORDMARK_ASPECT = WM_W / WM_H;
/** Where the x-height sits, as a share of the wordmark's height. */
export const WORDMARK_X_SHARE = X_HEIGHT / WM_H;

export function Wordmark({
  height,
  tone = "paper",
  dot = "house:25",
  bare = false,
  className,
  style,
  read,
}: {
  /** The drawing's height in px (ascender to descender). */
  height: number;
  /** The ground it sits on: ink letters on paper, paper letters in the room. */
  tone?: Tone;
  /** Whose orb is the full stop: a seed, or a house guest (`house:<hue>`). */
  dot?: string;
  /** The word alone (where the orb is drawn by the composition itself). */
  bare?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Marks the drawing for the deck's caption (`data-bd-read`). */
  read?: string;
}) {
  const id = svgId(useId());
  const ink = tone === "paper" ? BASE.ink.hex : BASE.roomInk.hex;
  const w = bare ? L_RIGHT + 1 : WM_W;
  return (
    <svg
      role="img"
      aria-label="partyreel"
      data-bd-read={read}
      viewBox={`0 0 ${w.toFixed(1)} ${WM_H.toFixed(1)}`}
      height={height}
      width={(height * w) / WM_H}
      className={cn("ev-wordmark block shrink-0", className)}
      style={{ overflow: "visible", ...style }}
    >
      <text
        y={BASELINE}
        fill={ink}
        style={{
          fontFamily: "var(--font-ev-display)",
          fontWeight: 800,
          fontSize: 100,
          fontVariationSettings: '"opsz" 96',
          fontKerning: "none",
        }}
      >
        {WORD.split("").map((ch, i) => (
          <tspan key={i} x={origins[i]}>
            {ch}
          </tspan>
        ))}
      </text>
      {!bare && (
        <OrbSvg
          seed={dot}
          cx={DOT_CX}
          cy={BASELINE - DOT / 2}
          r={DOT / 2}
          id={`${id}-dot`}
        />
      )}
    </svg>
  );
}

/* ── the trail: the full stop, then everyone ───────────────────────────── */

/** The wordmark's descender, as a share of its drawn height. */
const DESC_SHARE = DESCENDER / WM_H;

/** The guests trailing from the wordmark's full stop, at its size. */
export function Trail({
  h,
  count,
  tone = "paper",
  overlap = 0.18,
  start = 1,
  arrive = true,
}: {
  /** The wordmark's drawn height (the trail matches its full stop). */
  h: number;
  count: number;
  tone?: Tone;
  overlap?: number;
  /** The first guest drawn (0 is the host). */
  start?: number;
  arrive?: boolean;
}) {
  const d = h * WORDMARK_X_SHARE * 0.57;
  const people = CROWD.slice(start, start + count);
  return (
    <div className="ev-row" style={{ ["--ev-row-overlap" as string]: `${-d * overlap}px` }}>
      {people.map((p, i) => (
        <Orb
          key={p.seed}
          seed={p.seed}
          size={d}
          ring={Math.max(2, d * 0.07)}
          ringColor={ON[tone].ground}
          className={arrive ? "ev-arrive" : undefined}
          style={{
            zIndex: count - i,
            ["--ev-i" as string]: i,
            ["--ev-stagger" as string]: "70ms",
          }}
        />
      ))}
    </div>
  );
}

/** The wordmark, then everyone after its full stop. */
export function WordAndEveryone({
  height,
  count,
  tone = "paper",
  gap = 10,
}: {
  height: number;
  count: number;
  tone?: Tone;
  gap?: number;
}) {
  return (
    <div className="flex items-end">
      <Wordmark height={height} tone={tone} read="wordmark" />
      <div style={{ marginLeft: gap, marginBottom: height * DESC_SHARE }}>
        <Trail h={height} count={count} tone={tone} />
      </div>
    </div>
  );
}

/* ── the app icon ──────────────────────────────────────────────────────── */

/** A superellipse (n = 5), the continuous corner a home screen draws. */
function squircle(size: number, n = 5, steps = 72): string {
  const a = size / 2;
  const pts: string[] = [];
  for (let i = 0; i < steps * 4; i++) {
    const t = (i / (steps * 4)) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = a + a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
    const y = a + a * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

const TILE = squircle(1024);

/** The icon's party: three house guests, beside, behind and nearest. */
export const ICON_PARTY = ["house:255", "house:85", "house:25"] as const;

/**
 * Where the party stands on the 1024 tile: an asymmetric huddle, the way three
 * friends lean in for a photograph. One a step back and higher, one beside,
 * one nearest; never symmetric, because two equal circles above a larger one
 * read as a famous mouse, and three in a line as a typing indicator.
 */
const SEATS = [
  { cx: 336, cy: 532, r: 178 },
  { cx: 690, cy: 392, r: 158 },
  { cx: 584, cy: 612, r: 200 },
] as const;

export function AppIcon({
  size,
  party = ICON_PARTY,
  small,
  mask = true,
  className,
  style,
  read,
}: {
  /** The tile's edge in px (1024, 180, 60, 29...). */
  size: number;
  /** Three seeds, beside, behind, nearest. */
  party?: readonly string[];
  /** The 29 px drawing: two-layer orbs, a wider part, no edge light. */
  small?: boolean;
  /** Clip to the home screen's corner (false: the square the OS masks). */
  mask?: boolean;
  className?: string;
  style?: CSSProperties;
  read?: string;
}) {
  const id = svgId(useId());
  const tiny = small ?? size <= 40;
  const ringW = tiny ? 34 : 22;
  const order = useMemo(
    () =>
      SEATS.map((s, i) => ({ ...s, seed: party[i] ?? party[0], i })).sort(
        (a, b) => a.r - b.r,
      ),
    [party],
  );
  return (
    <svg
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      role="img"
      aria-label="Partyreel app icon"
      data-bd-read={read}
      className={cn("ev-icon", className)}
      style={style}
    >
      <defs>
        <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="0" y2="1024" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={hex({ l: 0.235, c: 0.004, h: 286 })} />
          <stop offset="0.55" stopColor={hex({ l: 0.165, c: 0.004, h: 286 })} />
          <stop offset="1" stopColor={hex({ l: 0.125, c: 0.004, h: 286 })} />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1024" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.42" />
          <stop offset="0.08" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          {mask ? <path d={TILE} /> : <rect width="1024" height="1024" />}
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <rect width="1024" height="1024" fill={`url(#${id}-ground)`} />
        {order.map((s) => (
          <g key={s.i}>
            {/* The part: the tile's own colour, so a guest in front parts from one behind. */}
            <circle cx={s.cx} cy={s.cy} r={s.r + ringW} fill={`url(#${id}-ground)`} />
            <OrbSvg
              seed={s.seed}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              id={`${id}-o${s.i}`}
              simple={tiny}
            />
          </g>
        ))}
        {mask && !tiny && (
          <path
            d={TILE}
            fill="none"
            stroke={`url(#${id}-edge)`}
            strokeWidth={6}
            transform="translate(0 1)"
          />
        )}
      </g>
    </svg>
  );
}

/* ── the lockup ────────────────────────────────────────────────────────── */

/**
 * THE LOCKUP: the icon, then the wordmark at the icon's optical middle. The
 * icon is the party; the word's own full stop is the plus one, so the lockup
 * reads "a party, and you".
 */
export function Lockup({
  height,
  tone = "paper",
  dot,
  className,
  read,
}: {
  /** The icon's edge in px; the wordmark follows. */
  height: number;
  tone?: Tone;
  dot?: string;
  className?: string;
  read?: string;
}) {
  return (
    <div
      data-bd-read={read}
      className={cn("ev-lockup", className)}
      style={{ gap: height * 0.32 }}
    >
      <AppIcon size={height} />
      <Wordmark height={height * 0.62} tone={tone} dot={dot} />
    </div>
  );
}
