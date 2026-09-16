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

/**
 * THE SCENES. Round six cut six: `field`, `family`, `overlay`, `edge`, `select`
 * and `radio` were the outlier rows and rounds one to three's primitives
 * ladder, and the catalog answers both better. The edge panel did not lose its
 * evidence, it gained better evidence: `ui/sheet.tsx`'s one product call site is
 * the marketing mobile menu, and the real-pages section loads / at 375, so the
 * sheet is judged as the route rather than as a specimen of one.
 */
export const SCENES = [
  "desk", // the real dashboard at 1440, the account menu and an event overflow open
  "pocket", // the same host on a phone
  "menu", // one menu, one direction, at 328: the catalog card's preview
  "sub", // the nested branch, kept and deleted
  "real", // app/user-menu.tsx as it ships, theme submenu and all: the bug
  "surfaces", // the dialog over its scrim, the tooltip and the real toast
  "guest", // the guest's own entry drawer, the tenth surface
  "ladder", // the shadow in dark, two columns
  "nest", // the corner at six times magnification
  "trio", // the entrance: one rule per frame, on the same three surfaces
] as const;
export type Scene = (typeof SCENES)[number];

/** The nested branch, kept or deleted. It is MARKUP rather than a stylesheet,
 *  so it rides the frame's src and reloads that one frame: a page-wide switch
 *  that changes a single frame can afford a reload where the ground, which
 *  changes sixteen of them, cannot. */
export const SUBS = ["keep", "delete"] as const;
export type Sub = (typeof SUBS)[number];

export const DIMS = ["radius", "light", "entrance"] as const;
export type Dim = (typeof DIMS)[number];

export const GROUNDS = [
  "cinema",
  "paper",
  "ink",
  "app-dark",
  "app-light",
] as const;

/** The cinema room's own background, painted inline by the frame because a
 *  class rule cannot beat an inline custom property. The palette board owns the
 *  value; this board stopped carrying its three candidate ramps as a switch in
 *  round six, because ruling the greys twice on two boards is how two boards
 *  drift apart. */
export const CINEMA_BG = "oklch(0.11 0 0)";

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
    { id: "", label: askOptionLabel("light", "today") },
    ...LIGHT_RUNGS.map((r) => ({
      id: `flt-l-${r}`,
      label: askOptionLabel("light", r),
    })),
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

/**
 * THE REAL ROUTES THE PICK IS WORN ON, and the three of them that a frame can
 * load. A candidate rides the <style> that CandidateStyle renders, and
 * `AppDesignIsland` mounts on the (guest) layout and on /admin as well as the
 * app's own since launch-prep fb395fe, so /e/<token> wears one too.
 *
 * `framed: false` means the route is behind the (app) auth gate: a frame
 * pointed at /dashboard lands on /login, so it is a link to open in a tab
 * rather than a frame that would quietly show the wrong page.
 */
export const WALK: {
  href: string;
  what: string;
  framed: boolean;
  phone?: boolean;
}[] = [
  {
    href: "/",
    what: "the header's nav panel: hover Features at 1440, or open the menu at 375, which is ui/sheet.tsx's one product call site",
    framed: true,
  },
  {
    href: "/pricing",
    what: "the plan tooltips, the highest-frequency floating surface on the site",
    framed: true,
  },
  {
    href: "/e/[the demo token]",
    what: "the guest's entry drawer at 375, the surface most people on this product will ever meet",
    framed: true,
    phone: true,
  },
  {
    href: "/help",
    what: "the same nav panel over a paper ground, where a shadow changes sides",
    framed: false,
  },
  {
    href: "/dashboard",
    what: "the account menu, an event's menus and a confirm dialog, signed in",
    framed: false,
  },
];
