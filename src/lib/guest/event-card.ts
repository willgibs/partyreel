/**
 * The event's share card, by address and by size (reel-guest-wiring, 2026-09-24): drawn by the route
 * at `/e/<token>/card` and named as the link's image by the page's `generateMetadata`, so the two
 * always agree on where it lives and how big it is. (A route file may export only its handlers, so
 * the shared numbers live here.)
 */
export const EVENT_CARD_SIZE = { width: 1200, height: 630 } as const;
export const EVENT_CARD_ALT = "A Partyreel event";

/** The card's path for an event, by its canonical token (never a slug, which can move). */
export function eventCardPath(qrToken: string): string {
  return `/e/${encodeURIComponent(qrToken)}/card`;
}
