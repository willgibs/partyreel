"use client";

import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { contrast, orbFor } from "@/lib/avatar/gradient";
import { MARKETING_REELS } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { AnswerReel, reelShots } from "../afterglow/kit";
import { iconOptics, RingIcon, RingSymbol, SQUIRCLE } from "../afterglow/marks";
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
 * sampled hue by intensity, the seed's hue before a photograph, the dusk key
 * for the house). In the room that colour is emitted: the shared room forms,
 * fed the key at three depths, so every glow is one hue. On paper it is
 * printed: the same colour as an ink at full strength, laid down in small,
 * exact amounts (a rule, a band, a fine screen of dots), the way a press has
 * always drawn light. A press never prints a glow as a pale tint; it prints
 * dots of full-strength ink that shrink, and that is the escape from round
 * one's washed-out middle.
 *
 * ★ NOTHING ON PAPER IS PALER THAN ITS INK. Every printed mark is the ink
 * itself, opaque; where there is less light there is less ink (a smaller dot,
 * a thinner rule), never a lighter one.
 *
 * ★ TWO INKS, LIKE A TWO-COLOUR JOB: the page's own black (the stock's `fg`,
 * the disc of every ring) and the album's one colour. Nothing else prints.
 *
 * ★ A FORM'S BOX IS ITS SUBJECT'S (the take contract): the screen and the
 * band extend outside it, absolutely, so a slide lays every take out the same
 * way.
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
 * hue, then deepened until it holds 4.6:1 on the stock, so the event's
 * credits can be set in it as type.
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

/** A source's one ink: its key, printed. */
export function inkOf(source: Source): Tone {
  const k = keyOf(source);
  return INK_PRINT(k.h, k.c);
}

/** The house's ink: the dusk key printed, a deep coral. */
export const HOUSE_INK = inkOf({ house: true });

/** A source's one light in the room: its key at three depths, never a second hue. */
function roomLight(source: Source): Light {
  const k = keyOf(source);
  return depths(k.h, k.c);
}

/* ── the screen: how a press prints a glow ─────────────────────────────────── */

/**
 * A fixed threshold per lattice point, for the screen's last, smallest dots.
 * Hashed, never ordered: an ordered matrix thins a band of tiny dots into a
 * regular sub-lattice, which reads as a dotted line round the screen.
 */
function grain(m: number, k: number) {
  let h = (Math.imul(m, 374761393) + Math.imul(k, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** A point's distance outside a rounded rectangle at the origin (negative inside). */
function outside(x: number, y: number, w: number, h: number, r: number) {
  const qx = Math.abs(x - w / 2) - (w / 2 - r);
  const qy = Math.abs(y - h / 2) - (h / 2 - r);
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    r
  );
}

/** What a screen prints: a frame round a subject, or a pool from a lit point. */
type Shape =
  | { kind: "frame"; radius: number; reach: number; gap: number }
  | { kind: "pool"; x: number; y: number };

/**
 * The screen's peak coverage, the share of paper the dots at the subject's
 * edge cover: 0.6 where the screen has room for its fall, easing to 0.48 for
 * a small subject whose screen is only a few dots deep, so its rim never
 * outweighs the subject.
 */
const peakOf = (rows: number) =>
  0.48 + 0.12 * Math.min(1, Math.max(0, (rows - 6) / 10));

/** The screen's coverage at a point of the subject's box (layout px). */
function coverage(shape: Shape, w: number, h: number, rows: number) {
  if (shape.kind === "frame") {
    const { radius, reach, gap } = shape;
    const peak = peakOf(rows);
    // ★ THE DOT'S RADIUS FALLS IN A STRAIGHT LINE from the subject's edge to
    // `reach` (coverage as its square): the most ink at the edge, falling
    // fastest there, as light born at an edge does, and spent smoothly. A
    // curve that holds its density off the edge prints an even band, which
    // reads as a dotted mat; one that falls too fast leaves a thin rim and a
    // long dust of tiny dots.
    return (x: number, y: number) => {
      const d = outside(x, y, w, h, radius) - gap;
      if (d < 0 || d > reach) return 0;
      return peak * (1 - d / reach) ** 2;
    };
  }
  // The seed's light, printed from where the hashvatar keeps its light: a
  // pool of ink dense enough to read as solid there, spent across the cover.
  const lx = shape.x * w;
  const ly = shape.y * h;
  return (x: number, y: number) => {
    const dx = (x - lx) / w;
    const dy = (y - ly) / (h * 1.25);
    return 0.62 * Math.exp(-(dx * dx + dy * dy) / 0.2);
  };
}

/**
 * PAINTS A SCREEN of one ink onto a canvas behind its subject. The dots sit on
 * a 45 degree lattice whose step is a whole number of DEVICE pixels, measured
 * through any scale the page is shown at (a page drawn at its own size and
 * shrunk into a browser), so every dot rasterises alike and the screen keeps
 * its fine, even pitch at every size it is shown, instead of melting into a
 * tint. A dot's AREA is the coverage, so the tone is true; below the smallest
 * dot the press can hold, the dots drop out in an ordered pattern rather than
 * fading, so the screen dissolves at its edge instead of ending on a line.
 */
function paint(
  cv: HTMLCanvasElement,
  host: HTMLElement,
  out: number,
  ink: string,
  shape: Shape,
) {
  const w = host.offsetWidth;
  const h = host.offsetHeight;
  if (!w || !h) return;
  const shown = host.getBoundingClientRect().width / w || 1;
  const dpr = window.devicePixelRatio || 1;
  const W = w + 2 * out;
  const H = h + 2 * out;
  const dev = Math.min(shown * dpr, 4096 / Math.max(W, H));
  cv.width = Math.max(1, Math.round(W * dev));
  cv.height = Math.max(1, Math.round(H * dev));
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = ink;
  ctx.beginPath();
  // The lattice step (device px): 2.5 CSS px on a retina screen, 3 on a 1x
  // one, where anything finer is read as a tint.
  const step = dev >= 1.5 ? 5 : 3;
  const pitch = step * Math.SQRT2;
  const least = dev >= 1.5 ? 1.05 : 0.72;
  const rows = shape.kind === "frame" ? (shape.reach * dev) / pitch : 20;
  const at = coverage(shape, w, h, rows);
  for (let m = 0; m * step < cv.width + step; m++)
    for (let k = m & 1; k * step < cv.height + step; k += 2) {
      const X = m * step + 0.5;
      const Y = k * step + 0.5;
      const c = at(X / dev - out, Y / dev - out);
      if (c <= 0) continue;
      let r = pitch * Math.sqrt(c / Math.PI);
      if (r < least) {
        // The smallest dot the press holds, kept as often as the tone asks
        // (so the area stays true), and none where it would only be dust.
        const keep = (r * r) / (least * least);
        if (keep < 0.15 || grain(m, k) >= keep) continue;
        r = least;
      }
      ctx.moveTo(X + r, Y);
      ctx.arc(X, Y, r, 0, Math.PI * 2);
    }
  ctx.fill();
}

/**
 * A SCREEN behind its parent (the subject's box), `out` px past it on every
 * side. Drawn on the client, once and again only when the box resizes: it is
 * print, so it never moves on its own.
 */
function Screen({
  ink,
  out,
  shape,
  className,
  style,
}: {
  ink: string;
  out: number;
  shape: Shape;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  // The shape as a string, so a parent's re-render never repaints the dots.
  const spec = JSON.stringify(shape);
  useEffect(() => {
    const cv = ref.current;
    const host = cv?.parentElement;
    if (!cv || !host) return;
    const s = JSON.parse(spec) as Shape;
    const draw = () => paint(cv, host, out, ink, s);
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(host);
    return () => ro.disconnect();
  }, [ink, out, spec]);
  return (
    <canvas
      ref={ref}
      aria-hidden
      className={cn("ik-screen", className)}
      style={{
        left: -out,
        top: -out,
        width: `calc(100% + ${out * 2}px)`,
        height: `calc(100% + ${out * 2}px)`,
        ...style,
      }}
    />
  );
}

/**
 * How far a subject's screen may reach: the contract's eighth. Its visible
 * dots are spent by about a ninth; the last eighth is where they dissolve.
 */
const reachOf = (size: number) => Math.round(Math.max(18, size / 8));

/** The hairline of paper between a subject and its screen. */
const gapOf = (size: number) => (size >= 240 ? 2 : 1.5);

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
            <circle cx={c} cy={c} r={rb} fill="none" stroke={ink} strokeWidth={1} />
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

/* ── the Seam: a printed rule where the media ends ─────────────────────────── */

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
  // A quieter light prints a thinner rule, never a paler one.
  const vars: Vars = {
    "--ik-ink": inkOf(source).hex,
    "--ik-rule": `${strength >= 0.8 ? 2 : 1}px`,
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
      style={{ height: strength >= 0.8 ? 2 : 1, ...style }}
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

/* ── the Bloom: a fine screen of ink round the one subject ─────────────────── */

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
  const reach = reachOf(size);
  return (
    <div
      className={cn("ik-holder", className)}
      data-ignite={ignite ? "" : undefined}
      style={style}
    >
      <Screen
        ink={inkOf(source).hex}
        out={reach}
        shape={{ kind: "frame", radius, reach, gap: gapOf(size) }}
      />
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
 * The reel on paper: one screen per ink its shots print in, stacked, only the
 * shot on screen's showing; on the cut the screens crossfade, so the print
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
  const shots = reelShots(reel);
  const shotInks = shots.map((id) => inkOf({ photo: id }).hex);
  const now = shotInks[shot] ?? shotInks[0];
  const reach = reachOf(width);
  const shape: Shape = { kind: "frame", radius, reach, gap: gapOf(width) };
  return (
    <div ref={box} className={cn("ik-holder", className)} style={style}>
      {[...new Set(shotInks)].map((ink) => (
        <Screen
          key={ink}
          ink={ink}
          out={reach}
          shape={shape}
          className="ik-reel-screen"
          style={{ opacity: ink === now ? 1 : 0 }}
        />
      ))}
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

/* ── the seed: printed from its lit corner ─────────────────────────────────── */

function SeedCover({ seed, ground, children, className, style }: SeedProps) {
  if (ground === "room")
    return (
      <RoomSeed seed={seed} className={className} style={style}>
        {children}
      </RoomSeed>
    );
  // Printed, not lit: the seed's ink laid down as a screen from where the
  // hashvatar keeps its light, solid there and spent across the cover.
  const o = orbFor(seed);
  return (
    <div data-bd-seed={seed} className={cn("ik-seed", className)} style={style}>
      <Screen
        ink={inkOf({ seed }).hex}
        out={0}
        shape={{
          kind: "pool",
          x: (o.light.x + 8) / 100,
          y: (o.light.y + 10) / 100,
        }}
      />
      {children}
    </div>
  );
}

/* ── the marks: the sky in the room, a seal in print ───────────────────────── */

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

/**
 * The icon printed: a stock tile, the ink disc and one band in the house ink,
 * no glow. The band is a third heavier than the room's sharp band, since in
 * print it carries the light alone.
 */
function PrintedIcon({
  size,
  optics,
  read,
  className,
  style,
}: {
  size: number;
  optics?: number;
  read?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const o = iconOptics(optics ?? size);
  const px = 1024 / size;
  const rD = o.rDisc * 1024;
  const gap = Math.max(o.gap * 1024, 1.5 * px);
  const band = Math.max(o.band * 1024 * 1.35, 2.5 * px);
  return (
    <svg
      role="img"
      aria-label="Partyreel"
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
      data-bd-read={read}
    >
      <path d={SQUIRCLE} fill={STOCK.card.hex} />
      <circle
        cx={512}
        cy={512}
        r={rD + gap + band / 2}
        fill="none"
        stroke={HOUSE_INK.hex}
        strokeWidth={band}
      />
      <circle cx={512} cy={512} r={rD} fill={STOCK.fg.hex} />
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
  if (appearance === "paper")
    return (
      <PrintedIcon
        size={size}
        optics={optics}
        read={read}
        className={className}
        style={style}
      />
    );
  // In the room and tinted the icon is the shared sky ring: the house's light
  // is one sky, and its key is what the seal prints.
  return (
    <RingIcon
      size={size}
      appearance={appearance}
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

/* ── the receipt: one ink, its depths as a press shows them ────────────────── */

/** A uniform screen of one ink (a tint as a press makes one: dots, never a fade). */
function Tint({ ink, cover, pitch }: { ink: string; cover: number; pitch: number }) {
  const raw = useId();
  const id = `ik${raw.replace(/[^a-zA-Z0-9]/g, "")}t`;
  const r = pitch * Math.sqrt(cover / Math.PI);
  return (
    <svg aria-hidden width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <pattern
          id={id}
          width={pitch}
          height={pitch}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <circle cx={pitch / 2} cy={pitch / 2} r={r} fill={ink} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
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
  if (ground === "room")
    return (
      <div className={className} style={{ width, ...style }}>
        <LightChips light={roomLight(source)} height={height} />
      </div>
    );
  // A press's colour bar for the one ink: solid, then two of its screens.
  const ink = inkOf(source).hex;
  const pitch = Math.max(2.4, Math.min(3.6, height * 0.36));
  return (
    <div className={cn("ik-bar", className)} style={{ width, height, ...style }}>
      <span style={{ flexGrow: 5, background: ink }} />
      <span style={{ flexGrow: 3 }}>
        <Tint ink={ink} cover={0.5} pitch={pitch} />
      </span>
      <span style={{ flexGrow: 2 }}>
        <Tint ink={ink} cover={0.22} pitch={pitch} />
      </span>
    </div>
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
