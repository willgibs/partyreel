"use client";

import { type CSSProperties, useId } from "react";

import { background, blendMode, orbFor } from "@/lib/avatar/gradient";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { AnswerReel } from "../afterglow/kit";
import { iconOptics, KEY, RingIcon, RingSymbol } from "../afterglow/marks";
import {
  DUSK,
  duskGradient,
  photosOf,
  RoomSeed,
  ShutterGlyph,
  type Source,
  type Tile,
  tone,
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
import type { PhotoId } from "../deck/media";

/**
 * CAST'S LIGHT: THE PHOTOGRAPH ITSELF, BLURRED; IN THE ROOM IT GLOWS, ON PAPER
 * IT FALLS.
 *
 * Every form is drawn from the picture, never from a palette: the photograph
 * (or the event's seed, or the house sky) is laid behind its subject and an
 * SVG filter turns it into light. In the room the light glows round the
 * subject, a little more below than above because light falls. On paper it
 * falls through the subject, down and to the right from the product's one key
 * light at the top-left, and lands as a coloured shadow: darker than the page,
 * so it has the headroom a glow on white never has, and saturated, so it reads
 * as light through glass. Sun through a glass of wine lands red on a white
 * tablecloth.
 *
 * ★ THE FILTER IS THE TAKE (`LightFilter`), in four steps, each answering a way
 * a blurred photograph fails as light:
 *  1. MERGE: the picture blurred, then made opaque again (normalised
 *     convolution: a blur's alpha is divided back out), so its edge colours
 *     run on past the edge instead of fading to grey or to nothing;
 *  2. BIND: each region mixed with the picture's own overall colour (the same
 *     picture blurred far wider), so a busy photograph casts one family of
 *     colour, never rainbow patches;
 *  3. REGISTER: a lift on the darks, then each region's chroma measured and
 *     brought to one strength (`Register`), so a night photograph still casts
 *     colour, a laser show never goes neon, and nothing is a grey drop shadow;
 *     and a yellow drifting green pushed back to gold (never olive, never
 *     lemon);
 *  4. LAND: the field kept only inside the subject's own shape, offset and
 *     softened (paper), or grown and softened (the room).
 *
 * ★ A FORM'S BOX IS ITS SUBJECT'S (the take contract): the glow and the shadow
 * extend outside it, the shadow down and right by about a sixth of the subject.
 */

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** A filter id unique to the instance, safe inside `url(#…)`. */
function useFid(): string {
  return `ct${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

/* ── the light's picture ───────────────────────────────────────────────────── */

const srcOf = (id: PhotoId) => marketingImage(id).src;

/** A source with no photograph: the seed's orb or the house sky, already one family. */
const designedOf = (s: Source) => photosOf(s).length === 0;

/** The seed as a picture: production's hashvatar, its mesh. */
function seedField(seed: string): CSSProperties {
  return {
    backgroundImage: background(orbFor(seed), "mesh"),
    backgroundBlendMode: blendMode("mesh"),
  };
}

/**
 * A SOURCE AS A PICTURE: its photographs themselves, else the seed's orb,
 * else the house sky. `fit` says how a picture covers the box: whole and
 * centred (a Bloom, a Ring), its last row at the box's foot (the Seam's lit
 * line), or squeezed whole into a strip (a receipt). Several photographs
 * stand side by side, each in its own column.
 */
function fieldOf(
  source: Source,
  fit: "cover" | "edge" | "strip",
  sky = "135deg",
): CSSProperties {
  if ("house" in source) return { backgroundImage: duskGradient(sky) };
  if ("seed" in source) return seedField(source.seed);
  const ids = photosOf(source);
  const n = ids.length;
  const col = n === 1 ? "100%" : `${100 / n + 0.5}%`;
  const layer = (id: PhotoId, i: number) => {
    const x = n === 1 ? 50 : (i / (n - 1)) * 100;
    if (fit === "edge")
      return `url(${srcOf(id)}) ${x}% 100% / ${col} auto no-repeat`;
    if (fit === "strip" || n > 1)
      return `url(${srcOf(id)}) ${x}% 50% / ${col} 100% no-repeat`;
    return `url(${srcOf(id)}) 50% 50% / cover no-repeat`;
  };
  return { background: ids.map(layer).join(", ") };
}

/** The share of a photograph's height whose last rows a Seam stretches down its reach. */
const EDGE_SLICE = 0.05;

/**
 * A SOURCE'S EDGE AS A PICTURE: each photograph's last rows stretched down
 * the Seam's whole reach and flipped, so the box's top is the very edge and
 * the colours below it are the edge's own, run on (the sky and the seed run
 * along the edge as they are).
 */
function edgeOf(source: Source, reach: number): CSSProperties {
  if ("house" in source) return { backgroundImage: duskGradient("90deg") };
  if ("seed" in source) return seedField(source.seed);
  const ids = photosOf(source);
  const n = ids.length;
  const col = n === 1 ? "100%" : `${100 / n + 0.5}%`;
  const tall = Math.round(reach / EDGE_SLICE);
  return {
    background: ids
      .map(
        (id, i) =>
          `url(${srcOf(id)}) ${n === 1 ? 50 : (i / (n - 1)) * 100}% 100% / ${col} ${tall}px no-repeat`,
      )
      .join(", "),
  };
}

/* ── the register: one strength for every photograph ───────────────────────── */

/**
 * A REGISTER: the band of lightness a light is drawn in (`floor` for the
 * darkest region, `floor + rise` for the brightest) and the saturation every
 * region lands at (`target`, rising a little with the region's own, `slope`).
 *
 * ★ ONE GAIN CANNOT SERVE TWELVE PHOTOGRAPHS: the gain that gives a dim night
 * photograph its colour turns a laser show neon. So each region's chroma is
 * measured and two gains (`hi`, `lo`) are blended through a lookup curve, so
 * every region lands near the target: the arch's soft green and the lasers'
 * blue cast with one strength, and nothing goes grey or neon.
 */
type Register = {
  floor: number;
  rise: number;
  target: number;
  slope: number;
  hi: number;
  lo: number;
};

/*
 * The registers, tuned on all twelve stills. `hi` caps how far a near-grey
 * region is pushed: higher and a cream napkin casts lemon; a ring's thin band
 * takes more, so a pale photograph still gives its ring a colour.
 */
/** Paper's: every region lifted into one band below the page. */
const PAPER: Register = { floor: 0.44, rise: 0.4, target: 0.55, slope: 0.3, hi: 5.5, lo: 0.8 };
/**
 * Paper's for a light with no photograph (the seed, the sky): those are
 * mid-light by design, with no darks of their own to give a shadow depth, so
 * the photographs' band would land them pastel. Deeper, so they stay a
 * coloured shadow, darker than the page.
 */
const PAPER_DEEP: Register = { floor: 0.24, rise: 0.42, target: 0.6, slope: 0.3, hi: 5.5, lo: 0.8 };
/** The room's glow: darks stay dark, colour runs rich. */
const GLOW: Register = { floor: 0.28, rise: 0.58, target: 0.6, slope: 0.3, hi: 6, lo: 0.8 };
/** The Seam in the room: born dark-to-bright as the edge is, so a white cloth glows and a shadow stays dark. */
const SEAM: Register = { floor: 0.24, rise: 0.68, target: 0.55, slope: 0.3, hi: 6, lo: 0.8 };
/** The Seam's line in the room: the edge itself, lit, near white in the edge's own colours. */
const LINE: Register = { floor: 0.74, rise: 0.24, target: 0.35, slope: 0.2, hi: 5, lo: 0.6 };
/** A ring's band in the room: luminous against its dark face. */
const BAND_ROOM: Register = { floor: 0.5, rise: 0.42, target: 0.6, slope: 0.3, hi: 9, lo: 0.8 };
/** A ring's band on paper: rich, so it holds against the page and the face. */
const BAND_PAPER: Register = { floor: 0.4, rise: 0.44, target: 0.62, slope: 0.3, hi: 12, lo: 0.8 };

/** The lift on the darks before the register (a gamma), so a night photograph keeps its colour. */
const LIFT = 0.6;

const LUMA = [0.2126, 0.7152, 0.0722] as const;
const fix = (xs: number[]) =>
  xs.map((x) => Math.round(x * 10000) / 10000).join(" ");

/** The register's matrix at one gain: out = floor + (rise - gain) * Y + gain * C. */
function matrixAt(r: Register, gain: number): string {
  const row = (i: number) =>
    [0, 1, 2]
      .map((j) => (i === j ? gain : 0) + (r.rise - gain) * LUMA[j])
      .concat([0, r.floor]);
  return fix([...row(0), ...row(1), ...row(2), 0, 0, 0, 1, 0]);
}

/** Twice each channel's distance above its grey (clipped at zero): their sum is the chroma. */
const CHROMA = fix(
  [0, 1, 2]
    .flatMap((i) => [
      ...[0, 1, 2].map((j) => (i === j ? 2 : 0) - 2 * LUMA[j]),
      0,
      0,
    ])
    .concat([0, 0, 0, 1, 0]),
);
/** The chroma's three parts summed into alpha. */
const SUM = "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 1 1 0 0";

/*
 * ★ LIGHT NEVER GOES OLIVE (the house rule `unOlive` keeps for every lamp): a
 * region whose green has crept just past its red is pushed back toward gold,
 * in proportion to how yellow it is, so a cream napkin casts gold, never
 * lemon. Greens (green well past red), greys and blues are left alone.
 */
/** How far green has crept past red (from just below it), into red. */
const GREENISH = "-1 1 0 0 0.04  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1";
/** The push back toward gold for each amount of creep: nothing for a true green. */
const HUMP = "0 0.08 0.15 0.18 0.12 0.04 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0";
/** How yellow it is: red and green together, well above blue, into red. */
const YELLOWISH = "1.5 1.5 -3 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1";

/** How much of the low gain a region of chroma c takes, so it lands near the target. */
function curveOf(r: Register): string {
  const out: string[] = [];
  for (let i = 0; i <= 20; i++) {
    const c = i / 20;
    const gain = c > 0 ? (r.target + r.slope * c) / c : r.hi;
    out.push(
      (Math.min(1, Math.max(0, (r.hi - gain) / (r.hi - r.lo))) || 0).toFixed(3),
    );
  }
  return out.join(" ");
}

/* ── the filter: merge, bind, register, land ───────────────────────────────── */

/** How one light is drawn (every length in px). */
type Draw = {
  /** The field's blur: neighbouring regions merge at this scale (`mergeY` down the box). */
  merge: number;
  mergeY?: number;
  /** The picture's overall colour: the field blurred far wider. */
  wide: number;
  /** How much of that overall colour every region takes. */
  bind: number;
  register: Register;
  /**
   * Where it lands: the subject's own shape, offset, grown and softened. All
   * four at zero is a field that fills its box (a band, a strip, an edge),
   * clipped by its holder.
   */
  dx: number;
  dy: number;
  grow: number;
  soft: number;
};

/**
 * Paper: the coloured shadow of a subject whose larger side is `s`. ★ A DENSE
 * CORE, A SHORT PENUMBRA: offset well past its softness, so it reads as a
 * cast shadow and never as a glow, and spent within an eighth of the subject
 * (offset plus two softnesses), the margin the take contract keeps round it.
 */
function fallOf(s: number, designed: boolean): Draw {
  return {
    merge: s * 0.09,
    wide: s * 0.5,
    bind: designed ? 0 : 0.62,
    register: designed ? PAPER_DEEP : PAPER,
    dx: s * 0.032,
    dy: s * 0.065,
    grow: 0,
    soft: s * 0.028,
  };
}

/** The room: the glow round a subject whose larger side is `s`, more below than above. */
function glowOf(s: number, designed: boolean): Draw {
  return {
    merge: s * 0.1,
    wide: s * 0.5,
    bind: designed ? 0 : 0.55,
    register: GLOW,
    dx: 0,
    dy: s * 0.05,
    grow: s * 0.025,
    soft: s * 0.1,
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * THE TAKE'S FILTER, defined beside the element it lights (`filter: url(#id)`)
 * for a `w` by `h` box, its region only as far past the box as the light lands.
 */
function LightFilter({
  id,
  d,
  w,
  h,
}: {
  id: string;
  d: Draw;
  w: number;
  h: number;
}) {
  const lands = d.dx !== 0 || d.dy !== 0 || d.grow > 0 || d.soft > 0;
  const m = lands
    ? Math.ceil(Math.max(Math.abs(d.dx), Math.abs(d.dy)) + d.grow + d.soft * 3 + 4)
    : 0;
  const r = d.register;
  return (
    <svg aria-hidden focusable="false" className="ct-defs">
      <filter
        id={id}
        filterUnits="userSpaceOnUse"
        x={-m}
        y={-m}
        width={Math.ceil(w + 2 * m)}
        height={Math.ceil(h + 2 * m)}
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur
          in="SourceGraphic"
          stdDeviation={`${r1(d.merge)} ${r1(d.mergeY ?? d.merge)}`}
          result="near"
        />
        {/* ★ Made opaque again: the blur's alpha divided back out, so the
            edge's own colours run on past the edge (never a fade to grey). */}
        <feComponentTransfer in="near" result="field">
          <feFuncA type="linear" slope={400} />
        </feComponentTransfer>
        <feGaussianBlur
          in="SourceGraphic"
          stdDeviation={r1(d.wide)}
          result="far"
        />
        <feComponentTransfer in="far" result="whole">
          <feFuncA type="linear" slope={400} />
        </feComponentTransfer>
        {d.bind > 0 ? (
          <feComposite
            in="field"
            in2="whole"
            operator="arithmetic"
            k1={0}
            k2={1 - d.bind}
            k3={d.bind}
            k4={0}
            result="bound"
          />
        ) : null}
        {/* ★ Opaque everywhere it is read: where the field runs out the
            picture's whole colour carries on (and past that a grey), so the
            light never ends partway and no step below runs on a part-alpha. */}
        <feFlood floodColor="#808080" result="grey" />
        <feComposite in="whole" in2="grey" operator="over" result="backed" />
        <feComposite
          in={d.bind > 0 ? "bound" : "field"}
          in2="backed"
          operator="over"
          result="full"
        />
        <feComponentTransfer in="full" result="lifted">
          <feFuncR type="gamma" exponent={LIFT} />
          <feFuncG type="gamma" exponent={LIFT} />
          <feFuncB type="gamma" exponent={LIFT} />
        </feComponentTransfer>
        {/* Each region's chroma, into alpha, through the curve: the share of
            the low gain it takes, so every region lands at one strength. */}
        <feColorMatrix in="lifted" type="matrix" values={CHROMA} result="parts" />
        <feColorMatrix in="parts" type="matrix" values={SUM} result="chroma" />
        <feComponentTransfer in="chroma" result="share">
          <feFuncA type="table" tableValues={curveOf(r)} />
        </feComponentTransfer>
        <feColorMatrix
          in="lifted"
          type="matrix"
          values={matrixAt(r, r.hi)}
          result="high"
        />
        <feColorMatrix
          in="lifted"
          type="matrix"
          values={matrixAt(r, r.lo)}
          result="low"
        />
        <feComposite in="low" in2="share" operator="in" result="lowPart" />
        <feComposite in="high" in2="share" operator="out" result="highPart" />
        <feComposite
          in="lowPart"
          in2="highPart"
          operator="arithmetic"
          k1={0}
          k2={1}
          k3={1}
          k4={0}
          result="light"
        />
        <feColorMatrix in="light" type="matrix" values={GREENISH} result="creep" />
        <feComponentTransfer in="creep" result="push">
          <feFuncR type="table" tableValues={HUMP} />
        </feComponentTransfer>
        <feColorMatrix in="light" type="matrix" values={YELLOWISH} result="yellow" />
        <feComposite
          in="push"
          in2="yellow"
          operator="arithmetic"
          k1={1}
          k2={0}
          k3={0}
          k4={0}
          result="gold"
        />
        <feComposite
          in="light"
          in2="gold"
          operator="arithmetic"
          k1={0}
          k2={1}
          k3={1}
          k4={0}
          result="clean"
        />
        {lands ? (
          <>
            <feOffset in="clean" dx={r1(d.dx)} dy={r1(d.dy)} result="moved" />
            {d.grow > 0 ? (
              <feMorphology
                in="SourceAlpha"
                operator="dilate"
                radius={r1(d.grow)}
                result="grown"
              />
            ) : null}
            <feOffset
              in={d.grow > 0 ? "grown" : "SourceAlpha"}
              dx={r1(d.dx)}
              dy={r1(d.dy)}
              result="at"
            />
            <feGaussianBlur in="at" stdDeviation={r1(d.soft)} result="shape" />
            <feComposite in="moved" in2="shape" operator="in" />
          </>
        ) : null}
      </filter>
    </svg>
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
  const id = useFid();
  const designed = designedOf(source);
  const d = ground === "room" ? glowOf(size, designed) : fallOf(size, designed);
  // The light hangs on the subject's own box (`ct-subject` shrinks to its
  // children), so a holder stretched by a grid or a flex column never
  // stretches the light past the thing that casts it.
  return (
    <div
      className={cn("ct-holder", className)}
      data-ground={ground}
      data-ignite={ignite ? "" : undefined}
      style={style}
    >
      <div className="ct-subject">
        <LightFilter id={id} d={d} w={size} h={size} />
        <span
          aria-hidden
          className="ct-light"
          style={{
            ...fieldOf(source, "cover"),
            borderRadius: radius,
            filter: `url(#${id})`,
          }}
        />
        <div className="ct-inner">{children}</div>
      </div>
    </div>
  );
}

/**
 * THE REEL'S BLOOM: the kit's answering reel, each shot's light its own
 * photograph, so the glow is literally the frames, blurred, and on paper the
 * frames' coloured shadow, crossfading on the cut.
 */
function ReelBloom({
  reel,
  ground,
  width,
  radius = 2,
  focus,
  className,
  style,
}: ReelBloomProps) {
  const id = useFid();
  const d = ground === "room" ? glowOf(width, false) : fallOf(width, false);
  const vars: Vars = { "--ct-filter": `url(#${id})`, ...style };
  return (
    <div className={cn("ct-reel", className)} data-ground={ground} style={vars}>
      {/* Tall enough for a portrait reel at this width. */}
      <LightFilter id={id} d={d} w={width} h={width * 1.8} />
      <AnswerReel
        reel={reel}
        ground={ground}
        blur={0}
        spread={0}
        radius={radius}
        rest={ground === "room" ? 0.92 : 0.94}
        focus={focus}
        light={(shot) => `url(${srcOf(shot)})`}
        style={{ height: "100%" }}
      />
    </div>
  );
}

/* ── the Seam ──────────────────────────────────────────────────────────────── */

/**
 * The Seam's field: the edge's colours merged along it (far less down it,
 * where they are already one row run on), bound to the edge's whole colour
 * (several photographs with no edge above them, harder), and registered.
 */
function edgeDraw(
  ground: "room" | "paper",
  unit: number,
  reach: number,
  bind: number,
): Draw {
  return {
    merge: unit * 0.04,
    mergeY: reach * 0.12,
    wide: unit * 0.5,
    bind,
    register: ground === "room" ? SEAM : PAPER,
    dx: 0,
    dy: 0,
    grow: 0,
    soft: 0,
  };
}

/**
 * How far an edge's coloured shadow reaches on paper: short (a photograph a
 * few millimetres off the page), whatever room the slide gives the Seam.
 */
const spentOf = (reach: number) => Math.min(Math.max(reach * 0.6, 14), 44);

/**
 * THE FALL-OFF, as the edge field's own mask: in the room hot at the edge and
 * spent before the words; on paper dense at the edge and gone within `spent`.
 * ★ Written `to top`: the field is flipped, so its local foot is the edge.
 * ★ It masks the field itself, never the Seam's box: a masked box is an
 * isolated group, and the paper shadow could no longer multiply onto the page.
 */
function decayOf(ground: "room" | "paper", spent: number): string {
  if (ground === "room")
    return "linear-gradient(to top, #000 0%, rgb(0 0 0 / 0.6) 10%, rgb(0 0 0 / 0.3) 28%, rgb(0 0 0 / 0.1) 56%, transparent 100%)";
  return `linear-gradient(to top, #000 0, rgb(0 0 0 / 0.5) ${r1(spent * 0.28)}px, rgb(0 0 0 / 0.16) ${r1(spent * 0.62)}px, transparent ${r1(spent)}px)`;
}

/** The Seam's line in the room: the edge's last row along it, one px, lit. */
function lineDraw(unit: number): Draw {
  return {
    merge: unit * 0.035,
    mergeY: 0,
    wide: 0,
    bind: 0,
    register: LINE,
    dx: 0,
    dy: 0,
    grow: 0,
    soft: 0,
  };
}

function Seam({
  source,
  ground,
  edge = "top",
  reach,
  strength = 1,
  width,
  className,
  style,
}: SeamProps) {
  const id = useFid();
  // ★ LIGHT ONLY FALLS FROM SOMETHING: on paper the Seam is a photograph's
  // shadow, so it is drawn only where a photograph's edge stands over it (a
  // source read from an edge); a paper foot with no photograph above it
  // stays paper.
  const adjacent = "photo" in source && Boolean(source.edge);
  if (ground === "paper" && !adjacent) return null;
  const room = ground === "room";
  const w = width ?? 600;
  const r = reach ?? (room ? 120 : 56);
  const spent = spentOf(r);
  const bind = designedOf(source) ? 0 : adjacent ? 0.55 : 0.8;
  const mask = decayOf(ground, spent);
  const o = Math.min(1, strength);
  return (
    <div
      aria-hidden
      className={cn("ct-seam", className)}
      data-edge={edge}
      data-ground={ground}
      style={{ height: r, ...style }}
    >
      <LightFilter id={id} d={edgeDraw(ground, w, r, bind)} w={w} h={r} />
      <span
        className="ct-edge"
        style={{
          ...edgeOf(source, r),
          opacity: o * (room ? 0.95 : 0.88),
          filter: `url(#${id})`,
          WebkitMaskImage: mask,
          maskImage: mask,
          // On paper the edge's colours land a little to the right of where
          // they stand: the key light is at the top-left.
          transform: room
            ? "scaleY(-1)"
            : `translateX(${r1(spent * 0.25)}px) scaleY(-1)`,
        }}
      />
      {room ? (
        <>
          <LightFilter id={`${id}n`} d={lineDraw(w)} w={w} h={1} />
          <span
            className="ct-seam-line"
            style={{
              ...fieldOf(source, "edge", "90deg"),
              opacity: o,
              filter: `url(#${id}n)`,
            }}
          />
        </>
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
  const id = useFid();
  const room = ground === "room";
  const r = reach ?? (room ? 120 : 56);
  const spent = spentOf(r);
  const unit =
    tiles.reduce((s, t) => s + t.w, 0) / Math.max(1, tiles.length) || width;
  const tall = Math.round(r / EDGE_SLICE);
  const o = Math.min(1, strength);
  // In the room each photograph's light pools under it and spends itself
  // fast (the shared wall's own pools, flipped with the field: its local foot
  // is the edge); on paper each casts down and a little right, one short
  // shadow under the wall (a gap's few px vanish in its penumbra).
  const pools = room
    ? [
        ...tiles.map(
          (t) =>
            `radial-gradient(${Math.round(t.w * 0.74)}px 100% at ${Math.round(t.x + t.w / 2)}px 100%, rgb(0 0 0 / 0.9) 0%, rgb(0 0 0 / 0.38) 20%, rgb(0 0 0 / 0.08) 50%, transparent 84%)`,
        ),
        "linear-gradient(to top, rgb(0 0 0 / 0.55) 0%, rgb(0 0 0 / 0.14) 16%, transparent 34%)",
      ].join(", ")
    : decayOf("paper", spent);
  const strip = (t: Tile, cls: string, size: string) => (
    <span
      key={`${t.id}-${Math.round(t.x)}`}
      className={cls}
      style={{
        left: t.x,
        width: t.w,
        background: `url(${srcOf(t.id)}) 50% 100% / ${size} no-repeat`,
      }}
    />
  );
  return (
    <div
      aria-hidden
      className="ct-seam"
      data-edge="top"
      data-ground={ground}
      style={{ height: r, ...style }}
    >
      <LightFilter
        id={id}
        d={edgeDraw(ground, unit, r, 0.45)}
        w={width}
        h={r}
      />
      <span
        className="ct-edge"
        style={{
          opacity: o * (room ? 0.95 : 0.88),
          filter: `url(#${id})`,
          WebkitMaskImage: pools,
          maskImage: pools,
          transform: room
            ? "scaleY(-1)"
            : `translateX(${r1(spent * 0.25)}px) scaleY(-1)`,
        }}
      >
        {tiles.map((t) => strip(t, "ct-edge-tile", `100% ${tall}px`))}
      </span>
      {room ? (
        <>
          <LightFilter id={`${id}n`} d={lineDraw(unit)} w={width} h={1} />
          <span
            className="ct-seam-lines"
            style={{ opacity: o, filter: `url(#${id}n)` }}
          >
            {tiles.map((t) => strip(t, "ct-seam-line-tile", "100% auto"))}
          </span>
        </>
      ) : null}
    </div>
  );
}

/* ── the Ring ──────────────────────────────────────────────────────────────── */

function Ring({
  source,
  ground,
  size = 64,
  progress,
  glyph = "add",
  label,
  className,
  style,
}: RingProps) {
  const id = useFid();
  // The face's proportions are the room ring's own (`RoomRing`), so a slide
  // lays every take's Add out the same way.
  const band = Math.max(2, Math.round(size * 0.05 * 2) / 2);
  const gap = Math.max(2, Math.round(size * 0.035));
  const out = gap + band;
  const ring = size + out * 2;
  const designed = designedOf(source);
  const field = fieldOf(source, "cover");
  const bandDraw: Draw = {
    merge: ring * 0.12,
    wide: ring * 0.6,
    bind: designed ? 0 : 0.4,
    register: ground === "room" ? BAND_ROOM : BAND_PAPER,
    dx: 0,
    dy: 0,
    grow: 0,
    soft: 0,
  };
  // The room: a glow round the band. Paper: the band's colours fall down and
  // to the right, a crescent of coloured light past the face.
  const lightDraw: Draw =
    ground === "room"
      ? {
          ...glowOf(ring, designed),
          dy: ring * 0.04,
          grow: 0,
          soft: ring * 0.2,
        }
      : {
          ...fallOf(ring, designed),
          merge: ring * 0.15,
          // So small a light casts the album's overall colour, one family.
          bind: designed ? 0 : 0.85,
          dx: ring * 0.07,
          dy: ring * 0.13,
          soft: ring * 0.075,
        };
  const sending = progress !== undefined;
  const vars: Vars = {
    width: size,
    height: size,
    "--ct-out": `${out}px`,
    "--ct-band": `${band}px`,
    "--ag-p": progress ?? 1,
    ...style,
  };
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("ct-ring", className)}
      data-ground={ground}
      data-state={sending ? "sending" : "rest"}
      style={vars}
    >
      <LightFilter id={`${id}b`} d={bandDraw} w={ring} h={ring} />
      <LightFilter id={`${id}l`} d={lightDraw} w={ring} h={ring} />
      <span
        className="ct-ring-light"
        style={{ ...field, filter: `url(#${id}l)` }}
      />
      <span
        className="ct-ring-band"
        data-part="track"
        style={{ ...field, filter: `url(#${id}b)` }}
      />
      {sending ? (
        <span
          className="ct-ring-band"
          data-part="fill"
          style={{ ...field, filter: `url(#${id}b)` }}
        />
      ) : null}
      <span className="ct-ring-shade" />
      <span className="ct-ring-face">
        <ShutterGlyph glyph={glyph} size={size * 0.36} />
      </span>
    </span>
  );
}

/* ── the seed ──────────────────────────────────────────────────────────────── */

function SeedCover({ seed, ground, children, className, style }: SeedProps) {
  const id = useFid();
  if (ground === "room")
    return (
      <RoomSeed seed={seed} className={className} style={style}>
        {children}
      </RoomSeed>
    );
  // On paper the seed is an object: production's hashvatar as an orb in the
  // empty cover, lit from the top-left like everything else, casting its own
  // colour down and to the right through the take's filter. Its light falls
  // from something, never a wash across the cover.
  const w = typeof style?.width === "number" ? style.width : 240;
  const h = typeof style?.height === "number" ? style.height : 160;
  const orb = Math.round(Math.min(w, h) * 0.46);
  const d: Draw = {
    merge: orb * 0.2,
    wide: orb * 0.6,
    bind: 0,
    register: PAPER_DEEP,
    dx: orb * 0.09,
    dy: orb * 0.17,
    grow: 0,
    soft: orb * 0.1,
  };
  const mesh = seedField(seed);
  return (
    <div data-bd-seed={seed} className={cn("ct-seed", className)} style={style}>
      <LightFilter id={id} d={d} w={orb} h={orb} />
      <span
        aria-hidden
        className="ct-seed-fall"
        style={{ ...mesh, width: orb, height: orb, filter: `url(#${id})` }}
      />
      <span
        aria-hidden
        className="ct-seed-orb"
        style={{ ...mesh, width: orb, height: orb }}
      />
      {children}
    </div>
  );
}

/* ── the marks ─────────────────────────────────────────────────────────────── */

/** The house sky's four stops, its lit edge first. */
const SKY = DUSK.map((s) => tone(s.l, s.c, s.h).oklch);

/** The printed face's lightness, the band's shadow side falls toward it. */
const FACE_L = 0.2;

/**
 * THE RING PRINTED ON PAPER: the house sky walked round the band from the key
 * light, a step deeper than the room's so its lit arc holds on white (a light
 * amber on paper is the washed-out zone), and dimmed toward the dark face on
 * its shadow side rather than toward the page, so no part of it goes pastel:
 * a gold arc at the top-left, through coral and rose, into plum.
 */
function printBand(deg: number, floor: number): string {
  const d = Math.abs(((((deg - KEY) % 360) + 540) % 360) - 180);
  const t = d / 180;
  let i = 0;
  while (i < DUSK.length - 2 && t > DUSK[i + 1].t) i++;
  const a = DUSK[i];
  const b = DUSK[i + 1];
  const u = Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
  const s = u * u * (3 - 2 * u);
  const turn = ((b.h - a.h + 540) % 360) - 180;
  const k =
    floor +
    (1 - floor) * Math.pow((Math.cos((d * Math.PI) / 180) + 1) / 2, 1.5);
  const l = a.l + (b.l - a.l) * s - 0.1;
  const c = a.c + (b.c - a.c) * s;
  return tone(FACE_L + (l - FACE_L) * k, c * k, (a.h + turn * s + 360) % 360)
    .hex;
}

/**
 * THE ICON'S FALL, drawn on the paper tile under the ring (`RingIcon`'s
 * `under`): the ring's outer disc, offset down and to the right and softened,
 * filled with the house sky from the ring's edge outward, so the warm key
 * light lands first and spends itself to violet. It lands only outside the
 * ring: the gap between band and face stays the tile.
 */
function IconFall({ size, optics }: { size: number; optics?: number }) {
  const id = useFid();
  const o = iconOptics(optics ?? size);
  const outer = (o.rDisc + o.gap + o.band) * 1024;
  const far = outer + 150;
  return (
    <>
      <defs>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x={0} y={0} width={1024} height={1024}>
          <rect width={1024} height={1024} fill="#fff" />
          <circle cx={512} cy={512} r={outer - 2} fill="#000" />
        </mask>
        <radialGradient
          id={`${id}g`}
          gradientUnits="userSpaceOnUse"
          cx={512}
          cy={512}
          r={far}
        >
          <stop offset={outer / far} stopColor={SKY[0]} />
          <stop offset={(outer + 45) / far} stopColor={SKY[1]} />
          <stop offset={(outer + 95) / far} stopColor={SKY[2]} />
          <stop offset={1} stopColor={SKY[3]} />
        </radialGradient>
        <filter id={`${id}f`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={outer * 0.15} />
        </filter>
      </defs>
      <g mask={`url(#${id}m)`} style={{ mixBlendMode: "multiply" }}>
        <g filter={`url(#${id}f)`}>
          <circle
            cx={512 + outer * 0.13}
            cy={512 + outer * 0.25}
            r={outer}
            fill={`url(#${id}g)`}
            opacity={0.92}
          />
        </g>
      </g>
    </>
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
  if (appearance !== "paper")
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
  // Printed: a light tile, the ring printed deep with no glow (a glow on
  // white is the stain), and its warm light falling past it inside the tile.
  const floor = Math.max(0.35, iconOptics(optics ?? size).floor);
  return (
    <RingIcon
      size={size}
      appearance="paper"
      optics={optics}
      read={read}
      glow={false}
      ring={(deg) => printBand(deg, floor)}
      under={<IconFall size={size} optics={optics} />}
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
  // On paper the ring is printed deep and its warm light falls past it, the
  // sky from the ring's edge outward (the centre sits back up and left of
  // the fall's own box, where the ring is).
  const px = (k: number) => `${Math.round(size * k)}px`;
  const floor = size < 40 ? 0.42 : 0.35;
  const vars: Vars = {
    width: size,
    height: size,
    "--ct-fall": `radial-gradient(circle at 43% 37%, ${SKY[0]} ${px(0.5)}, ${SKY[1]} ${px(0.6)}, ${SKY[2]} ${px(0.7)}, ${SKY[3]} ${px(0.85)})`,
    // Only outside the ring (where it is, up and left of the fall's box).
    "--ct-hole": `radial-gradient(circle at 43% 37%, transparent ${px(0.49)}, #000 ${px(0.5)})`,
    "--ct-soft": `${Math.max(1.5, size * 0.075)}px`,
    ...style,
  };
  return (
    <span className={cn("ct-mark", className)} style={vars}>
      <span aria-hidden className="ct-mark-fall" />
      <span className="ct-centre">
        <RingSymbol
          size={size}
          appearance="paper"
          glow={false}
          ring={(deg) => printBand(deg, floor)}
        />
      </span>
    </span>
  );
}

/* ── where the light came from ─────────────────────────────────────────────── */

function Receipt({
  source,
  ground,
  width = 120,
  height = 8,
  className,
  style,
}: ReceiptProps) {
  const id = useFid();
  const designed = designedOf(source);
  const field = fieldOf(source, "strip", "90deg");
  const strip: Draw = {
    merge: Math.max(3, height * 1.2),
    wide: width * 0.5,
    // One family, as small as it is: half the photograph's whole colour.
    bind: designed ? 0 : 0.5,
    register: ground === "room" ? BAND_ROOM : BAND_PAPER,
    dx: 0,
    dy: 0,
    grow: 0,
    soft: 0,
  };
  const fall: Draw = {
    ...strip,
    bind: designed ? 0 : 0.5,
    register: designed ? PAPER_DEEP : PAPER,
    dx: height * 0.3,
    dy: height * 0.7,
    soft: height * 0.55,
  };
  return (
    <div
      className={cn("ct-receipt", className)}
      data-ground={ground}
      style={{ width, height, ...style }}
    >
      <LightFilter id={`${id}s`} d={strip} w={width} h={height} />
      {ground === "paper" ? (
        <>
          <LightFilter id={`${id}f`} d={fall} w={width} h={height} />
          <span
            aria-hidden
            className="ct-receipt-fall"
            style={{
              ...field,
              borderRadius: height / 2,
              filter: `url(#${id}f)`,
            }}
          />
        </>
      ) : null}
      <span className="ct-receipt-strip" style={{ borderRadius: height / 2 }}>
        <span style={{ ...field, filter: `url(#${id}s)` }} />
      </span>
    </div>
  );
}

export const CAST_LIGHT: TakeLight = {
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
