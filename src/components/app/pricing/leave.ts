import { POPUP_HISTORY_MARKER } from "@/components/ui/popup-back";
import { isPlaceShape, type PopupShape } from "@/components/ui/popup-kinds";

/**
 * THE ONE WAY OUT OF THE APP FOR STRIPE'S PAGE (`leave`, `pricing-doors.tsx`): Checkout, the billing portal and a plan
 * change's confirm page all end in it, so what it does to the history is decided once.
 *
 * ★ A PLACE IN A HAND HOLDS ONE SAME-URL ENTRY OF ITS OWN (`popup-back.ts`), and the plans' sheet is one: on a phone it
 * is the whole screen, and the phone's Back closes it. A plain `location.href` pushes Stripe's page on top of that entry,
 * so Back from Stripe lands on the page with the sheet's entry still beneath it: the first press shows the page and the
 * second goes nowhere (the same address again), two presses to get out from behind a payment page. So while a place's
 * entry is the one the window stands on, the way out REPLACES it: the sheet's entry becomes Stripe's, the page's own
 * entry is the one beneath, and one Back returns to the page. Taking the entry first (`history.back()` and waiting for
 * the popstate) was the other way, and it closes the sheet before the browser has started to leave, so the button's
 * "Starting…" would vanish over a page that does nothing for as long as Stripe takes to answer.
 *
 * ★ WHICH ENTRY IS ON TOP, KNOWN TWO WAYS, EACH SAFE WHERE THE OTHER IS BLIND. The window's state carries the popup's
 * marker (`POPUP_HISTORY_MARKER`, the photo viewer asks the same question), and a router commit that is not a traversal
 * (`router.refresh()`, a revalidating action) rewrites the entry with Next's own state alone, so the marker can be
 * gone while the sheet is still open (`lib/history-entry.ts` says when). The sheet itself is the other witness: open as
 * a place (`data-pricing-sheet`, whose shape the popup publishes as `data-shape`), it holds its entry whatever the
 * state says. Replacing an entry that is not a popup's would take the PAGE's own and land Back on the page before it, a
 * worse failure than the one this fixes, so nothing else is ever replaced: at a desk the sheet is a dialog that holds no
 * entry, and a button on a page (the account card's, the storage ring's, /pricing's) pushes as it always did.
 *
 * ★ A DOCUMENT THE BROWSER KEEPS FOR BACK IS STARTED CLEAN. When Back brings a page out of the back/forward cache it
 * is restored as it stood, which here is a sheet that believes it holds an entry the replace took: closing it would
 * take Back one entry too far and leave the page. So a replace asks the browser for one reload if the page ever comes
 * back that way; a page that was not kept loads fresh, as it always has, and never meets the listener.
 *
 * Client-only, like the doors it serves.
 */

/** The marker says a popup's entry is the one the window stands on. */
function standsOnAPopupEntry(): boolean {
  const state = window.history.state as Record<string, unknown> | null;
  return state?.[POPUP_HISTORY_MARKER] !== undefined;
}

/** The plans' sheet is open as a place (a phone's whole screen), so its entry is on top whatever the state says. */
function sheetIsAPlaceUp(): boolean {
  const open = document.querySelector<HTMLElement>(
    '[data-pricing-sheet][data-state="open"]',
  );
  return open !== null && isPlaceShape(open.dataset.shape as PopupShape);
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
  if (!standsOnAPopupEntry() && !sheetIsAPlaceUp()) {
    window.location.href = url;
    return;
  }
  reloadIfKept();
  window.location.replace(url);
}
