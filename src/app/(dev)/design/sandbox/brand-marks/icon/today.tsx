"use client";

import { RING_MONO, ringMarkup } from "@/lib/brand/ring";

import type { ArtProps, Take } from "./parts";

/**
 * TODAY'S RING, PRODUCTION'S OWN (round one's pick, `icon=ember`, wired by
 * brand-marks-wiring): the reference every take is read against is the icon
 * that ships, drawn by its one home, `src/lib/brand/ring.ts`, from the same
 * markup every icon file and `Logo markOnly` are written from, so the board
 * can never drift from what a home screen shows.
 */
function TodayArt({ size, uid }: ArtProps) {
  return (
    <g
      // The module's own constant drawing, never anything a person typed;
      // `bare`, since the board's icon draws the tile and its corner itself.
      dangerouslySetInnerHTML={{
        __html: ringMarkup({ size, shape: "bare", id: `${uid}p` }),
      }}
    />
  );
}

/** Production's mark in one ink: the ring and the puck, the gap between them the ground. */
function TodayMono({ color }: { color: string }) {
  const R = 512;
  const circle = (r: number) =>
    `M${R - r} ${R}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  return (
    <path
      fill={color}
      fillRule="evenodd"
      d={`${circle(R)}${circle(RING_MONO.inner * R)}${circle(RING_MONO.disc * R)}`}
    />
  );
}

export const TODAY: Take = { Art: TodayArt, Mono: TodayMono };
