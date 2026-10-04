"use client";

import { type CSSProperties, useId, useMemo } from "react";

import { fitChroma, hex, meshDepths } from "@/lib/avatar/gradient";
import { cn } from "@/lib/utils";

import { EV_AXES, EV_FACE } from "./fonts";
import { BASE, CROWD, ON, Orb, orbOf, type Tone } from "./system";

/**
 * THE MARKS: the wordmark and the app icon, drawn as SVG and sized by props.
 *
 * ★ THE WORDMARK IS A WORD AND A PERSON. "partyreel" in lowercase (no letter
 * stands taller than the rest), set in Fraunces at its heaviest and softest
 * (900, SOFT 100), and its full stop is an orb: a guest, the plus one every
 * Partyreel arrives with. The face's own ball terminals (the a, the r, the y)
 * are drawn with the same round, so the person at the end belongs to the
 * word. The dot is seeded, so it can be whoever is looking (a fresh colour on
 * the marketing site, your own once you sign in, the host's on their event);
 * in print and wherever nobody is, it is a house guest.
 *
 * ★ SET, NOT YET OUTLINED (this round's allowance): the letters are the
 * loaded face, placed glyph by glyph at origins fitted from the face's own
 * ink (below, at 100 units), so the orb's place is arithmetic rather than a
 * guess, and a later outline replaces only the `<text>`. The brand-marks
 * board outlines and finishes the drawing.
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
 * The face's own geometry at 100 units (Fraunces 900, SOFT 100, WONK 0, opsz
 * 144), measured in a lab frame: each glyph's ink from its origin, read off a
 * 400 px rendering scanned pixel by pixel (to a quarter unit), and the
 * vertical metrics. The face kerns none of these pairs, so ink is the whole
 * story of their fit.
 */
const WORD = "partyreel";
const INK: Record<string, { l: number; r: number }> = {
  p: { l: 0.5, r: 53.75 },
  a: { l: 1.5, r: 51.25 },
  r: { l: 1.5, r: 44.75 },
  t: { l: -0.5, r: 36.5 },
  y: { l: -1.5, r: 52 },
  e: { l: 1.5, r: 46.5 },
  l: { l: 1.25, r: 28.25 },
};
const X_HEIGHT = 44.75; // the x's flat top
const ASCENDER = 75.5; // the l
const DESCENDER = 24.5; // the y's ball

/**
 * ★ FITTED PAIR BY PAIR, NEVER TRACKED. At its heaviest cut the face's own fit
 * already makes three pairs collide (the r's ball on the t's bar, the t's bar
 * on the y's arm, the a's tail nearly on the r's foot), so a uniform negative
 * track, the usual display move, would clog exactly those first and turn the
 * word into a blot at 30 px. Each number is the ink-to-ink gap after a glyph,
 * at 100 units: tight, never touching, the least where two rounds face (they
 * bring their own air) and the most where two serifs meet at one height.
 */
const GAPS = [1.2, 1.7, 1.5, 1.3, 1.7, 1.1, 1.1, 1.6];

const origins: number[] = [];
for (let i = 0; i < WORD.length; i++) {
  const ink = INK[WORD[i]];
  origins.push(
    i === 0 ? -ink.l : origins[i - 1] + INK[WORD[i - 1]].r + GAPS[i - 1] - ink.l,
  );
}
const L_RIGHT = origins[8] + INK.l.r;

/**
 * The orb: 0.6 of the x-height (a full stop that is a person reads a step
 * larger than the face's own), a letter's breath from the l, sunk below the
 * baseline by the overshoot a round letter takes, so it sits as the o does.
 */
const DOT = X_HEIGHT * 0.6;
const DOT_GAP = 5.5;
const SINK = 0.9;
const DOT_CX = L_RIGHT + DOT_GAP + DOT / 2;
const WM_W = DOT_CX + DOT / 2;
const BASELINE = ASCENDER;
const WM_H = ASCENDER + DESCENDER;

/** The wordmark's drawn aspect (width over height, descender included). */
export const WORDMARK_ASPECT = WM_W / WM_H;
/** Where the x-height sits, as a share of the wordmark's height. */
export const WORDMARK_X_SHARE = X_HEIGHT / WM_H;
/** The full stop's diameter, as a share of the wordmark's height. */
export const WORDMARK_DOT_SHARE = DOT / WM_H;
/** From the drawing's foot up to where the full stop sits, as a share of its height. */
export const WORDMARK_FOOT_SHARE = (DESCENDER - SINK) / WM_H;

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
          fontFamily: EV_FACE,
          fontWeight: 900,
          fontSize: 100,
          fontVariationSettings: EV_AXES.display,
          fontKerning: "none",
          letterSpacing: 0,
        }}
      >
        {WORD.split("").map((ch, i) => (
          <tspan key={i} x={origins[i].toFixed(2)}>
            {ch}
          </tspan>
        ))}
      </text>
      {!bare && (
        <OrbSvg
          seed={dot}
          cx={DOT_CX}
          cy={BASELINE + SINK - DOT / 2}
          r={DOT / 2}
          id={`${id}-dot`}
        />
      )}
    </svg>
  );
}

/* ── the trail: the full stop, then everyone ───────────────────────────── */

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
  const d = h * WORDMARK_DOT_SHARE;
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
      <div style={{ marginLeft: gap, marginBottom: height * WORDMARK_FOOT_SHARE }}>
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

/** The home screen's tile outline on a 1024 artboard, for a drawing of the icon's neighbours. */
export const TILE_PATH = TILE;

/**
 * One person in a single tint, for the tinted icon (a home screen that tints
 * every icon one hue): the orb keeps its own lightness, takes the tint's hue,
 * and is lit from the same upper left as the full-colour orb.
 */
function MonoOrbSvg({
  cx,
  cy,
  r,
  id,
  l,
  hue,
}: {
  cx: number;
  cy: number;
  r: number;
  id: string;
  /** The person's own body lightness (oklch L), kept. */
  l: number;
  /** The tint's hue. */
  hue: number;
}) {
  const lit = hex(fitChroma({ l: Math.min(0.97, l + 0.16), c: 0.02, h: hue }));
  const body = hex(fitChroma({ l, c: 0.04, h: hue }));
  const deep = hex(fitChroma({ l: Math.max(0.22, l - 0.32), c: 0.03, h: hue }));
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-m`} cx="0.36" cy="0.27" r="0.92">
          <stop offset="0" stopColor={lit} />
          <stop offset="0.52" stopColor={body} />
          <stop offset="1" stopColor={deep} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-m)`} />
    </g>
  );
}

/** The tile's ground, per variant: the display's near-black, paper, or a deeper black for a tint. */
const ICON_GROUND = {
  dark: [0.235, 0.165, 0.125],
  light: [0.995, 0.968, 0.935],
  tinted: [0.2, 0.14, 0.1],
} as const;

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
  variant = "dark",
  tint = 85,
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
  /**
   * The home screen's three looks: `dark` (the icon itself, on the display's
   * near-black), `light` (a paper tile for a light home screen) and `tinted`
   * (every icon in one hue the person picked: the party must hold by its
   * shape and its parts alone).
   */
  variant?: "dark" | "light" | "tinted";
  /** The tint's hue, for `tinted`. */
  tint?: number;
  className?: string;
  style?: CSSProperties;
  read?: string;
}) {
  const id = svgId(useId());
  const tiny = small ?? size <= 40;
  const ringW = tiny ? 34 : 22;
  const ground = ICON_GROUND[variant];
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
          <stop offset="0" stopColor={hex({ l: ground[0], c: 0.004, h: 286 })} />
          <stop offset="0.55" stopColor={hex({ l: ground[1], c: 0.004, h: 286 })} />
          <stop offset="1" stopColor={hex({ l: ground[2], c: 0.004, h: 286 })} />
        </linearGradient>
        {/* The light edge on the top bevel; on paper the bevel is a shade, not a light. */}
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1024" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={variant === "light" ? "#000" : "#fff"} stopOpacity={variant === "light" ? 0.07 : 0.42} />
          <stop offset="0.08" stopColor={variant === "light" ? "#000" : "#fff"} stopOpacity={variant === "light" ? 0.03 : 0.08} />
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
            {variant === "tinted" ? (
              <MonoOrbSvg
                cx={s.cx}
                cy={s.cy}
                r={s.r}
                id={`${id}-o${s.i}`}
                l={orbOf(s.seed).body.l}
                hue={tint}
              />
            ) : (
              <OrbSvg
                seed={s.seed}
                cx={s.cx}
                cy={s.cy}
                r={s.r}
                id={`${id}-o${s.i}`}
                simple={tiny}
              />
            )}
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
      {/* 0.84 of the icon puts the x-height at 0.38 of it, the share a lowercase
          word needs to hold its own beside a filled tile. */}
      <Wordmark height={height * 0.84} tone={tone} dot={dot} />
    </div>
  );
}
