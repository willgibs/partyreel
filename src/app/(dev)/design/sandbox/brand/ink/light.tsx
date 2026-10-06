"use client";

import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { contrast } from "@/lib/avatar/gradient";
import { MARKETING_REELS } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { AnswerReel, reelShots } from "../afterglow/kit";
import { RingIcon, RingSymbol } from "../afterglow/marks";
import {
  conicOf,
  depths,
  keyOf,
  type Light,
  LightChips,
  type Paper,
  RoomBloom,
  RoomRing,
  RoomSeam,
  RoomSeed,
  RoomWallSeam,
  ShutterGlyph,
  type Source,
  tone,
  type Tone,
  unOlive,
  yellowness,
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
import type { ReelId } from "../deck/media";

/**
 * INK'S LIGHT: ONE COLOUR, TWO PHYSICS.
 *
 * Every album keeps one colour, its strongest light (`keyOf`: the heaviest
 * sampled hue by intensity, the seed's hue before a photograph, the ember's
 * key for the house). In the room that colour is emitted: the shared room
 * forms, fed the key at three depths, so every glow is one hue. On paper it
 * is printed: the same colour as one ink at full strength, laid down solid in
 * a few crisp forms (a mat behind the one subject, a band round the Add, a
 * rule where the photographs end), the way stationery is printed.
 *
 * ★ NOTHING ON PAPER IS PALER THAN ITS INK. Every printed mark is the ink
 * itself, opaque and solid: no blur, no tint, no pattern of dots. Round two's
 * first draft printed the Bloom as a halftone screen, and the creative
 * director's pass saw what any screen does from a distance: it averages into
 * the pale tint this take exists to refuse. Where there is less light there
 * is less ink (a thinner rule), never a lighter one.
 *
 * ★ TWO INKS, LIKE A TWO-COLOUR JOB: the page's own black (the stock's `fg`,
 * the disc of every printed ring) and the album's one colour. Nothing else
 * prints.
 *
 * ★ A FORM'S BOX IS ITS SUBJECT'S (the take contract): the mat and the band
 * extend outside it, absolutely, so a slide lays every take out the same way.
 */

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/* ── the stock and the inks ────────────────────────────────────────────────── */

/**
 * AN UNCOATED, WARM STOCK: the paper a single ink is printed on (Contact
 * Sheet's touch). Its inks are fitted to it, so it lives here beside them.
 */
export const STOCK: Paper = {
  name: "Uncoated stock",
  ground: tone(0.968, 0.008, 84),
  card: tone(0.988, 0.006, 84),
  fg: tone(0.17, 0.008, 60),
  muted: tone(0.45, 0.012, 66),
  faint: tone(0.6, 0.012, 72),
};

/** The die-cut edge of a sheet of stock laid on stock (a cover): a hairline. */
const KEYLINE = tone(0.84, 0.01, 76);

/**
 * The press's lightness for a printed hue, before the contrast check: blues
 * and violets run deepest (they stay vivid there), ambers highest (deeper,
 * they turn brown).
 */
const PRESS: readonly (readonly [number, number])[] = [
  [0, 0.52],
  [30, 0.54],
  [50, 0.56],
  [75, 0.56],
  [100, 0.53],
  [140, 0.51],
  [180, 0.505],
  [220, 0.495],
  [260, 0.48],
  [290, 0.48],
  [330, 0.5],
  [360, 0.52],
];

function pressL(h: number): number {
  for (let i = 1; i < PRESS.length; i++) {
    const [h1, l1] = PRESS[i];
    const [h0, l0] = PRESS[i - 1];
    if (h <= h1) return l0 + ((h - h0) / (h1 - h0)) * (l1 - l0);
  }
  return PRESS[PRESS.length - 1][1];
}

/**
 * ★ A YELLOW PRINTS AS ITS AMBER. Deepened to an ink's strength a yellow goes
 * olive and an amber goes brown, so the press turns a warm light toward orange
 * as it deepens, most where it is most yellow (the toast's gold prints as
 * marigold), and the olive band goes to green (`unOlive`). Nothing else moves.
 */
export function printHue(h: number): number {
  const u = unOlive(h);
  return u > 25 && u < 100 ? u - 18 * yellowness(u) ** 2 : u;
}

const inks = new Map<string, Tone>();

/**
 * THE INK REGISTER: a light's hue printed deep and saturated on the stock.
 * Its chroma follows the light's own a little (a soft daylight prints a
 * quieter ink, never a greyer one), and its lightness is the press's for the
 * hue, then deepened until it holds 4.6:1 on the stock, so the event's name
 * and its credits can be set in it as type (`INK.inkFor`).
 */
export function INK_PRINT(h: number, c = 0.13): Tone {
  const id = `${Math.round(h * 10)}:${Math.round(c * 1000)}`;
  const hit = inks.get(id);
  if (hit) return hit;
  const hue = printHue(h);
  const chroma = Math.min(0.165, Math.max(0.12, 0.125 + (c - 0.1) * 0.6));
  let l = pressL(hue);
  let ink = tone(l, chroma, hue);
  while (contrast(ink, STOCK.ground) < 4.6 && l > 0.3) {
    l -= 0.004;
    ink = tone(l, chroma, hue);
  }
  inks.set(id, ink);
  return ink;
}

/**
 * ★ THE HOUSE PRINTS AT ITS EMBER'S WARMER SIDE. Its key (coral, h 34)
 * printed at an ink's depth is a brick red too near Fault's red, and the
 * brand's own mark must never read as a failure; so the house prints at h 42,
 * a deep coral-amber still inside its own ember (amber to coral).
 */
const HOUSE_PRINT_HUE = 42;

/** A source's one ink: its key, printed. */
export function inkOf(source: Source): Tone {
  if ("house" in source) return INK_PRINT(HOUSE_PRINT_HUE, 0.15);
  const k = keyOf(source);
  return INK_PRINT(k.h, k.c);
}

/** The house's ink: the ember's key printed, a deep coral-amber. */
export const HOUSE_INK = inkOf({ house: true });

/** A source's one light in the room: its key at three depths, never a second hue. */
function roomLight(source: Source): Light {
  const k = keyOf(source);
  return depths(k.h, k.c);
}

/* ── the mat: the Bloom printed ────────────────────────────────────────────── */

/**
 * How far the mat reaches past its subject: a tenth of the subject, inside
 * the contract's eighth. A wide strip's mat is capped at two fifths of the
 * strip's height top and bottom (`.ik-mat`), so a thin print never sits in a
 * slot of colour three times its height.
 */
const marginOf = (size: number) => Math.max(10, Math.round(size / 10));

/** The fillet: the hairline of paper between a subject and its mat. */
const filletOf = (size: number) => (size >= 240 ? 2 : 1.5);

/**
 * THE MAT, a solid field of one ink behind the one live subject, the way a
 * print is mounted on coloured card: crisp at its edge, square-ish at its
 * corners (a printed block, never a soft card), with a fillet of the lighter
 * stock between it and the subject so a warm photograph never melts into a
 * warm mat. The fillet also adds to a code's quiet zone. Mount it as the first
 * children of an isolated box the subject's size (`.ik-holder`).
 */
function Mat({
  ink,
  size,
  radius,
  className,
  style,
}: {
  ink: string;
  size: number;
  radius: number;
  className?: string;
  style?: CSSProperties;
}) {
  const vars: Vars = {
    "--ik-ink": ink,
    "--ik-m": `${marginOf(size)}px`,
    // A printed block's corner: near square for a photograph, softening a
    // little round a rounded plate so the margin reads even at its corners.
    "--ik-r": `${Math.round(3 + radius * 0.45)}px`,
    ...style,
  };
  return <span aria-hidden className={cn("ik-mat", className)} style={vars} />;
}

/** The fillet over the mat: the subject's own shape, a hairline larger, in the lighter stock. */
function Fillet({ size, radius }: { size: number; radius: number }) {
  const g = filletOf(size);
  return (
    <span
      aria-hidden
      className="ik-fillet"
      style={{
        inset: -g,
        borderRadius: radius + g,
        background: STOCK.card.hex,
      }}
    />
  );
}

/* ── the Ring: the ink disc and one printed band ───────────────────────────── */

/** A printed ring's band and its hairline of paper; at small sizes the band thickens to stay a ring. */
function sealOf(face: number) {
  return {
    gap: Math.max(1.5, face * 0.04),
    band: Math.max(2.5, face * (face < 48 ? 0.085 : 0.06)),
  };
}

function PrintedRing({
  size,
  ink,
  progress,
  glyph,
  label,
  className,
  style,
}: {
  size: number;
  ink: string;
  progress?: number;
  glyph: "add" | "done" | "none";
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const raw = useId();
  const id = `ik${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const { gap, band } = sealOf(size);
  const out = gap + band;
  const D = size + out * 2;
  const c = D / 2;
  const rb = size / 2 + gap + band / 2;
  const round = 2 * Math.PI * rb;
  const g = size * 0.36;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("ik-ring", className)}
      style={{ width: size, height: size, ...style }}
    >
      <svg
        aria-hidden
        viewBox={`0 0 ${D} ${D}`}
        width={D}
        height={D}
        style={{ left: -out, top: -out }}
      >
        <defs>
          {/* The glyph is knocked out of the disc, so it is the paper itself. */}
          <mask id={`${id}k`}>
            <circle cx={c} cy={c} r={size / 2} fill="#fff" />
            <g
              transform={`translate(${c - g / 2} ${c - g / 2})`}
              style={{ color: "#000" }}
            >
              <ShutterGlyph glyph={glyph} size={g} />
            </g>
          </mask>
        </defs>
        {progress === undefined ? (
          <circle
            cx={c}
            cy={c}
            r={rb}
            fill="none"
            stroke={ink}
            strokeWidth={band}
          />
        ) : (
          <>
            {/* Sending: the band's track a printed hairline, the run filling
                round it in the full band, never a faded band. */}
            <circle
              cx={c}
              cy={c}
              r={rb}
              fill="none"
              stroke={ink}
              strokeWidth={1}
            />
            <circle
              cx={c}
              cy={c}
              r={rb}
              fill="none"
              stroke={ink}
              strokeWidth={band}
              strokeDasharray={`${(progress * round).toFixed(2)} ${round.toFixed(2)}`}
              transform={`rotate(-90 ${c} ${c})`}
            />
          </>
        )}
        <circle
          cx={c}
          cy={c}
          r={size / 2}
          fill={STOCK.fg.hex}
          mask={`url(#${id}k)`}
        />
      </svg>
    </span>
  );
}

function Ring({
  source,
  ground,
  size = 64,
  progress,
  glyph = "add",
  breathe,
  label,
  className,
  style,
}: RingProps) {
  if (ground === "room")
    return (
      <span className={className} style={{ display: "inline-flex", ...style }}>
        <RoomRing
          light={roomLight(source)}
          size={size}
          progress={progress}
          glyph={glyph}
          breathe={breathe}
          label={label}
          face="room"
        />
      </span>
    );
  // Print never breathes: the band is there or it is filling.
  return (
    <PrintedRing
      size={size}
      ink={inkOf(source).hex}
      progress={progress}
      glyph={glyph}
      label={label}
      className={className}
      style={style}
    />
  );
}

/* ── the Seam: a printed rule where the photographs end ────────────────────── */

/**
 * A light's printed rule: a three-hundredth of the width it spans, never under
 * 2 px, so a share card drawn at 1200 and shown small still prints a line that
 * reads; a quieter light (a page's footer) prints a thinner one, never a
 * paler one.
 */
const ruleOf = (strength: number, width: number) =>
  Math.max(2, Math.round((width / 300) * (strength >= 0.8 ? 1 : 0.6)));

/** The small printed triangle between two credits. */
function Pointer() {
  return (
    <svg aria-hidden viewBox="0 0 5 6" width={5} height={6} className="ik-tri">
      <path d="M0 0L5 3L0 6Z" fill="currentColor" />
    </svg>
  );
}

function Seam({
  source,
  ground,
  edge = "top",
  reach,
  strength = 1,
  width = 400,
  credits,
  className,
  style,
}: SeamProps) {
  if (ground === "room")
    return (
      <RoomSeam
        light={roomLight(source)}
        edge={edge}
        reach={reach ?? 120}
        strength={strength}
        className={className}
        style={style}
      />
    );
  const vars: Vars = {
    "--ik-ink": inkOf(source).hex,
    "--ik-rule": `${ruleOf(strength, width)}px`,
    "--ik-inset": `${width >= 320 ? 20 : 14}px`,
    ...style,
  };
  return (
    <div
      aria-hidden={credits?.length ? undefined : true}
      className={cn("ik-seam", className)}
      data-edge={edge}
      style={vars}
    >
      <span className="ik-rule" />
      {credits?.length ? (
        <span className="ik-credits">
          {credits.map((c, i) => (
            <span key={`${c}-${i}`} className="ik-credit">
              {i ? <Pointer /> : null}
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
        hues={(t) => [keyOf({ photo: t.id }).h]}
        style={style}
      />
    );
  // Each photograph's own rule in its own ink, broken where the wall breaks.
  return (
    <div
      aria-hidden
      className="ik-wallrule"
      style={{ height: ruleOf(strength, width), ...style }}
    >
      {tiles.map((t) => (
        <span
          key={`${t.id}-${Math.round(t.x)}`}
          style={{
            left: t.x,
            width: t.w,
            background: inkOf({ photo: t.id }).hex,
          }}
        />
      ))}
    </div>
  );
}

/* ── the Bloom: a solid mat of ink behind the one subject ──────────────────── */

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
  if (ground === "room")
    return (
      <RoomBloom
        light={roomLight(source)}
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
  return (
    <div
      className={cn("ik-holder", className)}
      data-ignite={ignite ? "" : undefined}
      style={style}
    >
      <Mat ink={inkOf(source).hex} size={size} radius={radius} />
      <Fillet size={size} radius={radius} />
      <div className="ik-subject">{children}</div>
    </div>
  );
}

/** The shot a reel shows now, read off its video the way the room's light reads it. */
function useShot(box: RefObject<HTMLDivElement | null>, reel: ReelId) {
  const [shot, setShot] = useState(0);
  useEffect(() => {
    const v = box.current?.querySelector("video");
    if (!v) return;
    const meta =
      MARKETING_REELS.find((r) => r.id === reel) ?? MARKETING_REELS[0];
    const read = () => {
      let i = 0;
      meta.shotBoundaries.forEach((b, k) => {
        if (v.currentTime >= b) i = k;
      });
      setShot(i);
    };
    v.addEventListener("timeupdate", read);
    v.addEventListener("seeked", read);
    return () => {
      v.removeEventListener("timeupdate", read);
      v.removeEventListener("seeked", read);
    };
  }, [box, reel]);
  return shot;
}

/**
 * The reel on paper: one mat per ink its shots print in, stacked, only the
 * shot on screen's showing; on the cut the mats crossfade, so the print
 * answers the picture and never moves on its own clock.
 */
function PaperReel({
  reel,
  width,
  radius,
  focus,
  className,
  style,
}: {
  reel: ReelId;
  width: number;
  radius: number;
  focus?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const shot = useShot(box, reel);
  const shotInks = reelShots(reel).map((id) => inkOf({ photo: id }).hex);
  const now = shotInks[shot] ?? shotInks[0];
  return (
    <div ref={box} className={cn("ik-holder", className)} style={style}>
      {[...new Set(shotInks)].map((ink) => (
        <Mat
          key={ink}
          ink={ink}
          size={width}
          radius={radius}
          className="ik-reel-mat"
          style={{ opacity: ink === now ? 1 : 0 }}
        />
      ))}
      <Fillet size={width} radius={radius} />
      <div className="ik-subject">
        <AnswerReel
          reel={reel}
          ground="room"
          blur={0}
          spread={0}
          radius={radius}
          focus={focus}
          light={() => "none"}
          style={{ height: "100%" }}
        />
      </div>
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
  if (ground === "room")
    return (
      <div className={className} style={style}>
        <AnswerReel
          reel={reel}
          ground="room"
          blur={Math.round(width * 0.13)}
          spread={6}
          radius={radius}
          focus={focus}
          light={(id) => conicOf(roomLight({ photo: id }), "room")}
          style={{ height: "100%" }}
        />
      </div>
    );
  return (
    <PaperReel
      reel={reel}
      width={width}
      radius={radius}
      focus={focus}
      className={className}
      style={style}
    />
  );
}

/* ── the seed: one solid disc of its ink ───────────────────────────────────── */

function SeedCover({ seed, ground, children, className, style }: SeedProps) {
  if (ground === "room")
    return (
      <RoomSeed seed={seed} className={className} style={style}>
        {children}
      </RoomSeed>
    );
  // Printed, not lit: the cover is a sheet of the lighter stock with a
  // die-cut hairline (the place the photographs will go), and the seed is one
  // solid disc of its ink at its centre, the hashvatar's orb as a press prints
  // it: flat, a seal, never a ramp. Half the cover's shorter side, so the
  // first photograph is still the bigger thing. The SVG's square viewBox,
  // fitted, keeps the disc round at any shape of cover.
  return (
    <div
      data-bd-seed={seed}
      className={cn("ik-seed", className)}
      style={{
        background: STOCK.card.hex,
        boxShadow: `inset 0 0 0 1px ${KEYLINE.hex}`,
        ...style,
      }}
    >
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="ik-seed-disc"
      >
        <circle cx={50} cy={50} r={26} fill={inkOf({ seed }).hex} />
      </svg>
      {children}
    </div>
  );
}

/* ── the marks: the lit tile everywhere, a seal beside the wordmark ────────── */

/** The printed seal at any size: the ink disc, a hairline of paper, one band. */
function Seal({
  size,
  ink,
  className,
  style,
}: {
  size: number;
  ink: string;
  className?: string;
  style?: CSSProperties;
}) {
  const band = Math.max(2, size * (size < 40 ? 0.085 : 0.065));
  const gap = Math.max(1.25, size * 0.04);
  const c = size / 2;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      <circle
        cx={c}
        cy={c}
        r={c - band / 2}
        fill="none"
        stroke={ink}
        strokeWidth={band}
      />
      <circle cx={c} cy={c} r={c - band - gap} fill={STOCK.fg.hex} />
    </svg>
  );
}

function AppIcon({
  size = 180,
  appearance = "room",
  optics,
  read,
  className,
  style,
}: IconProps) {
  // ★ THE ICON IS THE LIT TILE ON EVERY GROUND, ON A SCREEN OR IN PRINT: an
  // app's icon is a picture people learn, so a card prints the lit tile as it
  // is, flat (no lift: print has none). Only the lockup's small mark beside
  // the wordmark is drawn in ink (`Symbol`). The house's light is the ember
  // the icon is keyed in, and its key is what that mark prints.
  return (
    <RingIcon
      size={size}
      appearance={appearance === "tinted" ? "tinted" : "room"}
      optics={optics}
      read={read}
      className={className}
      style={style}
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
  return (
    <Seal size={size} ink={HOUSE_INK.hex} className={className} style={style} />
  );
}

/* ── the receipt: the one ink, solid ───────────────────────────────────────── */

function Receipt({
  source,
  ground,
  width = 120,
  height = 8,
  className,
  style,
}: ReceiptProps) {
  if (ground === "room")
    return (
      <div className={className} style={{ width, ...style }}>
        <LightChips light={roomLight(source)} height={height} />
      </div>
    );
  // On paper the room's three depths become one: the ink, solid, the way a
  // press's colour bar proves an ink.
  return (
    <div
      aria-hidden
      className={cn("ik-bar", className)}
      style={{ width, height, background: inkOf(source).hex, ...style }}
    />
  );
}

export const INK_LIGHT: TakeLight = {
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
