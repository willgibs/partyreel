/**
 * Event share-URL builders — the single place that turns an event's capability
 * tokens into the absolute guest-facing URLs (join QR + public album).
 *
 * Pure + client-safe (takes `siteUrl` as a string, no `server-only` import) so
 * the create wizard's client share step can build URLs from the `siteUrl` its
 * server route passed down. The event page builds the same URLs inline
 * server-side from `getSiteUrl()` + the tokens.
 */

// A same-length stand-in for a real 32-hex `qr_token` (DB default is
// replace(gen_random_uuid()::text,'-','') → 32 hex chars). Used to preview QR
// styles BEFORE an event exists, so the preview's module density matches the
// real QR the host will get.
const PREVIEW_TOKEN = "0".repeat(32);

type EventTokens = { qr_token: string; share_token: string };

function origin(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, "");
}

/** Absolute join (`/e/<qr_token>`) + album (`/a/<share_token>`) URLs for an event. */
export function eventShareUrls(
  siteUrl: string,
  { qr_token, share_token }: EventTokens,
): { joinUrl: string; albumUrl: string } {
  const base = origin(siteUrl);
  return {
    joinUrl: `${base}/e/${qr_token}`,
    albumUrl: `${base}/a/${share_token}`,
  };
}

/** Placeholder join URL for previewing QR styles before the event (and its token) exists. */
export function previewJoinUrl(siteUrl: string): string {
  return `${origin(siteUrl)}/e/${PREVIEW_TOKEN}`;
}
