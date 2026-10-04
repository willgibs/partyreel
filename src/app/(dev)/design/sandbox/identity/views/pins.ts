/**
 * THE MOMENT, PINNED: the few DOM moves a screen makes once it has settled, so
 * a frame holds the moment a trait is judged in (a key held down, a key
 * working, a field typed in) and every option is caught in the very same one.
 *
 * ★ A PINNED STATE IS THE REAL RULE (`sheet/states.ts`): `data-demo` opens the
 * selector a cursor or a keyboard opens, and `aria-busy` is the hook a wired
 * atom sets while it works, so a pin is never a picture of a state.
 */

/** The first element under `scope` matching `sel` whose own words are `text`. */
export function byText<T extends HTMLElement = HTMLElement>(
  sel: string,
  text: string,
  scope: ParentNode = document,
): T | null {
  return (
    [...scope.querySelectorAll<T>(sel)].find(
      (el) => el.textContent?.trim() === text,
    ) ?? null
  );
}

/**
 * Pins a state a pointer or a keyboard would bring (`hover`, `press`,
 * `focus`). ★ A PRESS IS PINNED ALONE: these screens are drawn as a finger
 * meets them, and a finger has no hover, so a held key wears its press and
 * nothing a pointer would add (the press options then differ by their own
 * drawing, never by a hover's fill they would all share).
 */
export function pin(
  el: Element | null | undefined,
  state: "hover" | "press" | "focus",
): void {
  if (!el) return;
  el.setAttribute("data-demo", state);
}

/** Marks an action working, as a wired atom does while it waits on the server. */
export function busy(el: Element | null | undefined): void {
  el?.setAttribute("aria-busy", "true");
}

/**
 * Brings a part into view inside whatever scrolls it (a panel's body, the
 * page), without moving the page's own scroll when the part is already seen.
 */
export function bring(
  el: Element | null | undefined,
  block: ScrollLogicalPosition = "center",
): void {
  el?.scrollIntoView({ block, inline: "nearest", behavior: "instant" });
}
