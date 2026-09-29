/**
 * WHERE A SIGN-IN MAY SEND SOMEONE BACK (crumbs-11): the page a signed-out visitor asked for,
 * carried through the gate, `/login`, both sign-in methods and back, so a mail's button
 * (Renew Event Pass to /account/renew, Manage storage to /dashboard) lands where it points.
 *
 *   gate ((app) or (print) layout, a signed-out request)
 *     -> /login?next=<path>                         (the proxy hands the gate its path: a layout
 *                                                    cannot read its own URL)
 *     -> the email code or a password: in the page  -> router.push(<path>)
 *     -> Google, or the email's link:  /auth/callback?next=<path>&code=... -> <path>
 *
 * ★ AN ALLOW-LIST, NOT A SANITIZER, the checkout's rule for the checkout's reason
 * (components/app/pricing/return-path.ts): a path a browser will follow is either one of the exact
 * shapes below or it is nothing, never a cleaned-up version of what arrived. A blocklist loses to
 * a scheme, `//host`, a backslash, a percent-encoded slash pair or a newline splice; an exact
 * shape loses to none of them, because not one of them allows `:`, `/` doubled, `\`, `%`, `.`,
 * whitespace or a control character. Each refusal is pinned in return-path.test.ts.
 *
 * ★ A PATH, NEVER A QUERY OR A FRAGMENT. A query opens a mode, a modal or a marker on the page
 * (`?reset=1`, `?welcome=pro`, `?email_change=`); none is worth carrying through a sign-in and
 * each is one more thing a link could be made to say. So no shape takes one.
 *
 * Pure strings, no env and no `server-only`, like the checkout's: the /login form, the proxy, the
 * callback route and the checkout's own module all import it, and so can any unit test.
 */

/** The query parameter that carries the path through `/login` and `/auth/callback`. */
export const NEXT_PARAM = "next";

/**
 * The request header the proxy writes with the path a request asked for. Always overwritten there,
 * so a client's own copy never reaches a gate; the gate re-checks it here anyway.
 */
export const REQUEST_PATH_HEADER = "x-pr-path";

/** No shape is longer; the proxy never copies a longer path into a header. */
export const RETURN_PATH_MAX = 128;

/** Anything a legal path never holds: a control character is a splice attempt. */
const CONTROL_CHARS = /[\x00-\x1f\x7f]/;

/**
 * True only when `value` is a string one of `shapes` matches whole. The one matcher behind both
 * allow-lists: this module's and the checkout's.
 */
export function matchesPathShape(
  value: unknown,
  shapes: readonly RegExp[],
): value is string {
  if (typeof value !== "string" || value.length > RETURN_PATH_MAX) return false;
  // Checked before the shapes so a multiline value can never satisfy a pattern that some later
  // edit leaves unanchored by accident.
  if (CONTROL_CHARS.test(value)) return false;
  return shapes.some((shape) => shape.test(value));
}

const UUID =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
/** An album's token (32 hex) or custom link, or a handle: the `[a-z0-9-]` a slug is, in any case. */
const NAME = "[A-Za-z0-9-]{3,64}";

/**
 * Every page a sign-in may return to, anchored end to end. Adding one means asking what it can be
 * made to mean; a page not here simply lands on the host's home.
 */
const SIGN_IN_RETURNS: readonly RegExp[] = [
  // The host app, which the (app) and (print) gates protect.
  /^\/dashboard$/,
  /^\/dashboard\/new$/,
  new RegExp(`^/dashboard/${UUID}$`),
  new RegExp(`^/dashboard/${UUID}/(guests|reel|review|settings|print)$`),
  /^\/account$/,
  /^\/account\/(profile|renew)$/,
  /^\/welcome$/,
  // The portal, whose own gate already sends `?next=/admin` (requireAdmin).
  /^\/admin$/,
  // The album and the profile page, which a guest's door (a like, the confirm door, a named
  // guest's sign-in) comes back to through the callback.
  new RegExp(`^/e/${NAME}$`),
  new RegExp(`^/u/${NAME}$`),
];

/** The path a sign-in may return to, or null: never a transformed copy of the input. */
export function signInReturn(value: unknown): string | null {
  return matchesPathShape(value, SIGN_IN_RETURNS) ? value : null;
}

/**
 * Where a finished sign-in lands: its return when it has one, else the host's home (the portal on
 * the admin host, `isAdminHost`, and the dashboard everywhere else). The one home of that rule:
 * /login's already-signed-in redirect, its form and the callback all ask it.
 */
export function signInLanding(next: unknown, onAdminHost: boolean): string {
  return signInReturn(next) ?? (onAdminHost ? "/admin" : "/dashboard");
}

/** `url` carrying the return, when there is one (encoded, so a path survives any query). */
export function withReturn(url: string, next: string | null): string {
  if (!next) return url;
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}${NEXT_PARAM}=${encodeURIComponent(next)}`;
}

/** The sign-in page, carrying the page a gate refused when that page may be returned to. */
export function loginPath(requested: unknown): string {
  return withReturn("/login", signInReturn(requested));
}
