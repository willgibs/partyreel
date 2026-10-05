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
