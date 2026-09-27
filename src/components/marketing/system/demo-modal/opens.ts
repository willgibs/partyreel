/**
 * WHERE A PRESS ON A DEMO DOOR GOES: the modal at a desk, the demo's own new
 * tab everywhere else. Pure, so the node project holds the rule
 * (`opens.test.ts`) and the door (`demo-door.tsx`) only reads the screen.
 *
 * ★ A DESK IS A WIDTH AND A POINTER, the product's one definition of it: the
 * Sheet's desk half (`ui/sheet.tsx`, 640) and the keyboard hook's touch screen
 * (`use-keyboard-inset.ts`, a coarse pointer), which is the pair that tells a
 * laptop from a phone held sideways and from a tablet. The modal offers a code
 * to scan with a phone, which only means something to a reader who is not
 * already holding one; a phone or a tablet opens the demo itself, in a new tab
 * so the page they came from stays where they left it (Will, 2026-09-27: "On
 * mobile, it'd simply open in a new tab").
 *
 * ★ A MODIFIED PRESS IS THE BROWSER'S, AT ANY WIDTH. Cmd- or Ctrl-click, a
 * middle click and Shift-click all ask for the link itself in a tab or window
 * of the reader's choosing, and a modal in their way would be a door that
 * refuses to be a link.
 */

/** The desk half, where a sheet is a side panel (the same 640 as `ui/sheet.tsx`). */
export const DESK_QUERY = "(min-width: 640px)";

/** A touch screen: a phone in either orientation, or a tablet. */
export const COARSE_QUERY = "(pointer: coarse)";

export type Screen = { desk: boolean; coarse: boolean };

/** The fields of a click the rule reads (a React or a DOM MouseEvent both carry them). */
export type DoorPress = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
};

/** A reader at a desk: wide enough for the panel, with a pointer that is not a finger. */
export function isDesk(screen: Screen): boolean {
  return screen.desk && !screen.coarse;
}

/**
 * Whether this press opens the modal. False leaves it to the link, whose
 * `target="_blank"` is the phone's answer and a modified press's own.
 * A press something upstream already claimed (`defaultPrevented`) is never
 * taken back.
 */
export function opensModal(press: DoorPress, screen: Screen): boolean {
  if (press.defaultPrevented || press.button !== 0) return false;
  if (press.metaKey || press.ctrlKey || press.shiftKey || press.altKey) {
    return false;
  }
  return isDesk(screen);
}

/** The screen as the browser reports it now (a press reads it at the moment it lands). */
export function readScreen(): Screen {
  if (typeof window === "undefined" || !window.matchMedia) {
    return { desk: false, coarse: false };
  }
  return {
    desk: window.matchMedia(DESK_QUERY).matches,
    coarse: window.matchMedia(COARSE_QUERY).matches,
  };
}

/** Re-render on either query changing (a window dragged across 640, a tablet's keyboard docked). */
export function subscribeScreen(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const queries = [DESK_QUERY, COARSE_QUERY].map((q) => window.matchMedia(q));
  for (const q of queries) q.addEventListener("change", onChange);
  return () => {
    for (const q of queries) q.removeEventListener("change", onChange);
  };
}
