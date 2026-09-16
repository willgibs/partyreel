import {
  ACCENT_BY_ID,
  DARK_BY_ID,
  LIGHT_BY_ID,
  type Accent,
  type AccentId,
  type DarkId,
  type DarkSet,
  type LightId,
  type LightSet,
  type Pair,
} from "./registers";

/**
 * THE CATALOG (round six, the clarity round, 2026-09-15).
 *
 * ★ WHY THIS FILE EXISTS. Rounds one to five built a MACHINE: six dark sets,
 * five light sets, four accents and five switches, thirty pairs times four hues
 * times eight combinations of the remaining calls. Will read it and said so
 * ("it almost feels like I'm reading a PhD on color theory... a dozen polished
 * variants with preview palettes with some demo UI to config & compare would've
 * been far more helpful"). A configuration space is not a choice. A CATALOG is:
 * twelve finished answers with names, each one complete, each one pickable.
 *
 * So this file is the curation layer over `registers.ts`, and nothing else. It
 * invents no value: every palette is one dark set plus one light set plus an
 * accent plus the mat call, all of them already argued and already pinned by
 * `registers.test.ts`. What it adds is the one thing the machine could not:
 * SOMEONE CHOSE. Twelve combinations out of the hundreds the switches allow,
 * each picked because it is a coherent answer rather than a reachable state.
 *
 * ★ THE RULE FOR ADDING ONE. A palette earns a row only if a reviewer could
 * prefer it FOR A REASON he could say out loud: a warmer room, a page that
 * stays white, no new hue to hold, the smallest possible change. Two rows that
 * differ only in a number are one row. Fewer than eight is not a catalog and
 * more than sixteen is a wall, which is why twelve is the standing size.
 */
export type PaletteDef = {
  /** The ledger's token, and the dock's option id. */
  id: string;
  /** One word, the name on the card and in the dock. */
  name: string;
  /**
   * The whole palette in one line of plain words, in one fixed order: the dark
   * room, then the page, then the accent. This is the line Will reads on the
   * card AND the `means` line of the catalog ask, so it is written once.
   */
  line: string;
  /** The one reason to prefer this one, or the one thing it costs. */
  why: string;
  dark: DarkId;
  light: LightId;
  accent: AccentId;
  /**
   * Whether the set-apart panel is its own ground. Every proposal says yes;
   * Today says no, because today it is `--muted` at six alphas of a token that
   * also does hover.
   */
  mat: boolean;
  recommended?: boolean;
};

export const PALETTES: PaletteDef[] = [
  {
    id: "today",
    name: "Today",
    line: "The site exactly as it ships: three darks with no ladder behind them, a near-white page where a card is its hairline, and no accent colour at all.",
    why: "The one to come back to. Every other card is judged against this, and a ruling of Today is a ruling to change no line.",
    dark: "today",
    light: "today",
    accent: "ink",
    mat: false,
  },
  {
    id: "ember",
    name: "Ember",
    line: "A warm dark room, a true grey page, the flare accent.",
    why: "Warm the room and leave the page alone: the cast does real work against skin on a dark ground and is a tax on paper. The only pair the old one-switch shape could not have produced.",
    dark: "ember",
    light: "paper",
    accent: "flare",
    mat: true,
    recommended: true,
  },
  {
    id: "ladder",
    name: "Ladder",
    line: "A neutral dark in three real steps, a true grey page, the flare accent.",
    why: "Ember's exact rhythm at chroma zero, for keeping the zero-chroma decision globals.css records as closed. Everything else on the board reads the same.",
    dark: "ladder",
    light: "paper",
    accent: "flare",
    mat: true,
  },
  {
    id: "slate",
    name: "Slate",
    line: "A cold dark room, a daylight page, the blue already in the system as the accent.",
    why: "A cool ground makes a warm photograph read warmer, which is the one thing a media product's ground can do for its media. No new hue: the accent is the save blue.",
    dark: "slate",
    light: "cool",
    accent: "blue",
    mat: true,
  },
  {
    id: "gallery",
    name: "Gallery",
    line: "A neutral dark in three steps, a daylight page on a dead grey mat, and no accent colour at all.",
    why: "The purist reading kept whole: nothing in the chrome is coloured, so the photographs are the only colour anywhere. It leaves a section with no photograph in it with no colour either.",
    dark: "ladder",
    light: "cool",
    accent: "ink",
    mat: true,
  },
  {
    id: "studio",
    name: "Studio",
    line: "One dark room with every surface derived from it, a page where the card IS the paper, and no accent colour.",
    why: "One number tunes the whole dark side and the ladder can never drift. It leans entirely on depth: without a ring and a shadow the card disappears.",
    dark: "room",
    light: "bright",
    accent: "ink",
    mat: true,
  },
  {
    id: "loft",
    name: "Loft",
    line: "A dark that is never black, a page where the card is the paper, and the reel's violet promoted to the accent.",
    why: "At 0.195 the dark already reads as a leaf on a page, so there is one dark ground instead of two. A dark chapter loses most of its drama and an OLED phone loses the true-black economy.",
    dark: "lift",
    light: "bright",
    accent: "violet",
    mat: true,
  },
  {
    id: "press",
    name: "Press",
    line: "Warm on both sides: a warm dark room and warm uncoated paper, with the flare accent.",
    why: "One temperature through the whole product, so nothing flips at the seam where a dark chapter meets the body. The page very slightly yellows a white dress, which is the case the cast is weakest against.",
    dark: "ember",
    light: "warm",
    accent: "flare",
    mat: true,
  },
  {
    id: "reel",
    name: "Reel",
    line: "A cold dark room, a true grey page, and the product's own violet as the accent.",
    why: "The product is named for the reel, so the accent and the signature moment become one hue. The reel icon stops being special once everything else is violet too.",
    dark: "slate",
    light: "paper",
    accent: "violet",
    mat: true,
  },
  {
    id: "signal",
    name: "Signal",
    line: "One derived dark room, a true grey page, and the save blue promoted to the accent.",
    why: "The answer with no new hue to hold anywhere in it: every colour on the card already ships. It is also the default accent of every product on the internet.",
    dark: "room",
    light: "paper",
    accent: "blue",
    mat: true,
  },
  {
    id: "daylight",
    name: "Daylight",
    line: "A warm dark room against a daylight page, with the flare accent.",
    why: "Deliberately cross-cast: the room is warm and the page is cool, the way a print is warm and the wall it hangs on is not. The temperature flips at the seam, which is either the point or a fault.",
    dark: "ember",
    light: "cool",
    accent: "flare",
    mat: true,
  },
  {
    id: "dusk",
    name: "Dusk",
    line: "A warm dark room, today's near-white page kept exactly as it is, and the flare accent.",
    why: "The smallest change that still moves anything: the dark side is fixed and the light side is not touched. The page keeps its five surfaces inside 0.037, so a card stays its hairline.",
    dark: "ember",
    light: "today",
    accent: "flare",
    mat: true,
  },
];

export const PALETTE_BY_ID = Object.fromEntries(
  PALETTES.map((p) => [p.id, p]),
) as Record<string, PaletteDef>;

/** The one this board would rule, which is what the verdict names. */
export const RECOMMENDED_PALETTE =
  PALETTES.find((p) => p.recommended) ?? PALETTES[0];

/** A palette's parts, resolved. Every renderer and the paste read this, so the
 *  board can never show one thing and paste another. */
export type ResolvedPalette = {
  def: PaletteDef;
  pair: Pair;
  darkSet: DarkSet;
  lightSet: LightSet;
  accent: Accent;
};

export function resolvePalette(id: string): ResolvedPalette {
  const def = PALETTE_BY_ID[id] ?? RECOMMENDED_PALETTE;
  const darkSet = DARK_BY_ID[def.dark];
  const lightSet = LIGHT_BY_ID[def.light];
  return {
    def,
    darkSet,
    lightSet,
    accent: ACCENT_BY_ID[def.accent],
    pair: { dark: darkSet, light: lightSet },
  };
}

/** The dock's options, and the catalog ask's, from one list. The test pins that
 *  the two sets are equal, which is what makes picking a card a preview. */
export const PALETTE_OPTIONS = PALETTES.map((p) => ({
  id: p.id,
  label: p.name,
}));
