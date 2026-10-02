/**
 * THE SOFT-DELETED EVENTS, BY INDEX (lane `crumbs-41`, 20261001233200), held LATEST-WINS across the migration set and
 * against the readers it serves. Its own file, because other lanes write migrations beside this one.
 *
 * What it pins:
 *   1. ★ `events_deleted_idx` stands as the file made it, keyed by id over exactly the soft-deleted events and carrying
 *      `purge_at` and `deleted_at` (so expired_events' discovery reads it alone, index-only at a million), and no
 *      later file drops it.
 *   2. ★ Each reader still asks for the soft-deleted events in the words the index's predicate matches: the expired
 *      sweep's page and count (`.not("deleted_at", "is", null)`, PostgREST's `NOT (deleted_at IS NULL)`, which the
 *      planner proves against `deleted_at IS NOT NULL`), ordered by id; and standby_hosts' deleted-event half (`from
 *      public.events d ... where d.deleted_at is not null`). A reader that spelled it otherwise would scan every event
 *      again with nothing to say so.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

const FILES = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

/** Strip `--` comments (a quoted example is not code) and collapse whitespace. */
function executable(sql: string): string {
  return sql.replace(/--[^\n]*/g, "").replace(/\s+/g, " ");
}

const SQL = FILES.map((file) => ({
  file,
  sql: executable(readFileSync(join(MIGRATIONS_DIR, file), "utf8")),
}));

/** The last statement that creates or drops `events_deleted_idx`, with its file. */
function lastWord(): { file: string; statement: string } | null {
  let found: { file: string; statement: string } | null = null;
  const statement =
    /(?:create index events_deleted_idx [^;]*|drop index (?:if exists )?public\.events_deleted_idx)/g;
  for (const { file, sql } of SQL) {
    for (const m of sql.matchAll(statement)) found = { file, statement: m[0] };
  }
  return found;
}

/** The winning body of `public.standby_hosts`. */
function standbyHosts(): string {
  let body: string | null = null;
  const opener = /create (?:or replace )?function public\.standby_hosts ?\(/g;
  for (const { sql } of SQL) {
    for (const match of sql.matchAll(opener)) {
      const rest = sql.slice(match.index!);
      const tag = rest.match(/ as (\$[a-z_]*\$)/)!;
      const start = tag.index! + tag[0].length;
      body = rest.slice(start, rest.indexOf(tag[1], start));
    }
  }
  if (!body) throw new Error("public.standby_hosts is never created");
  return body;
}

describe("the soft-deleted events' index (crumbs-41, 20261001233200)", () => {
  it("★ stands as made: keyed by id over the soft-deleted events, carrying purge_at and deleted_at", () => {
    expect(lastWord()).toEqual({
      file: "20261001233200_deleted_events_index.sql",
      statement:
        "create index events_deleted_idx on public.events (id) include (purge_at, deleted_at) where deleted_at is not null",
    });
  });

  it("★ the expired sweep asks for soft-deleted events in the words the index's predicate matches, by id", () => {
    const sweep = readFileSync(
      join(process.cwd(), "src/lib/lifecycle/sweeps/expired-events.ts"),
      "utf8",
    ).replace(/\s+/g, " ");
    // The page and the count, each its own read.
    expect(sweep.match(/\.not\("deleted_at", "is", null\)/g)).toHaveLength(2);
    expect(sweep).toContain('.order("id", { ascending: true })');
    // The filter the index carries both columns of, so the read never visits the table.
    expect(sweep).toContain(
      "return `purge_at.lte.${now.toISOString()},and(purge_at.is.null,deleted_at.lte.${legacyCutoff})`;",
    );
  });

  it("★ standby_hosts' deleted-event half finds its events by the same predicate", () => {
    expect(standbyHosts()).toContain(
      "from public.events d cross join lateral (",
    );
    expect(standbyHosts()).toContain("where d.deleted_at is not null");
  });
});
