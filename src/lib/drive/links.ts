/**
 * WHERE SEND TO GOOGLE DRIVE POINTS INTO THE APP, each place named once (a mail, a toast, the flag and the page it lands
 * on cannot drift apart). Pure strings.
 */

/** Account's Google Drive card (`id` on the card): where Disconnect and Reconnect live. */
export const DRIVE_ACCOUNT_ANCHOR = "google-drive";

/** The card, from anywhere. */
export const DRIVE_ACCOUNT_PATH = `/account#${DRIVE_ACCOUNT_ANCHOR}`;

/** An album's hub, where its send's strip stands at the album's head. */
export function albumPath(eventId: string): string {
  return `/dashboard/${eventId}`;
}

/** Connect (or reconnect) Google Drive, landing back on `next` (an app path; the connect route re-checks it). */
export function connectHref(next: string): string {
  return `/api/drive/connect?next=${encodeURIComponent(next)}`;
}

/**
 * A HINT, NEVER A GATE: set when she connects or presses Send, cleared on Disconnect, so the places that would poll her
 * sends (the app-wide flag, the album's strip, the dashboard's lights) poll only for a host who uses Drive. Every host
 * page asking `/api/drive/status` for nothing would spend the Vercel CPU the program counts in hours. Readable by the
 * page (not HttpOnly) and worth nothing to anyone: what it gates is a read of her own rows behind `getUser()`.
 */
export const DRIVE_HINT_COOKIE = "pr_drive";

/** The hint's life: a year (re-set by every press). */
export const DRIVE_HINT_MAX_AGE_S = 365 * 24 * 60 * 60;

/** Whether this browser has the hint (client only). */
export function hasDriveHint(): boolean {
  return (
    typeof document !== "undefined" &&
    document.cookie.split(/;\s*/).includes(`${DRIVE_HINT_COOKIE}=1`)
  );
}
