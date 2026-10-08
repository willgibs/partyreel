/**
 * "YOU ALREADY HAD AN ACCOUNT" FOR A LINK THAT SIGNS CREATE ACCOUNT INTO ONE (crumbs-88; Will's `existing=tell`, 2026-09-20: "With
 * the streamlined magic link email login, it may feel easy to confuse 'create account' and 'login' screens. This makes
 * that mistake seamless, but still flags it just in case").
 *
 * The code says it in the door (`AccountDoor`'s ExistingAccount step, after `verifyOtp`); a tapped link leaves the page, so
 * its words ride the sign-in itself, in two small facts both ends share, written here once:
 *
 *   1. THE DOOR'S MARK: the Create account door puts `intent=create` on the callback address it hands the magic link and
 *      Google (`withCreateIntent`), so the callback knows which door the link came from. The mark is the door's WORD,
 *      never an answer: it only makes the callback ask.
 *   2. THE DASHBOARD'S MARK: the callback asks `checkExistingAccount` (the server's test, run after the exchange, about the
 *      caller's own row: never an oracle) and, on a yes, lands on `/dashboard?signed_in=existing`, which draws the one line
 *      (`ExistingAccountBanner`) and cleans its address. A hand-typed mark shows only what the viewer already is, signed in
 *      as herself: it asks nothing of the database and says only her own address.
 *
 * Plain and isomorphic: the door (a client), the callback (a route) and the dashboard's page all read it.
 */
import { isAdminHost } from "@/lib/auth/admin-host";

/** The door's mark on the callback address: which door the link came from. */
export const CREATE_INTENT_PARAM = "intent";
export const CREATE_INTENT = "create";

/** The dashboard's mark: the one value the callback sends (a hand-typed other shows nothing). */
export const EXISTING_PARAM = "signed_in";
export const EXISTING_VALUE = "existing";

/** The one landing the line is drawn on: the host's own home, where Create account leads. */
export const EXISTING_LANDING = "/dashboard";

/**
 * The callback address with the Create door's mark on it. ★ NEVER ON THE ADMIN HOST: its allow-list entry is EXACT
 * (GoTrue answers a query there with the Site URL, landing the operator's sign-in on the apex: `login-form.tsx`), and no
 * Create account door stands there. A value that is no absolute address is handed back whole.
 */
export function withCreateIntent(callback: string): string {
  try {
    const url = new URL(callback);
    if (isAdminHost(url.host)) return callback;
    url.searchParams.set(CREATE_INTENT_PARAM, CREATE_INTENT);
    return url.toString();
  } catch {
    return callback;
  }
}

/** Whether a callback request came from the Create account door. */
export function cameFromCreate(searchParams: URLSearchParams): boolean {
  return searchParams.get(CREATE_INTENT_PARAM) === CREATE_INTENT;
}

/** Whether a landing is the one the line is drawn on (the bare `/dashboard`, never a page a gate sent her back to). */
export function drawsExisting(landing: string): boolean {
  return landing === EXISTING_LANDING;
}

/** The dashboard, marked so it says what the code would have said. */
export function existingLanding(): string {
  return `${EXISTING_LANDING}?${EXISTING_PARAM}=${EXISTING_VALUE}`;
}
