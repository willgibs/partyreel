"use client";

import type { CSSProperties } from "react";

import { PARTY, Seeded, seededColors } from "../../deck/media";
import { CodePlate, FACE, type Ground, type Source } from "../system";
import { useTake } from "../take";

/**
 * THE PIECES SLIDES 12 AND 13 SHARE: the event's code standing in its take's
 * Bloom, lit by the event's seed, so the code on the hub and the code on the
 * table card are one object drawn one way; and the host's own avatar.
 *
 * ★ BEFORE THE FIRST PHOTOGRAPH THE LIGHT IS THE SEED (the sourcing order):
 * the hub a minute old and the card printed before the party both have no
 * photograph yet, so their one light is the event's own hashvatar hue.
 */

/** The event's seed as a light's source: every light on slides 12 and 13 before the album. */
export const SEED: Source = { seed: PARTY.seed };

/** The plate a code of `q` px of modules stands on: its box (the Bloom's subject) and corner. */
export function plateOf(q: number) {
  const pad = Math.round(q * 0.09);
  return { box: q + pad * 2, radius: Math.round(q * 0.1) };
}

/**
 * THE CODE, LIT: its white plate (the quiet zone, never lit) in the take's
 * Bloom on `ground`. ★ The plate casts no grey shadow on paper: there the
 * take's own paper form is the only thing under it, so a print's Bloom is
 * never muddied by a lift it did not draw.
 */
export function LitCode({
  q,
  ground,
  className,
  style,
}: {
  /** The code's modules, in px. */
  q: number;
  ground: Ground;
  className?: string;
  style?: CSSProperties;
}) {
  const take = useTake();
  const { Bloom } = take.light;
  const p = plateOf(q);
  return (
    <Bloom
      source={SEED}
      ground={ground}
      size={p.box}
      radius={p.radius}
      className={className}
      style={style}
    >
      <CodePlate size={q} shadow={ground === "room" ? "room" : "none"} />
    </Bloom>
  );
}

/**
 * THE HOST'S AVATAR, as production draws a seeded one (`ui/avatar.tsx`): the
 * hashvatar's mesh on the disc and her initial set in the seed's own ink.
 * ★ NEVER A BARE BALL (the creative director's pass): without its initial a
 * small mesh reads as a glossy sphere, a decoration, where it is a person.
 */
export function HostOrb({
  size,
  style,
}: {
  size: number;
  style?: CSSProperties;
}) {
  const ink = seededColors(PARTY.hostSeed).ink;
  return (
    <Seeded
      seed={PARTY.hostSeed}
      className="flex shrink-0 items-center justify-center"
      style={{ width: size, height: size, ...style }}
    >
      <span
        role="img"
        aria-label={`${PARTY.host}'s avatar`}
        style={{
          color: ink,
          fontFamily: FACE.text,
          fontSize: Math.round(size * 0.44),
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        {PARTY.host.charAt(0)}
      </span>
    </Seeded>
  );
}
