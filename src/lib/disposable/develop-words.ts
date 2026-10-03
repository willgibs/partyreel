/**
 * THE DEVELOP TIME, SAID IN ONE FORMAT. The host's Settings ("Develops Sat, Oct 3, 9:00 AM.") and the guest's
 * tracker and keep prompt ("when it develops, Sat, Oct 3, 9:00 AM") each carried a copy of this formatter, so a
 * change to one was a change the other never heard. It lives here, beside the develop it words.
 *
 * ★ THE VIEWER'S OWN ZONE, IN THE PRODUCT'S PINNED LANGUAGE: a caller draws it after hydration (a server render has
 * no idea what "9 am" means to her), and `en-US` is fixed, so a guest's phone locale never rewords a host's sentence.
 * The sentence around the time is each side's own; only the time is shared.
 *
 * Pure and isomorphic, like its neighbours.
 */
const DEVELOP_TIME = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** "Sat, Oct 3, 9:00 AM", or null for no time or one it cannot read. */
export function developTimeWords(
  iso: string | null | undefined,
): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  return Number.isFinite(at.getTime()) ? DEVELOP_TIME.format(at) : null;
}
