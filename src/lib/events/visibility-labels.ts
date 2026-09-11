import type { Database } from "@/lib/db/types";

export type Visibility = Database["public"]["Enums"]["event_visibility"];

/**
 * The word for each visibility state, single-sourced (Will's ruling, 2026-09-02:
 * "Public sounds much clearer than open"). "Open" is the ACCEPTING-UPLOADS state and
 * never a visibility word: the two were written separately once, so the settings
 * selector said Public while the event header chip said Open, for the same
 * `visibility = 'open'` row. Read this record; do not re-type a label next to the enum.
 *
 * Server-safe on purpose (no "use client"): the dashboard's RSC chip, the client
 * selector, the settings form and marketing's access switch all read this one module.
 * It used to live in the client selector, which an RSC cannot dot into, so the chip
 * re-typed "Public" with a comment (the library phase, 2026-09-11, moved it here).
 */
export const VISIBILITY_LABELS: Record<Visibility, string> = {
  open: "Public",
  password: "Password",
  private: "Private",
};

/** One-line hint for the active choice: the form and every surface describe the states identically. */
export const VISIBILITY_HINTS: Record<Visibility, string> = {
  open: "Anyone with the link can view the album.",
  password: "Anyone with the link and the password can view the album.",
  private: "Only you can view it. Guests see a friendly locked screen.",
};
