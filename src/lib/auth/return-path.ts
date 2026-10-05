/**
 * WHERE A SIGN-IN MAY SEND SOMEONE BACK (crumbs-11): the page a signed-out visitor asked for,
 * carried through the gate, `/login`, both sign-in methods and back, so a mail's button
 * (Renew Event Pass to /account/renew, Manage storage to /dashboard) lands where it points, and
 * a signed-out Get Pro on /pricing, the one marketing page here, comes back to /pricing.
 *
 *   gate ((app) or (print) layout, or the portal's `requireAdmin`, a signed-out request)
 *     -> /login?next=<path>                         (the proxy hands the gate its path: a layout
 *                                                    cannot read its own URL)
 *     -> the email code or a password: in the page  -> router.push(<path>)
 *     -> Google, or the email's link:  /auth/callback?next=<path>&code=... -> <path>
 *        (on the admin host the callback stays bare, and <path> rides ADMIN_RETURN_COOKIE)
 *
 * ★ AN ALLOW-LIST, NOT A SANITIZER, the checkout's rule for the checkout's reason
 * (components/app/pricing/return-path.ts): a path a browser will follow is either one of the exact
 * shapes below or it is nothing, never a cleaned-up version of what arrived. A blocklist loses to
 * a scheme, `//host`, a backslash, a percent-encoded slash pair or a newline splice; an exact
 * shape loses to none of them, because not one of them allows `:`, `/` doubled, `\`, `%`, `.`,
 * whitespace or a control character. Each refusal is pinned in return-path.test.ts.
 *
 * ★ A PATH, NEVER A QUERY. A query opens a mode, a modal or a marker on the page (`?reset=1`,
 * `?welcome=pro`, `?email_change=`); none is worth carrying through a sign-in and each is one more
 * thing a link could be made to say. So no shape takes one.
 *
 * ★ A FRAGMENT ONLY AS ONE OF THE PRODUCT'S OWN ANCHORS (crumbs-20). A fragment never reaches a
 * server, so no gate can carry one: the browser keeps it across the gate's redirect, `/login` reads
 * it off `location.hash` and asks `returnWithAnchor`, and what may ride back is a `page#section`
 * PAIR a mail links into (`ANCHORED_RETURNS`, each one exact string, named where the mail names it:
 * `lib/email/links.ts`). Any other fragment, or a listed one on another page, reads as no fragment at
 * all: the page stands and the anchor is dropped, never a cleaned-up copy of what arrived.
 *
 * ★ EACH HOST RETURNS TO ITS OWN PAGES (crumbs-14). The portal's pages are a return on the admin
 * host alone and the app's everywhere else, so a sign-in on the admin host never lands on an apex
 * page (the admin deployment 404s every one) and the apex never lands in the portal (the app
 * deployment 404s `/admin`). Where no admin host is configured (local dev) the app's list applies.
 *
 * Pure strings, no env and no `server-only`, like the checkout's: the /login form, the proxy, the
 * callback route and the checkout's own module all import it, and so can any unit test.
 */

import { PASS_REMINDERS_PATH } from "@/lib/email/links";

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

/** A string as the one pattern that matches it whole, its punctuation taken literally. */
function exactly(value: string): RegExp {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}$`);
}

/**
 * The `page#section` pairs a mail links into: the one place a fragment is welcome through a sign-in
 * (it is a section of a page the person already asked for, and each pair is named once, beside the
 * mail that sends it). Today: the renewal nudge's unsubscribe, the Email preferences row on the
 * account page. Adding one means the mail and the page's own `id` already agree, and nothing else
 * on the page reads the fragment as an instruction.
 */
const ANCHORED_RETURNS: readonly string[] = [PASS_REMINDERS_PATH];

/**
 * Every page a sign-in may return to off the admin host, anchored end to end. Adding one means
 * asking what it can be made to mean; a page not here simply lands on the host's home.
 */
const APP_RETURNS: readonly RegExp[] = [
  // The host app, which the (app) and (print) gates protect.
  /^\/dashboard$/,
  /^\/dashboard\/new$/,
  new RegExp(`^/dashboard/${UUID}$`),
  new RegExp(`^/dashboard/${UUID}/(guests|reel|review|settings|print)$`),
  /^\/account$/,
  /^\/account\/(profile|renew)$/,
  // The owner mode at an address that needs no handle: the user menu's Your profile for an account without one.
  /^\/me$/,
  /^\/welcome$/,
  // The one marketing page: a signed-out Get Pro presses from it (the CheckoutButton hands the router
  // `loginPath(window.location.pathname)`), so the sign-in comes back to the page she came from rather than
  // the dashboard (pricing-doors). Nothing on it is private and nothing on it reads a query or a fragment.
  /^\/pricing$/,
  // The album and the profile page, which a guest's door (a like, the confirm door, a named
  // guest's sign-in) comes back to through the callback.
  new RegExp(`^/e/${NAME}$`),
  new RegExp(`^/u/${NAME}$`),
  // The mail's anchors: a page and one section of it, each pair exact (see ANCHORED_RETURNS).
  ...ANCHORED_RETURNS.map(exactly),
];

/**
 * The portal's sections, by name: each a page behind the gate. A section the nav adds is refused
 * here until it is named (`return-path.test.ts` holds every `NAV` entry and every page file to it).
 */
const PORTAL_SECTIONS = [
  "metrics",
  "help-feedback",
  "support",
  "applicants",
  "reports",
  "accounts",
  "albums",
  "announcements",
  "exports",
  "forensics",
  "jobs",
  "security",
].join("|");

/**
 * Every page a sign-in may return to ON THE ADMIN HOST: the portal's home, a section, and the two
 * sections with a page per row (an account, an album). `requireAdmin()` sends the page an operator
 * asked for, so a deep link (a report's alert, a bookmark) lands where it points once she is
 * through Google and her second factor. A route that is not a page (the forensic export) is none.
 */
const PORTAL_RETURNS: readonly RegExp[] = [
  /^\/admin$/,
  new RegExp(`^/admin/(${PORTAL_SECTIONS})$`),
  new RegExp(`^/admin/(accounts|albums)/${UUID}$`),
];

/**
 * The path a sign-in on this host may return to, or null: never a transformed copy of the input.
 * `onAdminHost` is `isAdminHost()` of the request's (or the window's) host.
 */
export function signInReturn(
  value: unknown,
  onAdminHost = false,
): string | null {
  return matchesPathShape(value, onAdminHost ? PORTAL_RETURNS : APP_RETURNS)
    ? value
    : null;
}

/**
 * The return WITH the fragment the visitor arrived on, when the pair is one of the mail's anchors
 * (`/account` + `#event-pass-reminders`); the return alone otherwise, and null when there is none.
 * `/login` calls it with `location.hash`, the only place the fragment can be read: the gate's
 * redirect keeps it in the browser and no server ever sees it. Never a transformed copy: the pair
 * either matches an anchored shape whole or the fragment is dropped, so a hostile hash costs the
 * visitor the scroll and nothing else.
 */
export function returnWithAnchor(
  next: unknown,
  hash: unknown,
  onAdminHost = false,
): string | null {
  const page = signInReturn(next, onAdminHost);
  if (page === null || typeof hash !== "string" || hash === "") return page;
  return signInReturn(`${page}${hash}`, onAdminHost) ?? page;
}

/**
 * Where a finished sign-in lands: its return when it has one, else the host's home (the portal on
 * the admin host, `isAdminHost`, and the dashboard everywhere else). The one home of that rule:
 * /login's already-signed-in redirect, its form and the callback all ask it.
 */
export function signInLanding(next: unknown, onAdminHost: boolean): string {
  return (
    signInReturn(next, onAdminHost) ?? (onAdminHost ? "/admin" : "/dashboard")
  );
}

/** `url` carrying the return, when there is one (encoded, so a path survives any query). */
export function withReturn(url: string, next: string | null): string {
  if (!next) return url;
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}${NEXT_PARAM}=${encodeURIComponent(next)}`;
}

/** The sign-in page, carrying the page a gate refused when that page may be returned to. */
export function loginPath(requested: unknown, onAdminHost = false): string {
  return withReturn("/login", signInReturn(requested, onAdminHost));
}

/**
 * THE ADMIN HOST'S CALLBACK IS BARE, SO THE PAGE RIDES A COOKIE. GoTrue's allow-list entry for the
 * admin callback is exact (a query there lands the operator on the apex's Site URL), so Google and
 * the email's link cannot carry `?next=` through it. The login form on the admin host leaves the
 * page here instead, and the callback reads it, checks it against the portal's pages again and
 * clears it: sent only to the callback, for ten minutes, a page and nothing else.
 */
export const ADMIN_RETURN_COOKIE = "pr_admin_return";
export const ADMIN_RETURN_COOKIE_PATH = "/auth/callback";
const ADMIN_RETURN_MAX_AGE = 600;

/**
 * The `document.cookie` line that leaves `page` for the admin host's callback, or clears the
 * cookie when `page` is not one of the portal's pages. Only an allow-listed page is ever written,
 * so the value needs no encoding (a portal page is `[a-z0-9/-]`).
 */
export function adminReturnCookie(page: unknown, secure: boolean): string {
  const kept = signInReturn(page, true);
  const scope = `Path=${ADMIN_RETURN_COOKIE_PATH}; SameSite=Lax${secure ? "; Secure" : ""}`;
  return kept
    ? `${ADMIN_RETURN_COOKIE}=${kept}; Max-Age=${ADMIN_RETURN_MAX_AGE}; ${scope}`
    : `${ADMIN_RETURN_COOKIE}=; Max-Age=0; ${scope}`;
}

/** The cookie's value from a `Cookie` request header, or null: the caller re-checks it. */
export function adminReturnFromCookies(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === ADMIN_RETURN_COOKIE) return value.join("=");
  }
  return null;
}
