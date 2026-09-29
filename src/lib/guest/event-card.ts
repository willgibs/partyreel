/**
 * The event's share card, by address and by size: drawn by the route at `/e/<token>/card` and named
 * as the link's image by the page's `generateMetadata`, so the two always agree on where it lives
 * and how big it is. (A route file may export only its handlers, so the shared numbers live here.)
 */
export const EVENT_CARD_SIZE = { width: 1200, height: 630 } as const;
export const EVENT_CARD_ALT = "A Partyreel event";

/**
 * ★ ONE ANSWER PER ADDRESS, WHOEVER ASKS. Unfurlers fetch a card once per paste, and an hour spares
 * the render for a busy group chat without holding a renamed event's old card for long; the edge
 * serves that hour's copy to EVERY viewer, so no card may depend on who asks (build 17's red-team
 * found one that did).
 */
export const EVENT_CARD_CACHE_CONTROL = "public, max-age=3600";

/** The card's path for an event, by its canonical token (never a slug, which can move). */
export function eventCardPath(qrToken: string): string {
  return `/e/${encodeURIComponent(qrToken)}/card`;
}

/**
 * The flag that makes a card THE PRIVATE ALBUM'S: the generic card, by its address alone, whatever
 * the event and whoever asks.
 */
export const PRIVATE_CARD_PARAM = "private";

/**
 * The card every CLOSED DOOR names: a private album's page, and the page the closed door shows a
 * viewer the event blocked (`closed-door.server.ts`). ★ Never the event's own card: that address
 * answers the event's own visibility to everyone, so an open event's is named, and a blocked viewer's
 * page naming it would be the tell her page exists to hide. Both closed pages name this one, by the
 * address the visitor arrived on (a slug stays a slug), so a block and a private album carry the same
 * image in the same bytes.
 */
export function privateEventCardPath(token: string): string {
  return `${eventCardPath(token)}?${PRIVATE_CARD_PARAM}`;
}
