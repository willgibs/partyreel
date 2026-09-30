/**
 * A TAP BEFORE THE PAGE'S SCRIPTS HAVE RUN IS NOT LOST, FOR THE CONTROLS THAT NEED THEM (crumbs-23, build
 * 26's red-team: "Continue with Google": "the first click before hydration did nothing; the second went").
 *
 * A button whose whole answer is a handler (Continue with Google starts a sign-in from the browser) is
 * drawn by the server and tappable from the first paint, but it answers nothing until React has hydrated
 * it, a second or three on a cold phone. The browser drops that tap: React attaches its listeners
 * only when its own script runs, and a press made before is never replayed (measured on `/login` and on a
 * bare server-rendered button: the scripts held, a click, the scripts released, and no click was ever
 * heard, inside a Suspense boundary or out of one). A form has the browser's own answer to fall back
 * on (`ClientForm`); a bare button has none.
 *
 * ★ THE ROOT IS THAT NOTHING WAS LISTENING. So one inline script, run before anything else
 * (a plain inline <script> in the sign-in group's layout, ~200 bytes), remembers the time of each click on a control that
 * asks for it (`data-early-press`), and the control itself, at its own hydration (the moment its handler
 * exists), runs the press it missed (`EarlyPressButton`, `components/auth/early-press-button.tsx`): the
 * tap the person made is the one that happens, once, and it is the control's own handler that answers
 * it, so nothing is done that a tap would not have done.
 *
 * This file is plain (no `"use client"`): `(auth)/layout.tsx`, a server component, reads the recorder's
 * source from it.
 *
 * ★ A STALE PRESS IS NOT REPLAYED. A tap that waited longer than `EARLY_PRESS_FRESH_MS` for its page is a
 * tap the person has moved on from (a page that took ten seconds may have been typed into since), and
 * a sign-in that started on its own then would be the surprise this exists to prevent. The press is
 * dropped, and the next one is the person's.
 *
 * Opting in is the attribute alone, so a control that does not carry it, and every tap after the page
 * is live, is exactly as it was.
 */
/** The attribute a control carries to have its early press kept. */
export const EARLY_PRESS_ATTR = "data-early-press";

/** How old a press may be and still be honoured when its control hydrates. */
export const EARLY_PRESS_FRESH_MS = 5000;

/** The window slot the recorder writes its ledger to: a `WeakMap` of control to the time of its last press. */
const LEDGER = "__earlyPress";

/**
 * The recorder, as the inline script the sign-in pages' layout runs first. A capture-phase click listener on the
 * document, which is there from parse time, before any framework code; it writes the time of a click on
 * an opted-in control and nothing else.
 */
export const EARLY_PRESS_RECORDER = `(function(){var m=new WeakMap();window.${LEDGER}=m;document.addEventListener("click",function(e){var t=e.target,c=t&&t.closest&&t.closest("[${EARLY_PRESS_ATTR}]");if(c)m.set(c,Date.now())},true)})();`;

/**
 * Take (and forget) the press a control missed: true when it was pressed before its handler existed and
 * that was recently enough to honour.
 */
export function takeEarlyPress(el: Element, now: number = Date.now()): boolean {
  if (typeof window === "undefined") return false;
  const ledger = (
    window as unknown as Record<string, WeakMap<Element, number>>
  )[LEDGER];
  const at = ledger?.get(el);
  if (at === undefined) return false;
  ledger.delete(el);
  return now - at < EARLY_PRESS_FRESH_MS;
}
