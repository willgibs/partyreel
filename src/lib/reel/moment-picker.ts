/**
 * The Moments picker's ONE routing rule, as pure logic.
 *
 * The Studio's picker looks like a checkbox grid, but the three cases behind a tap are genuinely
 * different calls against the reel provider, and getting one wrong is silent (a toast that should not
 * fire, or a write the RPC refuses). So the decision lives here, testable, instead of inline in JSX:
 *
 *   ADD     → `addMany([id])`, NOT `toggle(id)`. Both would add, but toggle fires a success toast on
 *             every add (it was written for a one-off tile chip). In a grid where adding six moments
 *             is the NORMAL gesture, that is six stacked toasts. addMany is silent by contract and
 *             lets the header count be the feedback.
 *   REMOVE  → `toggle(id)`. There is no remove(id) on the provider; removal IS a toggle of an in-reel
 *             id, and toggle stays quiet on the remove half (it mirrors unlike).
 *   BLOCKED → a HIDDEN item that is not already in the reel. add_to_reel refuses non-approved media,
 *             so offering the tap would produce a revert plus an error toast. Note the asymmetry is
 *             deliberate and matches the two membership predicates: a hidden item that is ALREADY a
 *             member stays one (membership = approved + hidden, so reorder still commits the full set)
 *             and can be removed, it just cannot be newly added.
 */

export type MomentAction = "add" | "remove" | "blocked";

export function momentAction({
  inReel,
  status,
}: {
  inReel: boolean;
  /** GridMedia.status. Absent is treated as approved, matching the grid's own default. */
  status?: "pending" | "approved" | "hidden" | "removed";
}): MomentAction {
  if (inReel) return "remove";
  return (status ?? "approved") === "approved" ? "add" : "blocked";
}
