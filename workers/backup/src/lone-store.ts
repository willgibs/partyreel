/**
 * THE BACKUP'S LONE COPIES, CARRIED ACROSS A PASS (durability-backups.md, "The deletion-aware prune"): every key the
 * backup alone holds (its row lives and still names it, its primary object is gone), as the last walk over its part
 * of the listing judged it. One SQLite table in the prune's Durable Object (prune-state.ts), beside its ledger.
 *
 * WHY A TABLE, NOT A RUN'S COUNT: a pass that spans runs judges the backup a range at a time, so a run's own count
 * is its range's alone, and the card read each range in its turn (a lone copy one run found read zero the week the
 * next range came round). The table keeps each key until a walk over its range judges it again: the walk drops every
 * key it held in the range it settled and puts back what it found there, so the table is always the whole backup's
 * lone copies as last seen, whichever runs saw them. The restore (restore-run.ts) works from the same keys and drops
 * each one it resolves.
 *
 * ★ TWO JUDGES, SPLIT BY AGE (backup-reconcile): the weekly prune judges the backup's keys past its 36-day gate and the
 * daily reconcile those younger (a primary object lost in its first five weeks used to wait for the gate to be seen).
 * A walk says which side of the gate it judged (`judged`), and settles only the rows on that side, by when the backup
 * took each key (`uploaded_ms`): the prune's weekly walk can never drop a young copy it does not judge, nor the
 * reconcile's daily walk an old one. A row that ages past the gate between walks is judged by neither until the
 * prune's walk reaches its range, so it is held, never dropped unseen. A row the prune found carries 0 (its key is
 * past the gate by construction), which sorts it on the old side for good.
 *
 * WHY SQL: a range is one statement and a key one row, so there is no cap on what it carries and no record to
 * rewrite whole; each change is one transaction inside the object, and touches only the rows it judged, so a prune
 * run, a reconcile run and a restore pass that overlap never overwrite each other's work.
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

/** A lone copy a walk found, with when the backup took it (the reconcile's; the prune's carry its key alone). */
export type LoneFound = { key: string; uploadedMs: number };

/**
 * What one walk settled: every key after `after` (null: from the head) through `through` (null: to the end of the
 * listing), and the lone copies it found in that range.
 */
export type LoneWalk = {
  after: string | null;
  through: string | null;
  found: readonly (string | LoneFound)[];
  /**
   * Which rows of the range the walk judged, by the backup copy's age against `cutMs` (the run's start less the 36-day
   * gate): `old` the rows taken at or before the cut (the prune's), `young` those taken after it (the reconcile's).
   * Absent: every row in the range, whatever its age.
   */
  judged?: { side: "old" | "young"; cutMs: number };
};

/** The whole backup's lone copies as the table holds them: how many, and since when the oldest stands. */
export type LoneTally = { keys: number; oldestMs: number | null };

export type LoneStore = {
  /** A walk's range, settled: keeps what it found there, drops what it did not. Returns the tally after. */
  walk(walk: LoneWalk, atMs: number): LoneTally;
  /** `walk`, also saying how many of the keys it kept were new to the table (a restore pass is then worth asking). */
  settle(walk: LoneWalk, atMs: number): LoneTally & { added: number };
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
         seen INTEGER NOT NULL DEFAULT 0,
         uploaded_ms INTEGER NOT NULL DEFAULT 0
       )`,
    )
    .toArray();
  // A table the first deploy of the restore created has no age column: given one, its rows are the prune's (old).
  try {
    sql
      .exec(
        `ALTER TABLE ${LONE_TABLE} ADD COLUMN uploaded_ms INTEGER NOT NULL DEFAULT 0`,
      )
      .toArray();
  } catch (err) {
    if (!/duplicate column/i.test(String(err))) throw err;
  }

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

  const settle = (
    { after, through, found, judged }: LoneWalk,
    atMs: number,
  ): LoneTally & { added: number } => {
    const inRange = (key: string) =>
      (after === null || key > after) && (through === null || key <= through);
    // The age clause is one of two fixed fragments, its cut a binding: the side of the gate this walk judged.
    const age = judged
      ? judged.side === "old"
        ? " AND uploaded_ms <= ?"
        : " AND uploaded_ms > ?"
      : "";
    const ageArgs = judged ? [judged.cutMs] : [];
    const onSide = (uploadedMs: number) =>
      !judged ||
      (judged.side === "old"
        ? uploadedMs <= judged.cutMs
        : uploadedMs > judged.cutMs);
    let added = 0;
    transaction(() => {
      sql
        .exec(
          `UPDATE ${LONE_TABLE} SET seen = 0
            WHERE (? IS NULL OR key > ?) AND (? IS NULL OR key <= ?)${age}`,
          after,
          after,
          through,
          through,
          ...ageArgs,
        )
        .toArray();
      for (const item of found) {
        const key = typeof item === "string" ? item : item.key;
        const uploadedMs = typeof item === "string" ? 0 : item.uploadedMs;
        // A key outside the range the walk settled, or on the other side of the gate, is not this walk's to say: its
        // own range's walk, or the other judge, decides it.
        if (!inRange(key) || !onSide(uploadedMs)) continue;
        const held =
          sql
            .exec(`SELECT 1 AS held FROM ${LONE_TABLE} WHERE key = ?`, key)
            .toArray().length > 0;
        if (!held) added += 1;
        // A key already held keeps the time it was first found, so the oldest lone copy says how long it has waited,
        // and the larger of its two upload times (the prune's carry none).
        sql
          .exec(
            `INSERT INTO ${LONE_TABLE} (key, found_at, seen, uploaded_ms) VALUES (?, ?, 1, ?)
               ON CONFLICT(key) DO UPDATE SET seen = 1, uploaded_ms = MAX(uploaded_ms, excluded.uploaded_ms)`,
            key,
            atMs,
            uploadedMs,
          )
          .toArray();
      }
      sql
        .exec(
          `DELETE FROM ${LONE_TABLE}
            WHERE seen = 0 AND (? IS NULL OR key > ?) AND (? IS NULL OR key <= ?)${age}`,
          after,
          after,
          through,
          through,
          ...ageArgs,
        )
        .toArray();
    });
    return { ...tally(), added };
  };

  return {
    walk(walk, atMs) {
      const { keys, oldestMs } = settle(walk, atMs);
      return { keys, oldestMs };
    },

    settle,

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
