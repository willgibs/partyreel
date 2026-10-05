/**
 * IS ANOTHER LAYER UP? The one place that knows which roles a floating layer wears, so a surface that owns
 * the keyboard or the address can ask whether it should stand down.
 *
 * A layer is a dialog, a menu or a listbox, and a confirm speaks as an `alertdialog` (`popup-kinds.ts`:
 * it stops the person to ask one thing), which is not a `dialog` to a selector. Three surfaces each wrote
 * their own role list (the review room's keys, the report queue's keys, the album's address), and two of
 * the three had left `alertdialog` out until crumbs-20 found a confirm's keys reaching the page behind it.
 * A list of roles held in three places is a list that drifts, so it is held here, and
 * `layer-is-up.test.tsx` refuses a fourth copy.
 *
 * Roles, not markup, on purpose: a Radix Dialog, a Sheet, a Popup of every shape and a hand-drawn overlay
 * all carry the role, and `PopupContent` spreads `alertdialog` only for a kind that asks one thing
 * (`role` is a column of its row), so this needs to know nothing of which primitive drew the layer.
 */

/** A layer that stops the page and takes the keyboard: a Dialog's own role, and a confirm's. */
export const MODAL_ROLES = ["dialog", "alertdialog"] as const;

/**
 * A layer that closes as a side effect of the act that would leave it: a menu row (selecting it closes
 * the menu) and a listbox option (Radix Select).
 */
export const EPHEMERAL_ROLES = ["menu", "listbox"] as const;

const selectorOf = (roles: readonly string[], except?: string) =>
  roles
    .map((role) => `[role="${role}"]${except ? `:not(${except})` : ""}`)
    .join(", ");

export type LayerOptions = {
  /**
   * A selector for the caller's OWN layer, which is never "another" one: the review room's peek
   * (`[data-review-peek]`) or the viewer (`[data-lightbox-content]`).
   */
  except?: string;
  /**
   * Count only the modal layers (a dialog, a confirm), not a menu or a listbox open at the thumb. For a
   * caller that waits behind a place someone else opened rather than yielding its keys to a popup.
   */
  dialogsOnly?: boolean;
};

/**
 * Whether a layer other than the caller's own is up in the document right now. Read at the moment of
 * the key or the write (the layers come and go outside React), never during a render.
 */
export function layerIsUp({
  except,
  dialogsOnly = false,
}: LayerOptions = {}): boolean {
  if (typeof document === "undefined") return false;
  const roles = dialogsOnly ? MODAL_ROLES : [...MODAL_ROLES, ...EPHEMERAL_ROLES];
  return document.querySelector(selectorOf(roles, except)) !== null;
}

/**
 * Whether a key or a press came from inside a layer other than the caller's own: the nearest layer around
 * its target, of any role, is not the caller's.
 *
 * ★ THE LAYER THE KEY CAME FROM, NOT EVERY LAYER IN THE DOCUMENT (back-layers): a surface that is itself a
 * layer and owns the keys while it is on top (the viewer) stands down for a layer stacked OVER it, which holds
 * the focus (a modal traps it, a menu and a look take it as they open), and never for one UNDER it, which
 * `layerIsUp` counts too: a viewer opened from inside a panel would lose its arrows to the panel. A target with
 * no layer around it (the page, the window) is nobody else's.
 */
export function insideAnotherLayer(
  target: EventTarget | null,
  { except }: Pick<LayerOptions, "except"> = {},
): boolean {
  // Duck-typed, never `instanceof Element`: a Library frame's elements wear the frame's own prototypes.
  const el = target as Element | null;
  if (!el || typeof el.closest !== "function") return false;
  const layer = el.closest(selectorOf([...MODAL_ROLES, ...EPHEMERAL_ROLES]));
  return layer !== null && !(except !== undefined && layer.matches(except));
}
