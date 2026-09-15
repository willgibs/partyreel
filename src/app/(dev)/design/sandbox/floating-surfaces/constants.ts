import type { Ground } from "@/components/dev/board";

import {
  ENTRANCE_LABEL,
  ENTRANCE_RUNGS,
  LIGHT_LABEL,
  LIGHT_RUNGS,
  RADIUS_RUNGS,
} from "./candidates";

/**
 * The board's shared vocabulary, in a module with NO "use client" on purpose:
 * the scene route is a Server Component and has to validate its search params
 * against these, and a value imported from a client module arrives there as a
 * client reference rather than the array (it cost one round of the board, so the
 * split stays even though scenes.tsx would otherwise be the natural home).
 */

export const SCENES = [
  "family",
  "overlay",
  "edge",
  "guest",
  "ladder",
  "nest",
  "trio",
  "select",
  "radio",
] as const;
export type Scene = (typeof SCENES)[number];

export const DIMS = ["radius", "light", "entrance"] as const;
export type Dim = (typeof DIMS)[number];

export const GROUNDS = [
  "cinema",
  "paper",
  "ink",
  "app-dark",
  "app-light",
] as const;

/** Which edge an edge-attached panel enters from. A knob because the ONE
 *  product call site of ui/sheet.tsx is the marketing mobile menu, and it enters
 *  from the TOP: the two corners that stay on screen there are the bottom two,
 *  not the top two, and a candidate that only covered bottom and right reached
 *  nothing real. */
export const SIDES = ["top", "right", "bottom", "left"] as const;
export type Side = (typeof SIDES)[number];

/** The palette board's dark ramps (docs/specs/palette.md), as a knob. A floating
 *  layer's light in dark is entirely a question of the ground it floats over: on
 *  today's dark the popover sits LIGHTER than the card it opens from (0.245 over
 *  0.21, the palette board's finding), and the answer to "does a shadow return
 *  in dark" changes with that. The ramp blocks live in board.css. */
export const RAMPS = ["today", "a", "b"] as const;
export type Ramp = (typeof RAMPS)[number];

export const RAMP_LABEL: Record<Ramp, string> = {
  today: "Ramp: today",
  a: "A one ladder",
  b: "B one room",
};

/** The cinema ground paints its --background inline (the frame's own style, so
 *  it beats any class rule), so the ramp has to hand it the matching value.
 *  These are the three cinema grounds from the palette spec's marketing block. */
export const RAMP_CINEMA_BG: Record<Ramp, string> = {
  today: "oklch(0.11 0 0)",
  a: "oklch(0.105 0 0)",
  b: "oklch(0.125 0 0)",
};

/** The ground sets a frame paints, shared by the frame page (first paint, from
 *  the URL) and the parent board (every change after, by attribute). */
export const GROUND_SET: Record<
  Ground,
  { className: string; mkt: boolean; cinema?: boolean }
> = {
  cinema: { className: "dark", mkt: true, cinema: true },
  paper: { className: "surface-paper", mkt: true },
  ink: { className: "surface-ink", mkt: true },
  "app-dark": { className: "dark", mkt: false },
  "app-light": { className: "surface-paper", mkt: false },
};

/** Every ground class, so a frame can drop the previous one before painting the
 *  next without knowing which it was. */
export const GROUND_CLASSES = ["dark", "surface-paper", "surface-ink"];

/** The rungs of each ladder. The id is the candidate class the generated block
 *  matches on the panel itself, which is what lets one frame hold a whole ladder:
 *  a radix panel portals away from any wrapper we could put around it. The ""
 *  id is today, as it ships, with nothing overridden. */
export const RUNGS: Record<Dim, { id: string; label: string }[]> = {
  radius: [
    { id: "", label: "today" },
    ...RADIUS_RUNGS.map((r) => ({ id: `flt-r-${r}`, label: r })),
  ],
  light: [
    { id: "", label: "today" },
    ...LIGHT_RUNGS.map((r) => ({ id: `flt-l-${r}`, label: LIGHT_LABEL[r] })),
  ],
  entrance: [
    { id: "", label: "today" },
    ...ENTRANCE_RUNGS.map((r) => ({
      id: `flt-e-${r}`,
      label: ENTRANCE_LABEL[r],
    })),
  ],
};

/** A rung class is its own address: the six-character prefix says which
 *  dimension, the rest says which value, so the frame turns a list of rung ids
 *  into CSS (candidates.ts rungCss) and the board turns one into a paste
 *  without a second table to keep in step. */
export const RUNG_PREFIX_LENGTH = 6;

/** The pages to walk with a candidate applied, quoted on the board and in the
 *  manifest's Handoff. Each carries a different member of the family. */
export const WALK: { href: string; what: string }[] = [
  {
    href: "/",
    what: "the header nav panel (hover Features), and the mobile menu sheet at 375",
  },
  { href: "/pricing", what: "the plan tooltips and the FAQ" },
  { href: "/help", what: "the header nav panel over a paper ground" },
  { href: "/contact", what: "the select, its one product call site" },
  {
    href: "/dashboard",
    what: "the account dropdown, the event menus and a confirm dialog (signed in)",
  },
  {
    href: "/e/[the demo token]",
    what: "the guest entry drawer at 375, then the report dialog and the share popover",
  },
];
