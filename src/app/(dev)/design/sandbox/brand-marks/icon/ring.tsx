"use client";

import { type CSSProperties, type ReactNode, useCallback, useId } from "react";

import { RING_SQUIRCLE, RING_TILE } from "@/lib/brand/ring";

import type { Take } from "./parts";
import { MIRRORBALL } from "./takes/mirrorball";
import { REEL } from "./takes/reel";
import { SPARKLER } from "./takes/sparkler";
import { TODAY } from "./today";

/**
 * THE ICON, AND ITS TAKES: the shutter, a matte dark puck inside a ring of
 * light on the room's dark tile (a home screen's continuous corner), its
 * light the house ember. Round one picked the ring key-lit from the top-left,
 * which now ships everywhere an icon lives (`src/lib/brand/ring.ts`, drawn
 * here as itself, `today.tsx`); round two draws three bespoke takes beside it
 * (`takes/<id>.tsx`), each one file that draws everything over the tile and
 * its bare one-colour mark (`Take`), so a take is added or retired by its file
 * and its line here. Every take stands on production's own tile and corner.
 */

export type IconId = "ember" | "mirrorball" | "sparkler" | "reel";
export type { ArtProps, Take } from "./parts";

export const TAKES: Record<IconId, Take> = {
  ember: TODAY,
  mirrorball: MIRRORBALL,
  sparkler: SPARKLER,
  reel: REEL,
};

/**
 * THE ICON: the take's art on the room's dark tile, clipped to the home
 * screen's continuous corner. `optics` draws one size at another size's cut
 * (a favicon shown enlarged pixel for pixel).
 */
export function RingIcon({
  id,
  size = 180,
  optics,
  className,
  style,
  read,
  label = "Partyreel's icon",
}: {
  id: IconId;
  size?: number;
  optics?: number;
  className?: string;
  style?: CSSProperties;
  read?: string;
  label?: string;
}) {
  const raw = useId();
  const uid = `bm${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const take = TAKES[id];
  const at = optics ?? size;
  const [t0, t1] = take.tile ?? RING_TILE;
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
      data-bm-read={read}
      data-bm-says={read ? `${size}×${size}` : undefined}
    >
      <defs>
        <clipPath id={`${uid}c`}>
          <path d={RING_SQUIRCLE} />
        </clipPath>
        <linearGradient id={`${uid}t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t0} />
          <stop offset="1" stopColor={t1} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${uid}c)`}>
        <rect width="1024" height="1024" fill={`url(#${uid}t)`} />
        <take.Art size={at} uid={uid} />
      </g>
    </svg>
  );
}

/**
 * The bare symbol in one colour, no tile: the press kit's mono mark.
 *
 * ★ EVERY TAKE'S MARK FILLS THE SAME BOX (the creative director's pass): the
 * takes drew their marks at their own reach (today's ring to 322 of the 1024
 * box, the reel's to 444), so a watermark compared the takes partly on size.
 * The mark is measured once drawn and its box cut square round the centre at
 * its own furthest reach, so every take meets the footage at one size.
 */
export function MonoMark({
  id,
  size,
  color,
  read,
}: {
  id: IconId;
  size: number;
  color: string;
  read?: string;
}) {
  const take = TAKES[id];
  // A ref, never state: the measure is the drawing's own, and writing the box
  // straight onto the element costs no second render.
  const fit = useCallback(
    (g: SVGGElement | null) => {
      const svg = g?.ownerSVGElement;
      if (!g || !svg || !id) return;
      const b = g.getBBox();
      if (!b.width) return;
      const half =
        Math.max(
          512 - b.x,
          b.x + b.width - 512,
          512 - b.y,
          b.y + b.height - 512,
        ) * 1.02;
      svg.setAttribute(
        "viewBox",
        `${512 - half} ${512 - half} ${2 * half} ${2 * half}`,
      );
    },
    [id],
  );
  return (
    <svg
      role="img"
      aria-label="Partyreel's mark in one colour"
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0 }}
      data-bm-read={read}
      data-bm-says={read ? `${size}×${size}` : undefined}
    >
      <g ref={fit}>
        <take.Mono color={color} />
      </g>
    </svg>
  );
}

/** A piece of the room on paper: the icon keeps its dark tile, on a print's lift. */
export function OnPaper({
  size,
  children,
}: {
  size: number;
  children: ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        filter: `drop-shadow(0 ${Math.max(1, size * 0.012)}px ${Math.max(2, size * 0.03)}px rgb(0 0 0 / 0.22))`,
      }}
    >
      {children}
    </span>
  );
}
