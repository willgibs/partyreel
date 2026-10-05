/**
 * Node's own SQLite under the lone copies' table (lone-store.ts), for the tests: the same statements the prune's
 * Durable Object runs, against a real SQLite, so a test proves what a range settles on SQL and not on a stand-in.
 *
 * The specifier is one the compiler cannot resolve, on purpose: the Worker's types are Cloudflare's, never Node's,
 * and only the tests reach into Node itself.
 */
import {
  createLoneStore,
  type LoneStore,
  type SqlLike,
  type Transaction,
} from "../lone-store";

export type Db = {
  prepare(query: string): {
    all(...params: unknown[]): Record<string, unknown>[];
    run(...params: unknown[]): unknown;
  };
  exec(query: string): void;
};

const NODE_SQLITE = "node:sqlite";

export async function openDb(): Promise<Db> {
  const mod = (await import(/* @vite-ignore */ NODE_SQLITE)) as {
    DatabaseSync: new (path: string) => Db;
  };
  return new mod.DatabaseSync(":memory:");
}

/** `ctx.storage.sql` over a Node database; `failOn` makes matching statements throw, as a lost disk would. */
export function sqlOf(db: Db, failOn?: RegExp): SqlLike {
  return {
    exec(query, ...bindings) {
      if (failOn?.test(query)) throw new Error("the disk is gone");
      const stmt = db.prepare(query);
      const rows = /^\s*select/i.test(query)
        ? stmt.all(...bindings)
        : (stmt.run(...bindings), []);
      return { toArray: () => rows };
    },
  };
}

/** `ctx.storage.transactionSync` over a Node database. */
export function transactionOf(db: Db): Transaction {
  return (fn) => {
    db.exec("BEGIN");
    try {
      const out = fn();
      db.exec("COMMIT");
      return out;
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  };
}

/** A fresh table on a fresh in-memory database. */
export async function openLoneStore(): Promise<LoneStore> {
  const db = await openDb();
  return createLoneStore(sqlOf(db), transactionOf(db));
}
