import {
  BUILT,
  type Card,
  clamp01,
  FLIGHT,
  frameAt,
  GEO,
  type Geo,
  opacityAt,
  smoothstep,
  STREAM_FRAMES,
} from "@/components/marketing/sections/home/hero-stream";

/**
 * THE HERO AT A TABLET'S WIDTH: THE THREE GEOMETRIES THE `tablet` ASK DRAWS,
 * each as one table the drawing and its loop read the same way.
 *
 * Moved here from `loose-ends`' `hero-tablet` (its engine and its question are
 * at `git show e199f43f:"src/app/(dev)/design/sandbox/loose-ends/hero-tablet-engine.ts"`),
 * because it sized the hero around an object this board is replacing; the
 * question is asked again here around the picked card.
 *
 * `today` and `early` wear PRODUCTION'S OWN tables unmodified (`BUILT.base`
 * and `BUILT.lg` with `frameAt`), imported rather than retyped, so those two
 * are byte for byte what ships (today) and what moving `LG_MIN` to 768 would
 * ship (early). Only `tablet` needed new numbers, and it is composed rather
 * than guessed: every length is `base`'s plus `t = (900 - 375) / (1440 - 375)`
 * of the way to `lg`'s, the step the type ladder already takes between two
 * named widths. Four fields are not lerped, on purpose: `blockH` is `lg`'s,
 * because at 900 the action row fits on one line and the eyebrow wears `lg`'s
 * air; `halfRef` and `halfMin` are defined BY the range the table serves (900
 * and 768), exactly as `base` and `lg` are by theirs; and `axisPct` is SOLVED
 * for the screen this range mostly is, a tablet held upright. No reference is
 * that tall for its width, so the lerp's 34 percent left the composition in the
 * top two thirds with a quarter of the screen empty under it; at 38 the card's
 * top and the block's foot stand the same distance (about 270px) from the
 * header and the fold at 900 by 1200. A short desk window clamps as today.
 *
 * ★ THE BAND'S BP-INDEPENDENT CONSTANTS ARE COPIED VERBATIM from
 * `hero-stream.ts` (KAPPA, TURN, GAIN, CARD_SCALE, the aspect table, the scan,
 * the header, the plate), because that file closes `Bp` over two geometries and
 * exports none of them. A wiring round that picks `tablet` makes `Bp` a
 * three-member union there and deletes this copy; read that file's header
 * before changing anything here, every ★ in it applies unchanged.
 */

export type Geometry = "today" | "tablet" | "early";

const t = (900 - 375) / (1440 - 375);
/** Pixel and millisecond fields land on whole numbers, as `base` and `lg` are set. */
const lerp = (base: number, lg: number) => Math.round(base + t * (lg - base));
/** The one dimensionless field, a ratio of half-widths: two decimals. */
const lerpRatio = (base: number, lg: number) =>
  Math.round((base + t * (lg - base)) * 100) / 100;
const pct = (v: string) => Number.parseFloat(v);

export const TABLET_GEO: Geo = {
  qr: lerp(GEO.base.qr, GEO.lg.qr),
  card: lerp(GEO.base.card, GEO.lg.card),
  perspective: lerp(GEO.base.perspective, GEO.lg.perspective),
  fade: `${lerp(pct(GEO.base.fade), pct(GEO.lg.fade))}%`,
  blockW: lerp(GEO.base.blockW, GEO.lg.blockW),
  blockH: GEO.lg.blockH,
  h1Max: lerp(GEO.base.h1Max, GEO.lg.h1Max),
  lowMax: lerp(GEO.base.lowMax, GEO.lg.lowMax),
  margin: lerp(GEO.base.margin, GEO.lg.margin),
  breath: lerp(GEO.base.breath, GEO.lg.breath),
  airTop: lerp(GEO.base.airTop, GEO.lg.airTop),
  airFoot: lerp(GEO.base.airFoot, GEO.lg.airFoot),
  axisPct: 38,
  halfRef: 450,
  halfMin: 384,
};

/* ── copied verbatim from hero-stream.ts: the bp-independent constants ───── */
const BEAT = { base: 1350, lg: 1250 } as const;
const SPAN = { base: 2.6, lg: 2.08 } as const;
const KAPPA = 2.3;
const TURN = { code: 6, edge: 44 } as const;
const GAIN = 0.92;
const CARD_SCALE = 0.85;
const SCAN = 480;
const HEADER = 64;
const PLATE_PAD = 8;
const ASPECTS = [
  [0.9, 1.11],
  [1, 1],
  [1.15, 0.87],
  [0.9, 1.11],
] as const;

const TABLET_BEAT = lerp(BEAT.base, BEAT.lg);
const TABLET_SPAN = lerpRatio(SPAN.base, SPAN.lg);

const mod = (a: number, n: number) => ((a % n) + n) % n;
const travelAt = (p: number) =>
  (Math.exp(KAPPA * clamp01(p)) - 1) / (Math.exp(KAPPA) - 1);
const scaleAt = (out: number) => 0.18 + 0.82 * Math.pow(clamp01(out), 1.2);
const turnAt = (out: number, dir: 1 | -1) =>
  -dir * (TURN.code + (TURN.edge - TURN.code) * smoothstep(0.2, 1, out));

/** `placeAt`, with the tablet's span. */
function placeTablet(c: Card, p: number) {
  const out = travelAt(p) * TABLET_SPAN;
  const s = scaleAt(out) * GAIN;
  return { s, out, x: c.dir * out, hw: (c.w / 2) * s, hh: (c.h / 2) * s };
}

/** `frameAt`, with the tablet's span: the same transform string, so the one
 *  `--hhs-half` on the corridor resolves every geometry identically. */
function frameTablet(c: Card, p: number, fit: number) {
  const q = placeTablet(c, p);
  return {
    transform: `translate3d(calc(var(--hhs-half) * ${q.x.toFixed(4)}), 0px, 0) rotateY(${turnAt(q.out, c.dir).toFixed(2)}deg) scale(${(q.s / fit).toFixed(4)})`,
    opacity: opacityAt(q.out),
    z: 1 + Math.round(q.s * 40),
  };
}

/** One geometry as the drawing reads it: the layout's numbers, the frames and
 *  the one `frameAt` its loop runs. */
export type Table = {
  geo: Geo;
  cards: Card[];
  box: { w: number; h: number; fit: number; exit: number }[];
  cycle: number;
  low: number;
  axisMin: number;
  below: number;
  minH: number;
  frameAt: (
    c: Card,
    p: number,
    fit: number,
  ) => { transform: string; opacity: number; z: number };
};

function buildTablet(): Table {
  const geo = TABLET_GEO;
  const pool = Math.ceil(FLIGHT / TABLET_BEAT) + 1;
  const cycle = pool * TABLET_BEAT;
  const half = Math.round(STREAM_FRAMES.length / 2);
  const cards: Card[] = Array.from({ length: pool * 2 }, (_, g) => {
    const right = g % 2 === 1;
    const slot = (g - (right ? 1 : 0)) / 2;
    const [aw, ah] = ASPECTS[(slot + (right ? 1 : 0)) % ASPECTS.length];
    return {
      key: `hht-${g}`,
      dir: (right ? 1 : -1) as 1 | -1,
      slot,
      photo: slot + (right ? half : 0),
      w: geo.card * CARD_SCALE * aw,
      h: geo.card * CARD_SCALE * ah,
      at: mod(slot * TABLET_BEAT, cycle),
    };
  });
  const box = cards.map((c) => {
    let fit = 0.001;
    let exit = 1;
    for (let i = 0; i <= SCAN; i++) {
      const p = i / SCAN;
      const q = placeTablet(c, p);
      if (Math.abs(q.x) - q.hw / geo.halfMin > 1) {
        exit = p;
        break;
      }
      if (opacityAt(q.out) > 0.004 && q.s > fit) fit = q.s;
    }
    fit *= 1.01;
    return { w: Math.round(c.w * fit), h: Math.round(c.h * fit), fit, exit };
  });
  // The measured clear line, `reachOf`'s own walk at this table's span.
  const col = geo.blockW / (2 * geo.halfRef);
  let reach = 0;
  for (const c of cards) {
    for (let i = 0; i <= SCAN; i++) {
      const q = placeTablet(c, i / SCAN);
      if (opacityAt(q.out) <= 0.02) continue;
      const ax = Math.abs(q.x);
      const hw = q.hw / geo.halfRef;
      if (ax - hw <= col && col <= ax + hw && q.hh > reach) reach = q.hh;
    }
  }
  const plate = geo.qr / 2 + PLATE_PAD + geo.margin;
  const low = Math.max(
    Math.round(reach * 1.08 + geo.margin + geo.breath),
    plate,
  );
  const below = low + geo.blockH + geo.airFoot;
  const axisMin = HEADER + geo.airTop + geo.qr / 2 + PLATE_PAD;
  return {
    geo,
    cards,
    box,
    cycle,
    low,
    axisMin,
    below,
    minH: axisMin + below,
    frameAt: frameTablet,
  };
}

const prod = (bp: "base" | "lg"): Table => {
  const b = BUILT[bp];
  return {
    geo: GEO[bp],
    cards: b.cards,
    box: b.box,
    cycle: b.cycle,
    low: b.low,
    axisMin: b.axisMin,
    below: b.below,
    minH: b.minH,
    frameAt: (c, p, fit) => frameAt(c, p, bp, fit),
  };
};

/** The three, solved once at module load as the hero solves its own two. */
export const TABLES: Record<Geometry, Table> = {
  today: prod("base"),
  tablet: buildTablet(),
  early: prod("lg"),
};
