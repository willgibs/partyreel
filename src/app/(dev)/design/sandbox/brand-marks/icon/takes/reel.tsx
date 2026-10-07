"use client";

import { emberAt, KEY, toHex } from "../light";
import { type ArtProps, DISC, EmberRing, ringAt, type Take } from "../parts";

/**
 * THE REEL: the ring holds the name. The shutter's puck becomes a reel's
 * flange, five windows round its hub, and the house ember that rings it
 * shines through them from behind, so the light lives where a reel is cut
 * away: amber through the window the key falls on, a deep ember through the
 * one turned away.
 */

const WINDOWS = 5;

/** A window's centre angle (0 at the crown, clockwise), one of them on the key. */
const angleOf = (i: number) => (KEY + (i * 360) / WINDOWS) % 360;

function ReelArt({ size, uid }: ArtProps) {
  const { rD } = ringAt(size);
  const small = size <= 40;
  const rw = rD * (small ? 0.27 : 0.235);
  const dist = rD * 0.56;
  const hub = rD * 0.17;
  const spindle = rD * 0.065;
  return (
    <>
      <EmberRing size={size} uid={uid} puck={false} />
      <defs>
        <radialGradient id={`${uid}rd`} cx="0.42" cy="0.22" r="0.95">
          <stop offset="0" stopColor={DISC[0]} />
          <stop offset="0.7" stopColor={DISC[1]} />
        </radialGradient>
        {Array.from({ length: WINDOWS }, (_, i) => {
          const a = angleOf(i);
          const away = Math.min(180, Math.abs(((a - KEY + 540) % 360) - 180));
          return (
            <radialGradient key={i} id={`${uid}w${i}`} cx="0.35" cy="0.3" r="0.8">
              <stop offset="0" stopColor={toHex(emberAt(away / 180 * 0.8))} />
              <stop offset="1" stopColor={toHex(emberAt(Math.min(1, away / 180 * 0.8 + 0.35)))} />
            </radialGradient>
          );
        })}
      </defs>
      <circle cx="512" cy="512" r={rD} fill={`url(#${uid}rd)`} />
      {Array.from({ length: WINDOWS }, (_, i) => {
        const a = angleOf(i);
        const g = ((a - 90) * Math.PI) / 180;
        const away = Math.min(180, Math.abs(((a - KEY + 540) % 360) - 180));
        return (
          <circle
            key={i}
            cx={512 + dist * Math.cos(g)}
            cy={512 + dist * Math.sin(g)}
            r={rw}
            fill={`url(#${uid}w${i})`}
            opacity={0.45 + 0.55 * Math.pow((Math.cos((away * Math.PI) / 180) + 1) / 2, 0.8)}
          />
        );
      })}
      <circle cx="512" cy="512" r={hub} fill="none" stroke="#2a2a30" strokeWidth={small ? 0 : rD * 0.03} />
      <circle cx="512" cy="512" r={spindle} fill={toHex(emberAt(0.55))} opacity={small ? 0 : 0.85} />
    </>
  );
}

function ReelMono({ color }: { color: string }) {
  const { r0, r1, rD } = ringAt(1024);
  const rw = rD * 0.235;
  const dist = rD * 0.56;
  const holes = Array.from({ length: WINDOWS }, (_, i) => {
    const g = ((angleOf(i) - 90) * Math.PI) / 180;
    const cx = 512 + dist * Math.cos(g);
    const cy = 512 + dist * Math.sin(g);
    return `M${cx - rw},${cy}a${rw},${rw} 0 1,0 ${rw * 2},0a${rw},${rw} 0 1,0 ${-rw * 2},0`;
  }).join("");
  const s = rD * 0.065;
  return (
    <>
      <circle cx="512" cy="512" r={(r0 + r1) / 2} fill="none" stroke={color} strokeWidth={Math.max(r1 - r0, 44)} />
      <path
        fillRule="evenodd"
        fill={color}
        d={`M${512 - rD},512a${rD},${rD} 0 1,0 ${rD * 2},0a${rD},${rD} 0 1,0 ${-rD * 2},0${holes}M${512 - s},512a${s},${s} 0 1,0 ${s * 2},0a${s},${s} 0 1,0 ${-s * 2},0`}
      />
    </>
  );
}

export const REEL: Take = { Art: ReelArt, Mono: ReelMono };
