"use client";

import { type CSSProperties, type ReactNode, useId } from "react";

import type { Appearance } from "./light";
import { EmberMono, EmberRing, SQUIRCLE, type Take, TILE } from "./parts";
import { MIRRORBALL } from "./takes/mirrorball";
import { REEL } from "./takes/reel";
import { SPARKLER } from "./takes/sparkler";

/**
 * THE RING, DRAWN: the icon's machinery, grown from brand r2's Aperture deck
 * (its `afterglow/marks.tsx`, retired with that board), every number kept
 * unless this board says otherwise.
 *
 * The icon is the shutter: a matte dark puck inside a ring of light on the
 * room's dark tile (a home screen's continuous corner), its light the house
 * ember. Round one picked the ring key-lit from the top-left (`ember`), which
 * ships as the working version; round two draws three bespoke takes on it
 * beside it (`takes/<id>.tsx`), each one file that draws everything over the
 * tile and its bare one-colour symbol (`Take`), so a take is added or retired
 * by its file and its line here.
 *
 * The key-lit ring itself is drawn as solid wedges, each asking the lighting
 * (`lights/ember.tsx`) for its colour at its angle, with a hair of overlap so
 * no seam shows; the corona and the glow are the same wedges blurred.
 */

export type IconId = "ember" | "mirrorball" | "sparkler" | "reel";
export type { Appearance };
export type { ArtProps, Take } from "./parts";

const EMBER: Take = { Art: EmberRing, Mono: EmberMono };

export const TAKES: Record<IconId, Take> = {
  ember: EMBER,
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
  const [t0, t1] = take.tile ?? TILE;
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
          <path d={SQUIRCLE} />
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

/** The bare symbol in one colour, no tile: the press kit's mono mark. */
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
      <take.Mono color={color} />
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
