/**
 * THE NAME A TAPPED LINK ADOPTED, LEFT FOR THE ALBUM TO TELL (crumbs-88; `adopt-door-name.ts`, `lib/guest/confirm-beat.ts`).
 *
 * A guest who confirms by the emailed link leaves the page, so the callback adopts the name she typed at the door on the
 * server, and the album she lands on is a fresh load that was never told: she was never said the name her photographs carry
 * nor offered its Change, as the in-page confirm does (`entry-modal.tsx`'s beat, "You're on as Priya."). The callback leaves
 * that one fact in a short-lived cookie, and the album's mount takes it and reports the one beat every confirmation says.
 *
 * ★ A COOKIE, NEVER A QUERY: a name is a person's own, and an address is read into logs, history and shared links. The
 * cookie is bound to the ALBUM it was left for (a stale one for another album tells nothing), lives two minutes, and is
 * spent by the read. It is the callback's word, never an authority: the name is the account's own (the profile's, which the
 * server just read), and the reader checks it as any name (`displayNameSchema`) before it says it.
 *
 * Plain and isomorphic: the callback (a route) writes it and the album's page (a client) reads it.
 */
import { displayNameSchema } from "@/lib/validation/profile";

export const TOLD_NAME_COOKIE = "pr_told_name";

/** Long enough for the redirect and the page's load; the read spends it, and nothing outlives the minute it is for. */
export const TOLD_NAME_MAX_AGE_S = 120;

/**
 * The cookie's value: the album it was left for and the name, as one object. Left as JSON for the cookie jar to encode
 * (`NextResponse.cookies.set` percent-encodes a value as it writes it), so what a browser holds, and `toldNameFrom` reads,
 * is that encoding once.
 */
export function toldNameValue(album: string, name: string): string {
  return JSON.stringify({ a: album, n: name });
}

/**
 * The name the cookie left for THIS album, from the value as `document.cookie` holds it (percent-encoded), checked as any
 * name is, or null for none, another album's, or a malformed one.
 */
export function toldNameFrom(
  raw: string | null | undefined,
  album: string,
): string | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(decodeURIComponent(raw));
    if (!value || typeof value !== "object") return null;
    const { a, n } = value as { a?: unknown; n?: unknown };
    if (a !== album || typeof n !== "string") return null;
    const checked = displayNameSchema.safeParse(n);
    return checked.success ? checked.data : null;
  } catch {
    return null;
  }
}
