import type { Ground } from "@/components/dev/board";

/**
 * THE PALETTE BOARD'S DATA: four complete token sets (today plus three
 * candidates), the accent options, and the printable block the ruling pastes.
 *
 * WHY the shape. A candidate is not a swatch row, it is a whole system: the
 * light block, the dark block, the ink leaf, the gallery canvas and the cinema
 * ground, so a ruling is "ramp B" and the Orchestrator pastes four blocks into
 * globals.css. Values are kept as CSS strings so the board renders the exact
 * text that ships; `lOf` reads the lightness back out for the ladder labels
 * (including the color-mix veils candidate B derives its surfaces from), so no
 * number is written down twice and the swatch can never drift from the block.
 *
 * The facts these were built against (verified at 51f40e3, see
 * docs/tracks/palette.md): the light ramp holds a 0.455 hole between 0.45 and
 * 0.905 and crushes five surfaces into 0.96 to 0.997; the dark ramp crushes
 * four semantic surfaces into 0.14 to 0.25; three darks ship (cinema 0.11, the
 * app 0.14, gallery 0.155); `--brand` aliases ink in all three sets.
 */

export type TokenMap = Record<string, string>;
export type RampId = "today" | "a" | "b" | "c";

export type Ramp = {
  id: RampId;
  /** The toggle's label. */
  label: string;
  /** The name on the board, with its thesis in one line. */
  name: string;
  thesis: string;
  /** The moves it makes, one line each; read as the candidate's case. */
  moves: string[];
  /** What it costs, said out loud. */
  trade: string;
  /** The `:root, .surface-paper` block. */
  light: TokenMap;
  /** The `.dark` block. */
  dark: TokenMap;
  /** The `.surface-ink` block (the footer's leaf set). */
  ink: TokenMap;
  /** The always-dark media canvas, shared by both modes. */
  gallery: TokenMap;
  /** The cinema skin's one override in marketing.css. */
  cinemaBackground: string;
};

/* ── The ramps ──────────────────────────────────────────────────────────── */

const TODAY: Ramp = {
  id: "today",
  label: "Today",
  name: "Today",
  thesis:
    "Twenty-one hand-picked values with no ladder behind them: the light middle is empty, the dark surfaces are crushed, and the panel is an alpha of a token that also does hover.",
  moves: [
    "Light: five surfaces inside 0.96 to 0.997, so a card is its hairline and nothing else.",
    "Dark: card, popover, muted, secondary and accent all land between 0.21 and 0.25.",
    "Nothing between 0.45 and 0.905, so 37 call sites dim text with an alpha instead.",
    "Three darks (cinema 0.11, the app 0.14, gallery 0.155) with no stated reason.",
  ],
  trade: "It ships, and every surface question is answered with a hairline.",
  light: {
    "--background": "oklch(0.99 0 0)",
    "--foreground": "oklch(0.13 0 0)",
    "--card": "oklch(0.997 0 0)",
    "--card-foreground": "oklch(0.13 0 0)",
    "--popover": "oklch(0.997 0 0)",
    "--popover-foreground": "oklch(0.13 0 0)",
    "--primary": "oklch(0.13 0 0)",
    "--primary-foreground": "oklch(0.99 0 0)",
    "--secondary": "oklch(0.96 0 0)",
    "--secondary-foreground": "oklch(0.13 0 0)",
    "--muted": "oklch(0.965 0 0)",
    "--muted-foreground": "oklch(0.45 0 0)",
    "--accent": "oklch(0.96 0 0)",
    "--accent-foreground": "oklch(0.13 0 0)",
    "--border": "oklch(0.905 0 0)",
    "--input": "oklch(0.905 0 0)",
    "--ring": "oklch(0.3 0 0)",
  },
  dark: {
    "--background": "oklch(0.14 0 0)",
    "--foreground": "oklch(0.96 0 0)",
    "--card": "oklch(0.21 0 0 / 0.62)",
    "--card-foreground": "oklch(0.96 0 0)",
    "--popover": "oklch(0.23 0 0)",
    "--popover-foreground": "oklch(0.96 0 0)",
    "--primary": "oklch(0.96 0 0)",
    "--primary-foreground": "oklch(0.15 0 0)",
    "--secondary": "oklch(0.25 0 0)",
    "--secondary-foreground": "oklch(0.96 0 0)",
    "--muted": "oklch(0.245 0 0)",
    "--muted-foreground": "oklch(0.71 0 0)",
    "--accent": "oklch(0.25 0 0)",
    "--accent-foreground": "oklch(0.96 0 0)",
    "--border": "oklch(1 0 0 / 12%)",
    "--input": "oklch(1 0 0 / 15%)",
    "--ring": "oklch(0.85 0 0)",
  },
  // As shipped: no --card, --popover, --secondary, --accent or --input, which is
  // why a Card inside the ink footer renders with the PAPER card colour.
  ink: {
    "--background": "var(--gallery)",
    "--foreground": "var(--gallery-foreground)",
    "--card-foreground": "var(--gallery-foreground)",
    "--border": "var(--gallery-border)",
    "--muted":
      "color-mix(in oklab, var(--gallery) 85%, var(--gallery-foreground))",
    "--muted-foreground": "var(--gallery-muted)",
    "--ring": "var(--gallery-foreground)",
    "--primary": "var(--gallery-foreground)",
    "--primary-foreground": "var(--gallery)",
    "--shadow-float": "0 0 0 0 oklch(0 0 0 / 0)",
  },
  gallery: {
    "--gallery": "oklch(0.155 0 0)",
    "--gallery-foreground": "oklch(0.97 0 0)",
    "--gallery-muted": "oklch(0.62 0 0)",
    "--gallery-border": "oklch(1 0 0 / 8%)",
  },
  cinemaBackground: "oklch(0.11 0 0)",
};

const A: Ramp = {
  id: "a",
  label: "A",
  name: "A. One ladder",
  thesis:
    "Keep the philosophy, fix the spacing: one achromatic ladder, read down from paper in light and up from the room in dark, with every token sitting on a step instead of near one.",
  moves: [
    "The light ground drops to 0.977 so the card at 0.998 lifts off it; the panel sinks to 0.948 and the hover fill separates at 0.925.",
    "Dark gets real steps of about 0.045: room 0.145, panel 0.195, card 0.235, menu 0.285, hover 0.325, and the card goes opaque.",
    "One new token fills the hole: --faint at 0.62 light and 0.55 dark, which is exactly what the 20 text-muted-foreground/70 sites already composite to.",
    "Three darks stay and become three steps of one ladder (cinema 0.105, the app 0.145, ink 0.185); the media canvas leaves the ink family and goes deeper, to 0.09.",
  ],
  trade:
    "The paper body is a real paper grey rather than near white, and the cinema-to-ink seam at the footer widens from 0.045 to 0.08.",
  light: {
    "--background": "oklch(0.977 0 0)",
    "--foreground": "oklch(0.145 0 0)",
    "--card": "oklch(0.998 0 0)",
    "--card-foreground": "oklch(0.145 0 0)",
    "--popover": "oklch(0.998 0 0)",
    "--popover-foreground": "oklch(0.145 0 0)",
    "--primary": "oklch(0.145 0 0)",
    "--primary-foreground": "oklch(0.998 0 0)",
    "--secondary": "oklch(0.925 0 0)",
    "--secondary-foreground": "oklch(0.145 0 0)",
    "--muted": "oklch(0.948 0 0)",
    "--muted-foreground": "oklch(0.46 0 0)",
    "--faint": "oklch(0.62 0 0)",
    "--accent": "oklch(0.925 0 0)",
    "--accent-foreground": "oklch(0.145 0 0)",
    "--border": "oklch(0.89 0 0)",
    "--input": "oklch(0.89 0 0)",
    "--ring": "oklch(0.3 0 0)",
  },
  dark: {
    "--background": "oklch(0.145 0 0)",
    "--foreground": "oklch(0.955 0 0)",
    "--card": "oklch(0.235 0 0)",
    "--card-foreground": "oklch(0.955 0 0)",
    "--popover": "oklch(0.285 0 0)",
    "--popover-foreground": "oklch(0.955 0 0)",
    "--primary": "oklch(0.955 0 0)",
    "--primary-foreground": "oklch(0.145 0 0)",
    "--secondary": "oklch(0.325 0 0)",
    "--secondary-foreground": "oklch(0.955 0 0)",
    "--muted": "oklch(0.195 0 0)",
    "--muted-foreground": "oklch(0.7 0 0)",
    "--faint": "oklch(0.55 0 0)",
    "--accent": "oklch(0.325 0 0)",
    "--accent-foreground": "oklch(0.955 0 0)",
    "--border": "oklch(1 0 0 / 12%)",
    "--input": "oklch(1 0 0 / 16%)",
    "--ring": "oklch(0.85 0 0)",
  },
  // Complete, so an ink leaf can host a Card and a menu (today it cannot).
  ink: {
    "--background": "oklch(0.185 0 0)",
    "--foreground": "oklch(0.965 0 0)",
    "--card": "oklch(0.235 0 0)",
    "--card-foreground": "oklch(0.965 0 0)",
    "--popover": "oklch(0.285 0 0)",
    "--popover-foreground": "oklch(0.965 0 0)",
    "--secondary": "oklch(0.325 0 0)",
    "--secondary-foreground": "oklch(0.965 0 0)",
    "--accent": "oklch(0.325 0 0)",
    "--accent-foreground": "oklch(0.965 0 0)",
    "--muted": "oklch(0.235 0 0)",
    "--muted-foreground": "oklch(0.7 0 0)",
    "--faint": "oklch(0.55 0 0)",
    "--border": "oklch(1 0 0 / 10%)",
    "--input": "oklch(1 0 0 / 14%)",
    "--ring": "oklch(0.965 0 0)",
    "--primary": "oklch(0.965 0 0)",
    "--primary-foreground": "oklch(0.185 0 0)",
    "--shadow-float": "0 0 0 0 oklch(0 0 0 / 0)",
  },
  gallery: {
    "--gallery": "oklch(0.09 0 0)",
    "--gallery-foreground": "oklch(0.965 0 0)",
    "--gallery-muted": "oklch(0.62 0 0)",
    "--gallery-border": "oklch(1 0 0 / 8%)",
  },
  cinemaBackground: "oklch(0.105 0 0)",
};

/** Candidate B derives every surface from the room, so the mix is the value. */
const inkVeil = (pct: number) =>
  `color-mix(in oklab, var(--foreground) ${pct}%, var(--background))`;

const B: Ramp = {
  id: "b",
  label: "B",
  name: "B. One room",
  thesis:
    "Stop picking greys. One room per mode and every other surface derived from it by a veil, so there is one number to tune and the ladder can never drift: in light the card is the paper and line lifts it, in dark the card is light on the room.",
  moves: [
    "One dark ground for everything: cinema, the app, the footer and the media canvas are all 0.125, and the cinema override in marketing.css is deleted.",
    "Every surface is color-mix off the room: panel 7 percent, card 12, menu 18, hover 22, so retuning the ramp is one value.",
    "In light the card stops pretending: it is the paper at 0.99 and its ring is the lift, while the floating layer is the one thing brighter than the page.",
    "--faint arrives as a veil too (45 percent of the ink), which retires the 37 alpha-dimmed text sites.",
  ],
  trade:
    "Cinema loses its deeper room, so a dark chapter sits 0.015 lighter and the footer stops being a separate value, which hands the seam to light rather than to colour.",
  light: {
    "--background": "oklch(0.99 0 0)",
    "--foreground": "oklch(0.14 0 0)",
    "--card": "oklch(0.99 0 0)",
    "--card-foreground": "oklch(0.14 0 0)",
    "--popover": "oklch(0.998 0 0)",
    "--popover-foreground": "oklch(0.14 0 0)",
    "--primary": "oklch(0.14 0 0)",
    "--primary-foreground": "oklch(0.99 0 0)",
    "--secondary": inkVeil(9),
    "--secondary-foreground": "oklch(0.14 0 0)",
    "--muted": inkVeil(5),
    "--muted-foreground": inkVeil(62),
    "--faint": inkVeil(45),
    "--accent": inkVeil(9),
    "--accent-foreground": "oklch(0.14 0 0)",
    "--border": inkVeil(13),
    "--input": inkVeil(17),
    "--ring": inkVeil(80),
  },
  dark: {
    "--background": "oklch(0.125 0 0)",
    "--foreground": "oklch(0.96 0 0)",
    "--card": inkVeil(12),
    "--card-foreground": "oklch(0.96 0 0)",
    "--popover": inkVeil(18),
    "--popover-foreground": "oklch(0.96 0 0)",
    "--primary": "oklch(0.96 0 0)",
    "--primary-foreground": "oklch(0.125 0 0)",
    "--secondary": inkVeil(22),
    "--secondary-foreground": "oklch(0.96 0 0)",
    "--muted": inkVeil(7),
    "--muted-foreground": inkVeil(68),
    "--faint": inkVeil(52),
    "--accent": inkVeil(22),
    "--accent-foreground": "oklch(0.96 0 0)",
    "--border": "oklch(1 0 0 / 12%)",
    "--input": "oklch(1 0 0 / 16%)",
    "--ring": inkVeil(85),
  },
  // B's punchline: ink is not a third thing. The leaf turns the room on.
  ink: {
    "--background": "oklch(0.125 0 0)",
    "--foreground": "oklch(0.96 0 0)",
    "--card": inkVeil(12),
    "--card-foreground": "oklch(0.96 0 0)",
    "--popover": inkVeil(18),
    "--popover-foreground": "oklch(0.96 0 0)",
    "--secondary": inkVeil(22),
    "--secondary-foreground": "oklch(0.96 0 0)",
    "--accent": inkVeil(22),
    "--accent-foreground": "oklch(0.96 0 0)",
    "--muted": inkVeil(7),
    "--muted-foreground": inkVeil(68),
    "--faint": inkVeil(52),
    "--border": "oklch(1 0 0 / 12%)",
    "--input": "oklch(1 0 0 / 16%)",
    "--ring": inkVeil(85),
    "--primary": "oklch(0.96 0 0)",
    "--primary-foreground": "oklch(0.125 0 0)",
    "--shadow-float": "0 0 0 0 oklch(0 0 0 / 0)",
  },
  gallery: {
    "--gallery": "oklch(0.125 0 0)",
    "--gallery-foreground": "oklch(0.96 0 0)",
    "--gallery-muted": "oklch(0.62 0 0)",
    "--gallery-border": "oklch(1 0 0 / 8%)",
  },
  cinemaBackground: "oklch(0.125 0 0)",
};

const C: Ramp = {
  id: "c",
  label: "C",
  name: "C. Film stock",
  thesis:
    "A's ladder with a temperature: paper is a warm white and the room is a warm black, at 0.003 to 0.008 chroma, because a pure grey is what a default looks like and a party is warm. Text stays neutral, so the ink still reads crisp on it.",
  moves: [
    "Light surfaces carry hue 85 at 0.003 to 0.007 chroma, rising with the surface; the foreground and every text step stay at chroma 0.",
    "Dark surfaces carry hue 60 at 0.005 to 0.008, a film black rather than a screen black, and the dark foreground is a warm white at 0.002.",
    "The spacing is A's exactly, so a ruling between A and C is a ruling on temperature alone and nothing else moves.",
    "The cool inversion (warm paper, cool night) was built and dropped: a cool room fights skin tones, and every photograph on this product has people in it.",
  ],
  trade:
    "It re-opens a decision globals.css records as closed (zero-chroma purity IS the brand point), and a warm ground very slightly warms how a photograph reads against it.",
  light: {
    "--background": "oklch(0.977 0.004 85)",
    "--foreground": "oklch(0.145 0 0)",
    "--card": "oklch(0.998 0.003 85)",
    "--card-foreground": "oklch(0.145 0 0)",
    "--popover": "oklch(0.998 0.003 85)",
    "--popover-foreground": "oklch(0.145 0 0)",
    "--primary": "oklch(0.145 0 0)",
    "--primary-foreground": "oklch(0.998 0.003 85)",
    "--secondary": "oklch(0.925 0.006 85)",
    "--secondary-foreground": "oklch(0.145 0 0)",
    "--muted": "oklch(0.948 0.005 85)",
    "--muted-foreground": "oklch(0.46 0 0)",
    "--faint": "oklch(0.62 0 0)",
    "--accent": "oklch(0.925 0.006 85)",
    "--accent-foreground": "oklch(0.145 0 0)",
    "--border": "oklch(0.89 0.007 85)",
    "--input": "oklch(0.89 0.007 85)",
    "--ring": "oklch(0.3 0 0)",
  },
  dark: {
    "--background": "oklch(0.145 0.005 60)",
    "--foreground": "oklch(0.955 0.002 85)",
    "--card": "oklch(0.235 0.006 60)",
    "--card-foreground": "oklch(0.955 0.002 85)",
    "--popover": "oklch(0.285 0.007 60)",
    "--popover-foreground": "oklch(0.955 0.002 85)",
    "--primary": "oklch(0.955 0.002 85)",
    "--primary-foreground": "oklch(0.145 0.005 60)",
    "--secondary": "oklch(0.325 0.008 60)",
    "--secondary-foreground": "oklch(0.955 0.002 85)",
    "--muted": "oklch(0.195 0.006 60)",
    "--muted-foreground": "oklch(0.7 0.004 70)",
    "--faint": "oklch(0.55 0.004 70)",
    "--accent": "oklch(0.325 0.008 60)",
    "--accent-foreground": "oklch(0.955 0.002 85)",
    "--border": "oklch(1 0 0 / 12%)",
    "--input": "oklch(1 0 0 / 16%)",
    "--ring": "oklch(0.85 0 0)",
  },
  ink: {
    "--background": "oklch(0.185 0.006 60)",
    "--foreground": "oklch(0.965 0.002 85)",
    "--card": "oklch(0.235 0.006 60)",
    "--card-foreground": "oklch(0.965 0.002 85)",
    "--popover": "oklch(0.285 0.007 60)",
    "--popover-foreground": "oklch(0.965 0.002 85)",
    "--secondary": "oklch(0.325 0.008 60)",
    "--secondary-foreground": "oklch(0.965 0.002 85)",
    "--accent": "oklch(0.325 0.008 60)",
    "--accent-foreground": "oklch(0.965 0.002 85)",
    "--muted": "oklch(0.235 0.006 60)",
    "--muted-foreground": "oklch(0.7 0.004 70)",
    "--faint": "oklch(0.55 0.004 70)",
    "--border": "oklch(1 0 0 / 10%)",
    "--input": "oklch(1 0 0 / 14%)",
    "--ring": "oklch(0.965 0.002 85)",
    "--primary": "oklch(0.965 0.002 85)",
    "--primary-foreground": "oklch(0.185 0.006 60)",
    "--shadow-float": "0 0 0 0 oklch(0 0 0 / 0)",
  },
  gallery: {
    "--gallery": "oklch(0.09 0.004 60)",
    "--gallery-foreground": "oklch(0.965 0.002 85)",
    "--gallery-muted": "oklch(0.62 0.004 70)",
    "--gallery-border": "oklch(1 0 0 / 8%)",
  },
  cinemaBackground: "oklch(0.105 0.004 60)",
};

export const RAMPS: Ramp[] = [TODAY, A, B, C];
export const RAMP_BY_ID: Record<RampId, Ramp> = {
  today: TODAY,
  a: A,
  b: B,
  c: C,
};

/* ── The dark card: as declared, opaque, or a veil ───────────────────────── */

/**
 * Today ships ONE translucent surface in the whole system (`--card` in `.dark`
 * at 0.62), and round one's departure list said only candidate B kept it. That
 * was wrong: B's card is a `color-mix` off the room, which is fully opaque, so
 * all three candidates retire the veil and none of them said so. Round two
 * makes it a choice instead of a side effect: every candidate renders at its
 * declared value, forced opaque, or forced to a veil at the same lightness, and
 * the specimen is a card lying over a photograph, which is the only place the
 * difference is a look rather than a number.
 */
export type CardMode = "declared" | "opaque" | "veil";

const stripAlpha = (v: string) => v.replace(/\s*\/\s*[\d.]+%?\s*\)$/, ")");

/** A token value at an alpha. An oklch literal takes the slash form; a veil
 *  built by color-mix cannot, so it is wrapped in a second mix instead. */
export function withAlpha(value: string, alpha: number): string {
  const lit = /^oklch\(([^/)]+)\)$/.exec(stripAlpha(value).trim());
  if (lit) return `oklch(${lit[1].trim()} / ${alpha})`;
  return `color-mix(in oklab, ${value} ${Math.round(alpha * 100)}%, transparent)`;
}

/** The ramp with the card question answered, which is what every renderer and
 *  the paste both read, so the board can never show one thing and paste another. */
export function resolveRamp(ramp: Ramp, mode: CardMode): Ramp {
  if (mode === "declared") return ramp;
  const fix = (m: TokenMap) => {
    const card = m["--card"];
    if (!card) return m;
    return {
      ...m,
      "--card": mode === "veil" ? withAlpha(card, 0.62) : stripAlpha(card),
    };
  };
  return { ...ramp, dark: fix(ramp.dark), ink: fix(ramp.ink) };
}

/* ── Applying a ramp to a stage ─────────────────────────────────────────── */

/**
 * The token overrides for one ground, as an inline style. Custom properties
 * are inherited and a declaration applies to the element it sits on, so a
 * wrapper carrying these plus `bg-background` repaints its whole subtree in
 * the candidate's colours while the Stage keeps the real `.dark` /
 * `.surface-paper` class the `dark:` variants need.
 *
 * Ink is deliberately layered on the LIGHT block: the footer's common case is a
 * leaf inside a paper page, and it is the case that exposes today's gap (no
 * --card in `.surface-ink`, so a Card in the footer renders near white).
 */
export function rampStyle(ramp: Ramp, ground: Ground): React.CSSProperties {
  const base =
    ground === "paper" || ground === "app-light"
      ? ramp.light
      : ground === "ink"
        ? { ...ramp.light, ...ramp.ink }
        : ramp.dark;
  return {
    ...ramp.gallery,
    ...base,
    ...(ground === "cinema" ? { "--background": ramp.cinemaBackground } : null),
  } as React.CSSProperties;
}

/* ── Reading a value back, for the ladder labels ─────────────────────────── */

const OKLCH = /^oklch\(\s*([\d.]+)/;
const MIX = /color-mix\(in oklab,\s*var\(--foreground\)\s*([\d.]+)%/;

/**
 * The lightness of a token value in a given block, or null when the string is
 * not a lightness at all. Handles the veil form, so candidate B's ladder reads
 * off the same strings it renders rather than a second copy of the numbers.
 *
 * A translucent value still HAS a lightness (today's dark card is 0.21 at 62
 * percent), so it is returned; `alphaOf` is the separate question, and the
 * ruler uses it to drop the white veils that have no fixed place on a line.
 */
export function lOf(value: string, block: TokenMap): number | null {
  const mix = MIX.exec(value);
  if (mix) {
    const pct = Number(mix[1]) / 100;
    const fg = lOf(block["--foreground"] ?? "", block);
    const bg = lOf(block["--background"] ?? "", block);
    if (fg === null || bg === null) return null;
    return fg * pct + bg * (1 - pct);
  }
  const hit = OKLCH.exec(value);
  return hit ? Number(hit[1]) : null;
}

const ALPHA = /\/\s*([\d.]+)(%?)\s*\)/;

/** The alpha of a token value as a fraction, or null when it is opaque. */
export function alphaOf(value: string): number | null {
  const hit = ALPHA.exec(value);
  if (!hit) return null;
  const n = Number(hit[1]);
  return hit[2] === "%" ? n / 100 : n;
}

/** The surface ladder a mode is judged on, in stacking order. */
export const LIGHT_LADDER = [
  { token: "--popover", role: "menu" },
  { token: "--card", role: "card" },
  { token: "--background", role: "the page" },
  { token: "--muted", role: "the panel" },
  { token: "--secondary", role: "hover fill" },
  { token: "--border", role: "hairline" },
  { token: "--faint", role: "faint text" },
  { token: "--muted-foreground", role: "second text" },
  { token: "--foreground", role: "text" },
];

export const DARK_LADDER = [
  { token: "--background", role: "the room" },
  { token: "--muted", role: "the panel" },
  { token: "--card", role: "card" },
  { token: "--popover", role: "menu" },
  { token: "--secondary", role: "hover fill" },
  { token: "--faint", role: "faint text" },
  { token: "--muted-foreground", role: "second text" },
  { token: "--foreground", role: "text" },
];

/** The three darks plus the media canvas, for the rooms row. */
export function rooms(ramp: Ramp) {
  return [
    { name: "cinema", value: ramp.cinemaBackground },
    { name: "the app", value: ramp.dark["--background"] },
    {
      name: "ink",
      value:
        ramp.ink["--background"] === "var(--gallery)"
          ? ramp.gallery["--gallery"]
          : ramp.ink["--background"],
    },
    { name: "the canvas", value: ramp.gallery["--gallery"] },
  ];
}

/* ── The accent ─────────────────────────────────────────────────────────── */

export type AccentId = "ink" | "blue" | "violet" | "flare";

export type Accent = {
  id: AccentId;
  label: string;
  name: string;
  /** The case for it, one line. */
  why: string;
  /** What it costs, one line. */
  risk: string;
  light: string;
  lightForeground: string;
  dark: string;
  darkForeground: string;
};

export const ACCENTS: Accent[] = [
  {
    id: "ink",
    label: "Ink",
    name: "Ink (today)",
    why: "The brand token aliases the primary, so the mark, the badge and every wireframe frame are the same near-black as the type. Nothing can clash because nothing is coloured.",
    risk: "A section with no photograph in it has no colour at all, which is the binary rule 1 was rewritten to kill.",
    light: "oklch(0.145 0 0)",
    lightForeground: "oklch(0.998 0 0)",
    dark: "oklch(0.955 0 0)",
    darkForeground: "oklch(0.145 0 0)",
  },
  {
    id: "blue",
    label: "Blue 252",
    name: "Blue, hue 252",
    why: "Already in the system as --save, so promoting it adds no hue: one blue means save, download and Partyreel.",
    risk: "It is the default accent of every product on the internet, and the save affordance loses the one hue that made it recognisable.",
    light: "oklch(0.55 0.17 252)",
    lightForeground: "oklch(0.99 0 0)",
    dark: "oklch(0.72 0.15 252)",
    darkForeground: "oklch(0.15 0 0)",
  },
  {
    id: "violet",
    label: "Violet 300",
    name: "Violet, hue 300",
    why: "Already in the system as --reel, the host's add-to-the-highlight-reel signal. The product is named for the reel, so the accent and the signature moment become one hue.",
    risk: "The reel icon stops being special once everything else is violet too, and violet at small sizes is 30 degrees from the new hue below.",
    light: "oklch(0.58 0.2 300)",
    lightForeground: "oklch(0.99 0 0)",
    dark: "oklch(0.72 0.18 300)",
    darkForeground: "oklch(0.15 0 0)",
  },
  {
    id: "flare",
    label: "Flare 330",
    name: "Flare, hue 330 (new)",
    why: "The one warm gap left on the wheel: 45 degrees off --like, 30 off --reel, and nowhere near a state colour. It reads as a party rather than as software, and it is the only option that is ours alone.",
    risk: "A new hue to hold, and at a 6px dot it has to stay distinguishable from --reel violet, which is why it sits on the warm side of magenta.",
    light: "oklch(0.58 0.22 330)",
    lightForeground: "oklch(0.99 0 0)",
    dark: "oklch(0.7 0.2 330)",
    darkForeground: "oklch(0.15 0 0)",
  },
];

export const ACCENT_BY_ID = Object.fromEntries(
  ACCENTS.map((a) => [a.id, a]),
) as Record<AccentId, Accent>;

/** `--brand` plus its foreground, which is the whole accent change: 28 utility
 *  hits across roughly 24 surfaces read these two tokens and nothing else. */
export function accentStyle(
  accent: Accent,
  dark: boolean,
): React.CSSProperties {
  return {
    "--brand": dark ? accent.dark : accent.light,
    "--brand-foreground": dark ? accent.darkForeground : accent.lightForeground,
  } as React.CSSProperties;
}

/** The state hues, so the accent is always judged against what it must not
 *  collide with (globals.css lines 174 to 186 and 266 to 274). */
export const STATE_HUES = [
  { token: "--like", name: "like", hue: 15 },
  { token: "--destructive", name: "destructive", hue: 27 },
  { token: "--warning", name: "warning", hue: 80 },
  { token: "--success", name: "success", hue: 150 },
  { token: "--save", name: "save", hue: 252 },
  { token: "--reel", name: "reel", hue: 300 },
];

/* ── The panel ──────────────────────────────────────────────────────────── */

/** Every alpha the set-apart panel ships at today, with its count in src. */
export const PANEL_ALPHAS = [
  { alpha: 20, uses: 2 },
  { alpha: 30, uses: 4 },
  { alpha: 40, uses: 19 },
  { alpha: 50, uses: 12 },
  { alpha: 60, uses: 6 },
  { alpha: 70, uses: 2 },
];

/* ── The five grounds, and the two jobs one token is doing ──────────────── */

/**
 * ROUND TWO SHARPENS THE FINDING, and the sharpening changes it.
 *
 * Round one said `--gallery` was doing two jobs, "a lightbox and a footer
 * slab". Re-read at ca952b5, the lightbox is not one of them: it paints its
 * backdrop with a literal `bg-black/90` (media-lightbox.tsx's DialogOverlay),
 * so the deepest surface in the product does not read the canvas token at all.
 * What `--gallery` actually does is the WELL behind media (a tile before its
 * image decodes, an event card with no cover, the reel frame, the play badge)
 * and, through `.surface-ink`, the footer's SLAB. Those two want opposite
 * things: a well should vanish under a photograph, a slab has to hold type and
 * sit on paper without punching a hole in the page. That is the count bible 16
 * gets wrong, and it is three surfaces once the literal is admitted.
 */
export const GROUND_JOBS = [
  {
    id: "overlay",
    name: "The lightbox backdrop",
    token: "a literal, not a token",
    where: "shared/media-lightbox.tsx:617, bg-black/90",
    wants:
      "the deepest thing in the product, edge to edge, so a photograph is the only light in the room",
  },
  {
    id: "well",
    name: "The media well",
    token: "--gallery",
    where:
      "event-card.tsx:77, reel-frame.tsx:28, play-badge.tsx:30, inline-reel-player.tsx:86",
    wants: "to disappear under a photograph and never be noticed as a colour",
  },
  {
    id: "slab",
    name: "The ink slab",
    token: ".surface-ink, derived from --gallery",
    where: "the footer leaf on a paper page",
    wants:
      "to hold type and a card, and to read as a leaf on paper rather than a hole",
  },
] as const;

/* ── The text steps, in real copy ───────────────────────────────────────── */

/** Every text step with a real line at it, because a grey is only wrong once
 *  there are words in it. The alpha column is what ships today at that step. */
export const TEXT_STEPS = [
  {
    token: "--foreground",
    role: "Text",
    today: "the step",
    copy: "Ninety-one guests uploaded before the cake.",
  },
  {
    token: "--muted-foreground",
    role: "Second text",
    today: "the step",
    copy: "Photos and videos land in the album the moment a guest hits send.",
  },
  {
    token: "--faint",
    role: "Faint text",
    today: "an alpha of the step above, at 37 sites",
    copy: "Last change 4 minutes ago",
  },
] as const;

/* ── The printable block ────────────────────────────────────────────────── */

const order = (map: TokenMap) =>
  Object.entries(map)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");

/** The ruling, as the paste the Orchestrator makes into globals.css. Takes the
 *  RESOLVED ramp, so the card question the board is showing is the card
 *  question that lands. */
export function tokenBlock(ramp: Ramp): string {
  return [
    "/* globals.css */",
    ":root,",
    ".surface-paper {",
    order(ramp.light),
    "}",
    "",
    ".dark {",
    order(ramp.dark),
    "}",
    "",
    "/* the media canvas, identical in both modes */",
    ":root,",
    ".surface-paper {",
    order(ramp.gallery),
    "}",
    "",
    ".surface-ink {",
    order(ramp.ink),
    "}",
    "",
    "/* marketing.css, the cinema skin */",
    '.dark[data-mkt-skin="cinema"] {',
    `  --background: ${ramp.cinemaBackground};`,
    "}",
    'body:has([data-mkt-skin="cinema"]) {',
    `  background: ${ramp.cinemaBackground};`,
    "}",
  ].join("\n");
}

/** The accent half of the paste. Ink is the alias that ships, so it prints
 *  nothing: a ruling of "ink" is a ruling to change no line. */
export function accentBlock(accent: Accent): string {
  if (accent.id === "ink") return "";
  return [
    "/* globals.css, the accent */",
    ":root,",
    ".surface-paper {",
    `  --brand: ${accent.light};`,
    `  --brand-foreground: ${accent.lightForeground};`,
    "}",
    "",
    ".dark {",
    `  --brand: ${accent.dark};`,
    `  --brand-foreground: ${accent.darkForeground};`,
    "}",
  ].join("\n");
}

/* ── Applying a candidate to the real site ──────────────────────────────── */

/**
 * THE WALK (round two). A ramp is only truly wrong on a page someone reads, so
 * every candidate is offered as the paste its ruling would land, handed to the
 * whole site through the shell's setCandidateCss. Two of the five asks cannot
 * be judged from tokens alone, because they are utility classes rather than
 * values, so they ride along as optional rules:
 *
 *   the panel   45 sites write `bg-muted/<alpha>`; the ruling would delete the
 *               alpha, so the walk needs the same thing from the outside.
 *   --faint     37 sites write `text-muted-foreground/70`; the ruling would
 *               point them at the new step.
 *
 * Both are matched on the class attribute with a leading space or start anchor,
 * so a VARIANT of the same utility (`hover:bg-muted/40`, which is a hover fill
 * and not a panel) is left alone. Specificity ties Tailwind's own utility and
 * this block renders after every stylesheet, so the later rule wins with no
 * `!important` anywhere. Lab only: the islands that render it are key-gated and
 * the block lives in one browser.
 */
export const PANEL_ONE_TOKEN_CSS = `/* the walk: every panel at full strength, retiring the six alphas */
[class^="bg-muted/"],
[class*=" bg-muted/"] {
  background-color: var(--muted);
}`;

export const FAINT_ON_DIMMED_CSS = `/* the walk: the 37 alpha-dimmed text sites reaching the new step */
[class^="text-muted-foreground/"],
[class*=" text-muted-foreground/"] {
  color: var(--faint);
}`;

export type ApplyOptions = {
  accent: Accent;
  panelOneToken: boolean;
  faintOnDimmed: boolean;
};

/** What "Apply to the site" hands the shell: the ruled paste plus whatever the
 *  board's switches are currently claiming, in that order. */
export function applyCss(ramp: Ramp, opts: ApplyOptions): string {
  return [
    tokenBlock(ramp),
    accentBlock(opts.accent),
    opts.panelOneToken ? PANEL_ONE_TOKEN_CSS : "",
    opts.faintOnDimmed ? FAINT_ON_DIMMED_CSS : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** The label the tuner panel and the board badge both show. */
export function applyLabel(ramp: Ramp, opts: ApplyOptions): string {
  const parts = [`ramp ${ramp.label}`];
  if (opts.accent.id !== "ink") parts.push(opts.accent.label.toLowerCase());
  if (opts.panelOneToken) parts.push("panel at one token");
  if (opts.faintOnDimmed) parts.push("faint on the dimmed sites");
  return `palette: ${parts.join(", ")}`;
}

/** The pages a candidate is walked on, listed on the board beside the buttons
 *  and in BoardMeta, every one of them with the lab key on the end. */
export const WALK = [
  { href: "/", name: "the home arc", note: "cinema into paper into ink" },
  {
    href: "/pricing",
    name: "pricing",
    note: "the panel, the cards, the table",
  },
  { href: "/help", name: "help", note: "the facts band and the closer panel" },
  { href: "/contact", name: "contact", note: "the form panel at 50 percent" },
  { href: "/dashboard", name: "the dashboard", note: "signed in, both modes" },
  {
    href: "/dashboard/<event>",
    name: "an event",
    note: "the stat band, the grid, the review queue",
  },
] as const;
