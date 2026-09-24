/**
 * THE 1,000-ROW RULES, AND THE TWO HELPERS THAT KEEP THEM (the 1,000-row round, 2026-09-23).
 *
 * WHY THIS EXISTS: PostgREST answers at most `max_rows` rows per request (1,000 on this project,
 * `supabase/config.toml` `[api] max_rows`), and it cuts every table read and every set-returning
 * RPC there with NO error and NO flag. A read that outgrows one page therefore reads as a complete,
 * smaller list: an album that loses its oldest photos, a count that stops at 1,000, a sweep that
 * never reaches row 1,001. Measured live on the 1,200-photo scale probe (2026-09-23): an unbounded
 * `select id` over 1,024 rows returned 1,000 with `Content-Range: 0-999/*`. WRITES ARE NOT CAPPED:
 * a PATCH with `return=representation` over 1,040 rows returned all 1,040, so the rows a mutation
 * returns are complete.
 *
 * THE SIX RULES. This header is their home; the static guard is `row-cap-policy.test.ts` beside
 * this file, the runtime tripwire is `src/lib/supabase/row-cap-tripwire.ts`, and the SQL half
 * (every set-returning function pages or returns one row) is `docs/systems/database-security.md`.
 *
 *  1. A LIST IS READ WHOLE THROUGH `readAllPages`. A media list shown in order pages on
 *     `(created_at desc, id desc)`: an RPC takes the cursor as two parameters; a table read builds
 *     it with `.or("created_at.lt.<c>,and(created_at.eq.<c>,id.lt.<id>)")` plus two `.order()`s.
 *     The cursor is the raw timestamp STRING from the row, never a JS `Date`: microseconds decide
 *     ties, and a `Date` keeps milliseconds. Every other list pages on `id`.
 *  2. A COUNT IS COUNTED: `{ count: "exact", head: true }` or a SQL aggregate, never the length of
 *     a list read (a list read stops at 1,000, so its length does too).
 *  3. A RUNTIME ID LIST IS CHUNKED through `inChunks`, filtered on the parent
 *     (`events!inner(host_id)`), or passed as a `uuid[]` in an RPC's POST body. An `.in()` list
 *     rides the request URL (about 39 characters an id once encoded), and a long one fails the
 *     request outright or comes back clipped at 1,000 rows.
 *  4. A SET-RETURNING RPC takes `p_after` and `p_limit` (clamped in SQL to `least(p_limit, 1000)`),
 *     or returns one row (a scalar, a `jsonb`, a `uuid[]`).
 *  5. A SWEEP HAS A BUDGET AND REPORTS WHAT IT LEFT: `readAllPages` with `budget` hands back
 *     `more` and the `after` cursor, and the next run resumes there.
 *  6. A BOUND ON PURPOSE SAYS SO: a `.limit(n)` whose screen tells the person ("the newest 240"),
 *     or a `// row-cap: <why>` marker on the comment lines directly above the statement.
 *
 * ★ A SHORT PAGE IS THE END ONLY WHILE `MAX_ROWS` IS AT MOST THE LIVE `max_rows`. `readAllPages`
 * asks for `MAX_ROWS` a page and stops at the first page shorter than it asked for. If the live
 * setting ever went BELOW 1,000, every full page would come back short and read as the last one,
 * which is the silent truncation this file exists to end. So `max_rows` never goes below 1,000;
 * `row-cap-policy.test.ts` pins `MAX_ROWS` to `config.toml`, and the live value was verified on
 * 2026-09-23 (the probe above).
 *
 * Sentry stays OUT of `src/lib/db` (`src/lib/observability/sentry.ts`): a failed page THROWS a
 * `QueryFailedError` carrying the label, and the route or action that called in captures it.
 */
import type { PostgrestError } from "@supabase/supabase-js";

import { QueryFailedError } from "@/lib/db/must-query";

/** PostgREST's `max_rows` on this project: the most rows any one request can return. */
export const MAX_ROWS = 1000;

/**
 * At most this many ids ride one `.in()`. The list travels in the request URL, a uuid and its
 * encoded comma costing about 39 characters, so 150 keeps a read near 6 KB: inside postgrest-js's
 * own 8,000-character `urlLengthLimit`, inside every proxy's header budget, and far below the
 * 1,000-row cap. `social.ts`'s `PROFILE_CARD_BATCH` measured it first.
 */
export const IN_CHUNK = 150;

/** How many chunks `inChunks` runs at once: enough to hide latency, few enough to spare the pool. */
const CHUNK_CONCURRENCY = 4;

/** What one page resolves to: a PostgREST builder, an `.rpc()`, or a test's fake. */
export type PageResult<T> = { data: T[] | null; error: PostgrestError | null };

/** A page's rows, whether it reached the end, and where the next read resumes when it did not. */
export type AllPages<T, K> = { rows: T[]; more: boolean; after: K | null };

/**
 * Read a list to its last row, one keyset page at a time.
 *
 *     const { rows } = await readAllPages(
 *       "album: media",
 *       (after: { at: string; id: string } | null, limit) => {
 *         let q = supabase
 *           .from("media")
 *           .select("id, created_at")
 *           .eq("event_id", eventId)
 *           .order("created_at", { ascending: false })
 *           .order("id", { ascending: false })
 *           .limit(limit);
 *         if (after) q = q.or(`created_at.lt.${after.at},and(created_at.eq.${after.at},id.lt.${after.id})`);
 *         return q;
 *       },
 *       (row) => ({ at: row.created_at, id: row.id }),
 *     );
 *
 * `page` builds a FRESH query on every call, ALWAYS with `.limit(limit)`: a supabase-js builder
 * mutates its URL in place, so a builder reused across pages carries every earlier cursor with it.
 * `keyOf` reads the cursor off a page's last row. ★ ANNOTATE `after` (`string | null` for an id
 * cursor): `keyOf` comes after `page`, so TypeScript cannot infer the cursor from it and would
 * type `after` as `{}`; with the annotation it infers the rows from the query and checks `keyOf`
 * against the cursor.
 *
 * It stops at the first page shorter than `limit` (the header's ★ says why that is sound). It
 * THROWS a `QueryFailedError` with the label on an error, where the loops it replaces threw the
 * raw PostgREST error, a plain object and not an `Error`. It also throws on a page longer than it
 * asked for (the page forgot `.limit(limit)`) and on a cursor that did not advance (the page
 * ignored `after`), both of which would otherwise loop or overshoot a budget without a word.
 *
 * With `budget`, it stops once `rows.length` reaches the budget and returns `more: true` with the
 * `after` cursor, so a cron sweep resumes from there next run; a finished read returns
 * `more: false` and a null cursor. `opts.after` starts the read from a cursor a previous run
 * returned.
 */
export async function readAllPages<T, K>(
  label: string,
  page: (after: K | null, limit: number) => PromiseLike<PageResult<T>>,
  keyOf: (row: T) => K,
  opts: { budget?: number; after?: K | null } = {},
): Promise<AllPages<T, K>> {
  const { budget } = opts;
  if (budget !== undefined && !(Number.isInteger(budget) && budget > 0)) {
    throw new RangeError(
      `${label}: a budget is a positive whole number, not ${budget}`,
    );
  }
  const rows: T[] = [];
  let after: K | null = opts.after ?? null;
  for (;;) {
    // Under a budget the last page asks only for what is left, so a sweep never overshoots it.
    const limit =
      budget === undefined
        ? MAX_ROWS
        : Math.min(MAX_ROWS, budget - rows.length);
    const { data, error } = await page(after, limit);
    if (error) throw new QueryFailedError(label, error);
    const batch = data ?? [];
    if (batch.length > limit) {
      throw new Error(
        `${label}: a page returned ${batch.length} rows for a limit of ${limit}; build every page with .limit(limit)`,
      );
    }
    for (const row of batch) rows.push(row);
    if (batch.length < limit) return { rows, more: false, after: null };
    const next = keyOf(batch[batch.length - 1]);
    if (after !== null && sameKey(next, after)) {
      throw new Error(
        `${label}: the cursor did not advance; the page must apply \`after\``,
      );
    }
    after = next;
    if (budget !== undefined && rows.length >= budget)
      return { rows, more: true, after };
  }
}

/** Two cursors are one when they serialize alike: a string, a number, or a plain `{ at, id }`. */
function sameKey(a: unknown, b: unknown): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Run a read once per chunk of an id list and flatten the answers, in chunk order.
 *
 *     const rows = await inChunks("export/guest: media sizes", ids, (chunk) =>
 *       mustQuery(admin.from("media").select("id, file_size_bytes").in("id", chunk), "export/guest: media sizes"),
 *     );
 *
 * The ids are deduped first (postgrest-js dedupes an `.in()` list too, so a duplicate would only
 * cost a chunk), split at `IN_CHUNK`, and run up to four chunks at a time. An empty list makes no
 * request at all. `run` answers for its whole chunk: an `.in()` on a unique key returns at most one
 * row an id, and a child-table read by a chunk of parents (`.in("event_id", chunk)` over media)
 * pages INSIDE the chunk with `readAllPages`, because 150 events can hold far more than 1,000 rows.
 * A chunk that fails stops the rest from starting; a raw PostgREST error it throws becomes a
 * `QueryFailedError` with the label, and a real `Error` passes through untouched.
 */
export async function inChunks<I, R>(
  label: string,
  ids: readonly I[],
  run: (chunk: I[]) => Promise<R[]>,
  opts: { size?: number; concurrency?: number } = {},
): Promise<R[]> {
  const size = opts.size ?? IN_CHUNK;
  const concurrency = opts.concurrency ?? CHUNK_CONCURRENCY;
  if (!(Number.isInteger(size) && size > 0)) {
    throw new RangeError(
      `${label}: a chunk size is a positive whole number, not ${size}`,
    );
  }
  if (!(Number.isInteger(concurrency) && concurrency > 0)) {
    throw new RangeError(
      `${label}: a concurrency is a positive whole number, not ${concurrency}`,
    );
  }
  const unique = [...new Set(ids)];
  const chunks: I[][] = [];
  for (let i = 0; i < unique.length; i += size)
    chunks.push(unique.slice(i, i + size));

  const answers: R[][] = new Array(chunks.length);
  let next = 0;
  let failed = false;
  const lane = async () => {
    while (!failed && next < chunks.length) {
      const index = next++;
      try {
        answers[index] = await run(chunks[index]);
      } catch (error) {
        failed = true;
        throw isPostgrestError(error)
          ? new QueryFailedError(label, error)
          : error;
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, chunks.length) }, lane),
  );

  const rows: R[] = [];
  for (const answer of answers) for (const row of answer) rows.push(row);
  return rows;
}

/** The plain object a PostgREST builder resolves as `error`: a message and a code, not an `Error`. */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === "object" &&
    error !== null &&
    !(error instanceof Error) &&
    typeof (error as { message?: unknown }).message === "string" &&
    "code" in error
  );
}
