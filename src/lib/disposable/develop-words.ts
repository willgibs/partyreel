/**
 * THE DEVELOP TIME, SAID IN THE HOST'S FORMAT: her Settings says it in this one function ("Develops Sat, Oct 3, 9:00
 * AM."), where she picks the exact time. Every guest screen says the wait in its own words (`wait-words.ts`: "All at
 * once at 9 am", from now, as the album's camera always said it), so each side reads one home and none builds a
 * formatter of its own (`develop-words.test.ts` holds both).
 *
 * ★ THE VIEWER'S OWN ZONE, IN THE PRODUCT'S PINNED LANGUAGE: a caller draws it after hydration (a server render has
 * no idea what "9 am" means to her), and `en-US` is fixed, so a phone's locale never rewords the sentence.
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
