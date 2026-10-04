"use client";

import type { CSSProperties, ReactNode } from "react";

import { fitChroma, hex, orbFor } from "@/lib/avatar/gradient";
import { cn } from "@/lib/utils";

import { Photo, type PhotoId, Qr } from "../deck/media";

/**
 * AFTERGLOW'S SYSTEM: the values and the primitives every slide composes from,
 * so the application designer draws the six touchpoints with these rather than
 * re-inventing them.
 *
 * ★ LIGHT IS THE BRAND, NEVER PAINT. The interface is a quiet ground (the room,
 * or paper); the photographs are the brightest thing on any screen; the colour
 * anywhere else is the LIGHT they give off, in one of three forms (the Ring,
 * the Seam, the Bloom). Nothing here is a fill a control could wear.
 *
 * ★ ONE SOURCING RULE, RANKED: the media where there is media (sampled), the
 * event's seed before its first photograph (the hashvatar's hue), the five
 * house lamps where neither exists (the marketing, the icon).
 *
 * ★ A MEASURED ELEMENT IS PAINTED IN HEX. The deck's caption reads contrast off
 * `getComputedStyle`, which hands an `oklch()` colour back as `oklch()` and the
 * reader only parses `rgb()`, so every ground a word sits on and every word
 * whose contrast a slide claims is painted from `.hex`; `.css` (oklch) is for
 * light, which nobody measures.
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

/* ── the achromatic base ──────────────────────────────────────────────────── */

/**
 * THE GROUNDS: production's own values (globals.css), kept. The room is the app
 * and every page where media plays; paper is every page where people read and
 * decide; the display is every pop-out; the well is under the photographs.
 */
export const GROUND = {
  room: tone(0.085, 0.003, 286),
  roomCard: tone(0.15, 0.004, 286),
  display: tone(0.165, 0.004, 286),
  well: tone(0.065, 0.0045, 286),
  paper: tone(0.972, 0.002, 286),
  paperCard: tone(0.993, 0.001, 286),
} as const;

/** The three text steps on each ground (production's, kept). */
export const INK = {
  room: {
    fg: tone(0.97, 0.002, 286),
    muted: tone(0.71, 0.006, 286),
    faint: tone(0.53, 0.006, 286),
  },
  paper: {
    fg: tone(0.14, 0.004, 286),
    muted: tone(0.43, 0.006, 286),
    faint: tone(0.6, 0.006, 286),
  },
} as const;

export type Ground = "room" | "paper";

/* ── status: lights, not light ────────────────────────────────────────────── */

/**
 * THE STATUS SET: a state is a small, solid, hard-edged point and its word,
 * a camera's pilot light. It never glows (the glow is the light's, and a
 * glowing point is a lamp); the light never speaks (no words sit in it).
 *
 * ★ WAITING IS THE CAMERA'S STANDBY, NOT A WARNING. Half-lit and breathing,
 * in the ground's own ink, with no hue at all: the commonest state in the app
 * can never pass for the brand, and a pause stops reading as a problem. The
 * dull amber retires from status (it stays only as hide and show's action hue).
 */
export type StatusId = "standby" | "ready" | "fault";

export const STATUS: Record<
  StatusId,
  {
    readonly name: string;
    readonly means: string;
    readonly room: Tone;
    readonly paper: Tone;
  }
> = {
  standby: {
    name: "Standby",
    means: "Waiting, in review, developing, sending",
    room: INK.room.fg,
    paper: INK.paper.fg,
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

/** Today's waiting amber, for the slide that retires it. */
export const RETIRED_WARNING = tone(0.8, 0.14, 80);

/* ── the light: lamps, sources, registers ─────────────────────────────────── */

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
 * its hand-tuned ambient register: amber needs a higher L than violet to read
 * as the same brightness.
 */
export const LAMPS = [
  { n: 1, name: "Coral", ...tone(0.72, 0.17, 25) },
  { n: 2, name: "Amber", ...tone(0.8, 0.15, 85) },
  { n: 3, name: "Green", ...tone(0.72, 0.14, 155) },
  { n: 4, name: "Blue", ...tone(0.7, 0.14, 255) },
  { n: 5, name: "Violet", ...tone(0.68, 0.16, 305) },
] as const;

/** The house light, the five at equal shares: the marketing's light. */
export const HOUSE: Light = LAMPS.map((x) => ({ h: x.h, w: 1 }));

/**
 * THE ICON'S LIGHT: the same five, weighted by how Partyreel's own twelve
 * photographs light (every still sampled with production's sampler, each
 * hue given to its nearest lamp, each photograph one vote): warm where the
 * golden hour and the string lights are, blue where the stage is. Ordered
 * clockwise from the top-left, where the product's one light source sits.
 */
export const ICON_LIGHT: Light = [
  { h: 85, w: 27.1 },
  { h: 155, w: 10.1 },
  { h: 255, w: 26.1 },
  { h: 305, w: 6.3 },
  { h: 25, w: 30.5 },
];

/**
 * EVERY STILL'S OWN LIGHT, read by production's sampler
 * (`sampled-palette.ts`: a 32 px read, 24 hue buckets, chroma-weighted, 45°
 * apart), with Afterglow's one refinement applied: NOTHING INVENTED. The
 * sampler fans a one-hued photograph out round the wheel (the golden wedding
 * came back gold plus 197°, 269° and 341°, none of them in the picture); here
 * a fanned hue is dropped, so is any hue under a tenth of the strongest, and a
 * one-hued photograph glows its one hue at three depths, the way a hashvatar
 * is one hue at several depths.
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
 * EVERY STILL'S INTENSITY: the 95th-percentile chroma of its midtones (the
 * same 32 px read). ★ NEVER LOUDER THAN ITS PHOTOGRAPH: production pins every
 * sampled light at chroma 0.15, so a soft daylight wedding threw a louder
 * colour than anything in it. Here a light keeps its photograph's own
 * intensity (lifted a seventh, between 0.07 and the register's cap): the
 * arch at noon glows softly, the laser show at full.
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

/** One hue read at three depths: the hashvatar's own way to be rich. */
function depths(h: number, c?: number): Light {
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

/** The light of one photograph, as the Ring, Seam and Bloom draw it. */
export function lightOfPhoto(id: PhotoId): Light {
  const c = chromaOf(id);
  return withDepth(SAMPLED[id].map((x) => ({ ...x, c })));
}

/**
 * The light of several photographs at once (a wall is ONE lamp, as the
 * production sampler reads a strip): each photograph an equal vote, its hues
 * merged where they sit within 20° of each other, the strongest five kept.
 */
export function lightOfPhotos(ids: readonly PhotoId[]): Light {
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
  const top = merged.sort((a, b) => b.w - a.w).slice(0, 5);
  const c = Math.max(...ids.map(chromaOf));
  // Around the wheel, so neighbours in the ring are neighbours in hue.
  return withDepth(top.sort((a, b) => a.h - b.h).map((x) => ({ ...x, c })));
}

/**
 * A PHOTOGRAPH'S EDGE, IN PLACE: the dominant hue of each sixth (or fifth)
 * of one edge, the same sampler run on that strip alone. ★ A SEAM BORN AT A
 * PHOTOGRAPH'S EDGE TAKES THAT EDGE'S OWN COLOURS, WHERE THEY ARE: the crowd
 * at the foot of the confetti photograph is violet, so the light under it is
 * violet, warming where a face catches the stage. Read left to right (a
 * bottom edge) or top to bottom (a side).
 */
export const EDGE: Partial<Record<PhotoId, Partial<Record<"bottom" | "left", readonly number[]>>>> = {
  "concert-confetti": { bottom: [9, 294, 308, 309, 293, 277] },
  "wedding-toast": { bottom: [50, 141, 52, 69, 51, 40] },
  "reception-table": { bottom: [114, 97, 65, 54, 64, 52] },
  "wedding-arch": { bottom: [138, 129, 129, 129, 140, 131] },
  "party-balloons": { bottom: [82, 67, 81, 68, 68], left: [175, 184, 5, 82, 82] },
  "wedding-petals": { left: [98, 51, 250, 83, 51] },
  "festival-lights": { bottom: [233, 246, 233, 220, 233, 247] },
};

/** The light born at one edge of a photograph, segment by segment. */
export function lightOfEdge(id: PhotoId, side: "bottom" | "left"): Light {
  const hues = EDGE[id]?.[side];
  if (!hues) return lightOfPhoto(id);
  const c = chromaOf(id);
  return hues.map((h) => ({ h, w: 1, c }));
}

/**
 * THE SEED'S LIGHT: before an event's first photograph, its light is its own
 * hashvatar (`orbFor`, production's seeded colour), the one hue at three
 * depths. The first photograph takes the light over.
 */
export function lightOfSeed(seed: string): Light {
  return depths(orbFor(seed).hue);
}

export const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};
const mixHue = (a: number, b: number, t: number) => {
  const d = ((b - a + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
};

/**
 * THE REGISTERS: how light is drawn on each ground, and by which form.
 *
 * ★ ONE PRINCIPLE ON BOTH GROUNDS: LIGHT IS BORN BRIGHT AT ITS SOURCE AND
 * FALLS OFF FAST. A long dim tail of warm light reads as brown on the room and
 * as a stain on paper (both measured on the bootstrap stills), so a seam is a
 * lit line, a hot core and a short glow; the room only lets it carry further.
 * ★ PAPER (the solve; today the light is fenced off paper because a broad
 * mid-light wash over white reads as dirt): higher lightness, more chroma,
 * a crisp source line where the light enters, a third of the room's reach.
 * The way sun through a door's gap lies on a white wall.
 *
 * Every register is tuned per hue the way the house five are (`lift`: yellows
 * sit higher, so a gold light is gold, never brown), and `boost` scales a
 * photograph's own intensity (paper needs more chroma to read as light).
 */
export const REGISTER = {
  /** The Ring and the Bloom, in the room. */
  room: { l: 0.72, lift: 0.09, c: 0.15, boost: 1 },
  /** The Seam's glow, in the room. */
  roomSeam: { l: 0.82, lift: 0.07, c: 0.15, boost: 1.05 },
  /** The Seam's source line, in the room: the edge itself, lit. */
  roomLine: { l: 0.92, lift: 0.02, c: 0.13, boost: 1 },
  /** The Ring and the Bloom, on paper. */
  paper: { l: 0.85, lift: 0.05, c: 0.14, boost: 1.3 },
  /** The Seam's glow, on paper. */
  paperSeam: { l: 0.9, lift: 0.03, c: 0.16, boost: 1.6 },
  /** The Seam's source line, on paper. */
  paperLine: { l: 0.78, lift: 0.06, c: 0.17, boost: 1.6 },
} as const;
export type RegisterId = keyof typeof REGISTER;

/** How far a hue sits toward yellow, 0 to 1 (yellows need more lightness). */
const yellowness = (h: number) =>
  Math.max(0, Math.cos(((hueGap(h, 95) / 70) * Math.PI) / 2));

/** A lamp's colour in a register, gamut-fitted. */
export function lampTone(lamp: Lamp, register: RegisterId): Tone {
  const r = REGISTER[register];
  const l = Math.min(0.95, r.l + r.lift * yellowness(lamp.h) + (lamp.dl ?? 0));
  const own = lamp.c === undefined ? r.c : lamp.c * r.boost;
  return tone(l, Math.min(r.c, own), lamp.h);
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
 * the arc its share, interpolated in oklab (never through a grey), starting
 * at `from` (CSS conic degrees; 300 puts the first lamp at the top-left).
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

/** The light as a band along an edge (a seam's colour), left to right. */
export function bandOf(light: Light, register: RegisterId): string {
  const at = centres(light);
  const stops = light.map(
    (x, i) => `${lampTone(x, register).oklch} ${(at[i] * 100).toFixed(1)}%`,
  );
  return `linear-gradient(in oklab 90deg, ${stops.join(", ")})`;
}

/* ── the type ─────────────────────────────────────────────────────────────── */

/**
 * THE FACES, KEPT AND TUNED: Urbanist 700 to be loud (at -3%, tighter as it
 * grows), Inter to read, and the readout (Inter 600 in spaced capitals) for
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

/* ── the primitives ───────────────────────────────────────────────────────── */

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * THE SEAM: light where two grounds meet. It is born at the edge and spent
 * before the words (its box is its reach; the copy starts below it), it drifts
 * along its edge on the one slow clock, and on paper it carries its source
 * line, the edge itself lit.
 *
 * Mount it as the first child of a `relative` box whose edge it lights.
 */
export function Seam({
  light,
  ground,
  edge = "top",
  reach,
  strength = 1,
  drift = true,
  className,
  style,
}: {
  light: Light;
  ground: Ground;
  edge?: "top" | "bottom";
  /** How far the light reaches from its edge (px). Default: 120 room, 56 paper. */
  reach?: number;
  /** 0 to 1, the light's opacity at its edge (1 is the register's own). */
  strength?: number;
  /** Drift along the edge on the 24 s clock (where motion is welcome). */
  drift?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const paper = ground === "paper";
  const vars: Vars = {
    height: reach ?? (paper ? 56 : 120),
    "--ag-band": bandOf(light, paper ? "paperSeam" : "roomSeam"),
    "--ag-line": bandOf(light, paper ? "paperLine" : "roomLine"),
    "--ag-o": strength * (paper ? 1 : 0.95),
    ...style,
  };
  return (
    <div
      aria-hidden
      data-edge={edge}
      data-ground={ground}
      data-drift={drift ? "" : undefined}
      className={cn("ag-seam", className)}
      style={vars}
    >
      <div className="ag-seam-light" />
      <div className="ag-seam-line" />
    </div>
  );
}

/**
 * THE BLOOM: light behind the one live subject of a screen (the code, the
 * reel, the card that is the point). Born at the subject's own edges (a
 * blurred frame of its light behind it, never a centred blob), it ignites once
 * and rests lit. One per view.
 */
export function Bloom({
  light,
  ground,
  children,
  spread,
  blur,
  radius = 2,
  rest = 0.9,
  ignite = true,
  className,
  style,
}: {
  light: Light;
  ground: Ground;
  children: ReactNode;
  /** How far past the subject's edges the light box reaches (px); keep it
   *  small, so the light peaks AT the edge and falls away from it. */
  spread?: number;
  /** The light's reach and softness (px): about a seventh of the subject. */
  blur?: number;
  /** The subject's corner, so the light follows its shape (px). */
  radius?: number;
  /** The resting opacity after it ignites. */
  rest?: number;
  ignite?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const paper = ground === "paper";
  const vars: Vars = {
    "--ag-conic": conicOf(light, paper ? "paper" : "room"),
    "--ag-spread": `${spread ?? (paper ? 2 : 4)}px`,
    "--ag-blur": `${blur ?? (paper ? 14 : 40)}px`,
    "--ag-radius": `${radius}px`,
    "--ag-rest": paper ? Math.min(1, rest + 0.1) : rest,
    ...style,
  };
  return (
    <div
      className={cn("ag-bloom", className)}
      data-ground={ground}
      data-ignite={ignite ? "" : undefined}
      style={vars}
    >
      <div aria-hidden className="ag-bloom-light" />
      <div className="ag-bloom-subject">{children}</div>
    </div>
  );
}

/**
 * THE RING: light round the one thing that adds a photograph (the shutter),
 * and the icon. Its face is dark on both grounds (the display's near-black in
 * the room, the ink on paper), so the photographs stay the brightest thing on
 * the screen and the shutter is one object everywhere, the icon included. Lit
 * from above, like everything in the product. `progress` is a run going: the
 * light fills round as her photographs go.
 */
export function Ring({
  light,
  ground,
  size = 64,
  progress,
  glyph = "add",
  breathe = true,
  className,
  style,
  label,
}: {
  light: Light;
  ground: Ground;
  /** The face's diameter (px); the band and the glow scale with it. */
  size?: number;
  /** 0 to 1 while a run goes; absent at rest. */
  progress?: number;
  glyph?: "add" | "none" | "done";
  breathe?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Its accessible name where it stands for the real button. */
  label?: string;
}) {
  const paper = ground === "paper";
  const band = Math.max(2, Math.round(size * 0.05 * 2) / 2);
  const gap = Math.max(2, Math.round(size * 0.035));
  const vars: Vars = {
    width: size,
    height: size,
    "--ag-conic": conicOf(light, paper ? "paper" : "room"),
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
      data-ground={ground}
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
        {glyph === "add" ? (
          <svg viewBox="0 0 24 24" width={size * 0.36} height={size * 0.36}>
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        ) : glyph === "done" ? (
          <svg viewBox="0 0 24 24" width={size * 0.36} height={size * 0.36}>
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        ) : null}
      </span>
    </span>
  );
}

/**
 * THE SEED AS ATMOSPHERE: where a photograph will be, the seed's own light
 * glowing in the ground (its hue at three depths, lit where the hashvatar's
 * light sits), never a flat slab of colour. Quiet enough that the first
 * photograph, landing in its place, is unmistakably the brighter thing.
 */
export function SeedCover({
  seed,
  ground = "room",
  className,
  style,
  children,
}: {
  seed: string;
  ground?: Ground;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const o = orbFor(seed);
  const paper = ground === "paper";
  const lit = lampTone({ h: o.hue, w: 1, dl: 0.06 }, paper ? "paper" : "room").oklch;
  const body = lampTone({ h: o.hue, w: 1 }, paper ? "paper" : "room").oklch;
  const deep = lampTone({ h: (o.hue + 348) % 360, w: 1, dl: -0.08 }, paper ? "paper" : "room").oklch;
  const a = (c: string, pct: number) => `color-mix(in oklab, ${c} ${pct}%, transparent)`;
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
          `radial-gradient(62% 78% at ${x}% ${y}%, ${a(lit, paper ? 70 : 62)} 0%, transparent 70%)`,
          `radial-gradient(70% 80% at ${100 - x}% ${100 - y / 2}%, ${a(body, paper ? 46 : 40)} 0%, transparent 72%)`,
          `radial-gradient(90% 70% at 50% 118%, ${a(deep, paper ? 40 : 55)} 0%, transparent 70%)`,
          paper ? GROUND.paperCard.hex : GROUND.roomCard.hex,
        ].join(", "),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * A STATUS: the point and its word. `contrast` marks the point for the deck's
 * caption to measure against the ground behind it (the claim a slide makes).
 */
export function StatusLight({
  state,
  ground,
  children,
  size = 8,
  contrast,
  wordContrast,
  className,
}: {
  state: StatusId;
  ground: Ground;
  /** The word (a readout). */
  children?: ReactNode;
  size?: number;
  /** A caption label: measure the point's contrast on its ground. */
  contrast?: string;
  /** A caption label: measure the word's contrast on its ground. */
  wordContrast?: string;
  className?: string;
}) {
  const t = STATUS[state][ground];
  return (
    <span className={cn("ag-status", className)} data-ground={ground}>
      <span
        className="ag-point"
        data-state={state}
        data-bd-contrast={contrast}
        style={{ color: t.hex, width: size, height: size }}
      />
      {children ? (
        <span
          className="ag-readout ag-status-word"
          data-bd-contrast={wordContrast}
          style={{ color: INK[ground].fg.hex }}
        >
          {children}
        </span>
      ) : null}
    </span>
  );
}

/**
 * A PHOTOGRAPH as the system draws it: a 2 px corner, and in the room its light
 * edge (one pixel of light on its top bevel, production's `[data-lit]`).
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
 * (its quiet zone kept white, never lit), the event's name under it. Where it
 * is the screen's one live subject (the empty hub, the table card, Create's
 * develop) pass `light` and it stands in its Bloom: the seed's light before
 * the first photograph, the album's after.
 */
export function CodePlate({
  size = 176,
  name,
  light,
  ground = "room",
  value,
  className,
  style,
}: {
  /** The code's own size (px); the plate adds its quiet zone round it. */
  size?: number;
  /** The event's name, under the code. */
  name?: string;
  /** Light it: the plate stands in a Bloom of this light. */
  light?: Light;
  ground?: Ground;
  /** What the code encodes (the deck's demo address by default). */
  value?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const pad = Math.round(size * 0.09);
  const plate = (
    <div
      className="flex flex-col items-center"
      style={{
        background: "#ffffff",
        color: "#111113",
        padding: pad,
        paddingBottom: name ? Math.round(pad * 0.7) : pad,
        borderRadius: Math.round(size * 0.1),
        boxShadow:
          ground === "paper"
            ? "0 1px 2px rgb(0 0 0 / 0.08), 0 6px 18px -6px rgb(0 0 0 / 0.18)"
            : "0 10px 30px -10px rgb(0 0 0 / 0.7)",
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
  return (
    <div className={cn("inline-block", className)} style={style}>
      {light ? (
        <Bloom
          light={light}
          ground={ground}
          radius={Math.round(size * 0.1)}
          blur={Math.round(size * (ground === "paper" ? 0.14 : 0.3))}
          spread={Math.round(size * 0.02)}
        >
          {plate}
        </Bloom>
      ) : (
        plate
      )}
    </div>
  );
}

/**
 * A PHONE, for a scene: the display's near-black body, a 1 px light edge, the
 * screen inside on its own ground. Children draw the screen at the phone's
 * inner size (`width - 2 * bezel`).
 */
export function PhoneShell({
  width = 300,
  height = 620,
  ground = "room",
  children,
  className,
  style,
}: {
  width?: number;
  height?: number;
  ground?: Ground;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const bezel = Math.round(width * 0.03);
  const r = Math.round(width * 0.15);
  return (
    <div
      className={cn("ag-phone", className)}
      style={{ width, height, borderRadius: r, padding: bezel, ...style }}
    >
      <div
        className="ag-phone-screen"
        data-ground={ground}
        style={{
          borderRadius: r - bezel,
          background: GROUND[ground].hex,
          color: INK[ground].fg.hex,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * A LIGHT'S RECEIPT: its lamps as chips sized by their share, each printed
 * with its hue, so a slide can show where its colour came from.
 */
export function LightChips({
  light,
  register,
  height = 10,
  className,
}: {
  light: Light;
  register: RegisterId;
  height?: number;
  className?: string;
}) {
  const total = light.reduce((s, x) => s + x.w, 0) || 1;
  return (
    <div className={cn("ag-chips", className)} style={{ height }}>
      {light.map((x, i) => (
        <span
          key={`${x.h}-${i}`}
          style={{
            flexGrow: x.w / total,
            background: lampTone(x, register).oklch,
          }}
        />
      ))}
    </div>
  );
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
