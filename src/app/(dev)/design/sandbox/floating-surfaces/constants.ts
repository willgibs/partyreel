import type { Ground } from "@/components/lab";
import { optionId, optionLabel } from "@/components/lab/board-spec";

import {
  ENTRANCE_RUNGS,
  LIGHT_RUNGS,
  RADIUS_RUNGS,
  type Knobs,
} from "./candidates";
import { FLOATING_SURFACES } from "./spec";

/**
 * The board's shared vocabulary, in a module with NO "use client" on purpose:
 * the scene route is a Server Component and has to validate its search params
 * against these, and a value imported from a client module arrives there as a
 * client reference rather than the array (it cost one round of the board, so the
 * split stays even though scenes.tsx would otherwise be the natural home).
 */

export const SCENES = [
  // Round four's scenes: the three directions, standing up as working UI.
  "desk", // the host's desk at 1440: the header panel, the event menu, the account menu
  "pocket", // the same host on a phone, plus the guest surface under the direction
  "menu", // one menu, one direction, for the four-up comparison at 1:1
  "sub", // the nested branch: a submenu in two directions, deleted in the third
  "surfaces", // the dialog, the tooltip and the toast under the direction
  "field", // the select under the direction (a searchable list in command)
  // Rounds one to three: today's primitives and the three knobs.
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

/** The dark greys under a floating panel, in the dock's own words. The light
 *  section's caption names the set it is standing on rather than the token
 *  (the clarity round: a reviewer should never have to know that "b" is a ramp). */
export const RAMP_LABEL: Record<Ramp, string> = {
  today: "today's dark",
  a: "the palette board's ramp A, one ladder",
  b: "the palette board's ramp B, one room",
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
/**
 * THE WORDS THE ASK OFFERS, read back off the question (the clarity round,
 * 2026-09-15: the evidence carries the options' names, so "Squarer, like a
 * surface" on the review card is "Squarer, like a surface" on the frame).
 *
 * A lookup rather than a second table because a second table drifts: the ask
 * ids here ARE the dimension names (`radius`, `entrance`) and the option ids
 * ARE the rung ids, so relabelling an option in spec.ts relabels every specimen
 * it is judged on. The fallback is the token, which is what a mismatch should
 * look like: visibly wrong rather than quietly stale.
 */
export function askOptionLabel(askId: string, option: string): string {
  const ask = FLOATING_SURFACES.asks.find((a) => a.id === askId);
  const found = ask?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
}

/** The floor every ladder starts from. Not an option on any ask: the corner and
 *  the entrance asks offer no "leave it", so this column is the comparison. */
const AS_SHIPS = "As it ships today";

export const RUNGS: Record<Dim, { id: string; label: string }[]> = {
  radius: [
    { id: "", label: AS_SHIPS },
    ...RADIUS_RUNGS.map((r) => ({
      id: `flt-r-${r}`,
      label: askOptionLabel("radius", r),
    })),
  ],
  light: [
    // The light ask has THREE options over TWO columns: "ruled here" and "the
    // light board's call" are the same pixels and differ only in who rules the
    // line, so the column carries the words they share and the section's caption
    // says so. The first column is the `today` option's label to the letter.
    { id: "", label: askOptionLabel("light", "today") },
    ...LIGHT_RUNGS.map((r) => ({ id: `flt-l-${r}`, label: "A soft shadow" })),
  ],
  entrance: [
    { id: "", label: AS_SHIPS },
    ...ENTRANCE_RUNGS.map((r) => ({
      id: `flt-e-${r}`,
      label: askOptionLabel("entrance", r),
    })),
  ],
};

/**
 * THE NAME AN APPLIED BLOCK WEARS, in the asks' words. It lived in candidates.ts
 * as `contractLabel` and read the raw tokens ("radius nested, entrance by
 * frequency"), which is exactly the badge a reviewer cannot parse; candidates.ts
 * has no imports by design, so the composition moved here, where the asks are
 * already in scope.
 */
export function contractName(knobs: Knobs): string {
  const bits = [
    knobs.radius === "off"
      ? null
      : `corner ${askOptionLabel("radius", knobs.radius).toLowerCase()}`,
    knobs.light === "off" ? null : "a soft shadow in dark",
    knobs.entrance === "off"
      ? null
      : `appearing ${askOptionLabel("entrance", knobs.entrance).toLowerCase()}`,
  ].filter(Boolean);
  return bits.length
    ? `Floating layer: ${bits.join(", ")}`
    : "Floating layer: as it ships";
}

/** A rung class is its own address: the six-character prefix says which
 *  dimension, the rest says which value, so the frame turns a list of rung ids
 *  into CSS (candidates.ts rungCss) and the board turns one into a paste
 *  without a second table to keep in step. */
export const RUNG_PREFIX_LENGTH = 6;

/** The pages to walk with a candidate applied, quoted on the board and in the
 *  manifest's Handoff. Each carries a different member of the family.
 *
 *  EVERY page on this list wears a candidate now, the guest album included.
 *  A candidate rides the <style> that CandidateStyle renders, and round two
 *  found it mounted in only three places (the lab layout, the marketing cinema
 *  island, the host app's island), which left /e/<token> unable to wear one at
 *  all. launch-prep closed that at fb395fe: AppDesignIsland mounts on the
 *  (guest) layout and on /admin too, so the surface this board makes primary
 *  is walkable with a rung on. There was a `carries` column here saying which
 *  pages could not; it is gone with the gap it described. */
export const WALK: { href: string; what: string }[] = [
  {
    href: "/",
    what: "the header nav panel (hover Features), then the mobile menu sheet at 375, which is ui/sheet.tsx's only product call site",
  },
  {
    href: "/pricing",
    what: "the plan tooltips, the highest-frequency surface on the site",
  },
  {
    href: "/help",
    what: "the header nav panel over a paper ground, where the light rungs change sides",
  },
  {
    href: "/contact",
    what: "the select, its one product call site, and one of the three surfaces almost nothing uses",
  },
  {
    href: "/dashboard",
    what: "the account dropdown, the event menus and a confirm dialog (signed in)",
  },
  {
    href: "/e/[the demo token]",
    what: "the guest entry drawer at 375, the surface most people on this product will ever meet. It wears a candidate now (the guest layout mounts the island since launch-prep fb395fe), and every radius rung reaches it through [data-entry-drawer]",
  },
];
