/**
 * THE WAY OUT STEPS BACK OVER THE POPUPS' OWN ENTRIES WITHOUT CLOSING THEM (crumbs-83, for `app/pricing/leave.ts`).
 *
 * A place in a hand holds one same-URL history entry of its own (`popup-back.ts`), and Stripe's page can be left for
 * from inside two at once: the size list's goal strip stands over the plans' sheet. Replacing the top entry, which is
 * all a single place needs, leaves the sheet's entry under Stripe's page, so Back from Stripe lands on the page with
 * nothing open and the next Back lands on it again. So the way out first goes Back over every one of those entries, to
 * the page's own, and pushes Stripe's page from there: one Back from Stripe returns to the page, and nothing of the
 * popups' is left in the history to press through.
 *
 * ★ THE POPUPS STAND AS THEY ARE UNTIL THE PAGE HAS GONE. Closing them first would leave a page that does nothing for
 * as long as Stripe takes to answer (the strip's "Opening…" gone with its list), so the popups' own `popstate` reads
 * this traversal as the way out's (`steppingOut`): it forgets every entry the window left and closes nothing.
 *
 * ★ ITS OWN MODULE, SO THE WAY OUT STAYS LIGHT: `leave.ts` reaches every page with a Get Pro, /pricing's included, and
 * importing `popup-back.ts` would bring the popups' history code (and `lib/history-entry.ts`) to all of them. This
 * imports nothing.
 */

/** How long the way out waits for its Back to land before it leaves anyway (the popups' own travel floor). */
const STEP_FLOOR_MS = 1000;

let stepping = false;

/** The traversal under way is the way out's: its landing closes no popup (`popup-back.ts`'s `onPopState`). */
export function steppingOut(): boolean {
  return stepping;
}

/**
 * Go Back over `entries` popup entries, to the page's own, then `leave` (Stripe's page, pushed from there). Each popup
 * stays drawn as it stands: the page is on its way out. Once: a second way out while the first's Back is on its way
 * would go Back over the page's own entries too, and off the app.
 */
export function stepOutThenLeave(entries: number, leave: () => void): void {
  if (stepping) return;
  let left = false;
  let floor = 0;
  const go = () => {
    if (left) return;
    left = true;
    window.removeEventListener("popstate", go);
    window.clearTimeout(floor);
    // Down a tick late, so every listener of this landing (the popups' own among them) has read it as the way out's.
    window.setTimeout(() => {
      stepping = false;
    }, 0);
    leave();
  };
  stepping = true;
  window.addEventListener("popstate", go);
  floor = window.setTimeout(go, STEP_FLOOR_MS);
  window.history.go(-entries);
}
