/**
 * THE BACKUP'S LONE COPIES, CARRIED ACROSS A PASS (durability-backups.md, "The deletion-aware prune"): every key the
 * backup alone holds (its row lives and still names it, its primary object is gone), as the last run over its part
 * of the listing judged it. One SQLite table in the prune's Durable Object (prune-state.ts), beside its ledger.
 *
 * WHY A TABLE, NOT A RUN'S COUNT: a pass that spans runs judges the backup a range at a time, so a run's own count
 * is its range's alone, and the card read each range in its turn (a lone copy one run found read zero the week the
 * next range came round). The table keeps each key until a run walks its range again: the run drops every key it
 * held in the range it settled and puts back what it found there, so the table is always the whole backup's lone
 * copies as last seen, whichever runs saw them. The restore (restore-run.ts) works from the same keys and drops each
 * one it resolves.
 *
 * WHY SQL: a range is one statement and a key one row, so there is no cap on what it carries and no record to
 * rewrite whole; each change is one transaction inside the object, and touches only the rows it judged, so a prune
 * run and a restore pass that overlap never overwrite each other's work.
 *
 * Written over the smallest surface the object's `ctx.storage.sql` offers (`exec` and `toArray`), so the tests drive
 * these same statements against Node's own SQLite. Every statement takes plain `?` bindings, a handful at most.
 */

/** A cursor as the object's SQL hands one back: read whole, at once (a cursor held across an await sees no snapshot). */
export type SqlCursorLike = { toArray(): Record<string, unknown>[] };

/** The part of `ctx.storage.sql` this store speaks. */
export interface SqlLike {
  exec(query: string, ...bindings: (string | number | null)[]): SqlCursorLike;
}

/** Runs a callback in one transaction (`ctx.storage.transactionSync`); a throw inside rolls the whole of it back. */
export type Transaction = <T>(fn: () => T) => T;

/**
 * What one prune run settled: every key after `after` (null: from the head) through `through` (null: to the end of
 * the listing), and the lone copies it found in that range.
 */
export type LoneWalk = {
  after: string | null;
  through: string | null;
  found: readonly string[];
};

/** The whole backup's lone copies as the table holds them: how many, and since when the oldest stands. */
export type LoneTally = { keys: number; oldestMs: number | null };

export type LoneStore = {
  /** A prune run's range, settled: keeps what it found there, drops what it did not. Returns the tally after. */
  walk(walk: LoneWalk, atMs: number): LoneTally;
  /** Drops keys the restore resolved (restored, back already, named by no row). Returns the tally after. */
  resolve(keys: readonly string[]): LoneTally;
  /** Up to `limit` keys after `after` (null: from the first), in key order. */
  page(after: string | null, limit: number): string[];
  /** How many keys it holds after `after` (null: all of them): what a pass that stopped early left. */
  countAfter(after: string | null): number;
  tally(): LoneTally;
};

export const LONE_TABLE = "lone_copies";

export function createLoneStore(
  sql: SqlLike,
  transaction: Transaction = (fn) => fn(),
): LoneStore {
  // `seen` marks the keys a walk found, so a range is settled in three statements however many keys it held.
  sql
    .exec(
      `CREATE TABLE IF NOT EXISTS ${LONE_TABLE} (
         key TEXT PRIMARY KEY,
         found_at INTEGER NOT NULL,
         seen INTEGER NOT NULL DEFAULT 0
       )`,
    )
    .toArray();

  const tally = (): LoneTally => {
    const row = sql
      .exec(`SELECT COUNT(*) AS n, MIN(found_at) AS oldest FROM ${LONE_TABLE}`)
      .toArray()[0];
    const n = Number(row?.n ?? 0);
    const oldest = row?.oldest;
    return {
      keys: Number.isFinite(n) ? n : 0,
      oldestMs: typeof oldest === "number" && n > 0 ? oldest : null,
    };
  };

  return {
    walk({ after, through, found }, atMs) {
      const inRange = (key: string) =>
        (after === null || key > after) && (through === null || key <= through);
      transaction(() => {
        sql
          .exec(
            `UPDATE ${LONE_TABLE} SET seen = 0
              WHERE (? IS NULL OR key > ?) AND (? IS NULL OR key <= ?)`,
            after,
            after,
            through,
            through,
          )
          .toArray();
        for (const key of found) {
          // A key outside the range the run settled is not the run's to say: it waits for its own range's walk.
          if (!inRange(key)) continue;
          // A key already held keeps the time it was first found, so the oldest lone copy says how long it has waited.
          sql
            .exec(
              `INSERT INTO ${LONE_TABLE} (key, found_at, seen) VALUES (?, ?, 1)
                 ON CONFLICT(key) DO UPDATE SET seen = 1`,
              key,
              atMs,
            )
            .toArray();
        }
        sql
          .exec(
            `DELETE FROM ${LONE_TABLE}
              WHERE seen = 0 AND (? IS NULL OR key > ?) AND (? IS NULL OR key <= ?)`,
            after,
            after,
            through,
            through,
          )
          .toArray();
      });
      return tally();
    },

    resolve(keys) {
      transaction(() => {
        for (const key of keys) {
          sql.exec(`DELETE FROM ${LONE_TABLE} WHERE key = ?`, key).toArray();
        }
      });
      return tally();
    },

    page(after, limit) {
      return sql
        .exec(
          `SELECT key FROM ${LONE_TABLE} WHERE (? IS NULL OR key > ?) ORDER BY key LIMIT ?`,
          after,
          after,
          Math.max(0, Math.floor(limit)),
        )
        .toArray()
        .map((row) => String(row.key));
    },

    countAfter(after) {
      const row = sql
        .exec(
          `SELECT COUNT(*) AS n FROM ${LONE_TABLE} WHERE (? IS NULL OR key > ?)`,
          after,
          after,
        )
        .toArray()[0];
      const n = Number(row?.n ?? 0);
      return Number.isFinite(n) ? n : 0;
    },

    tally,
  };
}
