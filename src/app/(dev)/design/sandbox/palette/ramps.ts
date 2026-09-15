import type { Ground } from "@/components/dev/board";

/**
 * THE PALETTE BOARD'S DATA: three complete token sets (today plus two
 * candidates), the temperature switch that used to be a third candidate, the
 * accent options, and the printable block the ruling pastes.
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
export type RampId = "today" | "a" | "b";

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
  /**
   * What choosing this letter ALREADY decides, printed under the candidate so
   * it is never asked twice. Round two carried both of these as separate asks;
   * they are consequences of the ramp, and a separate answer could only
   * contradict the paste the letter generates.
   */
  decides: { grounds: string; canvas: string };
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
  decides: {
    grounds:
      "Three darks with no reason written down: cinema 0.11, the app 0.14, ink 0.155.",
    canvas:
      "One token doing both jobs, and the deepest surface in the product is not a token at all.",
  },
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
    "--brand": "var(--gallery-foreground)",
    "--brand-foreground": "var(--gallery)",
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
    "One new token fills the hole: --faint at 0.62 light and 0.55 dark, which is exactly what the 19 text-muted-foreground/70 sites already composite to.",
    "Three darks stay and become three steps of one ladder (cinema 0.105, the app 0.145, ink 0.185); the media canvas leaves the ink family and goes deeper, to 0.09.",
  ],
  trade:
    "The paper body is a real paper grey rather than near white, and the cinema-to-ink seam at the footer widens from 0.045 to 0.08.",
  decides: {
    grounds:
      "A ladder: cinema 0.105, the app 0.145, the ink leaf 0.185, three steps of one set.",
    canvas:
      "Split. The media well goes to 0.09, deeper than any room, and the slab stays a leaf at 0.185.",
  },
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
    "--brand": "var(--primary)",
    "--brand-foreground": "var(--primary-foreground)",
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
  decides: {
    grounds:
      "One room. Cinema, the app and the ink leaf are all 0.125, and the override in marketing.css is deleted.",
    canvas:
      "One. The canvas is the room too, so a photograph and a footer sit on the same value.",
  },
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
    "--brand": "var(--primary)",
    "--brand-foreground": "var(--primary-foreground)",
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


export const RAMPS: Ramp[] = [TODAY, A, B];
export const RAMP_BY_ID: Record<RampId, Ramp> = {
  today: TODAY,
  a: A,
  b: B,
};

/* ── The temperature: a switch, not a candidate (round three) ───────────── */

/**
 * ROUND THREE CUT CANDIDATE C AND KEPT EVERY VALUE IT HELD.
 *
 * Round two shipped three candidates and then wrote, in C's own move list, the
 * reason the third could not stay one: "The spacing is A's exactly, so a ruling
 * between A and C is a ruling on temperature alone and nothing else moves." A
 * column that moves no step is not a system, it is a switch wearing a letter,
 * and it cost the board a third of its width, a quarter of the ramp ask and the
 * one question it could never answer: whether the OTHER ramps want warming too.
 *
 * So the temperature became a transform over any token block. `warm(A)`
 * reproduces round two's C exactly (temperature.test.ts pins all five of its
 * blocks against the published values, token for token), `warm(B)` is the
 * answer that could not be asked before, and the ask drops from four letters to
 * three plus one word.
 *
 * The rule is read off C rather than invented: a SURFACE carries the
 * temperature and ink does not. On paper that means every value at 0.8 and up
 * takes hue 85 while the type stays at chroma 0, so black on a warm white still
 * reads crisp. In the dark it means the rooms take hue 60 (a film black, not a
 * screen black), the middle text steps take a trace of 70, and the near-whites
 * take 0.002 at 85 so type on a warm black is not a blue-white. A value
 * carrying an ALPHA is left alone: a white veil borrows the surface under it,
 * so tinting it would tint the same thing twice. Candidate B needs almost none
 * of this, because it derives its surfaces from the room by color-mix and a
 * warmed room carries the whole ladder with it, which is the clearest thing
 * this split says about B.
 *
 * The one value that is NOT C's: C left `.dark --ring` at chroma 0 while
 * writing `.surface-ink --ring` warm, at the same job on the same ground. A
 * transform cannot hold two answers, so it takes the ink one and the test
 * records the correction.
 */
export type Temperature = "neutral" | "warm";

/** The case for warming, rendered where C's candidate card used to be. */
export const TEMPERATURE = {
  name: "Warm, on whichever ramp is selected",
  thesis:
    "Paper as a warm white and the room as a warm black, at 0.002 to 0.008 chroma, because a pure grey is what a default looks like and a party is warm. Text stays neutral on paper, so the ink still reads crisp.",
  moves: [
    "Light surfaces take hue 85, rising from 0.003 at the menu to 0.007 at the hairline; every text step stays at chroma 0.",
    "Dark rooms take hue 60 at 0.004 to 0.008, and the near-whites take 0.002 at 85 so type on a warm black is not a blue-white.",
    "It moves no step on any ramp, which is why it is a switch and not a letter: warm or neutral is one decision about temperature and nothing else.",
    "On B it costs one value, because B derives every surface from the room and a warmed room carries the whole ladder with it.",
    "The cool inversion (warm paper, cool night) was built and dropped: a cool room fights skin tones, and every photograph on this product has people in it.",
  ],
  trade:
    "It re-opens a decision globals.css records as closed (zero-chroma purity IS the brand point), and a warm ground very slightly warms how a photograph reads against it.",
} as const;

/** The chroma and hue a value takes at a given lightness, per polarity. The
 *  bands are read off round two's C, not invented; temperature.test.ts pins
 *  them to it. */
export function warmthAt(
  l: number,
  dark: boolean,
): { chroma: number; hue: number } {
  if (dark) {
    // The near-whites: type, the primary, the ring on a leaf.
    if (l >= 0.9) return { chroma: 0.002, hue: 85 };
    // The middle steps: second text, faint.
    if (l >= 0.5) return { chroma: 0.004, hue: 70 };
    // The rooms, warming as they lighten. The canvas is deeper than any of
    // them and takes the least, so a photograph sits on almost-black.
    if (l < 0.11) return { chroma: 0.004, hue: 60 };
    if (l < 0.17) return { chroma: 0.005, hue: 60 };
    if (l < 0.26) return { chroma: 0.006, hue: 60 };
    if (l < 0.3) return { chroma: 0.007, hue: 60 };
    return { chroma: 0.008, hue: 60 };
  }
  // On paper the ink stays neutral; only the surfaces warm.
  if (l < 0.8) return { chroma: 0, hue: 0 };
  if (l >= 0.99) return { chroma: 0.003, hue: 85 };
  if (l >= 0.96) return { chroma: 0.004, hue: 85 };
  if (l >= 0.935) return { chroma: 0.005, hue: 85 };
  if (l >= 0.905) return { chroma: 0.006, hue: 85 };
  return { chroma: 0.007, hue: 85 };
}

/** An opaque `oklch(L 0 0)` literal, or no match for anything else (a veil, a
 *  color-mix, a var alias): those are left exactly as they are. */
const PLAIN_OKLCH = /^oklch\(\s*([\d.]+)\s+0\s+0\s*\)$/;

function warmValue(value: string, dark: boolean): string {
  const hit = PLAIN_OKLCH.exec(value.trim());
  if (!hit) return value;
  const l = Number(hit[1]);
  const { chroma, hue } = warmthAt(l, dark);
  return chroma === 0 ? value : `oklch(${l} ${chroma} ${hue})`;
}

const warmMap = (m: TokenMap, dark: boolean): TokenMap =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, warmValue(v, dark)]));

/** One ramp at a temperature. The light block reads the paper table; every
 *  other block (the dark room, the ink leaf, the canvas, cinema) reads the
 *  dark one. */
export function warm(ramp: Ramp): Ramp {
  return {
    ...ramp,
    light: warmMap(ramp.light, false),
    dark: warmMap(ramp.dark, true),
    ink: warmMap(ramp.ink, true),
    gallery: warmMap(ramp.gallery, true),
    cinemaBackground: warmValue(ramp.cinemaBackground, true),
  };
}

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

/**
 * The ramp with BOTH switches answered, which is what every renderer and the
 * paste read, so the board can never show one thing and paste another.
 *
 * The card runs first and the temperature second: forcing the veiled card
 * opaque strips its alpha, and the value that comes out has to take the
 * temperature like any other surface, or an opaque card would be the one cold
 * thing in a warm room.
 */
export function resolveRamp(
  ramp: Ramp,
  mode: CardMode,
  temperature: Temperature = "neutral",
): Ramp {
  const carded = applyCardMode(ramp, mode);
  return temperature === "warm" ? warm(carded) : carded;
}

function applyCardMode(ramp: Ramp, mode: CardMode): Ramp {
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

/**
 * Every alpha the set-apart panel ships at, with its count.
 *
 * ★ MEASURED, not remembered (round three re-counted and round two's numbers
 * were high by ten). The count is production only, the lab excluded, and a
 * VARIANT of the same utility is left out on purpose: `hover:bg-muted/40` is a
 * hover fill, not a panel, and there are 8 of those. Re-run it with
 *
 *   grep -rEoh "(^|[^:[:alnum:]_-])bg-muted/[0-9]+" --include='*.tsx' \
 *     --include='*.ts' src --exclude-dir='(dev)' | grep -oE 'bg-muted/[0-9]+' \
 *     | sort | uniq -c | sort -rn
 *
 * and change these numbers rather than the sentence that quotes them: the board
 * and BoardMeta both read PANEL_USES below.
 */
export const PANEL_ALPHAS = [
  { alpha: 20, uses: 2 },
  { alpha: 30, uses: 4 },
  { alpha: 40, uses: 17 },
  { alpha: 50, uses: 6 },
  { alpha: 60, uses: 4 },
  { alpha: 70, uses: 2 },
];

export const PANEL_USES = PANEL_ALPHAS.reduce((n, a) => n + a.uses, 0);
/** Plus the hover fills that wear the same utility and are NOT the panel. */
export const PANEL_HOVER_USES = 8;

/**
 * The same count for the missing text step: every `text-muted-foreground/N` in
 * production, measured the same way on the same day. The 70 percent row is the
 * one that matters, because 70 percent of the second step is what --faint is.
 */
export const FAINT_ALPHAS = [
  { alpha: 40, uses: 4 },
  { alpha: 50, uses: 7 },
  { alpha: 60, uses: 6 },
  { alpha: 70, uses: 19 },
  { alpha: 75, uses: 1 },
];

export const FAINT_USES = FAINT_ALPHAS.reduce((n, a) => n + a.uses, 0);

/** The accent's reach, measured the same way: `--brand` utilities in
 *  production. A hue ruling changes two token values and nothing else. */
export const BRAND_HITS = 34;
export const BRAND_FILES = 16;

/** The ring elevation nobody wrote down, measured: `ring-foreground/5` is the
 *  app's quiet lift and `ring-white/70` is the one on media. */
export const RING_USES = { faint: 37, firm: 13, onMedia: 29 };

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

/**
 * The accent half of the paste. Ink is the alias that ships, so it prints
 * nothing: a ruling of "ink" is a ruling to change no line.
 *
 * The third block is the one that is easy to miss. `.surface-ink` declares
 * `--brand: var(--gallery-foreground)` today, which NEUTRALISES any hue on the
 * footer leaf, and that line outranks an inherited value from the page around
 * it. So a hue that is not also written into the ink block reaches every
 * surface in the product except the one place the mark actually sits at the
 * bottom of every page. Writing it here keeps the walk and the paste identical.
 */
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
    "",
    "/* the footer leaf neutralises --brand today; the accent has to reach it */",
    ".surface-ink {",
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
  /** Carried for the LABEL only: the block itself is already resolved, so the
   *  paste cannot disagree with the board about the temperature. */
  temperature: Temperature;
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
  if (opts.temperature === "warm") parts.push("warm");
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
  {
    href: "/dashboard",
    name: "the dashboard",
    note: "signed in, both modes, then one click to an event",
  },
  { href: "/design/rules", name: "the bible", note: "rule 1, as it stands" },
] as const;
