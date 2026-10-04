"use client";

import {
  type CSSProperties,
  type ReactNode,
  useMemo,
} from "react";

import {
  background,
  blendMode,
  contrast,
  css,
  fitChroma,
  FLOOR,
  GROUND,
  hex,
  inkFor,
  type Lch,
  type Orb as OrbData,
  orbFor,
  seedsFrom,
} from "@/lib/avatar/gradient";
import { cn } from "@/lib/utils";

import { GUESTS, PARTY } from "../deck/media";

/**
 * EVERYONE'S COLOR: THE SYSTEM, AS CODE. The palette and the status set as
 * named values, the signature's primitives as components, so every slide (and
 * the application designer after this deck) composes from one home.
 *
 * ★ THE ONE RULE EVERYTHING HERE SERVES: AN ORB IS A PERSON. The only brand
 * colour is the crowd's: each guest is a seeded hue (production's hashvatar,
 * `orbFor` + the `mesh` look, unchanged), and an event's colour is the mix of
 * the people in it. So an orb is never decoration, never status, never paint
 * on a control, and never laid over a photograph. Before anyone arrives, the
 * five house lamps stand in as the house mix: five house guests.
 *
 * ★ COLOURS ARE PAINTED AS HEX, PRINTED AS OKLCH. The deck's caption measures
 * contrast from computed `rgb()` values, and Chrome serialises an `oklch()`
 * colour as `oklch()`, which the probe cannot read. Every value is reasoned in
 * OKLCH (the `lch` field, what the slides print) and painted through `hex()`.
 */

/* ── the achromatic base ───────────────────────────────────────────────── */

export type Swatch = {
  readonly lch: Lch;
  readonly hex: string;
  readonly css: string;
  /** The value as a slide prints it. */
  readonly print: string;
};

const fmt = (n: number, dp: number) => Number(n.toFixed(dp)).toString();

export function swatch(l: number, c: number, h: number): Swatch {
  const lch = { l, c, h };
  return {
    lch,
    hex: hex(lch),
    css: css(lch),
    print: `oklch(${fmt(l, 3)} ${fmt(c, 3)} ${fmt(h, 0)})`,
  };
}

/**
 * The chrome: production's viewfinder greys, kept. Paper is the light page,
 * the room the dark one; the display is the camera's own near-black screen.
 */
export const BASE = {
  paper: swatch(0.972, 0.002, 286),
  card: swatch(0.993, 0.001, 286),
  step: swatch(0.93, 0.003, 286),
  ink: swatch(0.14, 0.004, 286),
  muted: swatch(0.43, 0.006, 286),
  faint: swatch(0.6, 0.006, 286),
  room: swatch(0.085, 0.003, 286),
  roomCard: swatch(0.15, 0.004, 286),
  display: swatch(0.165, 0.004, 286),
  roomStep: swatch(0.235, 0.004, 286),
  roomInk: swatch(0.97, 0.002, 286),
  roomMuted: swatch(0.71, 0.006, 286),
  well: swatch(0.065, 0.0045, 286),
  white: swatch(0.995, 0.002, 286),
} as const;

/**
 * WCAG contrast between two hex colours, the deck's own arithmetic (sRGB
 * channels from the hex, so a printed ratio matches the caption's to 0.1).
 */
export function ratio(fg: string, bg: string): string {
  const lum = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const a = lum(fg);
  const b = lum(bg);
  return `${((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(1)}:1`;
}

/** A ground's words and lines, so a drawing never mixes two grounds' sets. */
export type Tone = "paper" | "room";

export const ON: Record<
  Tone,
  {
    ground: string;
    card: string;
    step: string;
    ink: string;
    muted: string;
    faint: string;
    line: string;
  }
> = {
  paper: {
    ground: BASE.paper.hex,
    card: BASE.card.hex,
    step: BASE.step.hex,
    ink: BASE.ink.hex,
    muted: BASE.muted.hex,
    faint: BASE.faint.hex,
    line: "rgb(9 9 11 / 0.12)",
  },
  room: {
    ground: BASE.room.hex,
    card: BASE.roomCard.hex,
    step: BASE.roomStep.hex,
    ink: BASE.roomInk.hex,
    muted: BASE.roomMuted.hex,
    faint: swatch(0.53, 0.006, 286).hex,
    line: "rgb(255 255 255 / 0.1)",
  },
};

/* ── status: flat, hard-edged, never a circle ──────────────────────────── */

/**
 * ★ STATUS PARTS FROM PEOPLE BY FORM, NOT HUE. A crowd uses every hue, so a
 * state can own none of them: it is a flat plate with square corners, a glyph
 * built of straight lines and squares (a circle is a person), and its word.
 * Waiting has no colour at all: it is the ground turned over (ink on paper,
 * paper in the room) with a hatch, because nothing has happened yet. Success
 * and error keep green and red as solid plates, never as a light or a glow.
 */
export type StatusKind = "waiting" | "success" | "error";

export const STATUS_PLATE = {
  waitingOnPaper: BASE.ink,
  waitingInRoom: swatch(0.94, 0.002, 286),
  success: swatch(0.53, 0.13, 152),
  error: swatch(0.55, 0.21, 27),
} as const;

export const STATUS: Record<
  StatusKind,
  {
    word: string;
    meaning: string;
    plate: (tone: Tone) => Swatch;
    words: (tone: Tone) => Swatch;
  }
> = {
  waiting: {
    word: "Waiting",
    meaning: "In review, develops at 9, queued: nothing has happened yet",
    plate: (t) =>
      t === "paper" ? STATUS_PLATE.waitingOnPaper : STATUS_PLATE.waitingInRoom,
    words: (t) => (t === "paper" ? BASE.white : BASE.ink),
  },
  success: {
    word: "Done",
    meaning: "Approved, sent, saved, published",
    plate: () => STATUS_PLATE.success,
    words: () => BASE.white,
  },
  error: {
    word: "Failed",
    meaning: "Too large, rejected, could not send",
    plate: () => STATUS_PLATE.error,
    words: () => BASE.white,
  },
};

/** The status glyphs: straight lines and squares only (a circle is a person). */
export function StatusGlyph({
  kind,
  size = 12,
  color = "currentColor",
}: {
  kind: StatusKind;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      aria-hidden
      className="block shrink-0"
      style={{ overflow: "visible" }}
    >
      {kind === "waiting" && (
        <path d="M2.2 1h7.6L6 6zM6 6l3.8 5H2.2z" fill={color} />
      )}
      {kind === "success" && (
        <path
          d="M1.6 6.4 4.7 9.4 10.6 2.6"
          fill="none"
          stroke={color}
          strokeWidth={2.1}
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      )}
      {kind === "error" && (
        <>
          <rect x={4.9} y={0.8} width={2.2} height={6.6} fill={color} />
          <rect x={4.9} y={9} width={2.2} height={2.2} fill={color} />
        </>
      )}
    </svg>
  );
}

/**
 * A STATE AS A TAG: the plate, the glyph, the word in the camera's readout
 * voice (spaced capitals). `size` is the tag's height; `contrast` marks the
 * word for the deck's caption to measure.
 */
export function StatusTag({
  kind,
  tone = "paper",
  children,
  size = 24,
  contrastLabel,
  className,
  style,
  running = false,
}: {
  kind: StatusKind;
  tone?: Tone;
  children?: ReactNode;
  size?: number;
  /** When set, the caption measures the word's contrast under this label. */
  contrastLabel?: string;
  className?: string;
  style?: CSSProperties;
  /**
   * Work is genuinely in progress (an upload, a send): only then does
   * waiting's hatch travel. In review or waiting for a time, it stands still.
   */
  running?: boolean;
}) {
  const s = STATUS[kind];
  const plate = s.plate(tone);
  const words = s.words(tone);
  const font = Math.round(size * 0.46);
  return (
    <span
      data-ev-status={kind}
      className={cn(
        "ev-tag",
        kind === "waiting" && "ev-tag-hatch",
        kind === "waiting" && running && "ev-tag-hatch-run",
        tone === "room" && "ev-tag-room",
        className,
      )}
      style={{
        height: size,
        paddingInline: Math.round(size * 0.38),
        gap: Math.round(size * 0.28),
        backgroundColor: plate.hex,
        color: words.hex,
        fontSize: font,
        ...style,
      }}
    >
      <StatusGlyph kind={kind} size={Math.round(size * 0.44)} />
      <span data-bd-contrast={contrastLabel} className="ev-tag-word">
        {children ?? s.word}
      </span>
    </span>
  );
}

/* ── the colour source: people, and the house mix before them ───────────── */

/** One person: a name and the seed their colour comes from. */
export type Person = { readonly name: string; readonly seed: string };

/**
 * The house mix: the five house lamps (globals.css `--lamp-1..5`), re-cast as
 * five house guests. The palette before anyone arrives: the marketing's own
 * crowd, the icon, a page with no event.
 *
 * ★ THE HOUSE WEARS THE LAMPS' OWN VALUES, NOT A GUEST'S FIT. A guest's body
 * is fitted dark enough to carry a white initial at 4.5:1, which turns coral
 * into a signal red and amber into mustard: a toy's primaries. A house guest
 * never carries a letter, so its body IS the lamp (hand-tuned per hue), the
 * same mesh lit a step brighter. Re-key a lamp and the house mix follows.
 */
export const HOUSE = [
  { name: "Coral", hue: 25, l: 0.72, c: 0.17 },
  { name: "Amber", hue: 85, l: 0.8, c: 0.15 },
  { name: "Green", hue: 155, l: 0.72, c: 0.14 },
  { name: "Blue", hue: 255, l: 0.7, c: 0.14 },
  { name: "Violet", hue: 305, l: 0.68, c: 0.16 },
] as const;

/**
 * hashvatar's lightness fit (`gradient.ts` `fitBody`, which it does not
 * export), run at a hue we choose: the guest register, for a drawing that
 * needs to show a house hue the way a guest at that hue would look.
 */
export function fitBodyAt(hue: number, chroma: number): Lch {
  const ink = inkFor(hue);
  for (let attempt = 0; attempt < 6; attempt++) {
    const c = chroma * Math.pow(0.8, attempt);
    const at = (l: number): Lch => fitChroma({ l, c, h: hue });
    let lo = 0.3;
    let hi = 0.8;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (contrast(at(mid), GROUND.ink) >= FLOOR.ground) hi = mid;
      else lo = mid;
    }
    const floor = hi;
    lo = 0.3;
    hi = 0.8;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (contrast(ink, at(mid)) >= FLOOR.letter) lo = mid;
      else hi = mid;
    }
    if (lo > floor) return at(floor + (lo - floor) * 0.5);
  }
  return fitChroma({ l: 0.55, c: chroma * 0.3, h: hue });
}

const houseCache = new Map<number, OrbData>();

/** A house guest at one of the five lamp hues, as an orb: the lamp is its body. */
export function houseOrb(hue: number): OrbData {
  const hit = houseCache.get(hue);
  if (hit) return hit;
  const lamp = HOUSE.find((h) => h.hue === hue);
  const body = fitChroma({ l: lamp?.l ?? 0.72, c: lamp?.c ?? 0.15, h: hue });
  const orb: OrbData = {
    seed: `house-${hue}`,
    hue,
    hue2: (hue + 60) % 360,
    lit: fitChroma({ l: Math.min(0.93, body.l + 0.13), c: body.c * 0.9, h: hue }),
    body,
    deep: fitChroma({
      l: Math.max(0.2, body.l - 0.24),
      c: body.c * 0.85,
      h: (hue + 348) % 360,
    }),
    ink: inkFor(hue),
    light: { x: 34, y: 24 },
    angle: 140,
  };
  houseCache.set(hue, orb);
  return orb;
}

/** The house mix as people, so a drawing treats it exactly like a crowd. */
export const HOUSE_PEOPLE: readonly Person[] = HOUSE.map((h) => ({
  name: h.name,
  seed: `house:${h.hue}`,
}));

/**
 * The house guests as a row seats them: never in lamp order, which is hue
 * order and reads as a swatch (the system's "never sorted by colour"), but
 * mixed, the way five people arrive.
 */
export const HOUSE_ROW: readonly Person[] = [255, 25, 155, 305, 85].map(
  (hue) => HOUSE_PEOPLE.find((p) => p.seed === `house:${hue}`)!,
);

const orbCache = new Map<string, OrbData>();

/**
 * The orb for a person: a house seed (`house:<hue>`) or a guest's seed. In
 * production the seed is always `seedFor(id)`, never a name or an email.
 */
export function orbOf(seed: string): OrbData {
  const hit = orbCache.get(seed);
  if (hit) return hit;
  const o = seed.startsWith("house:")
    ? houseOrb(Number(seed.slice(6)))
    : orbFor(seed);
  orbCache.set(seed, o);
  return o;
}

/** A person's colour as values, for a drawing that composes its own picture. */
export function colorsOf(seed: string) {
  const o = orbOf(seed);
  return {
    hue: o.hue,
    lit: hex(o.lit),
    body: hex(o.body),
    deep: hex(o.deep),
    ink: hex(o.ink),
    print: `oklch(${fmt(o.body.l, 3)} ${fmt(o.body.c, 3)} ${fmt(o.body.h, 0)})`,
  };
}

/**
 * MAYA & JAY'S CROWD: the deck's one event, 31 guests in arrival order. The
 * host first (her own orb is the event's colour before anyone joins), then
 * the seven fixture guests every deck shares, then everyone else.
 */
const MORE = [
  "Ava",
  "Noah",
  "Zoe",
  "Kai",
  "Mila",
  "Leo",
  "Nia",
  "Ezra",
  "Ruby",
  "Arjun",
  "Hana",
  "Luca",
  "Amara",
  "Felix",
  "Yuki",
  "Rosa",
  "Dev",
  "Iris",
  "Mateo",
  "Elif",
  "Ben",
  "Chloe",
  "Tariq",
] as const;

export const HOST: Person = { name: PARTY.host, seed: PARTY.hostSeed };

export const CROWD: readonly Person[] = [
  HOST,
  ...GUESTS.slice(1).map((g) => ({ name: g.name, seed: g.seed })),
  ...MORE.map((name, i) => ({
    name,
    seed: `guest-${name.toLowerCase()}-${30 + i}`,
  })),
];

/** A deterministic crowd of `n` for any other event, from its own seed. */
export function crowdFor(eventSeed: string, n: number): Person[] {
  return Array.from({ length: n }, (_, i) => ({
    name: `Guest ${i + 1}`,
    seed: `${eventSeed}:guest-${i}`,
  }));
}

/* ── the orb: one person ───────────────────────────────────────────────── */

/**
 * ONE PERSON, AS AN ORB: production's hashvatar (`mesh`), unchanged, at any
 * size. `ring` parts it from a neighbour with the ground's own colour (the
 * guest row's rule), `initial` sets their letter in the orb's own ink (a face
 * chip), and `lit` adds the light edge, one pixel of light on its top bevel.
 */
export function Orb({
  seed,
  size,
  initial,
  ring,
  ringColor,
  lit = false,
  className,
  style,
  title,
}: {
  seed: string;
  size: number;
  initial?: string;
  ring?: number;
  ringColor?: string;
  lit?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  const o = useMemo(() => orbOf(seed), [seed]);
  const shadows: string[] = [];
  if (lit) shadows.push(`inset 0 ${Math.max(1, size * 0.012)}px 0 rgb(255 255 255 / 0.28)`);
  if (ring) shadows.push(`0 0 0 ${ring}px ${ringColor ?? "transparent"}`);
  return (
    <div
      data-ev-orb={seed}
      title={title}
      className={cn("ev-orb", className)}
      style={{
        width: size,
        height: size,
        backgroundImage: background(o, "mesh"),
        backgroundBlendMode: blendMode("mesh"),
        boxShadow: shadows.length ? shadows.join(", ") : undefined,
        color: hex(o.ink),
        fontSize: Math.round(size * 0.42),
        ...style,
      }}
    >
      {initial}
    </div>
  );
}

/* ── the row: who is here ──────────────────────────────────────────────── */

/**
 * THE ROW (production's guest row, promoted): faces in arrival order,
 * overlapping by a quarter and parted by the ground's ring, the newest last.
 * Past `max`, the rest is a count, which is a number, never an orb: a count is
 * not a person. `pop` lets the newest arrive on a loop (the motion slide, and
 * a touchpoint whose row is live: the reel's makers, the share card).
 */
export function GuestRow({
  people,
  size = 32,
  max = 8,
  total,
  tone = "paper",
  initials = true,
  pop = false,
  className,
}: {
  people: readonly Person[];
  size?: number;
  max?: number;
  /** The whole crowd's count, when only some are drawn. */
  total?: number;
  tone?: Tone;
  initials?: boolean;
  pop?: boolean;
  className?: string;
}) {
  const shown = people.slice(0, max);
  const rest = (total ?? people.length) - shown.length;
  const ring = Math.max(2, Math.round(size * 0.07));
  const ground = ON[tone].ground;
  return (
    <div
      className={cn("ev-row", className)}
      style={{ ["--ev-row-overlap" as string]: `${-Math.round(size * 0.25)}px` }}
    >
      {shown.map((p, i) => (
        <Orb
          key={p.seed}
          seed={p.seed}
          size={size}
          ring={ring}
          ringColor={ground}
          initial={initials ? p.name.slice(0, 1) : undefined}
          className={cn(pop && i === shown.length - 1 && "ev-pop-loop")}
          style={{ zIndex: shown.length - i }}
          title={p.name}
        />
      ))}
      {rest > 0 && (
        <span
          className={cn("ev-count", pop && "ev-make-room")}
          style={{
            height: size,
            minWidth: size,
            fontSize: Math.round(size * 0.36),
            // The last face covers the chip's first quarter-face, so the count
            // starts after it: otherwise the plus sign sits under a person.
            paddingLeft: Math.round(size * 0.25 + size * 0.36 * 0.5),
            paddingRight: Math.round(size * 0.36 * 0.6),
            boxShadow: `0 0 0 ${ring}px ${ground}`,
            backgroundColor: ON[tone].step,
            color: ON[tone].ink,
            ["--ev-shift" as string]: `${Math.round(size * 0.75)}px`,
          }}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}

/* ── the mix: an event's colour, as its people ─────────────────────────── */

export type Spot = {
  readonly seed: string;
  readonly name: string;
  readonly i: number;
  /** Centre, in the box's px. */
  readonly x: number;
  readonly y: number;
  /** Diameter, px. */
  readonly d: number;
};

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/**
 * THE HUDDLE: an event's mix as a cluster that grows from the host outward in
 * arrival order (a golden-angle spiral, then relaxed so no two people touch).
 * Deterministic, so an event's mix is the same picture every time it is drawn,
 * and a new guest only adds to its edge.
 */
export function huddle(
  people: readonly Person[],
  {
    w,
    h,
    gap = 0.1,
    host = 1.35,
    vary = 0.42,
    pad = 0,
  }: {
    w: number;
    h: number;
    /** Space between two people, as a share of the base size. */
    gap?: number;
    /** The host's size against everyone else's. */
    host?: number;
    /** How much sizes differ, 0 (all equal) to 1. */
    vary?: number;
    pad?: number;
  },
): Spot[] {
  const n = people.length;
  if (!n) return [];
  const r = seedsFrom(`huddle:${people.map((p) => p.seed).join("|")}`, n);
  const aspect = w / h;
  const pts = people.map((p, i) => {
    const t = n > 1 ? i / (n - 1) : 0;
    const d =
      i === 0 ? host : (1 - vary + vary * r[i]) * (1 - 0.18 * t);
    const a = i * GOLDEN + 0.6;
    const rr = 0.62 * Math.sqrt(i);
    return {
      seed: p.seed,
      name: p.name,
      i,
      d,
      x: Math.cos(a) * rr * Math.sqrt(aspect),
      y: Math.sin(a) * rr / Math.sqrt(aspect),
    };
  });
  const gx = aspect >= 1 ? 0.006 / aspect : 0.006;
  const gy = aspect >= 1 ? 0.006 : 0.006 * aspect;
  for (let k = 0; k < 160; k++) {
    for (let a = 0; a < n; a++)
      for (let b = a + 1; b < n; b++) {
        const p = pts[a];
        const q = pts[b];
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const min = (p.d + q.d) / 2 + gap;
        if (dist < min) {
          const push = (min - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;
          if (a !== 0) {
            p.x -= ux * push;
            p.y -= uy * push;
          }
          q.x += ux * push * (a === 0 ? 2 : 1);
          q.y += uy * push * (a === 0 ? 2 : 1);
        }
      }
    for (let a = 1; a < n; a++) {
      pts[a].x *= 1 - gx;
      pts[a].y *= 1 - gy;
    }
  }
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const p of pts) {
    x0 = Math.min(x0, p.x - p.d / 2);
    x1 = Math.max(x1, p.x + p.d / 2);
    y0 = Math.min(y0, p.y - p.d / 2);
    y1 = Math.max(y1, p.y + p.d / 2);
  }
  const s = Math.min((w - pad * 2) / (x1 - x0), (h - pad * 2) / (y1 - y0));
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return pts.map((p) => ({
    ...p,
    x: w / 2 + (p.x - cx) * s,
    y: h / 2 + (p.y - cy) * s,
    d: p.d * s,
  }));
}

/**
 * THE CROWD: the mix as people stand at an event, in rows, the back row
 * smaller and higher, the front larger and lower, each face parted from the
 * one behind it by the ground's ring. `crop` lets the front row sink below
 * the box's bottom edge (a crowd rising into frame).
 */
export function crowdRows(
  people: readonly Person[],
  {
    w,
    h,
    rows = 4,
    front,
    depth = 0.5,
    crop = 0.3,
    spread = 1.08,
  }: {
    w: number;
    h: number;
    rows?: number;
    /** The front row's diameter, px. */
    front: number;
    /** The back row's size as a share of the front's. */
    depth?: number;
    /** How much of the front row sinks below the bottom edge. */
    crop?: number;
    /** Spacing between neighbours, as a multiple of their diameter. */
    spread?: number;
  },
): Spot[] {
  const r = seedsFrom(`crowd:${people.length}:${w}`, people.length * 2);
  const out: Spot[] = [];
  let k = 0;
  let y = h + front * crop - front / 2;
  for (let row = rows - 1; row >= 0 && k < people.length; row--) {
    const t = rows > 1 ? row / (rows - 1) : 1;
    const d = front * (depth + (1 - depth) * t);
    const step = d * spread;
    const cap = Math.max(1, Math.floor(w / step));
    const m = Math.min(cap, people.length - k);
    const offset = (row % 2) * step * 0.5;
    const width = (m - 1) * step;
    const start = (w - width) / 2 + (m < cap ? 0 : offset - step * 0.25);
    for (let j = 0; j < m; j++, k++) {
      const p = people[k];
      const jx = (r[k * 2] - 0.5) * d * 0.18;
      const jy = (r[k * 2 + 1] - 0.5) * d * 0.14;
      out.push({
        seed: p.seed,
        name: p.name,
        i: k,
        x: start + j * step + jx,
        y: y + jy,
        d: d * (0.94 + r[k * 2 + 1] * 0.12),
      });
    }
    y -= d * 0.62;
  }
  return out;
}

/**
 * THE TOSS: the crowd thrown once, at a moment worth it (the first photo, the
 * develop morning, the reel), from where it happened. Confetti made of people:
 * one piece per guest, so it can be counted.
 */
export function toss(
  people: readonly Person[],
  {
    w,
    h,
    ox,
    oy,
    min = 10,
    max = 30,
    reach = 1,
  }: {
    w: number;
    h: number;
    ox: number;
    oy: number;
    min?: number;
    max?: number;
    reach?: number;
  },
): Spot[] {
  const n = people.length;
  const r = seedsFrom(`toss:${n}`, n * 3);
  // Stratified angles across an upward fan (so nobody lands on anybody),
  // distances in a band (so it reads as a burst, not a heap), sizes falling
  // a little with distance (the far ones are further away).
  return people.map((p, i) => {
    const slot = (i + 0.15 + 0.7 * r[i * 3]) / n;
    const a = -Math.PI * (0.06 + 0.88 * slot);
    const band = 0.66 + 0.34 * r[i * 3 + 1];
    const dist = band * reach;
    const d = min + (max - min) * (0.35 + 0.65 * r[i * 3 + 2]) * (1.15 - 0.3 * band);
    return {
      seed: p.seed,
      name: p.name,
      i,
      x: ox + Math.cos(a) * dist * w * 0.5,
      y: oy + Math.sin(a) * dist * h * 0.92,
      d,
    };
  });
}

/** Draws placed people (a huddle, a crowd, a toss) into a box. */
export function Placed({
  spots,
  w,
  h,
  ring,
  ringColor,
  initials = false,
  className,
  style,
  orbClass,
  stagger,
  origin,
}: {
  spots: readonly Spot[];
  w: number;
  h: number;
  /** Ring width as a share of each diameter (parts overlapping people). */
  ring?: number;
  ringColor?: string;
  initials?: boolean;
  className?: string;
  style?: CSSProperties;
  /** A class each orb wears (a motion), with `--ev-i` set to its order. */
  orbClass?: string;
  /** Delay between two people's motion, ms. */
  stagger?: number;
  /** Where a toss is thrown from: each orb gets `--ev-dx/dy` back to it. */
  origin?: { x: number; y: number };
}) {
  return (
    <div
      className={cn("ev-placed", className)}
      style={{ position: "relative", width: w, height: h, ...style }}
      aria-hidden
    >
      {spots.map((s) => (
        <Orb
          key={`${s.seed}-${s.i}`}
          seed={s.seed}
          size={s.d}
          ring={ring ? Math.max(1.5, s.d * ring) : undefined}
          ringColor={ringColor}
          initial={initials ? s.name.slice(0, 1) : undefined}
          className={orbClass}
          style={{
            position: "absolute",
            left: s.x - s.d / 2,
            top: s.y - s.d / 2,
            zIndex: Math.round(s.y),
            ["--ev-i" as string]: s.i,
            ["--ev-stagger" as string]: `${stagger ?? 0}ms`,
            ["--ev-dx" as string]: origin ? `${origin.x - s.x}px` : undefined,
            ["--ev-dy" as string]: origin ? `${origin.y - s.y}px` : undefined,
          }}
        />
      ))}
    </div>
  );
}

/** The toss, measured and drawn in one call (thrown from `ox, oy`). */
export function Toss({
  people,
  w,
  h,
  ox,
  oy,
  min,
  max,
  reach,
  loop = false,
  className,
  style,
}: {
  people: readonly Person[];
  w: number;
  h: number;
  ox: number;
  oy: number;
  min?: number;
  max?: number;
  reach?: number;
  /** Throw again and again (a motion demo) rather than once on arrival. */
  loop?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const spots = useMemo(
    () => toss(people, { w, h, ox, oy, min, max, reach }),
    [people, w, h, ox, oy, min, max, reach],
  );
  return (
    <Placed
      spots={spots}
      w={w}
      h={h}
      origin={{ x: ox, y: oy }}
      orbClass={loop ? "ev-toss-loop" : "ev-tossed"}
      stagger={loop ? 18 : 22}
      className={className}
      style={style}
    />
  );
}

/** The huddle, measured and drawn in one call. */
export function Mix({
  people,
  w,
  h,
  tone = "paper",
  gap,
  host,
  vary,
  pad,
  className,
  style,
  orbClass,
  stagger,
}: {
  people: readonly Person[];
  w: number;
  h: number;
  tone?: Tone;
  gap?: number;
  host?: number;
  vary?: number;
  pad?: number;
  className?: string;
  style?: CSSProperties;
  orbClass?: string;
  stagger?: number;
}) {
  const spots = useMemo(
    () => huddle(people, { w, h, gap, host, vary, pad }),
    [people, w, h, gap, host, vary, pad],
  );
  return (
    <Placed
      spots={spots}
      w={w}
      h={h}
      ringColor={ON[tone].ground}
      className={className}
      style={style}
      orbClass={orbClass}
      stagger={stagger}
    />
  );
}

/** The crowd rows, measured and drawn in one call. */
export function Crowd({
  people,
  w,
  h,
  front,
  rows,
  depth,
  crop,
  spread,
  tone = "paper",
  className,
  style,
}: {
  people: readonly Person[];
  w: number;
  h: number;
  front: number;
  rows?: number;
  depth?: number;
  crop?: number;
  spread?: number;
  tone?: Tone;
  className?: string;
  style?: CSSProperties;
}) {
  const spots = useMemo(
    () => crowdRows(people, { w, h, front, rows, depth, crop, spread }),
    [people, w, h, front, rows, depth, crop, spread],
  );
  return (
    <Placed
      spots={spots}
      w={w}
      h={h}
      ring={0.06}
      ringColor={ON[tone].ground}
      className={className}
      style={style}
    />
  );
}

/* ── a credit: a person's colour beside their photograph ───────────────── */

/**
 * A CREDIT: a face and a name, small. The one way a person's colour meets a
 * photograph: beside it, or in its corner on the photograph's own scrim, never
 * as a wash, a frame or a light on the picture.
 */
export function Credit({
  person,
  size = 20,
  tone = "paper",
  onPhoto = false,
  className,
}: {
  person: Person;
  size?: number;
  tone?: Tone;
  onPhoto?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("ev-credit", onPhoto && "ev-credit-photo", className)}
      style={{
        gap: Math.round(size * 0.35),
        fontSize: Math.max(12, Math.round(size * 0.62)),
        color: onPhoto ? BASE.white.hex : ON[tone].ink,
      }}
    >
      <Orb
        seed={person.seed}
        size={size}
        initial={size >= 18 ? person.name.slice(0, 1) : undefined}
      />
      <span>{person.name}</span>
    </span>
  );
}

/* ── the add button: its ring is everyone here ─────────────────────────── */

/**
 * THE ADD BUTTON, ITS RING MADE OF EVERYONE HERE: production's shutter ring
 * (the touch Will liked most) re-cut as one arc per guest in their own lit
 * colour, so the button that adds to the album wears the album's people.
 * One guest is a whole ring. Sending would fill it in the sender's colour
 * (an application decision, not drawn here).
 */
export function AddRing({
  people,
  size = 60,
  ground,
}: {
  people: readonly Person[];
  size?: number;
  /** The ground the button sits on (the ring's gaps are cut in it). */
  ground: string;
}) {
  const n = Math.max(1, people.length);
  const r = size / 2 + 5;
  const c = size / 2 + 8;
  const arcs = useMemo(() => {
    const gap = n > 1 ? Math.min(0.12, (Math.PI * 2) / n / 3) : 0;
    return people.map((p, i) => {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2 + gap / 2;
      const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2 - gap / 2;
      const x0 = c + r * Math.cos(a0);
      const y0 = c + r * Math.sin(a0);
      const x1 = c + r * Math.cos(a1);
      const y1 = c + r * Math.sin(a1);
      const large = a1 - a0 > Math.PI ? 1 : 0;
      return {
        d: n === 1 ? "" : `M${x0} ${y0}A${r} ${r} 0 ${large} 1 ${x1} ${y1}`,
        color: colorsOf(p.seed).lit,
        seed: p.seed,
      };
    });
  }, [people, n, r, c]);
  return (
    <div className="relative" style={{ width: c * 2, height: c * 2 }}>
      <svg width={c * 2} height={c * 2} className="absolute inset-0" aria-hidden>
        {n === 1 ? (
          <circle cx={c} cy={c} r={r} fill="none" stroke={arcs[0].color} strokeWidth={3} />
        ) : (
          arcs.map((a) => (
            <path key={a.seed} d={a.d} fill="none" stroke={a.color} strokeWidth={3} strokeLinecap="butt" />
          ))
        )}
      </svg>
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: 8,
          top: 8,
          width: size,
          height: size,
          borderRadius: 9999,
          backgroundColor: BASE.roomInk.hex,
          color: BASE.ink.hex,
          boxShadow: `0 0 0 2px ${ground}`,
        }}
      >
        <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 12 12" aria-hidden>
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

/* ── a phone, for screens drawn inside a slide ─────────────────────────── */

/**
 * A PHONE, DRAWN: a near-black body, its screen at the ground the screen
 * wears. Sized by its screen's width; the height follows a 19.5:9 phone.
 */
export function PhoneShell({
  width,
  height,
  tone = "paper",
  children,
  className,
  style,
}: {
  width: number;
  height?: number;
  tone?: Tone;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const h = height ?? Math.round(width * 2.165);
  const bezel = Math.max(5, Math.round(width * 0.03));
  const radius = Math.round(width * 0.15);
  return (
    <div
      className={cn("ev-phone", className)}
      style={{
        width: width + bezel * 2,
        height: h + bezel * 2,
        padding: bezel,
        borderRadius: radius + bezel,
        ...style,
      }}
    >
      <div
        className="ev-phone-screen"
        style={{
          width,
          height: h,
          borderRadius: radius,
          backgroundColor: ON[tone].ground,
          color: ON[tone].ink,
        }}
      >
        <div
          className="ev-phone-island"
          style={{
            width: width * 0.3,
            height: width * 0.085,
            top: width * 0.03,
          }}
        />
        {children}
      </div>
    </div>
  );
}
