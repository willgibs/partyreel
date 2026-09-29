"use client";

import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

import { EVENT, type Still } from "./fixtures";
import type { StockId } from "./knobs";

/**
 * THE LOOKS A SHOT CAN WEAR, and the one photograph wearing one.
 *
 * ★ NEVER BAKED (settled from round one's `look=stocks` note). The original
 * is stored as the camera took it; Warm, Cool and B&W are applied wherever a
 * photograph is SHOWN (the viewfinder as she frames, the album, the reel,
 * rendered on the device), so the host can switch the look, or turn it off,
 * at any time and nothing is stored twice. `clean` is the original itself:
 * what Download all hands over, and the phone's own camera app.
 *
 * Here the board's sheet stands in for that display pass
 * (`disposable-mode.css`), which is why one still can be read four ways side
 * by side.
 */
export type LookId = StockId | "clean";

export const LOOK_NAME: Record<LookId, string> = {
  clean: "the original",
  warm: "Warm",
  cool: "Cool",
  mono: "B&W",
};

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

export function Digit({ ch }: { ch: string }) {
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
  look,
  className,
  style,
  position,
  stamp = true,
}: {
  still: Still;
  look: LookId;
  className?: string;
  style?: CSSProperties;
  /** The photograph's `object-position`, where a crop must keep its subject. */
  position?: string;
  /** The date in the corner (every look prints it; a thumbnail may drop it). */
  stamp?: boolean;
}) {
  return (
    <div
      className={cn("dm-film relative", className)}
      data-look={look}
      data-dm-look={look}
      style={style}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for the live camera and the developed shot */}
      <img src={still.src} alt="" style={{ objectPosition: position }} />
      {look !== "clean" && (
        <>
          <span aria-hidden className="dm-film-tint" />
          <span aria-hidden className="dm-film-vignette" />
          <span aria-hidden className="dm-film-grain" />
          {stamp && <DateStamp />}
        </>
      )}
    </div>
  );
}
