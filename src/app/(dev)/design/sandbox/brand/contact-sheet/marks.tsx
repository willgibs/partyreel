"use client";

import type { CSSProperties } from "react";

import { seededColors } from "../deck/media";
import { GROUND, useSvgId } from "./system";

/**
 * CONTACT SHEET'S MARKS: the wordmark, the app icon and the lockup, as SVG
 * sized by props.
 *
 * ★ SET IN A LOADED FACE THIS ROUND, AND SAID SO. The wordmark is Bricolage
 * Grotesque ExtraBold (`fonts.ts`) as SVG text, customised by two cuts; the
 * brand-marks board outlines it and finishes it after the pick. Its spacing is
 * set by hand (the tspans' `dx`) so no two letters touch at the nav's 22 px.
 *
 * ★ THE CUT, KEPT FROM WILL'S V1. His wordmark cuts the P's foot, the t's head
 * and the l's head on one angle (about 14 degrees). Bricolage's t is already
 * cut that way; the P's foot and the l's head are cut here to match, so the
 * word reads as a strip of film cut at both ends.
 */

/* ── the wordmark ─────────────────────────────────────────────────────────── */

/**
 * The drawing's box at font-size 100, measured off the face: the P's ink
 * starts at x 4, the l's ends at 402.3; the l's head is at y -70 and the y's
 * tail at 15.5 (the baseline is 0).
 */
const WM_BOX = { x: 2, y: -72, w: 403, h: 90 } as const;
export const WORDMARK_ASPECT = WM_BOX.w / WM_BOX.h;

/** The cut's slope: Will's v1 angle, about 14 degrees. */
const CUT = Math.tan((14 * Math.PI) / 180);

const P_CUT = `M1.5 0.7 L23 ${(0.7 - 21.5 * CUT).toFixed(2)} L23 7 L1.5 7 Z`;
const L_CUT = `M383 ${(-70 + 19.25 * CUT).toFixed(2)} L406 ${(-70 + 19.25 * CUT - 23 * CUT).toFixed(2)} L406 -82 L383 -82 Z`;

const DISPLAY_FACE: CSSProperties = {
  fontFamily: "var(--font-cs-display), var(--font-display), sans-serif",
  fontWeight: 800,
  fontVariationSettings: "'opsz' 96",
};

/**
 * THE WORDMARK. Sized by `height` (its box, the l's head to the y's tail) or
 * by `width`; the colour is the ground's (`currentColor`) unless `color` says.
 */
export function Wordmark({
  height,
  width,
  color = "currentColor",
  className,
  style,
  read,
}: {
  height?: number;
  width?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
  /** Marks it for the deck's caption (`data-bd-read`). */
  read?: string;
}) {
  const id = useSvgId();
  const h = height ?? (width ? width / WORDMARK_ASPECT : 40);
  const w = width ?? h * WORDMARK_ASPECT;
  return (
    <svg
      viewBox={`${WM_BOX.x} ${WM_BOX.y} ${WM_BOX.w} ${WM_BOX.h}`}
      width={w}
      height={h}
      role="img"
      aria-label="Partyreel"
      className={className}
      style={{ display: "block", overflow: "visible", ...style }}
      data-bd-read={read}
    >
      <defs>
        <mask
          id={`${id}c`}
          maskUnits="userSpaceOnUse"
          x={-10}
          y={-90}
          width={430}
          height={120}
        >
          <rect x={-10} y={-90} width={430} height={120} fill="#fff" />
          <path d={P_CUT} fill="#000" />
          <path d={L_CUT} fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${id}c)`}>
        <text
          x={0}
          y={0}
          fill={color}
          fontSize={100}
          style={{ ...DISPLAY_FACE, letterSpacing: "-1.5px" }}
        >
          P<tspan dx={1}>ar</tspan>
          <tspan dx={1.5}>tyr</tspan>
          <tspan dx={1}>e</tspan>
          <tspan dx={1}>el</tspan>
        </text>
      </g>
    </svg>
  );
}

/* ── the app icon ─────────────────────────────────────────────────────────── */

/** iOS's continuous corner, approximated as a squircle path in a 100 box. */
const SQUIRCLE = (() => {
  const s = 100;
  const r = s * 0.2237;
  const k = r * 0.45;
  return `M${r},0 H${s - r} C${s - r + k},0 ${s},${r - k} ${s},${r} V${s - r} C${s},${s - r + k} ${s - r + k},${s} ${s - r},${s} H${r} C${r - k},${s} 0,${s - r + k} 0,${s - r} V${r} C0,${r - k} ${r - k},0 ${r},0 Z`;
})();

export type IconDetail = "full" | "mid" | "min";

/**
 * THE APP ICON: ONE PRINT ON THE FILM'S INK (the creative director's pass: a
 * white P on a dark tile was the category's most generic move, and its words
 * vanished below 180). The icon is the sheet's own object instead: a single
 * print, square-cornered (the board's only mark that is not a circle), lying a
 * hair off true on the film's ink, its border wider at the foot where the edge
 * rule runs under the image, the way an edge sits under every print in the
 * system. Inside it, the latent image: the photograph about to be, in graphite
 * on the house icon (the brand has no hue of its own), in that event's own
 * seeded colours on an event's icon (`seed`), so every event still has its own.
 *
 * Three drawings by size (`detail`, from `size` when absent): `full` (120 and
 * up) with the edge's arrow and rule and a soft lift; `mid` with the rule
 * alone; `min` (under 48) the print a step larger, upright, its rule thicker,
 * no lift, so it holds at 29. `ground="paper"` lays the print on a paper tile.
 */
export function AppIcon({
  size,
  ground = "ink",
  seed,
  detail,
  className,
  style,
  read,
}: {
  size: number;
  ground?: "ink" | "paper";
  seed?: string;
  detail?: IconDetail;
  className?: string;
  style?: CSSProperties;
  read?: string;
}) {
  const id = useSvgId();
  const level: IconDetail =
    detail ?? (size >= 120 ? "full" : size >= 48 ? "mid" : "min");
  const paper = ground === "paper" && !seed;
  const min = level === "min";
  // The print, in the 100 box: portrait, its foot border wider for the edge.
  const pw = min ? 60 : 52;
  const ph = min ? 70 : 62;
  const side = min ? 5 : 4.6;
  const foot = min ? 13 : 13.5;
  const px = (100 - pw) / 2;
  const py = (100 - ph) / 2 - (min ? 0 : 1);
  const tilt = min ? 0 : -4;
  const ix = px + side;
  const iy = py + side;
  const iw = pw - side * 2;
  const ih = ph - side - foot;
  const ev = seed ? seededColors(seed) : null;
  const ink = GROUND.ink.hex;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={seed ? "An event's Partyreel icon" : "Partyreel"}
      className={className}
      style={{ display: "block", flex: "none", ...style }}
      data-bd-read={read}
    >
      <defs>
        <clipPath id={`${id}t`}>
          <path d={SQUIRCLE} />
        </clipPath>
        <radialGradient id={`${id}g`} cx="0.5" cy="0" r="1.05">
          <stop offset="0" stopColor={paper ? "#ffffff" : "#2b251f"} />
          <stop offset="0.72" stopColor={paper ? GROUND.sheet.hex : ink} />
        </radialGradient>
        <linearGradient id={`${id}e`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* The latent image: graphite on the house icon, the seed on an event's. */}
        <radialGradient id={`${id}l`} cx="0.3" cy="0.22" r="0.95">
          <stop offset="0" stopColor={ev ? ev.lit : "#a39c93"} />
          <stop offset="0.55" stopColor={ev ? ev.body : "#5b554e"} />
          <stop offset="1" stopColor={ev ? ev.deep : "#221e1a"} />
        </radialGradient>
        <filter id={`${id}s`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={2.2} />
        </filter>
      </defs>
      <g clipPath={`url(#${id}t)`}>
        <rect
          width={100}
          height={100}
          fill={min ? (paper ? GROUND.sheet.hex : ink) : `url(#${id}g)`}
        />
        <g transform={`rotate(${tilt} 50 50)`}>
          {!min && (
            // The print's contact with the ink: a short, soft lift.
            <rect
              x={px + 1}
              y={py + 2.6}
              width={pw}
              height={ph}
              fill="#000"
              opacity={paper ? 0.16 : 0.5}
              filter={`url(#${id}s)`}
            />
          )}
          <rect
            x={px}
            y={py}
            width={pw}
            height={ph}
            rx={0.6}
            fill={GROUND.print.hex}
          />
          <rect x={ix} y={iy} width={iw} height={ih} fill={`url(#${id}l)`} />
          {/* The edge rule under the image: the system's edge, at the icon's size. */}
          <g fill={ink}>
            {level === "full" && (
              <path d={`M${ix} ${iy + ih + 4.1} l2.6 1.6 l-2.6 1.6 z`} />
            )}
            <rect
              x={level === "full" ? ix + 4.4 : ix}
              y={iy + ih + (min ? 4.6 : 5.1)}
              width={level === "full" ? iw - 4.4 : iw * 0.62}
              height={min ? 2.4 : 1.1}
              opacity={min ? 0.9 : 0.75}
            />
          </g>
        </g>
      </g>
      {paper ? (
        <path
          d={SQUIRCLE}
          fill="none"
          stroke={ink}
          strokeOpacity={0.12}
          strokeWidth={min ? 1.6 : 0.8}
        />
      ) : (
        !min && (
          <path
            d={SQUIRCLE}
            fill="none"
            stroke={`url(#${id}e)`}
            strokeWidth={1.1}
          />
        )
      )}
    </svg>
  );
}

/* ── the lockup ───────────────────────────────────────────────────────────── */

/**
 * THE LOCKUP: the icon and the wordmark side by side, the icon a third taller
 * than the wordmark's box, so the print stands as tall as the word's capitals
 * with its foot.
 */
export function Lockup({
  height = 40,
  color = "currentColor",
  ground = "ink",
  className,
  style,
  read,
}: {
  /** The wordmark's box height; the icon follows. */
  height?: number;
  color?: string;
  ground?: "ink" | "paper";
  className?: string;
  style?: CSSProperties;
  read?: string;
}) {
  const icon = Math.round(height * 1.32);
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: Math.round(height * 0.36),
        ...style,
      }}
      data-bd-read={read}
    >
      <AppIcon
        size={icon}
        ground={ground}
        detail={icon >= 48 ? "mid" : "min"}
      />
      <Wordmark height={height} color={color} />
    </div>
  );
}
