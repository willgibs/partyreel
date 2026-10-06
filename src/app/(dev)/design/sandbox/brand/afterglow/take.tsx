"use client";

import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
} from "react";

import type { SlideId } from "../deck/contract";
import type { ReelId } from "../deck/media";
import {
  type Ground,
  type Paper,
  ROOM,
  ROOM_INK,
  type Source,
  type Tile,
  type Tone,
} from "./system";

/**
 * A TAKE: ONE COMPLETE AFTERGLOW, AS THE DECK READS IT.
 *
 * Round two asks "Which Afterglow?" as three takes that share the idea and
 * differ in a few load-bearing constructions. Every slide is one composition
 * all three draw (`slides/`), so pressing between takes on the stage compares
 * like with like; what a take changes reaches the slide through this contract:
 *
 *  - its PAPER, the stock a light page is printed on (its tint is argued);
 *  - its LIGHT, the primitives every slide draws light with: the Ring, the
 *    Seam, the Bloom, the seed's atmosphere, the icon, each handed a `Source`
 *    and a ground, never a finished colour, because the takes read a source
 *    differently and above all draw it differently on paper;
 *  - three placements on paper (`onPaper`): where the one live subject stands,
 *    what the page's foot is, and what a printed card is;
 *  - its WORDS, the lines a slide says that argue this take and no other.
 *
 * ★ ROUND TWO'S HARDEST PROBLEM IS PAPER (Will, desk 4: "it is very tough to
 * nail on anything light. It's washed out easily"). Each take answers it with
 * one construction, said in its words' `rule`: where the light may and may not
 * appear on paper, what it becomes there and what carries it.
 */

/* ── what a take's primitives are handed ──────────────────────────────────── */

type Box = { className?: string; style?: CSSProperties };

export type RingProps = Box & {
  source: Source;
  ground: Ground;
  /** The face's diameter (px). */
  size?: number;
  /** 0 to 1 while a run sends; absent at rest. */
  progress?: number;
  glyph?: "add" | "done" | "none";
  breathe?: boolean;
  /** Its accessible name where it stands for the real button. */
  label?: string;
};

export type SeamProps = Box & {
  source: Source;
  ground: Ground;
  /** The edge it is born at: the box's top (light falls down) or its bottom. */
  edge?: "top" | "bottom";
  /** How far it may reach from its edge (px); a take's paper form may use less. */
  reach?: number;
  /** 0 to 1, its strength at the edge. */
  strength?: number;
  /** The box's width (px), for a form that lays itself out along the edge. */
  width?: number;
  /** The event's credits, for a take that prints them along the edge. */
  credits?: readonly string[];
};

export type WallSeamProps = Box & {
  /** The wall's bottom row, as laid out (`wallOf(...).bottom`). */
  tiles: readonly Tile[];
  width: number;
  ground: Ground;
  reach?: number;
  strength?: number;
};

export type BloomProps = Box & {
  source: Source;
  ground: Ground;
  children: ReactNode;
  /** The subject's corner (px), so the light follows its shape. */
  radius?: number;
  /** The subject's larger side (px): the light's reach is scaled from it. */
  size?: number;
  ignite?: boolean;
};

export type ReelBloomProps = Box & {
  reel: ReelId;
  ground: Ground;
  /** The reel's drawn width (px): the light's reach is scaled from it. */
  width: number;
  radius?: number;
  focus?: string;
};

export type SeedProps = Box & {
  seed: string;
  ground: Ground;
  children?: ReactNode;
};

export type Appearance = "room" | "paper" | "tinted";

export type IconProps = Box & {
  size?: number;
  appearance?: Appearance;
  /** Draw at another size's optics (a small cut, enlarged). */
  optics?: number;
  read?: string;
};

export type SymbolProps = Box & {
  /** The ring's outer diameter (px). */
  size?: number;
  ground: Ground;
};

export type ReceiptProps = Box & {
  source: Source;
  ground: Ground;
  width?: number;
  height?: number;
};

export type TakeLight = {
  Ring: (p: RingProps) => ReactNode;
  Seam: (p: SeamProps) => ReactNode;
  WallSeam: (p: WallSeamProps) => ReactNode;
  Bloom: (p: BloomProps) => ReactNode;
  ReelBloom: (p: ReelBloomProps) => ReactNode;
  SeedCover: (p: SeedProps) => ReactNode;
  AppIcon: (p: IconProps) => ReactNode;
  Symbol: (p: SymbolProps) => ReactNode;
  /** Where a light came from, printed small: how this take shows its source. */
  Receipt: (p: ReceiptProps) => ReactNode;
};

/* ── what a take says ─────────────────────────────────────────────────────── */

/** A form's line on each ground (the signature slide's captions). */
export type FormWords = { readonly room: string; readonly paper: string };

export type TakeWords = {
  /** The cover's kicker under the name: the take in a sentence. */
  readonly line: string;
  /** The cover's caption on its paper half: what the photograph does there. */
  readonly coverPaper: string;
  /** The idea's headline, two short lines. */
  readonly headline: readonly [string, string];
  /** The idea's argument, two or three sentences. */
  readonly argument: string;
  /** THE PAPER RULE, a line each (the brief's three, and the never). */
  readonly rule: {
    readonly may: string;
    readonly becomes: string;
    readonly carries: string;
    readonly never: string;
  };
  /** The icon's paragraph: what the mark is in this take. */
  readonly icon: string;
  /** The icon on paper, a line. */
  readonly iconPaper: string;
  /** Color and status: how a source is drawn on paper, a line. */
  readonly colourPaper: string;
  /** The signature's three forms, a line on each ground. */
  readonly forms: {
    readonly ring: FormWords;
    readonly seam: FormWords;
    readonly bloom: FormWords;
  };
  /** Without media: the seed on paper, a line. */
  readonly seedPaper: string;
  /** Type, imagery, motion: the light's motion in this take, a line. */
  readonly motion: string;
  /** Dark and light: the rhythm on paper, a paragraph. */
  readonly rhythm: string;
  /** Dark and light: round one's paper beside this take's, a caption each. */
  readonly roundOne: string;
  readonly thisTake: string;
  /** Each touchpoint's note: what it proves. */
  readonly notes: {
    readonly hero: string;
    readonly darkPage: string;
    readonly lightPage: string;
    readonly hub: string;
    readonly share: string;
    readonly home: string;
  };
};

/* ── the take ─────────────────────────────────────────────────────────────── */

export type TakeId = "aperture" | "ink" | "cast";

export type Take = {
  readonly id: TakeId;
  /** Its name as the agency titles it. */
  readonly name: string;
  /** Its paper stock. */
  readonly paper: Paper;
  /**
   * WHERE THINGS STAND ON PAPER, the placements a take argues:
   *  - `subject`: the ground the one live subject is drawn on, on a paper
   *    page (the Pro card, a code card): "room" makes it a piece of the room;
   *  - `foot`: the ground of a paper page's foot;
   *  - `print`: the ground of a printed card (the table card).
   */
  readonly onPaper: {
    readonly subject: Ground;
    readonly foot: Ground;
    readonly print: Ground;
  };
  readonly light: TakeLight;
  readonly words: TakeWords;
  /** A slide this take draws its own way, replacing the shared composition. */
  readonly slides?: Partial<
    Record<SlideId, (p: { screen: "1440" | "375" }) => ReactNode>
  >;
};

const TakeCtx = createContext<Take | null>(null);

/** Wraps a slide's drawing in its take. */
export function TakeProvider({
  take,
  children,
}: {
  take: Take;
  children: ReactNode;
}) {
  return <TakeCtx.Provider value={take}>{children}</TakeCtx.Provider>;
}

/** The take a slide is drawn in. */
export function useTake(): Take {
  const t = useContext(TakeCtx);
  if (!t) throw new Error("useTake is for a drawing inside a take's slide");
  return t;
}

/** A ground's colour in a take (paper is the take's stock). */
export function groundOf(take: Take, g: Ground): Tone {
  return g === "room" ? ROOM.room : take.paper.ground;
}

/** A card's colour on a ground in a take. */
export function cardOf(take: Take, g: Ground): Tone {
  return g === "room" ? ROOM.card : take.paper.card;
}

/** A ground's three text steps in a take, as hex. */
export function inkOf(
  take: Take,
  g: Ground,
): { fg: string; muted: string; faint: string } {
  if (g === "room")
    return {
      fg: ROOM_INK.fg.hex,
      muted: ROOM_INK.muted.hex,
      faint: ROOM_INK.faint.hex,
    };
  return {
    fg: take.paper.fg.hex,
    muted: take.paper.muted.hex,
    faint: take.paper.faint.hex,
  };
}

/** The same three, from inside a slide. */
export function useInk(g: Ground) {
  return inkOf(useTake(), g);
}
