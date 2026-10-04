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

/** The P's ink, in ems of its font size, measured off the face. */
const P_INK = { left: 0.04, right: 0.57, stem: 0.2025, cap: 0.66 } as const;

export type IconDetail = "full" | "mid" | "min";

/**
 * THE APP ICON: Partyreel's P, printed the way film prints its frame numbers,
 * paper on the film's ink, its foot cut on the wordmark's angle.
 *
 * Three drawings by size (`detail`, chosen from `size` when absent): `full`
 * (120 px and up) adds the edge along its foot (the frame mark ▸1A and the
 * stock name), `mid` is the P alone, and `min` (under 48) enlarges the P a
 * step and drops the light edge, which is noise at 29 px.
 *
 * `ground="paper"` is the light variant (ink on a print). `seed` draws an
 * EVENT's icon, the one a guest's home screen keeps: the same P on that
 * event's latent image, so every event has its own icon as it has its own edge.
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
  const fg = paper ? GROUND.ink.hex : GROUND.paper.hex;
  const fs = level === "min" ? 66 : level === "full" ? 60 : 62;
  const lift = level === "full" ? 3.5 : 0;
  const x = 51.5 - ((P_INK.left + P_INK.right) / 2) * fs;
  const y = 51 + (P_INK.cap / 2) * fs - lift;
  const x0 = x + P_INK.left * fs;
  const x1 = x + P_INK.stem * fs;
  const cut = `M${x0 - 1.5} ${y + 0.6} L${x1 + 1.5} ${(y + 0.6 - (x1 - x0 + 3) * CUT).toFixed(2)} L${x1 + 1.5} ${y + 6} L${x0 - 1.5} ${y + 6} Z`;
  const ev = seed ? seededColors(seed) : null;
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
          <stop offset="0.72" stopColor={paper ? GROUND.print.hex : GROUND.ink.hex} />
        </radialGradient>
        <linearGradient id={`${id}e`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {ev && (
          <>
            <radialGradient id={`${id}l`} cx="0.3" cy="0.24" r="0.75">
              <stop offset="0" stopColor={ev.lit} />
              <stop offset="1" stopColor={ev.lit} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}d`} cx="0.8" cy="0.86" r="0.7">
              <stop offset="0" stopColor={ev.deep} />
              <stop offset="1" stopColor={ev.deep} stopOpacity="0" />
            </radialGradient>
          </>
        )}
        <mask id={`${id}c`} maskUnits="userSpaceOnUse" x={0} y={0} width={100} height={100}>
          <rect width={100} height={100} fill="#fff" />
          <path d={cut} fill="#000" />
        </mask>
      </defs>
      <g clipPath={`url(#${id}t)`}>
        {ev ? (
          <>
            <rect width={100} height={100} fill={ev.body} />
            <rect width={100} height={100} fill={`url(#${id}l)`} />
            <rect width={100} height={100} fill={`url(#${id}d)`} />
            {/* The ink over the latent image, so the paper P holds 4.5:1 on any seed. */}
            <rect width={100} height={100} fill={GROUND.ink.hex} opacity={0.38} />
          </>
        ) : (
          <rect
            width={100}
            height={100}
            fill={level === "min" ? (paper ? GROUND.print.hex : GROUND.ink.hex) : `url(#${id}g)`}
          />
        )}
        <g mask={`url(#${id}c)`}>
          <text x={x} y={y} fill={fg} fontSize={fs} style={DISPLAY_FACE}>
            P
          </text>
        </g>
        {level === "full" && (
          // The edge as a film prints it round a frame: the stock's name along
          // the top, the frame mark along the foot, both on the P's stem line.
          <g fill={fg}>
            <text
              x={x0}
              y={y - P_INK.cap * fs - 6.2}
              fontSize={5.2}
              opacity={0.5}
              style={{
                fontFamily: "var(--font-cs-edge), sans-serif",
                fontWeight: 600,
                letterSpacing: "0.8px",
              }}
            >
              PARTYREEL
            </text>
            <path d={`M${x0 + 0.3} ${y + 8.3} l3.5 2.1 l-3.5 2.1 z`} />
            <text
              x={x0 + 5.4}
              y={y + 12.4}
              fontSize={5.6}
              style={{
                fontFamily: "var(--font-cs-edge), sans-serif",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              1A
            </text>
          </g>
        )}
      </g>
      {paper ? (
        <path
          d={SQUIRCLE}
          fill="none"
          stroke={GROUND.ink.hex}
          strokeOpacity={0.12}
          strokeWidth={level === "min" ? 1.6 : 0.8}
        />
      ) : (
        level !== "min" && (
          <path d={SQUIRCLE} fill="none" stroke={`url(#${id}e)`} strokeWidth={1.1} />
        )
      )}
    </svg>
  );
}

/* ── the lockup ───────────────────────────────────────────────────────────── */

/**
 * THE LOCKUP: the icon and the wordmark side by side, the icon a third taller
 * than the wordmark's box so the P and the wordmark's P share a cap height.
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
      style={{ display: "flex", alignItems: "center", gap: Math.round(height * 0.36), ...style }}
      data-bd-read={read}
    >
      <AppIcon size={icon} ground={ground} detail={icon >= 48 ? "mid" : "min"} />
      <Wordmark height={height} color={color} />
    </div>
  );
}
