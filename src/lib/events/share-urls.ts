/**
 * Event link builder — the single place that turns an event's qr_token into the
 * absolute guest-facing URL. One link per event (database-security.md0): what a guest sees is
 * driven by the host's configs (visibility / accepting_uploads / allow_anonymous_uploads),
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

/**
 * The host-facing "best" share URL: the custom slug when set, else the permanent
 * qr_token URL (host-app.md). For DASHBOARD display/copy of the prettier link only — the
 * QR and the guest page's canonical link stay on the qr_token, since the slug is mutable
 * and the printed/permanent link must never break.
 */
export function preferredEventUrl(
  siteUrl: string,
  { qrToken, customSlug }: { qrToken: string; customSlug: string | null },
): string {
  return eventUrl(siteUrl, customSlug ?? qrToken);
}
