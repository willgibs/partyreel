/**
 * THE SCREEN ROUTE'S IDS, in a module with no "use client" on it.
 *
 * ★ A SERVER COMPONENT CANNOT READ A CONSTANT OUT OF A CLIENT MODULE. Next
 * replaces every export of a "use client" file with a client reference on the
 * server, so `SCREENS.map` there is a runtime TypeError rather than a type
 * error (found the moment screen/page.tsx first rendered, 2026-09-15). The
 * route validates its query string against these, the board builds its toggle
 * from them, and screens.tsx renders them: one list, three readers, no
 * boundary crossed.
 */

export const SCREENS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "event", label: "Event page" },
  { id: "gallery", label: "The gap" },
  { id: "entry", label: "Guest door" },
  { id: "floating", label: "Floating layer" },
] as const;

export type ScreenId = (typeof SCREENS)[number]["id"];

export const SCREEN_OPTIONS = SCREENS.map((s) => ({
  id: s.id,
  label: s.label,
}));

/** What each screen puts at stake, printed under the toggle on the board. */
export const SCREEN_NOTE: Record<ScreenId, string> = {
  dashboard:
    "The host's own page: the production EventCard, which is rounded-xl and therefore the biggest shape the derived ladder decides, beside an Input, a Badge and the whole Button family.",
  event:
    "An event, as a host works it: the command strip, the filter pills, the real MasonryColumns at the tile radius and the gallery gap, and the row menu, open.",
  gallery:
    "The finding, on the real grid: the same nine photographs twice, once labelled The gap follows the tile and once A fixed 3px gap, as it ships. Above a corner of 3 the second grid opens holes where four corners meet.",
  entry:
    "The first surface a guest ever sees, drawn by the production EntryShell: a vaul drawer below 640 and a Radix dialog above. Its top corners are 1.4 times a BUTTON's corner, which is the finding part F is built on.",
  floating:
    "A real dialog and a real menu, open, over a real album. Both portal to this document's body, so they are on the canvas rather than over the lab.",
};

/** The grounds the route accepts, validated there and offered in the dock. */
export const SCREEN_GROUNDS = [
  "app-light",
  "app-dark",
  "cinema",
  "paper",
  "ink",
] as const;
