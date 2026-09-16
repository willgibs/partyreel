import type { Ground } from "@/components/lab";

/**
 * THE PALETTE BOARD'S DATA, ROUND FOUR: the register model, and the two sides
 * of it a ruling picks separately.
 *
 * WHY THE SHAPE CHANGED. Rounds one to three carried a "ramp" that was a whole
 * system in one object: a light block, a dark block, an ink leaf, a media
 * canvas and a cinema ground, ruled on as one letter. Will's round-four note
 * asked the question that shape could not answer: "what's the difference
 * between cinema and ink?", and "we can choose dark and light separately, don't
 * have to be a package deal".
 *
 * Both answers are the same answer. Cinema and ink are not two darks: cinema is
 * the ROOM a dark chapter sits in, ink is the SLAB a dark leaf makes on a light
 * page. One mode, two jobs, two registers. Once that is said, light has the
 * same two (the PAPER a page is, and the MAT a section sets itself apart on,
 * which today is `bg-muted/40` at six alphas and is the fifth ground nobody
 * named), and the media WELL turns out to belong to neither mode: it is always
 * dark, because a photograph is always laid on something near black.
 *
 * So the data is two independent sets:
 *
 *   DarkSet   room + slab + well + what cinema does, ruled on as one word.
 *   LightSet  paper + mat, ruled on as one word.
 *
 * A pair is any dark beside any light, which is thirty combinations from six
 * and five, and the paste is generated from the pair rather than from a letter.
 *
 * Values are kept as CSS strings so the board renders the exact text that
 * ships; `lOf` reads the lightness back out for the ladder labels (including
 * the color-mix veils the derived sets are built from), so no number is written
 * down twice and a swatch can never drift from the block.
 *
 * The facts these were built against (verified at 51f40e3, re-measured in round
 * three, see docs/tracks/palette.md): the light ramp holds a 0.455 hole between
 * 0.45 and 0.905 and crushes five surfaces into 0.96 to 0.997; the dark ramp
 * crushes four semantic surfaces into 0.14 to 0.25; three darks ship (cinema
 * 0.11, the app 0.14, the well 0.155); `--brand` aliases ink in all three sets.
 */

export type TokenMap = Record<string, string>;

/* ── The model ──────────────────────────────────────────────────────────── */

export type RegisterId = "room" | "slab" | "paper" | "mat" | "well";

/**
 * THE ANSWER TO WILL'S QUESTION, in one sentence, because it is the first ask
 * and it should not need a paragraph.
 */
export const CINEMA_VERSUS_INK =
  "Cinema and ink are one mode's two grounds, not two darks: cinema is the room a dark chapter sits in (the deepest thing on its own page) and ink is the slab a dark leaf makes on a light one (the only dark thing on a page of paper), which is why the slab has to sit lighter than the room rather than deeper, and why neither of them is pure black today.";

/** The model as a table, in the order a page meets them. */
export const REGISTERS: {
  id: RegisterId;
  mode: "dark" | "light" | "neither";
  name: string;
  selector: string;
  /** What it is, in one line. */
  is: string;
  /** Who takes it. */
  takes: string;
  /** Today, in one line. */
  today: string;
}[] = [
  {
    id: "room",
    mode: "dark",
    name: "the room",
    selector: ".dark",
    is: "The page, in dark mode. The deepest ground a reader stands in, and the one everything else is read against.",
    takes:
      "Every dark marketing chapter (cinema is this, not a third value) and the app in dark mode.",
    today:
      "Two values pretending to be one: the app at 0.140 and a marketing override at 0.110, with no reason written down for the 0.030 between them.",
  },
  {
    id: "slab",
    mode: "dark",
    name: "the slab",
    selector: ".surface-ink",
    is: "A dark leaf inside a light page. It has to read as something laid on the paper, so it sits LIGHTER than the room; a room dropped into paper reads as a hole.",
    takes:
      "The footer on every marketing page, and any dark island a light flow wants.",
    today:
      "Derived from the media well at 0.155 and incomplete: it declares no card, popover, secondary or input, so a Card inside the footer renders in the PAPER card colour on a dark slab.",
  },
  {
    id: "paper",
    mode: "light",
    name: "the paper",
    selector: ":root, .surface-paper",
    is: "The page, in light mode. The brightest ground, and the one a card has to lift off.",
    takes: "The marketing body, and the app in light mode.",
    today:
      "0.990, with the card at 0.997 and the menu at 0.997 as well, so five surfaces sit inside 0.037 and a card is its hairline and nothing else.",
  },
  {
    id: "mat",
    mode: "light",
    name: "the mat",
    selector: ".surface-mat (new)",
    is: "The set-apart ground on paper: a band, a form panel, a facts strip. Deeper than the page, with the card back at the top so a card on a mat still lifts.",
    takes:
      "The contact card, the help facts band, the pricing panel, every place a section says this part is separate.",
    today:
      "Not a register at all. It is --muted at six alphas (a token that also does hover), and 40 percent over 0.990 is a one percent step.",
  },
  {
    id: "well",
    mode: "neither",
    name: "the well",
    selector: "--gallery",
    is: "The bed a photograph is laid on. It is always dark and belongs to neither mode, because a light page does not want a bright hole where an image has not decoded yet.",
    takes:
      "A tile before its image arrives, an event card with no cover, the reel frame, the play badge, and the guest album behind all of them.",
    today:
      "0.155, doing the slab's job as well as its own; and the deepest surface in the product is not this token at all but a literal (media-lightbox.tsx:617, bg-black/90).",
  },
];

/** What a page and a section each choose, which is the part that makes the
 *  model usable rather than merely tidy. */
export const CHOOSES = [
  "A page chooses a MODE. Dark or light, once, at the top: the marketing arc changes mode between chapters, the app reads the host's theme, a guest link takes the host's event.",
  "A section chooses a REGISTER inside that mode, and only ever the other one. On dark that is the room or the slab; on light the paper or the mat. There is no third ground to reach for, which is the whole point.",
  "Media chooses nothing. It is laid on the well in both modes, so the one thing a guest came to look at never changes colour with the chrome around it.",
  "And the two sides are ruled separately. The dark set reaches marketing's chapters, the app's dark mode and the footer slab; the light set reaches marketing's body and the app's light mode. Nothing makes them a package, and this board's own recommendation is a pair the old shape could not have produced.",
];

/* ── The two halves of a ruling ─────────────────────────────────────────── */

export type DarkId = "today" | "ladder" | "room" | "ember" | "slate" | "lift";
export type LightId = "today" | "paper" | "bright" | "warm" | "cool";

export type DarkSet = {
  id: DarkId;
  /** The dock's label. */
  label: string;
  /** The name on the board, with its thesis in one line. */
  name: string;
  thesis: string;
  moves: string[];
  trade: string;
  /** What choosing this word already decides, so it is never asked twice. */
  decides: { rooms: string; well: string };
  /** The `.dark` block. */
  room: TokenMap;
  /** The `.surface-ink` block: dark's raised register. */
  slab: TokenMap;
  /** The media well, identical in both modes and always dark. */
  well: TokenMap;
  /** The cinema skin's one override in marketing.css. Equal to the room's own
   *  background on every set that answers "one room", and the paste then says
   *  to delete the override rather than printing it. */
  cinemaBackground: string;
};

export type LightSet = {
  id: LightId;
  label: string;
  name: string;
  thesis: string;
  moves: string[];
  trade: string;
  decides: { mat: string };
  /** The `:root, .surface-paper` block. */
  paper: TokenMap;
  /** The `.surface-mat` block: light's set-apart register. */
  mat: TokenMap;
};

export type Pair = { dark: DarkSet; light: LightSet };

/* ── The cast: one transform, two directions ────────────────────────────── */

/**
 * ROUND THREE MADE THE TEMPERATURE A SWITCH; ROUND FOUR MAKES IT A CANDIDATE,
 * and the reason is the split.
 *
 * Round three's argument for demoting candidate C to a switch was sound: C was
 * A's ladder at a temperature, it moved no step, and a column that moves no
 * step is a switch wearing a letter. But a switch over a whole system could
 * only ask ONE question, "warm or not", about both modes at once, and the
 * honest answer turns out to be different on each side: the case for a warm
 * room (skin tones on a dark ground) is strong and the case for a warm page (a
 * white dress on paper) is weak. Now that the sides are ruled separately, the
 * cast is a property of a SET, four of the eleven sets carry one, and each of
 * those moves its own lightnesses too, so none of them is a switch.
 *
 * The bands are still the ones read off C rather than invented, and
 * `warmthAt(l, dark)` is still exactly C's table at gain 1, so
 * `tint(LADDER.room, …)` reproduces round two's published C token for token
 * (registers.test.ts pins all five of its blocks). A set asks for more or less
 * of the same curve through `gain`.
 *
 * The rule the bands encode: a SURFACE carries the cast and ink does not. On
 * paper every value at 0.8 and up takes the hue while the type stays at chroma
 * 0, so black on a warm white still reads crisp. In the dark the rooms take the
 * most, the near-whites take a trace so type on a warm black is not a
 * blue-white, and the well takes the least because a photograph should be the
 * only colour in its own bed. A value carrying an ALPHA is left alone: a white
 * veil borrows the surface under it, so tinting it would tint the same thing
 * twice.
 */
export type Cast = "warm" | "cool";

type Band = { chroma: number; hue: number };

const BANDS: Record<
  Cast,
  { dark: (l: number) => Band; light: (l: number) => Band }
> = {
  warm: {
    dark: (l) => {
      // The near-whites: type, the primary, the ring on a leaf.
      if (l >= 0.9) return { chroma: 0.002, hue: 85 };
      // The middle steps: second text, faint.
      if (l >= 0.5) return { chroma: 0.004, hue: 70 };
      // The rooms, warming as they lighten. The well is deeper than any of
      // them and takes the least, so a photograph sits on almost-black.
      if (l < 0.11) return { chroma: 0.004, hue: 60 };
      if (l < 0.17) return { chroma: 0.005, hue: 60 };
      if (l < 0.26) return { chroma: 0.006, hue: 60 };
      if (l < 0.3) return { chroma: 0.007, hue: 60 };
      return { chroma: 0.008, hue: 60 };
    },
    light: (l) => {
      // On paper the ink stays neutral; only the surfaces warm.
      if (l < 0.8) return { chroma: 0, hue: 0 };
      if (l >= 0.99) return { chroma: 0.003, hue: 85 };
      if (l >= 0.96) return { chroma: 0.004, hue: 85 };
      if (l >= 0.935) return { chroma: 0.005, hue: 85 };
      if (l >= 0.905) return { chroma: 0.006, hue: 85 };
      return { chroma: 0.007, hue: 85 };
    },
  },
  cool: {
    // The mirror of the warm table, at the blue end of the same distance from
    // neutral. The near-whites go to 250 rather than 258 on purpose: a cool
    // white pushed past 255 starts reading violet at small type sizes.
    dark: (l) => {
      if (l >= 0.9) return { chroma: 0.002, hue: 250 };
      if (l >= 0.5) return { chroma: 0.005, hue: 255 };
      if (l < 0.11) return { chroma: 0.004, hue: 258 };
      if (l < 0.17) return { chroma: 0.006, hue: 258 };
      if (l < 0.26) return { chroma: 0.008, hue: 258 };
      if (l < 0.3) return { chroma: 0.009, hue: 258 };
      return { chroma: 0.01, hue: 258 };
    },
    light: (l) => {
      if (l < 0.8) return { chroma: 0, hue: 0 };
      if (l >= 0.99) return { chroma: 0.003, hue: 250 };
      if (l >= 0.96) return { chroma: 0.004, hue: 250 };
      if (l >= 0.935) return { chroma: 0.005, hue: 250 };
      if (l >= 0.905) return { chroma: 0.006, hue: 250 };
      return { chroma: 0.007, hue: 250 };
    },
  },
};

/** The chroma and hue a value takes at a given lightness, per polarity, on the
 *  warm side at gain 1. Kept under its round-three name because it is the
 *  published table candidate C was built from. */
export function warmthAt(l: number, dark: boolean): Band {
  return dark ? BANDS.warm.dark(l) : BANDS.warm.light(l);
}

export function castAt(l: number, dark: boolean, cast: Cast): Band {
  return dark ? BANDS[cast].dark(l) : BANDS[cast].light(l);
}

/** An opaque `oklch(L 0 0)` literal, or no match for anything else (a veil, a
 *  color-mix, a var alias): those are left exactly as they are. */
const PLAIN_OKLCH = /^oklch\(\s*([\d.]+)\s+0\s+0\s*\)$/;

function tintValue(
  value: string,
  dark: boolean,
  cast: Cast,
  gain: number,
): string {
  const hit = PLAIN_OKLCH.exec(value.trim());
  if (!hit) return value;
  const l = Number(hit[1]);
  const { chroma, hue } = castAt(l, dark, cast);
  const c = Math.round(chroma * gain * 1000) / 1000;
  return c === 0 ? value : `oklch(${l} ${c} ${hue})`;
}

/** One token block at a cast. `gain` scales the band's chroma, so a set can ask
 *  for more or less of the same curve; gain 1 on the warm side is exactly the
 *  table candidate C was published from. */
export function tint(
  map: TokenMap,
  dark: boolean,
  cast: Cast,
  gain = 1,
): TokenMap {
  return Object.fromEntries(
    Object.entries(map).map(([k, v]) => [k, tintValue(v, dark, cast, gain)]),
  );
}

/* ── The shared pieces the sets are written from ────────────────────────── */

/** The zero every slab carries: without it a dark leaf inside a paper page
 *  wears the PAPER float on a dark slab. The light board's round-three handoff
 *  flags this line as one its own ruling moves, so the two pastes land in one
 *  pass rather than overwriting each other (board.tsx, "From the other
 *  boards"). */
const FLOAT_ZERO = { "--shadow-float": "0 0 0 0 oklch(0 0 0 / 0)" };

/** The leaf's own brand lines. `.surface-ink` declares --brand today, and a
 *  class rule outranks a value inherited from the page around it, so a slab
 *  without these would neutralise any accent at the bottom of every page. */
const LEAF_BRAND = {
  "--brand": "var(--primary)",
  "--brand-foreground": "var(--primary-foreground)",
};

/** A surface derived from the room by a veil of the ink. */
const inkVeil = (pct: number) =>
  `color-mix(in oklab, var(--foreground) ${pct}%, var(--background))`;

/* ── The dark sets ──────────────────────────────────────────────────────── */

const TODAY_DARK: DarkSet = {
  id: "today",
  label: "Today",
  name: "Today",
  thesis:
    "Three darks with no ladder behind them: a marketing room at 0.110, an app room at 0.140, a slab derived from the media well at 0.155, and four semantic surfaces crushed between 0.210 and 0.250.",
  moves: [
    "Card, popover, muted, secondary and accent all land between 0.210 and 0.250, so a menu over a card over the panel is three hairlines.",
    "The one translucent surface in the whole system is here, and no document says so: the card at 62 percent.",
    "The slab declares no card, popover, secondary or input, so a Card in the footer renders in the paper card colour.",
    "Nothing between 0.450 and 0.905 in either mode, so 37 call sites dim text with an alpha instead.",
  ],
  trade: "It ships, and every surface question is answered with a hairline.",
  decides: {
    rooms:
      "Three darks with no reason written down: cinema 0.110, the app 0.140, the slab 0.155.",
    well: "The well IS the slab, and the deepest surface in the product is a literal rather than a token.",
  },
  room: {
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
  // As shipped: no --card, --popover, --secondary, --accent or --input, which
  // is why a Card inside the footer renders with the PAPER card colour.
  slab: {
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
    ...FLOAT_ZERO,
  },
  well: {
    "--gallery": "oklch(0.155 0 0)",
    "--gallery-foreground": "oklch(0.97 0 0)",
    "--gallery-muted": "oklch(0.62 0 0)",
    "--gallery-border": "oklch(1 0 0 / 8%)",
  },
  cinemaBackground: "oklch(0.11 0 0)",
};

const LADDER: DarkSet = {
  id: "ladder",
  label: "Ladder",
  name: "Ladder. Three rooms, one rhythm",
  thesis:
    "Keep all three darks and make them three steps of one ladder instead of three accidents: marketing deepest, the app in the middle, the slab lifted, with real steps of about 0.045 above each of them.",
  moves: [
    "The room gets steps that read: room 0.145, panel 0.195, card 0.235, menu 0.285, hover 0.325, and the card goes opaque.",
    "The slab lifts to 0.185, a step above the app's room, so a leaf on paper is a leaf and not a hole.",
    "Marketing keeps a deeper room at 0.105, and the override in marketing.css stays, now as a stated step rather than a stray value.",
    "The well leaves the slab's family and goes deeper than any room, to 0.090.",
  ],
  trade:
    "It keeps a token that two files have to agree about, and the cinema-to-slab seam at the footer widens from 0.045 to 0.080.",
  decides: {
    rooms:
      "Three, as three steps of one set: cinema 0.105, the app 0.145, the slab 0.185.",
    well: "Split out and sent deeper than any room, to 0.090.",
  },
  room: {
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
  slab: {
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
    ...LEAF_BRAND,
    ...FLOAT_ZERO,
  },
  well: {
    "--gallery": "oklch(0.09 0 0)",
    "--gallery-foreground": "oklch(0.965 0 0)",
    "--gallery-muted": "oklch(0.62 0 0)",
    "--gallery-border": "oklch(1 0 0 / 8%)",
  },
  cinemaBackground: "oklch(0.105 0 0)",
};

const ONE_ROOM: DarkSet = {
  id: "room",
  label: "One room",
  name: "One room. Every surface derived",
  thesis:
    "Stop picking greys. One dark ground for everything, and every surface above it a veil of the ink, so there is one number to tune and the ladder can never drift.",
  moves: [
    "Cinema, the app, the slab and the well are all 0.125, and the cinema override in marketing.css is deleted.",
    "Every surface is a color-mix off the room: panel 7 percent, card 12, menu 18, hover 22, so retuning the whole set is one value.",
    "The slab is the room with the lights on: the leaf declares the same block, which is how one value can be both registers.",
    "--faint arrives as a veil too, at 52 percent of the ink.",
  ],
  trade:
    "Cinema loses its deeper room, so a dark chapter sits 0.015 lighter than today, and the slab stops being a separate value, which hands the footer seam to depth rather than to colour.",
  decides: {
    rooms:
      "One. Cinema, the app and the slab are all 0.125, and the override in marketing.css is deleted.",
    well: "One as well, so a photograph and a footer sit on the same value.",
  },
  room: {
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
  slab: {
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
    ...LEAF_BRAND,
    ...FLOAT_ZERO,
  },
  well: {
    "--gallery": "oklch(0.125 0 0)",
    "--gallery-foreground": "oklch(0.96 0 0)",
    "--gallery-muted": "oklch(0.62 0 0)",
    "--gallery-border": "oklch(1 0 0 / 8%)",
  },
  cinemaBackground: "oklch(0.125 0 0)",
};

/**
 * EMBER and SLATE are written as neutral ladders and cast by `tint`, so the
 * cast is a curve rather than eleven hand-typed literals and the same table
 * that reproduces candidate C drives both. A set's `gain` is its whole claim
 * about how far from neutral it wants to sit.
 */
const EMBER_NEUTRAL = {
  room: {
    "--background": "oklch(0.12 0 0)",
    "--foreground": "oklch(0.96 0 0)",
    "--card": "oklch(0.205 0 0)",
    "--card-foreground": "oklch(0.96 0 0)",
    "--popover": "oklch(0.25 0 0)",
    "--popover-foreground": "oklch(0.96 0 0)",
    "--primary": "oklch(0.96 0 0)",
    "--primary-foreground": "oklch(0.12 0 0)",
    "--secondary": "oklch(0.29 0 0)",
    "--secondary-foreground": "oklch(0.96 0 0)",
    "--muted": "oklch(0.165 0 0)",
    "--muted-foreground": "oklch(0.71 0 0)",
    "--faint": "oklch(0.56 0 0)",
    "--accent": "oklch(0.29 0 0)",
    "--accent-foreground": "oklch(0.96 0 0)",
    "--border": "oklch(1 0 0 / 12%)",
    "--input": "oklch(1 0 0 / 16%)",
    "--ring": "oklch(0.86 0 0)",
  },
  slab: {
    "--background": "oklch(0.165 0 0)",
    "--foreground": "oklch(0.965 0 0)",
    "--card": "oklch(0.205 0 0)",
    "--card-foreground": "oklch(0.965 0 0)",
    "--popover": "oklch(0.25 0 0)",
    "--popover-foreground": "oklch(0.965 0 0)",
    "--secondary": "oklch(0.29 0 0)",
    "--secondary-foreground": "oklch(0.965 0 0)",
    "--accent": "oklch(0.29 0 0)",
    "--accent-foreground": "oklch(0.965 0 0)",
    "--muted": "oklch(0.205 0 0)",
    "--muted-foreground": "oklch(0.71 0 0)",
    "--faint": "oklch(0.56 0 0)",
    "--border": "oklch(1 0 0 / 10%)",
    "--input": "oklch(1 0 0 / 14%)",
    "--ring": "oklch(0.965 0 0)",
    "--primary": "oklch(0.965 0 0)",
    "--primary-foreground": "oklch(0.165 0 0)",
    ...LEAF_BRAND,
    ...FLOAT_ZERO,
  },
  well: {
    "--gallery": "oklch(0.085 0 0)",
    "--gallery-foreground": "oklch(0.965 0 0)",
    "--gallery-muted": "oklch(0.62 0 0)",
    "--gallery-border": "oklch(1 0 0 / 8%)",
  },
};

export const EMBER_GAIN = 1.6;

const EMBER: DarkSet = {
  id: "ember",
  label: "Ember",
  name: "Ember. A warm black, one room",
  thesis:
    "A projector black rather than a screen black. One room at 0.120 carrying hue 60, a tighter ladder above it, and a well left almost neutral so the only colour in a photograph is the photograph's.",
  moves: [
    "One room at 0.120, the deepest of any candidate here, and the marketing override is deleted with it.",
    "The ladder above it is tighter than the neutral one (0.165, 0.205, 0.250, 0.290) because a warm ground separates at less distance than a grey one does.",
    "Chroma rises with lightness, from 0.008 in the room to 0.011 at the hover fill: the light in a warm room warms what it falls on, and a flat tint on every surface is what makes a warm palette look printed.",
    "Type stays near neutral (0.003 at hue 85) and the well takes the least of all at 0.006, so skin reads warm and a white dress does not.",
  ],
  trade:
    "It re-opens a decision globals.css records as closed: zero-chroma purity IS the brand point, and saturating the neutrals was consciously declined.",
  decides: {
    rooms:
      "One room at 0.120, warm. The slab lifts to 0.165 and carries the same cast; marketing's override is deleted.",
    well: "Split at 0.085 and the least tinted surface in the set, so a photograph is the only colour in its own bed.",
  },
  room: tint(EMBER_NEUTRAL.room, true, "warm", EMBER_GAIN),
  slab: tint(EMBER_NEUTRAL.slab, true, "warm", EMBER_GAIN),
  well: tint(EMBER_NEUTRAL.well, true, "warm", EMBER_GAIN),
  cinemaBackground: tint(
    { x: EMBER_NEUTRAL.room["--background"] },
    true,
    "warm",
    EMBER_GAIN,
  ).x,
};

const SLATE_NEUTRAL = {
  room: {
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
    "--muted-foreground": "oklch(0.71 0 0)",
    "--faint": "oklch(0.56 0 0)",
    "--accent": "oklch(0.325 0 0)",
    "--accent-foreground": "oklch(0.955 0 0)",
    "--border": "oklch(1 0 0 / 13%)",
    "--input": "oklch(1 0 0 / 17%)",
    "--ring": "oklch(0.86 0 0)",
  },
  slab: {
    "--background": "oklch(0.19 0 0)",
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
    "--muted-foreground": "oklch(0.71 0 0)",
    "--faint": "oklch(0.56 0 0)",
    "--border": "oklch(1 0 0 / 11%)",
    "--input": "oklch(1 0 0 / 15%)",
    "--ring": "oklch(0.965 0 0)",
    "--primary": "oklch(0.965 0 0)",
    "--primary-foreground": "oklch(0.19 0 0)",
    ...LEAF_BRAND,
    ...FLOAT_ZERO,
  },
  well: {
    "--gallery": "oklch(0.1 0 0)",
    "--gallery-foreground": "oklch(0.965 0 0)",
    "--gallery-muted": "oklch(0.62 0 0)",
    "--gallery-border": "oklch(1 0 0 / 8%)",
  },
};

export const SLATE_GAIN = 1.2;

const SLATE: DarkSet = {
  id: "slate",
  label: "Slate",
  name: "Slate. A cold black, one room",
  thesis:
    "The complement, argued straight: a cool room at 0.145 makes a warm photograph read warmer than a neutral one does, which is the one thing a media product's ground can do for its media.",
  moves: [
    "One room at 0.145 carrying hue 258, the slab lifted to 0.190, and marketing's override deleted.",
    "The neutral ladder is the same rhythm as Ladder's (0.195, 0.235, 0.285, 0.325), so the ruling between them is the cast alone and every step is comparable.",
    "Borders run a point stronger than neutral (13 and 17 percent) because a cool ground swallows a white hairline faster than a warm one.",
    "The near-whites stop at hue 250 rather than 258: a cool white pushed further starts reading violet at small type sizes.",
  ],
  trade:
    "It re-opens the same zero-chroma decision Ember does, and it is the direction a photograph of a warm room fights rather than agrees with.",
  decides: {
    rooms:
      "One room at 0.145, cool. The slab lifts to 0.190 and marketing's override is deleted.",
    well: "Split at 0.100 and cool with it, because the bed should agree with the room it sits in.",
  },
  room: tint(SLATE_NEUTRAL.room, true, "cool", SLATE_GAIN),
  slab: tint(SLATE_NEUTRAL.slab, true, "cool", SLATE_GAIN),
  well: tint(SLATE_NEUTRAL.well, true, "cool", SLATE_GAIN),
  cinemaBackground: tint(
    { x: SLATE_NEUTRAL.room["--background"] },
    true,
    "cool",
    SLATE_GAIN,
  ).x,
};

const LIFT: DarkSet = {
  id: "lift",
  label: "Lift",
  name: "Lift. No true black, one dark ground",
  thesis:
    "Take the whole dark mode a step up and off black. At 0.195 the room already reads as a leaf on a page, so the slab register collapses into it and there is one dark ground rather than two, with the well the only deep thing left.",
  moves: [
    "The room is 0.195, the panel 0.235, the card 0.265, the menu 0.305, the hover 0.340: the same rhythm, started higher.",
    "The slab IS the room. This is the one candidate that says dark needs a single register, because the reason a slab has to lift is that a 0.14 room reads as a hole in paper, and a 0.195 room does not.",
    "The well stays at 0.100, so a photograph is the darkest thing on the page and the chrome never competes with it.",
    "Borders go to 15 and 19 percent, because a white hairline over a lifted ground is a weaker line than the same hairline over black.",
  ],
  trade:
    "A dark marketing chapter loses most of its drama, and an OLED phone loses the true-black economy a 0.11 room was buying.",
  decides: {
    rooms:
      "One, at 0.195, and the slab is the same value: dark needs one register, not two.",
    well: "Split at 0.100 and the only deep surface in the product.",
  },
  room: {
    "--background": "oklch(0.195 0 0)",
    "--foreground": "oklch(0.965 0 0)",
    "--card": "oklch(0.265 0 0)",
    "--card-foreground": "oklch(0.965 0 0)",
    "--popover": "oklch(0.305 0 0)",
    "--popover-foreground": "oklch(0.965 0 0)",
    "--primary": "oklch(0.965 0 0)",
    "--primary-foreground": "oklch(0.195 0 0)",
    "--secondary": "oklch(0.34 0 0)",
    "--secondary-foreground": "oklch(0.965 0 0)",
    "--muted": "oklch(0.235 0 0)",
    "--muted-foreground": "oklch(0.745 0 0)",
    "--faint": "oklch(0.6 0 0)",
    "--accent": "oklch(0.34 0 0)",
    "--accent-foreground": "oklch(0.965 0 0)",
    "--border": "oklch(1 0 0 / 15%)",
    "--input": "oklch(1 0 0 / 19%)",
    "--ring": "oklch(0.88 0 0)",
  },
  slab: {
    "--background": "oklch(0.195 0 0)",
    "--foreground": "oklch(0.965 0 0)",
    "--card": "oklch(0.265 0 0)",
    "--card-foreground": "oklch(0.965 0 0)",
    "--popover": "oklch(0.305 0 0)",
    "--popover-foreground": "oklch(0.965 0 0)",
    "--secondary": "oklch(0.34 0 0)",
    "--secondary-foreground": "oklch(0.965 0 0)",
    "--accent": "oklch(0.34 0 0)",
    "--accent-foreground": "oklch(0.965 0 0)",
    "--muted": "oklch(0.235 0 0)",
    "--muted-foreground": "oklch(0.745 0 0)",
    "--faint": "oklch(0.6 0 0)",
    "--border": "oklch(1 0 0 / 15%)",
    "--input": "oklch(1 0 0 / 19%)",
    "--ring": "oklch(0.965 0 0)",
    "--primary": "oklch(0.965 0 0)",
    "--primary-foreground": "oklch(0.195 0 0)",
    ...LEAF_BRAND,
    ...FLOAT_ZERO,
  },
  well: {
    "--gallery": "oklch(0.1 0 0)",
    "--gallery-foreground": "oklch(0.965 0 0)",
    "--gallery-muted": "oklch(0.62 0 0)",
    "--gallery-border": "oklch(1 0 0 / 8%)",
  },
  cinemaBackground: "oklch(0.195 0 0)",
};

export const DARKS: DarkSet[] = [
  TODAY_DARK,
  LADDER,
  ONE_ROOM,
  EMBER,
  SLATE,
  LIFT,
];
export const DARK_BY_ID = Object.fromEntries(
  DARKS.map((d) => [d.id, d]),
) as Record<DarkId, DarkSet>;

/* ── The light sets ─────────────────────────────────────────────────────── */

const TODAY_LIGHT: LightSet = {
  id: "today",
  label: "Today",
  name: "Today",
  thesis:
    "Five surfaces inside 0.037 with the page at the top of them, so a card is its hairline and nothing else, and no set-apart ground exists at all.",
  moves: [
    "The page is 0.990 and the card is 0.997, a step of 0.007 that no eye resolves without the border.",
    "The menu is the same 0.997 as the card, so a menu over a card is one hairline over another.",
    "The set-apart ground is --muted at six alphas, and --muted also does hover, so a panel and a hover fill are the same token.",
    "Nothing between 0.450 and 0.905, so 37 sites dim text by compositing an alpha of the step above.",
  ],
  trade: "It ships.",
  decides: {
    mat: "There is no mat register. The set-apart ground is --muted at six alphas, and 40 percent over 0.990 is a one percent step.",
  },
  paper: {
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
  // Not a register today: this is what those sites RESOLVE to, rendered so the
  // board can put the shipped answer beside the proposed one.
  mat: {
    "--background": "oklch(0.965 0 0)",
    "--card": "oklch(0.997 0 0)",
    "--muted": "oklch(0.96 0 0)",
    "--border": "oklch(0.905 0 0)",
  },
};

const PAPER: LightSet = {
  id: "paper",
  label: "Paper",
  name: "Paper. The page steps down",
  thesis:
    "Give the card somewhere to lift from. The page drops to 0.977, a paper grey rather than a near white, and the card rises to 0.998, so the two are a real step apart and the hairline stops carrying the whole idea.",
  moves: [
    "The page is 0.977, the card 0.998, the menu 0.998: the floating layer is the brightest thing on the page, which is what floating means.",
    "The mat is a register of its own at 0.948, an independent grey and not a tint of the ink.",
    "The hover fill separates from the mat at 0.925, so a panel and a hover are finally two different things.",
    "--faint arrives at 0.620, which is exactly what the 19 sites at 70 percent already composite to.",
  ],
  trade:
    "The body is a paper grey rather than near white, which is the one thing a stranger notices first and the thing to look at on rows 08 and 12.",
  decides: {
    mat: "A register at 0.948, an independent grey, with the card back at 0.998 so a card on a mat still lifts.",
  },
  paper: {
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
  mat: {
    "--background": "oklch(0.948 0 0)",
    "--card": "oklch(0.998 0 0)",
    "--popover": "oklch(0.998 0 0)",
    "--muted": "oklch(0.925 0 0)",
    "--secondary": "oklch(0.9 0 0)",
    "--accent": "oklch(0.9 0 0)",
    "--faint": "oklch(0.62 0 0)",
    "--border": "oklch(0.885 0 0)",
    "--input": "oklch(0.885 0 0)",
  },
};

const BRIGHT: LightSet = {
  id: "bright",
  label: "Bright",
  name: "Bright. The card is the paper",
  thesis:
    "Keep the near-white page and stop pretending a card is a different white. The card IS the paper at 0.990 and its ring is the lift; only the floating layer is brighter than the page.",
  moves: [
    "The page and the card are both 0.990, so the card is defined by its ring and its shadow rather than by a step no eye resolves.",
    "The menu goes to 0.998, the one surface brighter than the page, because a menu is genuinely above it.",
    "Every other surface is a veil of the ink, so the whole set retunes from one value.",
    "--faint is a veil too, at 45 percent.",
  ],
  trade:
    "It leans entirely on depth: without a ring and a shadow a card disappears, which is why row 10 renders the cues on it.",
  decides: {
    mat: "A register, but derived: the mat is the ink at 5 percent, so it is a tint of the text and it follows the ink if the ink ever moves.",
  },
  paper: {
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
  mat: {
    // ★ NOT `inkVeil(5)`. A custom property whose own value reads `var()` on
    // ITSELF is a cycle: in real CSS the whole declaration becomes invalid at
    // computed-value time, and in this board's own reader it recursed until the
    // stack gave out (the 500 that caught it). The mat is derived from the CARD
    // instead, which is this set's paper white, so the value is the same 5
    // percent of ink over the same white and the chain is muted -> background
    // -> card -> a literal.
    "--background": "color-mix(in oklab, var(--foreground) 5%, var(--card))",
    "--card": "oklch(0.99 0 0)",
    "--popover": "oklch(0.998 0 0)",
    "--muted": inkVeil(9),
    "--secondary": inkVeil(13),
    "--accent": inkVeil(13),
    "--faint": inkVeil(45),
    "--border": inkVeil(15),
    "--input": inkVeil(18),
  },
};

const WARM_NEUTRAL = {
  paper: {
    "--background": "oklch(0.985 0 0)",
    "--foreground": "oklch(0.145 0 0)",
    "--card": "oklch(0.998 0 0)",
    "--card-foreground": "oklch(0.145 0 0)",
    "--popover": "oklch(0.999 0 0)",
    "--popover-foreground": "oklch(0.145 0 0)",
    "--primary": "oklch(0.145 0 0)",
    "--primary-foreground": "oklch(0.998 0 0)",
    "--secondary": "oklch(0.928 0 0)",
    "--secondary-foreground": "oklch(0.145 0 0)",
    "--muted": "oklch(0.952 0 0)",
    "--muted-foreground": "oklch(0.46 0 0)",
    "--faint": "oklch(0.62 0 0)",
    "--accent": "oklch(0.928 0 0)",
    "--accent-foreground": "oklch(0.145 0 0)",
    "--border": "oklch(0.895 0 0)",
    "--input": "oklch(0.895 0 0)",
    "--ring": "oklch(0.3 0 0)",
  },
  mat: {
    "--background": "oklch(0.952 0 0)",
    "--card": "oklch(0.998 0 0)",
    "--popover": "oklch(0.999 0 0)",
    "--muted": "oklch(0.928 0 0)",
    "--secondary": "oklch(0.9 0 0)",
    "--accent": "oklch(0.9 0 0)",
    "--faint": "oklch(0.62 0 0)",
    "--border": "oklch(0.885 0 0)",
    "--input": "oklch(0.885 0 0)",
  },
};

export const WARM_GAIN = 1.3;

const WARM_PAPER: LightSet = {
  id: "warm",
  label: "Warm",
  name: "Warm. Uncoated stock",
  thesis:
    "The page is paper, so make it paper: a warm white at 0.985 with hue 85, the mat warmer still, and the ink left dead neutral so black on it is still black.",
  moves: [
    "Every surface at 0.8 and up carries the cast; every text step stays at chroma 0, which is what keeps the type crisp on a warm ground.",
    "The page sits at 0.985 rather than 0.977, because a warm ground reads a shade deeper than a neutral one at the same lightness.",
    "The mat is at 0.952 and warmer than the page, the way an uncoated mat is warmer than the print on it.",
    "The chroma rises as the value darkens (0.005 at the page, 0.009 at the hairline), so the edges of a card are the warmest thing on it.",
  ],
  trade:
    "It re-opens the zero-chroma decision on the side where the case is weakest: a warm page very slightly yellows a white dress, and rows 05 and 08 are where that shows.",
  decides: {
    mat: "A register at 0.952, warmer than the page, with the card back at the top.",
  },
  paper: tint(WARM_NEUTRAL.paper, false, "warm", WARM_GAIN),
  mat: tint(WARM_NEUTRAL.mat, false, "warm", WARM_GAIN),
};

const COOL_NEUTRAL = {
  paper: {
    "--background": "oklch(0.99 0 0)",
    "--foreground": "oklch(0.145 0 0)",
    "--card": "oklch(0.999 0 0)",
    "--card-foreground": "oklch(0.145 0 0)",
    "--popover": "oklch(0.999 0 0)",
    "--popover-foreground": "oklch(0.145 0 0)",
    "--primary": "oklch(0.145 0 0)",
    "--primary-foreground": "oklch(0.999 0 0)",
    "--secondary": "oklch(0.925 0 0)",
    "--secondary-foreground": "oklch(0.145 0 0)",
    "--muted": "oklch(0.955 0 0)",
    "--muted-foreground": "oklch(0.46 0 0)",
    "--faint": "oklch(0.62 0 0)",
    "--accent": "oklch(0.925 0 0)",
    "--accent-foreground": "oklch(0.145 0 0)",
    "--border": "oklch(0.9 0 0)",
    "--input": "oklch(0.9 0 0)",
    "--ring": "oklch(0.3 0 0)",
  },
};

export const COOL_GAIN = 0.8;

const COOL_PAPER: LightSet = {
  id: "cool",
  label: "Cool",
  name: "Cool. A gallery wall, on a true grey mat",
  thesis:
    "A daylight page at 0.990 with a trace of 250, and a mat that is DEAD NEUTRAL rather than a tint of anything, because a gallery mat is a true grey so the work on it is the only colour on the wall.",
  moves: [
    "The page takes the smallest cast of any set here (0.002 at the page, 0.006 at the hairline): a cool tint reads about twice as strongly as a warm one at the same chroma.",
    "The mat is a hand-written 0.950 at chroma 0, the one block on this board that no transform produced, which is the whole answer to a grey that is not a tint of the text.",
    "Ink stays neutral, as it does on every light set, so the only thing the cast reaches is the surfaces.",
    "A cool page makes a warm photograph read warmer, so this is the light half of the argument Slate makes on the dark half.",
  ],
  trade:
    "A cool ground can read as clinical next to a candle-lit photograph, and its mat deliberately disagrees with its own page, which is either the point or a seam.",
  decides: {
    mat: "A register at 0.950 and dead neutral, deliberately not a tint of the page it sits in.",
  },
  paper: tint(COOL_NEUTRAL.paper, false, "cool", COOL_GAIN),
  // Hand-written, not cast: the mat being a true grey is this set's argument.
  mat: {
    "--background": "oklch(0.95 0 0)",
    "--card": "oklch(0.999 0.002 250)",
    "--popover": "oklch(0.999 0.002 250)",
    "--muted": "oklch(0.92 0 0)",
    "--secondary": "oklch(0.9 0 0)",
    "--accent": "oklch(0.9 0 0)",
    "--faint": "oklch(0.62 0 0)",
    "--border": "oklch(0.89 0 0)",
    "--input": "oklch(0.89 0 0)",
  },
};

export const LIGHTS: LightSet[] = [
  TODAY_LIGHT,
  PAPER,
  BRIGHT,
  WARM_PAPER,
  COOL_PAPER,
];
export const LIGHT_BY_ID = Object.fromEntries(
  LIGHTS.map((l) => [l.id, l]),
) as Record<LightId, LightSet>;

/** What this board would rule if it had to, and the sentence that says why the
 *  split is what produced it. */
export const RECOMMENDATION = {
  dark: "ember" as DarkId,
  light: "paper" as LightId,
  why: "Ember on the dark side and Paper on the light one, which is a pair no earlier round could have named. Warming used to be one switch over both modes, and the reason to decline it was that a warm room and a warm page are one decision. They are not. On a dark ground the cast is doing work (skin against a room, and a room that stops reading as a dead screen); on paper the same cast is a tax paid by every white dress and every document. Split the ruling and the answer separates: warm the room, leave the page a true grey, and let the well stay the least tinted surface in the product. For anyone who wants the zero-chroma decision kept exactly as globals.css records it, Ladder is Ember's rhythm at chroma 0 and the rest of the board reads the same.",
};

/* ── The dark card: as declared, opaque, or a veil ───────────────────────── */

/**
 * Today ships ONE translucent surface in the whole system (`--card` in the
 * room at 0.62), and round one's departure list said only the derived set kept
 * it. That was wrong: a color-mix off the room is fully opaque, so every
 * candidate retires the veil and none of them said so. It is a choice instead
 * of a side effect: every set renders at its declared value, forced opaque, or
 * forced to a veil at the same lightness, and the specimen is a card lying over
 * a photograph, which is the only place the difference is a look.
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

function applyCardMode(set: DarkSet, mode: CardMode): DarkSet {
  if (mode === "declared") return set;
  const fix = (m: TokenMap) => {
    const card = m["--card"];
    if (!card) return m;
    return {
      ...m,
      "--card": mode === "veil" ? withAlpha(card, 0.62) : stripAlpha(card),
    };
  };
  return { ...set, room: fix(set.room), slab: fix(set.slab) };
}

/**
 * ★ THE FAINT RULING IS A SET EDIT, NOT A RENDERER FLAG (round three, kept).
 * "Out" does not mean "draw the third step differently", it means the new
 * custom property is never declared, so it has to reach every reader at once or
 * the dock is labelling a switch that changes nothing. Dropping the key does
 * all of it:
 *
 *   the ladder  draws the hatched "none" rung it already draws for today,
 *               which declares no --faint either. The missing step, missing.
 *   the copy    every specimen paints the third step from
 *               `var(--faint, <the alpha the 37 sites composite by hand>)`, so
 *               the fallback takes over and the grounds give different faints,
 *               which is the whole argument for the token.
 *   the paste   stops printing the line in every block.
 *
 * Do NOT "fix" a renderer by hard-coding one answer: the fallback inside the
 * `var()` is the evidence, and this is the single place the answer lives.
 */
const dropFaint = (m: TokenMap): TokenMap => {
  const out = { ...m };
  delete out["--faint"];
  return out;
};

/**
 * The pair with every switch answered, which is what every renderer and the
 * paste read, so the board can never show one thing and paste another.
 */
export function resolvePair(
  pair: Pair,
  cardMode: CardMode,
  faint = true,
): Pair {
  const dark = applyCardMode(pair.dark, cardMode);
  const light = pair.light;
  if (faint) return { dark, light };
  return {
    dark: {
      ...dark,
      room: dropFaint(dark.room),
      slab: dropFaint(dark.slab),
    },
    light: {
      ...light,
      paper: dropFaint(light.paper),
      mat: dropFaint(light.mat),
    },
  };
}

/* ── Applying a pair to a stage ─────────────────────────────────────────── */

/** The board's grounds: the shell's five, plus the mat, which is a paper stage
 *  wearing the mat block (exactly how the slab is a paper stage wearing the ink
 *  block). */
export type BoardGround = Ground | "mat";

/** The theme class each board ground carries. The shell's Stage sets this
 *  itself; a TrueViewport iframe is a separate document, so its own root needs
 *  a copy. The slab and the mat both render on a PAPER page, which is their
 *  real case, and their block rides inline on the same element. */
export const GROUND_CLASS: Record<BoardGround, string> = {
  cinema: "dark",
  paper: "surface-paper",
  mat: "surface-paper",
  ink: "surface-paper",
  "app-dark": "dark",
  "app-light": "surface-paper",
};

/** The shell ground a board ground renders on. */
export function stageGround(g: BoardGround): Ground {
  return g === "mat" ? "paper" : g;
}

/**
 * The token overrides for one ground, as an inline style. Custom properties are
 * inherited and a declaration applies to the element it sits on, so a wrapper
 * carrying these plus `bg-background` repaints its whole subtree in the pair's
 * colours while the Stage keeps the real `.dark` / `.surface-paper` class the
 * `dark:` variants need.
 *
 * The slab and the mat are deliberately layered on the PAPER block: both of
 * their common cases are a leaf inside a light page, and that is the case that
 * exposes today's gap (no --card in `.surface-ink`, so a Card in the footer
 * renders near white). The well is spread under everything, in both modes,
 * because it belongs to neither.
 */
export function pairStyle(
  pair: Pair,
  ground: BoardGround,
): React.CSSProperties {
  const base =
    ground === "paper" || ground === "app-light"
      ? pair.light.paper
      : ground === "mat"
        ? { ...pair.light.paper, ...pair.light.mat }
        : ground === "ink"
          ? { ...pair.light.paper, ...pair.dark.slab }
          : pair.dark.room;
  return {
    ...pair.dark.well,
    ...base,
    ...(ground === "cinema"
      ? { "--background": pair.dark.cinemaBackground }
      : null),
  } as React.CSSProperties;
}

/** The token block one ground resolves to, for a reading rather than a render. */
export function blockFor(pair: Pair, ground: BoardGround): TokenMap {
  return pairStyle(pair, ground) as unknown as TokenMap;
}

/* ── Reading a value back, for the ladder labels ─────────────────────────── */

const OKLCH = /^oklch\(\s*([\d.]+)/;
/** `color-mix(in oklab, var(--a) N%, <rest>)`: the two operands and the ratio,
 *  read out of the string rather than assumed. The old form hard-coded
 *  `var(--foreground)` and `var(--background)`, which was wrong twice over: it
 *  missed the shipped slab's `var(--gallery)` mix entirely, and it resolved a
 *  mat whose own background is a mix by looking that background up again. */
const MIX = /^color-mix\(in oklab,\s*var\((--[\w-]+)\)\s*([\d.]+)%,\s*(.+)\)$/;

/**
 * The lightness of a token value in a given block, or null when the string is
 * not a lightness at all. Handles the veil form, so a derived set's ladder
 * reads off the same strings it renders rather than a second copy of the
 * numbers.
 *
 * A translucent value still HAS a lightness (today's dark card is 0.21 at 62
 * percent), so it is returned; `alphaOf` is the separate question.
 */
export function lOf(value: string, block: TokenMap, depth = 0): number | null {
  // A guard rather than a trust: a token block is data a candidate author
  // writes, and one self-reference in it used to take the whole page down with
  // a stack overflow rather than a wrong number.
  if (depth > 6) return null;
  const v = value.trim();
  const mix = MIX.exec(v);
  if (mix) {
    const a = lOf(block[mix[1]] ?? "", block, depth + 1);
    const pct = Number(mix[2]) / 100;
    const restRaw = mix[3].trim();
    const ref = /^var\((--[\w-]+)\)$/.exec(restRaw);
    const b = ref
      ? lOf(block[ref[1]] ?? "", block, depth + 1)
      : lOf(restRaw, block, depth + 1);
    if (a === null || b === null) return null;
    return a * pct + b * (1 - pct);
  }
  const hit = OKLCH.exec(v);
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

/** The dark set's grounds, in the order the model names them. */
export function roomsOf(set: DarkSet) {
  return [
    { name: "cinema", value: set.cinemaBackground },
    { name: "the room", value: set.room["--background"] },
    {
      name: "the slab",
      value:
        set.slab["--background"] === "var(--gallery)"
          ? set.well["--gallery"]
          : set.slab["--background"],
    },
    { name: "the well", value: set.well["--gallery"] },
  ];
}

/** The light set's two grounds, the same way. */
export function papersOf(set: LightSet) {
  return [
    { name: "the paper", value: set.paper["--background"] },
    {
      name: "the mat",
      value: set.mat["--background"] ?? set.paper["--muted"],
    },
  ];
}

/* ── The accent ─────────────────────────────────────────────────────────── */

export type AccentId = "ink" | "blue" | "violet" | "flare";

export type Accent = {
  id: AccentId;
  label: string;
  /** The dock's label. The wall wants the hue number, the dock wants the room:
   *  three segmented controls plus the two candidate switches do not fit on one
   *  line at 1440 with "Violet 300" in them. */
  short: string;
  name: string;
  why: string;
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
    short: "Ink",
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
    short: "Blue",
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
    short: "Violet",
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
    short: "Flare",
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

/**
 * THE ACCENT'S REACH, which round three asked without ever rendering (round
 * four's own finding on its own board: a control that names an ask has to move
 * a pixel, and this ask had no control at all). Three jobs, and a ruling can
 * hand the hue any subset of them; a job outside the reach falls back to ink,
 * which is exactly what the ruling would land.
 */
export type ReachId = "all" | "attention" | "identity";

export const REACHES: {
  id: ReachId;
  label: string;
  short: string;
  note: string;
}[] = [
  {
    id: "all",
    label: "All three",
    short: "All",
    note: "Identity, attention and the stand-in for a photograph all take the hue.",
  },
  {
    id: "attention",
    label: "Attention",
    short: "Attention",
    note: "Only the things asking to be noticed: the badge, the wizard step, the toast. The mark and the frames stay ink.",
  },
  {
    id: "identity",
    label: "Identity",
    short: "Identity",
    note: "Only the mark and the frames family. Attention stays ink, which keeps a state colour the only colour in the app.",
  },
];

/** The three jobs, as the accent wall renders them. */
export const ACCENT_JOBS = ["identity", "attention", "stand-in"] as const;
export type AccentJob = (typeof ACCENT_JOBS)[number];

/** Whether a job takes the hue under a given reach. */
export function jobTakesAccent(job: AccentJob, reach: ReachId): boolean {
  if (reach === "all") return true;
  if (reach === "attention") return job === "attention";
  return job === "identity" || job === "stand-in";
}

/** `--brand` plus its foreground, which is the whole accent change: BRAND_HITS
 *  utilities in BRAND_FILES files read these two tokens and nothing else. */
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

/* ── The measured counts ────────────────────────────────────────────────── */

/**
 * Every alpha the set-apart ground ships at, with its count.
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
 * and change these numbers rather than any sentence that quotes them: the board
 * and BoardMeta both read MAT_USES below.
 */
export const MAT_ALPHAS = [
  { alpha: 20, uses: 2 },
  { alpha: 30, uses: 4 },
  { alpha: 40, uses: 17 },
  { alpha: 50, uses: 6 },
  { alpha: 60, uses: 4 },
  { alpha: 70, uses: 2 },
];

export const MAT_USES = MAT_ALPHAS.reduce((n, a) => n + a.uses, 0);
/** Plus the hover fills that wear the same utility and are NOT the mat. */
export const MAT_HOVER_USES = 8;

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

/* ── The grounds, counted by the job they do ────────────────────────────── */

/**
 * ROUND TWO SHARPENED THIS AND ROUND FOUR ANSWERS IT.
 *
 * Round one said `--gallery` was doing two jobs, "a lightbox and a footer
 * slab". Re-read at ca952b5, the lightbox is not one of them: it paints its
 * backdrop with a literal `bg-black/90` (media-lightbox.tsx's DialogOverlay),
 * so the deepest surface in the product does not read the token at all. What
 * `--gallery` does is the WELL behind media and, through `.surface-ink`, the
 * footer SLAB, and those two want opposite things: a well should vanish under a
 * photograph, a slab has to hold type and sit on paper without punching a hole
 * in the page. Under the register model they stop being one token: the well is
 * the well and the slab is dark's raised register.
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

/** Whether this dark set keeps a separate marketing room. */
export function keepsCinemaOverride(set: DarkSet): boolean {
  return set.cinemaBackground !== set.room["--background"];
}

/** Whether this dark set keeps a slab register distinct from its room. */
export function keepsSlabRegister(set: DarkSet): boolean {
  return set.slab["--background"] !== set.room["--background"];
}

/** The ruling, as the paste the Orchestrator makes into globals.css. Takes the
 *  RESOLVED pair, so the questions the board is showing are the questions that
 *  land. */
export function tokenBlock(pair: Pair): string {
  const { dark, light } = pair;
  const lines = [
    "/* globals.css: light mode, the paper register */",
    ":root,",
    ".surface-paper {",
    order(light.paper),
    "}",
    "",
    "/* light mode, the mat register (new: the set-apart ground) */",
    ".surface-mat {",
    order(light.mat),
    "}",
    "",
    "/* dark mode, the room register */",
    ".dark {",
    order(dark.room),
    "}",
    "",
    "/* dark mode, the slab register (the footer leaf on a paper page) */",
    ".surface-ink {",
    order(dark.slab),
    "}",
    "",
    "/* the media well: one value, both modes, always dark */",
    ":root,",
    ".surface-paper {",
    order(dark.well),
    "}",
    "",
  ];
  if (keepsCinemaOverride(dark)) {
    lines.push(
      "/* marketing.css: marketing keeps a deeper room than the app */",
      '.dark[data-mkt-skin="cinema"] {',
      `  --background: ${dark.cinemaBackground};`,
      "}",
      'body:has([data-mkt-skin="cinema"]) {',
      `  background: ${dark.cinemaBackground};`,
      "}",
    );
  } else {
    lines.push(
      "/* marketing.css: DELETE the cinema override. The room is cinema. */",
      '/* .dark[data-mkt-skin="cinema"] { --background: … }   <- remove */',
      '/* body:has([data-mkt-skin="cinema"]) { background: … } <- remove */',
    );
  }
  return lines.join("\n");
}

/**
 * The accent half of the paste. Ink is the alias that ships, so it prints
 * nothing: a ruling of "ink" is a ruling to change no line.
 *
 * The third block is the one that is easy to miss. `.surface-ink` declares
 * `--brand: var(--gallery-foreground)` today, which NEUTRALISES any hue on the
 * footer leaf, and that line outranks an inherited value from the page around
 * it. So a hue that is not also written into the slab block reaches every
 * surface in the product except the one place the mark actually sits at the
 * bottom of every page.
 *
 * The reach rides along as a comment rather than as CSS, because it is a change
 * to which call sites read `--brand` rather than to the token's value.
 */
export function accentBlock(accent: Accent, reach: ReachId = "all"): string {
  if (accent.id === "ink") return "";
  const head =
    reach === "all"
      ? "/* globals.css, the accent: all three jobs */"
      : reach === "attention"
        ? "/* globals.css, the accent: attention only. The mark and the frames keep var(--primary) at their call sites. */"
        : "/* globals.css, the accent: identity only. The badge, the wizard step and the toast keep var(--primary) at their call sites. */";
  return [
    head,
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
    "/* the slab neutralises --brand today; the accent has to reach it */",
    ".surface-ink {",
    `  --brand: ${accent.dark};`,
    `  --brand-foreground: ${accent.darkForeground};`,
    "}",
  ].join("\n");
}

/* ── Applying a candidate to the real site ──────────────────────────────── */

/**
 * THE WALK. A set is only truly wrong on a page someone reads, so every pair is
 * offered as the paste its ruling would land, handed to the whole site through
 * the shell's setCandidateCss. Two of the asks cannot be judged from tokens
 * alone, because they are utility classes rather than values, so they ride
 * along as optional rules:
 *
 *   the mat     MAT_USES sites write `bg-muted/<alpha>`; the ruling turns them
 *               into a register, so the walk paints them the mat's own ground.
 *   --faint     FAINT_USES sites write `text-muted-foreground/<alpha>`; the
 *               ruling would point them at the new step. The TOKEN half of that
 *               ruling is not here: it rides the resolved pair, so a ruling of
 *               "out" reaches this block as a pair with no --faint left to
 *               print.
 *
 * Both are matched on the class attribute with a leading space or start anchor,
 * so a VARIANT of the same utility (`hover:bg-muted/40`, which is a hover fill
 * and not a mat) is left alone. Specificity ties Tailwind's own utility and this
 * block renders after every stylesheet, so the later rule wins with no
 * `!important` anywhere. Lab only: the islands that render it are key-gated and
 * the block lives in one browser.
 */
export function matRegisterCss(light: LightSet): string {
  const bg = light.mat["--background"] ?? "var(--muted)";
  return `/* the walk: every set-apart panel on the mat register, retiring the six alphas */
[class^="bg-muted/"],
[class*=" bg-muted/"] {
  background-color: ${bg};
}`;
}

export const FAINT_ON_DIMMED_CSS = `/* the walk: the alpha-dimmed text sites reaching the new step */
[class^="text-muted-foreground/"],
[class*=" text-muted-foreground/"] {
  color: var(--faint);
}`;

export type ApplyOptions = {
  accent: Accent;
  reach: ReachId;
  matRegister: boolean;
  faintOnDimmed: boolean;
};

/** What "Apply to the site" hands the shell: the ruled paste plus whatever the
 *  dock's switches are currently claiming, in that order. */
export function applyCss(pair: Pair, opts: ApplyOptions): string {
  return [
    tokenBlock(pair),
    accentBlock(opts.accent, opts.reach),
    opts.matRegister ? matRegisterCss(pair.light) : "",
    opts.faintOnDimmed ? FAINT_ON_DIMMED_CSS : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** The label the tuner panel and the board badge both show. `name` is the
 *  palette's own (the catalog round, 2026-09-15): a reviewer picked ONE thing
 *  and the badge should say the thing he picked, not the two halves it is
 *  assembled from. Without it the label falls back to the two set names, which
 *  is what a board with two candidate switches needed. */
export function applyLabel(
  pair: Pair,
  opts: ApplyOptions,
  name?: string,
): string {
  const parts = name
    ? [name.toLowerCase()]
    : [
        `${pair.dark.label.toLowerCase()} dark`,
        `${pair.light.label.toLowerCase()} light`,
      ];
  if (opts.accent.id !== "ink") {
    parts.push(
      opts.reach === "all"
        ? opts.accent.label.toLowerCase()
        : `${opts.accent.label.toLowerCase()} on ${opts.reach}`,
    );
  }
  if (opts.matRegister) parts.push("the mat as a register");
  if (opts.faintOnDimmed) parts.push("faint on the dimmed sites");
  return `palette: ${parts.join(", ")}`;
}

/**
 * The pages a pair is walked on, listed on the board beside the buttons and in
 * BoardMeta, every one of them with the lab key on the end.
 *
 * The guest page joined the walk in round three, and not from this lane:
 * launch-prep mounted the key-gated AppDesignIsland in the (guest) layout at
 * fb395fe. Its path carries the demo event's token, which lives in the env
 * rather than in this file, so the row is marked `demo` and the board fills it
 * in (and drops it when no demo event is configured).
 */
export const WALK: {
  href: string;
  name: string;
  note: string;
  demo?: boolean;
}[] = [
  { href: "/", name: "the home arc", note: "room into paper into slab" },
  {
    href: "/pricing",
    name: "pricing",
    note: "the mat, the cards, the table",
  },
  { href: "/help", name: "help", note: "the facts band and the closer panel" },
  { href: "/contact", name: "contact", note: "the fifth ground, now the mat" },
  {
    href: "/dashboard",
    name: "the dashboard",
    note: "signed in, both modes, then one click to an event",
  },
  {
    href: "/e/",
    name: "the demo guest page",
    note: "the album on the well, the surface every guest sees",
    demo: true,
  },
  {
    href: "/design/library/rules",
    name: "the bible",
    note: "rule 1, as it stands",
  },
];
