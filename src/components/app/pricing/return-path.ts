/**
 * WHERE STRIPE MAY LAND A BUYER (`back=finish`, Will 2026-09-20: "Checkout
 * returns to the exact control that was locked, now open and waiting").
 *
 * ★ THIS IS AN ALLOW-LIST, NOT A SANITIZER, AND THE DIFFERENCE IS THE POINT.
 * `success_url` is the one string in the product a browser follows without
 * asking, Stripe validates none of it (the SDK types it `string`), and the
 * value arrives on a POST body the caller controls. A blocklist ("reject
 * anything starting with http") loses to `//evil.com`, a backslash host, a
 * percent-encoded slash pair and a newline splice; an exact-shape allow-list
 * loses to none of them, because a path that is not on the list is simply
 * replaced with the dashboard. Add a shape here only after asking what it can
 * be made to mean.
 *
 * ★ AND IT IS THE SET OF PAGES THAT CAN ACTUALLY SAY HELLO. Every path below
 * mounts `WelcomeToPro`; a return to a page that does not would be a purchase
 * that visibly did nothing. Adding a shape means mounting the modal there in
 * the same change.
 *
 * Client-safe and import-safe from a route handler: pure strings, no env, no
 * Stripe, no `server-only` neighbours (the checkout route imports it and so
 * does the button that POSTs to the route).
 */

/** The marker the returning page reads to know a purchase just completed. */
export const WELCOME_PARAM = "welcome";
export const WELCOME_VALUE = "pro";

/** Where a purchase with nothing to go back to lands (his own answer). */
export const DEFAULT_RETURN_PATH = "/dashboard";

/**
 * The exact shapes, anchored end to end. An event id is a UUID (the column's
 * type), and the only query a return may carry is the hub's own room, which is
 * what reopens the sheet the locked control lives in.
 */
const UUID =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const RETURN_SHAPES: readonly RegExp[] = [
  /^\/dashboard$/,
  new RegExp(`^/dashboard/${UUID}(\\?room=(share|settings))?$`),
  /^\/account$/,
];

/** Anything a legal path never holds: a control character is a splice attempt. */
const CONTROL_CHARS = /[\x00-\x1f\x7f]/;

/** True only for a path this module will hand to Stripe unchanged. */
export function isAllowedReturnPath(value: unknown): value is string {
  if (typeof value !== "string") return false;
  // Checked before the shapes so a multiline value can never satisfy a pattern
  // that some later edit leaves unanchored by accident.
  if (CONTROL_CHARS.test(value)) return false;
  return RETURN_SHAPES.some((shape) => shape.test(value));
}

/**
 * The path Stripe is given: the caller's, when it is one of ours, and the
 * dashboard otherwise. NEVER throws and never propagates the input, so a
 * hostile `next` is indistinguishable from no `next` at all.
 */
export function safeReturnPath(value: unknown): string {
  return isAllowedReturnPath(value) ? value : DEFAULT_RETURN_PATH;
}

/** The same path, carrying the marker that opens the welcome modal once. */
export function withWelcomeMarker(path: string): string {
  const join = path.includes("?") ? "&" : "?";
  return `${path}${join}${WELCOME_PARAM}=${WELCOME_VALUE}`;
}

/** That path with the marker removed: what the modal replaces the URL with. */
export function withoutWelcomeMarker(path: string): string {
  const [base, query = ""] = path.split("?");
  const rest = query
    .split("&")
    .filter((part) => part && part !== `${WELCOME_PARAM}=${WELCOME_VALUE}`)
    .join("&");
  return rest ? `${base}?${rest}` : base;
}
