/**
 * mustQuery / mustCount — THE FAILED-QUERY GUARD.
 *
 * WHY THIS EXISTS (the failure mode, named so nobody re-introduces it):
 * PostgREST builders never REJECT. A dead connection, a revoked grant, a typo'd
 * column, an RLS denial and a genuinely empty table all RESOLVE the same shape,
 * differing only in `error`. So the innocent-looking
 *
 *     const { data } = await supabase.from("media").select("id, file_size_bytes");
 *     for (const row of data ?? []) …
 *
 * reads a BROKEN query as an EMPTY RESULT, and the code downstream then acts on
 * that lie with full confidence. The 2026-07 adversarial QA round found this
 * class everywhere it mattered most: an export that reported a 40 GB album as
 * "empty" (and so slipped past the 20 GB cap), kill switches that re-enabled
 * themselves because the flag read came back undefined, health counters that
 * reported zero rejections while the table was unreachable, a Pro host getting
 * the free-tier watermark because the tier read failed. Every one of them looked
 * like a successful no-op.
 *
 * THE RULE: wrap any read whose empty result would be ACTED ON. `mustQuery`
 * turns the `{ error }` branch into a throw, so a failed query fails loudly
 * instead of impersonating an empty one.
 *
 * `null` still flows through untouched: `.maybeSingle()` legitimately answers
 * "no such row", so the return type stays exactly what the builder resolves
 * (`Row[]`, `Row | null`, `Row`) and existing null-checks keep working.
 *
 * DELIBERATE SWALLOWS ARE STILL ALLOWED — an authz probe that must fail CLOSED
 * (a failed read denying access is the safe answer) should keep ignoring the
 * error, but say so: an `eslint-disable-next-line partyreel/no-swallowed-db-error`
 * with a one-line WHY. The lint rule exists so the choice is always explicit.
 */
import type { PostgrestError } from "@supabase/supabase-js";

/** What every PostgREST builder / `.rpc()` resolves to, narrowed to what we read. */
type QueryResult<T> = { data: T; error: PostgrestError | null };
type CountResult = { count: number | null; error: PostgrestError | null };

/**
 * A failed PostgREST query, re-thrown as a real Error so it reaches the error
 * boundary / route catch / Sentry instead of dissolving into an empty array.
 * The original PostgrestError rides along as `cause` (code + details + hint).
 */
export class QueryFailedError extends Error {
  readonly code: string | undefined;

  constructor(context: string, cause: PostgrestError) {
    // `cause.message` is PostgREST's own text; `context` is the call site's
    // label, which is what makes an alert readable at 3am.
    super(`${context}: ${cause.message}`, { cause });
    this.name = "QueryFailedError";
    this.code = cause.code;
  }
}

/**
 * Await a PostgREST query and THROW on `{ error }` instead of letting a failed
 * query read as an empty one.
 *
 *     const rows = await mustQuery(
 *       admin.from("media").select("id, file_size_bytes").in("id", ids),
 *       "export/guest: media sizes",
 *     );
 *
 * Takes the builder itself (builders are thenables), so the call site never
 * grows an intermediate `{ data, error }` object to destructure.
 *
 * @param context short call-site label, e.g. "export/guest: media sizes".
 */
export async function mustQuery<T>(
  query: PromiseLike<QueryResult<T>>,
  context: string,
): Promise<T> {
  const { data, error } = await query;
  if (error) throw new QueryFailedError(context, error);
  return data;
}

/**
 * The `{ count: "exact", head: true }` twin. A failed COUNT is the nastiest
 * shape of all: it reads as a confident ZERO, which is exactly the value that
 * says "nothing to see here" on every health signal and every cap check.
 * Returns 0 only when the query genuinely counted zero rows.
 */
export async function mustCount(
  query: PromiseLike<CountResult>,
  context: string,
): Promise<number> {
  const { count, error } = await query;
  if (error) throw new QueryFailedError(context, error);
  return count ?? 0;
}
