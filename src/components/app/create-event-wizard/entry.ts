"use client";

import { CODE_MORPH_NAME } from "@/components/app/share/event-share-provider";

/**
 * THE ROOM OPENS INTO HER EVENT, HER CODE FLYING TO ITS PLACE (create-wizard r5's carried `entry` and `close=enter`):
 * one press of Go to your event and the room gives way to her event's page while her code flies from the beat's plate
 * to its mat on her cover, the first thing she meets there. Under reduced motion, a cut.
 *
 * ★ ONE NAME, TWO ENDS, ONE AT A TIME: the hub's code already wears the code's morph name while it is the code on screen
 * (`event-code-door.tsx`, `CODE_MORPH_NAME`, the name the code card's own morph flies under), so the plate takes the
 * same name as it is pressed, and the browser's view transition carries the one into the other across the change of
 * page; the room and the hub cross-fade around it. Two elements wearing it at once would make the browser skip the
 * transition, and they never do: the plate leaves with the room.
 *
 * ★ NATIVE, NOT REACT'S `<ViewTransition>`: that needs `experimental.viewTransition`, which swaps the whole app's React
 * build (`marketing/system/morph-delegate.tsx` measured it), so this is the API the code card's morph already uses.
 *
 * ★ A TRANSITION FREEZES THE SCREEN UNTIL ITS CHANGE IS IN, SO THE CHANGE HAS A CEILING: the new page is in once her
 * cover's code stands and the room is gone (watched by a `MutationObserver`, which runs while the frozen document
 * renders nothing, where an animation frame would not), or `ENTRY_CEILING_MS` after the press, whichever comes first.
 * The foot is a link that prefetches her event in full (`create-event-wizard.tsx`), so the hub is usually in hand
 * before she presses; past the ceiling the transition settles on whatever stands, and the page arrives as a plain change.
 * Every guard degrades to an ordinary navigation, never a broken one: no API, reduced motion, a hidden tab (which
 * cannot snapshot, and rejects every promise a transition hands back).
 */

/** The longest the screen stands frozen on the press, waiting for her event to stand under the room. */
export const ENTRY_CEILING_MS = 1200;

type StartViewTransition = (cb: () => Promise<void>) => {
  ready: Promise<void>;
  finished: Promise<void>;
};

/** Whether the room may fly: the API is there, the tab is seen, and motion is welcome. */
function canFly(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof (document as { startViewTransition?: unknown })
      .startViewTransition === "function" &&
    document.visibilityState !== "hidden" &&
    typeof window.matchMedia === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Her event is in: the room gone, the cover's code standing. */
function arrived(): boolean {
  return (
    document.querySelector("[data-app-room]") === null &&
    document.querySelector("[data-code-door]") !== null
  );
}

/** An aborted transition is no failure (the change already landed); anything else still surfaces. */
function abortedOnly(error: unknown) {
  if (
    error instanceof DOMException &&
    (error.name === "InvalidStateError" ||
      error.name === "AbortError" ||
      error.name === "TimeoutError")
  )
    return;
  throw error;
}

/**
 * Go into her event from the beat: `plate` is the beat's code (`[data-beat-plate]`), `go` the router's push.
 */
export function enterEvent(
  href: string,
  go: (href: string) => void,
  plate: HTMLElement | null,
): void {
  if (!plate || !canFly()) {
    go(href);
    return;
  }
  plate.style.setProperty("view-transition-name", CODE_MORPH_NAME);
  const start = (
    document as Document & { startViewTransition: StartViewTransition }
  ).startViewTransition;
  const transition = start.call(
    document,
    () =>
      new Promise<void>((resolve) => {
        let done = false;
        const observer = new MutationObserver(() => {
          if (arrived()) finish();
        });
        const timer = window.setTimeout(() => finish(), ENTRY_CEILING_MS);
        function finish() {
          if (done) return;
          done = true;
          observer.disconnect();
          window.clearTimeout(timer);
          resolve();
        }
        observer.observe(document.body, { childList: true, subtree: true });
        go(href);
      }),
  );
  transition.ready.catch(abortedOnly);
  transition.finished.catch(abortedOnly);
}
