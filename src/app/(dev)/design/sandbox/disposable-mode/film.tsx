"use client";

import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

import { EVENT, type Still } from "./fixtures";
import type { StockId } from "./knobs";

/**
 * THE LOOKS A DEVELOPED SHOT CAN WEAR, and the one photograph wearing one.
 *
 * ★ NEVER BAKED (settled in round one). The original is stored as the camera
 * took it, and a look is drawn wherever a photograph is SHOWN, on the device,
 * so a host can switch it, or turn it off, at any time and nothing is stored
 * twice. `clean` is the original itself.
 *
 * ★ EACH LOOK IS DRAWN AS WELL AS IT COULD SHIP, so a look loses on its idea
 * and never on a crude stand-in: an SVG colour pass (a matrix for the cast,
 * a tone table for a film's lifted shadows and rolled highlights), then the
 * grain, a light vignette and the date a disposable prints in its corner. The
 * device would run the same pass as a shader over the photograph; here the
 * frame's own SVG filters stand in for it (`LookDefs`, mounted once a frame).
 *
 *  - `grain` is the texture alone: the tone table is the same on all three
 *    channels and there is no matrix, so every photograph keeps its own
 *    colour, its own light and its own white.
 *  - `warm`, `cool` and `mono` are round one's three colour looks.
 */
export type LookId = "clean" | "grain" | StockId;

export const LOOK_NAME: Record<LookId, string> = {
  clean: "the original",
  grain: "the grain and the date",
  warm: "Warm",
  cool: "Cool",
  mono: "B&W",
};

/** The colour pass of each look, by its SVG filter's id. */
const FILTER: Record<Exclude<LookId, "clean">, string> = {
  grain: "dm-look-grain",
  warm: "dm-look-warm",
  cool: "dm-look-cool",
  mono: "dm-look-mono",
};

/** A tone table, the same curve on every channel. */
const curve = (t: string) => (
  <>
    <feFuncR type="table" tableValues={t} />
    <feFuncG type="table" tableValues={t} />
    <feFuncB type="table" tableValues={t} />
  </>
);

/**
 * THE LOOKS' COLOUR PASSES, ONCE A FRAME: every `Scene` mounts these, so a
 * photograph anywhere in the frame can wear one by its id.
 */
export function LookDefs() {
  return (
    <svg
      aria-hidden
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0 }}
    >
      <defs>
        {/* The texture alone: a film's toe and shoulder, equal on R, G and B. */}
        <filter id="dm-look-grain" colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            {curve("0.035 0.27 0.52 0.77 0.965")}
          </feComponentTransfer>
        </filter>
        {/* Warm: red up, blue down, the shadows lifted warm, a little richer. */}
        <filter id="dm-look-warm" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="1.08 0.04 0 0 0.02  0.02 1 0 0 0.01  0 0.05 0.85 0 0  0 0 0 1 0"
          />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.07 0.31 0.58 0.82 0.97" />
            <feFuncG type="table" tableValues="0.05 0.27 0.54 0.79 0.94" />
            <feFuncB type="table" tableValues="0.03 0.22 0.47 0.72 0.88" />
          </feComponentTransfer>
          <feColorMatrix type="saturate" values="1.08" />
        </filter>
        {/* Cool: a blue cast in the shadows, neutral highs, a little quieter. */}
        <filter id="dm-look-cool" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.92 0.04 0.02 0 0  0.02 1 0.04 0 0.01  0.02 0.06 1.06 0 0.03  0 0 0 1 0"
          />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.03 0.26 0.53 0.8 0.95" />
            <feFuncG type="table" tableValues="0.05 0.29 0.56 0.82 0.96" />
            <feFuncB type="table" tableValues="0.09 0.33 0.6 0.84 0.97" />
          </feComponentTransfer>
          <feColorMatrix type="saturate" values="0.9" />
        </filter>
        {/* B&W: luminance, then a film's contrast. */}
        <filter id="dm-look-mono" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0"
          />
          <feComponentTransfer>
            {curve("0.04 0.19 0.5 0.83 0.98")}
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
}

/* ── the date in the corner ─────────────────────────────────────────────── */

/**
 * SEVEN SEGMENTS, the way a disposable's back prints the date. Each digit is
 * its segments lit in `SEGMENTS`' order (a top, b upper right, c lower right,
 * d bottom, e lower left, f upper left, g middle).
 */
const SEGMENTS: Record<string, string> = {
  "0": "abcdef",
  "1": "bc",
  "2": "abged",
  "3": "abgcd",
  "4": "fgbc",
  "5": "afgcd",
  "6": "afgedc",
  "7": "abc",
  "8": "abcdefg",
  "9": "abcdfg",
};

const RECT: Record<string, [number, number, number, number]> = {
  a: [2, 0, 6, 2],
  b: [8, 2, 2, 6],
  c: [8, 10, 2, 6],
  d: [2, 16, 6, 2],
  e: [0, 10, 2, 6],
  f: [0, 2, 2, 6],
  g: [2, 8, 6, 2],
};

function Digit({ ch }: { ch: string }) {
  const lit = SEGMENTS[ch] ?? "";
  return (
    <svg viewBox="0 0 10 18" aria-hidden>
      {Object.entries(RECT).map(([seg, [x, y, w, h]]) => (
        <rect
          key={seg}
          x={x}
          y={y}
          width={w}
          height={h}
          rx={0.9}
          fill="currentColor"
          opacity={lit.includes(seg) ? 1 : 0.07}
        />
      ))}
    </svg>
  );
}

/** The date as the camera prints it: `'26 6 14`. */
export function DateStamp({ text = EVENT.stamp }: { text?: string }) {
  return (
    <span className="dm-stamp" data-dm-stamp={text} aria-hidden>
      {Array.from(text).map((ch, i) =>
        ch === " " ? (
          <span key={i} className="dm-stamp-gap" />
        ) : ch === "'" ? (
          <svg key={i} viewBox="0 0 4 18" aria-hidden>
            <rect
              x={1}
              y={0}
              width={2}
              height={6}
              rx={0.9}
              fill="currentColor"
            />
          </svg>
        ) : (
          <Digit key={i} ch={ch} />
        ),
      )}
    </span>
  );
}

/* ── one photograph, wearing a look ─────────────────────────────────────── */

export function FilmStill({
  still,
  look = "clean",
  className,
  style,
  position,
  stamp = true,
  alt = "",
}: {
  still: Still;
  look?: LookId;
  className?: string;
  style?: CSSProperties;
  /** The photograph's `object-position`, where a crop must keep its subject. */
  position?: string;
  /** The date in the corner (every look prints it; a thumbnail may drop it). */
  stamp?: boolean;
  alt?: string;
}) {
  const worn = look !== "clean";
  return (
    <div
      className={cn("dm-film relative", className)}
      data-look={look}
      data-dm-look={look}
      style={style}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for the live camera and the developed shot */}
      <img
        src={still.src}
        alt={alt}
        style={{
          objectPosition: position,
          filter: worn ? `url(#${FILTER[look]})` : undefined,
        }}
      />
      {worn && (
        <>
          <span aria-hidden className="dm-film-vignette" />
          <span aria-hidden className="dm-film-grain" />
          {stamp && <DateStamp />}
        </>
      )}
    </div>
  );
}
