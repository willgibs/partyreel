/**
 * ★ FOCUS HANDED BACK AFTER A POINTER'S CHOICE IS QUIET (red-team 56's NIT: "a menu trigger keeps the halo
 * after a mouse choice"). A layer that closes gives its focus back to what opened it, and Chrome's
 * `:focus-visible` treats that programmatic focus as the keyboard's whenever the row it left was focused
 * by script (Radix focuses a row under the pointer), so a trigger chosen from by a mouse stood haloed as if
 * Tab had reached it. Here the hand-back after a pointer marks the trigger `data-quiet-focus` until the
 * next key or the focus leaving, and `focus-halo` draws nothing on it (globals.css). After a key, the halo
 * is drawn as ever: that is where the keyboard is.
 *
 * Call it from a layer's `onCloseAutoFocus` (it reads the focus after Radix has handed it back).
 */

let pointerLast = false

if (typeof document !== "undefined") {
  document.addEventListener("pointerdown", () => (pointerLast = true), true)
  document.addEventListener("keydown", () => (pointerLast = false), true)
}

function quiet(el: Element | null) {
  if (!(el instanceof HTMLElement) || el === document.body) return
  el.setAttribute("data-quiet-focus", "")
  const lift = () => {
    el.removeAttribute("data-quiet-focus")
    el.removeEventListener("blur", lift)
    el.removeEventListener("keydown", lift)
  }
  el.addEventListener("blur", lift)
  el.addEventListener("keydown", lift)
}

export function quietFocusAfterPointer(): void {
  if (!pointerLast) return
  // Radix focuses the trigger after this event's handlers have run, in the same task.
  queueMicrotask(() => quiet(document.activeElement))
}

/** For a layer that hands focus back itself: focus `el`, quietly when a pointer chose. */
export function giveFocusBack(el: HTMLElement | null | undefined): void {
  el?.focus({ preventScroll: true })
  if (pointerLast) quiet(el ?? null)
}
