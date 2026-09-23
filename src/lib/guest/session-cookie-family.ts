/**
 * THE GUEST TICKET COOKIE'S FAMILY: its name, the attributes every write of it shares, and how every
 * one of them is expired at once (the upload-owner lane, 2026-09-23).
 *
 * `session-cookie.ts` is the server's reads and writes of `pr_guest_<eventId>`, behind the
 * `server-only` guard. This is the part of it that is not a read of anybody's request: a name, a set
 * of flags and a loop over a cookie store the caller hands in. It lives apart because the account
 * sign-out (`signOutAction`) has to expire the whole family, and its module is imported by the
 * account menu, a client component, so every component test that mounts the menu loads it for
 * real, where `server-only` does not resolve. Nothing here is secret and nothing here reads a
 * request, so it needs no guard: the store is injected.
 */

/** The one family name. `pr_guest_<eventId>` is the only cookie that starts with it. */
export const GUEST_SESSION_COOKIE_PREFIX = "pr_guest_";

/** Sixty days: a wedding album is looked at for weeks, and the token behind it never expires. */
export const GUEST_SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 60;

/**
 * Is this cookie one of the family? By prefix, deliberately, because the sign-out's promise is
 * "every guest ticket on this browser" and the family is defined by the prefix alone. The signed
 * unlock (`pr_unlock_<eventId>`) and the tile size (`pr_tile_size`) are other families and stay:
 * neither is a ticket, and neither names a person.
 */
export function isGuestSessionCookieName(name: string): boolean {
  return (
    name.startsWith(GUEST_SESSION_COOKIE_PREFIX) &&
    name.length > GUEST_SESSION_COOKIE_PREFIX.length
  );
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

/** The slice of a Next cookie store the expiry needs (the Server Function's `cookies()`). */
type CookieStoreLike = {
  getAll(): { name: string }[];
  set(cookie: {
    name: string;
    value: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
  }): unknown;
};

/**
 * EXPIRE EVERY GUEST TICKET COOKIE THIS REQUEST CARRIED, on the store a Server Function writes its
 * response through (the account sign-out). Only the names the browser actually sent are expired, so
 * nothing is invented and no other family is touched; each expiry wears the family's own attributes,
 * so it lands on exactly the cookie a mint wrote. Returns how many went, for the caller's own tests.
 */
export function expireGuestSessionCookies(store: CookieStoreLike): number {
  const attrs = guestSessionCookieAttrs();
  let expired = 0;
  for (const { name } of store.getAll()) {
    if (!isGuestSessionCookieName(name)) continue;
    store.set({
      name,
      value: "",
      httpOnly: attrs.httpOnly,
      secure: attrs.secure,
      sameSite: attrs.sameSite,
      path: attrs.path,
      maxAge: 0,
    });
    expired += 1;
  }
  return expired;
}
