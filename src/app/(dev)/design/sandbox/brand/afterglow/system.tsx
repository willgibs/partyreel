"use client";

import type { CSSProperties, ReactNode } from "react";

import { fitChroma, hex, orbFor } from "@/lib/avatar/gradient";
import { cn } from "@/lib/utils";

import { Photo, type PhotoId, Qr } from "../deck/media";

/**
 * AFTERGLOW, ROUND TWO: THE SYSTEM EVERY TAKE SHARES.
 *
 * Round one's pick (desk 4, vision=afterglow) holds whole: light is the brand,
 * never paint; every colour is light from the photographs, then the event's
 * seed, then the house; drawn only as a Ring, a Seam or a Bloom, one per
 * screen, resting still and answering events; status a point and its word;
 * the room where photographs play, paper where people read and decide.
 *
 * ★ WHAT THIS FILE HOLDS: the values no take changes (the room's grounds and
 * inks, the status set, the house lamps, every still's sampled light, the
 * registers the room draws light in) and the room primitives a take may feed
 * its own light into (`RoomSeam`, `RoomBloom`, `RoomRing`, `RoomSeed`). What a
 * take changes (its paper stock, how its light lives on paper, its icon) is
 * its own folder's, reached through `take.tsx`.
 *
 * ★ A MEASURED ELEMENT IS PAINTED IN HEX. The deck's caption reads contrast off
 * `getComputedStyle`, which hands an `oklch()` colour back as `oklch()` and the
 * reader only parses `rgb()`, so every ground a word sits on and every word
 * whose contrast a slide claims is painted from `.hex`; `.oklch` is for light,
 * which nobody measures.
 */

/* ── colour: one value, two spellings ─────────────────────────────────────── */

export type Tone = {
  readonly l: number;
  readonly c: number;
  readonly h: number;
  /** The value as written, for a slide to print. */
  readonly oklch: string;
  /** The same colour as sRGB hex (gamut-fitted), for anything measured. */
  readonly hex: string;
};

const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** A colour from its oklch, fitted into sRGB, with both spellings. */
export function tone(l: number, c: number, h: number): Tone {
  const fit = fitChroma({ l, c, h });
  return {
    l,
    c: r3(fit.c),
    h,
    oklch: `oklch(${r3(l)} ${r3(fit.c)} ${Math.round(h)})`,
    hex: hex(fit),
  };
}

/** A colour with an alpha, mixed in oklab (never through a grey). */
export const alpha = (c: string, pct: number) =>
  `color-mix(in oklab, ${c} ${pct}%, transparent)`;

/* ── the grounds ──────────────────────────────────────────────────────────── */

/**
 * THE ROOM: production's own values (globals.css), kept by every take. The
 * room is the app and every page where media plays; the display is every
 * pop-out; the well is under the photographs. Paper is each take's own stock
 * (`Take.paper`): its tint is one of the constructions a take argues.
 */
export const ROOM = {
  room: tone(0.085, 0.003, 286),
  card: tone(0.15, 0.004, 286),
  display: tone(0.165, 0.004, 286),
  well: tone(0.065, 0.0045, 286),
} as const;

/** The room's three text steps (production's, kept). */
export const ROOM_INK = {
  fg: tone(0.97, 0.002, 286),
  muted: tone(0.71, 0.006, 286),
  faint: tone(0.53, 0.006, 286),
} as const;

export type Ground = "room" | "paper";

/** A paper stock: its ground, its card and its three inks. */
export type Paper = {
  readonly name: string;
  readonly ground: Tone;
  readonly card: Tone;
  readonly fg: Tone;
  readonly muted: Tone;
  readonly faint: Tone;
};

/** Production's paper (globals.css `:root`): a cool, near-white grey. */
export const PRODUCTION_PAPER: Paper = {
  name: "Gallery white",
  ground: tone(0.972, 0.002, 286),
  card: tone(0.993, 0.001, 286),
  fg: tone(0.14, 0.004, 286),
  muted: tone(0.43, 0.006, 286),
  faint: tone(0.6, 0.006, 286),
};

/* ── status: lights, not light ────────────────────────────────────────────── */

/**
 * THE STATUS SET (round one's, settled): a state is a small, solid, hard-edged
 * point and its word, a camera's pilot light. It never glows (the glow is the
 * light's) and the light never speaks. Standby is half-lit in the ground's own
 * ink with no hue, so the commonest state can never pass for the brand.
 */
export type StatusId = "standby" | "ready" | "fault";

export const STATUS: Record<
  StatusId,
  {
    readonly name: string;
    readonly means: string;
    /** Its hue in the room; null where it wears the ground's own ink. */
    readonly room: Tone | null;
    readonly paper: Tone | null;
  }
> = {
  standby: {
    name: "Standby",
    means: "Waiting, in review, developing, sending",
    room: null,
    paper: null,
  },
  ready: {
    name: "Ready",
    means: "Approved, sent, done",
    room: tone(0.79, 0.18, 150),
    paper: tone(0.6, 0.16, 150),
  },
  fault: {
    name: "Fault",
    means: "Failed, refused, full",
    room: tone(0.68, 0.21, 25),
    paper: tone(0.56, 0.21, 27),
  },
};

/* ── the light: lamps, the house sky, every still's sampled light ─────────── */

/** One lamp: a hue and its share of the light (and an optional depth). */
export type Lamp = {
  readonly h: number;
  readonly w: number;
  /** A lightness offset: one hue read at several depths, as the hashvatar is. */
  readonly dl?: number;
  /** The light's own chroma (its photograph's intensity), capped by the register. */
  readonly c?: number;
};
export type Light = readonly Lamp[];

/**
 * THE FIVE HOUSE LAMPS (globals.css `--lamp-1..5`, kept, re-keyable), each at
 * its hand-tuned ambient register.
 */
export const LAMPS = [
  { n: 1, name: "Coral", ...tone(0.72, 0.17, 25) },
  { n: 2, name: "Amber", ...tone(0.8, 0.15, 85) },
  { n: 3, name: "Green", ...tone(0.72, 0.14, 155) },
  { n: 4, name: "Blue", ...tone(0.7, 0.14, 255) },
  { n: 5, name: "Violet", ...tone(0.68, 0.16, 305) },
] as const;

/**
 * ★ THE HOUSE LIGHT IS ONE SKY, NEVER A SPECTRUM (round two's first polish,
 * every take). Round one laid the five lamps side by side wherever there was
 * no photograph (the cover's chips, a paper foot's five segments, a ring of
 * all five), and five hues side by side is the rainbow app Will warned
 * against. Here the house lamps light as the icon lights them: one sky just
 * after sunset, amber at its lit edge, through coral and rose, spent to violet
 * in its shadow, the afterglow itself. A real sky, so a gradient in one
 * direction from the one key light, never a loop of equals.
 */
export const DUSK: readonly { t: number; l: number; c: number; h: number }[] = [
  { t: 0, l: 0.86, c: 0.15, h: 78 },
  { t: 0.3, l: 0.76, c: 0.17, h: 34 },
  { t: 0.55, l: 0.66, c: 0.16, h: 8 },
  { t: 1, l: 0.52, c: 0.13, h: 300 },
];

/** The house light as lamps (the sky's four stops, its key weighted most). */
export const HOUSE: Light = [
  { h: 78, w: 0.34, dl: 0.06 },
  { h: 34, w: 0.3 },
  { h: 8, w: 0.22, dl: -0.04 },
  { h: 300, w: 0.14, dl: -0.12 },
];

/** The sky as a CSS gradient along a direction (its lit edge first). */
export function duskGradient(direction = "90deg", alphaPct = 100): string {
  const stops = DUSK.map((s) => {
    const t = tone(s.l, s.c, s.h).oklch;
    return `${alphaPct < 100 ? alpha(t, alphaPct) : t} ${Math.round(s.t * 100)}%`;
  });
  return `linear-gradient(in oklab ${direction}, ${stops.join(", ")})`;
}

/**
 * EVERY STILL'S OWN LIGHT, read by production's sampler (`sampled-palette.ts`:
 * a 32 px read, 24 hue buckets, chroma-weighted), with round one's refinement:
 * NOTHING INVENTED (a fanned hue is dropped, so is any hue under a tenth of the
 * strongest; a one-hued photograph glows its one hue at three depths).
 */
export const SAMPLED: Record<PhotoId, Light> = {
  "wedding-golden": [{ h: 53.4, w: 1 }],
  "reception-table": [
    { h: 67.3, w: 0.63 },
    { h: 216.3, w: 0.23 },
    { h: 112.6, w: 0.14 },
  ],
  "party-balloons": [
    { h: 83.3, w: 0.44 },
    { h: 186.8, w: 0.26 },
    { h: 353.5, w: 0.25 },
    { h: 305.6, w: 0.05 },
  ],
  "concert-confetti": [
    { h: 261.2, w: 0.83 },
    { h: 306.7, w: 0.17 },
  ],
  "wedding-rings": [{ h: 40.7, w: 1 }],
  "reception-hall": [
    { h: 247.6, w: 0.5 },
    { h: 56.2, w: 0.44 },
    { h: 109.7, w: 0.06 },
  ],
  "party-dj": [
    { h: 262.5, w: 0.63 },
    { h: 307.9, w: 0.37 },
  ],
  "wedding-toast": [{ h: 67.4, w: 1 }],
  "festival-lights": [
    { h: 261.3, w: 0.69 },
    { h: 322.5, w: 0.17 },
    { h: 202.6, w: 0.14 },
  ],
  "festival-crowd": [{ h: 37.9, w: 1 }],
  "wedding-arch": [
    { h: 130.1, w: 0.8 },
    { h: 68, w: 0.2 },
  ],
  "wedding-petals": [
    { h: 49.9, w: 0.4 },
    { h: 95.8, w: 0.35 },
    { h: 263.7, w: 0.25 },
  ],
};

/**
 * EVERY STILL'S INTENSITY: the 95th-percentile chroma of its midtones. ★ NEVER
 * LOUDER THAN ITS PHOTOGRAPH: a light keeps its photograph's own intensity, so
 * the arch at noon glows softly and the laser show at full.
 */
export const INTENSITY: Record<PhotoId, number> = {
  "wedding-golden": 0.063,
  "reception-table": 0.12,
  "party-balloons": 0.141,
  "concert-confetti": 0.102,
  "wedding-rings": 0.095,
  "reception-hall": 0.082,
  "party-dj": 0.126,
  "wedding-toast": 0.098,
  "festival-lights": 0.231,
  "festival-crowd": 0.115,
  "wedding-arch": 0.051,
  "wedding-petals": 0.064,
};

/** A photograph's light chroma: its own intensity, lifted, inside the room's range. */
export const chromaOf = (id: PhotoId) =>
  Math.min(0.15, Math.max(0.07, INTENSITY[id] * 1.15));

/**
 * A PHOTOGRAPH'S EDGE, IN PLACE: the dominant hue of each sixth (or fifth) of
 * one edge, the same sampler run on that strip alone, read left to right (a
 * bottom edge) or top to bottom (a side).
 */
export const EDGE: Partial<
  Record<PhotoId, Partial<Record<"bottom" | "left", readonly number[]>>>
> = {
  "concert-confetti": { bottom: [9, 294, 308, 309, 293, 277] },
  "wedding-toast": { bottom: [50, 141, 52, 69, 51, 40] },
  "reception-table": { bottom: [114, 97, 65, 54, 64, 52] },
  "wedding-arch": { bottom: [138, 129, 129, 129, 140, 131] },
  "party-balloons": {
    bottom: [82, 67, 81, 68, 68],
    left: [175, 184, 5, 82, 82],
  },
  "wedding-petals": { left: [98, 51, 250, 83, 51] },
  "festival-lights": { bottom: [233, 246, 233, 220, 233, 247] },
};

export const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};
const mixHue = (a: number, b: number, t: number) => {
  const d = ((b - a + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
};

/** One hue read at three depths: the hashvatar's own way to be rich. */
export function depths(h: number, c?: number): Light {
  return [
    { h, w: 0.34, dl: 0.07, c },
    { h, w: 0.4, c },
    { h: (h + 348) % 360, w: 0.26, dl: -0.07, c },
  ];
}

/** A light with depth: a one-hued light becomes its hue at three depths. */
export function withDepth(light: Light): Light {
  return light.length === 1 ? depths(light[0].h, light[0].c) : light;
}

/* ── a light's source, and what every take reads from it ──────────────────── */

/**
 * WHERE A LIGHT COMES FROM, IN THE SOURCING ORDER (round one's, kept): the
 * media where there is media, the event's seed before its first photograph,
 * the house sky where neither exists. A take is handed the source, never a
 * finished colour, because the takes read it differently: Aperture keeps its
 * sampled hues, Ink keeps its one key, Cast keeps the picture itself.
 */
export type Source =
  | { readonly photo: PhotoId; readonly edge?: "bottom" | "left" }
  | { readonly photos: readonly PhotoId[] }
  | { readonly seed: string }
  | { readonly house: true };

export const HOUSE_SOURCE: Source = { house: true };

/** The photographs a source draws on (none for a seed or the house). */
export function photosOf(s: Source): readonly PhotoId[] {
  if ("photo" in s) return [s.photo];
  if ("photos" in s) return s.photos;
  return [];
}

/** The light of several photographs at once: each an equal vote, near hues merged, five kept. */
function lightOfPhotos(ids: readonly PhotoId[]): Light {
  const merged: { h: number; w: number }[] = [];
  for (const id of ids)
    for (const lamp of SAMPLED[id]) {
      const near = merged.find((m) => hueGap(m.h, lamp.h) < 20);
      if (near) {
        const w = near.w + lamp.w;
        near.h = mixHue(near.h, lamp.h, lamp.w / w);
        near.w = w;
      } else merged.push({ h: lamp.h, w: lamp.w });
    }
  const top = merged.sort((a, b) => b.w - a.w).slice(0, 3);
  const c = Math.max(...ids.map(chromaOf));
  // Around the wheel, so neighbours in a ring are neighbours in hue.
  return withDepth(top.sort((a, b) => a.h - b.h).map((x) => ({ ...x, c })));
}

/**
 * THE SAMPLED LIGHT (Aperture's, and the receipt every take can print): the
 * photographs' own hues, at most three (round two tightens round one's five:
 * a fourth hue from one photograph is the rainbow creeping back in).
 */
export function lightOf(s: Source): Light {
  if ("house" in s) return HOUSE;
  if ("seed" in s) return depths(orbFor(s.seed).hue);
  if ("photo" in s) {
    const c = chromaOf(s.photo);
    if (s.edge) {
      const hues = EDGE[s.photo]?.[s.edge];
      if (hues) return hues.map((h) => ({ h, w: 1, c }));
    }
    const top = [...SAMPLED[s.photo]].sort((a, b) => b.w - a.w).slice(0, 3);
    return withDepth(top.map((x) => ({ ...x, c })));
  }
  return lightOfPhotos(s.photos);
}

/**
 * THE KEY: a source's one strongest light (Ink's whole palette, and any take's
 * accent): the heaviest sampled hue, weighted by its photograph's intensity.
 */
export function keyOf(s: Source): { h: number; c: number } {
  if ("house" in s) return { h: 34, c: 0.15 };
  if ("seed" in s) return { h: orbFor(s.seed).hue, c: 0.14 };
  const votes: { h: number; w: number }[] = [];
  for (const id of photosOf(s))
    for (const lamp of SAMPLED[id]) {
      const w = lamp.w * INTENSITY[id];
      const near = votes.find((v) => hueGap(v.h, lamp.h) < 24);
      if (near) {
        near.h = mixHue(near.h, lamp.h, w / (near.w + w));
        near.w += w;
      } else votes.push({ h: lamp.h, w });
    }
  const best = votes.sort((a, b) => b.w - a.w)[0];
  const c = Math.max(...photosOf(s).map(chromaOf));
  return { h: best.h, c };
}

/* ── the registers: how light is drawn in the room ────────────────────────── */

/**
 * THE ROOM'S REGISTERS (round one's, kept): light is born bright at its source
 * and falls off fast, tuned per hue the way the house five are (`lift`:
 * yellows sit higher, so a gold light is gold, never brown).
 */
export const REGISTER = {
  /** The Ring and the Bloom, in the room. */
  room: { l: 0.72, lift: 0.09, c: 0.15, boost: 1 },
  /** The Seam's glow, in the room. */
  roomSeam: { l: 0.82, lift: 0.07, c: 0.15, boost: 1.05 },
  /** The Seam's source line, in the room: the edge itself, lit. */
  roomLine: { l: 0.92, lift: 0.02, c: 0.13, boost: 1 },
} as const;
export type RegisterId = keyof typeof REGISTER;

/** How far a hue sits toward yellow, 0 to 1 (yellows need more lightness). */
export const yellowness = (h: number) =>
  Math.max(0, Math.cos(((hueGap(h, 95) / 70) * Math.PI) / 2));

/**
 * ★ LIGHT NEVER GOES OLIVE (round one's creative director): the band of hues
 * the eye reads as olive once dimmed is pulled to the nearest clean light it
 * was nearly, gold below 110, green above.
 */
export const unOlive = (h: number) =>
  h > 92 && h < 128 ? (h < 110 ? 80 : 138) : h;

/** A light is drawn at no less than this chroma, so soft daylight still gives off light. */
const CHROMA_FLOOR = 0.13;

/** A lamp's colour in a room register, gamut-fitted. */
export function lampTone(lamp: Lamp, register: RegisterId): Tone {
  const r = REGISTER[register];
  const h = unOlive(lamp.h);
  const l = Math.min(0.95, r.l + r.lift * yellowness(h) + (lamp.dl ?? 0));
  const own = lamp.c === undefined ? r.c : lamp.c * r.boost;
  return tone(l, Math.min(r.c, Math.max(CHROMA_FLOOR, own)), h);
}

/** Each lamp's centre along its light, 0 to 1, by its share. */
function centres(light: Light): number[] {
  const total = light.reduce((s, x) => s + x.w, 0) || 1;
  let acc = 0;
  return light.map((x) => {
    const share = x.w / total;
    const c = acc + share / 2;
    acc += share;
    return c;
  });
}

/**
 * The light as a ring's conic gradient: each lamp at the centre of its arc,
 * interpolated in oklab (never through a grey), from `from` (CSS degrees; 300
 * puts the first lamp at the top-left, where the product's one light sits).
 */
export function conicOf(
  light: Light,
  register: RegisterId,
  from = 300,
): string {
  const at = centres(light);
  const c = light.map((x) => lampTone(x, register).oklch);
  const last = light.length - 1;
  const stops = [
    `${c[last]} ${((at[last] - 1) * 360).toFixed(1)}deg`,
    ...c.map((col, i) => `${col} ${(at[i] * 360).toFixed(1)}deg`),
    `${c[0]} ${((at[0] + 1) * 360).toFixed(1)}deg`,
  ];
  return `conic-gradient(in oklab from ${from}deg, ${stops.join(", ")})`;
}

/** The light as a band along an edge, left to right, blended in oklab. */
export function bandOf(light: Light, register: RegisterId): string {
  const at = centres(light);
  const stops = light.map(
    (x, i) => `${lampTone(x, register).oklch} ${(at[i] * 100).toFixed(1)}%`,
  );
  return `linear-gradient(in oklab 90deg, ${stops.join(", ")})`;
}

/* ── the type ─────────────────────────────────────────────────────────────── */

/**
 * THE FACES, KEPT AND TUNED (every take): Urbanist 700 to be loud (tighter as
 * it grows), Inter to read, and the readout (Inter 600 in spaced capitals) for
 * what a camera prints. One italic in the whole brand: the wordmark's.
 */
export const FACE = {
  display: "var(--font-display), var(--font-sans), ui-sans-serif, sans-serif",
  text: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
} as const;

/** A readout: what a camera prints (a state, a count, a value). */
export function Readout({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={cn("ag-readout", className)} style={style}>
      {children}
    </span>
  );
}

/* ── the room's primitives, fed any light ─────────────────────────────────── */

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * THE SEAM IN THE ROOM: light where two grounds meet, born at the edge in a
 * hot core and spent before the words (its box is its reach; the copy starts
 * below it), carrying its source line, the edge itself lit. It rests still.
 * Mount it as the first child of a `relative` box whose top edge it lights.
 */
export function RoomSeam({
  light,
  edge = "top",
  reach = 120,
  strength = 1,
  className,
  style,
}: {
  light: Light;
  edge?: "top" | "bottom";
  reach?: number;
  strength?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const vars: Vars = {
    height: reach,
    "--ag-band": bandOf(light, "roomSeam"),
    "--ag-line": bandOf(light, "roomLine"),
    "--ag-o": strength * 0.95,
    ...style,
  };
  return (
    <div
      aria-hidden
      data-edge={edge}
      className={cn("ag-seam", className)}
      style={vars}
    >
      <div className="ag-seam-light" />
      <div className="ag-seam-line" />
    </div>
  );
}

/**
 * THE BLOOM IN THE ROOM: light behind the one live subject, born at the
 * subject's own edges (a blurred frame of its light, never a centred blob); it
 * ignites once and rests lit. One per view.
 */
export function RoomBloom({
  light,
  children,
  spread = 4,
  blur = 40,
  radius = 2,
  rest = 0.9,
  ignite = true,
  className,
  style,
}: {
  light: Light;
  children: ReactNode;
  spread?: number;
  blur?: number;
  radius?: number;
  rest?: number;
  ignite?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const vars: Vars = {
    "--ag-conic": conicOf(light, "room"),
    "--ag-spread": `${spread}px`,
    "--ag-blur": `${blur}px`,
    "--ag-radius": `${radius}px`,
    "--ag-rest": rest,
    ...style,
  };
  return (
    <div
      className={cn("ag-bloom", className)}
      data-ignite={ignite ? "" : undefined}
      style={vars}
    >
      <div aria-hidden className="ag-bloom-light" />
      <div className="ag-bloom-subject">{children}</div>
    </div>
  );
}

/** The shutter's glyph, drawn: the add, a done tick, or nothing. */
export function ShutterGlyph({
  glyph,
  size,
}: {
  glyph: "add" | "done" | "none";
  size: number;
}) {
  if (glyph === "none") return null;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path
        d={glyph === "add" ? "M12 5v14M5 12h14" : "M5 12.5l4.5 4.5L19 7.5"}
        stroke="currentColor"
        strokeWidth={glyph === "add" ? 2.2 : 2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * THE RING IN THE ROOM: light round the one thing that adds a photograph (the
 * shutter). Its face is dark, so the photographs stay the brightest thing on
 * the screen; lit from above; `progress` is a run going, the light filling
 * round as her photographs send.
 */
export function RoomRing({
  light,
  size = 64,
  progress,
  glyph = "add",
  breathe = false,
  face = "room",
  className,
  style,
  label,
}: {
  light: Light;
  size?: number;
  progress?: number;
  glyph?: "add" | "done" | "none";
  breathe?: boolean;
  /** The face's material: the room's near-black, or paper's ink. */
  face?: Ground;
  className?: string;
  style?: CSSProperties;
  label?: string;
}) {
  const band = Math.max(2, Math.round(size * 0.05 * 2) / 2);
  const gap = Math.max(2, Math.round(size * 0.035));
  const vars: Vars = {
    width: size,
    height: size,
    "--ag-conic": conicOf(light, "room"),
    "--ag-band": `${band}px`,
    "--ag-gap": `${gap}px`,
    "--ag-p": progress ?? 1,
    "--ag-glow": `${Math.round(size * 0.2)}px`,
    ...style,
  };
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-face={face}
      data-state={progress === undefined ? "rest" : "sending"}
      data-breathe={breathe ? "" : undefined}
      className={cn("ag-ring", className)}
      style={vars}
    >
      <span className="ag-ring-glow" />
      <span className="ag-ring-band">
        <span className="ag-ring-track" />
        <span className="ag-ring-fill" />
      </span>
      <span className="ag-ring-face">
        <ShutterGlyph glyph={glyph} size={size * 0.36} />
      </span>
    </span>
  );
}

/**
 * THE SEED AS ATMOSPHERE IN THE ROOM: where a photograph will be, the seed's
 * own light glowing in the dark (its hue at three depths, lit where the
 * hashvatar's light sits), never a flat slab of colour, and quiet enough that
 * the first photograph is unmistakably the brighter thing.
 */
export function RoomSeed({
  seed,
  className,
  style,
  children,
}: {
  seed: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const o = orbFor(seed);
  const lit = lampTone({ h: o.hue, w: 1, dl: 0.06 }, "room").oklch;
  const body = lampTone({ h: o.hue, w: 1 }, "room").oklch;
  const deep = lampTone(
    { h: (o.hue + 348) % 360, w: 1, dl: -0.08 },
    "room",
  ).oklch;
  const x = Math.round(o.light.x + 8);
  const y = Math.round(o.light.y + 10);
  return (
    <div
      data-bd-seed={seed}
      className={cn("ag-seed", className)}
      style={{
        position: "relative",
        overflow: "hidden",
        background: [
          `radial-gradient(62% 78% at ${x}% ${y}%, ${alpha(lit, 62)} 0%, transparent 70%)`,
          `radial-gradient(70% 80% at ${100 - x}% ${100 - y / 2}%, ${alpha(body, 40)} 0%, transparent 72%)`,
          `radial-gradient(90% 70% at 50% 118%, ${alpha(deep, 55)} 0%, transparent 70%)`,
          ROOM.card.hex,
        ].join(", "),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * THE SEAM, IN PLACE, IN THE ROOM: light born under a wall of photographs,
 * each photograph's own bottom edge directly beneath it (`EDGE`, segment by
 * segment, else its sampled hues), pooled under each photograph, its source
 * line broken where the wall's gaps are. `hues` lets a take read a tile its
 * own way (Ink: its one key). Mount it as the first child of a `relative` box
 * set at the wall's foot, as wide as the wall.
 */
export function RoomWallSeam({
  tiles,
  width,
  reach = 120,
  strength = 1,
  hues,
  style,
}: {
  tiles: readonly Tile[];
  width: number;
  reach?: number;
  strength?: number;
  hues?: (t: Tile) => readonly number[];
  style?: CSSProperties;
}) {
  const stops = (reg: RegisterId) =>
    tiles.flatMap((t) => {
      const hs = hues
        ? hues(t)
        : (EDGE[t.id]?.bottom ?? SAMPLED[t.id].map((x) => x.h));
      const c = chromaOf(t.id);
      return hs.map((h, k) => {
        const at = ((t.x + ((k + 0.5) * t.w) / hs.length) / width) * 100;
        return `${lampTone({ h, w: 1, c }, reg).oklch} ${at.toFixed(2)}%`;
      });
    });
  const band = (reg: RegisterId) =>
    `linear-gradient(90deg in oklab, ${stops(reg).join(", ")})`;
  const pools = [
    ...tiles.map(
      (t) =>
        `radial-gradient(${Math.round(t.w * 0.74)}px 100% at ${Math.round(t.x + t.w / 2)}px 0px, rgb(0 0 0 / 0.9) 0%, rgb(0 0 0 / 0.38) 20%, rgb(0 0 0 / 0.08) 50%, transparent 84%)`,
    ),
    "linear-gradient(to bottom, rgb(0 0 0 / 0.55) 0%, rgb(0 0 0 / 0.14) 16%, transparent 34%)",
  ].join(", ");
  const lines = tiles
    .map(
      (t) =>
        `linear-gradient(90deg, transparent ${Math.round(t.x)}px, #000 ${Math.round(t.x + 8)}px, #000 ${Math.round(t.x + t.w - 8)}px, transparent ${Math.round(t.x + t.w)}px)`,
    )
    .join(", ");
  return (
    <div
      aria-hidden
      className="ag-wallseam"
      style={{ height: reach, ...style }}
    >
      <div
        className="ag-wallseam-light"
        style={{
          background: band("roomSeam"),
          opacity: strength * 0.95,
          WebkitMaskImage: pools,
          maskImage: pools,
        }}
      />
      <div
        className="ag-wallseam-line"
        style={{
          background: band("roomLine"),
          WebkitMaskImage: lines,
          maskImage: lines,
        }}
      />
    </div>
  );
}

/** A light's receipt: its lamps as chips sized by their share, so a slide can show where its colour came from. */
export function LightChips({
  light,
  height = 8,
  className,
  style,
}: {
  light: Light;
  height?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const total = light.reduce((s, x) => s + x.w, 0) || 1;
  return (
    <div
      className={cn("flex overflow-hidden", className)}
      style={{ height, gap: 2, borderRadius: 2, ...style }}
    >
      {light.map((x, i) => (
        <span
          key={`${x.h}-${i}`}
          style={{
            flexGrow: x.w / total,
            minWidth: 6,
            background: lampTone(x, "room").oklch,
          }}
        />
      ))}
    </div>
  );
}

/* ── the shared, take-free pieces ─────────────────────────────────────────── */

/**
 * A PHOTOGRAPH as the system draws it: a 2 px corner; in the room its light
 * edge (one pixel of light on its top bevel, production's `[data-lit]`); on
 * paper a print's lift.
 */
export function LitPhoto({
  id,
  focus,
  ground = "room",
  className,
  style,
}: {
  id: PhotoId;
  focus?: string;
  ground?: Ground;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("ag-photo", className)}
      data-ground={ground}
      style={style}
    >
      <Photo id={id} focus={focus} />
    </div>
  );
}

/**
 * THE CODE ON ITS PLATE: the event's real, scannable code on a white plate
 * (its quiet zone kept white, never lit), the event's name under it. A slide
 * stands it in its take's Bloom where it is the screen's one live subject.
 */
export function CodePlate({
  size = 176,
  name,
  value,
  shadow = "room",
  className,
  style,
}: {
  size?: number;
  name?: string;
  value?: string;
  /** The ground it stands on, for its lift. */
  shadow?: Ground | "none";
  className?: string;
  style?: CSSProperties;
}) {
  const pad = Math.round(size * 0.09);
  return (
    <div
      className={cn("flex flex-col items-center", className)}
      style={{
        background: "#ffffff",
        color: "#111113",
        padding: pad,
        paddingBottom: name ? Math.round(pad * 0.7) : pad,
        borderRadius: Math.round(size * 0.1),
        boxShadow:
          shadow === "paper"
            ? "0 1px 2px rgb(0 0 0 / 0.08), 0 6px 18px -6px rgb(0 0 0 / 0.18)"
            : shadow === "room"
              ? "0 10px 30px -10px rgb(0 0 0 / 0.7)"
              : undefined,
        ...style,
      }}
    >
      <Qr size={size} value={value} />
      {name ? (
        <span
          style={{
            fontFamily: FACE.display,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            fontSize: Math.max(12, Math.round(size * 0.085)),
            marginTop: Math.round(pad * 0.6),
          }}
        >
          {name}
        </span>
      ) : null}
    </div>
  );
}

/**
 * A PHONE, for a scene: the display's near-black body, a 1 px light edge, the
 * screen inside on its own ground (the hex the slide hands it).
 */
export function PhoneShell({
  width = 300,
  height = 620,
  screen,
  ink,
  on = "room",
  children,
  className,
  style,
}: {
  width?: number;
  height?: number;
  /** The screen's ground, as hex. */
  screen: string;
  /** The screen's foreground ink, as hex. */
  ink: string;
  /** The ground the phone stands on, for its shadow. */
  on?: Ground;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const bezel = Math.round(width * 0.03);
  const r = Math.round(width * 0.15);
  return (
    <div
      className={cn("ag-phone", className)}
      data-on={on}
      style={{ width, height, borderRadius: r, padding: bezel, ...style }}
    >
      <div
        className="ag-phone-screen"
        style={{ borderRadius: r - bezel, background: screen, color: ink }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── a wall of photographs, laid out ──────────────────────────────────────── */

export type Tile = {
  id: PhotoId;
  x: number;
  y: number;
  w: number;
  h: number;
  focus?: string;
};
export type RowSpec = readonly { id: PhotoId; a: number; focus?: string }[];

/** A justified row: every photograph at its own width, one height, edge to edge. */
export function justify(
  row: RowSpec,
  width: number,
  gap: number,
  y = 0,
  x0 = 0,
) {
  const sum = row.reduce((s, t) => s + t.a, 0);
  const h = (width - gap * (row.length - 1)) / sum;
  let x = x0;
  const tiles: Tile[] = row.map((t) => {
    const w = t.a * h;
    const tile = { id: t.id, x, y, w, h, focus: t.focus };
    x += w + gap;
    return tile;
  });
  return { h, tiles };
}

/** Rows stacked: the wall, and the bottom row a Seam is born under. */
export function wallOf(rows: readonly RowSpec[], width: number, gap: number) {
  let y = 0;
  const all: Tile[] = [];
  let last: Tile[] = [];
  for (const r of rows) {
    const j = justify(r, width, gap, y);
    all.push(...j.tiles);
    last = j.tiles;
    y += j.h + gap;
  }
  return { tiles: all, bottom: last, height: y - gap };
}

/** The voice the slides set in real lines (marketing-voice.ts's own lines). */
export const VOICE = {
  thesis: "The whole event, in one album.",
  subhead:
    "Your guests took the best photos and videos at your event. Partyreel collects them with one easy link. No more chasing group chats the next day.",
  hostEmpty: "Your first album starts here",
  guestEmpty: "The album starts with you",
  reel: "Everyone's photos, live as they land.",
} as const;
