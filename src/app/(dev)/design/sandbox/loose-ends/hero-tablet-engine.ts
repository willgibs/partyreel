import {
  BUILT as PROD_BUILT,
  type Card,
  clamp01,
  FLIGHT,
  frameAt as prodFrameAt,
  GEO as PROD_GEO,
  type Geo,
  opacityAt,
  restPhase,
  smoothstep,
  STREAM_FRAMES,
} from "@/components/marketing/sections/home/hero-stream";

/**
 * DECISION 3'S ENGINE: hero-stream.ts's own math, extended with a THIRD
 * breakpoint (a real 900 px tablet) that the production file cannot express
 * (`Bp` is a closed `"base" | "lg"` union). "today" and "early" wear
 * PRODUCTION'S OWN `GEO`/`BUILT`/`frameAt` unmodified, imported rather than
 * retyped, so those two options are byte-identical to what ships. Only
 * "tablet" needed new code: `KAPPA`, `TURN`, `GAIN`, `CARD_SCALE` and the
 * `ASPECTS` table below are copied VERBATIM from hero-stream.ts (they are the
 * same constants at every breakpoint there, never exported because nothing
 * outside that file has ever needed a second breakpoint before). Read
 * hero-stream.ts's own header before touching this: every ★ note there
 * applies here unchanged.
 *
 * THE TABLET GEOMETRY, composed rather than guessed: every field is `base`'s
 * value plus `t = (900 - 375) / (1440 - 375) ≈ 0.493` of the way to `lg`'s,
 * the same linear step the type ladder already takes between two named
 * breakpoints. Two fields are NOT lerped, on purpose: `blockH` takes `lg`'s
 * value verbatim because the action row fits on one line well before 900 px
 * (it only wraps at `base` for lack of room, not for its own sake), and
 * `halfRef`/`halfMin` are defined BY this breakpoint's own range (900 and 768)
 * exactly as `base`/`lg` are defined by 375 and 1024, never interpolated from
 * the others.
 */

const t = (900 - 375) / (1440 - 375);
/** Pixel and millisecond fields land on the nearest integer, the same
 *  precision `base`/`lg` are hand-set at. */
const lerp = (base: number, lg: number) => Math.round(base + t * (lg - base));
/** The one dimensionless field (a ratio of half-widths, not a pixel): kept to
 *  two decimals rather than rounded to a whole number. */
const lerpRatio = (base: number, lg: number) =>
  Math.round((base + t * (lg - base)) * 100) / 100;

export const TABLET_GEO: Geo = {
  qr: lerp(PROD_GEO.base.qr, PROD_GEO.lg.qr), // 136
  card: lerp(PROD_GEO.base.card, PROD_GEO.lg.card), // 226
  perspective: lerp(PROD_GEO.base.perspective, PROD_GEO.lg.perspective), // 528
  fade: `${lerp(16, 12)}%`, // "14%"
  blockW: lerp(PROD_GEO.base.blockW, PROD_GEO.lg.blockW), // 529
  blockH: PROD_GEO.lg.blockH, // 323: the action row does not wrap at 900 px
  h1Max: lerp(PROD_GEO.base.h1Max, PROD_GEO.lg.h1Max), // 627
  lowMax: lerp(PROD_GEO.base.lowMax, PROD_GEO.lg.lowMax), // 458
  margin: lerp(PROD_GEO.base.margin, PROD_GEO.lg.margin), // 27
  breath: lerp(PROD_GEO.base.breath, PROD_GEO.lg.breath), // 34
  airTop: lerp(PROD_GEO.base.airTop, PROD_GEO.lg.airTop), // 18
  airFoot: lerp(PROD_GEO.base.airFoot, PROD_GEO.lg.airFoot), // 26
  axisPct: lerp(PROD_GEO.base.axisPct, PROD_GEO.lg.axisPct), // 34
  halfRef: 450, // this breakpoint's own canvas: 900 / 2
  halfMin: 384, // the narrowest viewport it serves, 768 / 2
};

const TABLET_BEAT = lerp(1350, 1250); // 1301ms
export const TABLET_SPAN = lerpRatio(2.6, 2.08); // 2.34, dimensionless

/* ── copied verbatim from hero-stream.ts: bp-independent constants ───────── */
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

const mod = (a: number, n: number) => ((a % n) + n) % n;
const travelAt = (p: number) =>
  (Math.exp(KAPPA * clamp01(p)) - 1) / (Math.exp(KAPPA) - 1);
const scaleAt = (out: number) => 0.18 + 0.82 * Math.pow(clamp01(out), 1.2);
export const turnAt = (out: number, dir: 1 | -1) =>
  -dir * (TURN.code + (TURN.edge - TURN.code) * smoothstep(0.2, 1, out));

/** hero-stream.ts's `placeAt`, with the span passed in rather than looked up
 *  from a closed `SPAN[bp]` record. */
export function placeAtTablet(c: Card, p: number) {
  const out = travelAt(p) * TABLET_SPAN;
  const s = scaleAt(out) * GAIN;
  return { s, out, x: c.dir * out, hw: (c.w / 2) * s, hh: (c.h / 2) * s };
}

function fitOfTablet(c: Card) {
  let fit = 0.001;
  let exit = 1;
  for (let i = 0; i <= SCAN; i++) {
    const p = i / SCAN;
    const q = placeAtTablet(c, p);
    if (Math.abs(q.x) - q.hw / TABLET_GEO.halfMin > 1) {
      exit = p;
      break;
    }
    if (opacityAt(q.out) > 0.004 && q.s > fit) fit = q.s;
  }
  return { fit: fit * 1.01, exit };
}

function reachOfTablet(cards: Card[], col: number) {
  let out = 0;
  for (const c of cards) {
    for (let i = 0; i <= SCAN; i++) {
      const p = i / SCAN;
      const q = placeAtTablet(c, p);
      if (opacityAt(q.out) <= 0.02) continue;
      const ax = Math.abs(q.x);
      const hw = q.hw / TABLET_GEO.halfRef;
      if (ax - hw <= col && col <= ax + hw && q.hh > out) out = q.hh;
    }
  }
  return out * 1.08;
}

export type TabletBuilt = {
  cards: Card[];
  box: { w: number; h: number; fit: number; exit: number }[];
  low: number;
  axisMin: number;
  below: number;
  minH: number;
};

function buildTablet(): TabletBuilt {
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
    const { fit, exit } = fitOfTablet(c);
    return { w: Math.round(c.w * fit), h: Math.round(c.h * fit), fit, exit };
  });

  const colOf = geo.blockW / (2 * geo.halfRef);
  const plate = geo.qr / 2 + PLATE_PAD + geo.margin;
  const low = Math.max(
    Math.round(reachOfTablet(cards, colOf) + geo.margin + geo.breath),
    plate,
  );
  const below = low + geo.blockH + geo.airFoot;
  const axisMin = HEADER + geo.airTop + geo.qr / 2 + PLATE_PAD;

  return { cards, box, low, axisMin, below, minH: axisMin + below };
}

export const TABLET_BUILT: TabletBuilt = buildTablet();

/* ── the three tables this board draws, one per option ───────────────────── */

export type HeroTabletOption = "today" | "tablet" | "early";

export type Frm = {
  key: string;
  src: string;
  w: number;
  h: number;
  transform: string;
  opacity: number;
  z: number;
};

export type TableFor = {
  geo: Geo;
  axisMin: number;
  low: number;
  below: number;
  minH: number;
  frames: Frm[];
};

const imageSrc = (photo: number) =>
  STREAM_FRAMES[
    ((photo % STREAM_FRAMES.length) + STREAM_FRAMES.length) %
      STREAM_FRAMES.length
  ];

/** "today" and "early" wear production's own tables and its own `frameAt`
 *  (the exact CSS-calc transform string it ships), which is why they need no
 *  local math at all: only the breakpoint key passed to it differs. */
function tableForProd(bp: "base" | "lg"): TableFor {
  const geo = PROD_GEO[bp];
  const built = PROD_BUILT[bp];
  const frames: Frm[] = built.cards.map((c, i) => {
    const box = built.box[i];
    const f = prodFrameAt(c, restPhase(c), bp, box.fit);
    return {
      key: c.key,
      src: imageSrc(c.photo),
      w: box.w,
      h: box.h,
      transform: f.transform,
      opacity: f.opacity,
      z: f.z,
    };
  });
  return {
    geo,
    axisMin: built.axisMin,
    low: built.low,
    below: built.below,
    minH: built.minH,
    frames,
  };
}

function tableForTablet(): TableFor {
  const geo = TABLET_GEO;
  const built = TABLET_BUILT;
  const frames: Frm[] = built.cards.map((c, i) => {
    const box = built.box[i];
    const p = restPhase(c);
    const q = placeAtTablet(c, p);
    const turn = turnAt(q.out, c.dir);
    // The same string shape `frameAt` emits, so both share one `--hhs-half`
    // custom property on the ancestor rather than two rendering paths.
    const transform = `translate3d(calc(var(--hhs-half) * ${q.x.toFixed(4)}), 0px, 0) rotateY(${turn.toFixed(2)}deg) scale(${(q.s / box.fit).toFixed(4)})`;
    return {
      key: c.key,
      src: imageSrc(c.photo),
      w: box.w,
      h: box.h,
      transform,
      opacity: opacityAt(q.out),
      z: 1 + Math.round(q.s * 40),
    };
  });
  return {
    geo,
    axisMin: built.axisMin,
    low: built.low,
    below: built.below,
    minH: built.minH,
    frames,
  };
}

export function tableForOption(option: HeroTabletOption): TableFor {
  if (option === "today") return tableForProd("base");
  if (option === "early") return tableForProd("lg");
  return tableForTablet();
}
