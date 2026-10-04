/**
 * AN EVENT'S OPEN, READ OFF A LINK (host-dashboard r3: the Recent row and the Last opened order). The dashboard's
 * own links are the opens it can see: a press on a tile, a row, a cover, the stage or a week card goes into an event
 * (`/dashboard/<id>`, or a room of it), and one delegated listener stamps it (`HomeShell`, `noteEventOpenedAction`).
 *
 * Pure and node-safe: which link is an open, and how often one event is stamped.
 */

/** An event's hub or any room of it, as a link's own `href` spells it: `/dashboard/<id>`, `/dashboard/<id>/print`, `?room=`. */
const INTO_AN_EVENT =
  /^\/dashboard\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:[/?#]|$)/i;

/** The event a link goes into, or null (`/dashboard/new`, a guest album, an outside link, no `href`). */
export function openedIdOf(href: string | null | undefined): string | null {
  const id = href?.match(INTO_AN_EVENT)?.[1];
  return id ? id.toLowerCase() : null;
}

/** One tab stamps an event at most this often: a press into it, back and into it again is one open. */
export const OPEN_STAMP_GAP_MS = 5_000;

/** The server stamps an event at most this often: Recent's order needs no finer, and a write is a write. */
export const OPEN_STAMP_FRESH_MS = 60_000;
