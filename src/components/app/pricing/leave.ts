/**
 * THE ONE WAY OUT OF THE APP FOR STRIPE'S PAGE (`leave`, `pricing-doors.tsx`): Checkout, the billing portal and a plan
 * change's confirm page all end in it, so what it does to the history is decided once.
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
 * ★ WHICH ENTRY IS ON TOP IS READ OFF THE SHEET, NEVER OFF THE HISTORY. The window's state carries the popup's marker
 * (`POPUP_HISTORY_MARKER`) until a router commit that is not a traversal (`router.refresh()`, a revalidating action)
 * rewrites the entry with Next's own state alone, which a list stacked over the sheet does as each deletion lands
 * (`lib/history-entry.ts` says when), so the marker is blind exactly where a host has done the most; and importing it
 * would put the popup's history code in the JS of every page with a Get Pro, /pricing's included (`CheckoutButton`
 * reaches this module through the doors). The sheet open as a place (`data-pricing-sheet` on its content, and the
 * shape the popup publishes as `data-shape`) holds its entry whatever the state says. Replacing an entry that is not a
 * popup's would take the PAGE's own and land Back on the page before it, a worse failure than the one this fixes, so
 * nothing else is ever replaced: at a desk the sheet is a dialog that holds no entry, a sheet on its way out is having
 * its entry taken back by the popup, and a button on a page (the account card's, the storage ring's, /pricing's) pushes
 * as it always did.
 *
 * ★ A DOCUMENT THE BROWSER KEEPS FOR BACK IS STARTED CLEAN. When Back brings a page out of the back/forward cache it
 * is restored as it stood, which here is a sheet that believes it holds an entry the replace took: closing it would
 * take Back one entry too far and leave the page. So a replace asks the browser for one reload if the page ever comes
 * back that way; a page that was not kept loads fresh, as it always has, and never meets the listener.
 *
 * Client-only, like the doors it serves.
 */

/**
 * The popup shapes that hold an entry of their own in a hand, by value: `isPlaceShape` (`ui/popup-kinds.ts`) is the
 * rule, and `leave.test.tsx` holds this list to it over every shape. Importing the function would put the popup's tables
 * in every marketing page's JS, for a rule only the app's sheet ever meets.
 */
export const PLACE_SHAPES: readonly string[] = ["screen", "cover", "sheet"];

/** The plans' sheet is open as a place (a phone's whole screen), so its entry is the one the window stands on. */
function sheetIsAPlaceUp(): boolean {
  const open = document.querySelector<HTMLElement>(
    '[data-pricing-sheet][data-state="open"]',
  );
  return open !== null && PLACE_SHAPES.includes(open.dataset.shape ?? "");
}

/** The one listener a replace leaves for the page's coming back, so a second press never stacks a second reload. */
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
  if (!sheetIsAPlaceUp()) {
    window.location.href = url;
    return;
  }
  reloadIfKept();
  window.location.replace(url);
}
