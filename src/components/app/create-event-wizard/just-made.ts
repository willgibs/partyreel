/**
 * "SHE JUST MADE THIS EVENT": the one fact Create tells the dashboard (crumbs-70; host-dashboard r3 drew the lit
 * stage's lamp igniting once as she lands from Create), so the lamp of the event she made lights up once, the first time
 * her stage draws it, and every visit after finds it already lit.
 *
 * ★ A FLAG IN THE TAB, NOT A PARAMETER ON A LINK. Create's two exits lead to the event itself (Get it ready into its
 * Settings, the room's close into its hub), so there is no landing on /dashboard for a parameter to ride: she meets the
 * dashboard when she next goes home, minutes later and by a link of the app's own. So Create leaves the new event's id in
 * `sessionStorage`, where it outlives the hub and Settings, dies with the tab (a flag never comes back a day later), and
 * NAMES the event, so another event's lamp (the stage leads with whichever is nearest) never takes the ignition. The
 * lamp reads it where it draws (`LampLight`, `stage-lit.tsx`) and spends it there.
 *
 * Storage that throws (a private window, a full quota, a locked-down browser) is no ignition, never a fault: the stage
 * stands lit, which is all it ever did before.
 */

const KEY = "partyreel:just-made-event";

/** Create made this event just now: the next lit stage that draws it plays its ignition. */
export function rememberJustMade(eventId: string): void {
  try {
    window.sessionStorage.setItem(KEY, eventId);
  } catch {
    // No storage, no ignition.
  }
}

/** Was this the event she just made, and not yet lit on her stage? A read only: spending it is `forgetJustMade`'s. */
export function isJustMade(eventId: string): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === eventId;
  } catch {
    return false;
  }
}

/** The ignition has played: the next draw of this event's stage finds the lamp already lit. */
export function forgetJustMade(eventId: string): void {
  try {
    // Only this event's own: a second event made meanwhile keeps its flag.
    if (window.sessionStorage.getItem(KEY) === eventId) {
      window.sessionStorage.removeItem(KEY);
    }
  } catch {
    // Nothing to spend.
  }
}
