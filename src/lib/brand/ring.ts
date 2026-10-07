import { fitChroma, hex } from "../avatar/gradient.ts";

/**
 * THE RING: Partyreel's icon (brand-marks r1, `icon=ember`), the shutter's
 * matte dark puck inside a ring of light on the room's dark tile, key-lit from
 * the top-left by the house ember and deepening to an ember red at the
 * bottom-right, a whole ring at every size. Will's v1 ("we can carry this as
 * the working version"); a bespoke take is brand-marks r2's.
 *
 * ONE HOME for the drawing, every number the board's (`brand-marks/icon/`:
 * `light.ts`, `ring.tsx` and `lights/ember.tsx`, grown from brand r2's
 * Aperture deck), so every renderer draws the same object: `Logo markOnly`
 * inlines it, the reel's watermark paints it on a canvas, and
 * `scripts/build-press-kit.mjs` draws every file an icon lives in (the
 * favicon, the home-screen and manifest icons, the brand kit's and the press
 * kit's marks) from `ringSvg`. Pure on purpose (no React, no DOM, one import
 * named in full), so a bare Node script can import it.
 *
 * ★ THE ICON IS THE HOUSE'S, NEVER AN EVENT'S LIGHT (a carried call): it is
 * lit by the house ember everywhere; an event's own light stays on its pages.
 *
 * An SVG has no conic gradient, so the ring is drawn as solid wedges, each
 * asking the light for its colour at its angle (0 at the crown, turning
 * clockwise, so the key light at the top-left is 315), each reaching a little
 * past its neighbours so no seam shows; the glow and the corona are the same
 * wedges blurred. All geometry is in a 1024 box.
 */

/* ── THE HOUSE EMBER ──────────────────────────────────────────────────────── */

/**
 * THE HOUSE EMBER (brand r2's `DUSK`, kept): the light where there is no
 * photograph, one gradient in one direction from the one key light: amber,
 * then coral, then a deep ember; never lamps side by side. Its four stops are
 * globals.css's `--ember-1..4` (a parity test holds the two together).
 */
export const EMBER: readonly {
  readonly t: number;
  readonly l: number;
  readonly c: number;
  readonly h: number;
}[] = [
  { t: 0, l: 0.87, c: 0.15, h: 80 },
  { t: 0.35, l: 0.77, c: 0.17, h: 52 },
  { t: 0.68, l: 0.65, c: 0.18, h: 34 },
  { t: 1, l: 0.5, c: 0.15, h: 24 },
];

type Lab = [number, number, number];

const toLab = (l: number, c: number, h: number): Lab => {
  const r = (h * Math.PI) / 180;
  return [l, c * Math.cos(r), c * Math.sin(r)];
};

const fromLab = ([l, a, b]: Lab) => {
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l, c: Math.hypot(a, b), h };
};

const hueLerp = (a: number, b: number, t: number) => {
  const d = ((b - a + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
};

/** A lab colour as sRGB hex, its chroma fitted into the gamut first. */
const toHex = (lab: Lab) => hex(fitChroma(fromLab(lab)));

/** The ember at `t` (0 its lit end, 1 its deep end), eased between its stops, as a lab colour. */
function emberAt(t: number): Lab {
  let i = 0;
  while (i < EMBER.length - 2 && t > EMBER[i + 1].t) i++;
  const A = EMBER[i];
  const B = EMBER[i + 1];
  const u = Math.min(1, Math.max(0, (t - A.t) / (B.t - A.t)));
  const s = u * u * (3 - 2 * u);
  return toLab(
    A.l + (B.l - A.l) * s,
    A.c + (B.c - A.c) * s,
    hueLerp(A.h, B.h, s),
  );
}

/**
 * THE FIVE LAMPS RELIT AS THE EMBER (the board's carried `lamps` call, as the
 * brief took it): five points spread evenly along the ember's four stops,
 * amber to the deep end, linear between stops. They light what the house's
 * five lamps lit where a reader takes five colours: the foot's seam and the
 * confetti (globals.css's `--ember-lamp-1..5`, held to this by a parity test).
 * A photo-less event's lamp on the dashboard keeps its own hue (`--lamp-*`).
 */
export const EMBER_LAMPS: readonly { l: number; c: number; h: number }[] = [
  0, 0.25, 0.5, 0.75, 1,
].map((t) => {
  let i = 0;
  while (i < EMBER.length - 2 && t > EMBER[i + 1].t) i++;
  const A = EMBER[i];
  const B = EMBER[i + 1];
  const u = Math.min(1, Math.max(0, (t - A.t) / (B.t - A.t)));
  const d = ((B.h - A.h + 540) % 360) - 180;
  return {
    l: Math.round((A.l + (B.l - A.l) * u) * 1000) / 1000,
    c: Math.round((A.c + (B.c - A.c) * u) * 1000) / 1000,
    h: Math.round(A.h + d * u),
  };
});

/* ── THE CUTS, BY DRAWN SIZE ──────────────────────────────────────────────── */

export type RingCutId = "tab" | "favicon" | "home" | "master";

/** The optics one drawn size uses, as fractions of the 1024 box. */
export type RingCut = {
  readonly id: RingCutId;
  /** The puck's radius. */
  readonly rDisc: number;
  /** The dark gap between the puck and the ring. */
  readonly gap: number;
  /** The ring's band. */
  readonly band: number;
  /** The glow's opacity at the key (0: none). */
  readonly glow: number;
  readonly glowBlur: number;
  /** The corona's blur and opacity (0: none). */
  readonly corona: number;
  readonly coronaOp: number;
  /** A lit bevel round the puck's top. */
  readonly bevel: boolean;
  /** How lit the far side stays: the higher, the more a small ring stays whole. */
  readonly floor: number;
  /** Wedges in the band. */
  readonly n: number;
};

/**
 * ★ A RING AT EVERY SIZE, NEVER A MOON: a ring lit on one side and dark on the
 * other is, at a tab's size, a bright arc round a dark disc, which is the
 * crescent every dark-mode switch draws. So the far side is never spent to
 * nothing (`floor`, higher the smaller the icon). Where a size really lives
 * decides its cut: a phone shows the 180 bitmap (and Android its 192 and 512)
 * at about 60 points, so they wear the home screen's cut; a tab's 16 is drawn
 * at 16 or 32 device pixels.
 */
const CUTS: Record<RingCutId, RingCut> = {
  // THE TAB (16, and 18 in a search result): the boldest band and no glow,
  // since a blur at 16 pixels thickens the lit side into a crescent; the far
  // side kept at seven tenths, a deep red that closes the ring among loud
  // neighbours, on a dark strip and a light one. The home screen's broad puck
  // at a tab's weight: the band's weight is in light, never in width (a thick
  // band round a small puck read as a doughnut). Few wedges, since at these
  // sizes each seam lets a hair of the tile through.
  tab: {
    id: "tab",
    rDisc: 0.215,
    gap: 0.05,
    band: 0.11,
    glow: 0,
    glowBlur: 0.03,
    corona: 0,
    coronaOp: 0,
    bevel: false,
    floor: 0.7,
    n: 32,
  },
  // THE FAVICON'S 32 (and a 29 or a 38): a little glow at the key, the far
  // side still well lit.
  favicon: {
    id: "favicon",
    rDisc: 0.215,
    gap: 0.05,
    band: 0.11,
    glow: 0.45,
    glowBlur: 0.03,
    corona: 0,
    coronaOp: 0,
    bevel: false,
    floor: 0.6,
    n: 40,
  },
  // THE HOME SCREEN (60 points, and every app bitmap shown there): a band a
  // third heavier than the master's, the far side a visible ember.
  home: {
    id: "home",
    rDisc: 0.255,
    gap: 0.024,
    band: 0.046,
    glow: 0.8,
    glowBlur: 0.035,
    corona: 0.05,
    coronaOp: 0.3,
    bevel: true,
    floor: 0.28,
    n: 180,
  },
  // THE MASTER (200 and up: the press kit's marks, drawn large): brand r2's
  // ring, its light gathered at the key, the far side spent to a deep ember.
  master: {
    id: "master",
    rDisc: 0.255,
    gap: 0.021,
    band: 0.034,
    glow: 0.9,
    glowBlur: 0.032,
    corona: 0.055,
    coronaOp: 0.4,
    bevel: true,
    floor: 0.15,
    n: 240,
  },
};

/** The cut an icon drawn `size` CSS pixels (or points) wide wears. */
export function ringCutFor(size: number): RingCut {
  if (size <= 20) return CUTS.tab;
  if (size <= 40) return CUTS.favicon;
  if (size < 200) return CUTS.home;
  return CUTS.master;
}

/* ── THE LIGHT ON THE RING ────────────────────────────────────────────────── */

/** Where the key light sits: the top-left. */
const KEY = 315;

/** How far an angle is from another, 0 to 180. */
const apart = (deg: number, from: number) =>
  Math.abs(((((deg - from) % 360) + 540) % 360) - 180);

/** The tile the band's shadow side falls toward. */
const TILE_MIX = toLab(0.16, 0.004, 286);

/**
 * The band's colour at an angle. ★ Lightness falls with the key, chroma only
 * by its square root, so the turned-away side reads as an ember still
 * glowing, a deep red, never a brown smudge; the key's fall-off is a touch
 * wider than brand r2's (1.4 against 1.7), so the lit side turns the corner
 * before it dims.
 */
function bandAt(deg: number, floor: number): string {
  const d = apart(deg, KEY);
  const lamp = emberAt(d / 180);
  const k =
    floor +
    (1 - floor) * Math.pow((Math.cos((d * Math.PI) / 180) + 1) / 2, 1.4);
  const kc = Math.sqrt(k);
  return toHex([
    TILE_MIX[0] + (lamp[0] - TILE_MIX[0]) * k,
    TILE_MIX[1] + (lamp[1] - TILE_MIX[1]) * kc,
    TILE_MIX[2] + (lamp[2] - TILE_MIX[2]) * kc,
  ]);
}

/**
 * The glow's colour and opacity at an angle. ★ LIGHT, NEVER NEON, NEVER A
 * STAIN: it gathers at the key (the key's cosine to the power 3.5) so the
 * lamp reads as one point catching the ring, and leans a step past amber
 * toward coral, because amber at a low alpha over the tile's cool graphite
 * turns olive; coral there reads as warm light falling on the tile.
 */
function glowAt(deg: number): { fill: string; opacity: number } {
  const d = apart(deg, KEY);
  const k = Math.pow((Math.cos((d * Math.PI) / 180) + 1) / 2, 3.5);
  return {
    fill: toHex(emberAt(Math.min(0.6, 0.25 + d / 180))),
    opacity: Math.round(k * 1000) / 1000,
  };
}

/* ── THE DRAWING ──────────────────────────────────────────────────────────── */

/** The tile's two stops (top, bottom) and the puck's two (its lit point, its edge). */
export const RING_TILE = ["#1b1b20", "#0b0b0d"] as const;
export const RING_DISC = ["#17171b", "#09090b"] as const;

/** One solid wedge of an annulus: its path in the 1024 box, its colour, and an opacity if it has one. */
export type RingWedge = {
  readonly d: string;
  readonly fill: string;
  readonly opacity?: number;
};

/**
 * An annulus cut into `n` solid wedges, each its own colour, each reaching
 * `overlap` degrees past its neighbours so no seam shows between two.
 */
function wedges(
  r0: number,
  r1: number,
  n: number,
  colour: (deg: number) => string | { fill: string; opacity: number },
  overlap = 0.35,
): RingWedge[] {
  const c = 512;
  const out: RingWedge[] = [];
  const p = (r: number, g: number) =>
    `${(c + r * Math.cos(g)).toFixed(1)},${(c + r * Math.sin(g)).toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const a0 = (i * 360) / n;
    const a1 = ((i + 1) * 360) / n;
    const g0 = ((a0 - 90 - overlap) * Math.PI) / 180;
    const g1 = ((a1 - 90 + overlap) * Math.PI) / 180;
    const col = colour((a0 + a1) / 2);
    out.push({
      d: `M${p(r0, g0)}L${p(r1, g0)}A${r1} ${r1} 0 0 1 ${p(r1, g1)}L${p(r0, g1)}A${r0} ${r0} 0 0 0 ${p(r0, g0)}Z`,
      ...(typeof col === "string" ? { fill: col } : col),
    });
  }
  return out;
}

/** The continuous corner a home screen draws: a superellipse (n = 5) in the 1024 box. */
export const RING_SQUIRCLE = (() => {
  const r = 512;
  const pts: string[] = [];
  for (let i = 0; i < 360; i += 1.5) {
    const t = (i * Math.PI) / 180;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = r + r * Math.sign(c) * Math.pow(Math.abs(c), 2 / 5);
    const y = r + r * Math.sign(s) * Math.pow(Math.abs(s), 2 / 5);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
})();

/** Everything a renderer draws for one size, in the 1024 box. */
export type RingArt = {
  readonly cut: RingCut;
  /** The puck's radius. */
  readonly rDisc: number;
  /** The corona's wedges (blurred by `cut.corona`, at `cut.coronaOp`). */
  readonly corona: readonly RingWedge[];
  /** The glow's wedges (blurred by `cut.glowBlur`, at `cut.glow`). */
  readonly glow: readonly RingWedge[];
  /** The band's wedges, opaque. */
  readonly band: readonly RingWedge[];
};

const ARTS = new Map<string, RingArt>();

/**
 * THE RING FOR ONE SIZE: `size` is how wide it is drawn (in CSS pixels or
 * device pixels: it sets the seams' overlap), `cutAt` the size whose cut it
 * wears (a favicon drawn at 32 device pixels still wears the tab's cut).
 */
export function ringArt(size: number, cutAt = size): RingArt {
  const key = `${size}:${cutAt}`;
  const hit = ARTS.get(key);
  if (hit) return hit;
  const S = 1024;
  const o = ringCutFor(cutAt);
  const rD = o.rDisc * S;
  const r0 = rD + o.gap * S;
  const r1 = r0 + o.band * S;
  const art: RingArt = {
    cut: o,
    rDisc: rD,
    corona: o.coronaOp ? wedges(rD, r1 + o.band * S * 4, 48, glowAt) : [],
    glow: o.glow ? wedges(r0, r1 + o.band * S * 0.5, 64, glowAt) : [],
    // ★ THE BAND'S SEAMS OVERLAP BY A PIXEL AT THE DRAWN SIZE: a fixed 0.35
    // degrees is a hundredth of a pixel at 16 to 32 px, so the tile showed
    // through every seam as faint spokes in a tab. The band is opaque, so an
    // overlap costs nothing; the glow's wedges are translucent and blurred,
    // and keep the hair.
    band: wedges(
      r0,
      r1,
      o.n,
      (deg) => bandAt(deg, o.floor),
      Math.max(0.35, (S / size / r1) * (180 / Math.PI)),
    ),
  };
  ARTS.set(key, art);
  return art;
}

/**
 * THE MONO RING, one ink on any ground (the kit's bare mark, the reel's
 * watermark on footage): the puck and the ring in the ink and the gap between
 * them the ground, the tab's bold proportions so it holds from a watermark's
 * 30 pixels to a print. As fractions of the ring's outer radius.
 */
export const RING_MONO = (() => {
  const { rDisc, gap, band } = CUTS.tab;
  const outer = rDisc + gap + band;
  return {
    disc: rDisc / outer,
    inner: (rDisc + gap) / outer,
  } as const;
})();

/* ── AS AN SVG FILE ───────────────────────────────────────────────────────── */

/**
 * What the icon stands on: `squircle` its dark tile in a home screen's corner,
 * the ground outside it clear (a tab, an "any" app icon, the kit's mark for a
 * light ground); `square` the tile filling the whole box, for a platform that
 * masks it itself (the apple-touch icon, the maskable icon; the ring stands
 * inside the 80% circle a mask always keeps); `bare` no tile, the light and
 * the puck alone on a dark ground of the reader's own (the kit's mark for a
 * dark ground).
 */
export type RingShape = "squircle" | "square" | "bare";

const n3 = (v: number) => String(Math.round(v * 1000) / 1000);

/**
 * The icon's markup inside its `<svg>` (its defs and its drawing, in the 1024
 * box): `size` the width it is drawn at (its cut and its seams), `cutAt` the
 * size whose cut it wears, `id` a prefix for its gradient, clip and filter
 * ids, which an inline copy needs of its own since an SVG id is
 * document-global (`Logo markOnly` hands it `useId`'s).
 */
export function ringMarkup({
  size,
  cutAt = size,
  shape = "squircle",
  id = "r",
}: {
  size: number;
  cutAt?: number;
  shape?: RingShape;
  id?: string;
}): string {
  const art = ringArt(size, cutAt);
  const o = art.cut;
  const S = 1024;
  const path = (w: RingWedge) =>
    `<path d="${w.d}" fill="${w.fill}"${w.opacity === undefined ? "" : ` fill-opacity="${n3(w.opacity)}"`}/>`;
  const defs = [
    shape === "squircle"
      ? `<clipPath id="${id}c"><path d="${RING_SQUIRCLE}"/></clipPath>`
      : "",
    shape === "bare"
      ? ""
      : `<linearGradient id="${id}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${RING_TILE[0]}"/><stop offset="1" stop-color="${RING_TILE[1]}"/></linearGradient>`,
    `<radialGradient id="${id}d" cx="0.42" cy="0.22" r="0.95"><stop offset="0" stop-color="${RING_DISC[0]}"/><stop offset="0.7" stop-color="${RING_DISC[1]}"/></radialGradient>`,
    art.glow.length
      ? `<filter id="${id}g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${n3(o.glowBlur * S)}"/></filter>`
      : "",
    art.corona.length
      ? `<filter id="${id}k" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${n3(o.corona * S)}"/></filter>`
      : "",
    o.bevel
      ? `<linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.14"/><stop offset="0.3" stop-color="#fff" stop-opacity="0.03"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/></linearGradient>`
      : "",
  ].join("");
  const body = [
    shape === "bare"
      ? ""
      : `<rect width="${S}" height="${S}" fill="url(#${id}t)"/>`,
    art.corona.length
      ? `<g filter="url(#${id}k)" opacity="${n3(o.coronaOp)}">${art.corona.map(path).join("")}</g>`
      : "",
    art.glow.length
      ? `<g filter="url(#${id}g)" opacity="${n3(o.glow)}">${art.glow.map(path).join("")}</g>`
      : "",
    art.band.map(path).join(""),
    `<circle cx="512" cy="512" r="${n3(art.rDisc)}" fill="url(#${id}d)"/>`,
    o.bevel
      ? `<circle cx="512" cy="512" r="${n3(art.rDisc - 2)}" fill="none" stroke="url(#${id}v)" stroke-width="4"/>`
      : "",
  ].join("");
  return `<defs>${defs}</defs>${shape === "squircle" ? `<g clip-path="url(#${id}c)">${body}</g>` : body}`;
}

/** The icon as an SVG document (a file): `ringMarkup` in its own `<svg>`, `size` wide. */
export function ringSvg({
  title = "Partyreel",
  ...opts
}: {
  size: number;
  cutAt?: number;
  shape?: RingShape;
  title?: string;
}): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${opts.size}" height="${opts.size}" role="img" aria-label="${title}"><title>${title}</title>${ringMarkup(opts)}</svg>\n`;
}

/** The mono ring as an SVG document in one ink, filling its own box edge to edge. */
export function ringMonoSvg({
  size,
  ink,
  title = "Partyreel",
}: {
  size: number;
  ink: string;
  title?: string;
}): string {
  // A ring and a puck, the gap the ground: the ring an annulus drawn with the
  // even-odd rule, so the gap is a hole any ground shows through.
  const R = 512;
  const ri = RING_MONO.inner * R;
  const rd = RING_MONO.disc * R;
  const circle = (r: number) =>
    `M${n3(R - r)} ${R}a${n3(r)} ${n3(r)} 0 1 0 ${n3(2 * r)} 0a${n3(r)} ${n3(r)} 0 1 0 ${n3(-2 * r)} 0Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${size}" height="${size}" role="img" aria-label="${title}"><title>${title}</title><path fill="${ink}" fill-rule="evenodd" d="${circle(R)}${circle(ri)}${circle(rd)}"/></svg>\n`;
}
