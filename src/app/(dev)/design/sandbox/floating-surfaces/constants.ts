import type { Ground } from "@/components/dev/board";

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
  "ladder",
  "select",
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

/** The ground sets a frame paints, shared by the frame page (first paint, from
 *  the URL) and the parent board (every change after, by attribute). */
export const GROUND_SET: Record<
  Ground,
  { className: string; mkt: boolean; bg?: string }
> = {
  cinema: { className: "dark", mkt: true, bg: "oklch(0.11 0 0)" },
  paper: { className: "surface-paper", mkt: true },
  ink: { className: "surface-ink", mkt: true },
  "app-dark": { className: "dark", mkt: false },
  "app-light": { className: "surface-paper", mkt: false },
};

/** Every ground class, so a frame can drop the previous one before painting the
 *  next without knowing which it was. */
export const GROUND_CLASSES = ["dark", "surface-paper", "surface-ink"];

/** The rungs of each ladder. The id is the candidate class board.css matches on
 *  the panel itself, which is what lets one frame hold a whole ladder: a radix
 *  panel portals away from any wrapper we could put around it. */
export const RUNGS: Record<Dim, { id: string; label: string }[]> = {
  radius: [
    { id: "", label: "today" },
    { id: "flt-r-sharp", label: "sharp" },
    { id: "flt-r-nested", label: "nested" },
    { id: "flt-r-round", label: "round" },
  ],
  light: [
    { id: "flt-l-lighter", label: "lighter is closer" },
    { id: "flt-l-shadow", label: "a soft shadow" },
    { id: "flt-l-lit-edge", label: "a lit edge" },
  ],
  entrance: [
    { id: "flt-e-one-clock", label: "one clock" },
    { id: "flt-e-by-frequency", label: "by frequency" },
    { id: "flt-e-origin-true", label: "origin true" },
  ],
};
