"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { AnswerReel } from "../afterglow/kit";
import { RingIcon, RingSymbol } from "../afterglow/marks";
import {
  conicOf,
  duskGradient,
  LightChips,
  lightOf,
  RoomBloom,
  RoomRing,
  RoomSeam,
  RoomSeed,
  RoomWallSeam,
  SAMPLED,
  withDepth,
} from "../afterglow/system";
import type {
  BloomProps,
  IconProps,
  ReceiptProps,
  ReelBloomProps,
  RingProps,
  SeamProps,
  SeedProps,
  SymbolProps,
  TakeLight,
  WallSeamProps,
} from "../afterglow/take";

/**
 * APERTURE'S LIGHT: THE SAME LIGHT ON EVERY GROUND; THE DARK TRAVELS WITH IT.
 *
 * Light only reads as light against the dark: on white there is nothing
 * darker for it to be brighter than, so any glow laid on paper can only add
 * colour by taking brightness away, and that is round one's stain. Aperture
 * never lays light on paper. A paper page holds small pieces of the room (the
 * shutter's puck, the one lit plate, the foot's slab, the rebate under a
 * print), and the light lives inside them, at the room's own register,
 * exactly as bright as it is in the room.
 *
 * ★ IN THE ROOM IT IS ROUND ONE'S LIGHT, POLISHED: the photographs' sampled
 * hues (three at most), the house as one sky. ★ ON PAPER EVERY FORM BRINGS ITS
 * DARK: the Ring sits in a puck, the Seam on a rebate, the Bloom on a plate,
 * the seed in its well, and nothing is ever drawn on the page itself.
 *
 * ★ A FORM'S BOX IS ITS SUBJECT'S (the take contract): the puck and the plate
 * extend outside it, absolutely, so a slide lays every take out the same way.
 */

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** The ink a piece of the room is made of on paper: the display's near-black. */
export const PLATE = {
  top: "#17171a",
  foot: "#0c0c0e",
  edge: "rgb(255 255 255 / 0.07)",
} as const;

/** A piece of the room on paper: its gradient, its lit top edge and its lift. */
export function plateStyle(radius: number): CSSProperties {
  return {
    background: `linear-gradient(180deg, ${PLATE.top} 0%, ${PLATE.foot} 100%)`,
    borderRadius: radius,
    boxShadow: `inset 0 1px 0 ${PLATE.edge}, 0 1px 2px rgb(0 0 0 / 0.12), 0 14px 30px -14px rgb(0 0 0 / 0.45)`,
  };
}

/** A piece of the room behind a subject, `out` px past its box on every side. */
function Behind({
  out,
  radius,
  children,
  className,
}: {
  out: number;
  radius: number;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("ap-behind", className)}
      style={{ inset: -out, ...plateStyle(radius) }}
    >
      {children}
    </span>
  );
}

/* ── the Ring ──────────────────────────────────────────────────────────────── */

function Ring({
  source,
  ground,
  size = 64,
  progress,
  glyph,
  breathe,
  label,
  className,
  style,
}: RingProps) {
  const ring = (
    <RoomRing
      light={lightOf(source)}
      size={size}
      progress={progress}
      glyph={glyph}
      breathe={breathe}
      label={label}
      face="room"
    />
  );
  if (ground === "room")
    return (
      <span className={className} style={{ display: "inline-flex", ...style }}>
        {ring}
      </span>
    );
  // On paper the ring brings its own dark: a puck a third wider than the
  // face, so the band and its glow have the room they need, clipped inside.
  const out = Math.round(size * 0.31);
  return (
    <span
      className={cn("ap-holder", className)}
      style={{ width: size, height: size, ...style }}
    >
      <Behind out={out} radius={size}>
        <span className="ap-centre">{ring}</span>
      </Behind>
    </span>
  );
}

/* ── the Seam ──────────────────────────────────────────────────────────────── */

function Seam({
  source,
  ground,
  edge = "top",
  reach,
  strength = 1,
  credits,
  className,
  style,
}: SeamProps) {
  if (ground === "room")
    return (
      <RoomSeam
        light={lightOf(source)}
        edge={edge}
        reach={reach ?? 120}
        strength={strength}
        className={className}
        style={style}
      />
    );
  // On paper the Seam stands on a rebate: a strip of the room under the
  // media's edge (the film's own black, Contact Sheet's touch), the light
  // born inside it and the event's credits printed on it in the room's ink.
  const h = Math.max(30, Math.round((reach ?? 56) * 0.62));
  return (
    <div
      aria-hidden={credits ? undefined : true}
      className={cn("ap-rebate", className)}
      data-edge={edge}
      style={{ height: h, ...style }}
    >
      <RoomSeam
        light={lightOf(source)}
        reach={h}
        strength={Math.min(1, strength * 1.05)}
      />
      {credits?.length ? (
        <span className="ap-credits">
          {credits.map((c, i) => (
            <span key={`${c}-${i}`} className="ap-credit">
              {i ? <span className="ap-credit-sep">▸</span> : null}
              {c}
            </span>
          ))}
        </span>
      ) : null}
    </div>
  );
}

function WallSeam({
  tiles,
  width,
  ground,
  reach,
  strength = 1,
  style,
}: WallSeamProps) {
  if (ground === "room")
    return (
      <RoomWallSeam
        tiles={tiles}
        width={width}
        reach={reach ?? 120}
        strength={strength}
        style={style}
      />
    );
  const h = Math.max(30, Math.round((reach ?? 56) * 0.62));
  return (
    <div aria-hidden className="ap-rebate" style={{ height: h, ...style }}>
      <RoomWallSeam tiles={tiles} width={width} reach={h} strength={1} />
    </div>
  );
}

/* ── the Bloom ─────────────────────────────────────────────────────────────── */

function Bloom({
  source,
  ground,
  children,
  radius = 2,
  size = 320,
  ignite = true,
  className,
  style,
}: BloomProps) {
  const light = lightOf(source);
  if (ground === "room")
    return (
      <RoomBloom
        light={light}
        radius={radius}
        blur={Math.round(size * 0.12)}
        spread={Math.max(3, Math.round(size * 0.012))}
        ignite={ignite}
        className={className}
        style={style}
      >
        {children}
      </RoomBloom>
    );
  // On paper the subject stands on its plate: a black mount a ninth of the
  // subject wider all round, square-cornered like a print's mount (never a
  // device), its light hugging the subject and spent before the mount's edge,
  // so the plate reads as dark with light in it, never a lit frame.
  const out = Math.max(16, Math.round(size * 0.11));
  const vars: Vars = {
    "--ap-conic": conicOf(light, "room"),
    "--ap-blur": `${Math.round(out * 0.42)}px`,
    "--ap-in": `${Math.round(out * 0.72)}px`,
    "--ap-radius": `${radius + 2}px`,
    ...style,
  };
  return (
    <div
      className={cn("ap-holder", className)}
      data-ignite={ignite ? "" : undefined}
      style={vars}
    >
      <Behind out={out} radius={Math.max(4, radius + Math.round(out * 0.12))}>
        <span className="ap-plate-light" />
      </Behind>
      <div className="ap-subject">{children}</div>
    </div>
  );
}

function ReelBloom({
  reel,
  ground,
  width,
  radius = 2,
  focus,
  className,
  style,
}: ReelBloomProps) {
  const reelNode = (
    <AnswerReel
      reel={reel}
      ground="room"
      blur={Math.round(width * 0.13)}
      spread={6}
      radius={radius}
      focus={focus}
      light={(id) => conicOf(withDepth(SAMPLED[id]), "room")}
      style={{ height: "100%" }}
    />
  );
  if (ground === "room")
    return (
      <div className={className} style={style}>
        {reelNode}
      </div>
    );
  // On paper the reel plays on its mount, its answering light inside it,
  // tighter than the room's so it is spent before the mount's edge.
  const out = Math.max(16, Math.round(width * 0.12));
  return (
    <div className={cn("ap-holder", className)} style={style}>
      <Behind out={out} radius={Math.max(4, radius + Math.round(out * 0.12))}>
        <span className="ap-centre" style={{ inset: out }}>
          <AnswerReel
            reel={reel}
            ground="room"
            blur={Math.round(out * 0.45)}
            spread={Math.round(out * 0.2)}
            radius={radius}
            focus={focus}
            light={(id) => conicOf(withDepth(SAMPLED[id]), "room")}
            style={{ height: "100%", width: "100%" }}
          />
        </span>
      </Behind>
    </div>
  );
}

/* ── the seed ──────────────────────────────────────────────────────────────── */

function SeedCover({ seed, ground, children, className, style }: SeedProps) {
  // The album's well is the room on every ground (production's own rule), so
  // the seed glows in its own dark on paper too, a lit top edge on it there.
  return (
    <RoomSeed
      seed={seed}
      className={className}
      style={{
        ...(ground === "paper"
          ? { boxShadow: `inset 0 1px 0 ${PLATE.edge}` }
          : null),
        ...style,
      }}
    >
      {children}
    </RoomSeed>
  );
}

/* ── the marks ─────────────────────────────────────────────────────────────── */

function AppIcon({
  size = 180,
  appearance = "room",
  optics,
  read,
  className,
  style,
}: IconProps) {
  // The icon is a piece of the room on every ground: on a print it keeps its
  // dark tile (a lift under it on paper), because the tile is the room the
  // light needs, and the paper appearance is the room's own drawing.
  return (
    <RingIcon
      size={size}
      appearance={appearance === "tinted" ? "tinted" : "room"}
      optics={optics}
      read={read}
      className={className}
      style={{
        ...(appearance === "paper"
          ? {
              filter: `drop-shadow(0 ${Math.max(1, size * 0.012)}px ${Math.max(2, size * 0.03)}px rgb(0 0 0 / 0.22))`,
            }
          : null),
        ...style,
      }}
    />
  );
}

function Mark({ size = 40, ground, className, style }: SymbolProps) {
  if (ground === "room")
    return (
      <RingSymbol
        size={size}
        appearance="room"
        className={className}
        style={style}
      />
    );
  // On paper the symbol stands in its puck, the light inside its own dark.
  const out = Math.round(size * 0.12);
  return (
    <span
      className={cn("ap-holder", className)}
      style={{ width: size, height: size, ...style }}
    >
      <Behind out={out} radius={size}>
        <span className="ap-centre">
          <RingSymbol size={Math.round(size * 0.88)} appearance="room" />
        </span>
      </Behind>
    </span>
  );
}

function Receipt({
  source,
  ground,
  width = 120,
  height = 8,
  className,
  style,
}: ReceiptProps) {
  // The house is one sky, never chips side by side (round two's first
  // polish): its receipt is the sky itself, one strip in one direction.
  const chips =
    "house" in source ? (
      <div
        style={{ height, borderRadius: 2, background: duskGradient("90deg") }}
      />
    ) : (
      <LightChips light={lightOf(source)} height={height} />
    );
  if (ground === "room")
    return (
      <div className={className} style={{ width, ...style }}>
        {chips}
      </div>
    );
  return (
    <div
      className={cn("ap-capsule", className)}
      style={{ width: width + 12, ...style }}
    >
      {chips}
    </div>
  );
}

export const APERTURE_LIGHT: TakeLight = {
  Ring,
  Seam,
  WallSeam,
  Bloom,
  ReelBloom,
  SeedCover,
  AppIcon,
  Symbol: Mark,
  Receipt,
};
