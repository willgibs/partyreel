/**
 * WHERE A MAIL POINTS INTO THE APP, each place named once so the mail and the page it lands on cannot
 * drift apart (the renewal nudge's two links, `emails` r1). Pure strings: the sweep that sends and
 * the client form that holds the anchor both import them.
 */

/** The Email preferences row that governs the renewal nudge (notification-prefs-form.tsx). */
export const PASS_REMINDERS_ANCHOR = "event-pass-reminders";

/** The renewal nudge's unsubscribe: the switch itself, on the account page. */
export const PASS_REMINDERS_PATH = `/account#${PASS_REMINDERS_ANCHOR}`;

/**
 * The renewal nudge's button: the page that starts the pass's renewal Checkout
 * (src/app/(app)/account/renew). A mail link cannot POST, and the checkout route is a POST.
 */
export const RENEW_PASS_PATH = "/account/renew";
