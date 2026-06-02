/**
 * Event link builder — the single place that turns an event's qr_token into the
 * absolute guest-facing URL. One link per event (ADR-00010): what a guest sees is
 * driven by the host's configs (visibility / accepting_uploads / require_email),
 * not by which link they hold.
 *
 * Pure + client-safe (takes `siteUrl` as a string, no `server-only` import) so the
 * create wizard's client share step can build the URL from the `siteUrl` its server
 * route passed down. The event page builds the same URL inline server-side.
 */

// A same-length stand-in for a real 32-hex `qr_token` (DB default is
// replace(gen_random_uuid()::text,'-','') → 32 hex chars). Used to preview QR
// styles BEFORE an event exists, so the preview's module density matches the
// real QR the host will get.
const PREVIEW_TOKEN = "0".repeat(32);

function origin(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, "");
}

/** The absolute event URL (`/e/<qr_token>`) — the single link a host shares. */
export function eventUrl(siteUrl: string, qrToken: string): string {
  return `${origin(siteUrl)}/e/${qrToken}`;
}

/** Placeholder event URL for previewing QR styles before the event (and its token) exists. */
export function previewJoinUrl(siteUrl: string): string {
  return `${origin(siteUrl)}/e/${PREVIEW_TOKEN}`;
}
