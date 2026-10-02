/**
 * THE WELCOME'S SEEN-STATE, AS A COOKIE THE SERVER READS (door-reveal; Will's live walk of 2026-10-02:
 * "entered the address, full guest album was visible before gate appeared over it (big bug)").
 *
 * The welcome's seen-state lived in localStorage alone, which a server render cannot read, so the page drew
 * the album for every visitor and the door rose over it after hydration: 1 to 3 s of album before the door
 * on build 42. His rule: "the album is never visible before any door/gate that should be encountered first".
 * The flag is a cookie now, so the page's first byte draws the welcome for a newcomer and the album for a
 * returning guest at once (`entry-steps.ts`'s `doorArrival`).
 *
 * ★ A PLAIN FLAG, NOT A CAPABILITY: "1" or absent, nothing about the album or the person in it. Written and
 * put down by the page's own script (`use-welcome-seen.ts`), so it is not HttpOnly; read by the page's server
 * render. Path `/` so the app's own sign-out (on any page) can put every album's down.
 *
 * NO `"use client"` and no `server-only`: the page (a server module) and the hook (a client module) both read
 * the one name from here, and a client module's export reaches a server import as a reference, not a string.
 */

export const WELCOME_COOKIE_PREFIX = "pr_welcome_";

/** A year: once per person at an album, put down with her ticket (`forgetWelcome`). */
export const WELCOME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** The cookie for one album, by its canonical token (never a custom slug: the page reads `event.qr_token`). */
export function welcomeCookieName(qrToken: string): string {
  return `${WELCOME_COOKIE_PREFIX}${qrToken}`;
}

/** Whether a cookie store (the request's, `next/headers`) says this album's welcome was seen. */
export function welcomeSeenIn(
  store: { get: (name: string) => { value: string } | undefined },
  qrToken: string,
): boolean {
  return store.get(welcomeCookieName(qrToken))?.value === "1";
}
