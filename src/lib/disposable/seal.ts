/**
 * THE SEAL'S ONE PREDICATE, ITS APP HALF.
 *
 * A row is sealed while `sealed_until` is ahead of now; NULL is visible. In SQL the predicate is
 * `(m.sealed_until is null or m.sealed_until <= now() or <the host asks>)` in every home a guest's view reaches
 * (20261002200000; `src/lib/disposable/migration-guards.test.ts` holds each home to it). The guest path's own
 * PostgREST reads run on the service role, which has no session, so they read as a guest whoever is asking: this is
 * their column filter, `.or(unsealedFilter(nowIso()))`.
 *
 * ★ THE GUEST'S PAGE IS THE GUESTS' VIEW, ITS HOST'S INCLUDED. The host meets her sealed album under its cover on her
 * dashboard; on the album's own link she sees what a guest sees (the waiting room), so no guest-path read takes an
 * owner exemption, and two viewers of one page never hold two different albums under one validator.
 *
 * ★ LAZY, AND A WRITE CLOSES IT. Past the develop time a row reads visible here at once; `develop_due` (the album's
 * first read after it, the daily sweep) then clears the row, which moves the album's versions so every open page hears.
 */

/** The PostgREST logic tree for "not sealed now": `.or(unsealedFilter(nowIso()))`. The timestamp rides unquoted. */
export function unsealedFilter(nowIso: string): string {
  return `sealed_until.is.null,sealed_until.lte.${nowIso}`;
}

/** Now, as the filter and the SQL compare it (an ISO string; the database parses it as a timestamptz). */
export function nowIso(nowMs: number = Date.now()): string {
  return new Date(nowMs).toISOString();
}

/** Whether a row's seal holds at `nowMs`: the predicate itself, for a row already read. */
export function isSealed(
  sealedUntil: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!sealedUntil) return false;
  const at = Date.parse(sealedUntil);
  return Number.isFinite(at) && at > nowMs;
}
