/**
 * A PERSON'S OWN RECORD, ITS SQL FACTS (lane `crumbs-38`), resolved LATEST-WINS across the whole migration set the
 * way `migration-guards.test.ts` resolves its own (a later `create or replace` that drops one of these fails here).
 * Its own file, because another lane writes migrations beside this one.
 *
 * What they pin:
 *   1. My uploads and My likes page on a keyset (20261001203800): each winning definition takes its cursor under the
 *      names the app passes (PostgREST resolves an RPC by argument NAME), filters EVERY arm on the whole key, orders
 *      on the whole key (a total order: two rows can share a microsecond), and stays authenticated-only across the
 *      drop and create that changed its arguments. The paging POLICY itself (the clamp, a null limit reading
 *      everything) is row-cap-sql.test.ts's.
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

/** The winning definition of a public function: its parameter list and its body, from the last file that makes it. */
function latest(name: string): { file: string; params: string; body: string } {
  let found: { file: string; params: string; body: string } | null = null;
  const opener = new RegExp(
    `create (?:or replace )?function public\\.${name} ?\\(`,
    "g",
  );
  for (const { file, sql } of SQL) {
    for (const match of sql.matchAll(opener)) {
      const open = match.index! + match[0].length - 1;
      let depth = 0;
      let close = -1;
      for (let i = open; i < sql.length; i++) {
        if (sql[i] === "(") depth++;
        else if (sql[i] === ")" && --depth === 0) {
          close = i;
          break;
        }
      }
      const rest = sql.slice(close + 1);
      const tag = rest.match(/ as (\$[a-z_]*\$)/)!;
      const start = tag.index! + tag[0].length;
      const end = rest.indexOf(tag[1], start);
      found = {
        file,
        params: sql.slice(open + 1, close).trim(),
        body: rest.slice(start, end),
      };
    }
  }
  if (!found) throw new Error(`public.${name} is never created`);
  return found;
}

/** Every grant or revoke naming this exact signature, in file order. */
function grantsOn(signature: string): string[] {
  const escaped = signature.replace(/[()]/g, (c) => `\\${c}`);
  const statement = new RegExp(
    `(?:grant|revoke) [^;]* on function public\\.${escaped} [^;]*;`,
    "g",
  );
  return SQL.flatMap(({ sql }) =>
    [...sql.matchAll(statement)].map((m) => m[0]),
  );
}

describe("my uploads and my likes page on a keyset (crumbs-38, 20261001203800)", () => {
  it("get_my_uploads takes the cursor the app names, every arm filters on the whole key, and the order is total", () => {
    const def = latest("get_my_uploads");
    expect(def.file).toBe("20261001203800_my_feeds_cursor.sql");
    expect(def.params).toBe(
      "p_limit integer default null, p_before_created_at timestamptz default null, p_before_id uuid default null",
    );
    const keyset =
      "(p_before_created_at is null or (m.created_at, m.id) < (p_before_created_at, p_before_id))";
    // Both arms: the host's own uploads and her guest uploads. A keyset on one arm alone would repeat the other's
    // newest rows on every page.
    expect(def.body.split(keyset).length - 1).toBe(2);
    expect(def.body.split(" union all ").length - 1).toBe(1);
    expect(def.body).toContain("order by created_at desc, id desc");
  });

  it("get_my_likes keys on (liked_at, media_id), a total order of one person's likes", () => {
    const def = latest("get_my_likes");
    expect(def.file).toBe("20261001203800_my_feeds_cursor.sql");
    expect(def.params).toBe(
      "p_limit integer default null, p_before_liked_at timestamptz default null, p_before_id uuid default null",
    );
    expect(def.body).toContain(
      "(p_before_liked_at is null or (l.liked_at, l.media_id) < (p_before_liked_at, p_before_id))",
    );
    expect(def.body).toContain("order by l.liked_at desc, l.media_id desc");
    // The like access predicate is re-applied on every page, unchanged.
    expect(def.body).toContain("e.visibility = 'open'");
  });

  it("the one-argument functions are dropped, so no call can resolve to a page with no cursor beside them", () => {
    const sql = SQL.find(
      (f) => f.file === "20261001203800_my_feeds_cursor.sql",
    )!.sql;
    expect(sql).toContain("drop function public.get_my_uploads(integer);");
    expect(sql).toContain("drop function public.get_my_likes(integer);");
  });

  it("both stay authenticated-only after the drop and create (PUBLIC's default re-inherited, then revoked)", () => {
    for (const fn of ["get_my_uploads", "get_my_likes"]) {
      const statements = grantsOn(`${fn}(integer, timestamptz, uuid)`);
      expect(statements).toEqual([
        `revoke all on function public.${fn}(integer, timestamptz, uuid) from public, anon;`,
        `grant execute on function public.${fn}(integer, timestamptz, uuid) to authenticated;`,
      ]);
      expect(latest(fn).body).toContain("(select auth.uid())");
    }
  });
});
