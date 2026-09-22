/**
 * THE GUEST SESSION COOKIE, `pr_guest_<eventId>` (the door as three steps, Will 2026-09-21).
 *
 * Require an upload to view is enforced SERVER-SIDE, in the RSC and in the poll, and both of them
 * have to know WHICH guest is asking. Until this cookie the answer lived only in the browser's
 * localStorage, which a server render cannot read: the page would have resolved every anonymous
 * contributor as "has not contributed" and held them at a step they had already passed.
 *
 * ★ IT CARRIES THE RAW SESSION TOKEN, AND THAT IS THE CAPABILITY ITSELF (his to overrule). The same
 * 64-hex token the browser already holds in localStorage and posts on every upload, now also sent
 * by the browser automatically on a same-site navigation. It is UNSIGNED on purpose: the database
 * verifies it against `guests.session_token`'s unique index, so a forged value resolves to no row
 * and the shape guard below keeps anything that is not a token from ever reaching a query.
 *
 * ★ HttpOnly, so the one new copy of the capability is strictly LESS reachable than the localStorage
 * original (script cannot read it); Secure in production; SameSite=Lax so a scan from a messaging
 * app's in-app browser still carries it on the top-level navigation that matters, while a
 * cross-site POST does not. Path `/` because the poll (`/api/guests/gallery`) is not under `/e/`.
 *
 * ★ THE WRITE ROUTES NEVER READ IT. The name, mine, remove, presign and complete routes keep taking
 * the session token from the BODY only (pinned by `body-token-source.test.ts`), so this cookie adds
 * a READ capability to the request and moves the CSRF surface not one inch.
 *
 * ★ AND A SHARED PHONE CAN PUT IT DOWN: `POST /api/guests/leave` expires it, called from the guest
 * sign-out and the leave paths, so the last contributor's ticket does not open the full album for
 * whoever picks the phone up next.
 */
import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

/** Sixty days: a wedding album is looked at for weeks, and the token behind it never expires. */
export const GUEST_SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 60;

/**
 * `create_guest` mints `replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')`,
 * i.e. exactly 64 lowercase hex characters. Anything else never leaves this module.
 */
const SESSION_TOKEN_SHAPE = /^[0-9a-f]{64}$/;

export function guestSessionCookieName(eventId: string): string {
  return `pr_guest_${eventId}`;
}

/** The attributes every write of this cookie shares (one place, so a route cannot drift). */
export function guestSessionCookieAttrs(): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_SESSION_COOKIE_MAX_AGE,
  };
}

/**
 * Read this request's guest session token for an event, or null. SHAPE-GUARDED: a hand-edited or
 * truncated cookie value never reaches a query, so the only strings that travel are ones that could
 * be a real token.
 */
export async function readGuestSessionCookie(
  eventId: string,
): Promise<string | null> {
  const store = await cookies();
  const value = store.get(guestSessionCookieName(eventId))?.value;
  if (!value || !SESSION_TOKEN_SHAPE.test(value)) return null;
  return value;
}

/** Is this a token we would be willing to write? (The same guard, for a route's own body value.) */
export function isSessionTokenShape(value: unknown): value is string {
  return typeof value === "string" && SESSION_TOKEN_SHAPE.test(value);
}

/**
 * ONE WRITE SHAPE for every door that mints or heals (the join, the name, a completed upload, the
 * poll's heal) and for the one that puts it down (`/api/guests/leave`). A route holding a
 * `NextResponse` applies it with `applyGuestCookies`; the poll's bare 304 has no `NextResponse` to
 * hang it on, so it takes `guestCookieHeaderValue` instead.
 */
export type GuestCookieWrite = { name: string; value: string; maxAge: number };

/** The mint / heal write, or null when the token is not one (nothing else is ever written). */
export function guestSessionCookieWrite(
  eventId: string,
  token: string,
): GuestCookieWrite | null {
  if (!isSessionTokenShape(token)) return null;
  return {
    name: guestSessionCookieName(eventId),
    value: token,
    maxAge: GUEST_SESSION_COOKIE_MAX_AGE,
  };
}

/** The expiry write for `POST /api/guests/leave` (and any other put-it-down path). */
export function guestSessionCookieClear(eventId: string): GuestCookieWrite {
  return { name: guestSessionCookieName(eventId), value: "", maxAge: 0 };
}

/**
 * Should this response write at all? Only when the request does not already carry this exact
 * token, so the steady-state poll and every repeat upload send no `Set-Cookie` at all.
 */
export async function guestSessionCookieIfChanged(
  eventId: string,
  token: string | null | undefined,
): Promise<GuestCookieWrite | null> {
  if (!token || !isSessionTokenShape(token)) return null;
  if ((await readGuestSessionCookie(eventId)) === token) return null;
  return guestSessionCookieWrite(eventId, token);
}

/** Apply writes to a `NextResponse` (the ordinary case). */
export function applyGuestCookies(
  response: NextResponse,
  writes: readonly (GuestCookieWrite | null | undefined)[],
): void {
  const attrs = guestSessionCookieAttrs();
  for (const write of writes) {
    if (!write) continue;
    response.cookies.set({
      name: write.name,
      value: write.value,
      httpOnly: attrs.httpOnly,
      secure: attrs.secure,
      sameSite: attrs.sameSite,
      path: attrs.path,
      maxAge: write.maxAge,
    });
  }
}

/**
 * The raw `Set-Cookie` value, for a response with no `NextResponse` to hang it on. The poll's 304
 * is exactly that case, and it is the response the steady-state poll almost always gets, so a heal
 * that could not ride it would almost never land.
 */
export function guestCookieHeaderValue(write: GuestCookieWrite): string {
  const attrs = guestSessionCookieAttrs();
  return [
    `${write.name}=${write.value}`,
    `Path=${attrs.path}`,
    `Max-Age=${write.maxAge}`,
    "SameSite=Lax",
    "HttpOnly",
    ...(attrs.secure ? ["Secure"] : []),
  ].join("; ");
}
