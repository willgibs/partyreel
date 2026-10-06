import { useCallback, useState, useSyncExternalStore } from "react";

import { stepOutThenLeave } from "@/components/ui/popup-back-way-out";

/**
 * THE ONE WAY OUT OF THE APP FOR STRIPE'S PAGE (`leave`, `pricing-doors.tsx`): Checkout, the billing portal and a plan
 * change's confirm page all end in it, the size list's goal strip included, so what it does to the history, and to the
 * door that was pressed, is decided once.
 *
 * ★ A PLACE IN A HAND HOLDS ONE SAME-URL ENTRY OF ITS OWN (`popup-back.ts`), and the plans' sheet is one: on a phone it
 * is the whole screen, and the phone's Back closes it. A plain `location.href` pushes Stripe's page on top of that entry,
 * so Back from Stripe lands on the page with the sheet's entry still beneath it: the first press shows the page and the
 * second goes nowhere (the same address again), two presses to get out from behind a payment page. So while the sheet
 * is up as a place, the way out REPLACES its entry: the sheet's entry becomes Stripe's, the page's own entry is the one
 * beneath, and one Back returns to the page. Taking the entry first (`history.back()` and waiting for the popstate) was
 * the other way, and it closes the sheet before the browser has started to leave, so the button's "Starting…" would
 * vanish over a page that does nothing for as long as Stripe takes to answer.
 *
 * ★ TWO PLACES ARE TWO ENTRIES, AND A REPLACE TAKES ONE (crumbs-83). The size list a too-small price opens stacks over
 * the sheet (`storage/refusal-face.tsx`), a place of its own, and its goal strip leaves from there. Replacing the list's
 * entry left the sheet's under Stripe's page, one dead Back on the way home; so with more than one place up the way out
 * steps Back over all of them, to the page's own entry, and pushes Stripe's page from there, the popups standing drawn
 * as they are while that Back is on its way (`ui/popup-back-way-out.ts`, which tells the popups the traversal is the
 * way out's, so none closes).
 *
 * ★ WHICH ENTRIES ARE ON TOP IS READ OFF THE PLACES, NEVER OFF THE HISTORY. The window's state carries the popup's marker
 * (`POPUP_HISTORY_MARKER`) until a router commit that is not a traversal (`router.refresh()`, a revalidating action)
 * rewrites the entry with Next's own state alone, which the size list does as its deletions land (`lib/history-entry.ts`
 * says when), so the marker is blind exactly where a host has done the most; and importing it would put the popup's
 * history code in the JS of every page with a Get Pro, /pricing's included (`CheckoutButton` reaches this module through
 * the doors). The way out's places open as places (`data-pricing-sheet` and `data-storage-list` on their content, and
 * the shape the popup publishes as `data-shape`) hold their entries whatever the state says. Taking an entry that is not
 * a popup's would take the PAGE's own and land Back on the page before it, a worse failure than the one this fixes, so
 * no other entry is ever taken: at a desk the sheet and the list hold none, a place on its way out is having its entry
 * taken back by the popup, and a button on a page (the account card's, the storage ring's, /pricing's) pushes as it
 * always did.
 *
 * ★ A DOCUMENT THE BROWSER KEEPS FOR BACK IS STARTED CLEAN. When Back brings a page out of the back/forward cache it
 * is restored as it stood, which here is a sheet that believes it holds an entry the way out took: closing it would
 * take Back one entry too far and leave the page. So taking an entry asks the browser for one reload if the page ever
 * comes back that way; a page that was not kept loads fresh, as it always has, and never meets the listener.
 *
 * ★ THE DOOR THAT WAS PRESSED STAYS PRESSED UNTIL THE PAGE HAS GONE (crumbs-83). Assigning Stripe's address only starts
 * the browser's navigation, and the page stands, live, until Stripe's answer arrives: the doors' presses ended there and
 * the buttons came back, so a second tap while Stripe's page loaded opened a second session. So the way out holds every
 * door (`useLeaveHold`): the one pressed keeps saying it is working, the rest stand down, until the page hides, and a
 * page the browser brings back from its cache (`pageshow`, `persisted`) lets them go. A page that never leaves (a load
 * she stopped, an address the browser refused) lets them go after `HOLD_FLOOR_MS`, so no door is left dead. Only this
 * way out holds: the Library's doors stop where they would leave, and their buttons come back at once.
 *
 * Client-only, like the doors it serves.
 */

/**
 * The popup shapes that hold an entry of their own in a hand, by value: `isPlaceShape` (`ui/popup-kinds.ts`) is the
 * rule, and `leave.test.tsx` holds this list to it over every shape. Importing the function would put the popup's tables
 * in every marketing page's JS, for a rule only the app's places ever meet.
 */
export const PLACE_SHAPES: readonly string[] = ["screen", "cover", "sheet"];

/** The way out's places: the plans' sheet, and the size list a too-small price stacks over it. */
const PLACES = "[data-pricing-sheet], [data-storage-list]";

/** How many of the way out's places are up as places (a phone's whole screen), each over an entry of its own. */
function placesUp(): number {
  let up = 0;
  for (const place of document.querySelectorAll<HTMLElement>(PLACES)) {
    if (
      place.dataset.state === "open" &&
      PLACE_SHAPES.includes(place.dataset.shape ?? "")
    )
      up += 1;
  }
  return up;
}

/** The one listener a way out leaves for the page's coming back, so a second press never stacks a second reload. */
let comeBack: ((event: PageTransitionEvent) => void) | null = null;

function reloadIfKept(): void {
  if (comeBack) window.removeEventListener("pageshow", comeBack);
  const own = (event: PageTransitionEvent) => {
    window.removeEventListener("pageshow", own);
    if (comeBack === own) comeBack = null;
    if (event.persisted) window.location.reload();
  };
  comeBack = own;
  window.addEventListener("pageshow", own);
}

export function leaveForStripe(url: string): void {
  holdTheDoors();
  const places = placesUp();
  if (places === 0) {
    window.location.href = url;
    return;
  }
  reloadIfKept();
  if (places === 1) {
    window.location.replace(url);
    return;
  }
  stepOutThenLeave(places, () => {
    window.location.href = url;
  });
}

/* ── THE DOORS HOLD WHILE THE PAGE LEAVES (the head's last note) ─────────────────────────────────────────────────── */

/**
 * How long the doors hold for a page that has not left: past it the page is plainly staying (a load she stopped, an
 * address the browser refused) and they come back. Well past the moment Stripe's page arrives on a slow phone, so no
 * second session opens while the first still loads.
 */
export const HOLD_FLOOR_MS = 15_000;

/** The way out under way (its number), 0 while none is. */
let away = 0;
let ways = 0;
let floor = 0;
let hearsComeBack = false;
const holders = new Set<() => void>();

function setAway(next: number): void {
  away = next;
  for (const tell of holders) tell();
}

function holdTheDoors(): void {
  const way = ++ways;
  setAway(way);
  window.clearTimeout(floor);
  floor = window.setTimeout(() => {
    if (away === way) setAway(0);
  }, HOLD_FLOOR_MS);
  if (hearsComeBack) return;
  hearsComeBack = true;
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted || away === 0) return;
    window.clearTimeout(floor);
    setAway(0);
  });
}

function hold(tell: () => void): () => void {
  holders.add(tell);
  return () => {
    holders.delete(tell);
  };
}

export type LeaveHold = {
  /** A way out is under way: every door stands down, since another press would open another session. */
  away: boolean;
  /** This door's own press took it: the door keeps saying it is working until the page has gone. */
  held: boolean;
  /** Said right after the door's `leave`: the press is this door's, if that `leave` was the way out that holds. */
  took: () => void;
};

/** A door's hold on the way out (the head's last note). */
export function useLeaveHold(): LeaveHold {
  const now = useSyncExternalStore(
    hold,
    () => away,
    () => 0,
  );
  const [mine, setMine] = useState(0);
  const took = useCallback(() => setMine(away), []);
  return { away: now !== 0, held: mine !== 0 && now === mine, took };
}
